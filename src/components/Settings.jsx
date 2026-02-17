import { useEffect, useState } from 'react'
import { updatePassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth } from '../firebase/auth.js'
import db from '../firebase/firestore.js'
import './Settings.css'

const normalizeHandle = (value) => {
  const clean = value.trim().replace(/^@+/, '').toLowerCase()
  return clean ? `@${clean}` : ''
}

const Settings = ({ currentUser, userData, onProfileUpdated }) => {
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [photoURL, setPhotoURL] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [theme, setTheme] = useState('light')
  const [profileMessage, setProfileMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    setName(userData?.name || currentUser?.displayName || '')
    setHandle(userData?.handle || '')
    setPhotoURL(currentUser?.photoURL || '')
  }, [currentUser, userData])

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'light'
    setTheme(storedTheme)
    document.documentElement.setAttribute('data-theme', storedTheme)
  }, [])

  const onThemeChange = (nextTheme) => {
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
  }

  const onProfileSave = async (event) => {
    event.preventDefault()
    if (!currentUser?.uid) return
    setIsSavingProfile(true)
    setProfileMessage('')
    try {
      const cleanName = name.trim()
      const cleanHandle = normalizeHandle(handle)
      const cleanPhotoURL = photoURL.trim()
      await updateProfile(currentUser, {
        displayName: cleanName,
        photoURL: cleanPhotoURL || null
      })
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          name: cleanName,
          handle: cleanHandle,
          handleLower: cleanHandle.replace(/^@/, ''),
          photoURL: cleanPhotoURL || null
        },
        { merge: true }
      )
      setProfileMessage('Profile updated.')
      await onProfileUpdated?.(currentUser.uid)
      
    } catch (error) {
      setProfileMessage('Could not update profile.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const onPasswordChange = async (event) => {
    event.preventDefault()
    if (!auth.currentUser || !newPassword.trim()) return
    setIsChangingPassword(true)
    setPasswordMessage('')
    try {
      await updatePassword(auth.currentUser, newPassword.trim())
      setNewPassword('')
      setPasswordMessage('Password changed.')
    } catch (error) {
      console.error('Password change error:', error)
      setPasswordMessage('Could not change password. You may need to sign in again.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <section className="settings">
      <header className="settings__header">
        <h2>Settings</h2>
        <p>Manage your profile, account, and appearance.</p>
      </header>

      <form className="settings__card" onSubmit={onProfileSave}>
        <h3>Profile</h3>
        <label className="settings__field">
          <span>Name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Display name" />
        </label>
        <label className="settings__field">
          <span>Handle</span>
          <input value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="@username" />
        </label>
        <label className="settings__field">
          <span>Profile Photo URL</span>
          <input value={photoURL} onChange={(event) => setPhotoURL(event.target.value)} placeholder="https://..." />
        </label>
        <div className="settings__actions">
          <button className="btn btn--primary" type="submit" disabled={isSavingProfile}>
            {isSavingProfile ? 'Saving...' : 'Save Profile'}
          </button>
          {profileMessage && <p className="settings__message">{profileMessage}</p>}
        </div>
      </form>

      <form className="settings__card" onSubmit={onPasswordChange}>
        <h3>Account</h3>
        <label className="settings__field">
          <span>Change Password</span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="New password"
            minLength={6}
          />
        </label>
        <div className="settings__actions">
          <button className="btn btn--primary" type="submit" disabled={isChangingPassword || !newPassword.trim()}>
            {isChangingPassword ? 'Updating...' : 'Update Password'}
          </button>
          {passwordMessage && <p className="settings__message">{passwordMessage}</p>}
        </div>
      </form>

      <section className="settings__card">
        <h3>Appearance</h3>
        <div className="settings__themes">
          <button
            type="button"
            className={`pill-button${theme === 'light' ? ' is-active' : ''}`}
            onClick={() => onThemeChange('light')}
          >
            Light
          </button>
          <button
            type="button"
            className={`pill-button${theme === 'dark' ? ' is-active' : ''}`}
            onClick={() => onThemeChange('dark')}
          >
            Dark
          </button>
        </div>
      </section>
    </section>
  )
}

export default Settings
