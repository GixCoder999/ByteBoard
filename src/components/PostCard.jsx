import './PostCard.css'
import { useEffect, useRef, useState } from 'react'
import db from '../firebase/firestore.js'
import { 
  doc, getDoc, updateDoc,
  deleteDoc, setDoc, serverTimestamp 
} 
from 'firebase/firestore'
import { checkIfUserLikedPost, updateLikeDetails } from '../../scripts/LikesUtilis.js';

const DEFAULT_AVATAR = 'https://i.pravatar.cc/80?img=8'
const authorCache = new Map()

const isAuthor = (authId, currentUser) => {
  return currentUser?.uid === authId; // UX only, real security is determined by Firebase security rules
}

const PostCard = ({
  id,
  username = 'Demi Pearson',
  handle = '@demi.p',
  timestamp = '2h ago',
  text = 'Just shipped a new UI kit for our team. Loving how calm this palette feels across the feed! What do you think?',
  image,
  code,
  LikesCount = 0,
  isSaved = false,
  setSavedPosts,
  currentUser,
  authId
}) => {
  const [likes, setLikes] = useState(LikesCount);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [saved,setSaved] = useState(isSaved);
  const [postText, setPostText] = useState(text);
  const [postCode, setPostCode] = useState(code || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editText, setEditText] = useState(text);
  const [editCode, setEditCode] = useState(code || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [authorData, setAuthorData] = useState({
    username,
    handle,
    photoURL: DEFAULT_AVATAR
  });
  const isSavingRef = useRef(false);

  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  useEffect(() => {
    let isMounted = true;
    const loadLikeState = async () => {
      if (!id || !currentUser?.uid) {
        if (isMounted) setIsLiked(false);
        return;
      }
      const liked = await checkIfUserLikedPost(id, currentUser.uid);
      if (isMounted) setIsLiked(liked);
    };

    loadLikeState();
    return () => {
      isMounted = false;
    };
  }, [id, currentUser]);

  useEffect(() => {
    setPostText(text);
    setEditText(text);
  }, [text]);

  useEffect(() => {
    setPostCode(code || '');
    setEditCode(code || '');
  }, [code]);
  useEffect(() => {
    setAuthorData({
      username,
      handle,
      photoURL: DEFAULT_AVATAR
    });
  }, [username, handle]);
  useEffect(() => {
    let isMounted = true;

    const loadAuthorData = async () => {
      if (!authId) return;

      const cachedAuthor = authorCache.get(authId);
      if (cachedAuthor) {
        if (isMounted) setAuthorData(cachedAuthor);
        return;
      }

      try {
        const userSnapshot = await getDoc(doc(db, 'users', authId));
        if (!userSnapshot.exists()) return;

        const user = userSnapshot.data();
        const nextAuthor = {
          username: user?.name || username,
          handle: user?.handle || handle,
          photoURL: user?.photoURL || DEFAULT_AVATAR
        };
        authorCache.set(authId, nextAuthor);
        if (isMounted) setAuthorData(nextAuthor);
      } catch (error) {
        console.error('Failed to fetch post author profile:', error);
      }
    };

    loadAuthorData();
    return () => {
      isMounted = false;
    };
  }, [authId, username, handle]);

  const onLike = async () => { 
    if (!id || !currentUser?.uid || isLiking) return;
    setIsLiking(true);
  
    const status = await updateLikeDetails(id, currentUser?.uid);
    if (status?.status === 'liked') {
      setIsLiked(true);
      setLikes((value) => value + 1);
    } 
    else if (status?.status === 'unliked') {
      setIsLiked(false);
      setLikes((value) => Math.max(0, value - 1));
    }
    setIsLiking(false);
  };

  const toggleSave = async () => {
    if (!currentUser?.uid || !id) return;
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);
    try {
      const saveDocId = `${currentUser.uid}_${id}`;

      if (saved) {
        await deleteDoc(doc(db, 'SavedPosts', saveDocId));
        setSavedPosts(prev => prev.filter(postId => postId!==id));
        setSaved(false);
      }
      else {
        // save
        await setDoc(doc(db, 'SavedPosts', saveDocId), {
          userId: currentUser.uid,
          id,
          timestamp: serverTimestamp()
        });
        setSaved(true);
        setSavedPosts(prev => (prev.includes(id) ? prev : [...prev, id]));
      }
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }

  const openEditModal = () => {
    setEditText(postText || '');
    setEditCode(postCode || '');
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    if (isUpdating) return;
    setIsEditOpen(false);
  };

  const onEditSubmit = async (event) => {
    event.preventDefault();
    if (!id || isUpdating) return;

    const nextText = editText.trim();
    const nextCode = editCode.trim();
    if (!nextText && !nextCode) return;

    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'posts', id), {
        text: nextText,
        code: nextCode,
        updatedAt: serverTimestamp()
      });
      setPostText(nextText);
      setPostCode(nextCode);
      setIsEditOpen(false);
    } catch (error) {
      console.error('Failed to update post:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <article className="post-card">
      <header className="post-card__header">
        <img src={authorData.photoURL || DEFAULT_AVATAR} alt={authorData.username || username} />
        <div>
          <div className="post-card__name">{authorData.username || username}</div>
          <div className="post-card__meta">{authorData.handle || handle} • {timestamp}</div>
        </div>
      </header>

      <p className="post-card__text">{postText}</p>

      {image && (
        <img className="post-card__image" src={image} alt="Post" />
      )}

      {postCode && (
        <pre className="post-card__code">
          <code>{postCode}</code>
        </pre>
      )}

      <footer className="post-card__footer">
        <button
          className={`icon-pill post-card__like-button ${isLiked ? 'is-liked' : ''}`}
          onClick={onLike}
          disabled={isLiking}
          aria-pressed={isLiked}
          aria-label={isLiked ? 'Unlike post' : 'Like post'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span className="post-card__like-count">{likes}</span>
        </button>

        <button
          className={`icon-pill ${saved ? 'saved' : ''}`}
          onClick={toggleSave}
          disabled={isSaving}
          aria-busy={isSaving}
        >
          {isSaving ? (saved ? 'Unsaving...' : 'Saving...') : (saved ? 'Unsave' : 'Save')}
        </button>

        {isAuthor(authId,currentUser) && (
          <button className="icon-pill" onClick={openEditModal}>Edit</button>
        )}
      </footer> 

      {isEditOpen && (
        <div className="post-edit-modal" onClick={closeEditModal} role="dialog" aria-modal="true">
          <div className="post-edit-modal__content" onClick={(event) => event.stopPropagation()}>
            <h3>Edit Post</h3>
            <form className="post-edit-modal__form" onSubmit={onEditSubmit}>
              <textarea
                value={editText}
                onChange={(event) => setEditText(event.target.value)}
                placeholder="Update your post text..."
                rows={4}
              />
              <textarea
                value={editCode}
                onChange={(event) => setEditCode(event.target.value)}
                placeholder="Update code (optional)..."
                rows={5}
              />
              <div className="post-edit-modal__actions">
                <button type="button" className="btn btn--ghost" onClick={closeEditModal} disabled={isUpdating}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={isUpdating || (!editText.trim() && !editCode.trim())}
                >
                  {isUpdating ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </article>
  )
}
export default PostCard;
