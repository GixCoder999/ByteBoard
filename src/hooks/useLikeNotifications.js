import { useEffect, useRef } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { toast } from 'react-toastify'
import db from '../firebase/firestore.js'

const LIKE_TITLE = 'New Like'
const SAVE_TITLE = 'Post Saved'
const TEST_TITLE = 'Notifications Enabled'
const TEST_MESSAGE = 'Test notification: app started.'
const ENABLE_HINT_MESSAGE = 'Enable browser notifications in site settings to receive native alerts.'
const MILESTONE_TITLE = 'Like Milestone'
const MILESTONE_STEP = 2

const COMPLIMENTS = [
  'Great work',
  'You are on fire',
  'People love your content',
  'Keep the momentum going',
  'Awesome consistency'
]

const randomCompliment = () => {
  const index = Math.floor(Math.random() * COMPLIMENTS.length)
  return COMPLIMENTS[index]
}

const notify = (title, body) => {
  const permission = typeof window !== 'undefined' && 'Notification' in window
    ? Notification.permission
    : 'unsupported'

  console.log('[like-notifications] notify called:', { title, body })
  console.log('[like-notifications] browser notification permission:', permission)

  if (permission === 'granted') {
    console.log('[like-notifications] using browser Notification API')
    new Notification(title, { body })
    return
  }

  console.log('[like-notifications] using toast fallback')
  toast.info(body)
}

const notifyLike = (likerName) => {
  const safeLikerName = (likerName || '').trim() || 'Someone'
  notify(LIKE_TITLE, `${safeLikerName} liked your post.`)
}

const notifySave = (saverName) => {
  const safeSaverName = (saverName || '').trim() || 'Someone'
  notify(SAVE_TITLE, `${safeSaverName} saved your post.`)
}

const notifyTestOnStartup = () => {
  notify(TEST_TITLE, TEST_MESSAGE)
}

const useLikeNotifications = (currentUser, isAuthReady = true) => {
  const isFirstSnapshotRef = useRef(true)
  const seenLikeIdsRef = useRef(new Set())
  const isFirstSaveSnapshotRef = useRef(true)
  const seenSaveIdsRef = useRef(new Set())
  const hasShownPermissionHintRef = useRef(false)
  const lastMilestoneRef = useRef(0)

  const milestoneStorageKey = currentUser?.uid
    ? `likes-milestone-notified:${currentUser.uid}`
    : null

  const notifyLikeMilestone = (totalLikes) => {
    const compliment = randomCompliment()
    notify(
      MILESTONE_TITLE,
      `${compliment}! You now have ${totalLikes} total likes on your posts.`
    )
  }

  useEffect(() => {
    if (!isAuthReady || !currentUser?.uid) return

    const permission = typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported'
    console.log('[like-notifications] startup permission check:', permission)

    if (permission !== 'granted' && !hasShownPermissionHintRef.current) {
      toast.warn(ENABLE_HINT_MESSAGE, {
        toastId: 'enable-browser-notifications-hint',
        autoClose: 5000
      })
      hasShownPermissionHintRef.current = true
    }

    console.log('[like-notifications] startup test effect for user:', currentUser.uid)
    const timerId = window.setTimeout(() => {
      notifyTestOnStartup()
    }, 150)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [currentUser?.uid, isAuthReady])

  useEffect(() => {
    if (!isAuthReady || !currentUser?.uid) return
    console.log('[like-notifications] subscribing for postOwnerId:', currentUser.uid)

    isFirstSnapshotRef.current = true
    seenLikeIdsRef.current = new Set()
    const savedMilestone = Number.parseInt(localStorage.getItem(milestoneStorageKey) || '0', 10)
    lastMilestoneRef.current = Number.isNaN(savedMilestone) ? 0 : savedMilestone

    const likesQuery = query(
      collection(db, 'Likes'),
      where('postOwnerId', '==', currentUser.uid)
    )

    const unsubscribe = onSnapshot(likesQuery, (snapshot) => {
      console.log('[like-notifications] snapshot received:', {
        docs: snapshot.docs.length,
        changes: snapshot.docChanges().length
      })

      if (isFirstSnapshotRef.current) {
        snapshot.docs.forEach((likeDoc) => {
          seenLikeIdsRef.current.add(likeDoc.id)
        })
        if (lastMilestoneRef.current === 0) {
          const currentMilestone = Math.floor(snapshot.docs.length / MILESTONE_STEP) * MILESTONE_STEP
          lastMilestoneRef.current = currentMilestone
          localStorage.setItem(milestoneStorageKey, String(currentMilestone))
        }
        isFirstSnapshotRef.current = false
        console.log('[like-notifications] initial snapshot seeded; notifications active for new likes')
        return
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'added') return

        if (seenLikeIdsRef.current.has(change.doc.id)) {
          console.log('[like-notifications] skipped already-seen like:', change.doc.id)
          return
        }

        const likeData = change.doc.data()
        seenLikeIdsRef.current.add(change.doc.id)
        console.log('[like-notifications] new like detected:', change.doc.id)
        notifyLike(likeData?.likerName)
      })

      const totalLikes = snapshot.docs.length
      const currentMilestone = Math.floor(totalLikes / MILESTONE_STEP) * MILESTONE_STEP
      if (currentMilestone >= MILESTONE_STEP && currentMilestone > lastMilestoneRef.current) {
        lastMilestoneRef.current = currentMilestone
        localStorage.setItem(milestoneStorageKey, String(currentMilestone))
        console.log('[like-notifications] like milestone reached:', currentMilestone)
        notifyLikeMilestone(totalLikes)
      }
    })

    return () => {
      console.log('[like-notifications] unsubscribing')
      unsubscribe()
    }
  }, [currentUser?.uid, isAuthReady, milestoneStorageKey])

  useEffect(() => {
    if (!isAuthReady || !currentUser?.uid) return
    console.log('[save-notifications] subscribing for postOwnerId:', currentUser.uid)

    isFirstSaveSnapshotRef.current = true
    seenSaveIdsRef.current = new Set()

    const savesQuery = query(
      collection(db, 'SavedPosts'),
      where('postOwnerId', '==', currentUser.uid)
    )

    const unsubscribe = onSnapshot(savesQuery, (snapshot) => {
      console.log('[save-notifications] snapshot received:', {
        docs: snapshot.docs.length,
        changes: snapshot.docChanges().length
      })

      if (isFirstSaveSnapshotRef.current) {
        snapshot.docs.forEach((saveDoc) => {
          seenSaveIdsRef.current.add(saveDoc.id)
        })
        isFirstSaveSnapshotRef.current = false
        console.log('[save-notifications] initial snapshot seeded; notifications active for new saves')
        return
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'added') return

        if (seenSaveIdsRef.current.has(change.doc.id)) {
          console.log('[save-notifications] skipped already-seen save:', change.doc.id)
          return
        }

        const saveData = change.doc.data()
        seenSaveIdsRef.current.add(change.doc.id)
        console.log('[save-notifications] new save detected:', change.doc.id)
        notifySave(saveData?.saverName)
      })
    })

    return () => {
      console.log('[save-notifications] unsubscribing')
      unsubscribe()
    }
  }, [currentUser?.uid, isAuthReady])
}

export default useLikeNotifications
