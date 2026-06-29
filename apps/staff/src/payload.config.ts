import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { AuditLog } from './collections/AuditLog'
import { ContractSigningDrafts } from './collections/ContractSigningDrafts'
import { ContractSignatures, Contracts } from './collections/Contracts'
import { Incidents } from './collections/Incidents'
import { InviteTokens } from './collections/InviteTokens'
import { Media } from './collections/Media'
import {
  OnboardingAssignments,
  OnboardingDocuments,
  OnboardingEvents,
  OnboardingOverrides,
  OnboardingPacks,
  OnboardingTasks,
} from './collections/Onboarding'
import { StaffUsers } from './collections/StaffUsers'
import { SurveyAssignments, SurveyResponses, SurveyTemplates } from './collections/Surveys'
import { SessionContactDetails } from './collections/SessionContactDetails'
import { SurveyResponseDrafts } from './collections/SurveyResponseDrafts'
import { ShiftNotes, TimeEntries, TimeEntryCorrections } from './collections/Timesheets'
import { TrainingCompletions, TrainingModules } from './collections/Training'
import { healthCheck } from './endpoints/health'
import { portalNavMetrics } from './endpoints/portalMetrics'
import { acceptInvite, createInvite } from './endpoints/invite'
import { joinOnboardingPack } from './endpoints/join'
import { mfaDisable, mfaSetup, mfaVerify, mfaVerifyRecovery, mfaVerifySetup } from './endpoints/staffMfa'
import { clockIn, clockOut, approveTimeEntry } from './endpoints/timesheets'
import {
  timeApprovalsBulkApprove,
  timeApprovalsExport,
  timeApprovalsQueue,
} from './endpoints/timeApprovals'
import { exportSurveyCsv } from './endpoints/surveyExport'
import { saveSurveyDraft, submitSurveyCapture } from './endpoints/surveysPortal'
import { completeTrainingModule } from './endpoints/trainingPortal'
import { signContract, downloadSignedContract, previewContract, syncContractProfile, confirmContractDetails } from './endpoints/contracts'
import { contractDiditSession, contractDiditStatus } from './endpoints/contractDidit'
import {
  onboardingClaimReview,
  onboardingTaskUpdate,
  onboardingPayrollPacket,
  onboardingReviewDecision,
  onboardingReviewQueue,
  onboardingSubmitForReview,
} from './endpoints/onboarding'
import { onboardingDocumentsDownload, onboardingStatementPdf } from './endpoints/onboardingDocuments'
import { onboardingFormsPreview } from './endpoints/onboardingFormsPreview'
import {
  onboardingSuperComplianceDelete,
  onboardingSuperComplianceUpload,
} from './endpoints/onboardingSuperCompliance'
import { OrgSettings } from './globals/OrgSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const isProduction = process.env.NODE_ENV === 'production'

export default buildConfig({
  admin: {
    user: StaffUsers.slug,
    meta: {
      title: 'FLAUS Staff Hub',
      description: 'Administrative console for FLAUS staff operations',
    },
    theme: 'dark',
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      actions: ['/components/admin/AdminStepNav', '/components/admin/AdminPortalExitButton'],
      beforeNavLinks: ['/components/admin/AdminCommandNav'],
      graphics: {
        Icon: '/components/admin/AdminIcon',
        Logo: '/components/admin/AdminLogo',
      },
      views: {
        commandSection: {
          Component: '/components/admin/AdminCommandSection',
          path: '/command',
        },
        timeApprovals: {
          Component: '/components/admin/TimeApprovalsView',
          path: '/time-approvals',
        },
      },
    },
    dashboard: {
      defaultLayout: () => [{ widgetSlug: 'staff-hub-command', width: 'full' }],
      widgets: [
        {
          slug: 'staff-hub-command',
          Component: '/components/admin/AdminCommandHome',
          minWidth: 'full',
          maxWidth: 'full',
        },
      ],
    },
  },
  collections: [
    StaffUsers,
    Media,
    AuditLog,
    InviteTokens,
    OnboardingPacks,
    OnboardingAssignments,
    OnboardingTasks,
    OnboardingDocuments,
    OnboardingEvents,
    OnboardingOverrides,
    TimeEntries,
    ShiftNotes,
    TimeEntryCorrections,
    SurveyTemplates,
    SurveyAssignments,
    SurveyResponses,
    SurveyResponseDrafts,
    SessionContactDetails,
    Contracts,
    ContractSigningDrafts,
    ContractSignatures,
    TrainingModules,
    TrainingCompletions,
    Incidents,
  ],
  globals: [OrgSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    push: !isProduction && process.env.PAYLOAD_PUSH !== 'false',
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  cors: [
    process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
    'https://www.flaus.com.au',
    'https://flaus.com.au',
  ].filter(Boolean),
  endpoints: [
    healthCheck,
    createInvite,
    acceptInvite,
    joinOnboardingPack,
    mfaSetup,
    mfaVerifySetup,
    mfaVerify,
    mfaVerifyRecovery,
    mfaDisable,
    clockIn,
    clockOut,
    approveTimeEntry,
    timeApprovalsQueue,
    timeApprovalsBulkApprove,
    timeApprovalsExport,
    exportSurveyCsv,
    saveSurveyDraft,
    submitSurveyCapture,
    completeTrainingModule,
    signContract,
    confirmContractDetails,
    previewContract,
    syncContractProfile,
    downloadSignedContract,
    contractDiditSession,
    contractDiditStatus,
    onboardingReviewQueue,
    onboardingClaimReview,
    onboardingReviewDecision,
    onboardingPayrollPacket,
    onboardingTaskUpdate,
    onboardingSubmitForReview,
    onboardingFormsPreview,
    onboardingSuperComplianceUpload,
    onboardingSuperComplianceDelete,
    onboardingDocumentsDownload,
    onboardingStatementPdf,
    portalNavMetrics,
  ],
  onInit: async (payload) => {
    const {
      ensureSessionCaptureTemplates,
      ensureCoDesignTrainingModules,
      ensureUniversalTrainingModules,
      ensureContactDataViewer,
      ensureLearningModules,
      ensureAdminUser,
      seed,
    } = await import('./seed')
    await ensureSessionCaptureTemplates(payload)
    await ensureCoDesignTrainingModules(payload)
    await ensureUniversalTrainingModules(payload)
    await ensureLearningModules(payload)
    await ensureContactDataViewer(payload)
    if (process.env.RESET_ADMIN === 'true') {
      await ensureAdminUser(payload)
    }
    if (process.env.PAYLOAD_SEED === 'true') {
      await seed(payload)
    }
  },
})
