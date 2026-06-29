import React from 'react'
import Link from 'next/link'

function renderTextWithLinks(text: string, keyPrefix: string): React.ReactNode[] {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let partIndex = 0

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        ...renderBold(text.slice(lastIndex, match.index), `${keyPrefix}-pre-${partIndex}`),
      )
    }
    const [, label, href] = match
    const isInternal = href.startsWith('/')
    nodes.push(
      isInternal ? (
        <Link
          key={`${keyPrefix}-link-${partIndex}`}
          href={href}
          className="font-medium text-[var(--cmd-accent)] underline"
        >
          {label}
        </Link>
      ) : (
        <a
          key={`${keyPrefix}-link-${partIndex}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[var(--cmd-accent)] underline"
        >
          {label}
        </a>
      ),
    )
    lastIndex = match.index + match[0].length
    partIndex++
  }

  if (lastIndex < text.length) {
    nodes.push(...renderBold(text.slice(lastIndex), `${keyPrefix}-tail`))
  }

  return nodes.length > 0 ? nodes : renderBold(text, keyPrefix)
}

function renderBold(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-[var(--cmd-text)]">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part ? <React.Fragment key={`${keyPrefix}-t-${i}`}>{part}</React.Fragment> : null
  })
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  return renderTextWithLinks(text, keyPrefix)
}

function isBulletLine(line: string): boolean {
  return /^[-•*]\s+/.test(line.trim())
}

function isNumberedLine(line: string): boolean {
  return /^\d+\.\s+/.test(line.trim())
}

function stripBulletPrefix(line: string): string {
  return line.trim().replace(/^[-•*]\s+/, '')
}

function stripNumberedPrefix(line: string): string {
  return line.trim().replace(/^\d+\.\s+/, '')
}

type TrainingMarkdownProps = {
  text: string
  className?: string
}

export function TrainingMarkdown({ text, className = '' }: TrainingMarkdownProps) {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0
  let blockKey = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') {
      i++
      continue
    }

    if (isBulletLine(line)) {
      const items: string[] = []
      while (i < lines.length && isBulletLine(lines[i])) {
        items.push(stripBulletPrefix(lines[i]))
        i++
      }
      nodes.push(
        <ul key={`ul-${blockKey++}`} className="list-disc space-y-2 pl-5 text-base leading-relaxed text-[var(--cmd-text)]">
          {items.map((item, j) => (
            <li key={j}>{renderInline(item, `ul-${blockKey}-${j}`)}</li>
          ))}
        </ul>,
      )
      continue
    }

    if (isNumberedLine(line)) {
      const items: string[] = []
      while (i < lines.length && isNumberedLine(lines[i])) {
        items.push(stripNumberedPrefix(lines[i]))
        i++
      }
      nodes.push(
        <ol key={`ol-${blockKey++}`} className="list-decimal space-y-2 pl-5 text-base leading-relaxed text-[var(--cmd-text)]">
          {items.map((item, j) => (
            <li key={j}>{renderInline(item, `ol-${blockKey}-${j}`)}</li>
          ))}
        </ol>,
      )
      continue
    }

    const paragraphLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !isBulletLine(lines[i]) &&
      !isNumberedLine(lines[i])
    ) {
      paragraphLines.push(lines[i])
      i++
    }
    nodes.push(
      <p key={`p-${blockKey++}`} className="text-base leading-relaxed text-[var(--cmd-text)]">
        {renderInline(paragraphLines.join(' '), `p-${blockKey}`)}
      </p>,
    )
  }

  return <div className={`space-y-4 ${className}`.trim()}>{nodes}</div>
}
