import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { ArrowUpRight, EnvelopeSimple, GithubLogo, LinkedinLogo, List, Lock, TelegramLogo, X } from '@phosphor-icons/react'
import { Reveal } from './components/Reveal'
import { useInViewX } from './components/useInViewX'
import { Bezel } from './components/Bezel'
import { CardDeck } from './components/CardDeck'
import { Marker } from './components/Marker'
import { ScrollHighlightText } from './components/ScrollHighlightText'
import { PROFILE, SKILLS, PROJECTS, RECOMMENDATIONS, type Project } from './data'

// Three.js is the heaviest dependency; load the WebGL pieces in a separate chunk
// so the page text renders immediately and the 3D visuals stream in after.
const DataSphere = lazy(() => import('./components/DataSphere').then((m) => ({ default: m.DataSphere })))
const AuroraShader = lazy(() => import('./components/AuroraShader').then((m) => ({ default: m.AuroraShader })))

const NAV = [
  { label: 'About', id: 'about' },
  { label: 'Skills', id: 'skills' },
  { label: 'Projects', id: 'projects' },
]

/* ---------- hooks ---------- */

function useMediaQuery(q: string) {
  const [match, setMatch] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setMatch(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [q])
  return match
}

/** Maps native vertical scroll onto a smooth horizontal translate of the track. */
function useHorizontal(enabled: boolean) {
  const trackRef = useRef<HTMLDivElement>(null)
  const spacerRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    const spacer = spacerRef.current
    if (!track || !spacer) return
    if (!enabled) {
      track.style.transform = ''
      spacer.style.height = ''
      return
    }
    let raf = 0
    let cur = 0
    let max = 0
    const size = () => {
      max = Math.max(0, track.scrollWidth - window.innerWidth)
      spacer.style.height = `${window.innerHeight + max}px`
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(track)
    window.addEventListener('resize', size)
    const loop = () => {
      const target = Math.min(max, Math.max(0, window.scrollY))
      cur += (target - cur) * 0.14
      if (Math.abs(target - cur) < 0.06) cur = target
      track.style.transform = `translate3d(${-Math.round(cur * 100) / 100}px,0,0)`
      if (barRef.current) barRef.current.style.transform = `scaleX(${max ? cur / max : 0})`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', size)
      track.style.transform = ''
      spacer.style.height = ''
    }
  }, [enabled])

  return { trackRef, spacerRef, barRef }
}

function useHorizontalNav(enabled: boolean) {
  const [active, setActive] = useState('top')
  const ids = ['top', 'about', 'skills', 'projects', 'contact']
  useEffect(() => {
    if (!enabled) {
      const els = ids.map((i) => document.getElementById(i)).filter((e): e is HTMLElement => !!e)
      const io = new IntersectionObserver(
        (entries) => {
          const v = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)
          if (v[0]) setActive(v[0].target.id)
        },
        { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.5, 1] },
      )
      els.forEach((e) => io.observe(e))
      return () => io.disconnect()
    }
    let raf = 0
    let last = ''
    const loop = () => {
      const y = window.scrollY + window.innerWidth * 0.4
      let cur = 'top'
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.offsetLeft <= y) cur = id
      }
      if (cur !== last) {
        last = cur
        setActive(cur)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  const goTo = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    if (enabled) window.scrollTo({ top: el.offsetLeft, behavior: 'smooth' })
    else el.scrollIntoView({ behavior: 'smooth' })
  }
  return { active, goTo }
}

/* ---------- primitives ---------- */

function Eyebrow({ children }: { children: string }) {
  return (
    <span className="inline-block rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-t2">
      {children}
    </span>
  )
}

function PrimaryButton({ onClick, href, children }: { onClick?: () => void; href?: string; children: string }) {
  const cls =
    'group inline-flex cursor-pointer items-center gap-3.5 rounded-full bg-white py-2 pl-6 pr-2 text-[15px] font-medium text-base transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent'
  const inner = (
    <>
      {children}
      <span className="flex size-8 items-center justify-center rounded-full bg-black/10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
        <ArrowUpRight weight="bold" size={15} />
      </span>
    </>
  )
  return href ? (
    <a href={href} onClick={onClick} className={cls}>
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  )
}

