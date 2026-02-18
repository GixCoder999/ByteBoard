import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  writeBatch
} from 'firebase/firestore'

const loadEnvFromDotEnv = () => {
  const raw = readFileSync('.env', 'utf8')
  raw
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

const firebaseConfig = () => ({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
})

const chunk = (items, size) => {
  const chunks = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

const clearCollection = async (db, collectionName) => {
  const snapshot = await getDocs(collection(db, collectionName))
  if (snapshot.empty) return 0

  let deletedCount = 0
  const docs = snapshot.docs
  const batches = chunk(docs, 400)

  for (const docsBatch of batches) {
    const batch = writeBatch(db)
    docsBatch.forEach((documentSnapshot) => {
      batch.delete(doc(db, collectionName, documentSnapshot.id))
    })
    await batch.commit()
    deletedCount += docsBatch.length
  }

  return deletedCount
}

const seedDummyPosts = async (db) => {
  const topics = [
    'React state patterns',
    'Firestore query basics',
    'JavaScript async tips',
    'Clean component structure',
    'CSS layout tricks'
  ]

  for (let index = 1; index <= 20; index += 1) {
    const topic = topics[(index - 1) % topics.length]
    const postId = `seed-post-${String(index).padStart(2, '0')}`
    await setDoc(doc(db, 'posts', postId), {
      text: `Dummy post ${index}: quick notes on ${topic}.`,
      code: '',
      image: '',
      username: `Demo User ${((index - 1) % 4) + 1}`,
      handle: `@demo_user_${((index - 1) % 4) + 1}`,
      authId: `demo-user-${((index - 1) % 4) + 1}`,
      LikesCount: 0,
      timestamp: serverTimestamp()
    })
  }
}

const run = async () => {
  loadEnvFromDotEnv()
  const app = initializeApp(firebaseConfig())
  const db = getFirestore(app)

  console.log('Clearing collections...')
  const deletedPosts = await clearCollection(db, 'posts')
  const deletedLikes = await clearCollection(db, 'Likes')
  const deletedSavedPosts = await clearCollection(db, 'SavedPosts')

  console.log(`Deleted posts: ${deletedPosts}`)
  console.log(`Deleted likes: ${deletedLikes}`)
  console.log(`Deleted saved posts: ${deletedSavedPosts}`)

  console.log('Seeding 20 dummy posts...')
  await seedDummyPosts(db)
  console.log('Seeding complete.')
}

run().catch((error) => {
  console.error('Reset + seed failed:', error)
  process.exit(1)
})
