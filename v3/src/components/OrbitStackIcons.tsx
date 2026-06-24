import { useEffect, useRef } from 'react'
import { useScroll, useReducedMotion } from 'motion/react'

/**
 * Icon variant of the orbiting tool stack: real tool logos in glass chips
 * slowly orbit a centre and scatter outward as the hero scrolls away.
 * Logos from Simple Icons CDN, with a text fallback on load error.
 */
const TOOLS = [
  { label: 'Python', slug: 'python' },
  { label: 'Pandas', slug: 'pandas' },
  { label: 'NumPy', slug: 'numpy' },
  { label: 'PostgreSQL', slug: 'postgresql' },
  { label: 'Tableau', slug: 'tableau' },
  { label: 'Plotly', slug: 'plotly' },
  { label: 'n8n', slug: 'n8n' },
  { label: 'Looker', slug: 'looker' },
]

export function OrbitStackIcons() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<(HTMLDivElement | null)[]>([])
  const reduce = useReducedMotion()
  const scatterRef = useRef(0)
  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ['start start', 'end start'],
  })

  useEffect(() => {
    const unsub = scrollYProgress.on('change', (v) => {
      scatterRef.current = Math.max(0, Math.min(1, v))
    })
    return () => unsub()
  }, [scrollYProgress])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    let raf = 0
    let visible = true

    const params = TOOLS.map((_, i) => ({
      baseR: 0.5 * (0.46 + (i % 3) * 0.26),
      ang: (i / TOOLS.length) * Math.PI * 2,
      speed: 0.07 + (i % 3) * 0.02,
    }))

    const place = (t: number) => {
      const size = wrap.clientWidth
      const cx = size / 2
      const cy = size / 2
      const s = scatterRef.current
      const spread = 1 + s * 1.9
      const alpha = 1 - s * 0.95
      itemsRef.current.forEach((el, i) => {
        if (!el) return
        const p = params[i]
        const a = p.ang + t * p.speed
        const rr = p.baseR * size * spread
        const x = cx + Math.cos(a) * rr
        const y = cy + Math.sin(a) * rr * 0.82
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`
        el.style.opacity = String(alpha)
      })
    }

    if (reduce) {
      place(0)
    } else {
      const loop = (now: number) => {
        if (visible) place(now / 1000)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    const io = new IntersectionObserver((e) => (visible = e[0].isIntersecting), { threshold: 0 })
    io.observe(wrap)
    const onResize = () => reduce && place(0)
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [reduce])

  return (
    <div ref={wrapRef} className="relative mx-auto aspect-square w-full max-w-[420px]">
      {/* faint centre marker */}
      <div className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/60" />
      {TOOLS.map((tool, i) => (
        <div
          key={tool.label}
          ref={(el) => {
            itemsRef.current[i] = el
          }}
          className="absolute left-0 top-0 flex size-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-sm"
          title={tool.label}
        >
          <img
            src={`https://cdn.simpleicons.org/${tool.slug}/ffffff`}
            alt={tool.label}
            className="size-6 opacity-90"
            onError={(e) => {
              const el = e.currentTarget
              el.style.display = 'none'
              const span = document.createElement('span')
              span.textContent = tool.label.slice(0, 2)
              span.className = 'font-mono text-[11px] text-t2'
              el.parentElement?.appendChild(span)
            }}
          />
        </div>
      ))}
    </div>
  )
}
