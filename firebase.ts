// Fix: Use Firebase v9+ compat libraries to match the v12 SDK from importmap and resolve the module export error.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";

// The v8 SDK attaches the User type to the firebase namespace.
// The original `import { User as FirebaseUser } from "firebase/auth"` is v9 syntax.
type FirebaseUser = firebase.User;


// =================================================================================================
// Firebase Configuration
// =================================================================================================
// The API key below was provided by the user. It has been wrapped in quotes to fix the ReferenceError.
// =================================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyC6YqwocJZqxa98SZsJpK1dGeCOcUKknhM",
  authDomain: "alumni-bookkeeping-app.firebaseapp.com",
  projectId: "alumni-bookkeeping-app",
  storageBucket: "alumni-bookkeeping-app.firebasestorage.app",
  messagingSenderId: "485182693022",
  appId: "1:485182693022:web:0b32398f891aa797fa658f"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize and export services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const googleProvider = new firebase.auth.GoogleAuthProvider();
const Timestamp = firebase.firestore.Timestamp;

// Export everything needed by the app
export {
  auth,
  db,
  storage,
  googleProvider,
  Timestamp,
};

export type { FirebaseUser };