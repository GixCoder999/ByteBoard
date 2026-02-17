import './SavedPosts.css'
import PostCard from './PostCard'
import { useEffect, useState } from 'react'
import db from '../firebase/firestore.js'
import { collection, getDocs, documentId, query, where } from 'firebase/firestore'
import { parseSnapshot, formatTimestamp } from '../../scripts/utilis.js'

const SavedPosts = ({ savedPosts, setSavedPosts, currentUser }) => {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    async function fetchSavedPosts() {
      try {
        if (savedPosts.length === 0) {
          setPosts([]) // Clear posts if no saved posts
          return
        }

        const q = query(collection(db,'posts'), where(documentId(), "in", savedPosts));
        const response = await getDocs(q);
        
        if (response.empty) {
          console.log("No saved posts found.");
          setPosts([]) // Clear posts if no saved posts found
        } 
        else {
          const parsedPosts = parseSnapshot(response);
          console.log("Fetched saved posts: ", parsedPosts);
          setPosts(parsedPosts);
        }
      }
      catch (err) {
        console.error("Error fetching saved posts: ", err)
      }
    }

    fetchSavedPosts()
  }, [savedPosts]);
 
  return (
    <section className="saved-posts">
      <header className="saved-posts__header">
        <h2>Saved Posts</h2>
        <p>{savedPosts.length} saved</p>
      </header>

      {savedPosts.length === 0 && (
        <div className="saved-posts__empty">
          You have not saved any posts yet.
        </div>
      )}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          {...post}
          timestamp={formatTimestamp(post.timestamp)}
          isSaved={savedPosts.includes(post.id)}
          setSavedPosts={setSavedPosts}
          currentUser={currentUser}
        />
      ))}
    </section>
  )
}

export default SavedPosts
