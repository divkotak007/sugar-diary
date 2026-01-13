/**
 * useAuth Hook
 * Handles Firebase authentication state management
 */

import { useState, useEffect, useCallback } from 'react';
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut as firebaseSignOut,
    signInWithCustomToken
} from 'firebase/auth';

/**
 * Custom hook for Firebase authentication
 * @param {object} app - Firebase app instance
 * @returns {object} Auth state and methods
 */
export const useAuth = (app) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            try {
                await auth.authStateReady();

                // Handle custom token if provided (for embedded environments)
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    try {
                        await signInWithCustomToken(auth, __initial_auth_token);
                    } catch (err) {
                        console.error('Custom token sign-in failed:', err);
                    }
                }
            } catch (err) {
                console.error('Auth initialization error:', err);
                setError(err);
            }
        };

        initAuth();

        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
            setError(null);
        }, (err) => {
            console.error('Auth state error:', err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [auth]);

    // Sign in with Google popup
    const signIn = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await signInWithPopup(auth, provider);
            return result.user;
        } catch (err) {
            console.error('Sign-in error:', err);
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [auth, provider]);

    // Sign out
    const signOut = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            await firebaseSignOut(auth);
        } catch (err) {
            console.error('Sign-out error:', err);
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [auth]);

    // Check if user is authenticated
    const isAuthenticated = !!user;

    // Get user display info
    const userInfo = user ? {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL
    } : null;

    return {
        user,
        userInfo,
        loading,
        error,
        isAuthenticated,
        signIn,
        signOut
    };
};

export default useAuth;
