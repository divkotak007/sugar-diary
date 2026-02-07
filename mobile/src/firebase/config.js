import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuration from existing web project
const firebaseConfig = {
    apiKey: "AIzaSyAAmGSRYXVfTL9iDNPPf7vtvGeIsna4MiI",
    authDomain: "sugerdiary.firebaseapp.com",
    projectId: "sugerdiary",
    storageBucket: "sugerdiary.firebasestorage.app",
    messagingSenderId: "467564721006",
    appId: "1:467564721006:web:bf4720ad00e356c841477f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
