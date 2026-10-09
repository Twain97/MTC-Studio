async function openLightbox({ overlay, image, caption, src, title, sourceElement, animate = false }) {
  image.src = src
  image.alt = title || 'Image preview'
  caption.textContent = title || ''
  overlay.classList.remove('hidden')
  overlay.classList.add('flex')
  document.body.classList.add('overflow-hidden')

  if (!animate || !sourceElement) {
    overlay.classList.remove('opacity-0')
    return
  }

  image.style.transition = 'none'
  image.style.opacity = '0'
  try {
    await image.decode()
  } catch {
    // Continue with the transition even if the browser cannot decode the image yet.
  }

  const sourceRect = sourceElement.getBoundingClientRect()
  const targetRect = image.getBoundingClientRect()
  if (!sourceRect.width || !sourceRect.height || !targetRect.width || !targetRect.height) {
    image.style.transition = ''
    image.style.opacity = ''
    overlay.classList.remove('opacity-0')
    return
  }

  const offsetX = sourceRect.left - targetRect.left
  const offsetY = sourceRect.top - targetRect.top
  const scaleX = sourceRect.width / targetRect.width
  const scaleY = sourceRect.height / targetRect.height
  image.style.transformOrigin = 'top left'
  image.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scaleX}, ${scaleY})`
  image.getBoundingClientRect()

  requestAnimationFrame(() => {
    overlay.classList.remove('opacity-0')
    image.style.transition = ''
    image.style.opacity = '1'
    image.style.transform = 'none'
  })

  image.addEventListener('transitionend', () => {
    image.style.transition = ''
    image.style.transform = ''
    image.style.transformOrigin = ''
    image.style.opacity = ''
  }, { once: true })
}

function closeLightbox(overlay, image, caption) {
  overlay.classList.add('hidden')
  overlay.classList.remove('flex')
  overlay.classList.add('opacity-0')
  image.src = ''
  image.style.transition = ''
  image.style.transform = ''
  image.style.transformOrigin = ''
  image.style.opacity = ''
  caption.textContent = ''
  document.body.classList.remove('overflow-hidden')
}

document.addEventListener('DOMContentLoaded', () => {
  const lightbox = document.querySelector('[data-lightbox]')
  const lightboxImage = document.querySelector('[data-lightbox-image]')
  const lightboxCaption = document.querySelector('[data-lightbox-caption]')
  const closeButtons = lightbox ? lightbox.querySelectorAll('[data-lightbox-close]') : []

  const uploadLightbox = document.querySelector('[data-upload-lightbox]')
  const uploadLightboxImage = document.querySelector('[data-upload-lightbox-image]')
  const uploadLightboxCaption = document.querySelector('[data-upload-lightbox-caption]')
  const uploadCloseButtons = uploadLightbox ? uploadLightbox.querySelectorAll('[data-upload-lightbox-close]') : []

  function bindViewer(triggerSelector, overlay, image, caption, closeButtons, closeSelector, animateOpen = false) {
    if (!overlay || !image || !caption || !closeButtons.length) return

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay || event.target.closest(closeSelector)) {
        closeLightbox(overlay, image, caption)
      }
    })

    closeButtons.forEach((button) => {
      button.addEventListener('click', () => closeLightbox(overlay, image, caption))
    })

    document.querySelectorAll(triggerSelector).forEach((trigger) => {
      if (trigger.dataset.lightboxBound === 'true') return
      trigger.dataset.lightboxBound = 'true'
      trigger.addEventListener('click', () => {
        openLightbox({
          overlay,
          image,
          caption,
          src: trigger.getAttribute('data-image-open'),
          title: trigger.getAttribute('data-image-title'),
          sourceElement: trigger.querySelector('img') || trigger,
          animate: animateOpen && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        })
      })
    })
  }

  bindViewer('[data-image-open]', lightbox, lightboxImage, lightboxCaption, closeButtons, '[data-lightbox-close]', true)
  bindViewer('[data-upload-image-open]', uploadLightbox, uploadLightboxImage, uploadLightboxCaption, uploadCloseButtons, '[data-upload-lightbox-close]')
})
