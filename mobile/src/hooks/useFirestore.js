import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, getDoc, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Hook to subscribe to a Firestore collection
 * @param {string} collectionName 
 * @param {Array} queryConstraints - Optional array of query constraints
 */
export const useFirestoreCollection = (collectionName, queryConstraints = []) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        try {
            const ref = collection(db, collectionName);
            const q = queryConstraints.length > 0 ? query(ref, ...queryConstraints) : ref;

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const documents = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setData(documents);
                setLoading(false);
            }, (err) => {
                console.error("Firestore Error:", err);
                setError(err);
                setLoading(false);
            });

            return () => unsubscribe();
        } catch (err) {
            setError(err);
            setLoading(false);
        }
    }, [collectionName, JSON.stringify(queryConstraints)]);

    return { data, loading, error };
};

/**
 * Hook to fetch a single document
 */
export const useFirestoreDocument = (collectionName, docId) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!docId) return;

        const unsub = onSnapshot(doc(db, collectionName, docId), (doc) => {
            if (doc.exists()) {
                setData({ id: doc.id, ...doc.data() });
            } else {
                setData(null);
            }
            setLoading(false);
        });

        return () => unsub();
    }, [collectionName, docId]);

    return { data, loading };
};
