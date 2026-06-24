import { useEffect, useRef, useState } from 'react'

/**
 * IntersectionObserver does not fire for elements moved by an ancestor CSS
 * transform (our horizontal track), so we poll with rAF. Toggles true/false as
 * the element enters and leaves the viewport, so entry animations replay every
 * time (including when scrolling back). Works in both layouts.
 */
export function useInViewX(amount = 0.2) {
  const ref = useRef<HTMLElement | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    let raf = 0
    let last = false
    const check = () => {
      const el = ref.current
      if (el) {
        const r = el.getBoundingClientRect()
        const vw = window.innerWidth
        const vh = window.innerHeight
        const vis =
          r.left < vw * (1 - amount) &&
          r.right > vw * amount &&
          r.top < vh * (1 - amount * 0.5) &&
          r.bottom > vh * amount * 0.5
        if (vis !== last) {
          last = vis
          setInView(vis)
        }
      }
      raf = requestAnimationFrame(check)
    }
    raf = requestAnimationFrame(check)
    return () => cancelAnimationFrame(raf)
  }, [amount])
  return [ref, inView] as const
}
