import { useEffect, useRef } from 'react'
import { useScroll, useMotionValueEvent, useReducedMotion } from 'motion/react'

/**
 * "Noise to signal" — two densely filled particle clouds. BEFORE (white) vs
 * AFTER (accent, ~half). Assembly is driven by scroll position: scrolling down
 * assembles the clusters, scrolling back up scatters them. Canvas + rAF-free
 * (draws on scroll change), cleaned up on unmount, static under reduced motion.
 */
type P = { x: number; y: number; tx: number; ty: number; r: number; after: boolean }

export function NoiseSignal() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ['start 0.9', 'center 0.5'],
  })

  // drawing state kept in refs so the scroll handler can reach it
  const stateRef = useRef<{
    ctx: CanvasRenderingContext2D | null
    W: number
    H: number
    particles: P[]
    draw: (a: number) => void
  }>({ ctx: null, W: 0, H: 0, particles: [], draw: () => {} })

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const ACCENT = '#9db0ff'

    function build() {
      const W = wrap!.clientWidth
      const H = wrap!.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = W * dpr
      canvas!.height = H * dpr
      canvas!.style.width = W + 'px'
      canvas!.style.height = H + 'px'
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      const particles: P[] = []
      // Fill each cluster rect uniformly via a jittered grid (fully filled look)
      const makeCluster = (cx: number, halfW: number, halfH: number, cols: number, rows: number, after: boolean) => {
        for (let ix = 0; ix < cols; ix++) {
          for (let iy = 0; iy < rows; iy++) {
            const gx = cx - halfW + ((ix + 0.5) / cols) * halfW * 2
            const gy = H / 2 - halfH + ((iy + 0.5) / rows) * halfH * 2
            particles.push({
              tx: gx + (Math.random() - 0.5) * (halfW * 2) / cols * 1.4,
              ty: gy + (Math.random() - 0.5) * (halfH * 2) / rows * 1.4,
              x: Math.random() * W,
              y: Math.random() * H,
              r: Math.random() * 1.4 + 1.1,
              after,
            })
          }
        }
      }
      // BEFORE — left, dense
      makeCluster(W * 0.27, W * 0.17, H * 0.34, 46, 30, false)
      // AFTER — right, ~half density
      makeCluster(W * 0.72, W * 0.13, H * 0.26, 34, 22, true)

      const draw = (assemble: number) => {
        ctx!.clearRect(0, 0, W, H)
        for (const p of particles) {
          if (p.after) continue
          const x = p.x + (p.tx - p.x) * assemble
          const y = p.y + (p.ty - p.y) * assemble
          ctx!.beginPath()
          ctx!.fillStyle = 'rgba(255,255,255,0.85)'
          ctx!.arc(x, y, p.r, 0, Math.PI * 2)
          ctx!.fill()
        }
        ctx!.shadowColor = ACCENT
        ctx!.shadowBlur = 7
        for (const p of particles) {
          if (!p.after) continue
          const x = p.x + (p.tx - p.x) * assemble
          const y = p.y + (p.ty - p.y) * assemble
          ctx!.beginPath()
          ctx!.fillStyle = ACCENT
          ctx!.arc(x, y, p.r, 0, Math.PI * 2)
          ctx!.fill()
        }
        ctx!.shadowBlur = 0
      }

      stateRef.current = { ctx, W, H, particles, draw }
    }

    build()
    // initial state: scattered (or assembled under reduced motion)
    stateRef.current.draw(reduce ? 1 : scrollYProgress.get())

    const onResize = () => {
      build()
      stateRef.current.draw(reduce ? 1 : scrollYProgress.get())
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [reduce, scrollYProgress])

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (reduce) return
    stateRef.current.draw(Math.max(0, Math.min(1, v)))
  })

  return (
    <div ref={wrapRef} className="relative h-[320px] w-full sm:h-[380px]">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute left-[27%] top-4 -translate-x-1/2 font-mono text-[11px] tracking-[0.14em] text-t3">
          100%
        </span>
        <span className="absolute left-[72%] top-8 -translate-x-1/2 font-mono text-[11px] tracking-[0.14em] text-accent-soft">
          ~50%
        </span>
        <span className="absolute bottom-3 left-[27%] -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.2em] text-t3">
          Before
        </span>
        <span className="absolute bottom-3 left-[72%] -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.2em] text-t3">
          After
        </span>
        <div className="absolute inset-x-0 bottom-9 h-px bg-white/8" />
      </div>
    </div>
  )
}
