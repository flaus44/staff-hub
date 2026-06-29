import React from 'react'

import { OnboardingProgressBar } from '@/components/onboarding/OnboardingProgressBar'
import { PortalBottomNav, PortalHeader, PortalSidebar } from '@/components/PortalNav'
import type { PortalFeatureMeta } from '@/lib/portal-section-meta'

interface PortalShellProps {
  title: string
  showHeaderTitle?: boolean
  userName?: string
  userEmail?: string
  userRole?: string
  headerAction?: React.ReactNode
  sectionFeatures?: PortalFeatureMeta[] | null
  onboardingProgress?: { completed: number; total: number }
  children: React.ReactNode
}

export function PortalShell({
  title,
  showHeaderTitle = true,
  userName,
  userEmail,
  userRole,
  headerAction,
  sectionFeatures: _sectionFeatures = null,
  onboardingProgress,
  children,
}: PortalShellProps) {
  const showMobileProgress = Boolean(onboardingProgress && onboardingProgress.total > 0)

  return (
    <div className="min-h-screen flex pb-16 md:pb-0 bg-[var(--cmd-bg)]">
      <PortalSidebar
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        onboardingProgress={onboardingProgress}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <PortalHeader
          title={title}
          showTitle={showHeaderTitle}
          userName={userName}
          headerAction={headerAction}
        />
        <main className="flex-1 px-4 md:px-8 py-6 bg-surface">
          <div className="max-w-6xl mx-auto">
            {showMobileProgress && onboardingProgress ? (
              <div className="mb-5 md:hidden">
                <OnboardingProgressBar
                  completed={onboardingProgress.completed}
                  total={onboardingProgress.total}
                />
              </div>
            ) : null}
            {children}
          </div>
        </main>
      </div>
      <PortalBottomNav userRole={userRole} />
    </div>
  )
}
