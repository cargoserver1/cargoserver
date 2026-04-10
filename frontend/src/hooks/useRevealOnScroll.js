import { useEffect } from 'react'

export function useRevealOnScroll(selector = '[data-reveal]') {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll(selector))
    if (!nodes.length) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    )

    nodes.forEach((node) => observer.observe(node))

    return () => observer.disconnect()
  }, [selector])
}
