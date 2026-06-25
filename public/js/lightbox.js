function openLightbox({ overlay, image, caption, src, title }) {
  image.src = src
  image.alt = title || 'Image preview'
  caption.textContent = title || ''
  overlay.classList.remove('hidden')
  overlay.classList.add('flex')
  document.body.classList.add('overflow-hidden')
}

function closeLightbox(overlay, image, caption) {
  overlay.classList.add('hidden')
  overlay.classList.remove('flex')
  image.src = ''
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

  function bindViewer(triggerSelector, overlay, image, caption, closeButtons, closeSelector) {
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
          title: trigger.getAttribute('data-image-title')
        })
      })
    })
  }

  bindViewer('[data-image-open]', lightbox, lightboxImage, lightboxCaption, closeButtons, '[data-lightbox-close]')
  bindViewer('[data-upload-image-open]', uploadLightbox, uploadLightboxImage, uploadLightboxCaption, uploadCloseButtons, '[data-upload-lightbox-close]')
})
