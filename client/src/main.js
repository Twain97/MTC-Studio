import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'
import './styles.css'

const app = createApp(App)

app.directive('reveal', {
  mounted(element, binding) {
    element.classList.add('reveal-ready')
    if (binding.value) element.style.setProperty('--reveal-delay', `${binding.value}ms`)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add('revealed')
          observer.unobserve(element)
        }
      },
      { threshold: 0.14 }
    )

    observer.observe(element)
    element._revealObserver = observer
  },
  unmounted(element) {
    element._revealObserver?.disconnect()
  }
})

app.use(router).mount('#app')

