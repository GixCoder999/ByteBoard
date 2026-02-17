import Home from './pages/Home'
import { useState, useEffect, useCallback } from 'react'
import { query, getDocs, collection, where, doc, getDoc } from 'firebase/firestore'
import db from './firebase/firestore.js'
import { parseSnapshot } from '../scripts/utilis.js'
import AuthPage from './pages/AuthPage'
import { logout, subscribeToAuth } from './firebase/auth.js'
import './App.css'

function App() {
  const [savedPosts, setSavedPosts] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'light'
    document.documentElement.setAttribute('data-theme', storedTheme)
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setSavedPosts([])
      setCurrentUser(user)
      if (!user) {
        setUserData(null)
      }
      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!currentUser) return

    async function fetchSavedPosts() {
      try {
        const q = query(collection(db, 'SavedPosts'), where('userId', '==', currentUser.uid))
        const snapshot = await getDocs(q)

        if (!snapshot.empty) {
          const parsedSavedPosts = parseSnapshot(snapshot)
          const savedPostIds = parsedSavedPosts.map((post) => post.id)

          console.log('Fetched saved post IDs: ', savedPostIds)

          setSavedPosts(savedPostIds)
        }
        else console.log('No saved posts found for userId: ', currentUser.uid)
      }
      catch (error) {
        console.error('Error fetching saved posts:', error)
      }
    }

    fetchSavedPosts()
  }, [currentUser])

  const refreshUserData = useCallback(async (uid) => {
    if (!uid) return

    try {
      const userSnapshot = await getDoc(doc(db, 'users', uid))

      if (!userSnapshot.exists()) {
        setUserData(null)
        return
      }

      const profile = { id: userSnapshot.id, ...userSnapshot.data() }
      setUserData(profile)
    } catch (error) {
      setUserData(null)
    }
  }, [])

  useEffect(() => {
    if (!currentUser?.uid) return
    refreshUserData(currentUser.uid)
  }, [currentUser?.uid, refreshUserData])

  if (authLoading) {
    return null
  }

  if (!currentUser) {
    return <AuthPage onUserDataLoaded={setUserData} />
  }

  return (
    <Home
      savedPosts={savedPosts}
      setSavedPosts={setSavedPosts}
      currentUser={currentUser}
      userData={userData}
      onProfileUpdated={refreshUserData}
      onSignOut={logout}
    />
  )
}

export default App
