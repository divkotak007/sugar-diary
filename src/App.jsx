import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, signInWithCustomToken } from 'firebase/auth';
import {
    getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp,
    onSnapshot, query, orderBy, limit, deleteDoc, updateDoc
} from 'firebase/firestore';
import {
    BookOpen, ChevronDown, ChevronUp, Edit3, Plus, Trash2, X, Activity,
    AlertCircle, Calendar, Check, ChevronRight, Clock, Droplets,
    FileText, Home, LineChart, Lock, LogOut, Menu, MoreHorizontal,
    PieChart, Pill, PlusCircle, Settings, Smartphone, Stethoscope, Sun, Moon,
    Thermometer, TrendingUp, User, Video, Zap, Database, Download,
    AlertTriangle, CheckCircle2, Eye, Unlock, Baby, Volume2, VolumeX,
    Save, Syringe, ScrollText, ShieldAlert, RefreshCw
} from 'lucide-react';
import { getPrescriptionAlerts, MEDICATION_DATABASE, FREQUENCY_RULES } from './data/medications.js';
import { generateAllInsights } from './services/aiInsights.js';
import { calculateGMI } from './utils/graphCalculations.js';
import { TRANSLATIONS } from './data/translations.js';
import { TERMS_AND_CONDITIONS } from './data/terms.js';

// NOTE: jsPDF and autoTable are loaded dynamically via CDN in useEffect to prevent build errors.


