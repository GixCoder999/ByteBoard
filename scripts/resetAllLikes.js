import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import db from '../src/firebase/firestore.js';

const resetAllLikes = async () => {
  try {
    const postsSnapshot = await getDocs(collection(db, 'posts'));
    const batch = writeBatch(db);

    postsSnapshot.forEach((postDoc) => {
      const postRef = doc(db, 'posts', postDoc.id);
      batch.update(postRef, { LikesCount: 0 });
    });

    await batch.commit();
    console.log("All LikesCount fields have been reset to 0.");
  } catch (error) {
    console.error("Error resetting LikesCount: ", error);
  }
};

resetAllLikes();
