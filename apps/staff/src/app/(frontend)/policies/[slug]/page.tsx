import { LearningModuleDetail } from '@/components/LearningModuleDetail'
import { MODULE_TYPE_POLICY } from '@/lib/learning-modules'

export default async function PolicyModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <LearningModuleDetail
      slug={slug}
      moduleType={MODULE_TYPE_POLICY}
      eyebrow="Policy & procedure"
      completeLabel="I have read and acknowledge"
    />
  )
}
