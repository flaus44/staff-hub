'use client'

import { useState } from 'react'

import type { TrainingContentBlock } from '@/lib/training-content-types'
import { estimateStepMinutes } from '@/lib/training-content-types'

type TrainingStepSidebarProps = {
  steps: TrainingContentBlock[]
  stepIndex: number
  onStepSelect: (index: number) => void
}

function stepLabel(block: TrainingContentBlock, index: number): string {
  return block.title?.trim() || `Step ${index + 1}`
}

function StepButton({
  block,
  index,
  stepIndex,
  onStepSelect,
  compact = false,
}: {
  block: TrainingContentBlock
  index: number
  stepIndex: number
  onStepSelect: (index: number) => void
  compact?: boolean
}) {
  const done = index < stepIndex
  const active = index === stepIndex
  const locked = index > stepIndex
  const label = stepLabel(block, index)
  const minutes = estimateStepMinutes(block)

  return (
    <button
      type="button"
      disabled={locked}
      onClick={() => {
        if (!locked) onStepSelect(index)
      }}
      className={
        compact
          ? `flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-medium ${
              active
                ? 'bg-[var(--cmd-accent)] text-white'
                : done
                  ? 'border border-[var(--cmd-live)] bg-[rgba(48,209,88,0.1)] text-[var(--cmd-text)]'
                  : 'border border-[var(--cmd-border)] text-[var(--cmd-text-muted)]'
            } ${locked ? 'opacity-50' : ''}`
          : `flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              active
                ? 'bg-[rgba(62,106,225,0.12)] font-semibold text-[var(--cmd-accent)]'
                : done
                  ? 'text-[var(--cmd-text)] hover:bg-[var(--cmd-surface-raised)]'
                  : locked
                    ? 'cursor-not-allowed text-[var(--cmd-text-muted)] opacity-60'
                    : 'text-[var(--cmd-text-muted)] hover:bg-[var(--cmd-surface-raised)]'
            }`
      }
      aria-current={active ? 'step' : undefined}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
          compact
            ? active
              ? 'bg-white/20 text-white'
              : 'border border-current'
            : done
              ? 'bg-[rgba(48,209,88,0.15)] text-[var(--cmd-live)]'
              : active
                ? 'bg-[var(--cmd-accent)] text-white'
                : 'border border-[var(--cmd-border)] text-[var(--cmd-text-muted)]'
        }`}
        aria-hidden
      >
        {done ? '✓' : index + 1}
      </span>
      <span className="min-w-0 truncate">{label}</span>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
          active && !compact
            ? 'bg-[rgba(62,106,225,0.15)] text-[var(--cmd-accent)]'
            : 'bg-[var(--cmd-surface)] text-[var(--cmd-text-muted)]'
        }`}
      >
        ~{minutes} min
      </span>
    </button>
  )
}

export function TrainingStepSidebar({ steps, stepIndex, onStepSelect }: TrainingStepSidebarProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const nextIndex = stepIndex + 1 < steps.length ? stepIndex + 1 : null

  return (
    <>
      <nav className="hidden shrink-0 lg:block lg:w-56 xl:w-64" aria-label="Module steps">
        <ol aria-label="Module steps" className="space-y-1">
          {steps.map((block, i) => (
            <li key={block.id}>
              <StepButton block={block} index={i} stepIndex={stepIndex} onStepSelect={onStepSelect} />
            </li>
          ))}
        </ol>
      </nav>

      <nav className="lg:hidden" aria-label="Module steps">
        <ol aria-label="Module steps" className="flex gap-2 overflow-x-auto pb-1">
          <li className="list-none">
            <StepButton
              block={steps[stepIndex]}
              index={stepIndex}
              stepIndex={stepIndex}
              onStepSelect={onStepSelect}
              compact
            />
          </li>
          {nextIndex !== null ? (
            <li className="list-none">
              <StepButton
                block={steps[nextIndex]}
                index={nextIndex}
                stepIndex={stepIndex}
                onStepSelect={onStepSelect}
                compact
              />
            </li>
          ) : null}
          {steps.length > 2 ? (
            <li className="list-none">
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="flex min-h-[44px] shrink-0 items-center rounded-full border border-[var(--cmd-border)] px-3 py-2 text-xs font-medium text-[var(--cmd-accent)]"
                aria-haspopup="dialog"
                aria-expanded={sheetOpen}
              >
                All steps ({steps.length})
              </button>
            </li>
          ) : null}
        </ol>

        {sheetOpen ? (
          <div
            className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="All module steps"
            onClick={() => setSheetOpen(false)}
          >
            <div
              className="max-h-[70vh] w-full max-w-md overflow-y-auto rounded-xl border border-[var(--cmd-border)] bg-[var(--cmd-surface)] p-4 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--cmd-text)]">Module steps</h3>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="min-h-[44px] min-w-[44px] rounded-lg text-sm font-medium text-[var(--cmd-accent)]"
                >
                  Close
                </button>
              </div>
              <ol aria-label="Module steps" className="space-y-1">
                {steps.map((block, i) => (
                  <li key={block.id}>
                    <StepButton
                      block={block}
                      index={i}
                      stepIndex={stepIndex}
                      onStepSelect={(idx) => {
                        onStepSelect(idx)
                        setSheetOpen(false)
                      }}
                    />
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}
      </nav>
    </>
  )
}
