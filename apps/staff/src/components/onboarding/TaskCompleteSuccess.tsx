'use client'



import Link from 'next/link'



import { Button } from '@flaus/ui-forms/Button'



export function TaskCompleteSuccess({

  title,

  message,

  documentLinks,

  pendingDocumentsNotice,

  documentsHref = '/onboarding/documents',

  nextStepHref = '/onboarding/setup#onboarding-checklist',

}: {

  title: string

  message: string

  documentLinks?: Array<{ id: string; label: string }>

  pendingDocumentsNotice?: string

  documentsHref?: string

  nextStepHref?: string

}) {

  return (

    <section className="space-y-4 rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface)] p-4">

      <div>

        <h2 className="text-lg font-semibold text-[var(--cmd-text)]">{title}</h2>

        <p className="mt-1 text-sm text-[var(--cmd-text-muted)]">{message}</p>

      </div>

      {pendingDocumentsNotice ? (

        <div className="rounded-lg border border-[var(--cmd-border)] bg-[var(--cmd-surface-raised)] p-3">

          <p className="text-sm text-[var(--cmd-text-muted)]">{pendingDocumentsNotice}</p>

        </div>

      ) : null}

      {!pendingDocumentsNotice && documentLinks && documentLinks.length > 0 ? (

        <div className="space-y-2">

          <p className="text-sm font-medium text-[var(--cmd-text)]">Download your official forms</p>

          <div className="flex flex-wrap gap-2">

            {documentLinks.map((document) => (

              <a

                key={document.id}

                href={`/api/portal/onboarding/documents/download?documentId=${encodeURIComponent(document.id)}&disposition=attachment`}

                className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[var(--cmd-border)] px-3 py-2 text-sm text-[var(--cmd-text)] no-underline hover:bg-[var(--cmd-surface-raised)]"

              >

                Download {document.label}

              </a>

            ))}

          </div>

        </div>

      ) : null}

      <div className="flex flex-wrap gap-2">

        <Link href={nextStepHref} className="no-underline">

          <Button>Continue to next step</Button>

        </Link>

      </div>

    </section>

  )

}


