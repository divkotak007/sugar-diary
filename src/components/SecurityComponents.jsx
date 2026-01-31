import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const SecurityGuardian = ({ children }) => {
    useEffect(() => {
        const handleContextMenu = (e) => {
            e.preventDefault();
            return false;
        };

        const handleKeyDown = (e) => {
            // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
            if (
                e.keyCode === 123 ||
                (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) ||
                (e.ctrlKey && e.keyCode === 85) ||
                (e.ctrlKey && e.keyCode === 83)
            ) {
                e.preventDefault();
                return false;
            }
        };

        window.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <div className="select-none h-full relative">
            {children}
        </div>
    );
};

const GlobalRecoveryBoundary = ({ children }) => {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const handleError = () => setHasError(true);
        window.addEventListener('error', handleError);
        return () => window.removeEventListener('error', handleError);
    }, []);

    if (hasError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6 flex-col text-center">
                <AlertTriangle size={64} className="text-amber-500 mb-4" />
                <h2 className="text-2xl font-black text-stone-800 mb-2">Something went wrong</h2>
                <p className="text-stone-400 font-bold mb-6">We detected a minor glitch. Your data is safe!</p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2"
                >
                    <RefreshCw size={20} /> Restart App
                </button>
            </div>
        );
    }
    return children;
};

export { SecurityGuardian, GlobalRecoveryBoundary };
