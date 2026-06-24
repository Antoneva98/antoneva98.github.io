import { useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useReducedMotion } from 'motion/react'

/**
 * 3D sphere of data points (Three.js). Rotates continuously, leans toward the
 * pointer, and scatters outward + fades as its panel moves away from centre
 * (works under the horizontal transform track). Static under reduced motion.
 */
const COUNT = 1600

function makeSprite() {
  const s = 64
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.25, 'rgba(200,210,255,0.9)')
  grad.addColorStop(1, 'rgba(157,176,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, s, s)
  return new THREE.CanvasTexture(c)
}

function Points({ wrapRef, reduce }: { wrapRef: RefObject<HTMLDivElement | null>; reduce: boolean }) {
  const ref = useRef<THREE.Points>(null)
  const matRef = useRef<THREE.PointsMaterial>(null)
  const { pointer } = useThree()
  const sprite = useMemo(() => makeSprite(), [])

  const { base, scattered, colors } = useMemo(() => {
    const base = new Float32Array(COUNT * 3)
    const scattered = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)
    const R = 2.25
    const accent = new THREE.Color('#9db0ff')
    const white = new THREE.Color('#dfe6ff')
    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (i / (COUNT - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const phi = i * 2.399963
      const rad = R * (0.82 + Math.random() * 0.18)
      base[i * 3] = Math.cos(phi) * r * rad
      base[i * 3 + 1] = y * rad
      base[i * 3 + 2] = Math.sin(phi) * r * rad
      const sa = Math.random() * Math.PI * 2
      const sb = Math.acos(2 * Math.random() - 1)
      const sr = 5 + Math.random() * 5
      scattered[i * 3] = Math.sin(sb) * Math.cos(sa) * sr
      scattered[i * 3 + 1] = Math.sin(sb) * Math.sin(sa) * sr
      scattered[i * 3 + 2] = Math.cos(sb) * sr
      const col = Math.random() > 0.78 ? white : accent
      colors[i * 3] = col.r
      colors[i * 3 + 1] = col.g
      colors[i * 3 + 2] = col.b
    }
    return { base, scattered, colors }
  }, [])

  const positions = useMemo(() => base.slice(), [base])

  useFrame((_, delta) => {
    const pts = ref.current
    if (!pts) return
    let s = 0
    if (!reduce && wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect()
      const vw = window.innerWidth
      const center = rect.left + rect.width / 2
      const off = Math.abs(center - vw / 2) / vw
      s = Math.max(0, Math.min(1, off * 1.5 - 0.1))
    }
    const arr = pts.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < COUNT * 3; i++) arr[i] = base[i] + (scattered[i] - base[i]) * s
    pts.geometry.attributes.position.needsUpdate = true
    if (matRef.current) matRef.current.opacity = 0.95 * (1 - s * 0.85)
    if (!reduce) {
      pts.rotation.y += delta * 0.14
      pts.rotation.x += (pointer.y * 0.3 - pts.rotation.x) * 0.04
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        map={sprite}
        size={0.09}
        sizeAttenuation
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.95}
      />
    </points>
  )
}

export function DataSphere() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion() ?? false
  return (
    <div ref={wrapRef} className="relative h-[44vh] max-h-[480px] min-h-[320px] w-full">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 2]}>
        <Points wrapRef={wrapRef} reduce={reduce} />
      </Canvas>
    </div>
  )
}