function GhostButton({
  onClick,
  href,
  children,
  icon,
  download,
}: {
  onClick?: () => void
  href?: string
  children: string
  icon?: ReactNode
  download?: boolean
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      download={download}
      target={download ? undefined : href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noreferrer' : undefined}
      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-[15px] font-medium text-t1 transition-colors duration-300 hover:border-white/25 hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {icon}
      {children}
    </a>
  )
}

const CV_URL = `${import.meta.env.BASE_URL}${PROFILE.cv}`

function Underlined({ children }: { children: string }) {
  const reduce = useReducedMotion()
  const [ref, seen] = useInViewX(0.3)
  return (
    <span ref={ref as never} className="relative inline-block font-display italic">
      {children}
      <motion.span
        aria-hidden
        className="absolute inset-x-0 -bottom-1 h-[6px] rounded-full bg-accent"
        style={{ originX: 0 }}
        initial={reduce ? false : { scaleX: 0 }}
        animate={reduce ? { scaleX: 1 } : { scaleX: seen ? 1 : 0 }}
        transition={{ duration: 0.9, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
      />
    </span>
  )
}

function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className="font-display text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[1.05] tracking-tight text-t1">
      {children}
    </h2>
  )
}

function Panel({ id, children, className = '' }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section
      id={id}
      data-panel
      className={`relative flex min-h-screen w-screen shrink-0 flex-col justify-center px-[7vw] md:h-screen md:min-h-0 ${className}`}
    >
      {children}
    </section>
  )
}

/* ---------- nav + progress ---------- */

function Nav({ active, goTo }: { active: string; goTo: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const reduce = useReducedMotion()
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Drawer behaviour: lock scroll, close on Escape, focus the first item on
  // open and return focus to the trigger on close.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    const first = menuRef.current?.querySelector('button')
    first?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      hamburgerRef.current?.focus()
    }
  }, [menuOpen])

  const handleNav = (id: string) => {
    setMenuOpen(false)
    goTo(id)
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-6">
      <nav className="relative z-50 flex w-max items-center gap-4 rounded-full border border-white/10 bg-white/[0.05] py-2.5 pl-6 pr-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:gap-7">
        <button onClick={() => goTo('top')} className="flex items-center gap-2.5 text-[15px] font-medium tracking-tight text-t1">
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-accent/20 font-display text-[13px] font-semibold text-accent-soft">
            A
          </span>
          <span className="hidden sm:inline">Artem Antonevych</span>
        </button>
        <div className="hidden items-center gap-6 sm:flex">
          {NAV.map((n) => {
            const isActive = active === n.id
            return (
              <button
                key={n.id}
                onClick={() => goTo(n.id)}
                className={`relative text-sm transition-colors ${isActive ? 'text-t1' : 'text-t2 hover:text-t1'}`}
              >
                {n.label}
                {isActive && (
                  <motion.span layoutId="nav-active" className="absolute -bottom-1.5 left-0 right-0 mx-auto h-1 w-1 rounded-full bg-accent" />
                )}
              </button>
            )
          })}
        </div>
        <button
          onClick={() => goTo('contact')}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-base transition-transform duration-300 hover:-translate-y-px active:scale-[0.98]"
        >
          Get in touch
        </button>
        <button
          ref={hamburgerRef}
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          className="flex size-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-t1 transition-colors hover:bg-white/[0.08] sm:hidden"
        >
          {menuOpen ? <X weight="bold" size={17} /> : <List weight="bold" size={17} />}
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-2 overscroll-contain bg-base/95 backdrop-blur-2xl sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            {NAV.map((n, i) => (
              <motion.button
                key={n.id}
                onClick={() => handleNav(n.id)}
                className={`font-display text-4xl font-semibold tracking-tight transition-colors ${active === n.id ? 'text-accent-soft' : 'text-t1'}`}
                initial={reduce ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              >
                {n.label}
              </motion.button>
            ))}
            <motion.button
              onClick={() => handleNav('contact')}
              className="mt-6 rounded-full bg-white px-6 py-3 text-base font-medium text-base"
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 + NAV.length * 0.06, ease: [0.16, 1, 0.3, 1] }}
            >
              Get in touch
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

/* ---------- panels ---------- */

