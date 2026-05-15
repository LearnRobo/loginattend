import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBkHkFMJGx_NuC0vcAGo4sD7I-HH3Bo0jw",
  authDomain: "attendace-logincode.firebaseapp.com",
  projectId: "attendace-logincode",
  storageBucket: "attendace-logincode.firebasestorage.app",
  messagingSenderId: "268399916280",
  appId: "1:268399916280:web:7628ad1e34bfe5241f370d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