// --- CONFIGURATION ---
const firebaseConfig = (typeof window !== 'undefined' && window.__firebase_config) ?
    JSON.parse(window.__firebase_config) : {
        apiKey: "AIzaSyAAmGSRYXVfTL9iDNPPf7vtvGeIsna4MiI",
        authDomain: "sugerdiary.firebaseapp.com",
        projectId: "sugerdiary",
        storageBucket: "sugerdiary.firebasestorage.app",
        messagingSenderId: "467564721006",
        appId: "1:467564721006:web:bf4720ad00e356c841477f",
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const appId = (typeof window !== 'undefined' && window.__app_id) ? window.__app_id : 'sugar-diary-v1';

// --- FALLBACK REMOVED: Using MEDICATION_DATABASE from imports ---

const INSULIN_FREQUENCIES = ["Bedtime", "Before Meals", "Twice Daily", "Once Daily", "SOS"];
const ALL_TIMINGS = ["Morning", "Breakfast", "Lunch", "Afternoon", "Evening", "Dinner", "Bedtime", "As Needed"];

const TAG_EMOJIS = {
    "Sick": "🤒", "Sweets": "🍬", "Heavy Meal": "🍔", "Exercise": "🏃", "Missed Dose": "❌", "Travel": "✈️",
    "Fasting": "⏳"
};


// --- HELPERS ---
const generateId = () => Math.random().toString(36).substr(2, 9);
const isActionLocked = (timestamp) => {
    if (!timestamp) return false;
    const dateObj = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    const ageInMinutes = (Date.now() - dateObj.getTime()) / 60000;
    return ageInMinutes > 30; // Locked if older than 30 mins
};

// --- SECURITY GUARDIAN (Firewall Layer) ---
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

// --- RECOVERY & INTERACTION ---
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

const triggerHaptic = (hapticsEnabled) => {
    if (hapticsEnabled && typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        try { window.navigator.vibrate(50); } catch (e) { /* ignore */ }
    }
};

const calculateAge = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

// --- COMPONENTS ---
const SettingsModal = ({ isOpen, onClose, compliance, onShare, profile, onSoftDelete, darkMode, setDarkMode, isHighContrast, setIsHighContrast, hapticsEnabled, setHapticsEnabled }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border border-stone-100 dark:border-stone-800 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-stone-50 dark:border-stone-800 flex justify-between items-center bg-stone-50/50 dark:bg-stone-800/50">
                    <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2"><Settings size={22} className="text-stone-400" /> Settings</h2>
                    <button onClick={onClose} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-full transition-colors"><X size={20} className="text-stone-400" /></button>
                </div>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Compliance Stats */}
                    <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl">
                        <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">7-Day Compliance</h3>
                        <div className="flex justify-around items-center">
                            <div className="text-center">
                                <div className="text-[8px] font-bold text-stone-400 uppercase mb-0.5">Oral</div>
                                <div className="text-sm font-black text-stone-600 dark:text-stone-300">{compliance.oral}%</div>
                            </div>
                            <div className="w-px h-6 bg-stone-200 dark:bg-stone-700" />
                            <div className="text-center">
                                <div className="text-[8px] font-bold text-stone-400 uppercase mb-0.5">Insulin</div>
                                <div className="text-sm font-black text-stone-600 dark:text-stone-300">{compliance.insulin}%</div>
                            </div>
                            <div className="w-px h-6 bg-stone-200 dark:bg-stone-700" />
                            <div className="text-center">
                                <div className="text-[8px] font-bold text-emerald-500 uppercase mb-0.5">Overall</div>
                                <div className="text-sm font-black text-emerald-600">{compliance.overall}%</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-1">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${darkMode ? 'bg-amber-100 text-amber-600' : 'bg-stone-100 text-stone-400'}`}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</div>
                                <span className="font-bold text-stone-700 dark:text-stone-300">Dark Mode</span>
                            </div>
                            <button onClick={() => setDarkMode(!darkMode)} className={`w-12 h-6 rounded-full transition-all relative ${darkMode ? 'bg-emerald-500' : 'bg-stone-300'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${darkMode ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-1 border-t border-stone-50 dark:border-stone-800 pt-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isHighContrast ? 'bg-blue-100 text-blue-600' : 'bg-stone-100 text-stone-400'}`}><Zap size={18} /></div>
                                <span className="font-bold text-stone-700 dark:text-stone-300">High Contrast</span>
                            </div>
                            <button onClick={() => setIsHighContrast(!isHighContrast)} className={`w-12 h-6 rounded-full transition-all relative ${isHighContrast ? 'bg-blue-500' : 'bg-stone-300'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isHighContrast ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-1 border-t border-stone-50 dark:border-stone-800 pt-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${hapticsEnabled ? 'bg-purple-100 text-purple-600' : 'bg-stone-100 text-stone-400'}`}><Smartphone size={18} /></div>
                                <span className="font-bold text-stone-700 dark:text-stone-300">Haptics</span>
                            </div>
                            <button onClick={() => setHapticsEnabled(!hapticsEnabled)} className={`w-12 h-7 rounded-full transition-all relative shadow-inner ${hapticsEnabled ? 'bg-emerald-500' : 'bg-stone-200'}`}>
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${hapticsEnabled ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 space-y-3">
                        <button onClick={onShare} className="w-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all">
                            <Lock size={18} /> Share Caregiver Link
                        </button>
                        <button onClick={onSoftDelete} className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all text-sm">
                            <Trash2 size={16} /> Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatBadge = ({ emoji, label, value, unit, color, onClick, updated }) => (

    <button onClick={() => { if (onClick) onClick(); }} className={`flex-shrink-0 p-4 rounded-2xl border-2 flex flex-col items-center min-w-[85px] transition-all relative ${updated ? 'bg-white dark:bg-stone-800 border-blue-400 shadow-md ring-2 ring-blue-50 dark:ring-blue-900/40' : 'bg-white dark:bg-stone-800 border-stone-100 dark:border-stone-700 hover:border-stone-200 dark:hover:border-stone-600'}`}>
        {updated && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-stone-800 animate-pulse" />}
        <span className="text-2xl mb-1 filter-none">{emoji}</span>
        <div className="font-bold text-stone-800 dark:text-stone-200 text-lg leading-none">{value || '-'}</div>
        <div className="text-xs text-stone-400 font-bold uppercase mt-1">{label}</div>
        {unit && <div className="text-[10px] text-stone-300 dark:text-stone-500 font-bold">{unit}</div>}
    </button>
);

const MealOption = ({ label, icon: Icon, selected, onClick }) => (
    <button onClick={onClick} className={`flex-1 py-4 px-3 rounded-2xl flex flex-col items-center gap-2 transition-all duration-200 border-2 touch-manipulation ${selected ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 text-amber-900 dark:text-amber-400 shadow-md scale-95' : 'bg-white dark:bg-stone-800 border-transparent text-stone-400 dark:text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-700'}`}>
        <Icon size={22} />
        <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
    </button>
);

const ContextTag = ({ label, icon: Icon, selected, onClick, color }) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-3 rounded-full border transition-all duration-200 text-xs font-bold uppercase touch-manipulation ${selected ? `bg-${color}-100 dark:bg-${color}-900/40 border-${color}-400 text-${color}-900 dark:text-${color}-400 shadow-sm scale-95 ring-1 ring-${color}-200 dark:ring-${color}-900` : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 hover:border-stone-300'}`}>
        <Icon size={16} /> {label}
    </button>
);

// Graph Component (Clickable, No Overflow)
const SimpleTrendGraph = ({ data, label, unit, color, normalRange, onClick }) => {
    if (!data || data.length < 2) return (
        <div onClick={onClick} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm cursor-pointer active:scale-95 transition-all">
            <div className="flex justify-between items-center mb-4"><span className="text-xs font-bold uppercase text-stone-500 flex items-center gap-1"><TrendingUp size={12} /> {label} Trend</span><span className="text-xs text-stone-300 font-bold">No Data</span></div>
            <div className="h-24 bg-stone-50 rounded-xl flex items-center justify-center text-stone-300 text-xs font-bold">Add more entries</div>
        </div>
    );

    // CORRECTION: Keep small chart to MAX 5 dots only
    const visibleData = data.slice(-5);

    const padding = 10;
    const height = 100;
    const width = 300; // Fixed width for viewBox

    const vals = visibleData.map(d => d.value);
    let min = Math.min(...vals) * 0.98;
    let max = Math.max(...vals) * 1.02;
    if (min === max) { min -= 1; max += 1; }
    const range = max - min;

    const points = visibleData.map((d, i) => {
        const x = padding + (i / (visibleData.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((d.value - min) / range) * (height - 2 * padding);
        return { x, y, value: d.value, date: d.date };
    });

    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
    const refY = normalRange ? height - padding - ((normalRange - min) / range) * (height - 2 * padding) : null;
    // Normal Range Rectangle Calculation
    const normalMinY = normalRange ? height - padding - ((normalRange * 1.1 - min) / range) * (height - 2 * padding) : 0;
    const normalMaxY = normalRange ? height - padding - ((normalRange * 0.9 - min) / range) * (height - 2 * padding) : height;
    const showNormalBand = normalRange && label !== "HbA1c";

    return (
        <div
            onClick={onClick}
            aria-label={`${label} progress trend chart`}
            className="bg-white dark:bg-stone-800 p-4 rounded-2xl border border-stone-100 dark:border-stone-700 shadow-sm relative overflow-hidden cursor-pointer active:scale-95 transition-all z-0"
        >
            <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase text-stone-500 dark:text-stone-400 flex items-center gap-1"><TrendingUp size={12} /> {label} Trend</span>
                <span className={`text-sm font-bold text-${color}-600 dark:text-${color}-400`}>{data[data.length - 1].value} {unit}</span>
            </div>
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-hidden pointer-events-none">
                {/* Grid lines */}
                {[0.2, 0.4, 0.6, 0.8].map(ratio => (
                    <line key={ratio} x1={padding} y1={height * ratio} x2={width - 2 * padding} y2={height * ratio} stroke="#d1d5db" strokeWidth="1" strokeDasharray="4" />
                ))}

                {/* Normal Range Band (Gray Dotted/Muted Background) */}
                {showNormalBand && (
                    <rect x={padding} y={normalMinY} width={width - 2 * padding} height={Math.max(0, normalMaxY - normalMinY)} fill={color === 'orange' ? '#fff7ed' : '#ecfdf5'} className="dark:fill-stone-700 dark:opacity-30" opacity="0.8" />
                )}

                {label === "HbA1c" && (
                    <g opacity="0.1">
                        <rect x={padding} y={height - padding - ((5.7 - min) / range) * (height - 2 * padding)} width={width - 2 * padding} height={((5.7 - 0) / range) * (height - 2 * padding)} fill="#10b981" />
                        <rect x={padding} y={height - padding - ((6.5 - min) / range) * (height - 2 * padding)} width={width - 2 * padding} height={((6.5 - 5.7) / range) * (height - 2 * padding)} fill="#f59e0b" />
                        <rect x={padding} y={0} width={width - 2 * padding} height={height - padding - ((6.5 - min) / range) * (height - 2 * padding)} fill="#ef4444" />
                    </g>
                )}
                {refY && refY > 0 && refY < height && (
                    <g>
                        <text x={width - padding} y={refY - 2} textAnchor="end" fontSize="8" fill="#6b7280" fontStyle="italic">Normal: {normalRange}</text>
                    </g>
                )}
                <polyline fill="none" stroke={color === 'orange' ? '#f97316' : color === 'purple' ? '#a855f7' : color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : '#10b981'} strokeWidth="4" points={polylinePoints} />
                {points.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={color === 'orange' ? '#f97316' : color === 'purple' ? '#a855f7' : color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : '#10b981'} strokeWidth="2" />
                    </g>
                ))}
            </svg>
            <div className="absolute bottom-1 right-2 text-[8px] text-stone-300 font-bold uppercase tracking-widest">Tap to Expand</div>
        </div>
    );
};

// Error Boundary Fallback for Graphs
const GraphErrorBoundary = ({ children }) => {
    try {
        return children;
    } catch (e) {
        return (
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 flex items-center justify-center h-24 text-stone-400 text-xs italic">
                Unable to load trend data safely.
            </div>
        );
    }
};

// Expanded Graph Modal
const ExpandedGraphModal = ({ data, color, label, unit, normalRange, onClose, fullHistory, onEdit, onDelete }) => {
    const containerRef = React.useRef(null);
    const [isLogOpen, setIsLogOpen] = useState(false);
    const height = 300;
    const padding = 40;

    // Crash Prevention
    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-[32px] w-full max-w-sm text-center">
                    <AlertCircle size={48} className="mx-auto text-stone-300 mb-4" />
                    <h3 className="text-xl font-bold text-stone-800 mb-2">No Data Points</h3>
                    <button onClick={onClose} className="bg-stone-900 text-white px-8 py-3 rounded-2xl font-bold">Close View</button>
                </div>
            </div>
        );
    }

    useEffect(() => {
        if (containerRef.current) containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }, [data]);

    const values = data.map(d => d.value);
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const dataRange = (dataMax - dataMin) || (dataMax * 0.1) || 1;
    const min = dataMin - (dataRange * 0.4);
    const max = dataMax + (dataRange * 0.4);
    const range = max - min || 1;

    const screenWidth = Math.min(window.innerWidth - 48, 600);
    const pointsPerView = 5;
    const pointSpacing = screenWidth / pointsPerView;
    const graphWidth = Math.max(screenWidth, data.length * pointSpacing);

    const points = data.map((d, i) => {
        const x = padding + (i / (data.length - 1 === 0 ? 1 : data.length - 1)) * (graphWidth - 2 * padding);
        const y = height - padding - ((d.value - min) / range) * (height - 2 * padding);
        return { x, y, val: d.value, date: d.date, id: d.id };
    });

    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

    // Filter history for this specific vital
    const vitalType = label.toLowerCase();
    const relevantLogs = [...fullHistory]
        .filter(log => {
            if (log.type === 'vital_update') {
                return log.updatedParams && log.updatedParams.includes(vitalType);
            }
            return log.snapshot?.profile?.[vitalType] !== undefined && log.snapshot?.profile?.[vitalType] !== null;
        })
        .sort((a, b) => {
            const ta = a.timestamp?.seconds || new Date(a.timestamp).getTime() / 1000 || 0;
            const tb = b.timestamp?.seconds || new Date(b.timestamp).getTime() / 1000 || 0;
            return tb - ta;
        });

    return (
        <div className="fixed inset-0 z-[100] bg-white overflow-y-auto animate-in fade-in flex flex-col">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-6 py-6 border-b border-stone-100 flex justify-between items-center">
                <div>
                    <h3 className={`text-2xl font-black text-${color}-600 uppercase tracking-tighter`}>{label} Trends</h3>
                    <p className="text-xs text-stone-400 font-bold uppercase">Read-Only Visualization</p>
                </div>
                <button onClick={onClose} className="p-3 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors"><X size={24} className="text-stone-600" /></button>
            </div>

            <div className="p-6 pb-0 overflow-hidden">
                <div ref={containerRef} className="w-full overflow-x-auto pb-6 scroll-smooth cursor-default overflow-y-hidden">
                    <div style={{ width: graphWidth, height }}>
                        <svg width={graphWidth} height={height} viewBox={`0 0 ${graphWidth} ${height}`} className="overflow-hidden pointer-events-none">
                            {[0.2, 0.4, 0.6, 0.8].map(ratio => (
                                <line key={ratio} x1={0} y1={height * ratio} x2={graphWidth} y2={height * ratio} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                            ))}
                            {label === "HbA1c" && (
                                <g opacity="0.05">
                                    <rect x={0} y={height - padding - ((5.7 - min) / range) * (height - 2 * padding)} width={graphWidth} height={((5.7 - 0) / range) * (height - 2 * padding)} fill="#10b981" />
                                    <rect x={0} y={height - padding - ((6.5 - min) / range) * (height - 2 * padding)} width={graphWidth} height={((6.5 - 5.7) / range) * (height - 2 * padding)} fill="#f59e0b" />
                                    <rect x={0} y={0} width={graphWidth} height={height - padding - ((6.5 - min) / range) * (height - 2 * padding)} fill="#ef4444" />
                                </g>
                            )}
                            <polyline fill="none" stroke={color === 'orange' ? '#f97316' : color === 'purple' ? '#a855f7' : color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : '#10b981'} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" points={polylinePoints} />
                            {points.map((p, i) => (
                                <g key={i}>
                                    <circle cx={p.x} cy={p.y} r="8" fill="white" stroke={color === 'orange' ? '#f97316' : color === 'purple' ? '#a855f7' : color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : '#10b981'} strokeWidth="4" />
                                    <text x={p.x} y={p.y - 20} textAnchor="middle" fontSize="14" fontWeight="900" fill="#1c1917">{p.val}</text>
                                    <text x={p.x} y={height - 5} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#78716c">{new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</text>
                                </g>
                            ))}
                        </svg>
                    </div>
                </div>
            </div>

            <div className="mt-auto bg-stone-50 rounded-t-[40px] shadow-inner transition-all duration-300">
                <button
                    onClick={() => setIsLogOpen(!isLogOpen)}
                    className="w-full flex justify-between items-center p-6 bg-white rounded-t-[40px] rounded-b-none border-b border-stone-100 group active:scale-[0.99] transition-all sticky top-0"
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 bg-${color}-50 rounded-2xl`}>
                            <ScrollText className={`text-${color}-600`} size={24} />
                        </div>
                        <div className="text-left">
                            <h4 className="text-xl font-black text-stone-800 tracking-tighter uppercase">History Logbook</h4>
                            <p className="text-xs font-bold text-stone-400">{relevantLogs.length} Records Documented</p>
                        </div>
                    </div>
                    {isLogOpen ? <ChevronDown size={24} className="text-stone-300" /> : <ChevronUp size={24} className="text-stone-300" />}
                </button>

                {isLogOpen && (
                    <div className="p-6 space-y-3 animate-in slide-in-from-bottom duration-300 max-h-[400px] overflow-y-auto">
                        {relevantLogs.map((log) => {
                            const dateObj = log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000) : new Date(log.timestamp);
                            const isLocked = (Date.now() - dateObj.getTime()) / 1000 < 1800;

                            return (
                                <div key={log.id} className="bg-white p-5 rounded-[24px] shadow-sm border border-stone-100 flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className="text-center bg-stone-50 py-2 px-3 rounded-2xl min-w-[64px]">
                                            <div className="text-[10px] font-black text-stone-400 uppercase leading-none">{dateObj.toLocaleDateString(undefined, { month: 'short' })}</div>
                                            <div className="text-lg font-black text-stone-800 leading-tight">{dateObj.getDate()}</div>
                                        </div>
                                        <div>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-black text-stone-800">{log.snapshot.profile[vitalType]}</span>
                                                <span className="text-xs font-bold text-stone-400 uppercase">{unit}</span>
                                            </div>
                                            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">Recorded at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onEdit(log, vitalType)}
                                            className="p-3 bg-stone-50 rounded-xl text-stone-400 hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-90"
                                            title="Edit Entry"
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(log.id)}
                                            disabled={isLocked}
                                            className={`p-3 rounded-xl transition-all active:scale-90 ${isLocked ? 'bg-stone-50 text-stone-200 cursor-not-allowed' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                            title={isLocked ? "Delete Locked (>30m required)" : "Delete Entry"}
                                        >
                                            {isLocked ? <Lock size={18} /> : <Trash2 size={18} />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {relevantLogs.length === 0 && (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BookOpen size={24} className="text-stone-300" />
                                </div>
                                <p className="text-stone-400 font-bold text-sm">No recorded history for {label} yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- CONSENT SCREEN ---
const ConsentScreen = ({ onConsent }) => {
    const [agreed, setAgreed] = useState(false);
    // PRELOADED TERMS
    const termsData = TERMS_AND_CONDITIONS;
    const loading = false;

    const iconMap = { Activity, ScrollText, ShieldAlert };
    const renderContent = (content) => content.map((part, idx) => <span key={idx} className={part.bold ? "font-bold" : ""}>{part.text}</span>);

    return (
        <div className="min-h-screen bg-stone-100 p-6 flex items-center justify-center font-sans">
            <div className="bg-white max-w-lg w-full rounded-[32px] shadow-2xl overflow-hidden border border-stone-200">
                <div className="bg-stone-900 p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldAlert className="text-amber-400" size={32} />
                        <h1 className="text-2xl font-serif font-bold">Medico-Legal Notice</h1>
                    </div>
                    <p className="text-stone-400 text-sm">Mandatory review required before use.</p>
                </div>
                <div className="p-8 h-96 overflow-y-auto space-y-6 text-stone-600 text-sm leading-relaxed border-b border-stone-100">
                    {loading ? (
                        <div className="text-center text-stone-400 italic">Loading terms...</div>
                    ) : termsData ? (
                        termsData.sections.map((section) => {
                            const Icon = iconMap[section.header.icon];
                            return (
                                <section key={section.id}>
                                    <h3 className="font-bold text-stone-800 text-lg mb-2 flex items-center gap-2">
                                        {Icon && <Icon size={18} className={section.header.colorClass} />}
                                        {section.header.text}
                                    </h3>
                                    {section.blocks.map((block, bIdx) => {
                                        if (block.type === 'paragraph') return <p key={bIdx}>{renderContent(block.content)}</p>;
                                        if (block.type === 'alert_paragraph') return <p key={bIdx} className="mt-2 text-red-600 font-bold">{renderContent(block.content)}</p>;
                                        if (block.type === 'list') return <ul key={bIdx} className="list-disc pl-5 space-y-1 mt-2">{block.items.map((item, iIdx) => <li key={iIdx}>{renderContent(item.content)}</li>)}</ul>;
                                        return null;
                                    })}
                                </section>
                            );
                        })
                    ) : (
                        <div className="text-red-500">Failed to load terms. Please refresh.</div>
                    )}
                </div>
                <div className="p-6 bg-stone-50">
                    <label className="flex items-start gap-4 cursor-pointer mb-6 p-4 bg-white rounded-xl border border-stone-200 transition-colors hover:border-emerald-200">
                        <input type="checkbox" className="mt-1 w-6 h-6 accent-blue-600" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                        <span className="text-stone-700 font-medium">I have read and understood the Legal Disclaimer, Research Consent, and Safety Protocols.</span>
                    </label>
                    <button onClick={onConsent} disabled={!agreed} className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all ${agreed ? 'bg-stone-900 text-white active:scale-95' : 'bg-stone-300 text-stone-500'}`}>
                        I Agree & Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP ---
export default function App() {
    const [user, setUser] = useState(null);
    const [view, setView] = useState('diary');
    const [loading, setLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const [unlockPersonal, setUnlockPersonal] = useState(false);
    // CORRECTION: Separate lock for comorbidities
    const [unlockComorbidities, setUnlockComorbidities] = useState(false);
    const [pdfLibsLoaded, setPdfLibsLoaded] = useState(false);

    const [profile, setProfile] = useState({
        age: '', dob: '', gender: '', weight: '', hba1c: '', creatinine: '', pregnancyStatus: false, hasConsented: false,
        instructions: '', comorbidities: []
    });
    const [prescription, setPrescription] = useState({ insulins: [], oralMeds: [], instructions: '' });
    const [medDatabase, setMedDatabase] = useState(MEDICATION_DATABASE);

    const [vitalsForm, setVitalsForm] = useState({});
    const [hgt, setHgt] = useState('');
    const [mealStatus, setMealStatus] = useState('Pre-Meal');
    const [insulinDoses, setInsulinDoses] = useState({});
    const [medsTaken, setMedsTaken] = useState({});
    const [contextTags, setContextTags] = useState([]);
    const [fullHistory, setFullHistory] = useState([]);
    const [aiInsights, setAiInsights] = useState([]);

    const [pdfStartDate, setPdfStartDate] = useState('');
    const [pdfEndDate, setPdfEndDate] = useState('');
    const [logTime, setLogTime] = useState(new Date().toISOString().slice(0, 16));
    const [vitalsLogTime, setVitalsLogTime] = useState(new Date().toISOString().slice(0, 16));
    const [editingLog, setEditingLog] = useState(null);

    const [expandedGraphData, setExpandedGraphData] = useState(null);
    const [highlightField, setHighlightField] = useState(null);
    const [safetyAlerts, setSafetyAlerts] = useState([]);
    const [insulinSearch, setInsulinSearch] = useState('');
    const [oralSearch, setOralSearch] = useState('');
    const [showInsulinResults, setShowInsulinResults] = useState(false);
    const [showOralResults, setShowOralResults] = useState(false);
    const [showAlertDetails, setShowAlertDetails] = useState(false);
    const [lang, setLang] = useState('en');
    const [isHighContrast, setIsHighContrast] = useState(() => localStorage.getItem('sugar_highContrast') === 'true');
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('sugar_darkMode') === 'true');
    const [hapticsEnabled, setHapticsEnabled] = useState(() => localStorage.getItem('sugar_haptics') !== 'false'); // Default true
    const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('sugar_sound') !== 'false'); // Default true

    // State for Chart Expansion
    const [estimatedHbA1c, setEstimatedHbA1c] = useState(null);
    const [isCaregiverMode, setIsCaregiverMode] = useState(false);
    const [remindersEnabled, setRemindersEnabled] = useState(false);
    const [accountPendingDeletion, setAccountPendingDeletion] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [expandedLogId, setExpandedLogId] = useState(null);

    // Background Reminder Logic
    useEffect(() => {
        if (!remindersEnabled || isCaregiverMode) return;

        const checkReminders = () => {
            const now = new Date();
            const hour = now.getHours();
            const minute = now.getMinutes();

            // Simple mapping of rough times to medication slots
            const slots = {
                8: 'Morning',
                9: 'Breakfast',
                13: 'Lunch',
                16: 'Afternoon',
                19: 'Evening',
                20: 'Dinner',
                22: 'Bedtime',
            };

            const currentSlot = slots[hour];
            if (currentSlot && minute === 0) { // Only notify at the start of the hour
                // Check if any med is due in this slot
                const medsDue = [
                    ...prescription.oralMeds.filter(m => m.timings.includes(currentSlot)).map(m => m.name),
                    ...prescription.insulins.filter(i => {
                        const f = i.frequency;
                        if (f === 'Before Meals') return ['Breakfast', 'Lunch', 'Dinner'].includes(currentSlot);
                        if (f === 'Bedtime') return currentSlot === 'Bedtime';
                        if (f === 'Once Daily') return currentSlot === 'Morning';
                        return false;
                    }).map(i => i.name)
                ];

                if (medsDue.length > 0 && Notification.permission === 'granted') {
                    new Notification(`Medicine Due: ${currentSlot}`, {
                        body: `You have ${medsDue.length} meds scheduled: ${medsDue.slice(0, 2).join(', ')}${medsDue.length > 2 ? '...' : ''}`,
                        icon: '/favicon.ico'
                    });
                    triggerHaptic(hapticsEnabled);
                }
            }
        };

        const interval = setInterval(checkReminders, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [remindersEnabled, prescription, hapticsEnabled, isCaregiverMode]);

    // Derive latest vitals dynamically from history for profile summary
    const getLatestVitals = () => {
        const sorted = [...fullHistory].sort((a, b) => {
            const ta = a.timestamp?.seconds || new Date(a.timestamp).getTime() / 1000 || 0;
            const tb = b.timestamp?.seconds || new Date(b.timestamp).getTime() / 1000 || 0;
            return tb - ta;
        });

        const result = { weight: profile.weight, hba1c: profile.hba1c, creatinine: profile.creatinine, lastUpdated: [] };

        // Most recent non-null records for each
        const w = sorted.find(l => l.snapshot?.profile?.weight)?.snapshot?.profile?.weight;
        const a = sorted.find(l => l.snapshot?.profile?.hba1c)?.snapshot?.profile?.hba1c;
        const c = sorted.find(l => l.snapshot?.profile?.creatinine)?.snapshot?.profile?.creatinine;

        if (w) result.weight = w;
        if (a) result.hba1c = a;
        if (c) result.creatinine = c;

        // Determine which were updated in the ABSOLUTE latest log for indicator
        const latest = sorted.find(l => l.type === 'vital_update');
        if (latest) {
            result.lastUpdated = latest.updatedParams || [];
        }

        return result;
    };

    const latestVitals = getLatestVitals();

    useEffect(() => {
        // Re-calculate alerts whenever profile (comorbidities/age etc.) or prescription changes
        if (!profile || !prescription) return;

        // Construct simplified profile object for alert check logic
        const alertProfile = {
            isElderly: parseInt(profile.age) > 65,
            hasRenalImpairment: (profile.comorbidities || []).includes('Kidney Disease') || (profile.creatinine && parseFloat(profile.creatinine) > 1.3),
            hasHeartFailure: (profile.comorbidities || []).includes('Heart Disease'),
            isPregnant: profile.pregnancyStatus,
            hasObesity: profile.weight && parseFloat(profile.weight) > 100
        };

        const alerts = getPrescriptionAlerts(prescription, alertProfile);
        setSafetyAlerts(alerts);
    }, [profile, prescription]);


    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.search-container')) {
                setShowInsulinResults(false);
                setShowOralResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (fullHistory.length > 0) {
            const insights = generateAllInsights(fullHistory);
            setAiInsights(insights);

            const glucoseReadings = fullHistory.filter(l => l.hgt).map(l => parseFloat(l.hgt));
            if (glucoseReadings.length >= 5) {
                const avg = glucoseReadings.reduce((a, b) => a + b, 0) / glucoseReadings.length;
                setEstimatedHbA1c(calculateGMI(avg));
            }
        }
    }, [fullHistory]);

    useEffect(() => {
        if (view === 'profile' && highlightField) {
            setTimeout(() => {
                const el = document.getElementById(`field-${highlightField}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.focus();
                    el.classList.add('ring-4', 'ring-blue-200', 'bg-blue-50');
                    setTimeout(() => el.classList.remove('ring-4', 'ring-blue-200', 'bg-blue-50'), 2000);
                    setHighlightField(null);
                }
            }, 500);
        }
    }, [view, highlightField]);

    useEffect(() => {
        const loadScript = (src) => {
            return new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
            .then(() => loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js'))
            .then(() => { setPdfLibsLoaded(true); })
            .catch(err => console.error("Failed to load PDF libs", err));
    }, []);

    // Settings Persistence
    useEffect(() => { localStorage.setItem('sugar_highContrast', isHighContrast); }, [isHighContrast]);
    useEffect(() => { localStorage.setItem('sugar_darkMode', darkMode); }, [darkMode]);
    useEffect(() => { localStorage.setItem('sugar_haptics', hapticsEnabled); }, [hapticsEnabled]);
    useEffect(() => { localStorage.setItem('sugar_sound', soundEnabled); }, [soundEnabled]);
    useEffect(() => { localStorage.setItem('sugar_lang', lang); }, [lang]);

    useEffect(() => {
        const initAuth = async () => {
            await auth.authStateReady();
            if (typeof window !== 'undefined' && window.__initial_auth_token) {
                try { await signInWithCustomToken(auth, window.__initial_auth_token); } catch (err) { console.error(err); }
            }
        };
        initAuth();
        // Caregiver Mode Detection (Simulation)
        const params = new URLSearchParams(window.location.search);
        if (params.get('caregiver') === 'true') {
            setIsCaregiverMode(true);
            // In a real app, we would use a token to fetch specific shared data
        }
        return onAuthStateChanged(auth, async (u) => {
            setUser(u);
            if (u) {
                try {
                    const medListRef = doc(db, 'artifacts', appId, 'public', 'data', 'medications', 'master_list');
                    getDoc(medListRef).then(snap => { if (snap.exists()) setMedDatabase(snap.data()); }).catch(err => console.log("Using default meds"));
                    fetch('https://raw.githubusercontent.com/sugar-diary/main/diabtes_medication_library.json')
                        .then(res => { if (res.ok) return res.json(); throw new Error('Status ' + res.status); })
                        .then(json => { if (json && (json.insulins || json.oralMeds)) setMedDatabase(prev => ({ ...prev, ...json })); })
                        .catch(err => console.log("External Med Library Fetch Failed (Using default):", err));
                    const pDoc = await getDoc(doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data'));
                    if (pDoc.exists()) {
                        const data = pDoc.data();
                        const loadedProfile = { ...data.profile };

                        // Check for account deletion status
                        if (loadedProfile.deletedAt) {
                            const deletedDate = new Date(loadedProfile.deletedAt);
                            const thirtyDaysLater = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                            const now = new Date();
                            if (now < thirtyDaysLater) {
                                const diffTime = Math.abs(thirtyDaysLater.getTime() - now.getTime());
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                setAccountPendingDeletion({ daysLeft: diffDays });
                                setLoading(false);
                                return; // Stop further loading if account is pending deletion
                            } else {
                                // Account is past 30 days, proceed with permanent deletion (server-side function would handle this)
                                console.log("Account past 30-day recovery window. Initiating permanent deletion.");
                                // For client-side, we'll just sign out and treat it as permanently gone.
                                auth.signOut();
                                setLoading(false);
                                return;
                            }
                        }

                        if (loadedProfile.dob) loadedProfile.age = calculateAge(loadedProfile.dob);
                        const loadedPrescription = data.prescription || { insulins: [], oralMeds: [] };
                        if (loadedPrescription.insulins) {
                            loadedPrescription.insulins = loadedPrescription.insulins.map(ins => ({
                                ...ins,
                                frequency: ins.frequency || 'Before Meals',
                                slidingScale: (ins.slidingScale || []).map(scale => ({ ...scale, dose: scale.dose || scale.units }))
                            }));
                        }
                        setProfile(loadedProfile);
                        setPrescription(loadedPrescription);
                    } else {
                        setView('profile');
                    }
                } catch (e) { console.error("Fetch Error", e); }
            }
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), orderBy('timestamp', 'desc'), limit(100));
        return onSnapshot(q, (s) => setFullHistory(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, [user]);

    const checkContraindication = (medName) => {
        const med = MEDICATION_DATABASE.find(m => m.name.toLowerCase().includes(medName.toLowerCase()));
        return profile.pregnancyStatus && med?.flags?.pregnancy === 'avoid';
    };

    const getSuggestion = (insulinId) => {
        const insulin = prescription.insulins.find(i => i.id === insulinId);
        if (!insulin || !hgt) return null;
        const current = parseFloat(hgt);
        if (isNaN(current)) return null;
        if (current < 70) return "HYPO ALERT";

        const medDetails = MEDICATION_DATABASE.find(m => m.name === insulin.name);
        if (profile.pregnancyStatus && medDetails?.flags?.pregnancy === 'avoid') return "Unsafe (Pregnancy)";

        let baseDose = parseFloat(insulin.fixedDose || 0);
        let scaleDose = 0;

        if (insulin.slidingScale && insulin.slidingScale.length > 0) {
            const rule = insulin.slidingScale.find(r => current >= parseFloat(r.min) && current < parseFloat(r.max));
            if (rule) scaleDose = parseFloat(rule.dose || 0);
        }

        let totalDose = baseDose + scaleDose;
        return totalDose > 0 ? totalDose : null;
    };

    const getTrendData = (metric) => {
        // 1. Extract all valid entries for this metric (Strict Independence Rule)
        const allEntries = fullHistory
            .filter(log => {
                // Only include if this specific vital was actually updated in this log
                if (log.type === 'vital_update') {
                    return log.updatedParams && log.updatedParams.includes(metric);
                }
                // For older legacy logs or other types, check existence (graceful fallback)
                return log.snapshot?.profile?.[metric] !== undefined && log.snapshot.profile[metric] !== null && !isNaN(parseFloat(log.snapshot.profile[metric]));
            })
            .map(log => ({
                id: log.id,
                date: log.timestamp?.seconds * 1000 || (log.timestamp instanceof Date ? log.timestamp.getTime() : new Date(log.timestamp).getTime()),
                value: parseFloat(log.snapshot.profile[metric])
            }))
            .sort((a, b) => a.date - b.date);

        // 2. Strict filtering: Only keep points where the value actually CHANGED
        const uniqueChanges = [];
        allEntries.forEach((entry, i) => {
            if (i === 0 || entry.value !== uniqueChanges[uniqueChanges.length - 1].value) {
                uniqueChanges.push(entry);
            }
        });

        return uniqueChanges;
    };

    const getSugarTrend = () => {
        return fullHistory
            .filter(l => l.hgt && !isNaN(parseFloat(l.hgt)))
            .map(l => ({
                value: parseFloat(l.hgt),
                date: l.timestamp?.seconds ? l.timestamp.seconds * 1000 : new Date(l.timestamp).getTime(),
                id: l.id
            }))
            .sort((a, b) => a.date - b.date);
    };

    // FIX: Calculate 7-day stats for breakdown, and all-time for Overall
    const calculateCompliance = () => {
        const logs = fullHistory.filter(l => !l.type); // only entry logs
        if (logs.length === 0) return { oral: 0, insulin: 0, overall: 0 };

        // 1. 7-Day Stats (Oral & Insulin Breakdown)
        const last7Days = logs.filter(log => (log.timestamp?.seconds * 1000 || log.timestamp) > Date.now() - 7 * 24 * 60 * 60 * 1000);
        let oralTaken7 = 0, oralPres7 = 0;
        let insTaken7 = 0, insPres7 = 0;

        prescription.oralMeds.forEach(m => { oralPres7 += m.timings.length * 7; });
        prescription.insulins.forEach(i => {
            const f = i.frequency === 'Once Daily' ? 1 : i.frequency === 'Twice Daily' ? 2 : 1;
            insPres7 += f * 7;
        });

        last7Days.forEach(log => {
            oralTaken7 += (log.medsTaken || []).length;
            insTaken7 += Object.keys(log.insulinDoses || {}).length;
        });

        // 2. All-Time Overall (Day 1 to Now)
        const earliestLog = logs[logs.length - 1];
        const startTime = earliestLog?.timestamp?.seconds ? earliestLog.timestamp.seconds * 1000 : (earliestLog?.timestamp ? new Date(earliestLog.timestamp).getTime() : Date.now());
        const totalDays = Math.max(1, Math.ceil((Date.now() - startTime) / (24 * 60 * 60 * 1000)));

        let totalTaken = 0, totalPrescribed = 0;
        prescription.oralMeds.forEach(m => { totalPrescribed += m.timings.length * totalDays; });
        prescription.insulins.forEach(i => {
            const f = i.frequency === 'Once Daily' ? 1 : i.frequency === 'Twice Daily' ? 2 : 1;
            totalPrescribed += f * totalDays;
        });

        logs.forEach(log => {
            totalTaken += (log.medsTaken || []).length;
            totalTaken += Object.keys(log.insulinDoses || {}).length;
        });

        return {
            oral: oralPres7 ? Math.min(100, Math.round((oralTaken7 / oralPres7) * 100)) : 100,
            insulin: insPres7 ? Math.min(100, Math.round((insTaken7 / insPres7) * 100)) : 100,
            overall: totalPrescribed ? Math.min(100, Math.round((totalTaken / totalPrescribed) * 100)) : 100
        };
    };



    const handleSeedDatabase = async () => {
        if (!confirm("Initialize Medication Database?")) return;
        try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'medications', 'master_list'), MEDICATION_DATABASE); alert("Database Initialized!"); } catch (e) { alert("Error: " + e.message); }
    };

    const handleSaveProfile = async (e) => {
        if (e) e.preventDefault();

        // 1. Validation
        if (vitalsForm.weight && (parseFloat(vitalsForm.weight) < 1 || parseFloat(vitalsForm.weight) > 1000)) return alert("Invalid Weight");
        if (vitalsForm.hba1c && (parseFloat(vitalsForm.hba1c) < 3 || parseFloat(vitalsForm.hba1c) > 20)) return alert("Invalid HbA1c");

        const timestamp = vitalsLogTime ? new Date(vitalsLogTime) : new Date();

        // 2. Duplicate Check (1 Hour Rule - Specific for vital type)
        if (!editingLog) {
            const updatedParams = Object.keys(vitalsForm).filter(k => vitalsForm[k] !== '' && vitalsForm[k] !== undefined);
            const recent = fullHistory.find(l =>
                l.type === 'vital_update' &&
                l.updatedParams?.some(p => updatedParams.includes(p)) &&
                Math.abs(timestamp - (l.timestamp?.seconds * 1000 || new Date(l.timestamp))) < 3600000
            );
            if (recent) {
                const pNames = recent.updatedParams.filter(p => updatedParams.includes(p)).join(', ');
                return alert(`Action Blocked: ${pNames} was already recorded in the last hour. Duplicate entries are prevented for safety.`);
            }
        }

// 3. Prep Data
// INDEPENDENCE & TIME VALIDATION
// timestamp already defined above at line 785
if (isNaN(timestamp.getTime())) return alert("Invalid Date/Time selected.");
if (timestamp > new Date()) return alert("Cannot log vitals in the future.");

// STRICT: Real-time Default Rule
// If not editing, and user hasn't explicitly set a back-time (vitalsLogTime matches simple slice), force NOW
// to ensure seconds/ms integrity.
let finalTimestamp = timestamp;
if (!editingLog) {
    const now = new Date();
    const inputTime = new Date(vitalsLogTime);
    // If input matches current minute (user didn't change it much) or is default, prefer high-precision NOW
    if (Math.abs(now - inputTime) < 60000) finalTimestamp = now;
}

// Module 1: Vital Duplicate Prevention (60 Minutes)
if (!editingLog) {
    const recentVital = fullHistory.find(l =>
        l.type === 'vital_update' &&
        Math.abs(new Date() - (l.timestamp?.seconds * 1000 || new Date(l.timestamp))) < 3600000
    );

    if (recentVital) {
        // Check if we are actually validating a vital field change?
        // Simplification: If any vital update exists in last hour, warn user.
        // This is strict but safe for "Prevent Duplicate Vital Entries".
        alert("Safety Notice: Vitals were updated less than 60 minutes ago. Please wait before adding a new entry to prevent duplicates.");
        return;
    }
}

const updatedParams = [];
const updatedProfile = { ...profile };
let hasChanges = false;

// Check Weight
if (vitalsForm.weight && vitalsForm.weight !== profile.weight) {
    updatedProfile.weight = vitalsForm.weight;
    updatedParams.push('weight');
    hasChanges = true;
}

// Check HbA1c
if (vitalsForm.hba1c && vitalsForm.hba1c !== profile.hba1c) {
    updatedProfile.hba1c = vitalsForm.hba1c;
    updatedParams.push('hba1c');
    hasChanges = true;
}

// Check Creatinine
if (vitalsForm.creatinine && vitalsForm.creatinine !== profile.creatinine) {
    updatedProfile.creatinine = vitalsForm.creatinine;
    updatedParams.push('creatinine');
    hasChanges = true;
}

if (vitalsForm.dob) { updatedProfile.dob = vitalsForm.dob; updatedProfile.age = calculateAge(vitalsForm.dob); hasChanges = true; }
if (vitalsForm.gender) { updatedProfile.gender = vitalsForm.gender; hasChanges = true; }
if (vitalsForm.instructions !== undefined && vitalsForm.instructions !== profile.instructions) {
    updatedProfile.instructions = vitalsForm.instructions;
    hasChanges = true;
}
if (vitalsForm.pregnancyStatus !== undefined && vitalsForm.pregnancyStatus !== profile.pregnancyStatus) {
    updatedProfile.pregnancyStatus = vitalsForm.pregnancyStatus;
    hasChanges = true;
}
// Comorbidities handled separately in state, but need to be saved if changed? 
// Actually comorbidities seem to be direct setProfile in the UI code, so we should merge current profile state for them.

if (!hasChanges && !vitalsForm.instructions) return alert("No changes detected to save.");

try {
    if (editingLog && editingLog.type === 'vital_update') {
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'logs', editingLog.id), {
            snapshot: { ...editingLog.snapshot, profile: updatedProfile },
            updatedParams, // Only update the params that were actually touched in this edit
            timestamp
        });
        alert("Entry Updated.");
    } else {
        // Update profile docs
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), { profile: updatedProfile, prescription, lastUpdated: new Date().toISOString() }, { merge: true });

        // Add log entry ONLY for the changed vitals
        if (updatedParams.length > 0 || hasChanges) {
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), {
                type: 'vital_update',
                snapshot: { profile: updatedProfile, prescription },
                updatedParams, // STRICTLY USED for graph filtering
                timestamp: finalTimestamp, // Use high-precision timestamp
                tags: ['Vital Update', ...updatedParams]
            });
        }

    }
    setProfile(updatedProfile);
    setVitalsForm({}); // Clear form completely to prevent cross-contamination
    setUnlockPersonal(false);
    setUnlockComorbidities(false);
    setVitalsLogTime(new Date().toISOString().slice(0, 16));
    setEditingLog(null);
} catch (err) { alert("Save failed: " + err.message); }
  };

