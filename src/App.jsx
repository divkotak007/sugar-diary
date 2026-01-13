import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, signInWithCustomToken } from 'firebase/auth';
import {
  getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp,
  onSnapshot, query, orderBy, limit
} from 'firebase/firestore';
import {
  BookOpen, Settings, Edit3, Save, LogOut, Activity, Droplet,
  User, CheckCircle2, Clock, Utensils, Syringe, FileText, Download,
  ShieldAlert, ScrollText, Printer, Info, Thermometer, Candy, Dumbbell,
  AlertTriangle, Zap, Wine, Sandwich, Pill, Trash2, XCircle, CheckSquare,
  PlusCircle, Stethoscope, Baby, AlertCircle, ChevronRight, Calendar, TrendingUp, Lock, Unlock, Database, X, Contrast, Moon
} from 'lucide-react';

// --- NEW MODULAR IMPORTS ---
// Data modules
import {
  DEFAULT_MED_DATABASE as IMPORTED_MED_DATABASE,
  FREQUENCY_RULES as IMPORTED_FREQUENCY_RULES,
  INSULIN_FREQUENCIES as IMPORTED_INSULIN_FREQUENCIES,
  ALL_TIMINGS as IMPORTED_ALL_TIMINGS,
  CONTRAINDICATIONS as IMPORTED_CONTRAINDICATIONS,
  TAG_EMOJIS as IMPORTED_TAG_EMOJIS,
  isContraindicated,
  checkGlucoseLevel
} from './data/medications.js';

// Validation utilities
import {
  validateGlucose,
  validateProfile,
  validateLogEntry,
  VALIDATION_STATUS
} from './utils/schemaValidation.js';

// Graph calculation utilities
import {
  getTrendData as calculateTrendData,
  analyzeTrend,
  GRAPH_COLORS
} from './utils/graphCalculations.js';

// Components
import StatBadge from './components/StatBadge.jsx';
import { SimpleTrendGraph, ExpandedGraphModal } from './components/TrendGraph.jsx';
import ConsentScreen from './components/ConsentScreen.jsx';
import ExtremeValueConfirmation from './components/ExtremeValueConfirmation.jsx';
import MedicalDisclaimer from './components/MedicalDisclaimer.jsx';
import SyncIndicator from './components/SyncIndicator.jsx';

// Lazy load heavier components
const ExportPanel = lazy(() => import('./components/ExportPanel.jsx'));
const DataManagement = lazy(() => import('./components/DataManagement.jsx'));

// Services
import { downloadAllDataAsJSON, downloadLogsAsCSV } from './services/exportService.js';

// Hooks
import useAccessibility from './hooks/useAccessibility.js';
import useOfflineSync from './hooks/useOfflineSync.js';

// NOTE: jsPDF and autoTable are loaded dynamically via CDN in useEffect to prevent build errors.

