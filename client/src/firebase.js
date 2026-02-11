import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBY0qdTeF2azQodjEuM5eh_RrQe-AaG7JE",
    authDomain: "horsedashboard.firebaseapp.com",
    projectId: "horsedashboard",
    storageBucket: "horsedashboard.firebasestorage.app",
    messagingSenderId: "697763821845",
    appId: "1:697763821845:web:6ca9d4035721a50d38511c",
    measurementId: "G-8D9VR99Y05"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const firestoreDb = getFirestore(app);