const handleDeleteEntry = async (id) => {
    const log = fullHistory.find(l => l.id === id);
    if (!log) return;

    // 30 Minute Lock Protection using consolidated helper
    if (isActionLocked(log.timestamp)) {
        return alert("Action Locked: Entries are locked after 30 minutes to preserve medical history integrity.");
    }

    if (!confirm("Confirm permanent deletion of this record?")) return;
    try {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'logs', id));
        setEditingLog(null);
    } catch (err) { alert("Delete failed."); }
};

const handleSavePrescription = async () => {
    // VALIDATION: Frequency & Completeness
    const errors = [];
    prescription.insulins.forEach((ins, i) => {
        if (!ins.name) errors.push(`Insulin #${i + 1} name is missing.`);
        if (!ins.frequency) errors.push(`${ins.name || `Insulin #${i + 1}`}: Frequency is required.`);
    });
    prescription.oralMeds.forEach((med, i) => {
        if (!med.name) errors.push(`Medication #${i + 1} name is missing.`);
        if (!med.frequency) errors.push(`${med.name || `Med #${i + 1}`}: Frequency is required.`);
        if (!med.timings || med.timings.length === 0) errors.push(`${med.name}: At least one timing is required.`);
    });

    if (errors.length > 0) {
        return alert("Validation Errors:\n" + errors.join('\n'));
    }

    try {
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), { profile, prescription, lastUpdated: new Date().toISOString() }, { merge: true });
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), { type: 'prescription_update', snapshot: { prescription }, timestamp: serverTimestamp(), tags: ['Rx Change', 'Audit'] });
        alert("Prescription Saved."); setView('diary');
    } catch (err) { alert("Save failed."); }
};

