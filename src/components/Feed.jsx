import CreatePostCard from './CreatePostCard'
import PostCard from './PostCard'
import './Feed.css'
import { useState, useEffect } from 'react'
import db from '../firebase/firestore.js'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { parseSnapshot,formatTimestamp } from '../../scripts/utilis.js'

const Feed = ({savedPosts, setSavedPosts, currentUser}) => {

  const  [posts,setPosts] = useState([]);

  useEffect(() => {
      async function fetchPosts(snapshot) {
        try {
          if (snapshot.empty) {
            console.log("No posts found.");
          } 
          else {
            const parsedPosts = parseSnapshot(snapshot);
            console.log(parsedPosts);
            setPosts(parsedPosts);
          }
        }
        catch (error) {
          console.error("Error fetching posts:", error);
        }
      }
      
      const  q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
      
      const unsubscribe = onSnapshot(q, (snapshot)=>{
        fetchPosts(snapshot);
      });

      return () => unsubscribe();

  },[]);

  return (
    <section className="feed">
      <CreatePostCard currentUser={currentUser} />
      
      {posts.map((post) => (
        <PostCard key={post.id} {...post} timestamp={formatTimestamp(post.timestamp)}
         isSaved={savedPosts.includes(post.id)} setSavedPosts={setSavedPosts} currentUser={currentUser}
        />
      ))}

      <div className="feed__skeletons">
        {[1, 2, 3].map((item) => (
          <div key={item} className="skeleton-card">
            <div className="skeleton-line short" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
          </div>
        ))}
      </div>
    </section>
  )
}

export default Feed
