import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { useInViewX } from './useInViewX'

type RevealProps = {
  children: ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'section' | 'li' | 'article'
}

/** Fade + rise when scrolled into view (works under horizontal transform). */
export function Reveal({ children, delay = 0, className, as = 'div' }: RevealProps) {
  const reduce = useReducedMotion()
  const [ref, seen] = useInViewX(0.15)
  const MotionTag = motion[as]
  return (
    <MotionTag
      ref={ref as never}
      className={className}
      initial={reduce ? false : { opacity: 0, y: 40 }}
      animate={reduce ? { opacity: 1 } : seen ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionTag>
  )
}
