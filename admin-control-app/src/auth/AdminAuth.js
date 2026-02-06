/**
 * Admin Authentication
 * Controls access to the admin panel
 */

import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';

// ADMIN EMAILS - Only these emails can access the admin panel
const ADMIN_EMAILS = [
    'divyanshkotak04@gmail.com',
];

/**
 * Check if a user is an admin
 */
export const isAdmin = (user) => {
    if (!user || !user.email) return false;
    return ADMIN_EMAILS.includes(user.email.toLowerCase());
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        if (!isAdmin(result.user)) {
            await signOut(auth);
            throw new Error('Unauthorized: You do not have admin access');
        }
        return result.user;
    } catch (error) {
        console.error('Sign in error:', error);
        throw error;
    }
};

/**
 * Sign out
 */
export const signOutAdmin = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
};

/**
 * Listen to auth state changes
 */
export const onAdminAuthStateChanged = (callback) => {
    return onAuthStateChanged(auth, (user) => {
        if (user && isAdmin(user)) {
            callback(user);
        } else {
            callback(null);
        }
    });
};
