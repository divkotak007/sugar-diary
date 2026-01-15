import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, signInWithCustomToken } from 'firebase/auth';
import {
  getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp,
  onSnapshot, query, orderBy, limit, deleteDoc, updateDoc
} from 'firebase/firestore';
import {
  Activity, AlertCircle, AlertTriangle, Baby, BookOpen, Calendar, Candy, CheckCircle2, CheckSquare, ChevronDown, ChevronRight, ChevronUp,
  Clock, Database, Download, Droplet, Dumbbell, Pen as Edit3, Eye, FileText, Info, Lock, LogOut, Pill, PlusCircle,
  Printer, Save, Sandwich, ScrollText, Search, Settings, ShieldAlert, Stethoscope, Syringe, Thermometer, Trash as Trash2,
  TrendingUp, Unlock, User, Utensils, Wine, X, XCircle, Zap
} from 'lucide-react';
import { getPrescriptionAlerts, MEDICATION_DATABASE, FREQUENCY_RULES } from './data/medications.js';

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

// --- FALLBACK REMOVED: Using MEDICATION_DATABASE from imports ---

const INSULIN_FREQUENCIES = ["Bedtime", "Before Meals", "Twice Daily", "Once Daily", "SOS"];
const ALL_TIMINGS = ["Morning", "Breakfast", "Lunch", "Afternoon", "Evening", "Dinner", "Bedtime", "As Needed"];