function Hero({ goTo }: { goTo: (id: string) => void }) {
  const reduce = useReducedMotion()
  const fade = (d: number) => ({
    initial: reduce ? false : { opacity: 0, y: 20, filter: 'blur(6px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { duration: 0.8, delay: d, ease: [0.32, 0.72, 0, 1] as const },
  })
  return (
    <Panel id="top" className="overflow-hidden">
      <Suspense fallback={null}>
        <AuroraShader />
      </Suspense>
      <div className="relative z-10 grid items-center gap-12 md:grid-cols-[1.25fr_1fr]">
        <div>
          <motion.div {...fade(0)}>
            <Eyebrow>{`${PROFILE.role} · ${PROFILE.location}`}</Eyebrow>
          </motion.div>
          <motion.h1 className="mt-6 font-display text-[clamp(2.8rem,6vw,5rem)] font-semibold leading-[1.0] tracking-tight text-t1" {...fade(0.08)}>
            I find the story <Underlined>in the data</Underlined>.
          </motion.h1>
          <motion.p className="mt-6 max-w-md text-lg leading-relaxed text-t2" {...fade(0.16)}>
            Anti-fraud, retail and email analytics, built on clean, validated data.
          </motion.p>
          <motion.div className="mt-9 flex flex-wrap items-center gap-3" {...fade(0.24)}>
            <PrimaryButton onClick={() => goTo('projects')}>View projects</PrimaryButton>
            <GhostButton href={CV_URL} download>Download CV</GhostButton>
          </motion.div>
        </div>
        <motion.div {...fade(0.3)}>
          <CardDeck />
        </motion.div>
      </div>
    </Panel>
  )
}

const STATEMENT = [
  { text: 'From' }, { text: 'stopping' }, { text: 'fraud', accent: true }, { text: 'at' }, { text: '4bill.io' },
  { text: 'to' }, { text: 'finding' }, { text: 'growth', accent: true }, { text: 'in' }, { text: 'retail,' },
  { text: 'email' }, { text: 'and' }, { text: 'sales' }, { text: 'data.' },
]

function Statement() {
  return (
    <Panel>
      <div className="grid items-center gap-12 md:grid-cols-[1.1fr_1fr]">
        <ScrollHighlightText tokens={STATEMENT} />
        <Suspense fallback={null}>
          <DataSphere />
        </Suspense>
      </div>
    </Panel>
  )
}

function About() {
  return (
    <Panel id="about">
      <div className="grid gap-12 md:grid-cols-[1fr_1.4fr] md:items-center">
        <Reveal>
          <SectionHeading>The analyst behind the numbers.</SectionHeading>
        </Reveal>
        <Reveal className="space-y-6 text-lg leading-relaxed text-t2">
          <p>
            I am an <Marker>Anti-Fraud Specialist at 4bill.io</Marker>. I watch pay-in transactions in real time and dig
            through history for suspicious behaviour while it is still cheap to stop.
          </p>
          <p>
            Most cases come down to cross-referencing <Marker>IP, device fingerprints, BINs and velocity</Marker> in SQL
            and Python. Before that, freelance product, sales and email analytics across more than ten countries.
          </p>
          <p>
            I care about honesty over flash. Estimates are shown as estimates, and a chart only ships when it actually
            helps someone decide something.
          </p>
          <div className="pt-2">
            <GhostButton href={CV_URL} download>Download CV</GhostButton>
          </div>
        </Reveal>
      </div>
    </Panel>
  )
}

function Skills() {
  return (
    <Panel id="skills">
      <Reveal>
        <SectionHeading>The toolkit.</SectionHeading>
      </Reveal>
      <div className="mt-10 grid w-full max-w-5xl gap-4 md:grid-cols-2">
        {SKILLS.map((s, i) => (
          <Reveal key={s.group} delay={(i % 2) * 0.06} className={i === SKILLS.length - 1 ? 'md:col-span-2' : ''}>
            <Bezel className="h-full" coreClassName="flex h-full flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-accent-soft">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="font-display text-lg font-semibold tracking-tight text-t1">{s.group}</h3>
              </div>
              <ul className="flex flex-wrap gap-2">
                {s.items.map((it) => (
                  <li key={it} className="rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-1.5 text-sm text-t1/90">
                    {it}
                  </li>
                ))}
              </ul>
            </Bezel>
          </Reveal>
        ))}
      </div>
    </Panel>
  )
}

function ProjectCard({ p }: { p: Project }) {
  return (
    <Bezel className="h-full" coreClassName="flex h-full flex-col justify-between gap-5 p-7 md:p-10">
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-t3">
        <span>{p.context}</span>
        <span>{p.year}</span>
      </div>
      <div className="grid min-h-0 flex-1 content-center gap-8 md:grid-cols-[1.05fr_1fr] md:items-center">
        <div>
          <div className="font-display text-[clamp(2.8rem,5vw,4.6rem)] font-semibold leading-[0.95] text-t1">{p.metric}</div>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.16em] text-accent-soft">{p.metricLabel}</p>
          <h3 className="mt-6 font-display text-[clamp(1.5rem,2.4vw,2.2rem)] font-semibold leading-tight tracking-tight text-t1">
            {p.title}
          </h3>
        </div>
        <dl className="space-y-2.5 border-t border-white/8 pt-5 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          {[
            ['Goal', p.goal],
            ['Tasks', p.tasks],
            ['Why', p.why],
            ['Limits', p.constraints],
            ['Result', p.result],
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-[60px_1fr] gap-3">
              <dt className="pt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-t3">{k}</dt>
              <dd className="text-[13.5px] leading-snug text-t2">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-5">
        <div className="flex flex-wrap gap-4">
          {p.tools.map((t) => (
            <span key={t} className="font-mono text-xs text-t3">{t}</span>
          ))}
        </div>
        {p.nda ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-t3">
            <Lock weight="bold" size={12} /> Under NDA
          </span>
        ) : (
          p.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-t1 transition-colors hover:text-accent-soft"
            >
              {l.label} <ArrowUpRight weight="bold" size={15} />
            </a>
          ))
        )}
      </div>
    </Bezel>
  )
}