const handleSaveEntry = async () => {
    const hasOralMeds = Object.keys(medsTaken).some(k => medsTaken[k]);
    const hasInsulin = Object.keys(insulinDoses).length > 0;

    // Safety: Insulin requires Sugar
    if (hasInsulin && (!hgt || parseInt(hgt) < 20)) {
        return alert("Safety Block: Cannot log insulin without a valid blood sugar reading (> 20 mg/dL).");
    }

    // Legacy duplicate checks removed to resolve ReferenceError
    const timestamp = logTime ? new Date(logTime) : new Date();
    if (isNaN(timestamp.getTime())) return alert("Invalid Log Time.");
    if (timestamp > new Date()) return alert("Cannot log entries in the future.");

    // GRANULAR DUPLICATE CHECKS
    if (!editingLog) {
        // 1. Glucose Check (1 Hour Block)
        if (hgt) {
            const recentSugar = fullHistory.find(l =>
                !l.type && l.hgt &&
                Math.abs(timestamp - (l.timestamp?.seconds * 1000 || new Date(l.timestamp))) < 3600000
            );
            if (recentSugar) return alert("Action Blocked: Glucose was already logged in the last hour. Please wait before re-checking.");
        }

        // 2. Medication Check (Same Day + Same Slot Block)
        const medsToCheck = Object.keys(medsTaken).filter(k => medsTaken[k]);
        if (medsToCheck.length > 0) {
            const entryDateString = timestamp.toDateString();
            const duplicateMed = medsToCheck.find(key => {
                // Check if this specific med slot combination exists in history for TODAY
                return fullHistory.some(l => {
                    const lDate = l.timestamp?.seconds ? new Date(l.timestamp.seconds * 1000) : new Date(l.timestamp);
                    return (!l.type) && lDate.toDateString() === entryDateString && (l.medsTaken || []).includes(key);
                });
            });

            if (duplicateMed) {
                const [id, slot] = duplicateMed.split('_');
                const medName = prescription.oralMeds.find(m => m.id === id)?.name || "Medication";
                return alert(`Action Blocked: '${medName}' has already been logged for the '${slot}' slot today. Duplicate doses are prevented for safety.`);
            }
        }

        // 3. Insulin Check (Same Logic if needed)
    }

    // STRICT: Prevent Empty regular logs
    const hasContext = contextTags.length > 0;

    if (!hgt && !hasOralMeds && !hasInsulin && !hasContext) {
        return alert("Empty Log: Please enter a Blood Sugar value, Medication, or Context tag before saving.");
    }

    const entryData = {
        hgt: hgt ? parseFloat(hgt) : null,
        mealStatus,
        insulinDoses,
        medsTaken: Object.keys(medsTaken).filter(k => medsTaken[k]),
        tags: contextTags,
        timestamp,
        snapshot: { profile, prescription }
    };

    try {
        if (editingLog && !editingLog.type) {
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'logs', editingLog.id), entryData);
            alert("Record Updated!");
        } else {
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), entryData);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        }
        setHgt(''); setInsulinDoses({}); setMedsTaken({}); setContextTags([]);
        setLogTime(new Date().toISOString().slice(0, 16));
        setEditingLog(null);
    } catch (err) { alert("Save failed: " + err.message); }
};

const handleStartEdit = (log) => {
    setEditingLog(log);
    setHgt(log.hgt?.toString() || '');
    setMealStatus(log.mealStatus || 'Pre-Meal');
    setInsulinDoses(log.insulinDoses || {});
    const medsMap = {};
    (log.medsTaken || []).forEach(m => medsMap[m] = true);
    setMedsTaken(medsMap);
    setContextTags(log.tags || []);
    const date = new Date(log.timestamp?.seconds * 1000 || log.timestamp);
    setLogTime(date.toISOString().slice(0, 16));
    setView('diary');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleStartEditVital = (log) => {
    // 30-Minute Lock Check
    if (isActionLocked(log.timestamp)) {
        return alert("Editing Locked: Vitals logs become read-only after 30 minutes for clinical accuracy.");
    }

    setEditingLog(log);

    // STRICT INDEPENDENCE: Only populate form with content from this specific log
    // This prevents "ghost" data from current profile leaking into the edit
    const formSnapshot = {};
    if (log.updatedParams) {
        log.updatedParams.forEach(param => {
            if (log.snapshot?.profile?.[param] !== undefined) {
                formSnapshot[param] = log.snapshot.profile[param];
            }
        });
    } else {
        // Fallback for legacy logs
        formSnapshot.weight = log.snapshot?.profile?.weight || '';
        formSnapshot.hba1c = log.snapshot?.profile?.hba1c || '';
        formSnapshot.creatinine = log.snapshot?.profile?.creatinine || '';
    }

    setVitalsForm(formSnapshot);

    const date = new Date(log.timestamp?.seconds * 1000 || log.timestamp);
    setVitalsLogTime(date.toISOString().slice(0, 16));

    // Focus on the first available field
    if (formSnapshot.hba1c) setHighlightField('hba1c');
    else if (formSnapshot.creatinine) setHighlightField('creatinine');
    else setHighlightField('weight');

    setView('profile'); // Switch to profile view where vital entry happens
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleSoftDelete = async () => {
    if (!confirm("Are you sure you want to delete your account? This action is reversible for 30 days.")) return;
    try {
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), {
            'profile.deletedAt': new Date().toISOString()
        });
        alert("Account scheduled for deletion. You will be logged out.");
        auth.signOut();
    } catch (e) { alert("Error deleting account: " + e.message); }
};

const handleRestoreAccount = async () => {
    try {
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), {
            'profile.deletedAt': null
        });
        setAccountPendingDeletion(null);
        alert("Welcome back! Account restored.");
    } catch (e) { alert("Restore failed: " + e.message); }
};

