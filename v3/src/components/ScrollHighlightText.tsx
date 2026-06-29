import { motion, useReducedMotion } from 'motion/react'
import { useInViewX } from './useInViewX'

/** Big statement where words light up from dim to full, staggered, on enter. */
type Token = { text: string; accent?: boolean }

// Resting colour is a mid grey that still clears WCAG 3:1 for large text on the
// OLED base, so the dim state is accessible; words animate to white / accent.
const DIM = '#6a6a70'
const FULL = '#ffffff'
const ACCENT = '#b2d5e5'

export function ScrollHighlightText({ tokens }: { tokens: Token[] }) {
  const reduce = useReducedMotion()
  const [ref, seen] = useInViewX(0.3)
  return (
    <p
      ref={ref as never}
      className="font-display text-[clamp(2rem,4.4vw,3.6rem)] font-medium leading-[1.18] tracking-tight"
    >
      {tokens.map((t, i) => {
        const lit = t.accent ? ACCENT : FULL
        return (
          <motion.span
            key={i}
            initial={reduce ? false : { color: DIM }}
            animate={{ color: reduce ? lit : seen ? lit : DIM }}
            transition={{ duration: 0.6, delay: seen ? i * 0.07 : 0, ease: [0.32, 0.72, 0, 1] }}
          >
            {t.text}{' '}
          </motion.span>
        )
      })}
    </p>
  )
}
