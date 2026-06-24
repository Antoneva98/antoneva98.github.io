import { useEffect, useRef } from 'react'
import { useScroll, useReducedMotion } from 'motion/react'

/**
 * The tool stack as orbiting data points. Labelled tool nodes plus an ambient
 * dot cloud slowly rotate around a centre; as the hero scrolls away the whole
 * system scatters outward and fades. Static under reduced motion.
 */
const TOOLS = ['SQL', 'Python', 'Tableau', 'Pandas', 'Looker', 'n8n', 'A/B', 'Athena']

type Node = { label: string; baseR: number; ang: number; speed: number; size: number }
type Dot = { baseR: number; ang: number; speed: number; size: number }

export function OrbitStack() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
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
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const ACCENT = '#9db0ff'

    let W = 0
    let H = 0
    let R = 0
    let nodes: Node[] = []
    let dots: Dot[] = []
    let raf = 0
    let visible = true
    let last = 0

    function build() {
      W = wrap!.clientWidth
      H = wrap!.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = W * dpr
      canvas!.height = H * dpr
      canvas!.style.width = W + 'px'
      canvas!.style.height = H + 'px'
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      R = Math.min(W, H) * 0.42

      nodes = TOOLS.map((label, i) => ({
        label,
        baseR: R * (0.42 + (i % 3) * 0.27),
        ang: (i / TOOLS.length) * Math.PI * 2,
        speed: 0.08 + (i % 3) * 0.02,
        size: i % 3 === 0 ? 4 : 3,
      }))
      dots = Array.from({ length: 150 }, () => ({
        baseR: R * (0.2 + Math.random() * 0.95),
        ang: Math.random() * Math.PI * 2,
        speed: 0.03 + Math.random() * 0.09,
        size: Math.random() * 1.4 + 0.5,
      }))
    }

    function draw(t: number) {
      const cx = W / 2
      const cy = H / 2
      const s = scatterRef.current
      const spread = 1 + s * 1.9
      const alpha = 1 - s * 0.92
      ctx!.clearRect(0, 0, W, H)

      // ambient dots
      for (const d of dots) {
        const a = d.ang + t * d.speed
        const rr = d.baseR * spread
        const x = cx + Math.cos(a) * rr
        const y = cy + Math.sin(a) * rr * 0.82
        ctx!.globalAlpha = alpha * 0.5
        ctx!.fillStyle = 'rgba(255,255,255,0.7)'
        ctx!.beginPath()
        ctx!.arc(x, y, d.size, 0, Math.PI * 2)
        ctx!.fill()
      }

      // tool nodes
      ctx!.shadowColor = ACCENT
      for (const n of nodes) {
        const a = n.ang + t * n.speed
        const rr = n.baseR * spread
        const x = cx + Math.cos(a) * rr
        const y = cy + Math.sin(a) * rr * 0.82
        ctx!.globalAlpha = alpha
        ctx!.shadowBlur = 10
        ctx!.fillStyle = ACCENT
        ctx!.beginPath()
        ctx!.arc(x, y, n.size, 0, Math.PI * 2)
        ctx!.fill()
        ctx!.shadowBlur = 0
        ctx!.globalAlpha = alpha * 0.85
        ctx!.fillStyle = 'rgba(255,255,255,0.85)'
        ctx!.font = "500 12px 'Geist Mono Variable', ui-monospace, monospace"
        ctx!.fillText(n.label, x + n.size + 6, y + 4)
      }
      ctx!.globalAlpha = 1
    }

    build()

    if (reduce) {
      draw(0)
    } else {
      const loop = (now: number) => {
        if (!last) last = now
        last = now
        if (visible) draw(now / 1000)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    const io = new IntersectionObserver((e) => (visible = e[0].isIntersecting), {
      threshold: 0,
    })
    io.observe(wrap)

    const onResize = () => {
      build()
      if (reduce) draw(0)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [reduce])

  return (
    <div ref={wrapRef} className="relative mx-auto aspect-square w-full max-w-[420px]">
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  )
}
