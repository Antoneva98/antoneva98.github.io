import { useEffect, useRef } from 'react'
import { useScroll, useReducedMotion } from 'motion/react'

/**
 * Tool logos rendered as fine dot clouds, placed at random non-overlapping
 * spots with varied sizes and depth. Depth drives dot size, brightness and a
 * pointer-parallax shift for a real 3D feel; a soft bloom pass adds glow.
 * Dots scatter as the hero scrolls away. Icons from Simple Icons (CORS).
 */
const TOOLS = [
  { label: 'Python', slug: 'python' },
  { label: 'PostgreSQL', slug: 'postgresql' },
  { label: 'Pandas', slug: 'pandas' },
  { label: 'NumPy', slug: 'numpy' },
  { label: 'Plotly', slug: 'plotly' },
  { label: 'n8n', slug: 'n8n' },
  { label: 'Looker', slug: 'looker' },
  { label: 'Jupyter', slug: 'jupyter' },
]

type Icon = {
  bx: number
  by: number
  z: number
  scale: number
  amp: number
  ph: number
  start: number
  count: number
}
type Pt = { icon: number; dx: number; dy: number; sx: number; sy: number; r: number }

export function OrbitStackDots() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const scatterRef = useRef(0)
  const mouseRef = useRef({ x: 0, y: 0 })
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
    const ACCENT = '157, 176, 255'

    let W = 0
    let H = 0
    let pts: Pt[] = []
    let icons: Icon[] = []
    let order: number[] = []
    let raf = 0
    let visible = true
    let disposed = false

    const loadIcon = (slug: string) =>
      new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = () => resolve(null)
        img.src = `https://cdn.simpleicons.org/${slug}/ffffff`
      })

    const sampleIcon = (img: HTMLImageElement) => {
      const s = 100
      const off = document.createElement('canvas')
      off.width = s
      off.height = s
      const octx = off.getContext('2d')
      if (!octx) return []
      try {
        octx.drawImage(img, 0, 0, s, s)
        const data = octx.getImageData(0, 0, s, s).data
        const out: { ox: number; oy: number }[] = []
        for (let y = 0; y < s; y += 2)
          for (let x = 0; x < s; x += 2)
            if (data[(y * s + x) * 4 + 3] > 90) out.push({ ox: x / s, oy: y / s })
        return out
      } catch {
        return []
      }
    }

    async function build() {
      W = wrap!.clientWidth
      H = wrap!.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = W * dpr
      canvas!.height = H * dpr
      canvas!.style.width = W + 'px'
      canvas!.style.height = H + 'px'
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      const cx = W / 2
      const cy = H / 2
      const baseSize = Math.min(W, H) * 0.15

      pts = []
      icons = []

      // random non-overlapping placement with varied sizes & depth
      const placed: Icon[] = []
      for (let i = 0; i < TOOLS.length; i++) {
        const z = 0.4 + Math.random() * 0.6
        const scale = 0.65 + Math.random() * 0.8
        const size = baseSize * scale
        const pad = size * 0.6
        let bx = 0
        let by = 0
        let ok = false
        for (let tries = 0; tries < 80 && !ok; tries++) {
          bx = pad + Math.random() * (W - pad * 2)
          by = pad + Math.random() * (H - pad * 2)
          ok = placed.every((p) => {
            const min = (size + baseSize * p.scale) * 0.52
            return (bx - p.bx) ** 2 + (by - p.by) ** 2 > min * min
          })
        }
        placed.push({
          bx,
          by,
          z,
          scale,
          amp: baseSize * 0.06,
          ph: Math.random() * Math.PI * 2,
          start: 0,
          count: 0,
        })
      }
      icons = placed

      for (let i = 0; i < TOOLS.length; i++) {
        const ic = icons[i]
        const img = await loadIcon(TOOLS[i].slug)
        let samples = img ? sampleIcon(img) : []
        if (samples.length < 16) {
          samples = []
          for (let gx = 0; gx <= 12; gx++)
            for (let gy = 0; gy <= 12; gy++) samples.push({ ox: gx / 12, oy: gy / 12 })
        }
        if (disposed) return
        const size = baseSize * ic.scale
        ic.start = pts.length
        for (const sm of samples) {
          const sAng = Math.random() * Math.PI * 2
          const sDist = Math.min(W, H) * (0.5 + Math.random() * 0.7)
          pts.push({
            icon: i,
            dx: (sm.ox - 0.5) * size,
            dy: (sm.oy - 0.5) * size,
            sx: cx + Math.cos(sAng) * sDist,
            sy: cy + Math.sin(sAng) * sDist,
            r: 0.6 + Math.random() * 0.35,
          })
        }
        ic.count = pts.length - ic.start
      }
      // draw far icons first
      order = icons.map((_, i) => i).sort((a, b) => icons[a].z - icons[b].z)
    }

    function draw(t: number) {
      const s = scatterRef.current
      const assemble = 1 - s
      const m = mouseRef.current
      ctx!.clearRect(0, 0, W, H)

      for (const i of order) {
        const ic = icons[i]
        const depthScale = 0.55 + ic.z * 0.85
        const par = ic.z * ic.z * Math.min(W, H) * 0.06
        const cxp = ic.bx + Math.cos(t * 0.5 + ic.ph) * ic.amp * assemble + m.x * par
        const cyp = ic.by + Math.sin(t * 0.45 + ic.ph) * ic.amp * assemble + m.y * par
        const baseAlpha = (0.32 + ic.z * 0.6) * (0.55 + assemble * 0.45)

        // bloom pass
        ctx!.globalAlpha = baseAlpha * 0.25
        ctx!.fillStyle = `rgba(${ACCENT},1)`
        for (let k = ic.start; k < ic.start + ic.count; k++) {
          const p = pts[k]
          const tx = cxp + p.dx * depthScale
          const ty = cyp + p.dy * depthScale
          const x = tx + (p.sx - tx) * s
          const y = ty + (p.sy - ty) * s
          ctx!.beginPath()
          ctx!.arc(x, y, p.r * depthScale * 2.4, 0, Math.PI * 2)
          ctx!.fill()
        }
        // crisp pass
        ctx!.globalAlpha = baseAlpha
        for (let k = ic.start; k < ic.start + ic.count; k++) {
          const p = pts[k]
          const tx = cxp + p.dx * depthScale
          const ty = cyp + p.dy * depthScale
          const x = tx + (p.sx - tx) * s
          const y = ty + (p.sy - ty) * s
          ctx!.beginPath()
          ctx!.arc(x, y, p.r * depthScale, 0, Math.PI * 2)
          ctx!.fill()
        }
      }
      ctx!.globalAlpha = 1
    }

    build().then(() => {
      if (disposed) return
      if (reduce) {
        draw(0)
        return
      }
      const loop = (now: number) => {
        if (visible) draw(now / 1000)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    })

    const onMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect()
      mouseRef.current = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      }
    }
    const onLeave = () => (mouseRef.current = { x: 0, y: 0 })
    window.addEventListener('pointermove', onMove)
    wrap.addEventListener('pointerleave', onLeave)

    const io = new IntersectionObserver((e) => (visible = e[0].isIntersecting), { threshold: 0 })
    io.observe(wrap)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      wrap.removeEventListener('pointerleave', onLeave)
    }
  }, [reduce])

  return (
    <div ref={wrapRef} className="relative mx-auto aspect-square w-full max-w-[540px]">
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  )
}
