import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { initializeApp } from 'firebase/app'
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  writeBatch
} from 'firebase/firestore'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

const loadEnvFromDotEnv = () => {
  const envPath = resolve(projectRoot, '.env')
  const rawEnv = readFileSync(envPath, 'utf8')

  rawEnv
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .forEach((line) => {
      const separatorIndex = line.indexOf('=')
      if (separatorIndex === -1) return
      const key = line.slice(0, separatorIndex).trim()
      const value = line.slice(separatorIndex + 1).trim()
      process.env[key] = value
    })
}

const getFirebaseConfig = () => ({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
})

loadEnvFromDotEnv()
const app = initializeApp(getFirebaseConfig())
const db = getFirestore(app)

const chunk = (items, size) => {
  const chunks = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

const clearPostsCollection = async () => {
  const snapshot = await getDocs(collection(db, 'posts'))
  if (snapshot.empty) return 0

  let deletedCount = 0
  const groupedDocs = chunk(snapshot.docs, 400)
  for (const docsGroup of groupedDocs) {
    const batch = writeBatch(db)
    docsGroup.forEach((documentSnapshot) => {
      batch.delete(doc(db, 'posts', documentSnapshot.id))
    })
    await batch.commit()
    deletedCount += docsGroup.length
  }

  return deletedCount
}

const seedPosts = async () => {
  console.log('Clearing posts...')
  const deletedPosts = await clearPostsCollection()
  console.log(`Deleted posts: ${deletedPosts}`)
  console.log('Posts reset complete.')
}

seedPosts().catch((error) => {
  console.error('Seed failed:', error)
})
