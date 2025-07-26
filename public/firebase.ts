import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6xDfTTIV9cTj3r2TYDyB7I_7KiWmrQys",
  authDomain: "oficina-promotienda.firebaseapp.com",
  projectId: "oficina-promotienda",
  storageBucket: "oficina-promotienda.firebasestorage.app",
  messagingSenderId: "261291434764",
  appId: "1:261291434764:web:aa9bc15b10717875021f29",
  measurementId: "G-PSB6H7NJWY"
};

// Initialize Firebase, creating a new app instance only if one doesn't already exist.
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();
const googleAuthProvider = new firebase.auth.GoogleAuthProvider();

// Requesting scopes for Google Drive API access
googleAuthProvider.addScope('https://www.googleapis.com/auth/drive');

export { db, auth, googleAuthProvider };