// --- CONFIGURATION ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ?
  JSON.parse(__firebase_config) : {
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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'sugar-diary-v1';

// --- USE IMPORTED CONSTANTS (with fallbacks for safety) ---
const DEFAULT_MED_DATABASE = IMPORTED_MED_DATABASE || {
  insulins: {
    rapid: ["Insulin Aspart (NovoRapid)", "Insulin Lispro (Humalog)", "Insulin Glulisine (Apidra)", "Fiasp"],
    short: ["Regular Human Insulin (Actrapid)", "Humulin R"],
    intermediate: ["NPH (Insulatard)", "Humulin N"],
    basal: ["Glargine U-100 (Lantus)", "Glargine U-300 (Toujeo)", "Detemir (Levemir)", "Degludec (Tresiba)", "Basalog"],
    premix: ["Mixtard 30/70", "NovoMix 30", "Humalog Mix 25", "Humalog Mix 50", "Ryzodeg"]
  },
  oralMeds: {
    biguanides: ["Metformin 500mg", "Metformin 850mg", "Metformin 1000mg ER"],
    sulfonylureas: ["Glimepiride 1mg", "Glimepiride 2mg", "Gliclazide 80mg", "Gliclazide MR 60mg"],
    dpp4: ["Sitagliptin 100mg", "Vildagliptin 50mg", "Teneligliptin 20mg", "Linagliptin 5mg"],
    sglt2: ["Dapagliflozin 10mg", "Empagliflozin 25mg", "Canagliflozin 100mg", "Remogliflozin 100mg"],
    tzd: ["Pioglitazone 15mg", "Pioglitazone 30mg"],
    combinations: ["Glimepiride + Metformin", "Vildagliptin + Metformin", "Sitagliptin + Metformin", "Dapagliflozin + Metformin"],
    others: ["Voglibose 0.2mg", "Acarbose 25mg", "Rybelsus 3mg"]
  }
};

const FREQUENCY_RULES = IMPORTED_FREQUENCY_RULES || {
  "Once Daily": ["Morning"],
  "Twice Daily": ["Morning", "Evening"],
  "Thrice Daily": ["Morning", "Afternoon", "Evening"],
  "Bedtime": ["Bedtime"],
  "Before Meals": ["Breakfast", "Lunch", "Dinner"],
  "SOS": ["As Needed"]
};

const INSULIN_FREQUENCIES = IMPORTED_INSULIN_FREQUENCIES || ["Bedtime", "Before Meals", "Twice Daily", "Once Daily", "SOS"];
const ALL_TIMINGS = IMPORTED_ALL_TIMINGS || ["Morning", "Breakfast", "Lunch", "Afternoon", "Evening", "Dinner", "Bedtime", "As Needed"];
const CONTRAINDICATIONS = IMPORTED_CONTRAINDICATIONS || {
  pregnancy: ["Pioglitazone", "Dapagliflozin", "Empagliflozin", "Canagliflozin", "Glimepiride", "Gliclazide", "Rybelsus"]
};

const TAG_EMOJIS = IMPORTED_TAG_EMOJIS || {
  "Sick": "🤒", "Sweets": "🍬", "Heavy Meal": "🍔", "Exercise": "🏃", "Missed Dose": "❌", "Travel": "✈️",
  "Fasting": "⏳"
};

// --- HELPERS ---
const generateId = () => Math.random().toString(36).substr(2, 9);

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
const StatBadge = ({ emoji, label, value, unit, color }) => (
  <div className={`flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-sm border border-${color}-100 min-w-[90px]`}>
    <div className="text-2xl mb-1">{emoji}</div>
    <div className="font-bold text-stone-800 text-lg leading-none">{value || '-'}</div>
    <div className="text-[10px] text-stone-400 font-bold uppercase mt-1">{label}</div>
    {unit && <div className="text-[9px] text-stone-300 font-bold">{unit}</div>}
  </div>
);

const MealOption = ({ label, icon: Icon, selected, onClick }) => (
  <button onClick={onClick} className={`flex-1 py-3 px-2 rounded-xl flex flex-col items-center gap-1 transition-all duration-200 border-2 ${selected ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-md scale-95' : 'bg-white border-transparent text-stone-400 hover:bg-stone-100'}`}>
    <Icon size={20} />
    <span className="text-[10px] font-bold uppercase">{label}</span>
  </button>
);

const ContextTag = ({ label, icon: Icon, selected, onClick, color }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 text-xs font-bold uppercase ${selected ? `bg-${color}-100 border-${color}-400 text-${color}-900 shadow-sm scale-95` : 'bg-white border-stone-200 text-stone-400 hover:border-stone-300'}`}>
    <Icon size={14} /> {label}
  </button>
);

// Graph Component (Clickable, No Overflow)
const SimpleTrendGraph = ({ data, color, label, unit, normalRange, onClick }) => {
  if (!data || data.length < 2) return <div className="h-32 flex items-center justify-center text-xs text-stone-400 italic bg-stone-50 rounded-xl border border-dashed">Insufficient Data for {label}</div>;

  // CORRECTION: Keep small chart to 5 dots only
  const visibleData = data.slice(-5);

  const height = 120;
  const width = 300;
  const padding = 35;

  // FIX: Calculate min/max strictly on visibleData
  const values = visibleData.map(d => d.value);
  let min = Math.min(...values);
  let max = Math.max(...values);

  if (min === max) {
    min -= 1;
    max += 1;
  } else {
    const pad = (max - min) * 0.15; // Increased padding slightly for visual balance
    min -= pad;
    max += pad;
  }
  const range = max - min;

  // FIX: Calculate X steps based on 5 slots (indices 0-4)
  const maxSlots = 4;
  const xStep = (width - 2 * padding) / maxSlots;

  const points = visibleData.map((d, i) => {
    // x uses index directly to place in one of the 5 slots
    const x = padding + (i * xStep);
    const y = height - padding - ((d.value - min) / range) * (height - 2 * padding);
    return { x, y, val: d.value, date: d.date };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const refY = normalRange ? height - padding - ((normalRange - min) / range) * (height - 2 * padding) : null;

  return (
    <div onClick={onClick} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden hover:overflow-visible z-0 hover:z-50 bg-opacity-100">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold uppercase text-stone-500 flex items-center gap-1"><TrendingUp size={12} /> {label} Trend</span>
        <span className={`text-sm font-bold text-${color}-600`}>{data[data.length - 1].value} {unit}</span>
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* CORRECTION: Darker background grid lines for visibility */}
        {[0.2, 0.4, 0.6, 0.8].map(ratio => (
          <line key={ratio} x1={padding} y1={height * ratio} x2={width - padding} y2={height * ratio} stroke="#d1d5db" strokeWidth="1" strokeDasharray="4" />
        ))}

        {label === 'HbA1c' && (
          <g>
            <rect x={padding} y={height - padding - ((5.7 - min) / range) * (height - 2 * padding)} width={width - 2 * padding} height={Math.max(0, ((5.7 - min) / range) * (height - 2 * padding))} fill="#ecfdf5" opacity="0.5" />
            <rect x={padding} y={height - padding - ((6.4 - min) / range) * (height - 2 * padding)} width={width - 2 * padding} height={Math.max(0, ((6.4 - 5.7) / range) * (height - 2 * padding))} fill="#fefce8" opacity="0.5" />
            <rect x={padding} y={padding} width={width - 2 * padding} height={Math.max(0, (height - padding - ((6.4 - min) / range) * (height - 2 * padding)) - padding)} fill="#fff7ed" opacity="0.5" />
          </g>
        )}

        {refY && refY > 0 && refY < height && (
          <g>
            <text x={width - padding} y={refY - 2} textAnchor="end" fontSize="8" fill="#6b7280" fontStyle="italic">Target: {normalRange}</text>
          </g>
        )}
        <polyline fill="none" stroke={color === 'orange' ? '#f97316' : color === 'purple' ? '#a855f7' : color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : '#10b981'} strokeWidth="4" points={polylinePoints} />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={color === 'orange' ? '#f97316' : color === 'purple' ? '#a855f7' : color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : '#10b981'} strokeWidth="2" />
          </g>
        ))}
      </svg>
      <div className="absolute bottom-1 right-2 text-[8px] text-stone-300 font-bold uppercase tracking-widest">Click to Expand</div>
    </div>
  );
};

// Expanded Graph Modal
const ExpandedGraphModal = ({ data, color, label, unit, normalRange, onClose }) => {
  const height = 300;
  // CORRECTION: Calculate width to show ~7 points per view width, allowing scrolling
  const pointsPerView = 7;
  const screenWidth = Math.min(window.innerWidth - 48, 600); // 48px for padding/margins
  const pointSpacing = screenWidth / pointsPerView;
  const graphWidth = Math.max(screenWidth, data.length * pointSpacing);
  const padding = 40;

  const values = data.map(d => d.value);
  const min = Math.min(...values) * 0.9;
  const max = Math.max(...values) * 1.1;
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (graphWidth - 2 * padding);
    const y = height - padding - ((d.value - min) / range) * (height - 2 * padding);
    return { x, y, val: d.value, date: d.date };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const refY = normalRange ? height - padding - ((normalRange - min) / range) * (height - 2 * padding) : null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 animate-in slide-in-from-bottom border-t border-stone-100">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className={`text-2xl font-bold text-${color}-600`}>{label} Analysis</h3>
          <p className="text-sm text-stone-400 font-medium">Detailed trend view ({data.length} records)</p>
        </div>
        <button onClick={onClose} className="p-2 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors"><X size={20} className="text-stone-500" /></button>
      </div>

      {/* CORRECTION: Horizontal Scroll Container */}
      <div className="w-full overflow-x-auto pb-4">
        <svg width={graphWidth} height={height} viewBox={`0 0 ${graphWidth} ${height}`} className="overflow-visible">
          {/* Horizontal Background Lines */}
          {[0.2, 0.4, 0.6, 0.8].map(ratio => (
            <line key={ratio} x1={padding} y1={height * ratio} x2={graphWidth - padding} y2={height * ratio} stroke="#d1d5db" strokeWidth="1" strokeDasharray="4" />
          ))}

          {label === 'HbA1c' && (
            <g>
              <rect x={padding} y={height - padding - ((5.7 - min) / range) * (height - 2 * padding)} width={graphWidth - 2 * padding} height={Math.max(0, ((5.7 - min) / range) * (height - 2 * padding))} fill="#ecfdf5" />
              <rect x={padding} y={height - padding - ((6.4 - min) / range) * (height - 2 * padding)} width={graphWidth - 2 * padding} height={Math.max(0, ((6.4 - 5.7) / range) * (height - 2 * padding))} fill="#fefce8" />
              <rect x={padding} y={padding} width={graphWidth - 2 * padding} height={Math.max(0, (height - padding - ((6.4 - min) / range) * (height - 2 * padding)) - padding)} fill="#fff7ed" />
            </g>
          )}

          {refY && refY > 0 && refY < height && (
            <g>
              <text x={graphWidth - padding} y={refY - 5} textAnchor="end" fontSize="12" fill="#9ca3af" fontWeight="bold">Normal Limit: {normalRange}</text>
            </g>
          )}
          <polyline fill="none" stroke={color === 'orange' ? '#f97316' : color === 'purple' ? '#a855f7' : color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : '#10b981'} strokeWidth="6" points={polylinePoints} />
          {points.map((p, i) => {
            // For expanded view, we can keep the "show only if changed" logic to reduce clutter if desired, 
            // but for consistency with small graph request, I'll show all dots here too unless they overlap too much.
            // Given user asked "5 dots as before" for small chart specifically, I will show all dots here.
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="6" fill="white" stroke={color === 'orange' ? '#f97316' : color === 'purple' ? '#a855f7' : color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : '#10b981'} strokeWidth="3" />
                <text x={p.x} y={p.y - 15} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#374151">{p.val}</text>
                <text x={p.x} y={height} textAnchor="middle" fontSize="10" fill="#9ca3af">{new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// --- CONSENT SCREEN ---
const ConsentScreen = ({ onConsent }) => {
  const [agreed, setAgreed] = useState(false);
  const [termsData, setTermsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/legal/terms_and_conditions.json')
      .then(res => res.json())
      .then(data => {
        setTermsData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load terms:", err);
        setLoading(false);
      });
  }, []);

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
  const [medDatabase, setMedDatabase] = useState(DEFAULT_MED_DATABASE);

  const [vitalsForm, setVitalsForm] = useState({});
  const [hgt, setHgt] = useState('');
  const [mealStatus, setMealStatus] = useState('Pre-Meal');
  const [insulinDoses, setInsulinDoses] = useState({});
  const [medsTaken, setMedsTaken] = useState({});
  const [contextTags, setContextTags] = useState([]);
  const [fullHistory, setFullHistory] = useState([]);

  const [pdfStartDate, setPdfStartDate] = useState('');
  const [pdfEndDate, setPdfEndDate] = useState('');

  const [expandedGraphData, setExpandedGraphData] = useState(null);

  // --- NEW: Accessibility & Offline States ---
  const { highContrast, toggleHighContrast, fontSize, setFontSize } = useAccessibility();
  const { isOnline, pendingCount, isSyncing, queueForSync, processSyncQueue } = useOfflineSync();

  // --- NEW: Extreme value confirmation state ---
  const [extremeValueConfirm, setExtremeValueConfirm] = useState({
    isOpen: false,
    value: '',
    unit: '',
    message: '',
    severity: 'warning',
    onConfirm: null
  });

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

  useEffect(() => {
    const initAuth = async () => {
      await auth.authStateReady();
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try { await signInWithCustomToken(auth, __initial_auth_token); } catch (err) { console.error(err); }
      }
    };
    initAuth();
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

  const checkContraindication = (medName) => profile.pregnancyStatus && CONTRAINDICATIONS.pregnancy.some(c => medName.toLowerCase().includes(c.toLowerCase()));

  const getSuggestion = (insulinId) => {
    const insulin = prescription.insulins.find(i => i.id === insulinId);
    if (!insulin || !insulin.slidingScale || !hgt) return null;
    const current = parseFloat(hgt);
    if (isNaN(current)) return null;
    if (current < 70) return "HYPO ALERT";
    if (profile.pregnancyStatus && CONTRAINDICATIONS.pregnancy.some(c => insulin.name.toLowerCase().includes(c.toLowerCase()))) return "Unsafe (Pregnancy)";
    const rule = insulin.slidingScale.find(r => current >= parseFloat(r.min) && current < parseFloat(r.max));
    if (!rule) return null;
    let dose = parseFloat(rule.dose);
    if (insulin.maxDose && dose > parseFloat(insulin.maxDose)) dose = parseFloat(insulin.maxDose);
    return dose;
  };

  // FIX: Filter NaN values and remove duplicates to prevent clutter
  const getTrendData = (metric) => {
    const data = fullHistory
      .filter(log => log.snapshot?.profile?.[metric] && !isNaN(parseFloat(log.snapshot.profile[metric])))
      .map(log => ({ date: log.timestamp?.seconds * 1000, value: parseFloat(log.snapshot.profile[metric]) }))
      .reverse();

    // Filter out identical consecutive values to prevent clutter (dot only if value changed)
    const filteredData = data.filter((item, index, arr) => {
      if (index === 0) return true;
      return item.value !== arr[index - 1].value;
    });

    if (profile[metric] && (filteredData.length === 0 || filteredData[filteredData.length - 1].value !== parseFloat(profile[metric]))) {
      if (!isNaN(parseFloat(profile[metric]))) {
        filteredData.push({ date: Date.now(), value: parseFloat(profile[metric]) });
      }
    }
    return filteredData;
  };

  const handleSeedDatabase = async () => {
    if (!confirm("Initialize Medication Database?")) return;
    try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'medications', 'master_list'), DEFAULT_MED_DATABASE); alert("Database Initialized!"); } catch (e) { alert("Error: " + e.message); }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (vitalsForm.weight && (parseFloat(vitalsForm.weight) < 1 || parseFloat(vitalsForm.weight) > 300)) return alert("Invalid Weight");
    if (vitalsForm.hba1c && (parseFloat(vitalsForm.hba1c) < 3 || parseFloat(vitalsForm.hba1c) > 20)) return alert("Invalid HbA1c");
    const updatedProfile = { ...profile };
    if (vitalsForm.dob) updatedProfile.dob = vitalsForm.dob;
    if (vitalsForm.gender) updatedProfile.gender = vitalsForm.gender;
    if (vitalsForm.weight) updatedProfile.weight = vitalsForm.weight;
    if (vitalsForm.hba1c) updatedProfile.hba1c = vitalsForm.hba1c;
    if (vitalsForm.creatinine) updatedProfile.creatinine = vitalsForm.creatinine;
    if (vitalsForm.instructions !== undefined) updatedProfile.instructions = vitalsForm.instructions;
    if (updatedProfile.gender === 'Female') updatedProfile.pregnancyStatus = vitalsForm.pregnancyStatus !== undefined ? vitalsForm.pregnancyStatus : profile.pregnancyStatus; else updatedProfile.pregnancyStatus = false;
    if (updatedProfile.dob) updatedProfile.age = calculateAge(updatedProfile.dob);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), { profile: updatedProfile, prescription, schemaVersion: 2, lastUpdated: new Date().toISOString() }, { merge: true });
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), { type: 'vital_update', snapshot: { profile: updatedProfile, prescription }, timestamp: serverTimestamp(), tags: ['Vital Update'] });
      setProfile(updatedProfile); setVitalsForm(prev => ({ ...prev, weight: '', hba1c: '', creatinine: '' })); setUnlockPersonal(false); setUnlockComorbidities(false); alert("Profile & Vitals Updated.");
      if (!prescription.insulins.length) setView('prescription');
    } catch (err) { alert("Save failed."); }
  };

  const handleSavePrescription = async () => {
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), { profile, prescription, lastUpdated: new Date().toISOString() }, { merge: true });
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), { type: 'prescription_update', snapshot: { prescription }, timestamp: serverTimestamp(), tags: ['Rx Change', 'Audit'] });
      alert("Prescription Saved."); setView('diary');
    } catch (err) { alert("Save failed."); }
  };

  const handleSaveEntry = async () => {
    if (!hgt) return alert("Enter Glucose Value");
    const entry = { hgt: parseFloat(hgt), mealStatus, insulinDoses, medsTaken: Object.keys(medsTaken).filter(k => medsTaken[k]), tags: contextTags, timestamp: serverTimestamp(), snapshot: { profile, prescription } };
    setShowSuccess(true); setTimeout(() => setShowSuccess(false), 2000); setHgt(''); setInsulinDoses({}); setMedsTaken({}); setContextTags([]);
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), entry);
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
    doc.setTextColor(255); doc.setFontSize(22); doc.text("SugarDiary Report", 14, 25);
    doc.setFontSize(10); doc.text(`Patient: ${user.displayName || 'User'} | Generated: ${new Date().toLocaleDateString()}`, 14, 35);
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
      doc.setFontSize(9); doc.setTextColor(0); doc.text(title, startX, startY + 5);
      const gX = startX; const gY = startY + 8;
      const vals = data.map(d => d.value);
      let min = Math.min(...vals) * 0.98; let max = Math.max(...vals) * 1.02;
      if (min === max) { min -= 1; max += 1; }
      const range = max - min;

      doc.setDrawColor(200); doc.line(gX, gY + height, gX + width, gY + height);

      // CORRECTION: Background lines in PDF graphs
      [0.25, 0.5, 0.75].forEach(r => {
        doc.setDrawColor(220); doc.setLineWidth(0.1); doc.line(gX, gY + height * r, gX + width, gY + height * r);
      });

      if (norm) {
        const refY = gY + height - ((norm - min) / range) * height;
        if (refY > gY && refY < gY + height) { doc.setDrawColor(200); doc.setLineWidth(0.1); doc.line(gX, refY, gX + width, refY); }
      }
      const [r, g, b] = color === 'orange' ? [249, 115, 22] : color === 'purple' ? [168, 85, 247] : [16, 185, 129];

      // CORRECTION: PDF graphs now use 5 dots format
      let pdfPoints = data;
      if (data.length > 5) pdfPoints = data.slice(-5);

      pdfPoints.forEach((d, i) => {
        if (i === 0) return;
        const prev = pdfPoints[i - 1];
        const x1 = gX + (i - 1) / (pdfPoints.length - 1) * width; const y1 = gY + height - ((prev.value - min) / range) * height;
        const x2 = gX + i / (pdfPoints.length - 1) * width; const y2 = gY + height - ((d.value - min) / range) * height;
        doc.setDrawColor(r, g, b); doc.setLineWidth(0.5); doc.line(x1, y1, x2, y2);
        doc.setFillColor(r, g, b); doc.circle(x2, y2, 1, 'F');
        doc.setFontSize(6); doc.setTextColor(50); doc.text(d.value.toString(), x2, y2 - 2, { align: 'center' });
        doc.setTextColor(150); doc.text(new Date(d.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), x2, y2 + 4, { align: 'center' });
      });
    };

    const gW = 60; const gH = 25;
    drawGraph(getTrendData('weight'), "Weight", 14, finalY, gW, gH, null, 'orange');
    drawGraph(getTrendData('hba1c'), "HbA1c", 14 + gW + 5, finalY, gW, gH, 5.7, 'emerald');
    drawGraph(getTrendData('creatinine'), "Creatinine", 14 + (gW + 5) * 2, finalY, gW, gH, 1.2, 'purple');
    finalY += gH + 15;

    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(0); doc.text("Prescription", 14, finalY);
    const insulinRows = prescription.insulins.map(i => [i.name, i.type, i.frequency || '-', (i.slidingScale || []).map(s => `${s.min}-${s.max}:${s.dose}u`).join(' | ') || 'Fixed']);
    runAutoTable({ startY: finalY + 5, head: [['Insulin', 'Type', 'Freq', 'Scale']], body: insulinRows });
    finalY = (doc.lastAutoTable || {}).finalY + 5;
    const oralRows = prescription.oralMeds.map(m => [m.name, m.dose, m.frequency, m.timings.join(', ')]);
    runAutoTable({ startY: finalY, head: [['Drug', 'Dose', 'Freq', 'Timings']], body: oralRows });

    const pdfFilteredHistory = fullHistory.filter(l => {
      if (l.type === 'vital_update') return false;
      const d = new Date(l.timestamp?.seconds * 1000);
      if (pdfStartDate && d < new Date(pdfStartDate)) return false;
      if (pdfEndDate) { const end = new Date(pdfEndDate); end.setHours(23, 59, 59, 999); if (d > end) return false; }
      return true;
    });
    const totalMeds = pdfFilteredHistory.reduce((acc, log) => acc + (log.medsTaken?.length || 0), 0);
    finalY = (doc.lastAutoTable || {}).finalY + 10;
    doc.setFontSize(10); doc.setTextColor(100); doc.text(`Adherence Summary: ${totalMeds} Oral Medication Doses Recorded in Logged Period`, 14, finalY);

    if (profile.instructions) {
      finalY += 10; doc.setFontSize(12); doc.setTextColor(0); doc.text("Medical Instructions", 14, finalY);
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      const splitText = doc.splitTextToSize(profile.instructions, 180);
      doc.text(splitText, 14, finalY + 7);
      finalY += splitText.length * 5 + 10;
    }
    finalY = Math.max(finalY, (doc.lastAutoTable || {}).finalY + 20);
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(0); doc.text("Logbook", 14, finalY);
    const logRows = pdfFilteredHistory.map(l => [
      new Date(l.timestamp?.seconds * 1000).toLocaleString(), l.hgt || '-', l.mealStatus,
      Object.entries(l.insulinDoses || {}).map(([id, d]) => `${prescription.insulins.find(i => i.id === id)?.name || 'Ins'}: ${d}u`).join(', '),
      (l.tags || []).join(', ')
    ]);
    runAutoTable({ startY: finalY + 5, head: [['Time', 'Sugar', 'Context', 'Insulin', 'Notes']], body: logRows });
    try { doc.save("SugarDiary_Report.pdf"); } catch (e) { alert("Failed to save PDF. Please try again."); }
  };

  if (loading) return <div className="p-10 text-center font-bold text-stone-400">Loading Secure Environment...</div>;
  if (!user) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#fffbf5]"><BookOpen size={64} className="text-emerald-600 mb-4" /><h1 className="text-2xl font-bold text-stone-800 mb-6">Sugar Diary</h1><button onClick={() => signInWithPopup(auth, provider)} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold">Sign In</button></div>;
  if (!profile.hasConsented) return <ConsentScreen onConsent={() => setProfile(p => ({ ...p, hasConsented: true }))} />;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#fffbf5] pb-32 font-sans text-stone-800 relative">
      {expandedGraphData && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={() => setExpandedGraphData(null)} />
          <ExpandedGraphModal {...expandedGraphData} onClose={() => setExpandedGraphData(null)} />
        </>
      )}

      {showSuccess && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"><div className="bg-white p-8 rounded-3xl shadow-xl"><CheckCircle2 className="text-emerald-500 w-16 h-16 mx-auto" /><h3 className="font-bold mt-2">Saved!</h3></div></div>}

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
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Sugar Diary</div>
              <h1 className="text-2xl font-bold text-stone-800">{user.displayName}</h1>
              <div className="text-xs text-stone-400 flex items-center gap-2">
                {profile.gender && <span className="uppercase font-bold text-stone-500">{profile.gender}</span>}
                {profile.pregnancyStatus && <span className="text-red-500 font-bold flex items-center gap-1"><Baby size={10} /> Preg</span>}
              </div>
            </div>
          </div>
          <button onClick={() => signOut(auth)}><LogOut size={20} className="text-red-400 hover:text-red-500" /></button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <StatBadge emoji="🧘‍♂️" label="Age" value={profile.age} unit="Yrs" color="blue" />
          <StatBadge emoji="⚖️" label="Weight" value={profile.weight} unit="kg" color="orange" />
          <StatBadge emoji="🩸" label="HbA1c" value={profile.hba1c} unit="%" color="emerald" />
          <StatBadge emoji="🧪" label="Creat" value={profile.creatinine} unit="mg/dL" color="purple" />
        </div>
      </div>

      {view === 'diary' && (
        <div className="px-6 animate-in fade-in">
          {hgt && parseInt(hgt) < 70 && <div className="bg-red-500 text-white p-3 rounded-xl font-bold text-center mb-4 flex items-center justify-center gap-2 animate-pulse"><AlertTriangle /> LOW SUGAR! TAKE GLUCOSE</div>}
          {hgt && parseInt(hgt) >= 250 && parseInt(hgt) < 300 && <div className="bg-yellow-400 text-stone-900 p-3 rounded-xl font-bold text-center mb-4 flex items-center justify-center gap-2"><AlertTriangle /> POOR CONTROL</div>}
          {hgt && parseInt(hgt) >= 300 && parseInt(hgt) < 400 && <div className="bg-orange-500 text-white p-3 rounded-xl font-bold text-center mb-4 flex items-center justify-center gap-2 animate-pulse"><AlertTriangle /> HIGH SUGAR!</div>}
          {hgt && parseInt(hgt) >= 400 && <div className="bg-red-600 text-white p-3 rounded-xl font-bold text-center mb-4 flex items-center justify-center gap-2 animate-pulse"><AlertTriangle /> DANGER! CHECK KETONES</div>}

          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-stone-100 mb-6">
            <label className="text-xs font-bold text-stone-400 uppercase">Blood Sugar</label>
            <div className="flex items-baseline gap-2 mb-4">
              <input type="number" value={hgt} onChange={e => setHgt(e.target.value)} className="text-6xl font-bold w-full outline-none text-emerald-900" placeholder="---" />
              <span className="text-xl font-bold text-stone-400">mg/dL</span>
            </div>
            <div className="flex gap-2 mb-4">
              {['Fasting', 'Pre-Meal', 'Post-Meal', 'Bedtime'].map(m => <MealOption key={m} label={m} icon={Clock} selected={mealStatus === m} onClick={() => setMealStatus(m)} />)}
            </div>
          </div>

          {prescription.insulins.map(insulin => (
            <div key={insulin.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex justify-between items-center mb-2">
              <div>
                <span className="font-bold text-stone-700 block">{insulin.name}</span>
                <span className="text-xs text-stone-400">{insulin.frequency || 'Manual'}</span>
              </div>
              <div className="flex items-center gap-2">
                {getSuggestion(insulin.id) && (
                  <div className="bg-stone-100 border border-stone-200 px-3 py-1 rounded-lg text-xs font-bold text-stone-500 flex flex-col items-end">
                    <div className="flex items-center gap-1"><Zap size={10} /> {getSuggestion(insulin.id)}u</div>
                    <span className="text-[8px] uppercase tracking-wider text-stone-400">Suggestion only</span>
                  </div>
                )}
                <input type="number" placeholder="0" className="w-16 bg-stone-50 p-2 rounded text-xl font-bold text-right" value={insulinDoses[insulin.id] || ''} onChange={e => setInsulinDoses(p => ({ ...p, [insulin.id]: e.target.value }))} />
              </div>
            </div>
          ))}

          {prescription.oralMeds.map(med => (
            <div key={med.id} className="bg-white p-4 rounded-2xl border border-stone-100 mb-2">
              <div className="font-bold text-sm mb-2">{med.name}</div>
              <div className="flex gap-2 flex-wrap">
                {med.timings.map(t => (
                  <button key={t} onClick={() => setMedsTaken(p => ({ ...p, [`${med.id}_${t}`]: !p[`${med.id}_${t}`] }))} className={`px-3 py-1 rounded-lg border text-xs font-bold ${medsTaken[`${med.id}_${t}`] ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-stone-50'}`}>{t}</button>
                ))}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-2 mt-4 mb-6">
            {Object.keys(TAG_EMOJIS).map(t => <ContextTag key={t} label={`${TAG_EMOJIS[t]} ${t}`} icon={Thermometer} selected={contextTags.includes(t)} onClick={() => { setContextTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]) }} />)}
          </div>

          <button onClick={handleSaveEntry} className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold shadow-lg flex justify-center gap-2 mb-6"><Save /> Save Entry</button>
        </div>
      )}

      {view === 'profile' && (
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
                  <input type="date" value={vitalsForm.dob || profile.dob || ''} onChange={e => {
                    const dob = e.target.value;
                    setVitalsForm(p => ({ ...p, dob, age: calculateAge(dob) }));
                  }} className="w-full bg-stone-50 p-3 rounded-xl font-bold text-sm" />
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
                  <div className="font-bold text-stone-700 text-sm">{profile.comorbidities.join(', ')}</div>
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
                  {["Hypertension", "High Cholesterol", "Thyroid", "Kidney Disease", "Heart Disease", "Neuropathy"].map(c => (
                    <label key={c} className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg text-xs font-bold text-stone-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(profile.comorbidities || []).includes(c)}
                        onChange={e => {
                          const current = profile.comorbidities || [];
                          const newC = e.target.checked ? [...current, c] : current.filter(i => i !== c);
                          setProfile(prev => ({ ...prev, comorbidities: newC }));
                        }}
                        className="accent-stone-900 w-4 h-4"
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <h3 className="font-bold text-stone-400 text-xs uppercase mb-4 flex items-center gap-2"><Activity size={12} /> Update Vitals</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input type="number" placeholder={`Wt: ${profile.weight || '-'} kg`} min="1" max="300" value={vitalsForm.weight || ''} onChange={e => setVitalsForm({ ...vitalsForm, weight: e.target.value })} className="bg-stone-50 p-3 rounded-xl font-bold outline-none focus:bg-blue-50" />
              <input type="number" step="0.1" placeholder={`A1c: ${profile.hba1c || '-'}%`} min="3" max="20" value={vitalsForm.hba1c || ''} onChange={e => setVitalsForm({ ...vitalsForm, hba1c: e.target.value })} className="bg-stone-50 p-3 rounded-xl font-bold outline-none focus:bg-blue-50" />
              <input type="number" step="0.1" placeholder={`Cr: ${profile.creatinine || '-'}`} min="0.1" max="15" value={vitalsForm.creatinine || ''} onChange={e => setVitalsForm({ ...vitalsForm, creatinine: e.target.value })} className="bg-stone-50 p-3 rounded-xl font-bold outline-none focus:bg-blue-50" />
            </div>

            {(profile.gender === 'Female' || vitalsForm.gender === 'Female') && (
              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer mb-6 ${vitalsForm.pregnancyStatus || profile.pregnancyStatus ? 'border-red-200 bg-red-50' : 'border-stone-100'}`}>
                <Baby className={vitalsForm.pregnancyStatus || profile.pregnancyStatus ? "text-red-500" : "text-stone-300"} />
                <span className="font-bold text-sm text-stone-700">Patient is Pregnant</span>
                <input type="checkbox" checked={vitalsForm.pregnancyStatus !== undefined ? vitalsForm.pregnancyStatus : profile.pregnancyStatus} onChange={e => setVitalsForm({ ...vitalsForm, pregnancyStatus: e.target.checked })} className="ml-auto w-5 h-5 accent-red-500" />
              </label>
            )}

            <div className="mt-4">
              <label className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Doctor Notes / Instructions</label>
              <textarea
                value={vitalsForm.instructions !== undefined ? vitalsForm.instructions : profile.instructions}
                onChange={e => setVitalsForm({ ...vitalsForm, instructions: e.target.value })}
                className="w-full bg-stone-50 p-3 rounded-xl text-sm min-h-[80px] outline-none"
                placeholder="Enter medical instructions here..."
              ></textarea>
            </div>

            <button onClick={handleSaveProfile} className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold shadow-lg mt-4">Save & Update</button>
          </div>

          <div className="mt-8 text-center">
            <button onClick={handleSeedDatabase} className="text-xs font-bold text-stone-300 hover:text-emerald-500 flex items-center justify-center gap-1 mx-auto"><Database size={10} /> Sync Med Database</button>
          </div>

          <div className="flex justify-between items-center mb-4 mt-8">
            <h3 className="font-bold text-stone-400 text-xs uppercase flex items-center gap-2"><TrendingUp size={12} /> Vital Trends</h3>
          </div>
          {/* Vertical Stack for Small Charts */}
          <div className="flex flex-col gap-3">
            <SimpleTrendGraph
              data={getTrendData('weight')} label="Weight" unit="kg" color="orange" normalRange={null}
              onClick={() => setExpandedGraphData({ data: getTrendData('weight'), label: "Weight", unit: "kg", color: "orange", normalRange: null })}
            />
            <SimpleTrendGraph
              data={getTrendData('hba1c')} label="HbA1c" unit="%" color="emerald" normalRange={5.7}
              onClick={() => setExpandedGraphData({ data: getTrendData('hba1c'), label: "HbA1c", unit: "%", color: "emerald", normalRange: 5.7 })}
            />
            <SimpleTrendGraph
              data={getTrendData('creatinine')} label="Creatinine" unit="mg/dL" color="purple" normalRange={1.2}
              onClick={() => setExpandedGraphData({ data: getTrendData('creatinine'), label: "Creatinine", unit: "mg/dL", color: "purple", normalRange: 1.2 })}
            />
          </div>
        </div>
      )}

      {view === 'prescription' && (
        <div className="px-6 pb-32 animate-in slide-in-from-right">
          <h2 className="text-2xl font-serif font-bold mb-4 flex items-center gap-2 text-stone-800"><Stethoscope className="text-emerald-600" /> Prescription</h2>
          <div className="bg-white p-4 rounded-[24px] shadow-sm mb-6">
            <h3 className="font-bold text-stone-700 mb-4 flex items-center gap-2"><Syringe size={18} /> Insulins</h3>
            {prescription.insulins.map((ins, idx) => (
              <div key={ins.id} className="mb-4 pb-4 border-b border-stone-100">
                <div className="flex justify-between mb-4">
                  <div><span className="font-bold block">{ins.name}</span><span className="text-xs text-stone-400">{ins.frequency || 'Set Frequency'}</span></div>
                  <button onClick={() => setPrescription(p => ({ ...p, insulins: p.insulins.filter(i => i.id !== ins.id) }))} className="text-red-400"><Trash2 size={16} /></button>
                </div>
                <div className="bg-stone-50 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold uppercase text-stone-500">Sliding Scale & Safety</span></div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-xs font-bold text-stone-400">Max Dose Safety:</label>
                    <input type="number" value={ins.maxDose || ''} onChange={(e) => { const newInsulins = [...prescription.insulins]; newInsulins[idx].maxDose = e.target.value; setPrescription({ ...prescription, insulins: newInsulins }); }} className="w-16 p-1 rounded bg-white border text-center font-bold text-sm" />
                    <span className="text-xs text-stone-400">units</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-stone-400 uppercase mb-1"><div>Min BG</div><div>Max BG</div><div>Dose</div><div>Action</div></div>
                  {(ins.slidingScale || []).map((rule, rIdx) => (
                    <div key={rIdx} className="grid grid-cols-4 gap-1 mb-1">
                      <input type="number" value={rule.min} onChange={(e) => { const newInsulins = [...prescription.insulins]; newInsulins[idx].slidingScale[rIdx].min = e.target.value; setPrescription({ ...prescription, insulins: newInsulins }); }} className="p-1 rounded bg-white border text-center font-bold text-xs" />
                      <input type="number" value={rule.max} onChange={(e) => { const newInsulins = [...prescription.insulins]; newInsulins[idx].slidingScale[rIdx].max = e.target.value; setPrescription({ ...prescription, insulins: newInsulins }); }} className="p-1 rounded bg-white border text-center font-bold text-xs" />
                      <input type="number" value={rule.dose} onChange={(e) => { const newInsulins = [...prescription.insulins]; newInsulins[idx].slidingScale[rIdx].dose = e.target.value; setPrescription({ ...prescription, insulins: newInsulins }); }} className="p-1 rounded bg-white border text-center font-bold text-xs" />
                      <button onClick={() => { const newInsulins = [...prescription.insulins]; newInsulins[idx].slidingScale = newInsulins[idx].slidingScale.filter((_, i) => i !== rIdx); setPrescription({ ...prescription, insulins: newInsulins }); }} className="bg-red-100 text-red-500 rounded flex items-center justify-center"><Trash2 size={12} /></button>
                    </div>
                  ))}
                  <button onClick={() => { const newInsulins = [...prescription.insulins]; if (!newInsulins[idx].slidingScale) newInsulins[idx].slidingScale = []; newInsulins[idx].slidingScale.push({ min: 0, max: 0, dose: 0 }); setPrescription({ ...prescription, insulins: newInsulins }); }} className="mt-2 w-full py-2 bg-white border border-dashed border-stone-300 text-stone-400 text-xs font-bold rounded-lg hover:bg-stone-100">+ Add Scale Rule</button>
                </div>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t border-stone-100">
              <select id="newInsulin" className="w-full p-3 rounded-xl bg-stone-50 text-sm font-bold mb-2">
                <option value="">Add Insulin...</option>
                <optgroup label="Rapid">{medDatabase.insulins.rapid.map(i => <option key={i} value={i}>{i}</option>)}</optgroup>
                <optgroup label="Basal">{medDatabase.insulins.basal.map(i => <option key={i} value={i}>{i}</option>)}</optgroup>
              </select>
              <select id="newInsulinFreq" className="w-full p-3 rounded-xl bg-stone-50 text-sm font-bold mb-2">
                {INSULIN_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <button onClick={() => { const name = document.getElementById('newInsulin').value; const freq = document.getElementById('newInsulinFreq').value; if (!name) return; setPrescription(p => ({ ...p, insulins: [...p.insulins, { id: generateId(), name, frequency: freq, type: 'Manual', slidingScale: [] }] })); }} className="w-full bg-stone-800 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><PlusCircle size={16} /> Add</button>
            </div>
          </div>
          {/* ORAL MEDS MANAGER */}
          <div className="bg-white p-4 rounded-[24px] shadow-sm mb-6">
            <h3 className="font-bold text-stone-700 mb-4 flex items-center gap-2"><Pill size={18} /> Oral Meds</h3>
            {prescription.oralMeds.map((med, idx) => (
              <div key={med.id} className="mb-4 pb-4 border-b border-stone-100">
                <div className="flex justify-between"><div><div className="font-bold text-sm">{med.name}</div><div className="text-xs text-stone-400">{med.dose} • {med.frequency}</div></div><button onClick={() => setPrescription(p => ({ ...p, oralMeds: p.oralMeds.filter(m => m.id !== med.id) }))} className="text-red-400"><Trash2 size={16} /></button></div>
                <div className="mt-2 flex flex-wrap gap-1">{ALL_TIMINGS.map(t => (<button key={t} onClick={() => { const newMeds = [...prescription.oralMeds]; if (newMeds[idx].timings.includes(t)) newMeds[idx].timings = newMeds[idx].timings.filter(x => x !== t); else newMeds[idx].timings.push(t); setPrescription(p => ({ ...p, oralMeds: newMeds })); }} className={`text-[10px] px-2 py-1 rounded border ${med.timings.includes(t) ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold' : 'bg-white text-stone-400'}`}>{t}</button>))}</div>
              </div>
            ))}
            <div className="grid gap-2">
              <select id="newOralName" className="p-3 rounded-xl bg-stone-50 text-sm font-bold"><option value="">Select Med...</option>{Object.entries(medDatabase.oralMeds).map(([category, meds]) => (<optgroup key={category} label={category.toUpperCase()}>{Array.isArray(meds) ? meds.map(m => <option key={m} value={m}>{m}</option>) : null}</optgroup>))}</select>
              <div className="grid grid-cols-2 gap-2"><select id="newOralFreq" className="p-3 rounded-xl bg-stone-50 text-sm font-bold">{Object.keys(FREQUENCY_RULES).map(f => <option key={f} value={f}>{f}</option>)}</select><input id="newOralDose" placeholder="Dose" className="p-3 rounded-xl bg-stone-50 text-sm font-bold" /></div>
              <button onClick={() => { const name = document.getElementById('newOralName').value; const freq = document.getElementById('newOralFreq').value; const dose = document.getElementById('newOralDose').value; if (!name) return; setPrescription(p => ({ ...p, oralMeds: [...p.oralMeds, { id: generateId(), name, frequency: freq, dose, timings: FREQUENCY_RULES[freq] }] })); }} className="w-full bg-stone-800 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><PlusCircle size={16} /> Add</button>
            </div>
          </div>
          <button onClick={handleSavePrescription} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg">Save Prescription</button>
        </div>
      )}

      {view === 'history' && (
        <div className="px-6 pb-32 animate-in slide-in-from-right">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-serif font-bold text-stone-800">Logbook</h2><button onClick={generatePDF} className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2"><Download size={16} /> PDF</button></div>
            <div className="flex gap-2 text-xs items-center"><span className="font-bold text-stone-400">PDF Range:</span><input type="date" value={pdfStartDate} onChange={e => setPdfStartDate(e.target.value)} className="bg-white border rounded p-1" /><span className="text-stone-300">to</span><input type="date" value={pdfEndDate} onChange={e => setPdfEndDate(e.target.value)} className="bg-white border rounded p-1" /></div>
          </div>
          <div className="space-y-3">
            {fullHistory.filter(item => item.type !== 'vital_update' && item.type !== 'prescription_update').map(item => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-stone-100">
                <div className="flex justify-between items-start mb-2"><div><span className="text-xl font-bold text-emerald-800">{item.hgt}</span><span className="text-xs text-stone-400 ml-1">mg/dL</span></div><span className="text-[10px] font-bold bg-stone-100 px-2 py-1 rounded text-stone-500">{item.mealStatus}</span></div>
                <div className="text-xs text-stone-500 mb-2">
                  {item.medsTaken && item.medsTaken.map(k => { const [id, time] = k.split('_'); const name = item.snapshot?.prescription?.oralMeds?.find(m => m.id === id)?.name || "Med"; return <div key={k} className="flex items-center gap-1"><Pill size={10} className="text-purple-500" /> {name} ({time})</div> })}
                  {item.oralMedsTaken && item.oralMedsTaken.map(m => (<div key={m} className="flex items-center gap-1"><Pill size={10} className="text-gray-400" /> {m}</div>))}
                  {item.insulinDoses && Object.entries(item.insulinDoses).map(([id, d]) => { const insName = item.snapshot?.prescription?.insulins?.find(i => i.id === id)?.name || 'Ins'; return <div key={id} className="flex items-center gap-1 font-bold text-emerald-700"><Syringe size={10} /> {insName}: {d}u</div> })}
                </div>
                {item.tags && item.tags.length > 0 && (<div className="flex flex-wrap gap-1 mt-1 mb-2">{item.tags.map(t => <span key={t} className="text-[10px] bg-stone-50 border border-stone-200 px-1 rounded">{t} {TAG_EMOJIS[t] || ''}</span>)}</div>)}
                <div className="text-[10px] text-stone-400 mt-2 border-t pt-2 flex justify-between"><span>{new Date(item.timestamp?.seconds * 1000).toLocaleString()}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-2 flex justify-around border-t z-50">
        <button onClick={() => setView('diary')} className={`p-3 rounded-2xl transition-all ${view === 'diary' ? 'bg-stone-900 text-white shadow-lg scale-105' : 'text-stone-400 hover:bg-stone-100'}`}><Edit3 /></button>
        <button onClick={() => setView('prescription')} className={`p-3 rounded-2xl transition-all ${view === 'prescription' ? 'bg-stone-900 text-white shadow-lg scale-105' : 'text-stone-400 hover:bg-stone-100'}`}><Stethoscope /></button>
        <button onClick={() => setView('history')} className={`p-3 rounded-2xl transition-all ${view === 'history' ? 'bg-stone-900 text-white shadow-lg scale-105' : 'text-stone-400 hover:bg-stone-100'}`}><FileText /></button>
        <button onClick={() => setView('profile')} className={`p-3 rounded-2xl transition-all ${view === 'profile' ? 'bg-stone-900 text-white shadow-lg scale-105' : 'text-stone-400 hover:bg-stone-100'}`}><User /></button>
      </nav>
    </div>
  );
}
