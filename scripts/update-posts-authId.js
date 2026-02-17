/* global process */
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import db from "../src/firebase/firestore.js";

const TARGET_HANDLE = "@mrohail";
const TARGET_AUTH_ID = "1";

const updatePostsAuthId = async () => {
  const snapshot = await getDocs(collection(db, "posts"));

  if (snapshot.empty) {
    console.log("No posts found.");
    return;
  }

  const batch = writeBatch(db);
  let updatedCount = 0;
  let mrohailCount = 0;

  snapshot.forEach((postDoc) => {
    const data = postDoc.data();
    const hasAuthId = Object.prototype.hasOwnProperty.call(data, "authId");

    if (data.handle === TARGET_HANDLE) {
      batch.update(doc(db, "posts", postDoc.id), { authId: TARGET_AUTH_ID });
      updatedCount += 1;
      mrohailCount += 1;
      return;
    }

    if (!hasAuthId) {
      batch.update(doc(db, "posts", postDoc.id), { authId: null });
      updatedCount += 1;
    }
  });

  if (updatedCount === 0) {
    console.log("No updates needed.");
    return;
  }

  await batch.commit();
  console.log(
    `Updated ${updatedCount} post(s). authId set to "${TARGET_AUTH_ID}" for ${mrohailCount} post(s).`
  );
};

updatePostsAuthId().catch((error) => {
  console.error("Failed to update posts authId:", error);
  process.exitCode = 1;
});
