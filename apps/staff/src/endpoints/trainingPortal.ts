import type { Endpoint, PayloadHandler } from 'payload'
import { z } from 'zod'

import { authenticated } from '@/access/roles'
import { actorIdFromUser, requestMeta, writeAuditLog } from '@/lib/audit'
import { sha256Hex } from '@/lib/esign'
import { extractQuizQuestionsFromModule } from '@/lib/learning-modules'
import { relIdNumber } from '@/lib/payload-relations'
import {
  parseContentBlocksFromUnknown,
  type TrainingQuizDefinition,
} from '@/lib/training-content-types'

const completeSchema = z.object({
  moduleId: z.union([z.string(), z.number()]),
  responses: z
    .array(
      z.object({
        questionId: z.string(),
        answerId: z.string(),
      }),
    )
    .optional(),
  attestationAccepted: z.boolean().optional(),
  dwellMs: z.number().int().nonnegative().optional(),
})

function gradeQuiz(
  quiz: TrainingQuizDefinition,
  responses: { questionId: string; answerId: string }[],
): { score: number; passed: boolean; graded: { questionId: string; answerId: string; correct: boolean }[] } {
  const questions = quiz.questions ?? []
  if (questions.length === 0) {
    return { score: 100, passed: true, graded: [] }
  }

  const graded = questions.map((q) => {
    const answer = responses.find((r) => r.questionId === q.id)
    const option = q.options.find((o) => o.id === answer?.answerId)
    return {
      questionId: q.id,
      answerId: answer?.answerId ?? '',
      correct: Boolean(option?.correct),
    }
  })

  const correctCount = graded.filter((g) => g.correct).length
  const score = Math.round((correctCount / questions.length) * 100)
  const passScore = quiz.passScore ?? 100
  return { score, passed: score >= passScore, graded }
}

export const completeTrainingModule: Endpoint = {
  path: '/portal/training/complete',
  method: 'post',
  handler: (async (req) => {
    if (!authenticated({ req })) {
      return Response.json({ error: 'unauthorised' }, { status: 401 })
    }

    const body = req.json ? await req.json().catch(() => null) : null
    const parsed = completeSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'invalid_body' }, { status: 400 })
    }

    if (!parsed.data.attestationAccepted) {
      return Response.json({ error: 'attestation_required' }, { status: 400 })
    }

    const userRelId = relIdNumber(req.user!.id)
    if (!userRelId) {
      return Response.json({ error: 'unauthorised' }, { status: 401 })
    }

    const mod = await req.payload.findByID({
      collection: 'training-modules',
      id: parsed.data.moduleId,
      depth: 0,
      overrideAccess: true,
      req,
    })

    if (!mod) {
      return Response.json({ error: 'module_not_found' }, { status: 404 })
    }

    const existing = await req.payload.find({
      collection: 'training-completions',
      where: {
        and: [{ user: { equals: userRelId } }, { module: { equals: String(mod.id) } }],
      },
      limit: 1,
      overrideAccess: true,
      req,
    })

    const currentVersion = mod.version ?? 1
    const prior = existing.docs[0]
    if (prior && (prior.moduleVersion ?? 1) >= currentVersion) {
      return Response.json({ ok: true, alreadyComplete: true })
    }

    const blocks = parseContentBlocksFromUnknown(mod.contentBlocks)
    const combinedQuiz: TrainingQuizDefinition = {
      passScore: (mod.quizDefinition as TrainingQuizDefinition | null)?.passScore ?? 100,
      questions: extractQuizQuestionsFromModule({
        quizDefinition: mod.quizDefinition as TrainingQuizDefinition | null,
        contentBlocks: blocks,
      }),
    }

    const responses = parsed.data.responses ?? []
    const { score, graded } = gradeQuiz(combinedQuiz, responses)

    const gatedQuestions = (mod.quizDefinition as TrainingQuizDefinition | null)?.questions ?? []
    if (mod.requiresScenarioGate && gatedQuestions.length > 0) {
      const gatedIds = new Set(gatedQuestions.map((q) => q.id))
      const gatedGraded = graded.filter((g) => gatedIds.has(g.questionId))
      const gatedCorrect = gatedGraded.filter((g) => g.correct).length
      const gatedScore =
        gatedGraded.length > 0 ? Math.round((gatedCorrect / gatedGraded.length) * 100) : 100
      const passScore = (mod.quizDefinition as TrainingQuizDefinition | null)?.passScore ?? 100
      if (gatedScore < passScore) {
        return Response.json({ error: 'quiz_failed', score: gatedScore, graded }, { status: 400 })
      }
    }

    const meta = requestMeta(req)
    const contentHash = sha256Hex(
      `${mod.content}\n${JSON.stringify(blocks)}\n${JSON.stringify(combinedQuiz)}`,
    )

    const completionData = {
      user: userRelId,
      module: mod.id,
      completedAt: new Date().toISOString(),
      moduleVersion: currentVersion,
      contentHash,
      quizScore: score,
      attemptCount: prior ? (prior.attemptCount ?? 1) + 1 : 1,
      responses: {
        attestationAccepted: true,
        questions: graded,
        ...(parsed.data.dwellMs != null ? { dwellMs: parsed.data.dwellMs } : {}),
      },
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    }

    const completion = prior
      ? await req.payload.update({
          collection: 'training-completions',
          id: prior.id,
          data: completionData,
          overrideAccess: true,
          req,
        })
      : await req.payload.create({
          collection: 'training-completions',
          data: completionData,
          overrideAccess: true,
          req,
        })

    await writeAuditLog(req.payload, {
      actorId: actorIdFromUser(req.user as Parameters<typeof actorIdFromUser>[0]),
      action: 'training.complete',
      resourceType: 'training-completions',
      resourceId: completion.id,
      ip: meta.ip,
      userAgent: meta.userAgent,
      metadata: { moduleSlug: mod.slug, score, recert: Boolean(prior) },
    })

    return Response.json({ ok: true, score, completionId: completion.id })
  }) as PayloadHandler,
}
