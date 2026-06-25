document.addEventListener('DOMContentLoaded', () => {
  const fallbackSrc = '/images/photographer.webp'

  document.querySelectorAll('img[data-fallback-src]').forEach((img) => {
    if (img.dataset.fallbackBound === 'true') return
    img.dataset.fallbackBound = 'true'

    img.addEventListener('error', () => {
      if (img.dataset.fallbackApplied === 'true') return
      img.dataset.fallbackApplied = 'true'
      img.src = img.dataset.fallbackSrc || fallbackSrc
    })
  })
})