const TAG_EMOJIS = {
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
const StatBadge = ({ emoji, label, value, unit, color, onClick, updated }) => (
  <button onClick={onClick} className={`flex-shrink-0 bg-white p-3 rounded-2xl border-2 flex flex-col items-center min-w-[80px] transition-all relative ${updated ? 'border-blue-400 shadow-md ring-2 ring-blue-50' : 'border-stone-100 hover:border-stone-200'}`}>
    {updated && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white animate-pulse" />}
    <span className="text-xl mb-1">{emoji}</span>
    <div className="font-bold text-stone-800 text-lg leading-none">{value || '-'}</div>
    <div className="text-[10px] text-stone-400 font-bold uppercase mt-1">{label}</div>
    {unit && <div className="text-[9px] text-stone-300 font-bold">{unit}</div>}
  </button>
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
const SimpleTrendGraph = ({ data, label, unit, color, normalRange, onClick, disableHover }) => {
  if (!data || data.length < 2) return (
    <div onClick={onClick} className={`bg-white p-4 rounded-2xl border border-stone-100 shadow-sm ${!disableHover ? 'cursor-pointer hover:shadow-lg transition-all' : ''}`}>
      <div className="flex justify-between items-center mb-4"><span className="text-xs font-bold uppercase text-stone-500 flex items-center gap-1"><TrendingUp size={12} /> {label} Trend</span><span className="text-xs text-stone-300 font-bold">No Data</span></div>
      <div className="h-24 bg-stone-50 rounded-xl flex items-center justify-center text-stone-300 text-xs font-bold">Add more entries</div>
    </div>
  );

  // CORRECTION: Keep small chart to 5 dots only
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

  return (
    <div onClick={onClick} className={`bg-white p-4 rounded-2xl border border-stone-100 shadow-sm relative overflow-hidden bg-opacity-100 ${!disableHover ? 'cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:overflow-visible z-0 hover:z-50' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold uppercase text-stone-500 flex items-center gap-1"><TrendingUp size={12} /> {label} Trend</span>
        <span className={`text-sm font-bold text-${color}-600`}>{data[data.length - 1].value} {unit}</span>
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* CORRECTION: Darker background grid lines for visibility */}
        {[0.2, 0.4, 0.6, 0.8].map(ratio => (
          <line key={ratio} x1={padding} y1={height * ratio} x2={width - padding} y2={height * ratio} stroke="#d1d5db" strokeWidth="1" strokeDasharray="4" />
        ))}



        {label === "HbA1c" && (
          <g opacity="0.1">
            <rect x={padding} y={height - padding - ((5.7 - min) / range) * (height - 2 * padding)} width={width - 2 * padding} height={((5.7 - 0) / range) * (height - 2 * padding)} fill="#10b981" />
            <rect x={padding} y={height - padding - ((6.5 - min) / range) * (height - 2 * padding)} width={width - 2 * padding} height={((6.5 - 5.7) / range) * (height - 2 * padding)} fill="#f59e0b" />
            <rect x={padding} y={0} width={width - 2 * padding} height={height - padding - ((6.5 - min) / range) * (height - 2 * padding)} fill="#ef4444" />
          </g>
        )}
        {refY && refY > 0 && refY < height && (
          <g>
            <text x={width - padding} y={refY - 2} textAnchor="end" fontSize="8" fill="#6b7280" fontStyle="italic">Normal Range: {normalRange}</text>
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
const ExpandedGraphModal = ({ data, color, label, unit, normalRange, onClose, fullHistory, onEdit, onDelete }) => {
  const containerRef = React.useRef(null);
  const height = 300;
  const pointsPerView = 5; // Visible area shows 5 most recent
  const screenWidth = Math.min(window.innerWidth - 48, 600);
  const pointSpacing = screenWidth / pointsPerView;
  const graphWidth = Math.max(screenWidth, data.length * pointSpacing);
  const padding = 40;

  useEffect(() => {
    // Scroll to the end (most recent points) on open
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [data]);

  const values = data.map(d => d.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const dataRange = (dataMax - dataMin) || (dataMax * 0.1) || 1;
  const min = dataMin - (dataRange * 0.4);
  const max = dataMax + (dataRange * 0.4);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 === 0 ? 1 : data.length - 1)) * (graphWidth - 2 * padding);
    const y = height - padding - ((d.value - min) / range) * (height - 2 * padding);
    return { x, y, val: d.value, date: d.date, id: d.id }; // Added ID here
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 animate-in slide-in-from-bottom border-t border-stone-100">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className={`text-2xl font-bold text-${color}-600`}>{label} History</h3>
          <p className="text-sm text-stone-400 font-medium">Full scrollable trend view ({data.length} records)</p>
        </div>
        <button onClick={onClose} className="p-2 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors"><X size={20} className="text-stone-500" /></button>
      </div>

      <div ref={containerRef} className="w-full overflow-x-auto pb-6 scroll-smooth">
        <div style={{ width: graphWidth, height }}>
          <svg width={graphWidth} height={height} viewBox={`0 0 ${graphWidth} ${height}`} className="overflow-visible">
            {[0.2, 0.4, 0.6, 0.8].map(ratio => (
              <line key={ratio} x1={0} y1={height * ratio} x2={graphWidth} y2={height * ratio} stroke="#f1f5f9" strokeWidth="1" />
            ))}
            {label === "HbA1c" && (
              <g opacity="0.05">
                <rect x={0} y={height - padding - ((5.7 - min) / range) * (height - 2 * padding)} width={graphWidth} height={((5.7 - 0) / range) * (height - 2 * padding)} fill="#10b981" />
                <rect x={0} y={height - padding - ((6.5 - min) / range) * (height - 2 * padding)} width={graphWidth} height={((6.5 - 5.7) / range) * (height - 2 * padding)} fill="#f59e0b" />
                <rect x={0} y={0} width={graphWidth} height={height - padding - ((6.5 - min) / range) * (height - 2 * padding)} fill="#ef4444" />
              </g>
            )}
            <polyline fill="none" stroke={color === 'orange' ? '#f97316' : color === 'purple' ? '#a855f7' : color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : '#10b981'} strokeWidth="6" points={polylinePoints} />
            {points.map((p, i) => (
              <g key={i} className="cursor-pointer" onClick={() => {
                const log = fullHistory.find(l => l.id === p.id);
                if (log) setVitalActionLog({ log, val: p.val, label, date: p.date });
              }}>
                <circle cx={p.x} cy={p.y} r="8" fill="white" stroke={color === 'orange' ? '#f97316' : color === 'purple' ? '#a855f7' : color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : '#10b981'} strokeWidth="3" />
                <text x={p.x} y={p.y - 18} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#374151">{p.val}</text>
                <text x={p.x} y={height - 5} textAnchor="middle" fontSize="10" fill="#9ca3af">{new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {vitalActionLog && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-stone-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom pb-8">
            <div className="p-6 border-b border-stone-50 flex justify-between items-center bg-stone-50/50">
              <div>
                <h4 className="font-black text-stone-800 tracking-tight">{label} Record</h4>
                <p className="text-[10px] text-stone-400 font-bold uppercase">{new Date(vitalActionLog.date).toLocaleString()}</p>
              </div>
              <button onClick={() => setVitalActionLog(null)} className="p-2 bg-white rounded-xl shadow-sm"><X size={16} /></button>
            </div>

            <div className="p-6 space-y-3">
              <button onClick={() => { onEdit(vitalActionLog.log, label.toLowerCase().replace(' trend', '')); setVitalActionLog(null); onClose(); }} className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-all">
                <Edit3 size={18} /> Edit Entry
              </button>

              <div className="relative">
                {((Date.now() - (vitalActionLog.log.timestamp?.seconds * 1000 || new Date(vitalActionLog.log.timestamp))) / 1000 < 1800) ? (
                  <button disabled className="w-full bg-stone-100 text-stone-300 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 cursor-not-allowed opacity-50">
                    <Trash2 size={18} /> Delete Locked (30m audit)
                  </button>
                ) : (
                  <button onClick={() => { if (confirm("Permanently delete?")) { onDelete(vitalActionLog.log.id); setVitalActionLog(null); } }} className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-all border border-red-100">
                    <Trash2 size={18} /> Delete Entry
                  </button>
                )}
              </div>

              <button onClick={() => setVitalActionLog(null)} className="w-full py-4 rounded-2xl font-bold text-stone-400 hover:bg-stone-50 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
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
  const [medDatabase, setMedDatabase] = useState(MEDICATION_DATABASE);

  const [vitalsForm, setVitalsForm] = useState({});
  const [hgt, setHgt] = useState('');
  const [mealStatus, setMealStatus] = useState('Pre-Meal');
  const [insulinDoses, setInsulinDoses] = useState({});
  const [medsTaken, setMedsTaken] = useState({});
  const [contextTags, setContextTags] = useState([]);
  const [fullHistory, setFullHistory] = useState([]);

  const [pdfStartDate, setPdfStartDate] = useState('');
  const [pdfEndDate, setPdfEndDate] = useState('');
  const [logTime, setLogTime] = useState(new Date().toISOString().slice(0, 16));
  const [vitalsLogTime, setVitalsLogTime] = useState(new Date().toISOString().slice(0, 16));
  const [editingLog, setEditingLog] = useState(null);

  const [vitalActionLog, setVitalActionLog] = useState(null);
  const [expandedGraphData, setExpandedGraphData] = useState(null);
  const [highlightField, setHighlightField] = useState(null);
  const [safetyAlerts, setSafetyAlerts] = useState([]);
  const [insulinSearch, setInsulinSearch] = useState('');
  const [oralSearch, setOralSearch] = useState('');
  const [showInsulinResults, setShowInsulinResults] = useState(false);
  const [showOralResults, setShowOralResults] = useState(false);
  const [showAlertDetails, setShowAlertDetails] = useState(false);

  // Derive latest vitals dynamically from history for profile summary
  const getLatestVitals = () => {
    const sorted = [...fullHistory].sort((a, b) => {
      const ta = a.timestamp?.seconds || new Date(a.timestamp).getTime() / 1000 || 0;
      const tb = b.timestamp?.seconds || new Date(b.timestamp).getTime() / 1000 || 0;
      return tb - ta;
    });

    const result = { weight: profile.weight, hba1c: profile.hba1c, creatinine: profile.creatinine, lastUpdated: {} };

    // Most recent non-null records for each
    const w = sorted.find(l => l.snapshot?.profile?.weight)?.snapshot.profile.weight;
    const a = sorted.find(l => l.snapshot?.profile?.hba1c)?.snapshot.profile.hba1c;
    const c = sorted.find(l => l.snapshot?.profile?.creatinine)?.snapshot.profile.creatinine;

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
    // 1. Extract all valid entries for this metric
    const allEntries = fullHistory
      .filter(log => log.snapshot?.profile?.[metric] !== undefined && log.snapshot.profile[metric] !== null && !isNaN(parseFloat(log.snapshot.profile[metric])))
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
    const startTime = earliestLog.timestamp?.seconds * 1000 || earliestLog.timestamp;
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

  const compliance = calculateCompliance();

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

    // 2. Duplicate Check (1 Hour Rule)
    if (!editingLog) {
      const recent = fullHistory.find(l =>
        l.type === 'vital_update' &&
        Math.abs(timestamp - (l.timestamp?.seconds * 1000 || new Date(l.timestamp))) < 3600000
      );
      if (recent && !confirm("An entry was recorded in the last hour. Are you sure you want to add another?")) return;
    }

    // 3. Prep Data
    const updatedParams = Object.keys(vitalsForm).filter(k => vitalsForm[k] !== '' && vitalsForm[k] !== undefined);
    if (updatedParams.length === 0 && !vitalsForm.instructions) return alert("No changes to save.");

    const updatedProfile = { ...profile };
    updatedParams.forEach(k => updatedProfile[k] = vitalsForm[k]);
    if (vitalsForm.instructions !== undefined) updatedProfile.instructions = vitalsForm.instructions;
    if (updatedProfile.dob) updatedProfile.age = calculateAge(updatedProfile.dob);

    try {
      if (editingLog && editingLog.type === 'vital_update') {
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'logs', editingLog.id), {
          snapshot: { ...editingLog.snapshot, profile: updatedProfile },
          updatedParams,
          timestamp
        });
        alert("Entry Updated.");
      } else {
        // Only update profile doc if this is the newest entry (simplification: we let derived state handle summary)
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), { profile: updatedProfile, prescription, lastUpdated: new Date().toISOString() }, { merge: true });
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), {
          type: 'vital_update',
          snapshot: { profile: updatedProfile, prescription },
          updatedParams,
          timestamp,
          tags: ['Vital Update']
        });
      }
      setProfile(updatedProfile);
      setVitalsForm({ weight: '', hba1c: '', creatinine: '' });
      setUnlockPersonal(false);
      setUnlockComorbidities(false);
      setVitalsLogTime(new Date().toISOString().slice(0, 16));
      setEditingLog(null);
    } catch (err) { alert("Save failed: " + err.message); }
  };

  const handleDeleteEntry = async (id) => {
    const log = fullHistory.find(l => l.id === id);
    if (!log) return;

    // 30 Minute Lock Protection
    const ageSeconds = (Date.now() - (log.timestamp?.seconds * 1000 || new Date(log.timestamp))) / 1000;
    if (ageSeconds < 1800) {
      return alert(`Action Locked: This entry is only ${Math.round(ageSeconds / 60)} minutes old. Deletion is disabled for the first 30 minutes for audit safety.`);
    }

    if (!confirm("Confirm permanent deletion of this record?")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'logs', id));
      setEditingLog(null);
    } catch (err) { alert("Delete failed."); }
  };

  const handleSavePrescription = async () => {
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), { profile, prescription, lastUpdated: new Date().toISOString() }, { merge: true });
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), { type: 'prescription_update', snapshot: { prescription }, timestamp: serverTimestamp(), tags: ['Rx Change', 'Audit'] });
      alert("Prescription Saved."); setView('diary');
    } catch (err) { alert("Save failed."); }
  };

  const handleSaveEntry = async () => {
    const hasMeds = Object.keys(medsTaken).some(k => medsTaken[k]) || Object.keys(insulinDoses).length > 0;
    const hasInsulin = Object.keys(insulinDoses).length > 0;

    // Safety: Insulin requires Sugar
    if (hasInsulin && !hgt) {
      return alert("Safety Rule: Insulin cannot be logged without a corresponding Blood Glucose value.");
    }

    if (!hgt && !hasMeds) return alert("Enter Glucose or Medication");

    const timestamp = logTime ? new Date(logTime) : new Date();

    // Duplicate Check (1 Hour Rule)
    if (!editingLog) {
      const recent = fullHistory.find(l =>
        !l.type &&
        Math.abs(timestamp - (l.timestamp?.seconds * 1000 || new Date(l.timestamp))) < 3600000
      );
      if (recent && !confirm("A log was recorded in the last hour. Continue anyway?")) return;
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

  const handleStartEditVital = (log, activeField = 'weight') => {
    setEditingLog(log);
    const p = log.snapshot.profile || {};
    setVitalsForm({
      weight: p.weight || '',
      hba1c: p.hba1c || '',
      creatinine: p.creatinine || '',
      instructions: p.instructions || '',
      dob: p.dob || '',
      gender: p.gender || '',
      pregnancyStatus: p.pregnancyStatus || false
    });
    const date = new Date(log.timestamp?.seconds * 1000 || log.timestamp);
    setVitalsLogTime(date.toISOString().slice(0, 16));
    setView('profile');
    setHighlightField(activeField);
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
          <StatBadge emoji="🧘‍♂️" label="Age" value={profile.age} unit="Yrs" color="blue" onClick={() => { setHighlightField('dob'); setView('profile'); }} />
          <StatBadge emoji="⚖️" label="Weight" value={latestVitals.weight} unit="kg" color="orange" updated={latestVitals.lastUpdated.includes('weight')} onClick={() => { setHighlightField('weight'); setView('profile'); }} />
          <StatBadge emoji="🩸" label="HbA1c" value={latestVitals.hba1c} unit="%" color="emerald" updated={latestVitals.lastUpdated.includes('hba1c')} onClick={() => { setHighlightField('hba1c'); setView('profile'); }} />
          <StatBadge emoji="🧪" label="Creat" value={latestVitals.creatinine} unit="mg/dL" color="purple" updated={latestVitals.lastUpdated.includes('creatinine')} onClick={() => { setHighlightField('creatinine'); setView('profile'); }} />
        </div>
      </div>

      {view === 'diary' && (
        <div className="px-6 animate-in fade-in">
          {/* COMPLIANCE STATS - SUBTLE STYLE */}
          <div className="bg-stone-50/50 p-3 rounded-2xl mb-4 flex justify-around items-center border border-stone-100">
            <div className="text-center">
              <div className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Oral</div>
              <div className="text-xs font-black text-stone-600">{compliance.oral}%</div>
            </div>
            <div className="w-px h-4 bg-stone-200" />
            <div className="text-center">
              <div className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Insulin</div>
              <div className="text-xs font-black text-stone-600">{compliance.insulin}%</div>
            </div>
            <div className="w-px h-4 bg-stone-200" />
            <div className="text-center">
              <div className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mb-0.5">Overall</div>
              <div className="text-xs font-black text-emerald-600">{compliance.overall}%</div>
            </div>
          </div>

          {hgt && parseInt(hgt) < 70 && <div className="bg-red-500 text-white p-3 rounded-xl font-bold text-center mb-4 flex items-center justify-center gap-2 animate-pulse"><AlertTriangle /> LOW SUGAR! TAKE GLUCOSE</div>}
          {hgt && parseInt(hgt) >= 250 && parseInt(hgt) < 300 && <div className="bg-yellow-400 text-stone-900 p-3 rounded-xl font-bold text-center mb-4 flex items-center justify-center gap-2"><AlertTriangle /> POOR CONTROL</div>}
          {hgt && parseInt(hgt) >= 300 && parseInt(hgt) < 400 && <div className="bg-orange-500 text-white p-3 rounded-xl font-bold text-center mb-4 flex items-center justify-center gap-2 animate-pulse"><AlertTriangle /> HIGH SUGAR!</div>}
          {hgt && parseInt(hgt) >= 400 && <div className="bg-red-600 text-white p-3 rounded-xl font-bold text-center mb-4 flex items-center justify-center gap-2 animate-pulse"><AlertTriangle /> DANGER! CHECK KETONES</div>}

          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-stone-100 mb-6">
            <label className="text-xs font-bold text-stone-400 uppercase">Blood Sugar</label>
            <div className="flex items-baseline gap-2 mb-4">
              <input type="number" value={hgt} onChange={e => setHgt(e.target.value.slice(0, 3))} min="1" max="999" className="text-6xl font-bold w-full outline-none text-emerald-900" placeholder="---" />
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

          <div className="flex flex-wrap gap-2 mt-4 mb-4">
            {Object.keys(TAG_EMOJIS).map(t => <ContextTag key={t} label={`${TAG_EMOJIS[t]} ${t}`} icon={Thermometer} selected={contextTags.includes(t)} onClick={() => { setContextTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]) }} />)}
          </div>

          <div className="mb-6 bg-white p-4 rounded-2xl border border-stone-100">
            <label className="text-[10px] font-bold text-stone-400 uppercase block mb-2">Back-time Entry (Date & Time)</label>
            <div className="flex items-center gap-2 bg-stone-50 p-3 rounded-xl border border-stone-100 focus-within:border-emerald-500 transition-all">
              <Calendar size={18} className="text-stone-400" />
              <input
                type="datetime-local"
                value={logTime}
                onChange={(e) => setLogTime(e.target.value)}
                className="bg-transparent font-bold text-stone-700 outline-none w-full text-sm"
              />
            </div>
          </div>

          {editingLog && !editingLog.type ? (
            <div className="flex gap-2 mb-6">
              <button onClick={handleSaveEntry} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg flex justify-center gap-2"><Save /> Update Record</button>
              <button onClick={() => { setEditingLog(null); setHgt(''); setInsulinDoses({}); setMedsTaken({}); setContextTags([]); setLogTime(new Date().toISOString().slice(0, 16)); }} className="flex-1 bg-stone-200 text-stone-600 py-4 rounded-2xl font-bold">Cancel</button>
            </div>
          ) : (
            <button onClick={handleSaveEntry} className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold shadow-lg flex justify-center gap-2 mb-6"><Save /> Save Entry</button>
          )}
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
              <input id="field-weight" type="number" placeholder={`Wt: ${profile.weight || '-'} kg`} min="1" max="1000" value={vitalsForm.weight || ''} onChange={e => setVitalsForm({ ...vitalsForm, weight: e.target.value })} className="bg-stone-50 p-3 rounded-xl font-bold outline-none focus:bg-blue-50 transition-all duration-500" />
              <input id="field-hba1c" type="number" step="0.1" placeholder={`A1c: ${profile.hba1c || '-'}%`} min="3" max="20" value={vitalsForm.hba1c || ''} onChange={e => setVitalsForm({ ...vitalsForm, hba1c: e.target.value })} className="bg-stone-50 p-3 rounded-xl font-bold outline-none focus:bg-blue-50 transition-all duration-500" />
              <input id="field-creatinine" type="number" step="0.1" placeholder={`Cr: ${profile.creatinine || '-'}`} min="0.1" max="15" value={vitalsForm.creatinine || ''} onChange={e => setVitalsForm({ ...vitalsForm, creatinine: e.target.value })} className="bg-stone-50 p-3 rounded-xl font-bold outline-none focus:bg-blue-50 transition-all duration-500" />
            </div>

            {(profile.gender === 'Female' || vitalsForm.gender === 'Female') && (
              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer mb-6 ${vitalsForm.pregnancyStatus || profile.pregnancyStatus ? 'border-red-200 bg-red-50' : 'border-stone-100'}`}>
                <Baby className={vitalsForm.pregnancyStatus || profile.pregnancyStatus ? "text-red-500" : "text-stone-300"} />
                <span className="font-bold text-sm text-stone-700">Patient is Pregnant</span>
                <input type="checkbox" checked={vitalsForm.pregnancyStatus !== undefined ? vitalsForm.pregnancyStatus : profile.pregnancyStatus} onChange={e => setVitalsForm({ ...vitalsForm, pregnancyStatus: e.target.checked })} className="ml-auto w-5 h-5 accent-red-500" />
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
              <div className="flex gap-2">
                <button onClick={handleSaveProfile} className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg">Update Record</button>
                <button onClick={() => { setEditingLog(null); setVitalsForm({}); setVitalsLogTime(new Date().toISOString().slice(0, 16)); }} className="flex-1 bg-stone-200 text-stone-600 py-4 rounded-xl font-bold">Cancel</button>
              </div>
            ) : (
              <button onClick={handleSaveProfile} className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold shadow-lg">Save & Update</button>
            )}
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
              disableHover={!!expandedGraphData}
            />
            <SimpleTrendGraph
              data={getTrendData('hba1c')} label="HbA1c" unit="%" color="emerald" normalRange={5.7}
              onClick={() => setExpandedGraphData({ data: getTrendData('hba1c'), label: "HbA1c", unit: "%", color: "emerald", normalRange: 5.7 })}
              disableHover={!!expandedGraphData}
            />
            <SimpleTrendGraph
              data={getTrendData('creatinine')} label="Creatinine" unit="mg/dL" color="purple" normalRange={1.2}
              onClick={() => setExpandedGraphData({ data: getTrendData('creatinine'), label: "Creatinine", unit: "mg/dL", color: "purple", normalRange: 1.2 })}
              disableHover={!!expandedGraphData}
            />
          </div>
        </div>
      )}

      {view === 'prescription' && (
        <div className="px-6 pb-32 animate-in slide-in-from-right">
          <h2 className="text-2xl font-serif font-bold mb-4 flex items-center gap-2 text-stone-800"><Stethoscope className="text-emerald-600" /> Prescription</h2>
          {/* UNIFIED PRESCRIPTION MANAGER */}
          <div className="bg-white p-4 rounded-[24px] shadow-sm mb-6">
            <h3 className="font-bold text-stone-700 mb-4 flex items-center gap-2"><Pill size={18} /> Medications & Insulins</h3>

            {/* SEPARATE SEARCH ADDITIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* INSULIN SEARCH */}
              <div className="relative search-container">
                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 ml-1">Add Insulin</label>
                <div className="bg-stone-50 rounded-xl flex items-center p-3 border border-stone-100 focus-within:border-emerald-500 transition-all">
                  <Syringe className="text-stone-400 mr-2" size={18} />
                  <input
                    type="text"
                    placeholder="Search Insulin..."
                    value={insulinSearch}
                    onChange={(e) => { setInsulinSearch(e.target.value); setShowInsulinResults(true); }}
                    onFocus={() => { setShowInsulinResults(true); setShowOralResults(false); }}
                    className="bg-transparent font-bold text-stone-700 outline-none w-full text-sm"
                  />
                </div>
                {showInsulinResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-stone-100 max-h-60 overflow-y-auto z-50">
                    {MEDICATION_DATABASE.filter(m => m.route === 'insulin' && (!insulinSearch || m.name.toLowerCase().includes(insulinSearch.toLowerCase()) || (m.brands || []).some(b => b.toLowerCase().includes(insulinSearch.toLowerCase())))).map(med => (
                      <div key={med.name} onClick={() => {
                        setPrescription(p => ({ ...p, insulins: [...p.insulins, { id: generateId(), name: med.name, frequency: 'Before Meals', slidingScale: [] }] }));
                        setInsulinSearch('');
                        setShowInsulinResults(false);
                      }} className="p-3 border-b border-stone-50 hover:bg-emerald-50 cursor-pointer flex justify-between items-center group">
                        <div>
                          <div className="font-bold text-xs text-stone-800 group-hover:text-emerald-700">{med.name}</div>
                          {med.brands?.length > 0 && <div className="text-[10px] text-stone-400">Brands: {med.brands.slice(0, 2).join(', ')}...</div>}
                        </div>
                        <PlusCircle size={14} className="text-emerald-400" />
                      </div>
                    ))}
                    {MEDICATION_DATABASE.filter(m => m.route === 'insulin' && (!insulinSearch || m.name.toLowerCase().includes(insulinSearch.toLowerCase()))).length === 0 && (
                      <div className="p-4 text-center text-xs text-stone-400 font-bold italic">No matching insulins</div>
                    )}
                  </div>
                )}
              </div>

              {/* ORAL MEDS SEARCH */}
              <div className="relative search-container">
                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 ml-1">Add Medicine</label>
                <div className="bg-stone-50 rounded-xl flex items-center p-3 border border-stone-100 focus-within:border-emerald-500 transition-all">
                  <Pill className="text-stone-400 mr-2" size={18} />
                  <input
                    type="text"
                    placeholder="Search Medicine..."
                    value={oralSearch}
                    onChange={(e) => { setOralSearch(e.target.value); setShowOralResults(true); }}
                    onFocus={() => { setShowOralResults(true); setShowInsulinResults(false); }}
                    className="bg-transparent font-bold text-stone-700 outline-none w-full text-sm"
                  />
                </div>
                {showOralResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-stone-100 max-h-60 overflow-y-auto z-50">
                    {MEDICATION_DATABASE.filter(m => m.route === 'oral' && (!oralSearch || m.name.toLowerCase().includes(oralSearch.toLowerCase()) || (m.brands || []).some(b => b.toLowerCase().includes(oralSearch.toLowerCase())))).map(med => (
                      <div key={med.name} onClick={() => {
                        setPrescription(p => ({ ...p, oralMeds: [...p.oralMeds, { id: generateId(), name: med.name, frequency: 'Once Daily', timings: ['Morning'] }] }));
                        setOralSearch('');
                        setShowOralResults(false);
                      }} className="p-3 border-b border-stone-50 hover:bg-emerald-50 cursor-pointer flex justify-between items-center group">
                        <div>
                          <div className="font-bold text-xs text-stone-800 group-hover:text-emerald-700">{med.name}</div>
                          {med.brands?.length > 0 && <div className="text-[10px] text-stone-400">Brands: {med.brands.slice(0, 2).join(', ')}...</div>}
                        </div>
                        <PlusCircle size={14} className="text-emerald-400" />
                      </div>
                    ))}
                    {MEDICATION_DATABASE.filter(m => m.route === 'oral' && (!oralSearch || m.name.toLowerCase().includes(oralSearch.toLowerCase()))).length === 0 && (
                      <div className="p-4 text-center text-xs text-stone-400 font-bold italic">No matching medications</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* LIST ACTIVE MEDS - Continuity (No Scroll) */}
            <div className="space-y-6 mt-6">
              {/* INSULINS */}
              {prescription.insulins.map((ins, idx) => (
                <div key={ins.id} className="pb-4 border-b border-stone-100 last:border-0">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex-1 mr-4">
                      <span className="font-bold block text-sm text-stone-800">{ins.name}</span>
                      <select value={ins.frequency} onChange={(e) => { const newI = [...prescription.insulins]; newI[idx].frequency = e.target.value; setPrescription({ ...prescription, insulins: newI }); }} className="text-xs text-stone-500 bg-transparent outline-none font-bold">
                        {['Once Daily', 'Twice Daily', 'Bedtime', 'Before Meals', 'SOS'].map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <button onClick={() => setPrescription(p => ({ ...p, insulins: p.insulins.filter(i => i.id !== ins.id) }))} className="text-red-500 bg-red-50 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-100 transition-colors shadow-sm shrink-0 outline-none"><Trash2 size={20} /></button>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-xl space-y-3">
                    <div className="flex bg-white p-1 rounded-lg border border-stone-200">
                      <input type="number" placeholder="Fixed Dose" value={ins.fixedDose || ''} onChange={(e) => { const n = [...prescription.insulins]; n[idx].fixedDose = e.target.value; setPrescription({ ...prescription, insulins: n }) }} className="w-full text-center text-xs font-bold outline-none" />
                      <span className="text-[10px] font-bold text-stone-400 shrink-0 self-center pr-2">UNITS FIXED</span>
                    </div>

                    {/* SLIDING SCALE restoration */}
                    <div className="border-t border-stone-200 pt-3">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-tight">Sliding Scale (Optional)</span>
                        <button onClick={() => {
                          const n = [...prescription.insulins];
                          n[idx].slidingScale = [...(n[idx].slidingScale || []), { min: 200, max: 250, dose: 2 }];
                          setPrescription({ ...prescription, insulins: n });
                        }} className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-emerald-100 transition-colors">
                          <PlusCircle size={14} /> Add Range
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(ins.slidingScale || []).map((row, rIdx) => (
                          <div key={rIdx} className="flex gap-1.5 items-center bg-white p-1.5 rounded-xl border border-stone-100 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-lg border border-stone-100 shrink-0">
                              <input type="number" placeholder="Min" value={row.min} onChange={(e) => { const n = [...prescription.insulins]; n[idx].slidingScale[rIdx].min = e.target.value; setPrescription({ ...prescription, insulins: n }) }} className="w-10 text-center text-xs font-bold outline-none bg-transparent" />
                              <span className="text-[10px] text-stone-300">-</span>
                              <input type="number" placeholder="Max" value={row.max} onChange={(e) => { const n = [...prescription.insulins]; n[idx].slidingScale[rIdx].max = e.target.value; setPrescription({ ...prescription, insulins: n }) }} className="w-10 text-center text-xs font-bold outline-none bg-transparent" />
                            </div>
                            <ChevronRight size={12} className="text-stone-300 shrink-0" />
                            <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 flex-1 min-w-0">
                              <input type="number" placeholder="Dose" value={row.dose} onChange={(e) => { const n = [...prescription.insulins]; n[idx].slidingScale[rIdx].dose = e.target.value; setPrescription({ ...prescription, insulins: n }) }} className="w-full text-center text-sm font-black text-emerald-700 outline-none bg-transparent" />
                              <span className="text-[10px] font-bold text-emerald-600/50 uppercase">u</span>
                            </div>
                            <button onClick={() => {
                              const n = [...prescription.insulins];
                              n[idx].slidingScale = n[idx].slidingScale.filter((_, i) => i !== rIdx);
                              setPrescription({ ...prescription, insulins: n });
                            }} className="shrink-0 text-red-300 hover:text-red-500 p-1.5"><Trash2 size={16} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* ORAL MEDS */}
              {prescription.oralMeds.map((med, idx) => (
                <div key={med.id} className="pb-4 border-b border-stone-100 last:border-0">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex-1 mr-4">
                      <div className="font-bold text-sm text-stone-800 leading-tight">{med.name}</div>
                      <select value={med.frequency} onChange={(e) => { const nM = [...prescription.oralMeds]; nM[idx].frequency = e.target.value; nM[idx].timings = FREQUENCY_RULES[e.target.value] || []; setPrescription({ ...prescription, oralMeds: nM }) }} className="text-xs text-stone-500 bg-stone-50 rounded px-1 py-0.5 mt-1 outline-none font-bold">
                        {Object.keys(FREQUENCY_RULES).map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <button onClick={() => setPrescription(p => ({ ...p, oralMeds: p.oralMeds.filter(m => m.id !== med.id) }))} className="text-red-500 bg-red-50 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-100 transition-colors shadow-sm shrink-0 outline-none"><Trash2 size={20} /></button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(FREQUENCY_RULES[med.frequency] || []).map(t => (
                      <span key={t} className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">{t}</span>
                    ))}
                  </div>
                </div>
              ))}

              {prescription.insulins.length === 0 && prescription.oralMeds.length === 0 && (
                <div className="text-center py-8 text-stone-400 text-xs font-bold uppercase">No active medications</div>
              )}
            </div>

            <div className="mt-8 border-t border-stone-100 pt-4 mb-4">
              <button onClick={() => setShowAlertDetails(!showAlertDetails)} className="w-full flex justify-between items-center text-stone-400 hover:text-stone-500 transition-colors">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-300">Prescription Safety Review ({safetyAlerts.length})</span>
                {showAlertDetails ? <ChevronUp size={16} className="text-stone-300" /> : <ChevronDown size={16} className="text-stone-300" />}
              </button>

              {showAlertDetails && (
                <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-1">
                  {safetyAlerts.length > 0 ? safetyAlerts.map((alert, i) => (
                    <div key={i} className={`p-2 rounded-lg text-xs font-medium bg-stone-50/50 border border-stone-100/50 ${alert.type === 'danger' ? 'text-red-300' : 'text-stone-400'}`}>
                      {alert.message}
                    </div>
                  )) : (
                    <div className="text-[10px] text-stone-200 font-bold italic text-center py-2">No safety concerns detected</div>
                  )}
                </div>
              )}
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
            <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider italic">Tap any entry to Edit or Delete</div>
          </div>
          <div className="space-y-3">
            {fullHistory.filter(item => item.type !== 'vital_update' && item.type !== 'prescription_update').map(item => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-stone-100 transition-all flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xl font-bold text-emerald-800">{item.hgt || '-'}</span>
                    <span className="text-xs text-stone-400 ml-1">mg/dL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleStartEdit(item)} className="p-2 bg-stone-50 text-stone-400 hover:text-emerald-600 rounded-lg transition-colors"><Edit3 size={14} /></button>
                    <button onClick={() => handleDeleteEntry(item.id)} className="p-2 bg-red-50 text-red-300 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>

                <div className="text-xs text-stone-500 mb-2">
                  <div className="font-bold text-[10px] text-stone-300 uppercase mb-1">{item.mealStatus}</div>
                  {item.medsTaken && item.medsTaken.map(k => { const [id, time] = k.split('_'); const name = item.snapshot?.prescription?.oralMeds?.find(m => m.id === id)?.name || "Med"; return <div key={k} className="flex items-center gap-1"><Pill size={10} className="text-purple-500" /> {name} ({time})</div> })}
                  {item.oralMedsTaken && item.oralMedsTaken.map(m => (<div key={m} className="flex items-center gap-1"><Pill size={10} className="text-gray-400" /> {m}</div>))}
                  {item.insulinDoses && Object.entries(item.insulinDoses).map(([id, d]) => { const insName = item.snapshot?.prescription?.insulins?.find(i => i.id === id)?.name || 'Ins'; return <div key={id} className="flex items-center gap-1 font-bold text-emerald-700"><Syringe size={10} /> {insName}: {d}u</div> })}
                </div>

                {item.tags && item.tags.length > 0 && (<div className="flex flex-wrap gap-1 mt-1 mb-2">{item.tags.map(t => <span key={t} className="text-[10px] bg-stone-50 border border-stone-200 px-1 rounded">{t} {TAG_EMOJIS[t] || ''}</span>)}</div>)}
                <div className="text-[10px] text-stone-400 mt-2 border-t pt-2 flex justify-between">
                  <span>{new Date(item.timestamp?.seconds * 1000 || item.timestamp).toLocaleString()}</span>
                </div>
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
      {expandedGraphData && (
        <ExpandedGraphModal
          {...expandedGraphData}
          fullHistory={fullHistory}
          onEdit={handleStartEditVital}
          onDelete={handleDeleteEntry}
          onClose={() => setExpandedGraphData(null)}
        />
      )}
    </div>
  );
}

