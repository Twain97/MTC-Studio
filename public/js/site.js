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

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav()
  initReveal()
})
