const MODEL_ID = 'Xenova/modnet'
const MODEL_REVISION = 'main'
const CACHE_NAME = 'transformers-cache'
const MODEL_BASE_URL = `https://huggingface.co/${MODEL_ID}/resolve/${MODEL_REVISION}/`
// Keep preload selection aligned with the worker's full-precision MODNet model.
const modelFile = 'onnx/model.onnx'
const modelFileSize = 25_888_640
const modelFiles = [
  { path: 'config.json', size: 1000 },
  { path: 'preprocessor_config.json', size: 1000 },
  { path: modelFile, size: modelFileSize }
].map((file) => ({ ...file, url: `${MODEL_BASE_URL}${file.path}` }))
const totalExpectedBytes = modelFiles.reduce((sum, file) => sum + file.size, 0)
const preloadEvents = new EventTarget()

let state = { status: 'checking', percent: 0 }
let readyPromise

function setState(nextState) {
  state = nextState
  preloadEvents.dispatchEvent(new CustomEvent('change', { detail: state }))
}

async function preloadModel() {
  try {
    if (!('caches' in window)) throw new Error('Persistent model cache is unavailable.')
    await caches.delete('mtc-background-model-v1')
    const cache = await caches.open(CACHE_NAME)
    let completedBytes = 0

    for (const file of modelFiles) {
      const cached = await cache.match(file.url)
      if (cached) {
        const cachedSize = Number(cached.headers.get('content-length')) || file.size
        completedBytes += cachedSize
        setState({ status: 'downloading', percent: Math.min(99, Math.round((completedBytes / totalExpectedBytes) * 100)) })
        continue
      }

      setState({ status: 'downloading', percent: Math.min(99, Math.round((completedBytes / totalExpectedBytes) * 100)) })
      const response = await fetch(file.url, { cache: 'force-cache', priority: 'low' })
      if (!response.ok || !response.body) throw new Error(`Model download failed (${response.status}).`)

      const expectedSize = Number(response.headers.get('content-length')) || file.size
      let receivedBytes = 0
      const cacheWrite = cache.put(file.url, response.clone()).then(() => null, (error) => error)
      const reader = response.body.getReader()
      let lastPercent = -1
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        receivedBytes += value.byteLength
        const percent = Math.min(99, Math.round(((completedBytes + receivedBytes) / totalExpectedBytes) * 100))
        if (percent !== lastPercent) {
          lastPercent = percent
          setState({ status: 'downloading', percent })
        }
      }

      const cacheError = await cacheWrite
      if (cacheError) throw cacheError
      completedBytes += Math.max(receivedBytes, expectedSize)
    }

    setState({ status: 'cached', percent: 100 })
  } catch (error) {
    setState({ status: 'error', percent: 0, message: error?.message || 'Could not cache the model.' })
  }
  return state
}

function schedulePreload() {
  if (readyPromise) return readyPromise
  readyPromise = new Promise((resolve) => {
    const scheduleWhenIdle = () => {
      const start = () => preloadModel().then(resolve)
      if ('requestIdleCallback' in window) window.requestIdleCallback(start)
      else window.setTimeout(start, 3000)
    }
    if (document.readyState === 'complete') scheduleWhenIdle()
    else window.addEventListener('load', scheduleWhenIdle, { once: true })
  })
  return readyPromise
}

window.mtcBackgroundModelPreload = {
  get state() { return state },
  ready: schedulePreload(),
  addEventListener: (...args) => preloadEvents.addEventListener(...args),
  removeEventListener: (...args) => preloadEvents.removeEventListener(...args),
  retry() {
    readyPromise = null
    setState({ status: 'checking', percent: 0 })
    return schedulePreload()
  }
}
