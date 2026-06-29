import { LearningModuleList } from '@/components/LearningModuleList'
import { MODULE_TYPE_POLICY } from '@/lib/learning-modules'

export default function PoliciesPage() {
  return (
    <LearningModuleList
      moduleType={MODULE_TYPE_POLICY}
      shellTitle="Policies & procedures"
      emptyTitle="No policies published"
      emptyDescription="Organisation policies and procedures will appear here for you to read and acknowledge."
      detailSegment="policies"
    />
  )
}
