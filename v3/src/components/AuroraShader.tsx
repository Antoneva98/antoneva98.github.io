import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useReducedMotion } from 'motion/react'
import * as THREE from 'three'

/**
 * Atmospheric WebGL aurora: slow fbm-noise plumes in the brand blue drifting
 * over the OLED base. Pattern borrowed from animated-gradient/shader backgrounds
 * (21st.dev) but written from scratch for our palette. GPU-only, very low
 * amplitude so text stays readable, paused under reduced motion.
 */
const FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uRes;
  varying vec2 vUv;

  // hash + value noise + fbm
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.02; a *= 0.5; }
    return v;
  }

  void main(){
    vec2 uv = vUv;
    float asp = uRes.x / uRes.y;
    vec2 p = vec2(uv.x * asp, uv.y);

    float t = uTime * 0.045;
    float n = fbm(p * 2.4 + vec2(t, t * 0.6));
    n += 0.5 * fbm(p * 4.1 - vec2(t * 0.8, t));

    // soft plume mask, stronger toward the upper-right
    float plume = smoothstep(0.35, 1.15, n + (uv.x * 0.35 + uv.y * 0.45));

    vec3 base   = vec3(0.008, 0.008, 0.008);   // #020202 onyx
    vec3 accent = vec3(0.698, 0.835, 0.898);   // #B2D5E5 candy blue
    vec3 soft   = vec3(0.796, 0.894, 0.937);   // #CBE4EF

    vec3 col = base;
    col = mix(col, accent, plume * 0.16);
    col = mix(col, soft, pow(plume, 3.0) * 0.10);

    gl_FragColor = vec4(col, 1.0);
  }
`

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }
`

function Plane({ animate }: { animate: boolean }) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const { size } = useThree()
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } }),
    [],
  )
  useFrame((state) => {
    if (!mat.current) return
    if (animate) mat.current.uniforms.uTime.value = state.clock.elapsedTime
    mat.current.uniforms.uRes.value.set(size.width, size.height)
  })
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={mat} fragmentShader={FRAG} vertexShader={VERT} uniforms={uniforms} />
    </mesh>
  )
}

export function AuroraShader() {
  const reduce = useReducedMotion()
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <Canvas
        gl={{ antialias: false, alpha: false }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 1] }}
        frameloop={reduce ? 'demand' : 'always'}
      >
        <Plane animate={!reduce} />
      </Canvas>
      {/* fade the shader into the page so panel content reads cleanly */}
      <div className="absolute inset-0 bg-gradient-to-r from-base via-base/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-base via-transparent to-base/60" />
    </div>
  )
}
