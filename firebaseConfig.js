
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCSFKpWN5an3o5CDaG2Kgku-lHztXCojs",
  authDomain: "flutter-frontend-21d0a.firebaseapp.com",
  projectId: "flutter-frontend-21d0a",
  storageBucket: "flutter-frontend-21d0a.firebasestorage.app",
  messagingSenderId: "511656353816",
  appId: "1:511656353816:web:9d9e67fed63f081185236d",
  measurementId: "G-6NGX7TWPNJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
