const databaseName = 'mtc-image-tool-sessions'
const storeName = 'sessions'
let databasePromise

function openDatabase() {
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1)
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(storeName)) {
          request.result.createObjectStore(storeName, { keyPath: 'id' })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error || new Error('Could not open browser storage.'))
      request.onblocked = () => reject(new Error('Browser storage is blocked by another tab.'))
    }).catch((error) => {
      databasePromise = null
      throw error
    })
  }
  return databasePromise
}

export async function putToolSession(tool, key, payload, expiresAt) {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    transaction.objectStore(storeName).put({
      id: `${tool}:${key}`,
      tool,
      key,
      payload,
      expiresAt
    })
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error || new Error('Could not save this image session.'))
    transaction.onabort = () => reject(transaction.error || new Error('Could not save this image session.'))
  })
}

export async function getToolSessions(tool) {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()
    let sessions = []
    request.onsuccess = () => {
      const now = Date.now()
      sessions = request.result.filter((session) => {
        if (session.tool !== tool) return false
        if (session.expiresAt <= now) {
          store.delete(session.id)
          return false
        }
        return true
      })
    }
    request.onerror = () => reject(request.error || new Error('Could not restore saved images.'))
    transaction.oncomplete = () => resolve(sessions)
    transaction.onerror = () => reject(transaction.error || new Error('Could not restore saved images.'))
    transaction.onabort = () => reject(transaction.error || new Error('Could not restore saved images.'))
  })
}

export async function deleteToolSession(tool, key) {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    transaction.objectStore(storeName).delete(`${tool}:${key}`)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error || new Error('Could not clear saved images.'))
    transaction.onabort = () => reject(transaction.error || new Error('Could not clear saved images.'))
  })
}

export async function clearToolSessions(tool) {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()
    request.onsuccess = () => {
      for (const session of request.result) {
        if (session.tool === tool) store.delete(session.id)
      }
    }
    request.onerror = () => reject(request.error || new Error('Could not clear saved images.'))
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error || new Error('Could not clear saved images.'))
    transaction.onabort = () => reject(transaction.error || new Error('Could not clear saved images.'))
  })
}