const generatePDF = () => {
    // FIX: Robust check for window.jspdf or default jsPDF from CDN
    const pdfLib = window.jspdf;
    if (!pdfLib && !window.jsPDF) { alert("PDF Generator is initializing... please wait 5 seconds and try again."); return; }

    // Handle different CDN loading patterns
    const jsPDF = pdfLib ? pdfLib.jsPDF : window.jsPDF;
    if (!jsPDF) { alert("PDF Library not found. Please refresh."); return; }

    const doc = new jsPDF();

    // FIX: Robust check for autoTable attachment
    const runAutoTable = (options) => {
        if (doc.autoTable) doc.autoTable(options);
        else if (pdfLib && pdfLib.autoTable) pdfLib.autoTable(doc, options);
        else if (window.autoTable) window.autoTable(doc, options);
        else {
            console.error("AutoTable plugin not found. Trying fallback...");
            // Fallback: Sometimes autoTable attaches to jsPDF prototype late
            try { doc.autoTable(options); } catch (e) { console.error(e); }
        }
    };

    doc.setFillColor(5, 150, 105); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255); doc.setFontSize(22); doc.text("SugarDiary Report", 14, 22);
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text(`Patient: ${user.displayName || 'User'}`, 14, 32);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 37);
    doc.setTextColor(0);

    const vitalsHead = ['Age', 'Gender', 'Weight', 'HbA1c', 'Creatinine'];
    const vitalsBody = [profile.age, profile.gender || '-', profile.weight, profile.hba1c, profile.creatinine];
    if (profile.gender === 'Female' && profile.pregnancyStatus) { vitalsHead.push('Pregnancy'); vitalsBody.push('YES (High Risk)'); }
    runAutoTable({ startY: 45, head: [vitalsHead], body: [vitalsBody] });

    if (profile.comorbidities?.length > 0) {
        runAutoTable({ startY: (doc.lastAutoTable || {}).finalY + 5, head: [['Known Comorbidities']], body: [[profile.comorbidities.join(', ')]], theme: 'plain', styles: { fontSize: 9, fontStyle: 'italic', cellPadding: 2 } });
    }

    let finalY = (doc.lastAutoTable || {}).finalY + 10;
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("Vital Trends", 14, finalY);

    // Graph Drawing Logic (Side-by-Side)
    const drawGraph = (data, title, startX, startY, width, height, norm, color) => {
        if (!data || data.length < 2) return;

        const gX = startX; const gY = startY + 6;
        doc.setFontSize(9); doc.setTextColor(60); doc.setFont("helvetica", "bold"); doc.text(title, startX, startY + 4);

        const vals = data.map(d => d.value);
        const dataMin = Math.min(...vals);
        const dataMax = Math.max(...vals);
        const dataRange = (dataMax - dataMin) || (dataMax * 0.1) || 1;

        // Keep trend in mid section by adding 40% padding above and below
        let min = dataMin - (dataRange * 0.4);
        let max = dataMax + (dataRange * 0.4);

        const range = max - min;

        // Subtle Clinical Color Zones for HbA1c
        if (title.includes("HbA1c")) {
            const getY = (val) => gY + height - ((val - min) / range) * height;

            // Green Zone
            doc.setFillColor(240, 253, 244);
            const y57 = Math.max(gY, Math.min(gY + height, getY(5.7)));
            doc.rect(gX, y57, width, (gY + height) - y57, 'F');

            // Yellow Zone
            doc.setFillColor(255, 251, 235);
            const y65 = Math.max(gY, Math.min(gY + height, getY(6.5)));
            doc.rect(gX, y65, width, y57 - y65, 'F');

            // Red Zone
            doc.setFillColor(254, 242, 242);
            doc.rect(gX, gY, width, y65 - gY, 'F');
        }

        // Horizontal reference lines (very faint)
        doc.setDrawColor(240); doc.setLineWidth(0.1);
        [0.25, 0.5, 0.75].forEach(r => { doc.line(gX, gY + height * r, gX + width, gY + height * r); });

        if (norm) {
            const refY = gY + height - ((norm - min) / range) * height;
            if (refY >= gY && refY <= gY + height) {
                doc.setDrawColor(200); doc.setLineDashPattern([1, 1], 0); doc.line(gX, refY, gX + width, refY);
                doc.setLineDashPattern([], 0);
            }
        }

        const [r, g, b] = color === 'orange' ? [234, 88, 12] : color === 'purple' ? [147, 51, 234] : [5, 150, 105];

        // Strategy: 1st point is baseline (first entry ever), then 4 most recent
        let pdfPoints = [];
        if (data.length <= 5) {
            pdfPoints = data;
        } else {
            pdfPoints = [data[0], ...data.slice(-4)];
        }

        pdfPoints.forEach((d, i) => {
            const x = gX + i / (pdfPoints.length - 1 === 0 ? 1 : pdfPoints.length - 1) * width;
            const y = gY + height - ((d.value - min) / range) * height;

            if (i > 0) {
                const prev = pdfPoints[i - 1];
                const x1 = gX + (i - 1) / (pdfPoints.length - 1) * width;
                const y1 = gY + height - ((prev.value - min) / range) * height;
                doc.setDrawColor(r, g, b); doc.setLineWidth(1.2); doc.line(x1, y1, x, y);
            }

            // Darker, solid dots
            doc.setFillColor(r, g, b); doc.circle(x, y, 1.5, 'F');

            // Value Labels
            doc.setFontSize(8); doc.setTextColor(40); doc.setFont("helvetica", "bold");
            doc.text(d.value.toString(), x, y - 4, { align: 'center' });

            // Date Labels
            doc.setFontSize(5); doc.setTextColor(180); doc.setFont("helvetica", "normal");
            doc.text(new Date(d.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), x, gY + height + 4, { align: 'center' });
        });
    };

    const gW = 60; const gH = 32; // Slightly more height
    drawGraph(getTrendData('weight'), "Weight (kg)", 14, finalY, gW, gH, null, 'orange');
    drawGraph(getTrendData('hba1c'), "HbA1c (%)", 14 + gW + 5, finalY, gW, gH, 5.7, 'emerald');
    drawGraph(getTrendData('creatinine'), "Creatinine", 14 + (gW + 5) * 2, finalY, gW, gH, 1.2, 'purple');
    finalY += gH + 25; // More padding after trends

    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(0); doc.text("Prescription", 14, finalY);
    const insulinRows = prescription.insulins.map(i => [i.name, i.type, i.frequency || '-', (i.slidingScale || []).map(s => `${s.min}-${s.max}:${s.dose}u`).join(' | ') || 'Fixed']);
    runAutoTable({ startY: finalY + 5, head: [['Insulin', 'Type', 'Freq', 'Scale']], body: insulinRows });
    finalY = (doc.lastAutoTable || {}).finalY + 5;
    const oralRows = prescription.oralMeds.map(m => [m.name, m.dose, m.frequency, m.timings.join(', ')]);
    runAutoTable({ startY: finalY, head: [['Drug', 'Dose', 'Freq', 'Timings']], body: oralRows });

    // Update finalY after Oral Meds Table
    finalY = (doc.lastAutoTable || {}).finalY + 15;

    // Page break safety for Instructions
    if (finalY > 260 && profile.instructions) { doc.addPage(); finalY = 20; }

    const pdfFilteredHistory = fullHistory.filter(l => {
        if (l.type === 'vital_update' || l.type === 'prescription_update') return false;
        const d = new Date(l.timestamp?.seconds * 1000 || l.timestamp);
        if (pdfStartDate && d < new Date(pdfStartDate)) return false;
        if (pdfEndDate) { const end = new Date(pdfEndDate); end.setHours(23, 59, 59, 999); if (d > end) return false; }
        return true;
    });

    if (profile.instructions) {
        doc.setFontSize(12); doc.setTextColor(0); doc.setFont("helvetica", "bold"); doc.text("Medical Instructions", 14, finalY);
        doc.setFontSize(10); doc.setFont("helvetica", "normal");
        const splitText = doc.splitTextToSize(profile.instructions, 180);
        doc.text(splitText, 14, finalY + 8);
        finalY += (splitText.length * 6) + 15;
    }

    // Page break safety for Logbook
    if (finalY > 260) { doc.addPage(); finalY = 20; }
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(0); doc.text("Logbook", 14, finalY);
    const logRows = pdfFilteredHistory.map(l => [
        new Date(l.timestamp?.seconds * 1000 || l.timestamp).toLocaleString(), l.hgt || '-', l.mealStatus,
        Object.entries(l.insulinDoses || {}).map(([id, d]) => `${prescription.insulins.find(i => i.id === id)?.name || 'Ins'}: ${d}u`).join(', '),
        (l.tags || []).join(', ')
    ]);
    runAutoTable({ startY: finalY + 5, head: [['Time', 'Sugar', 'Context', 'Insulin', 'Notes']], body: logRows });

    // COMPLIANCE SECTION AT THE END
    finalY = (doc.lastAutoTable || {}).finalY + 15;
    doc.setFillColor(245, 247, 250); doc.rect(14, finalY, 182, 20, 'F');
    doc.setFontSize(10); doc.setTextColor(80); doc.setFont("helvetica", "bold");
    doc.text("Medication Compliance Summary (7-Day Trend)", 20, finalY + 8);

    doc.setFontSize(9);
    doc.setTextColor(5, 150, 105); doc.text(`Oral: ${compliance.oral}%`, 20, finalY + 16);
    doc.setTextColor(37, 99, 235); doc.text(`Insulin: ${compliance.insulin}%`, 60, finalY + 16);
    doc.setTextColor(15, 23, 42); doc.text(`Overall Compliance Score: ${compliance.overall}%`, 110, finalY + 16);

    try { doc.save("SugarDiary_Report.pdf"); } catch (e) { alert("Failed to save PDF. Please try again."); }
};


const handleShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?caregiver=true&user=${user.uid}`;
    navigator.clipboard.writeText(url).then(() => {
        alert("Secure Caregiver Link copied to clipboard!\nYou can share this with your doctor or family.");
    });
};

const requestNotificationPermission = async () => {
    try {
        if (!("Notification" in window)) {
            alert("This browser does not support desktop notifications");
            return;
        }
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            setRemindersEnabled(true);
            try {
                new Notification("Smart Reminders Active", { body: "OneTruth will now help you stay on track with your doses.", icon: "/favicon.ico" });
            } catch (e) {
                console.log("Notification test failed (minor):", e);
            }
        }
    } catch (e) {
        console.error("Notification permission error", e);
        alert("Unable to enable notifications. Your browser may be blocking them.");
    }
};

const scheduleDemoReminder = () => {
    if (!remindersEnabled) {
        alert("Please enable reminders first.");
        return;
    }

    if (!("Notification" in window)) return alert("Notifications not supported");

    alert("Test reminder scheduled for 10 seconds from now.");
    setTimeout(() => {
        try {
            if (Notification.permission === 'granted') {
                triggerHaptic(hapticsEnabled);
                new Notification("Medicine Reminder (Test)", {
                    body: "Time to check your blood sugar and take your scheduled dose.",
                    vibrate: hapticsEnabled ? [200, 100, 200] : []
                });
            }
        } catch (e) {
            console.error("Scheduled notification failed", e);
        }
    }, 10000);
};

const T = (key) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en'][key] || key;
const compliance = calculateCompliance();

if (loading) return <div className="p-10 text-center font-bold text-stone-400">{T('loading')}</div>;
if (!user) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#fffbf5]"><BookOpen size={64} className="text-emerald-600 mb-4" /><h1 className="text-2xl font-bold text-stone-800 mb-6">Sugar Diary</h1><button onClick={() => signInWithPopup(auth, provider)} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold">Sign In</button></div>;

if (accountPendingDeletion) {
    return (
        <div className="fixed inset-0 bg-stone-900 text-white z-[9999] flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-red-500/10 p-6 rounded-full mb-6">
                <Trash2 size={48} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-black mb-2">Account Deleted</h1>
            <p className="text-stone-400 mb-8 max-w-xs">Your account is scheduled for permanent deletion in <strong className="text-white">{accountPendingDeletion.daysLeft} days</strong>.</p>

            <button onClick={handleRestoreAccount} className="w-full max-w-xs bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg mb-4 shadow-lg shadow-emerald-500/20 transition-all">
                Restore Account
            </button>
            <button onClick={() => auth.signOut()} className="text-stone-500 font-bold text-sm hover:text-white transition-colors">
                Sign Out
            </button>
        </div>
    );
}

if (!profile.hasConsented) return <ConsentScreen onConsent={() => setProfile(p => ({ ...p, hasConsented: true }))} />;

return (
    <GlobalRecoveryBoundary>
        <SecurityGuardian>
            <div className={`max-w-md mx-auto min-h-screen ${isHighContrast ? 'bg-black text-yellow-400' : darkMode ? 'dark bg-stone-950 text-stone-300' : 'bg-[#fffbf5] text-stone-800'} pb-32 font-sans relative select-none ${isHighContrast ? 'high-contrast' : ''}`}>

                <SettingsModal
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    compliance={compliance}
                    onShare={handleShareLink}
                    profile={profile}
                    onSoftDelete={handleSoftDelete}
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    isHighContrast={isHighContrast}
                    setIsHighContrast={setIsHighContrast}
                    hapticsEnabled={hapticsEnabled}
                    setHapticsEnabled={setHapticsEnabled}
                />

                {showSuccess && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"><div className="bg-white p-8 rounded-3xl shadow-xl"><CheckCircle2 className="text-emerald-500 w-16 h-16 mx-auto" /><h3 className="font-bold mt-2">Saved!</h3></div></div>}

                {isCaregiverMode && (
                    <div className="bg-blue-600 text-white p-2 text-[10px] font-black uppercase tracking-widest text-center sticky top-0 z-[60] flex items-center justify-center gap-2">
                        <Eye size={12} /> Secure Caregiver Access • Read Only Mode
                    </div>
                )}

                <div className="bg-white p-6 rounded-b-[32px] shadow-sm mb-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-4">
                            {/* FIX: Profile Picture Loading with Error Handler */}
                            {user.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt="Profile"
                                    className="w-12 h-12 rounded-full border-2 border-stone-100"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            {/* Fallback Icon if image fails or missing */}
                            <div
                                className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center text-stone-400"
                                style={{ display: user.photoURL ? 'none' : 'flex' }}
                            >
                                <User size={24} />
                            </div>

                            <div>
                                <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{T('diary')}</div>
                                <h1 className="text-2xl font-bold text-stone-800">{user.displayName}</h1>
                                <div className="text-xs text-stone-400 flex items-center gap-2">
                                    {profile.gender && <span className="uppercase font-bold text-stone-500">{profile.gender}</span>}
                                    {profile.pregnancyStatus && <span className="text-red-500 font-bold flex items-center gap-1"><Baby size={10} /> Preg</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowSettings(true)} className="p-2 bg-stone-100 text-stone-500 rounded-xl hover:bg-stone-200 transition-colors"><Settings size={20} /></button>
                            <button onClick={() => signOut(auth)}><LogOut size={20} className="text-red-400 hover:text-red-500" /></button>
                        </div>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        <StatBadge emoji="🧘‍♂️" label={T('age')} value={profile.age} unit="Yrs" color="blue" onClick={() => { setHighlightField('dob'); setView('profile'); }} />
                        <StatBadge emoji="⚖️" label={T('weight')} value={latestVitals.weight} unit="kg" color="orange" updated={latestVitals.lastUpdated.includes('weight')} onClick={() => { setHighlightField('weight'); setView('profile'); }} />
                        <StatBadge emoji="🩸" label={T('hba1c')} value={latestVitals.hba1c} unit="%" color="emerald" updated={latestVitals.lastUpdated.includes('hba1c')} onClick={() => { setHighlightField('hba1c'); setView('profile'); }} />
                        <StatBadge emoji="🧪" label={T('creatinine')} value={latestVitals.creatinine} unit="mg/dL" color="purple" updated={latestVitals.lastUpdated.includes('creatinine')} onClick={() => { setHighlightField('creatinine'); setView('profile'); }} />
                        {estimatedHbA1c && <StatBadge emoji="🎯" label="Est. HbA1c" value={estimatedHbA1c} unit="%" color="stone" onClick={() => { setView('profile'); }} />}
                    </div>
                </div>

                {view === 'diary' && (
                    <div className="px-6 animate-in fade-in space-y-6">
                        {/* HEALTH INTELLIGENCE SUMMARY (SURFACE AI INSIGHTS & QUICK ACTIONS) */}
                        <div className="space-y-3">
                            {/* AI REMOVED FROM HERE AS PER PHASE 1 REGULATIONS */}

                            <div className="space-y-3">
                                {/* Share button moved to settings */}
                                {/* DIARY QUICK ACTIONS removed - centralized in Profile Settings */}

                                {hgt && parseInt(hgt) < 70 && <div className="bg-red-500 text-white p-3 rounded-xl font-bold text-center mb-4 flex items-center justify-center gap-2 animate-pulse"><AlertTriangle /> LOW SUGAR! TAKE GLUCOSE</div>}
                                {hgt && parseInt(hgt) >= 250 && parseInt(hgt) < 300 && <div className="bg-yellow-400 text-stone-900 p-3 rounded-xl font-bold text-center mb-4 flex items-center justify-center gap-2"><AlertTriangle /> POOR CONTROL</div>}
                                {hgt && parseInt(hgt) >= 300 && parseInt(hgt) < 400 && <div className="bg-orange-500 text-white p-3 rounded-xl font-bold text-center mb-4 flex items-center justify-center gap-2 animate-pulse"><AlertTriangle /> HIGH SUGAR!</div>}
                                {hgt && parseInt(hgt) >= 400 && <div className="bg-red-600 text-white p-3 rounded-xl font-bold text-center mb-4 flex items-center justify-center gap-2 animate-pulse"><AlertTriangle /> DANGER! CHECK KETONES</div>}

                                {isCaregiverMode ? (
                                    <div className="bg-stone-50 dark:bg-stone-800 p-8 rounded-[32px] text-center mb-6 border border-dashed border-stone-200 dark:border-stone-700">
                                        <Eye size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-4" />
                                        <h3 className="text-stone-500 font-bold mb-2">Read-Only Mode</h3>
                                        <p className="text-xs text-stone-400 mb-6">Data entry is disabled for caregiver access.</p>
                                        <button onClick={() => setView('history')} className="bg-stone-800 dark:bg-stone-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg">View Patient History</button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-white dark:bg-stone-800 p-6 rounded-[32px] shadow-sm border border-stone-100 dark:border-stone-700 mb-6">
                                            <label className="text-xs font-bold text-stone-400 uppercase">Blood Sugar</label>
                                            <div className="flex items-baseline gap-2 mb-4">
                                                <input type="number" value={hgt} onChange={e => setHgt(e.target.value.slice(0, 3))} min="1" max="999" className="text-6xl font-bold w-full outline-none text-emerald-900 dark:text-emerald-400 bg-transparent" placeholder="---" />
                                                <span className="text-xl font-bold text-stone-400">mg/dL</span>
                                            </div>
                                            <div className="flex gap-2 mb-4">
                                                {['Fasting', 'Pre-Meal', 'Post-Meal', 'Bedtime'].map(m => <MealOption key={m} label={m} icon={Clock} selected={mealStatus === m} onClick={() => setMealStatus(m)} />)}
                                            </div>
                                        </div>

                                        {prescription.insulins.map(insulin => (
                                            <div key={insulin.id} className="bg-white dark:bg-stone-800 p-4 rounded-2xl border border-stone-100 dark:border-stone-700 flex justify-between items-center mb-2">
                                                <div>
                                                    <span className="font-bold text-stone-700 dark:text-stone-200 block">{insulin.name}</span>
                                                    <span className="text-xs text-stone-400">{insulin.frequency || 'Manual'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {getSuggestion(insulin.id) && (
                                                        <div className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 px-3 py-1 rounded-lg text-xs font-bold text-stone-500 flex flex-col items-end">
                                                            <div className="flex items-center gap-1"><Zap size={10} /> {getSuggestion(insulin.id)}u</div>
                                                            <span className="text-[8px] uppercase tracking-wider text-stone-400">Suggestion only</span>
                                                        </div>
                                                    )}
                                                    <input type="number" placeholder="0" className="w-16 bg-stone-50 dark:bg-stone-900 p-2 rounded text-xl font-bold text-right dark:text-stone-200" value={insulinDoses[insulin.id] || ''} onChange={e => setInsulinDoses(p => ({ ...p, [insulin.id]: e.target.value }))} />
                                                </div>
                                            </div>
                                        ))}

                                        {prescription.oralMeds.map(med => (
                                            <div key={med.id} className="bg-white dark:bg-stone-800 p-4 rounded-2xl border border-stone-100 dark:border-stone-700 mb-2">
                                                <div className="font-bold text-sm mb-2 dark:text-stone-200">{med.name}</div>
                                                <div className="flex gap-2 flex-wrap">
                                                    {med.timings.map(t => (
                                                        <button key={t} onClick={() => {
                                                            triggerHaptic();
                                                            setMedsTaken(p => {
                                                                const newState = { ...p };
                                                                // STRICT: Radio behavior - ensure only one slot per med is true at a time
                                                                // If clicking the ALREADY selected one, toggle it off.
                                                                // If clicking a NEW one, clear others for this med and select new one.
                                                                const currentKey = `${med.id}_${t}`;
                                                                const isCurrentlySelected = !!p[currentKey];

                                                                // Clear all slots for this specific med first
                                                                med.timings.forEach(slot => {
                                                                    delete newState[`${med.id}_${slot}`];
                                                                });

                                                                if (!isCurrentlySelected) {
                                                                    newState[currentKey] = true;
                                                                }
                                                                return newState;
                                                            })
                                                        }} className={`px-3 py-1 rounded-lg border text-xs font-bold ${medsTaken[`${med.id}_${t}`] ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-500 text-emerald-800 dark:text-emerald-400' : 'bg-stone-50 dark:bg-stone-900 dark:border-stone-700 dark:text-stone-400'}`}>{t}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}

                                        <div className="flex flex-wrap gap-2 mt-4 mb-4">
                                            {Object.keys(TAG_EMOJIS).map(t => <ContextTag key={t} label={`${TAG_EMOJIS[t]} ${t}`} icon={Thermometer} selected={contextTags.includes(t)} onClick={() => { setContextTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]) }} />)}
                                        </div>

                                        <div className="mb-6 bg-white dark:bg-stone-800 p-4 rounded-2xl border border-stone-100 dark:border-stone-700">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase block mb-2">Back-time Entry (Date & Time)</label>
                                            <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-900 p-3 rounded-xl border border-stone-100 dark:border-stone-700 focus-within:border-emerald-500 transition-all">
                                                <Calendar size={18} className="text-stone-400" />
                                                <input
                                                    type="datetime-local"
                                                    value={logTime}
                                                    onChange={(e) => setLogTime(e.target.value)}
                                                    className="bg-transparent font-bold text-stone-700 dark:text-stone-200 outline-none w-full text-sm"
                                                />
                                            </div>
                                        </div>

                                        {editingLog && !editingLog.type ? (
                                            <div className="flex gap-2 mb-6">
                                                <button onClick={handleSaveEntry} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg flex justify-center gap-2"><Save /> Update Record</button>
                                                <button onClick={() => { setEditingLog(null); setHgt(''); setInsulinDoses({}); setMedsTaken({}); setContextTags([]); setLogTime(new Date().toISOString().slice(0, 16)); }} className="flex-1 bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 py-4 rounded-2xl font-bold">Cancel</button>
                                            </div>
                                        ) : (
                                            <button onClick={handleSaveEntry} className="w-full bg-stone-900 dark:bg-stone-700 text-white py-4 rounded-2xl font-bold shadow-lg flex justify-center gap-2 mb-6"><Save /> Save Entry</button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
{
  view === 'profile' && (
    <div className="px-6 pb-32 animate-in slide-in-from-right">
      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-stone-100 mb-6">
        {/* LOCKED PERSONAL DETAILS */}
        {(!unlockPersonal && (profile.dob || profile.gender)) ? (
          <div className="mb-6 p-4 bg-stone-50 rounded-xl flex items-center justify-between border border-stone-100">
            <div>
              <div className="text-[10px] font-bold text-stone-400 uppercase">Personal Details</div>
              <div className="font-bold text-stone-700">{profile.gender} • {new Date(profile.dob).toLocaleDateString()}</div>
              <div className="text-xs text-stone-500">Age: {profile.age} Years</div>
            </div>
            <button onClick={() => { if (confirm("Changing Date of Birth or Gender may affect medical records and trends. Proceed with caution.")) setUnlockPersonal(true); }}><Lock size={16} className="text-stone-400" /></button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-stone-100">
            <div>
              <label className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Date of Birth</label>
              <input id="field-dob" type="date" value={vitalsForm.dob || profile.dob || ''} onChange={e => {
                const dob = e.target.value;
                setVitalsForm(p => ({ ...p, dob, age: calculateAge(dob) }));
              }} className="w-full bg-stone-50 p-3 rounded-xl font-bold text-sm transition-all duration-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Gender</label>
              <select value={vitalsForm.gender || profile.gender || ''} onChange={e => setVitalsForm(p => ({ ...p, gender: e.target.value }))} className="w-full bg-stone-50 p-3 rounded-xl font-bold text-sm h-[46px]">
                <option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option>
              </select>
            </div>
          </div>
        )}

        {/* Comorbidities Section */}
        {!unlockComorbidities && profile.comorbidities?.length > 0 ? (
          <div className="mb-6 p-4 bg-stone-50 rounded-xl flex items-center justify-between border border-stone-100">
            <div>
              <div className="text-[10px] font-bold text-stone-400 uppercase">Comorbidities</div>
              <div className="font-bold text-stone-700">{profile.comorbidities.join(', ')}</div>
            </div>
            <button onClick={() => setUnlockComorbidities(true)}><Lock size={16} className="text-stone-400" /></button>
          </div>
        ) : (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-stone-400 text-xs uppercase flex items-center gap-2"><Activity size={12} /> Comorbidities</h3>
              {unlockComorbidities && <button onClick={() => setUnlockComorbidities(false)}><Unlock size={16} className="text-stone-400" /></button>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["Nill", "Hypertension", "High Cholesterol", "Thyroid", "Kidney Disease", "Heart Disease", "Neuropathy"].map(c => (
                <label key={c} className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${(profile.comorbidities || []).includes(c) ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-600'}`}>
                  <input
                    type="checkbox"
                    checked={(profile.comorbidities || []).includes(c)}
                    onChange={e => {
                      const current = profile.comorbidities || [];
                      let newC;
                      if (c === "Nill") {
                        newC = e.target.checked ? ["Nill"] : [];
                      } else {
                        if (e.target.checked) {
                          newC = [...current.filter(i => i !== "Nill"), c];
                        } else {
                          newC = current.filter(i => i !== c);
                        }
                      }
                      setProfile(prev => ({ ...prev, comorbidities: newC }));
                    }}
                    className="hidden"
                  />
                  {c}
                </label>
              ))}
            </div>
          </div>
        )}

        <h3 className="font-bold text-stone-400 text-xs uppercase mb-4 flex items-center gap-2"><Activity size={12} /> Update Vitals</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-stone-400 uppercase mb-1 ml-1">Weight (kg)</label>
            <input id="field-weight" type="number" placeholder={`${profile.weight || '-'}`} min="1" max="1000" value={vitalsForm.weight || ''} onChange={e => setVitalsForm({ ...vitalsForm, weight: e.target.value })} className="bg-stone-50 p-5 rounded-2xl font-black text-2xl outline-none focus:bg-blue-50 border-2 border-transparent focus:border-blue-200 transition-all" />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-stone-400 uppercase mb-1 ml-1">HbA1c (%)</label>
            <input id="field-hba1c" type="number" step="0.1" placeholder={`${profile.hba1c || '-'}`} min="3" max="20" value={vitalsForm.hba1c || ''} onChange={e => setVitalsForm({ ...vitalsForm, hba1c: e.target.value })} className="bg-stone-50 p-5 rounded-2xl font-black text-2xl outline-none focus:bg-emerald-50 border-2 border-transparent focus:border-emerald-200 transition-all" />
          </div>
        </div>
        <div className="flex flex-col mb-6">
          <label className="text-[10px] font-bold text-stone-400 uppercase mb-1 ml-1">Creatinine (mg/dL)</label>
          <input id="field-creatinine" type="number" step="0.1" placeholder={`${profile.creatinine || '-'}`} min="0.1" max="15" value={vitalsForm.creatinine || ''} onChange={e => setVitalsForm({ ...vitalsForm, creatinine: e.target.value })} className="bg-stone-50 p-5 rounded-2xl font-black text-2xl outline-none focus:bg-purple-50 border-2 border-transparent focus:border-purple-200 transition-all" />
        </div>

        {(profile.gender === 'Female' || vitalsForm.gender === 'Female') && (
          <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer mb-6 ${vitalsForm.pregnancyStatus || profile.pregnancyStatus ? 'border-red-200 bg-red-50' : 'border-stone-100'}`}>
            <Baby className={vitalsForm.pregnancyStatus || profile.pregnancyStatus ? "text-red-500" : "text-stone-300"} />
            <span className="font-bold text-sm text-stone-700">Patient is Pregnant</span>
            <div className={`w-10 h-6 rounded-full transition-all relative ml-auto ${vitalsForm.pregnancyStatus || profile.pregnancyStatus ? 'bg-red-500' : 'bg-stone-200'}`}>
              <input type="checkbox" checked={vitalsForm.pregnancyStatus !== undefined ? vitalsForm.pregnancyStatus : profile.pregnancyStatus} onChange={e => setVitalsForm({ ...vitalsForm, pregnancyStatus: e.target.checked })} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${vitalsForm.pregnancyStatus || profile.pregnancyStatus ? 'left-5' : 'left-1'}`} />
            </div>
          </label>
        )}

        <div className="mt-4 mb-4">
          <label className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Doctor Notes / Instructions</label>
          <textarea
            value={vitalsForm.instructions !== undefined ? vitalsForm.instructions : profile.instructions}
            onChange={e => setVitalsForm({ ...vitalsForm, instructions: e.target.value })}
            className="w-full bg-stone-50 p-3 rounded-xl text-sm min-h-[80px] outline-none"
            placeholder="Enter medical instructions here..."
          ></textarea>
        </div>

        <div className="mb-4 bg-stone-50 p-4 rounded-xl border border-stone-100">
          <label className="text-[10px] font-bold text-stone-400 uppercase block mb-2">Vital Record Date & Time</label>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-stone-300" />
            <input
              type="datetime-local"
              value={vitalsLogTime}
              onChange={(e) => setVitalsLogTime(e.target.value)}
              className="bg-transparent font-bold text-stone-700 outline-none w-full text-sm"
            />
          </div>
        </div>

        {editingLog && editingLog.type === 'vital_update' ? (
          !isCaregiverMode && (
            <div className="flex gap-2">
              <button onClick={handleSaveProfile} className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg">Update Record</button>
              <button onClick={() => { setEditingLog(null); setVitalsForm({}); setVitalsLogTime(new Date().toISOString().slice(0, 16)); }} className="flex-1 bg-stone-200 text-stone-600 py-4 rounded-xl font-bold">Cancel</button>
            </div>
          )
        ) : (
          !isCaregiverMode && <button onClick={() => { triggerHaptic(); handleSaveProfile(); }} className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold shadow-lg">Save & Update</button>
        )}
      </div>

      <div className="mt-8 text-center">
        <button onClick={handleSeedDatabase} className="text-xs font-bold text-stone-300 hover:text-emerald-500 flex items-center justify-center gap-1 mx-auto"><Database size={10} /> Sync Med Database</button>
      </div>

      <div className="space-y-3 mt-8">
        <button onClick={handleShareLink} className="w-full flex justify-between items-center p-4 bg-emerald-50 text-emerald-700 rounded-2xl font-bold text-sm hover:bg-emerald-100 transition-all">
          <div className="flex items-center gap-2"><Lock size={16} /> {T('share')}</div>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Danger Zone */}
      <div className="mt-8 pt-6 border-t border-stone-100">
        <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-4">Danger Zone</h4>
        <button onClick={handleSoftDelete} className="w-full flex justify-between items-center p-4 bg-red-50 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all">
          <div className="flex items-center gap-2"><Trash2 size={16} /> Delete Account</div>
          <ChevronRight size={16} />
        </button>
        <p className="text-[10px] text-stone-400 mt-2 px-2">Account can be recovered within 30 days of deletion.</p>
      </div>

      {/* Reminders Toggle - HIDDEN IN CAREGIVER MODE */}
      {!isCaregiverMode && (
        <div className="mt-4 pt-4 border-t border-stone-100">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-stone-400" />
              <span className="text-sm font-bold text-stone-700">{T('reminder')}</span>
            </div>
            <button
              onClick={requestNotificationPermission}
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${remindersEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-100 text-stone-400'}`}
            >
              {remindersEnabled ? 'Enabled' : 'Enable'}
            </button>
          </div>
          {remindersEnabled && (
            <button onClick={scheduleDemoReminder} className="text-[10px] font-bold text-blue-500 hover:text-blue-600">
              Schedule 10s Test Reminder
            </button>
          )}
        </div>
      )}



      <div className="flex justify-between items-center mb-4 mt-8">
        <h3 className="font-bold text-stone-400 text-xs uppercase flex items-center gap-2"><TrendingUp size={12} /> Vital Trends</h3>
      </div>
      <div className="flex flex-col gap-3">
        <GraphErrorBoundary>
          <SimpleTrendGraph
            data={getTrendData('weight')} label="Weight" unit="kg" color="orange" normalRange={null}
            onClick={() => setExpandedGraphData({ data: getTrendData('weight'), label: "Weight", unit: "kg", color: "orange", normalRange: null })}
            disableHover={!!expandedGraphData}
          />
        </GraphErrorBoundary>
        <GraphErrorBoundary>
          <SimpleTrendGraph
            data={getTrendData('hba1c')} label="HbA1c" unit="%" color="emerald" normalRange={5.7}
            onClick={() => setExpandedGraphData({ data: getTrendData('hba1c'), label: "HbA1c", unit: "%", color: "emerald", normalRange: 5.7 })}
            disableHover={!!expandedGraphData}
          />
        </GraphErrorBoundary>
        <GraphErrorBoundary>
          <SimpleTrendGraph
            data={getTrendData('creatinine')} label="Creatinine" unit="mg/dL" color="purple" normalRange={1.2}
            onClick={() => setExpandedGraphData({ data: getTrendData('creatinine'), label: "Creatinine", unit: "mg/dL", color: "purple", normalRange: 1.2 })}
            disableHover={!!expandedGraphData}
          />
        </GraphErrorBoundary>
      </div>
    </div >
  )
}

{
  view === 'prescription' && (
    <div className="px-6 pb-32 animate-in slide-in-from-right">
      <h2 className="text-2xl font-serif font-bold mb-4 flex items-center gap-2 text-stone-800"><Stethoscope className="text-emerald-600" /> Prescription</h2>
      {/* UNIFIED PRESCRIPTION MANAGER */}
      <div className="bg-white p-4 rounded-[24px] shadow-sm mb-6">
        <h3 className="font-bold text-stone-700 mb-4 flex items-center gap-2"><Pill size={18} /> Medications & Insulins</h3>

        {/* SEPARATE SEARCH ADDITIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* INSULIN SEARCH */}
          <div className="relative search-container">
            <div className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${showInsulinResults ? 'border-emerald-500 ring-4 ring-emerald-50 bg-white' : 'border-stone-100 bg-stone-50 hover:border-stone-200'}`}>
              <div className="bg-emerald-100 p-2 rounded-lg"><Syringe size={18} className="text-emerald-600" /></div>
              <input
                type="text"
                placeholder="Add Insulin..."
                value={insulinSearch}
                onChange={e => { setInsulinSearch(e.target.value); setShowInsulinResults(true); }}
                onFocus={() => setShowInsulinResults(true)}
                className="flex-1 bg-transparent outline-none font-bold text-stone-700 placeholder-stone-400 text-sm"
              />
              {insulinSearch && <button onClick={() => { setInsulinSearch(''); setShowInsulinResults(false); }}><X size={16} className="text-stone-400" /></button>}
            </div>

            {showInsulinResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-stone-100 max-h-60 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2">
                {medDatabase.insulins.filter(i => i.name.toLowerCase().includes(insulinSearch.toLowerCase())).map(insulin => (
                  <button
                    key={insulin.name}
                    onClick={() => {
                      if (prescription.insulins.find(i => i.name === insulin.name)) return alert("Already added!");
                      const newInsulin = { ...insulin, id: generateId(), type: 'insulin', frequency: 'Before Meals' };
                      setPrescription(p => ({ ...p, insulins: [...p.insulins, newInsulin] }));
                      setInsulinSearch(''); setShowInsulinResults(false);
                      alert(`${insulin.name} added!`);
                    }}
                    className="w-full text-left p-3 hover:bg-stone-50 flex items-center justify-between group"
                  >
                    <span className="font-bold text-stone-700">{insulin.name}</span>
                    <PlusCircle size={18} className="text-stone-300 group-hover:text-emerald-500 transition-colors" />
                  </button>
                ))}
                <button onClick={() => {
                  const name = prompt("Enter Custom Insulin Name:");
                  if (name) {
                    const newInsulin = { name, id: generateId(), type: 'insulin', frequency: 'Before Meals', isCustom: true };
                    setPrescription(p => ({ ...p, insulins: [...p.insulins, newInsulin] }));
                    setInsulinSearch(''); setShowInsulinResults(false);
                  }
                }} className="w-full text-left p-3 hover:bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center gap-2 border-t border-stone-50">
                  <Plus size={14} /> Add Custom "{insulinSearch}"
                </button>
              </div>
            )}
          </div>

          {/* ORAL MEDICATION SEARCH */}
          <div className="relative search-container">
            <div className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${showOralResults ? 'border-blue-500 ring-4 ring-blue-50 bg-white' : 'border-stone-100 bg-stone-50 hover:border-stone-200'}`}>
              <div className="bg-blue-100 p-2 rounded-lg"><Pill size={18} className="text-blue-600" /></div>
              <input
                type="text"
                placeholder="Add Medication..."
                value={oralSearch}
                onChange={e => { setOralSearch(e.target.value); setShowOralResults(true); }}
                onFocus={() => setShowOralResults(true)}
                className="flex-1 bg-transparent outline-none font-bold text-stone-700 placeholder-stone-400 text-sm"
              />
              {oralSearch && <button onClick={() => { setOralSearch(''); setShowOralResults(false); }}><X size={16} className="text-stone-400" /></button>}
            </div>

            {showOralResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-stone-100 max-h-60 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2">
                {medDatabase.oralMeds.filter(m => m.name.toLowerCase().includes(oralSearch.toLowerCase())).map(med => (
                  <button
                    key={med.name}
                    onClick={() => {
                      if (prescription.oralMeds.find(m => m.name === med.name)) return alert("Already added!");
                      if (checkContraindication(med.name)) alert("WARNING: Potential Contradiction Detected (Pregnancy). Please verify with doctor.");
                      const newMed = { ...med, id: generateId(), type: 'oral', frequency: 'Twice Daily', timings: ['Morning', 'Evening'] };
                      setPrescription(p => ({ ...p, oralMeds: [...p.oralMeds, newMed] }));
                      setOralSearch(''); setShowOralResults(false);
                      alert(`${med.name} added!`);
                    }}
                    className="w-full text-left p-3 hover:bg-stone-50 flex items-center justify-between group"
                  >
                    <span className="font-bold text-stone-700">{med.name}</span>
                    <PlusCircle size={18} className="text-stone-300 group-hover:text-blue-500 transition-colors" />
                  </button>
                ))}
                <button onClick={() => {
                  const name = prompt("Enter Custom Medication Name:");
                  if (name) {
                    const newMed = { name, id: generateId(), type: 'oral', frequency: 'Once Daily', timings: ['Morning'], isCustom: true };
                    setPrescription(p => ({ ...p, oralMeds: [...p.oralMeds, newMed] }));
                    setOralSearch(''); setShowOralResults(false);
                  }
                }} className="w-full text-left p-3 hover:bg-blue-50 text-blue-600 font-bold text-xs flex items-center gap-2 border-t border-stone-50">
                  <Plus size={14} /> Add Custom "{oralSearch}"
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ACTIVE LIST */}
        <div className="space-y-4">
          {prescription.insulins.map((insulin, idx) => (
            <div key={insulin.id} className="bg-stone-50 p-4 rounded-xl border border-stone-100 relative group">
              <button onClick={() => {
                if (confirm(`Remove ${insulin.name}?`)) setPrescription(p => ({ ...p, insulins: p.insulins.filter(i => i.id !== insulin.id) }));
              }} className="absolute top-2 right-2 p-2 bg-white rounded-full text-stone-300 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all"><X size={14} /></button>

              <div className="flex items-center gap-3 mb-3">
                <div className="bg-emerald-100 text-emerald-700 font-black px-2 py-1 rounded text-xs">INSULIN</div>
                <span className="font-bold text-stone-800">{insulin.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[9px] font-bold text-stone-400 uppercase">Frequency</label>
                  <select value={insulin.frequency} onChange={e => {
                    const newInsulins = [...prescription.insulins];
                    newInsulins[idx].frequency = e.target.value;
                    setPrescription({ ...prescription, insulins: newInsulins });
                  }} className="w-full bg-white p-2 rounded-lg text-xs font-bold border border-stone-200 outline-none">
                    {INSULIN_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-bold text-stone-400 uppercase">Dosing Strategy</label>
                  {/* Simplified Dosing UI for Mobile - Just Sliding Scale Toggle */}
                </div>

                {/* Sliding Scale Builder */}
                <div className="bg-white p-3 rounded-xl border border-stone-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-stone-600">Sliding Scale Rules</span>
                    <button onClick={() => {
                      const newInsulins = [...prescription.insulins];
                      newInsulins[idx].slidingScale = [...(newInsulins[idx].slidingScale || []), { min: 150, max: 200, dose: 2 }];
                      setPrescription({ ...prescription, insulins: newInsulins });
                    }} className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+ Add Rule</button>
                  </div>
                  {(insulin.slidingScale || []).map((rule, rIdx) => (
                    <div key={rIdx} className="flex items-center gap-2 mb-2 text-xs">
                      <span className="text-stone-400 font-bold">If</span>
                      <input type="number" className="w-12 bg-stone-50 border p-1 rounded font-bold text-center" value={rule.min} onChange={e => {
                        const newInsulins = [...prescription.insulins];
                        newInsulins[idx].slidingScale[rIdx].min = e.target.value;
                        setPrescription({ ...prescription, insulins: newInsulins });
                      }} />
                      <span className="text-stone-300">-</span>
                      <input type="number" className="w-12 bg-stone-50 border p-1 rounded font-bold text-center" value={rule.max} onChange={e => {
                        const newInsulins = [...prescription.insulins];
                        newInsulins[idx].slidingScale[rIdx].max = e.target.value;
                        setPrescription({ ...prescription, insulins: newInsulins });
                      }} />
                      <span className="text-stone-400 font-bold">mg/dL</span>
                      <span className="text-stone-300">→</span>
                      <input type="number" className="w-10 bg-emerald-50 border border-emerald-100 p-1 rounded font-bold text-emerald-700 text-center" value={rule.dose} onChange={e => {
                        const newInsulins = [...prescription.insulins];
                        newInsulins[idx].slidingScale[rIdx].dose = e.target.value;
                        setPrescription({ ...prescription, insulins: newInsulins });
                      }} />
                      <span className="text-stone-400 font-bold">u</span>
                      <button onClick={() => {
                        const newInsulins = [...prescription.insulins];
                        newInsulins[idx].slidingScale = newInsulins[idx].slidingScale.filter((_, i) => i !== rIdx);
                        setPrescription({ ...prescription, insulins: newInsulins });
                      }} className="ml-auto text-stone-300 hover:text-red-400"><X size={12} /></button>
                    </div>
                  ))}
                  {(insulin.slidingScale || []).length === 0 && <div className="text-center text-[10px] text-stone-400 italic py-2">No active rules. Regular fixed dose or manual entry will apply.</div>}
                </div>
              </div>
            </div>
          ))}

          {prescription.oralMeds.map((med, idx) => (
            <div key={med.id} className="bg-stone-50 p-4 rounded-xl border border-stone-100 relative group">
              <button onClick={() => {
                if (confirm(`Remove ${med.name}?`)) setPrescription(p => ({ ...p, oralMeds: p.oralMeds.filter(m => m.id !== med.id) }));
              }} className="absolute top-2 right-2 p-2 bg-white rounded-full text-stone-300 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all"><X size={14} /></button>

              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 text-blue-700 font-black px-2 py-1 rounded text-xs">PILL</div>
                <span className="font-bold text-stone-800">{med.name}</span>
                <span className="text-xs text-stone-400 bg-white px-2 py-1 rounded border border-stone-100">{med.dose || 'Standard Dose'}</span>
              </div>

              <div>
                <label className="text-[9px] font-bold text-stone-400 uppercase block mb-1">Schedule</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_TIMINGS.map(t => (
                    <button key={t} onClick={() => {
                      const newMeds = [...prescription.oralMeds];
                      if (newMeds[idx].timings.includes(t)) newMeds[idx].timings = newMeds[idx].timings.filter(x => x !== t);
                      else newMeds[idx].timings.push(t);
                      setPrescription({ ...prescription, oralMeds: newMeds });
                    }} className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${med.timings.includes(t) ? 'bg-blue-500 text-white border-blue-600 shadow-md' : 'bg-white text-stone-400 border-stone-200 hover:border-stone-300'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {!isCaregiverMode && <button onClick={handleSavePrescription} className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold shadow-lg mt-6 flex justify-center gap-2"><Save size={18} /> Save Prescription</button>}
      </div>
    </div>
  )
}

{
  view === 'history' && (
    <div className="px-6 pb-32 animate-in slide-in-from-right">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif font-bold flex items-center gap-2 text-stone-800"><BookOpen className="text-stone-800" /> History</h2>
        <button onClick={generatePDF} className="bg-stone-900 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"><Download size={14} /> PDF Report</button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <div className="bg-white p-2 rounded-xl border border-stone-100 flex items-center gap-2 min-w-[140px]">
          <Calendar size={14} className="text-stone-400" />
          <div className="flex flex-col">
            <label className="text-[8px] font-bold text-stone-400 uppercase">Start Date</label>
            <input type="date" value={pdfStartDate} onChange={e => setPdfStartDate(e.target.value)} className="text-xs font-bold outline-none text-stone-700 bg-transparent" />
          </div>
        </div>
        <div className="bg-white p-2 rounded-xl border border-stone-100 flex items-center gap-2 min-w-[140px]">
          <Calendar size={14} className="text-stone-400" />
          <div className="flex flex-col">
            <label className="text-[8px] font-bold text-stone-400 uppercase">End Date</label>
            <input type="date" value={pdfEndDate} onChange={e => setPdfEndDate(e.target.value)} className="text-xs font-bold outline-none text-stone-700 bg-transparent" />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-[24px] shadow-sm mb-6">
        <h3 className="font-bold text-stone-700 mb-4 text-sm uppercase tracking-widest flex items-center gap-2"><LayoutList size={16} /> Logbook History</h3>

        {fullHistory.filter(l => !l.type).length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4"><BookOpen className="text-stone-200" /></div>
            <p className="text-stone-400 font-bold">No entries found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fullHistory.map(log => {
              const dateObj = log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000) : new Date(log.timestamp);
              const isLocked = isActionLocked(log.timestamp);

              return (
                <div key={log.id} className="bg-stone-50 p-5 rounded-[24px] border border-stone-100 relative group animate-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-2xl text-center min-w-[50px] shadow-sm">
                        <div className="text-[10px] font-black text-stone-400 uppercase leading-none">{dateObj.toLocaleDateString(undefined, { month: 'short' })}</div>
                        <div className="text-xl font-black text-stone-800 leading-none">{dateObj.getDate()}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="font-bold text-stone-600 text-sm">Entry Log</div>
                      </div>
                    </div>
                    {!isCaregiverMode && (
                      <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleStartEdit(log)} className="p-2 bg-white rounded-xl text-stone-400 hover:text-blue-500 shadow-sm transition-colors"><Edit3 size={16} /></button>
                        <button onClick={() => handleDeleteEntry(log.id)} disabled={isLocked} className={`p-2 bg-white rounded-xl shadow-sm transition-colors ${isLocked ? 'text-stone-200 cursor-not-allowed' : 'text-stone-400 hover:text-red-500'}`}>{isLocked ? <Lock size={16} /> : <Trash2 size={16} />}</button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {log.hgt && (
                      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-stone-100">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${log.hgt < 70 ? 'bg-red-500' : log.hgt > 180 ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                          <span className="font-bold text-stone-700 text-lg">{log.hgt} <span className="text-xs text-stone-400">mg/dL</span></span>
                        </div>
                        <span className="text-[10px] font-bold text-stone-400 uppercase bg-stone-50 px-2 py-1 rounded">{log.mealStatus}</span>
                      </div>
                    )}

                    {log.medsTaken && log.medsTaken.length > 0 && (
                      <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                        <div className="text-[9px] font-bold text-blue-400 uppercase mb-2 flex items-center gap-1"><Pill size={10} /> Meds Taken</div>
                        <div className="flex flex-wrap gap-2">
                          {log.medsTaken.map(k => {
                            const [id, time] = k.split('_');
                            const med = prescription.oralMeds.find(m => m.id === id);
                            return med ? (
                              <span key={k} className="text-xs font-bold text-blue-700 bg-white px-2 py-1 rounded-lg border border-blue-100 shadow-sm">
                                {med.name} <span className="text-blue-300">•</span> {time}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    {log.insulinDoses && Object.keys(log.insulinDoses).length > 0 && (
                      <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                        <div className="text-[9px] font-bold text-emerald-500 uppercase mb-2 flex items-center gap-1"><Syringe size={10} /> Insulin</div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(log.insulinDoses).map(([id, dose]) => {
                            const ins = prescription.insulins.find(i => i.id === id);
                            return ins ? (
                              <span key={id} className="text-xs font-bold text-emerald-700 bg-white px-2 py-1 rounded-lg border border-emerald-100 shadow-sm">
                                {ins.name} <span className="text-emerald-300">•</span> {dose}u
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    {log.tags && log.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {log.tags.map(t => <span key={t} className="text-[10px] font-bold text-stone-500 bg-stone-200 px-2 py-0.5 rounded-full">{TAG_EMOJIS[t] || ''} {t}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}

{/* NAV */ }
<nav className="fixed bottom-6 left-6 right-6 max-w-md mx-auto bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl p-2 rounded-full flex justify-between items-center z-50 shadow-2xl border border-white/20 ring-1 ring-black/5">
  <button onClick={() => { triggerHaptic(hapticsEnabled); setView('diary'); }} className={`p-4 rounded-full transition-all duration-300 flex flex-col items-center gap-1 ${view === 'diary' ? 'bg-stone-900 dark:bg-emerald-500 text-white shadow-lg scale-105' : 'text-stone-400 hover:bg-white/50 dark:hover:bg-stone-800 hover:text-stone-600'}`}>
    <Edit3 size={20} strokeWidth={view === 'diary' ? 2.5 : 2} />
  </button>
  <button onClick={() => { triggerHaptic(hapticsEnabled); setView('prescription'); }} className={`p-4 rounded-full transition-all duration-300 flex flex-col items-center gap-1 ${view === 'prescription' ? 'bg-stone-900 dark:bg-emerald-500 text-white shadow-lg scale-105' : 'text-stone-400 hover:bg-white/50 dark:hover:bg-stone-800 hover:text-stone-600'}`}>
    <Stethoscope size={20} strokeWidth={view === 'prescription' ? 2.5 : 2} />
  </button>
  <button onClick={() => { triggerHaptic(hapticsEnabled); setView('history'); }} className={`p-4 rounded-full transition-all duration-300 flex flex-col items-center gap-1 ${view === 'history' ? 'bg-stone-900 dark:bg-emerald-500 text-white shadow-lg scale-105' : 'text-stone-400 hover:bg-white/50 dark:hover:bg-stone-800 hover:text-stone-600'}`}>
    <FileText size={20} strokeWidth={view === 'history' ? 2.5 : 2} />
  </button>
  <button onClick={() => { triggerHaptic(hapticsEnabled); setView('profile'); }} className={`p-4 rounded-full transition-all duration-300 flex flex-col items-center gap-1 ${view === 'profile' ? 'bg-stone-900 dark:bg-emerald-500 text-white shadow-lg scale-105' : 'text-stone-400 hover:bg-white/50 dark:hover:bg-stone-800 hover:text-stone-600'}`}>
    <User size={20} strokeWidth={view === 'profile' ? 2.5 : 2} />
  </button>
</nav>
{
  expandedGraphData && (
    <ExpandedGraphModal
      {...expandedGraphData}
      fullHistory={fullHistory}
      onEdit={handleStartEditVital}
      onDelete={handleDeleteEntry}
      onClose={() => setExpandedGraphData(null)}
    />
  )
}

<div className="absolute bottom-4 left-0 right-0 text-center opacity-40 hover:opacity-100 transition-opacity pb-24">
  <p className="text-[10px] font-bold text-stone-400 dark:text-stone-600">© Dr Divyansh Kotak</p>
  <p className="text-[9px] text-stone-300 dark:text-stone-700 mt-1">Disclaimer: Information provided is for logging purposes only and is not medical advice.</p>
</div>
      </div >
    </SecurityGuardian >
    </GlobalRecoveryBoundary >
  );
}
