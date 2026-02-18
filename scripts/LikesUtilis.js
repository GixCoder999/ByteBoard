import { 
    doc, updateDoc, increment, getDoc,
    setDoc, serverTimestamp, deleteDoc
} 
from 'firebase/firestore';
import db from '../src/firebase/firestore.js';

export const checkIfUserLikedPost = async (postId, userId) => {
  if (!postId || !userId) return false;
   
  try {
    const likeDoc = doc(db, 'Likes', `${userId}_${postId}`);
    const likeSnapshot = await getDoc(likeDoc);
    console.log(likeSnapshot);
    return likeSnapshot.exists();
  }
  catch (error) {
    console.error("Error checking if user liked post: ", error);
    return false;
  }
}

export const updateLikeDetails = async (postId, userId, postOwnerId, likerName) => {
  if (!postId || !userId || !postOwnerId) return { status: 'error' };

  try {
    const likeRef = doc(db, 'Likes', `${userId}_${postId}`);
    const alreadyLiked = await checkIfUserLikedPost(postId, userId);

    if (alreadyLiked) {
      await deleteDoc(likeRef);
      await updateDoc(doc(db, 'posts', postId), {
        LikesCount: increment(-1)
      });
      console.log("Unlike details updated successfully for postId: ", postId, " and userId: ", userId);
      return { status: 'unliked' };
    }

    // Add a document to the Likes collection to track that this user has liked this post
    await setDoc(likeRef, {
      userId,
      postId,
      postOwnerId,
      likerName: (likerName || '').trim() || 'Someone',
      timestamp: serverTimestamp()
    });
    await updateLikesCount(postId);
    console.log("Like details updated successfully for postId: ", postId, " and userId: ", userId);
    
    return { status: 'liked' };
  }
  catch (error) {
    console.error("Error updating like details: ", error);
    return { status: 'error', error };
  }
}

export const updateLikesCount = async (postId) => {
  if (!postId) return;

  const postRef = doc(db, 'posts', postId);
  
  try {
    await updateDoc(postRef, {
      LikesCount: increment(1)
    });
    console.log("Likes count updated successfully for postId: ", postId);
  } 
  catch (error) {
    console.error("Error updating likes count: ", error);
  }
}
