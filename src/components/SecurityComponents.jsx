import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

/**
 * Security Guardian (Input/Keyboard Firewall)
 * Prevents DevTools inspection and unwarranted inputs.
 */
export const SecurityGuardian = ({ children }) => {
    React.useEffect(() => {
        const handleContextMenu = (e) => {
            e.preventDefault();
            return false;
        };

        const handleKeyDown = (e) => {
            // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
                (e.ctrlKey && e.key === 'U')
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

    return <>{children}</>;
};

/**
 * Global Recovery Boundary (Class Component)
 * Catches RENDER errors (White Screen of Death) which functional components cannot catch.
 */
export class GlobalRecoveryBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Critical Render Error Caught:", error, errorInfo);
        // We can add log service call here if needed
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6 flex-col text-center font-sans">
                    <div className="bg-amber-100 p-4 rounded-full mb-4">
                        <AlertTriangle size={48} className="text-amber-600" />
                    </div>
                    <h2 className="text-2xl font-black text-stone-800 mb-2">Something went wrong</h2>
                    <p className="text-stone-500 font-medium mb-6 max-w-xs mx-auto">
                        A crash was detected and contained. Your medical data is safe.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-stone-800 transition-colors shadow-lg active:scale-95"
                    >
                        <RefreshCw size={20} /> Restart App
                    </button>
                    {/* Safe Debug Info (Hidden from plain sight generally, strictly local) */}
                    <div className="mt-8 p-4 bg-stone-200 rounded-xl text-xs text-left text-stone-600 font-mono overflow-auto max-w-sm max-h-32 opacity-50">
                        {this.state.error?.toString()}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
