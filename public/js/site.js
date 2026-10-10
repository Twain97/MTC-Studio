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

function initContractCollages() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reducedMotion) return

  document.querySelectorAll('[data-contract-collage]').forEach((collage, collageIndex) => {
    const photos = Array.from(collage.querySelectorAll('[data-collage-photo]'))
    if (photos.length < 2) return

    const frontOrder = photos.length >= 3 ? [1, 0, 2] : [1, 0]
    let sequenceIndex = 0
    window.setInterval(() => {
      if (document.hidden) return
      sequenceIndex = (sequenceIndex + 1) % frontOrder.length
      const frontIndex = frontOrder[sequenceIndex]
      const leftIndex = (frontIndex + photos.length - 1) % photos.length
      const rightIndex = (frontIndex + 1) % photos.length

      photos.forEach((photo, index) => {
        photo.classList.remove('is-front', 'is-left', 'is-center', 'is-right')
        if (index === frontIndex) photo.classList.add('is-front', 'is-center')
        else if (index === leftIndex) photo.classList.add('is-left')
        else if (photos.length > 2 && index === rightIndex) photo.classList.add('is-right')
        else photo.classList.add('is-left')
      })
    }, 2600 + (collageIndex % 3) * 240)
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
  initContractCollages()
  initPortfolioOpenAnimation()
})
