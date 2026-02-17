import { useState } from 'react'
import './CreatePostCard.css'
import db from '../firebase/firestore.js'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

const CreatePostCard = ({ currentUser }) => {
  const [active, setActive] = useState('Text')
  const options = ['Text', 'Code']
  const [showCode, setShowCode] = useState(false)
  const [text, setText] = useState('')
  const [code, setCode] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!text.trim() && !code.trim()) return

    const fallbackName = currentUser?.email?.split('@')[0] || 'user'

    const newPost = {
      text: text.trim(),
      code: showCode ? code.trim() : '',
      timestamp: serverTimestamp(),
      username: currentUser?.displayName || fallbackName,
      handle: `@${fallbackName.toLowerCase()}`,
      image: '',
      authId: currentUser?.uid || ''
    }

    try {
      await addDoc(collection(db, 'posts'), newPost)
      setText('')
      setCode('')
      setShowCode(false)
      setActive('Text')
    } catch (err) {
      console.log('Failed to create post: ', err)
    }
  }

  return (
    <div className="create-post">
      <img
        className="create-post__avatar"
        src={currentUser?.photoURL || 'https://i.pravatar.cc/80?img=15'}
        alt={currentUser?.displayName || currentUser?.email || 'User'}
      />
      <form className="create-post__body" onSubmit={handleSubmit}>
        <div className="create-post__input">
          <input
            className="create-post__text"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share something..."
          />
          {showCode && (
            <textarea
              className="create-post__code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code..."
              rows={5}
            />
          )}
        </div>
        <div className="create-post__actions">
          {options.map((option) => (
            <button
              key={option}
              className={`pill-button${active === option ? ' is-active' : ''}`}
              onClick={() => {
                setActive(option)
                setShowCode(option === 'Code')
              }}
              type="button"
            >
              {option}
            </button>
          ))}
          <button className="btn btn--primary" type="submit">Create Post</button>
        </div>
      </form>
    </div>
  )
}

export default CreatePostCard;
