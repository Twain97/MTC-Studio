function initMobileNav() {
  const button = document.querySelector('[data-mobile-nav-toggle]')
  const nav = document.querySelector('[data-mobile-nav]')
  if (!button || !nav) return

  button.addEventListener('click', () => {
    nav.classList.toggle('hidden')
  })

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.add('hidden')
    })
  })
}

function initReveal() {
  const items = document.querySelectorAll('[data-reveal]')
  if (!items.length) return

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      const delay = entry.target.getAttribute('data-reveal') || '0'
      entry.target.classList.add('reveal-ready')
      entry.target.style.setProperty('--reveal-delay', `${delay}ms`)
      requestAnimationFrame(() => entry.target.classList.add('revealed'))
      observer.unobserve(entry.target)
    }
  }, { threshold: 0.14 })

  items.forEach((item) => {
    item.classList.add('reveal-ready')
    observer.observe(item)
  })
}

function initPortfolioOpenAnimation() {
  document.querySelectorAll('[data-portfolio-grid], [data-project-grid]').forEach((grid) => {
    let opening = false
    grid.addEventListener('click', (event) => {
      const link = event.target.closest('[data-project-link]')
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      event.preventDefault()
      if (opening) return
      opening = true

      const card = link.closest('.portfolio-card')
      grid.classList.add('has-opening')
      card?.classList.add('is-opening')
      link.setAttribute('aria-busy', 'true')

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.setTimeout(() => window.location.assign(link.href), reducedMotion ? 0 : 1250)
    })
  })
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav()
  initReveal()
  initPortfolioOpenAnimation()
})
