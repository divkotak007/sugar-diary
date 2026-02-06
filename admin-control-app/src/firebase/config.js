/**
 * Firebase Configuration for Admin Control App
 * Uses the same Firebase project as Sugar Diary for config storage
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAAmGSRYXVfTL9iDNPPf7vtvGeIsna4MiI",
    authDomain: "sugerdiary.firebaseapp.com",
    projectId: "sugerdiary",
    storageBucket: "sugerdiary.firebasestorage.app",
    messagingSenderId: "467564721006",
    appId: "1:467564721006:web:bf4720ad00e356c841477f"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// App IDs
export const SUGAR_DIARY_APP_ID = 'sugar-diary-v1';
export const ADMIN_CONFIG_COLLECTION = 'admin_config';
