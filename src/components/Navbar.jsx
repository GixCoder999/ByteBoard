import './Navbar.css'
import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import byteBoardLogo from '../assets/byteboard_logo.png'
import db from '../firebase/firestore.js'

const viewItems = ['Feed', 'Saved', 'MyPosts', 'Settings']
const formatNotificationTime = (timestamp) => {
  if (!timestamp?.toDate) return 'Just now'
  return timestamp.toDate().toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const getPermissionMeta = (permission) => {
  switch (permission) {
    case 'granted':
      return { label: 'Notifications: Enabled', toneClass: 'is-enabled' }
    case 'denied':
      return { label: 'Notifications: Blocked', toneClass: 'is-blocked' }
    case 'default':
      return { label: 'Notifications: Ask', toneClass: 'is-pending' }
    default:
      return { label: 'Notifications: Unsupported', toneClass: 'is-unsupported' }
  }
}

const Navbar = ({ currentUser, notificationPermission, onSignOut, activeView = 'Feed', onNavigate }) => {
  const avatar = currentUser?.photoURL || ``;
  const name = currentUser?.displayName || currentUser?.email || 'Profile'
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const permissionMeta = getPermissionMeta(notificationPermission)

  useEffect(() => {
    if (!currentUser?.uid) return

    const notificationsQuery = query(
      collection(db, 'Notifications'),
      where('receiverId', '==', currentUser.uid)
    )

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const nextNotifications = snapshot.docs
        .map((notificationDoc) => ({
          id: notificationDoc.id,
          ...notificationDoc.data()
        }))
        .sort((a, b) => {
          const aTime = a?.createdAt?.toMillis?.() || 0
          const bTime = b?.createdAt?.toMillis?.() || 0
          return bTime - aTime
        })
        .slice(0, 10)
      setNotifications(nextNotifications)
    })

    return () => unsubscribe()
  }, [currentUser?.uid])

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <div className="navbar__logo">
          <span className="navbar__logoMark">
            <img src={byteBoardLogo} alt="ByteBoard logo" />
          </span>
          <span className="navbar__logoText">ByteBoard</span>
        </div>

        <div className={`navbar__status ${permissionMeta.toneClass}`} aria-label="Notification status">
          <span className="navbar__statusDot" aria-hidden="true" />
          <span>{permissionMeta.label}</span>
        </div>

        <div className="navbar__actions">
          <button className="btn btn--ghost" onClick={onSignOut}>Sign out</button>

          <div className="navbar__notifications">
            <button
              className="icon-button"
              aria-label="Notifications"
              aria-expanded={notificationOpen}
              onClick={() => setNotificationOpen((open) => !open)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 17h5l-1.4-1.4a2 2 0 01-.6-1.4V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 01-6 0" />
              </svg>
              {notifications.length > 0 && (
                <span className="navbar__notificationBadge">{notifications.length}</span>
              )}
            </button>

            {notificationOpen && (
              <div className="navbar__notificationPanel">
                <p className="navbar__notificationTitle">Recent notifications</p>
                {notifications.length === 0 && (
                  <p className="navbar__notificationEmpty">No notifications yet.</p>
                )}
                {notifications.map((notification) => (
                  <div key={notification.id} className="navbar__notificationItem">
                    <p>{notification.message || 'You have a new notification.'}</p>
                    <span>{formatNotificationTime(notification.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="navbar__profile-stack">
            <button
              className="navbar__avatar"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {avatar ? (
                <img src={avatar} alt=''/>
              ) : (
                <span className="navbar__avatarFallback" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4.4 0-8 2.4-8 5.3 0 .4.3.7.7.7h14.6c.4 0 .7-.3.7-.7 0-2.9-3.6-5.3-8-5.3z" />
                  </svg>
                </span>
              )}
              <span className="navbar__name">{name}</span>
              <span className="navbar__caret" />
            </button>

            {menuOpen && (
              <div className="navbar__menu">
                {viewItems.map((item) => (
                  <button
                    key={item}
                    className={`navbar__menuItem${activeView === item ? ' is-active' : ''}`}
                    onClick={() => {
                      onNavigate?.(item)
                      setMenuOpen(false)
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar;
