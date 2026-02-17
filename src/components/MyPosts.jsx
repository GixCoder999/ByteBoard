import './MyPosts.css'
import CreatePostCard from './CreatePostCard'
import PostCard from './PostCard'
import { useEffect } from 'react'
import db from '../firebase/firestore.js'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { useState } from 'react'
import { parseSnapshot,formatTimestamp } from '../../scripts/utilis.js'

const MyPosts = ({ savedPosts = [], setSavedPosts = () => {}, currentUser })=>{
  const [posts, setPosts] = useState([]);
  const [postsCount,setPostsCount] = useState(0);

  useEffect(()=>{
    const fetchPosts = async () => {
      if (!currentUser?.uid) {
        setPosts([]);
        setPostsCount(0);
        return
      }

      try {
        const que = query(collection(db, 'posts'), where('authId', '==', currentUser.uid));
        const snapshot = await getDocs(que);

        if (snapshot.empty) {
          setPosts([]);
          setPostsCount(0);
        }

        const postsData = parseSnapshot(snapshot);

        console.log('Fetched posts:', postsData);

        setPosts(postsData);
        setPostsCount(postsData.length);
      }
      catch (error) {
        console.error('Error fetching posts:', error)
      }
    }

    fetchPosts();
  },[currentUser]);

  return (
    <section className="my-posts">
      <header className="my-posts__header">
        <div>
          <p className="my-posts__eyebrow">Your space</p>
          <h2>My Posts</h2>
        </div>
        <div className="my-posts__stats">
          <span className="my-posts__stat">
            <strong>{postsCount}</strong>
            <small>Posts</small>
          </span>
        </div>
      </header>

      <div className="my-posts__composer">
        <CreatePostCard currentUser={currentUser} />
      </div>

      <div className="my-posts__list">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            {...post}
            isSaved={savedPosts.includes(post.id)}
            setSavedPosts={setSavedPosts}
            timestamp={formatTimestamp(post.timestamp)}
            currentUser={currentUser}
          />
        ))}
      </div>
    </section>
  )      
}

export default MyPosts;
