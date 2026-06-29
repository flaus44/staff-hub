'use client'

import { SetStepNav } from '@payloadcms/ui'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo } from 'react'

import { isCommandGroup, SECTION_META } from './admin-command-meta'

function AdminStepNavInner() {
  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()

  const nav = useMemo(() => {
    if (pathname === '/admin' || pathname === '/admin/') {
      return [{ label: 'Command' }] as const
    }

    const groupParam = searchParams.get('group')
    if (pathname.startsWith('/admin/command') && isCommandGroup(groupParam)) {
      return [
        { label: 'Command', url: '/admin' },
        { label: SECTION_META[groupParam].title },
      ] as const
    }

    return null
  }, [pathname, searchParams])

  useEffect(() => {
    if (!nav) return undefined
    document.documentElement.classList.add('cmd-admin--custom-step')
    return () => document.documentElement.classList.remove('cmd-admin--custom-step')
  }, [nav])

  if (!nav) return null
  return <SetStepNav nav={[...nav]} />
}

export default function AdminStepNav() {
  return (
    <Suspense fallback={null}>
      <AdminStepNavInner />
    </Suspense>
  )
}
