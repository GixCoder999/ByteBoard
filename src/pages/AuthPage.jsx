import { useState } from 'react'
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '../firebase/auth.js'
import './AuthPage.css'
import { doc, getDoc } from 'firebase/firestore'
import db from '../firebase/firestore.js'

const getFriendlyError = (error) => {
  if (!error?.code) return 'Something went wrong. Please try again.'

  switch (error.code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/invalid-credential':
      return 'Incorrect email or password.'
    case 'auth/email-already-in-use':
      return 'That email is already in use.'
    case 'auth/handle-already-in-use':
      return 'That handle is already taken.'
    case 'auth/invalid-handle':
      return 'Handle must be 3-20 chars and use letters, numbers, dot, or underscore.'
    case 'auth/invalid-age':
      return 'Please enter a valid age between 13 and 120.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.'
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.'
    default:
      return error.message || 'Authentication failed.'
  }
}

const AuthPage = ({ onUserDataLoaded }) => {
  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [age, setAge] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isSignIn = mode === 'signin'

  const resetError = () => setError('')

  const fetchUserData = async (uid) => {
    if (!uid) return null

    try {
      const userSnapshot = await getDoc(doc(db, 'users', uid))

      if (!userSnapshot.exists()) {
        onUserDataLoaded?.(null)
        return null
      }

      const profile = { id: userSnapshot.id, ...userSnapshot.data() }
      onUserDataLoaded?.(profile)
      return profile
    }
    catch (err) {
      console.log(err)
      onUserDataLoaded?.(null)
      return null
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      const credential = await signInWithGoogle()
      await fetchUserData(credential?.user?.uid)
    } catch (err) {
      setError(getFriendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!isSignIn && password !== confirmPassword) {
        throw new Error('Passwords do not match.')
      }

      if (!isSignIn) {
        const normalizedHandle = handle.trim().replace(/^@+/, '')
        if (!/^[a-zA-Z0-9._]{3,20}$/.test(normalizedHandle)) {
          throw new Error('Handle must be 3-20 chars and use letters, numbers, dot, or underscore.')
        }

        const numericAge = Number(age)
        if (!Number.isInteger(numericAge) || numericAge < 13 || numericAge > 120) {
          throw new Error('Please enter a valid age between 13 and 120.')
        }
      }

      if (isSignIn) {
        const credential = await signInWithEmail(email.trim(), password)
        await fetchUserData(credential?.user?.uid)
      } else {
        const credential = await signUpWithEmail(email.trim(), password, name, handle, age)
        await fetchUserData(credential?.user?.uid)
      }
    } catch (err) {
      setError(getFriendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-card__header">
          <p className="auth-card__eyebrow">Welcome to ByteBoard</p>
          <h1>{isSignIn ? 'Sign in' : 'Create account'}</h1>
          <p>
            {isSignIn
              ? 'Sign in with Google or email/password.'
              : 'Sign up with email and password.'}
          </p>
        </div>

        {isSignIn && (
          <button
            className="auth-google"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M12 10.2v3.95h5.5c-.24 1.27-.96 2.35-2.04 3.08l3.3 2.56c1.92-1.77 3.03-4.38 3.03-7.49 0-.73-.07-1.44-.2-2.12H12z"
              />
              <path
                fill="#34A853"
                d="M12 22c2.7 0 4.97-.9 6.63-2.43l-3.3-2.56c-.9.6-2.06.97-3.33.97-2.56 0-4.73-1.73-5.5-4.05H3.1v2.65A10 10 0 0012 22z"
              />
              <path
                fill="#4A90E2"
                d="M6.5 13.93A6.07 6.07 0 016.2 12c0-.67.1-1.32.3-1.93V7.42H3.1A10 10 0 002 12c0 1.6.38 3.12 1.1 4.51l3.4-2.58z"
              />
              <path
                fill="#FBBC05"
                d="M12 6.03c1.48 0 2.8.5 3.84 1.48l2.88-2.88A9.58 9.58 0 0012 2 10 10 0 003.1 7.42l3.4 2.65c.77-2.32 2.95-4.04 5.5-4.04z"
              />
            </svg>
            Continue with Google
          </button>
        )}

        <div className="auth-card__divider">
          <span>{isSignIn ? 'or use email' : 'email sign up'}</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isSignIn && (
            <label>
              Full Name
              <input
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  resetError()
                }}
                placeholder="Your name"
              />
            </label>
          )}

          {!isSignIn && (
            <label>
              Handle
              <input
                type="text"
                value={handle}
                onChange={(event) => {
                  setHandle(event.target.value)
                  resetError()
                }}
                placeholder="@yourname"
                required
              />
            </label>
          )}

          {!isSignIn && (
            <label>
              Age
              <input
                type="number"
                value={age}
                onChange={(event) => {
                  setAge(event.target.value)
                  resetError()
                }}
                placeholder="18"
                min={13}
                max={120}
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                resetError()
              }}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                resetError()
              }}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </label>

          {!isSignIn && (
            <label>
              Confirm Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value)
                  resetError()
                }}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </label>
          )}

          {error && <p className="auth-form__error">{error}</p>}

          <button className="btn btn--primary auth-form__submit" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : isSignIn ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="auth-card__switch">
          {isSignIn ? 'New here?' : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(isSignIn ? 'signup' : 'signin')
              setError('')
              setPassword('')
              setConfirmPassword('')
            }}
          >
            {isSignIn ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </section>
    </main>
  )
}

export default AuthPage
