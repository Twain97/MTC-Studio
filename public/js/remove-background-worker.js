const MODEL_ID = 'Xenova/modnet'
const MODEL_CACHE = 'transformers-cache'

let runtimePromise
let segmenterPromise

function getRuntime() {
  if (!runtimePromise) {
    // transformers.web.js leaves an npm bare import (`onnxruntime-web/webgpu`)
    // that browsers cannot resolve without a bundler. The bundled browser file
    // includes ONNX Runtime and works when served directly from this app.
    runtimePromise = import('/vendor/transformers/transformers.js').then((runtime) => {
      runtime.env.useBrowserCache = true
      runtime.env.cacheKey = MODEL_CACHE
      runtime.env.backends.onnx.wasm.numThreads = 1
      runtime.env.backends.onnx.wasm.wasmPaths = {
        mjs: '/vendor/onnxruntime/ort-wasm-simd-threaded.asyncify.mjs',
        wasm: '/vendor/onnxruntime/ort-wasm-simd-threaded.asyncify.wasm'
      }
      return runtime
    }).catch((error) => {
      runtimePromise = null
      throw error
    })
  }
  return runtimePromise
}

function createSegmenter() {
  return getRuntime().then(({ pipeline }) => pipeline('background-removal', MODEL_ID, {
    // Use the regular full-precision model with ONNX Runtime Web's WASM backend.
    dtype: 'fp32',
    device: 'wasm',
    progress_callback: (event) => {
      if (event.status === 'progress_total' && Number.isFinite(event.progress)) {
        self.postMessage({
          type: 'progress',
          operation: 'load',
          percent: event.progress,
          message: 'Rounding Up...'
        })
      }
    }
  }))
}

async function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = createSegmenter().catch((error) => {
      segmenterPromise = null
      throw error
    })
  }
  return segmenterPromise
}

async function removeBackground(file) {
  self.postMessage({ type: 'progress', message: 'Fetching Subject' })
  const { RawImage } = await getRuntime()
  const image = await RawImage.read(file)
  self.postMessage({ type: 'progress', message: 'Removing Background' })

  const segmenter = await getSegmenter()
  const result = await segmenter(image)

  self.postMessage({ type: 'progress', message: 'Cleaning up Image' })
  const buffer = result.data.slice().buffer
  return { width: result.width, height: result.height, buffer }
}

self.addEventListener('message', async (event) => {
  const operation = event.data?.type
  if (operation !== 'load' && operation !== 'remove') return
  try {
    if (operation === 'load') {
      self.postMessage({ type: 'progress', operation: 'load', percent: 0, message: 'Getting ready…' })
    }
    await getSegmenter()
    self.postMessage({ type: 'model-ready' })
    if (operation === 'load') return

    const result = await removeBackground(event.data.file)
    self.postMessage({ type: 'result', ...result }, [result.buffer])
  } catch (error) {
    const message = error?.message || (operation === 'load' ? 'Could not load the MODNet model.' : 'Could not remove this image background.')
    self.postMessage(operation === 'load'
      ? { type: 'model-load-error', message }
      : { type: 'error', message })
  }
})