const CATEGORIES = ['All', 'Dashboards', 'Automation', 'SQL / Python'] as const
type Category = (typeof CATEGORIES)[number]

function ProjectsIntro({ filter, setFilter, count }: { filter: Category; setFilter: (c: Category) => void; count: number }) {
  return (
    <Panel id="projects">
      <h2 className="max-w-3xl font-display text-[clamp(2.4rem,5vw,4rem)] font-semibold leading-[1.02] tracking-tight text-t1">
        Selected work, told one case at a time.
      </h2>
      <p className="mt-6 max-w-md text-lg text-t2">Filter, then keep scrolling to move through each case sideways.</p>
      <div className="mt-8 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            className={`rounded-full px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.08em] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              filter === c ? 'bg-white text-base' : 'border border-white/12 bg-white/[0.03] text-t3 hover:text-t1'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.16em] text-accent-soft">
        {count} {count === 1 ? 'case' : 'cases'} · scroll →
      </p>
    </Panel>
  )
}

function ProjectPanel({ p }: { p: Project }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const loop = () => {
      const el = ref.current
      if (el) {
        const r = el.getBoundingClientRect()
        const vw = window.innerWidth
        const center = r.left + r.width / 2
        const d = Math.min(1, Math.abs(center - vw / 2) / (vw * 0.55))
        const k = 1 - d // 1 when centred, 0 when a screen away
        el.style.transform = `scale(${0.88 + 0.12 * k})`
        el.style.opacity = String(0.4 + 0.6 * k)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <section data-panel className="relative flex min-h-screen w-screen shrink-0 items-center px-[7vw] md:h-screen md:min-h-0">
      <div
        ref={ref}
        className="h-auto w-full max-w-[820px] origin-center will-change-transform md:h-[68vh] md:max-h-[660px]"
        style={{ transform: 'scale(0.88)', opacity: 0.4 }}
      >
        <ProjectCard p={p} />
      </div>
    </section>
  )
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function Recommendations() {
  return (
    <Panel>
      <Reveal>
        <SectionHeading>In other words.</SectionHeading>
      </Reveal>
      <div className="mt-10 grid w-full max-w-5xl gap-6 md:grid-cols-2">
        {RECOMMENDATIONS.map((r, i) => (
          <Reveal key={i} delay={i * 0.08}>
            <Bezel className="h-full" coreClassName="relative flex h-full flex-col overflow-hidden p-8">
              <span
                aria-hidden
                className="pointer-events-none absolute -top-6 right-4 font-display text-[7rem] leading-none text-accent/15 select-none"
              >
                &rdquo;
              </span>
              <span className="relative w-fit rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-t3">
                Sample
              </span>
              <p className="relative mt-6 font-display text-xl leading-snug text-t1">{r.quote}</p>
              <footer className="relative mt-auto flex items-center gap-3 pt-7">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/15 font-display text-sm font-semibold text-accent-soft">
                  {initials(r.name)}
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-medium text-t1">{r.name}</span>
                  <span className="block text-sm text-t3">{r.role}</span>
                </span>
              </footer>
            </Bezel>
          </Reveal>
        ))}
      </div>
    </Panel>
  )
}


function Contact({ goTo }: { goTo: (id: string) => void }) {
  return (
    <Panel id="contact" className="items-center overflow-hidden text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 size-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(110,139,255,0.16), transparent 62%)' }}
      />
      <div className="relative mx-auto max-w-3xl">
        <Reveal>
          <h2 className="font-display text-[clamp(2.4rem,5.5vw,4rem)] font-semibold leading-[1.05] tracking-tight text-t1">
            Let us find your next <Underlined>signal</Underlined>.
          </h2>
          <p className="mx-auto mt-6 max-w-md text-lg text-t2">Open to data analyst roles, remote or hybrid. The fastest way to reach me is email.</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <PrimaryButton href={`mailto:${PROFILE.email}`}>Get in touch</PrimaryButton>
            <GhostButton href={PROFILE.telegram} icon={<TelegramLogo weight="fill" size={18} />}>Telegram</GhostButton>
            <GhostButton href={PROFILE.linkedin} icon={<LinkedinLogo weight="fill" size={18} />}>LinkedIn</GhostButton>
            <GhostButton href={PROFILE.github} icon={<GithubLogo weight="fill" size={18} />}>GitHub</GhostButton>
          </div>
          <p className="mt-8 font-mono text-xs text-t3">
            <EnvelopeSimple weight="bold" size={13} className="mb-px mr-1.5 inline" />
            {PROFILE.email}
          </p>
        </Reveal>
      </div>
      <footer className="absolute inset-x-[7vw] bottom-8 flex flex-col items-center gap-4 border-t border-white/8 pt-6 text-left sm:flex-row sm:justify-between">
        <span className="text-sm text-t3">
          <span className="text-t2">{PROFILE.name}</span> · {PROFILE.role} · {new Date().getFullYear()}
        </span>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a href={`mailto:${PROFILE.email}`} className="text-sm text-t3 transition-colors hover:text-t1">Email</a>
          <a href={PROFILE.telegram} target="_blank" rel="noreferrer" className="text-sm text-t3 transition-colors hover:text-t1">Telegram</a>
          <a href={PROFILE.linkedin} target="_blank" rel="noreferrer" className="text-sm text-t3 transition-colors hover:text-t1">LinkedIn</a>
          <a href={PROFILE.github} target="_blank" rel="noreferrer" className="text-sm text-t3 transition-colors hover:text-t1">GitHub</a>
          <button onClick={() => goTo('top')} className="text-sm text-t3 transition-colors hover:text-t1">
            Back to top
          </button>
        </div>
      </footer>
    </Panel>
  )
}

function App() {
  const reduce = useReducedMotion()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const horizontal = isDesktop && !reduce
  const { trackRef, spacerRef, barRef } = useHorizontal(horizontal)
  const { active, goTo } = useHorizontalNav(horizontal)
  const [filter, setFilter] = useState<Category>('All')
  const shownProjects = filter === 'All' ? PROJECTS : PROJECTS.filter((p) => p.category === filter)

  const onFilter = (c: Category) => {
    setFilter(c)
    setTimeout(() => {
      const intro = document.getElementById('projects')
      if (!intro) return
      if (horizontal) window.scrollTo({ top: intro.offsetLeft + window.innerWidth, behavior: 'smooth' })
      else intro.nextElementSibling?.scrollIntoView({ behavior: 'smooth' })
    }, 70)
  }

  return (
    <>
      <Nav active={active} goTo={goTo} />
      <div ref={spacerRef}>
        <div className={horizontal ? 'fixed inset-0 overflow-hidden' : ''}>
          <div role="main" ref={trackRef} className={horizontal ? 'flex h-screen will-change-transform' : 'flex flex-col'}>
            <Hero goTo={goTo} />
            <Statement />
            <About />
            <Skills />
            <ProjectsIntro filter={filter} setFilter={onFilter} count={shownProjects.length} />
            {shownProjects.map((p) => (
              <ProjectPanel key={p.title} p={p} />
            ))}
            <Recommendations />
            <Contact goTo={goTo} />
          </div>
        </div>
      </div>
      {horizontal && (
        <div className="fixed inset-x-0 bottom-0 z-40 h-[3px] bg-white/10">
          <div ref={barRef} className="h-full origin-left bg-accent" style={{ transform: 'scaleX(0)' }} />
        </div>
      )}
    </>
  )
}

export default App
