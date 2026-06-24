import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'

/**
 * Interactive 3D card deck: glass dashboard/KPI cards stacked in depth. Click
 * the front card and it slides to the back while the next comes forward.
 * Pointer parallax tilts the whole stack. Keyboard accessible.
 */
type Card = {
  id: string
  metric: string
  label: string
  sub: string
  render: () => React.ReactNode
}

const accent = '#9db0ff'

function Decay() {
  return (
    <svg width="100%" height="64" viewBox="0 0 240 64" preserveAspectRatio="none">
      <defs>
        <linearGradient id="dk" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={accent} stopOpacity="0.4" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0,8 C50,10 70,46 120,52 C170,57 200,58 240,59 L240,64 L0,64 Z" fill="url(#dk)" />
      <path d="M0,8 C50,10 70,46 120,52 C170,57 200,58 240,59" fill="none" stroke={accent} strokeWidth="2.5" />
    </svg>
  )
}

function Bars({ vals }: { vals: number[] }) {
  return (
    <div className="flex h-16 items-end gap-1.5">
      {vals.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-t"
          style={{ height: `${v}%`, background: `linear-gradient(${accent}, rgba(157,176,255,0.18))` }}
        />
      ))}
    </div>
  )
}

function BeforeAfter() {
  return (
    <div className="flex h-16 items-end gap-4">
      <div className="flex flex-1 flex-col items-center gap-1.5">
        <div className="w-full rounded-t bg-white/25" style={{ height: 52 }} />
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-t3">before</span>
      </div>
      <div className="flex flex-1 flex-col items-center gap-1.5">
        <div className="w-full rounded-t" style={{ height: 26, background: accent }} />
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-accent-soft">after</span>
      </div>
    </div>
  )
}

const CARDS: Card[] = [
  { id: 'fraud', metric: '<1h', label: 'fraud response', sub: 'down from several hours', render: () => <Decay /> },
  { id: 'time', metric: '~50%', label: 'less analysis time', sub: 'whole-team dashboard', render: () => <BeforeAfter /> },
  { id: 'saved', metric: '~5h', label: 'saved per week', sub: 'daily checks automated', render: () => <Bars vals={[80, 55, 70, 40, 60, 35]} /> },
  { id: 'exp', metric: '1.5y', label: 'as a data analyst', sub: 'fraud, retail, email', render: () => <Bars vals={[40, 65, 50, 80, 60, 90, 70]} /> },
]

export function CardDeck() {
  const [order, setOrder] = useState(CARDS.map((c) => c.id))
  const reduce = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const cycle = () => setOrder((o) => [...o.slice(1), o[0]])

  const onMove = (e: React.PointerEvent) => {
    if (reduce) return
    const r = wrapRef.current!.getBoundingClientRect()
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2
    setTilt({ x: nx, y: ny })
  }

  return (
    <div
      ref={wrapRef}
      onPointerMove={onMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      className="relative mx-auto h-[380px] w-full max-w-[480px]"
      style={{ perspective: 1300 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: -16 + tilt.x * 6, rotateX: 6 - tilt.y * 6 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      >
        {CARDS.map((card) => {
          const i = order.indexOf(card.id)
          const isFront = i === 0
          return (
            <motion.button
              key={card.id}
              type="button"
              onClick={isFront ? cycle : undefined}
              aria-hidden={!isFront}
              tabIndex={isFront ? 0 : -1}
              className="absolute left-0 top-0 w-full overflow-hidden rounded-[24px] border border-white/12 p-8 text-left shadow-[0_40px_90px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              style={{
                background: 'linear-gradient(180deg, #1a2230 0%, #0e141d 100%)',
                transformStyle: 'preserve-3d',
                cursor: isFront ? 'pointer' : 'default',
                pointerEvents: isFront ? 'auto' : 'none',
              }}
              animate={{
                z: -i * 80,
                y: i * 26,
                x: i * 18,
                scale: 1 - i * 0.06,
                opacity: 1 - i * 0.12,
                filter: `blur(${i * 1.4}px)`,
                zIndex: CARDS.length - i,
              }}
              transition={{ type: 'spring', stiffness: 90, damping: 18, mass: 0.9 }}
            >
              <div className="flex items-start justify-between">
                <div className="font-display text-[3.4rem] font-semibold leading-none text-t1">{card.metric}</div>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-soft">{card.label}</span>
              </div>
              <p className="mt-1 text-sm text-t3">{card.sub}</p>
              <div className="mt-6">{card.render()}</div>
              {isFront && <span className="sr-only">Click to cycle through metrics.</span>}
            </motion.button>
          )
        })}
      </motion.div>
      <p className="absolute -bottom-7 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-t3">
        click to cycle
      </p>
    </div>
  )
}
