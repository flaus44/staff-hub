import { LearningModuleList } from '@/components/LearningModuleList'
import { MODULE_TYPE_TRAINING } from '@/lib/learning-modules'

export default function TrainingPage() {
  return (
    <LearningModuleList
      moduleType={MODULE_TYPE_TRAINING}
      shellTitle="Training"
      emptyTitle="No training modules"
      emptyDescription="Training content will appear here when your organisation publishes modules."
      detailSegment="training"
    />
  )
}
