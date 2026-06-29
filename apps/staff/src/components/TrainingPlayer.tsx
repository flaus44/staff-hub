'use client'

import { TrainingMarkdown } from '@/components/TrainingMarkdown'
import { TrainingResourceBlock } from '@/components/TrainingResourceBlock'
import { TrainingScormBlock } from '@/components/TrainingScormBlock'
import { TrainingVideoBlock } from '@/components/TrainingVideoBlock'
import { Checkbox } from '@flaus/ui-forms/Checkbox'
import type { TrainingContentBlock } from '@/lib/training-content-types'

type TrainingPlayerProps = {
  block: TrainingContentBlock
  stepIndex: number
  answers: Record<string, string>
  checkedItems: Record<string, Set<string>>
  blockAttestations: Record<string, boolean>
  onAnswer: (questionId: string, answerId: string) => void
  onToggleChecklistItem: (blockId: string, itemId: string) => void
  onBlockAttestation: (blockId: string, checked: boolean) => void
}

export function TrainingPlayer({
  block,
  stepIndex,
  answers,
  checkedItems,
  blockAttestations,
  onAnswer,
  onToggleChecklistItem,
  onBlockAttestation,
}: TrainingPlayerProps) {
  const title = block.title ?? `Step ${stepIndex + 1}`

  function renderBody() {
    if (block.type === 'video' && block.videoUrl) {
      return (
        <div className="space-y-4">
          {block.body ? <TrainingMarkdown text={block.body} /> : null}
          <TrainingVideoBlock
            videoUrl={block.videoUrl}
            transcript={block.transcript ?? ''}
            title={block.title}
          />
        </div>
      )
    }

    if (block.type === 'scorm' && block.scormLaunchUrl) {
      return (
        <div className="space-y-4">
          {block.body ? <TrainingMarkdown text={block.body} /> : null}
          <TrainingScormBlock
            launchUrl={block.scormLaunchUrl}
            title={block.title}
            attribution={block.attribution}
          />
        </div>
      )
    }

    if (block.type === 'resource' && block.resourceUrl && block.resourceTitle) {
      return (
        <div className="space-y-4">
          {block.body ? <TrainingMarkdown text={block.body} /> : null}
          <TrainingResourceBlock
            resourceUrl={block.resourceUrl}
            resourceTitle={block.resourceTitle}
            resourceKind={block.resourceKind}
            downloadable={block.downloadable}
            attribution={block.attribution}
          />
        </div>
      )
    }

    if (block.type === 'checklist' && block.checklist) {
      return (
        <div className="space-y-4">
          {block.body ? <TrainingMarkdown text={block.body} /> : null}
          <ul className="space-y-2">
            {block.checklist.map((item) => (
              <li key={item.id}>
                <Checkbox
                  id={`${block.id}-${item.id}`}
                  label={item.label}
                  checked={checkedItems[block.id]?.has(item.id) ?? false}
                  onChange={() => onToggleChecklistItem(block.id, item.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      )
    }

    if (block.type === 'quiz' && block.quiz) {
      return (
        <div className="space-y-4">
          {block.body ? <TrainingMarkdown text={block.body} /> : null}
          <fieldset>
            <legend className="mb-3 text-base font-medium text-[var(--cmd-text)]">{block.quiz.prompt}</legend>
            <div className="space-y-2">
              {block.quiz.options.map((opt) => (
                <label
                  key={opt.id}
                  className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border border-[var(--cmd-border)] p-3 hover:bg-[var(--cmd-surface-raised)]"
                >
                  <input
                    type="radio"
                    name={block.quiz!.id}
                    value={opt.id}
                    checked={answers[block.quiz!.id] === opt.id}
                    onChange={() => onAnswer(block.quiz!.id, opt.id)}
                    className="mt-1"
                  />
                  <span className="text-sm text-[var(--cmd-text)]">{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )
    }

    if (block.type === 'attestation') {
      return (
        <Checkbox
          id={`attest-${block.id}`}
          label={
            block.attestationLabel ??
            'I understand this and will follow it in my work for Financial Literacy Australia.'
          }
          checked={blockAttestations[block.id] ?? false}
          onChange={(e) => onBlockAttestation(block.id, e.target.checked)}
        />
      )
    }

    if (block.body) {
      return <TrainingMarkdown text={block.body} />
    }

    return null
  }

  return (
    <section
      className="rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface)] p-5"
      aria-labelledby={`training-step-${block.id}`}
    >
      <h2 id={`training-step-${block.id}`} className="text-lg font-semibold text-[var(--cmd-text)]">
        {title}
      </h2>
      <div className="mt-4">{renderBody()}</div>
    </section>
  )
}
