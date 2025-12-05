import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";

// =================================================================================================
// IMPORTANT: Replace the placeholder configuration below with your app's Firebase project details.
// You can find this in your Firebase project settings.
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
const app = initializeApp(firebaseConfig);

// Initialize and export services
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Export everything needed by the app
export { 
  auth, 
  db, 
  googleProvider,
  // Auth
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  // Firestore
  collection,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  getDocs,
  Timestamp,
};

export type { FirebaseUser };
