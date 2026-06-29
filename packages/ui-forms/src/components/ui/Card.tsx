import React from 'react'

import { PortalCard } from './PortalCard'

interface CardProps {
  title?: string
  children: React.ReactNode
  className?: string
}

/** @deprecated Use PortalCard instead. Card is an alias with sm padding. */
export const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <PortalCard title={title} padding="sm" className={className}>
      {children}
    </PortalCard>
  )
}
