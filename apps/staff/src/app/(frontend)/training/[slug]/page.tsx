import { LearningModuleDetail } from '@/components/LearningModuleDetail'
import { MODULE_TYPE_TRAINING } from '@/lib/learning-modules'

export default async function TrainingModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <LearningModuleDetail
      slug={slug}
      moduleType={MODULE_TYPE_TRAINING}
      eyebrow="Training module"
      completeLabel="Mark as complete"
    />
  )
}
