import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import db from "../src/firebase/firestore.js";

const seedPosts = async () => {

  const dummyPosts = [
    {
      text: "Testing Snapshots Listener Again. Sorry for spam!",
      username: "Muhammad Rohail",
      handle: "@mrohail",
      authId: "1",
      code: 'cout<<"I m sorry";',
      image: ""
    },
    {
      text: "Second post for testing snapshot listener again. Sorry for spam!",
      username: "Muhammad Rohail",
      handle: "@mrohail",
      authId: "1",
      code: "",
      image: ""
    }
  ];

  for (const post of dummyPosts) {
    await addDoc(collection(db, "posts"), {
      ...post,
      timestamp: serverTimestamp()
    });
  }

  console.log("Seed complete 🚀");
};

seedPosts();
