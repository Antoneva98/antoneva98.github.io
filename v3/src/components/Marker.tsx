import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { useInViewX } from './useInViewX'

/** Keyword whose accent marker-band draws in when it scrolls into view. */
export function Marker({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  const [ref, seen] = useInViewX(0.4)
  return (
    <span ref={ref as never} className="relative inline-block whitespace-nowrap text-t1">
      <motion.span
        aria-hidden
        className="absolute inset-x-[-0.12em] bottom-[0.04em] -z-10 h-[0.62em] rounded-[3px] bg-accent/30"
        style={{ originX: 0 }}
        initial={reduce ? false : { scaleX: 0 }}
        animate={reduce ? { scaleX: 1 } : { scaleX: seen ? 1 : 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      />
      {children}
    </span>
  )
}
