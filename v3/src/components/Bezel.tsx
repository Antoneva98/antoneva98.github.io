import type { ReactNode } from 'react'

/**
 * Double-bezel (Doppelrand) enclosure: an outer shell holding an inner core,
 * with concentric radii and an inner highlight, so a card reads as physical
 * hardware rather than a flat div.
 */
export function Bezel({
  children,
  className = '',
  coreClassName = '',
}: {
  children: ReactNode
  className?: string
  coreClassName?: string
}) {
  return (
    <div
      className={`rounded-shell border border-white/8 bg-white/[0.035] p-2 shadow-[0_30px_80px_rgba(0,0,0,0.55)] ${className}`}
    >
      <div
        className={`rounded-core bg-gradient-to-b from-white/[0.06] to-white/[0.015] shadow-[inset_0_1px_1px_rgba(255,255,255,0.14)] ${coreClassName}`}
      >
        {children}
      </div>
    </div>
  )
}
