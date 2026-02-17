import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth'

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore'
import app from './config.js'
import db from './firestore.js'

export const auth = getAuth(app)

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export const subscribeToAuth = (callback) => onAuthStateChanged(auth, callback)

const HANDLE_ADJECTIVES = [
  'bright',
  'calm',
  'clever',
  'crisp',
  'happy',
  'kind',
  'lucky',
  'mellow',
  'quick',
  'sunny'
]

const HANDLE_NOUNS = [
  'coder',
  'otter',
  'panda',
  'pixel',
  'raven',
  'sailor',
  'sparrow',
  'tiger',
  'trail',
  'writer'
]

const randomItem = (list) => list[Math.floor(Math.random() * list.length)]
const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const normalizeNamePart = (value) =>
  value.toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 8)

const makeCandidateHandle = (seed) => {
  const normalizedSeed = normalizeNamePart(seed || 'user')
  const adjective = randomItem(HANDLE_ADJECTIVES)
  const noun = randomItem(HANDLE_NOUNS)
  const suffix = randomNumber(10, 999)

  const candidate = `${normalizedSeed || adjective}_${noun}${suffix}`.slice(0, 20)
  return candidate.length >= 3 ? candidate : `user${randomNumber(100, 999)}`
}

const isHandleAvailable = async (normalizedHandle) => {
  const snapshot = await getDocs(
    query(collection(db, 'users'), where('handleLower', '==', normalizedHandle))
  )
  return snapshot.empty
}

const generateUniqueHandle = async (seed) => {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = makeCandidateHandle(seed)
    if (await isHandleAvailable(candidate)) {
      return candidate
    }
  }

  return `user${Date.now().toString().slice(-8)}`
}

const ensureUserProfile = async (user) => {
  const userRef = doc(db, 'users', user.uid)
  const existingProfile = await getDoc(userRef)

  if (existingProfile.exists()) {
    return
  }

  const normalizedEmail = user.email?.trim().toLowerCase() || ''
  const displayName = (user.displayName || '').trim()
  const seed = displayName || normalizedEmail.split('@')[0] || 'user'
  const uniqueHandle = await generateUniqueHandle(seed)

  await setDoc(userRef, {
    uid: user.uid,
    email: normalizedEmail,
    emailLower: normalizedEmail,
    name: displayName,
    handle: `@${uniqueHandle}`,
    handleLower: uniqueHandle,
    age: null,
    createdAt: serverTimestamp()
  })
}

export const signInWithGoogle = async () => {
  const credential = await signInWithPopup(auth, googleProvider)
  await ensureUserProfile(credential.user)
  return credential
}

export const signInWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password)

const normalizeHandle = (handle) => handle.trim().replace(/^@+/, '').toLowerCase()
const createAuthError = (code, message) => {
  const error = new Error(message)
  error.code = code
  return error
}

export const signUpWithEmail = async (email, password, name, handle, age) => {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedHandle = normalizeHandle(handle)
  const numericAge = Number(age)

  if (!/^[a-z0-9._]{3,20}$/.test(normalizedHandle)) {
    throw createAuthError(
      'auth/invalid-handle',
      'Handle must be 3-20 chars and use letters, numbers, dot, or underscore.'
    )
  }

  if (!Number.isInteger(numericAge) || numericAge < 13 || numericAge > 120) {
    throw createAuthError('auth/invalid-age', 'Please enter a valid age between 13 and 120.')
  }

  const usersRef = collection(db, 'users')

  const [emailSnapshot, handleSnapshot] = await Promise.all([
    getDocs(query(usersRef, where('emailLower', '==', normalizedEmail))),
    getDocs(query(usersRef, where('handleLower', '==', normalizedHandle)))
  ])

  if (!emailSnapshot.empty) {
    throw createAuthError('auth/email-already-in-use', 'That email is already in use.')
  }

  if (!handleSnapshot.empty) {
    throw createAuthError('auth/handle-already-in-use', 'That handle is already taken.')
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const cleanName = (name || '').trim()
  const cleanHandle = `@${normalizedHandle}`

  if (cleanName) {
    await updateProfile(credential.user, { displayName: cleanName })
  }

  try {
    await setDoc(doc(db, 'users', credential.user.uid), {
      uid: credential.user.uid,
      email: normalizedEmail,
      emailLower: normalizedEmail,
      name: cleanName,
      handle: cleanHandle,
      handleLower: normalizedHandle,
      age: numericAge,
      createdAt: serverTimestamp()
    })
  } catch (error) {
    await deleteUser(credential.user)
    throw error
  }

  return credential
}

export const logout = () => signOut(auth)
