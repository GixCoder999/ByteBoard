import Home from './pages/Home'
import { useState, useEffect, useCallback, useRef } from 'react'
import { query, getDocs, collection, where, doc, getDoc } from 'firebase/firestore'
import db from './firebase/firestore.js'
import { parseSnapshot } from '../scripts/utilis.js'
import AuthPage from './pages/AuthPage'
import { logout, subscribeToAuth } from './firebase/auth.js'
import { ToastContainer, toast } from 'react-toastify'
import useLikeNotifications from './hooks/useLikeNotifications.js'
import 'react-toastify/dist/ReactToastify.css'
import './App.css'

function App() {
  const [savedPosts, setSavedPosts] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [notificationPermission, setNotificationPermission] = useState('unsupported')
  const hasRequestedNotificationPermissionRef = useRef(false)
  useLikeNotifications(currentUser, !authLoading)

  const requestBrowserNotificationPermission = useCallback(async (force = false) => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported')
      toast.warn('Browser notifications are not supported on this device/browser.')
      return
    }

    const currentPermission = Notification.permission
    setNotificationPermission(currentPermission)

    if (currentPermission === 'granted') return
    if (currentPermission === 'denied') {
      toast.warn('Notifications are blocked. Enable them from browser site settings.')
      return
    }
    if (!force && hasRequestedNotificationPermissionRef.current) return

    hasRequestedNotificationPermissionRef.current = true
    const result = await Notification.requestPermission()
    setNotificationPermission(result)

    if (result === 'granted') {
      toast.success('Browser notifications enabled.')
      return
    }

    toast.info('Notification permission not granted. You can enable it from browser settings.')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    setNotificationPermission(Notification.permission)
  }, [])

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

  useEffect(() => {
    if (authLoading || !currentUser?.uid) return
    requestBrowserNotificationPermission()
  }, [authLoading, currentUser?.uid, requestBrowserNotificationPermission])

  if (authLoading) {
    return null
  }

  if (!currentUser) {
    return <AuthPage onUserDataLoaded={setUserData} />
  }

  return (
    <>
      <Home
        savedPosts={savedPosts}
        setSavedPosts={setSavedPosts}
        currentUser={currentUser}
        userData={userData}
        notificationPermission={notificationPermission}
        onProfileUpdated={refreshUserData}
        onSignOut={logout}
      />
      {notificationPermission !== 'granted' && (
        <button
          type="button"
          className="icon-pill"
          style={{ position: 'fixed', right: '16px', bottom: '16px', zIndex: 1300 }}
          onClick={() => requestBrowserNotificationPermission(true)}
        >
          Enable Notifications
        </button>
      )}
      <ToastContainer position="top-right" autoClose={3000} newestOnTop />
    </>
  )
}

export default App
