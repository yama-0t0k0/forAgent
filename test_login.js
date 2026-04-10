const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyBCSFKpWN5an3o5CDaG2Kgku-lHztXCojs",
  authDomain: "flutter-frontend-21d0a.firebaseapp.com",
  projectId: "flutter-frontend-21d0a",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

signInWithEmailAndPassword(auth, "t.sameshima@lat-inc.com", "LatAdmin2026!")
  .then((userCredential) => {
    console.log("Logged in successfully:", userCredential.user.uid);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Login failed:", error);
    process.exit(1);
  });
