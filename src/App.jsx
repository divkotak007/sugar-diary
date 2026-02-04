import React, { useState, useEffect, Suspense } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, signInWithCustomToken } from 'firebase/auth';
import {
  getFirestore, doc, getDoc, collection, serverTimestamp,
  query, orderBy, limit, enableMultiTabIndexedDbPersistence, getDocs
} from 'firebase/firestore';
import { safeAddDoc as addDoc, safeSetDoc as setDoc, safeUpdateDoc as updateDoc, safeDeleteDoc as deleteDoc } from './services/safeDataLayer';

import {
  BookOpen, ChevronDown, ChevronUp, Edit3, Plus, Trash2, X, Activity,
  AlertCircle, Calendar, Check, ChevronRight, Clock, Droplets,
  FileText, Home, LineChart, Lock, LogOut, Menu, MoreHorizontal,
  PieChart, Pill, PlusCircle, Settings, Smartphone, Stethoscope, Sun, Moon,
  Thermometer, TrendingUp, User, Video, Zap, Database, Download,
  AlertTriangle, CheckCircle2, Eye, Unlock, Baby, Volume2, VolumeX, LayoutList,
  Save, Syringe, ScrollText, ShieldAlert, RefreshCw, WifiOff, Tag
} from 'lucide-react';
import { getPrescriptionAlerts, FREQUENCY_RULES, FREQUENCY_ORDER } from './data/medications.js';
import { generateAllInsights } from './services/aiInsights.js';
import { calculateGMI } from './utils/graphCalculations.js';
import { sortLogsDes, getLogTimestamp } from './utils/timeUtils.js';
import { TRANSLATIONS } from './data/translations.js';
import { TERMS_AND_CONDITIONS } from './data/terms.js';
import { getEpoch, toInputString, fromInputString, isFuture, minutesSince, safeEpoch, canEdit, canDelete } from './utils/time.js';
import { offlineStorage } from './services/offlineStorage.js';
import { auditLogger } from './services/auditLogger.js';
import { feedback } from './utils/feedback.js';
import { performanceSentinel } from './utils/performanceSentinel.js';
import { lazyWithRetry } from './utils/lazyWithRetry.js';
import { syncRemindersWithPrescription, checkAndTriggerReminders, requestNotificationPermission as reqNotify } from './services/reminderService.js';
import { useVitalLogs } from './hooks/useVitalLogs.js';
import { runVitalMigration } from './services/migrationService.js';

import MED_LIBRARY from './diabetes_medication_library.json';
import { generatePDFReport } from './services/pdfGenerator';
import { SecurityGuardian, GlobalRecoveryBoundary } from './components/SecurityComponents';
import { SimpleTrendGraph, GraphErrorBoundary } from './components/SimpleTrendGraph';
import { StatBadge, MealOption, ContextTag } from './components/UIComponents';

const SettingsModal = lazyWithRetry(() => import('./components/SettingsModal'));
const ExpandedGraphModal = lazyWithRetry(() => import('./components/ExpandedGraphModal'));
const ConsentScreen = lazyWithRetry(() => import('./components/ConsentScreen'));
const VitalDeepView = lazyWithRetry(() => import('./components/VitalDeepView'));


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

// Initialize Performance Sentinel (Passive)
if (typeof window !== 'undefined') {
  performanceSentinel.init();
  performanceSentinel.checkDependencies();
}

// OFFLINE PERSISTENCE (Write Queue & Cache)
// Enables offline writes to be queued and synced automatically on reconnect
if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistence not supported by browser');
    }
  });
}
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
// Legacy "Action Lock" removed. Now using Time Authority (canEdit/canDelete) from utils/time.js

// --- HAPTIC/SOUND WRAPPER ---
// Centralized trigger for both senses based on state
const triggerFeedback = (hapticState, soundState, type = 'medium') => {
  const hapticType = type === 'tick' ? 'selection' : type;
  const soundType = type === 'tick' ? 'tick' : (type === 'success' ? 'success' : 'click');

  feedback.haptic(hapticState, hapticType);
  feedback.sound(soundState, soundType);
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
  const [showMedInfo, setShowMedInfo] = useState(null); // Track which med's clinical info is shown
  const [medDatabase, setMedDatabase] = useState(() => ({
    insulins: MED_LIBRARY.insulins || [],
    oralMeds: MED_LIBRARY.oralMeds || []
  }));
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [vitalsForm, setVitalsForm] = useState({});
  const [activeVital, setActiveVital] = useState(null); // 'weight', 'hba1c', 'creatinine'
  const [hgt, setHgt] = useState('');
  const [mealStatus, setMealStatus] = useState('Pre-Meal');
  const [insulinDoses, setInsulinDoses] = useState({});
  const [medsTaken, setMedsTaken] = useState({});
  const [contextTags, setContextTags] = useState([]);
  const [fullHistory, setFullHistory] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [reminders, setReminders] = useState(() => JSON.parse(localStorage.getItem('start_reminders') || '[]'));
  // P3: Global toggle for reminders
  const [remindersEnabled, setRemindersEnabled] = useState(() => localStorage.getItem('reminders_enabled') !== 'false');

  useEffect(() => {
    localStorage.setItem('reminders_enabled', remindersEnabled);
  }, [remindersEnabled]);

  const [pdfStartDate, setPdfStartDate] = useState('');
  const [pdfEndDate, setPdfEndDate] = useState('');

  // Helper: Use centralized time utility
  const getNow = () => toInputString(getEpoch());

  const [logTime, setLogTime] = useState(getNow);
  const [isManualLogEdit, setIsManualLogEdit] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState(null); // For Logbook Accordion
  const [vitalsLogTime, setVitalsLogTime] = useState(getNow);
  const [isManualVitalsEdit, setIsManualVitalsEdit] = useState(false);
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
  const [deleteConfirmState, setDeleteConfirmState] = useState(null); // { id, message, onConfirm }

  // State for Chart Expansion
  const [estimatedHbA1c, setEstimatedHbA1c] = useState(null);
  const [isCaregiverMode, setIsCaregiverMode] = useState(false);

  const [accountPendingDeletion, setAccountPendingDeletion] = useState(null);
  const [showSettings, setShowSettings] = useState(false);


  // Background Reminder Logic (C3: Service-Based)
  useEffect(() => {
    if (!remindersEnabled || isCaregiverMode) return;

    // Persist reminders to local storage whenever they change
    localStorage.setItem('start_reminders', JSON.stringify(reminders));

    const interval = setInterval(() => {
      checkAndTriggerReminders(reminders);
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [reminders, remindersEnabled, isCaregiverMode]);

  // V2: ISOLATED VITAL HOOKS (Group V)
  // Each vital has its own listener, completely independent of the main log stream
  const weightLogs = useVitalLogs(user?.uid, 'weight');
  const hba1cLogs = useVitalLogs(user?.uid, 'hba1c');
  const creatinineLogs = useVitalLogs(user?.uid, 'creatinine');
  // Est. HbA1c is derived, so no log hook needed (it's read only or hybrid)

  // Derive latest vitals dynamically from history for profile summary
  // V3 ADAPTER: Aggregates from specific hooks (Primary Source) + Legacy Fallback not needed for new view, but for profile card we use the hook data.
  const getLatestVitals = () => {
    // Hooks return logs sorted desc, so [0] is latest
    const wLog = weightLogs.logs[0];
    const aLog = hba1cLogs.logs[0];
    const cLog = creatinineLogs.logs[0];

    return {
      weight: wLog ? wLog.value : (profile.weight || ''), // Fallback to profile only if no logs (for migration continuity if needed, or just empty)
      hba1c: aLog ? aLog.value : (profile.hba1c || ''),
      creatinine: cLog ? cLog.value : (profile.creatinine || ''),
      lastUpdated: [
        wLog ? 'weight' : null,
        aLog ? 'hba1c' : null,
        cLog ? 'creatinine' : null
      ].filter(Boolean)
    };
  };

  const latestVitals = getLatestVitals();

  useEffect(() => {
    // Re-calculate alerts whenever logs or prescription changes
    if (!prescription) return;

    // Use latest vital values for alerts
    const alertProfile = {
      isElderly: parseInt(profile.age) > 65,
      hasRenalImpairment: (profile.comorbidities || []).includes('Kidney Disease') || (latestVitals.creatinine && parseFloat(latestVitals.creatinine) > 1.3),
      hasHeartFailure: (profile.comorbidities || []).includes('Heart Disease'),
      isPregnant: profile.pregnancyStatus,
      hasObesity: latestVitals.weight && parseFloat(latestVitals.weight) > 100
    };

    const alerts = getPrescriptionAlerts(prescription, alertProfile);

    // Hazard Alerts based on current real-time HGT entry
    if (hgt) {
      const val = parseFloat(hgt);
      if (val < 70) alerts.push({ type: 'danger', message: "Low sugar detected (<70). Take fast-acting carbs immediately." });
      else if (val > 400) alerts.push({ type: 'danger', message: "CRITICAL High (>400). Check ketones & consult doctor." });
      else if (val > 300) alerts.push({ type: 'warning', message: "Very High (>300). Immediate correction required." });
      else if (val > 250) alerts.push({ type: 'warning', message: "High (>250). Review insulin dose." });
    }

    setSafetyAlerts(alerts);
  }, [profile, prescription, hgt]); // Added hgt to dependency array


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

  // Helper: Local ISO string (YYYY-MM-DDTHH:MM) - DEPRECATED, mapped to getNow
  const getLocalISO = getNow;

  // 2. Precise Sync (anti-drift with requestAnimationFrame)
  useEffect(() => {
    const syncTime = () => {
      if (!isManualLogEdit) setLogTime(getNow());
      if (!isManualVitalsEdit) setVitalsLogTime(getNow());
    };

    const interval = setInterval(syncTime, 60000);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') syncTime();
    };

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isManualLogEdit, isManualVitalsEdit]);

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
  useEffect(() => {
    localStorage.setItem('sugar_darkMode', darkMode);
    if (darkMode) { document.documentElement.classList.add('dark'); }
    else { document.documentElement.classList.remove('dark'); }
  }, [darkMode]);
  useEffect(() => { localStorage.setItem('sugar_haptics', hapticsEnabled); }, [hapticsEnabled]);
  useEffect(() => { localStorage.setItem('sugar_sound', soundEnabled); }, [soundEnabled]);
  useEffect(() => { localStorage.setItem('sugar_lang', lang); }, [lang]);

  // PERSIENCE LAYER: Save Profile & Prescription to LocalStorage
  useEffect(() => {
    if (user?.uid && !loading) {
      localStorage.setItem(`sugar_data_${user.uid}`, JSON.stringify({ profile, prescription }));
    }
  }, [user, profile, prescription, loading]);

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
          // HYDRATION: Load from LocalStorage if available (Offline First)
          const cached = localStorage.getItem(`sugar_data_${u.uid}`);
          if (cached) {
            try {
              const { profile: cProfile, prescription: cPrescription } = JSON.parse(cached);
              if (cProfile) setProfile(cProfile);
              if (cPrescription) setPrescription(cPrescription);
            } catch (e) { console.error("Cache Parse Error", e); }
          }

          // MEDICATION DB LOADING (Offline First)
          // We now use the local JSON file directly to prevent network failures
          setMedDatabase(MED_LIBRARY); // Instant load

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
                slidingScale: ins.slidingScale || []
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



  // PRIMARY READ OPTIMIZATION: Cache-First Strategy
  // Replaces onSnapshot with Manual Fetch + Stale-While-Revalidate
  const fetchLogs = async (force = false) => {
    if (!user) return;
    const cacheKey = `logs`; // Key simplified, userId handled by service

    // 1. Load from Cache immediately (Async Decrypt)
    const cached = await offlineStorage.get(cacheKey, user.uid);
    if (cached && cached.data) {
      setFullHistory(cached.data);
    }

    // 2. Decide if we need to fetch network
    // Fetch if: No cache, Cache Stale (>10m), or Force Refresh (User Action/Write)
    if (!cached || await offlineStorage.isStale(cacheKey, user.uid) || force) {
      console.log('Fetching logs from network...'); // Audit Log
      try {
        const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), orderBy('timestamp', 'desc'), limit(100));
        const snapshot = await getDocs(q);
        const freshLogs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        setFullHistory(freshLogs);
        await offlineStorage.save(cacheKey, freshLogs, user.uid); // Update Cache (Async Encrypt)
      } catch (err) {
        console.error("Network Fetch Failed", err);
        // If fetch fails, we already showed cached data, so user sees no error (Success)
      }
    }
  };

  // Initial Load + Reconnect Listener
  useEffect(() => {
    if (!user) return;
    fetchLogs(); // Initial load

    const handleOnline = () => fetchLogs(true); // Sync on reconnect
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user]);

  const checkContraindication = (medName) => {
    if (!medName || typeof medName !== 'string') return false;

    // Search in local MED_LIBRARY (Oral Meds)
    let med = MED_LIBRARY.medications?.find(m =>
      (m.generic_name && m.generic_name.toLowerCase().includes(medName.toLowerCase())) ||
      (m.brand_names && m.brand_names.some(b => b.toLowerCase().includes(medName.toLowerCase())))
    );

    // If not found, search in Insulins
    if (!med) {
      med = MED_LIBRARY.insulins?.find(i =>
        (i.generic_name && i.generic_name.toLowerCase().includes(medName.toLowerCase())) ||
        (i.brand_names && i.brand_names.some(b => b.toLowerCase().includes(medName.toLowerCase())))
      );
    }

    return profile.pregnancyStatus && med?.safety_flags?.pregnancy === 'avoid';
  };

  const getMedicationTags = (medName) => {
    if (!medName) return [];
    let med = MED_LIBRARY.medications?.find(m =>
      (m.generic_name && m.generic_name.toLowerCase().includes(medName.toLowerCase())) ||
      (m.brand_names && m.brand_names.some(b => b.toLowerCase().includes(medName.toLowerCase())))
    );
    if (!med) {
      med = MED_LIBRARY.insulins?.find(i =>
        (i.generic_name && i.generic_name.toLowerCase().includes(medName.toLowerCase())) ||
        (i.brand_names && i.brand_names.some(b => b.toLowerCase().includes(medName.toLowerCase())))
      );
    }
    return med?.tags || [];
  };

  const detectSearchContext = (searchTerm, medication) => {
    if (!searchTerm || !medication) return { context: 'generic', matchedBrand: null };
    const term = searchTerm.toLowerCase().trim();
    const genericName = (medication.generic_name || medication.name || '').toLowerCase();
    const brandNames = medication.brand_names || medication.brands || [];
    const matchedBrand = brandNames.find(b => b.toLowerCase().includes(term));
    if (matchedBrand && !genericName.includes(term)) {
      return { context: 'brand', matchedBrand };
    }
    return { context: 'generic', matchedBrand: null };
  };

  const getSuggestion = (insulinId) => {
    const insulin = prescription.insulins.find(i => i.id === insulinId);
    if (!insulin || !hgt) return null;
    const current = parseFloat(hgt);
    if (isNaN(current)) return null;
    if (current < 70) return "HYPO ALERT";

    // Safety Check using MED_LIBRARY
    const medDetails = MED_LIBRARY.insulins?.find(i =>
      (i.generic_name && i.generic_name.toLowerCase() === insulin.name.toLowerCase()) ||
      (i.brand_names && i.brand_names.some(b => b.toLowerCase() === insulin.name.toLowerCase()))
    );

    if (profile.pregnancyStatus && medDetails?.safety_flags?.pregnancy === 'avoid') return "Unsafe (Pregnancy)";

    let baseDose = parseFloat(insulin.fixedDose || 0);
    let scaleDose = 0;

    if (insulin.slidingScale && insulin.slidingScale.length > 0) {
      // FIX: Add safety check 'r &&' to prevent crash if rule is null/undefined
      const rule = insulin.slidingScale.find(r => r && current >= parseFloat(r.min || 0) && current < parseFloat(r.max || 0));
      if (rule) scaleDose = parseFloat(rule.dose || 0);
    }

    let totalDose = baseDose + scaleDose;
    return totalDose > 0 ? totalDose : null;
  };

  const getTrendData = (metric) => {
    // 1. Get Isolated Logs for this metric (New Architecture)
    const isolatedLogs =
      metric === 'weight' ? weightLogs.logs :
        metric === 'hba1c' ? hba1cLogs.logs :
          metric === 'creatinine' ? creatinineLogs.logs : [];

    // 2. Extract legacy entries from fullHistory (Old Architecture)
    const legacyEntries = fullHistory
      .filter(log => {
        // Only include if this specific vital was actually updated in this log
        if (log.type === 'vital_update') {
          return log.updatedParams && log.updatedParams.includes(metric);
        }
        // For older legacy logs or other types, check existence (graceful fallback)
        return log.snapshot?.profile?.[metric] !== undefined && log.snapshot.profile[metric] !== null && !isNaN(parseFloat(log.snapshot.profile[metric]));
      });

    // 3. Merge and Map to standard format
    // Note: isolatedLogs are already formatted as objects, but we need to normalize key names if they differ.
    // useVitalLogs returns { id, value, timestamp (millis), ... }
    const normIsolated = isolatedLogs.map(l => ({
      id: l.id,
      date: safeEpoch(l.timestamp), // Use robust safeEpoch
      value: parseFloat(l.value)
    }));

    const normLegacy = legacyEntries.map(l => ({
      id: l.id,
      date: safeEpoch(l.timestamp), // Use robust safeEpoch
      value: parseFloat(l.snapshot.profile[metric])
    }));

    // 4. Combine and Sort
    const allEntries = [...normIsolated, ...normLegacy]
      .sort((a, b) => a.date - b.date);

    // 5. Strict filtering: Only keep points where the value actually CHANGED
    const uniqueChanges = [];
    allEntries.forEach((entry, i) => {
      if (i === 0 || entry.value !== uniqueChanges[uniqueChanges.length - 1].value) {
        uniqueChanges.push(entry);
      }
    });

    return uniqueChanges;
  };

  // V5-RESTORE: Helper to get merged history (Legacy + Isolated) for Deep View List
  const getMergedVitalHistory = (metric) => {
    if (!metric) return [];

    // 1. New Isolated Logs
    const isolatedLogs =
      metric === 'weight' ? weightLogs.logs :
        metric === 'hba1c' ? hba1cLogs.logs :
          metric === 'creatinine' ? creatinineLogs.logs : [];

    // 2. Legacy Logs
    // Filter strictly for existence of this vital in the snapshot
    const legacyLogs = fullHistory.filter(log => {
      // MATCH TREND LOGIC EXACTLY
      if (log.type === 'vital_update') {
        return log.updatedParams && log.updatedParams.includes(metric);
      }
      return log.snapshot?.profile?.[metric] !== undefined &&
        log.snapshot.profile[metric] !== null &&
        !isNaN(parseFloat(log.snapshot.profile[metric]));
    });

    // 3. Merge & Sort by Time Descending
    return [...isolatedLogs, ...legacyLogs].sort((a, b) => {
      const tA = safeEpoch(a.timestamp);
      const tB = safeEpoch(b.timestamp);
      return tB - tA;
    });
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
    try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'medications', 'master_list'), MED_LIBRARY); alert("Database Initialized!"); } catch (e) { alert("Error: " + e.message); }
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();

    // 1. STRICT CHANGE DETECTION
    const updatedParams = [];
    const updatedProfile = { ...profile };
    let hasStrictChanges = false;

    // Helper to check valid change
    const checkChange = (key, newValue) => {
      if (newValue !== undefined && newValue !== '' && newValue !== profile[key]) {
        updatedProfile[key] = newValue;
        updatedParams.push(key);
        hasStrictChanges = true;
      }
    };

    if (vitalsForm.weight) checkChange('weight', vitalsForm.weight);
    if (vitalsForm.hba1c) checkChange('hba1c', vitalsForm.hba1c);
    if (vitalsForm.creatinine) checkChange('creatinine', vitalsForm.creatinine);
    if (vitalsForm.dob) {
      if (vitalsForm.dob !== profile.dob) {
        updatedProfile.dob = vitalsForm.dob;
        updatedProfile.age = calculateAge(vitalsForm.dob);
        // Age/DOB normally doesn't trigger a 'vital_update' log unless explicitly tracking it, but we update profile
        hasStrictChanges = true;
      }
    }
    if (vitalsForm.gender) checkChange('gender', vitalsForm.gender);
    if (vitalsForm.pregnancyStatus !== undefined) checkChange('pregnancyStatus', vitalsForm.pregnancyStatus);

    // Instructions check
    if (vitalsForm.instructions !== undefined && vitalsForm.instructions !== profile.instructions) {
      updatedProfile.instructions = vitalsForm.instructions;
      hasStrictChanges = true;
    }

    if (!hasStrictChanges) return alert("No changes detected to save.");

    // 2. VALIDATION
    if (vitalsForm.weight && (parseFloat(vitalsForm.weight) < 1 || parseFloat(vitalsForm.weight) > 1000)) return alert("Invalid Weight");
    if (vitalsForm.hba1c && (parseFloat(vitalsForm.hba1c) < 3 || parseFloat(vitalsForm.hba1c) > 20)) return alert("Invalid HbA1c");

    // Timestamp Resolution
    let timestamp;
    if (editingLog && !isManualVitalsEdit) {
      timestamp = safeEpoch(editingLog.timestamp);
    } else {
      timestamp = (vitalsLogTime && isManualVitalsEdit) ? fromInputString(vitalsLogTime) : getEpoch();
    }

    if (!timestamp || isNaN(timestamp)) return alert("Invalid Date/Time selected.");
    if (isFuture(timestamp)) return alert("Cannot log vitals in the future.");

    // 3. DUPLICATE CHECK (1 Hour Rule for Vitals)
    if (!editingLog) {
      const pertinentParams = updatedParams.filter(p => ['weight', 'hba1c', 'creatinine'].includes(p));
      if (pertinentParams.length > 0) {
        const recentVital = fullHistory.find(l =>
          l.type === 'vital_update' &&
          l.updatedParams?.some(p => pertinentParams.includes(p)) &&
          Math.abs(timestamp - getLogTimestamp(l.timestamp)) < 3600000
        );

        if (recentVital) {
          // Strict Block for Safety
          return alert("Safety Notice: Vitals were updated less than 60 minutes ago. Please wait before adding a new entry to prevent duplicates.");
        }
      }
    }

    // 4. EXECUTION
    try {
      if (editingLog && editingLog.type === 'vital_update') {
        const finalUpdate = {
          snapshot: { ...editingLog.snapshot, profile: updatedProfile },
          updatedParams,
          timestamp
        };
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'logs', editingLog.id), finalUpdate);
        alert("Entry Updated.");
      } else {
        // Atomic Update Sequence
        // A. Update Profile Doc (For backward compatibility with profile display)
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), { profile: updatedProfile, prescription, lastUpdated: getEpoch() }, { merge: true });

        // ISOLATION ENFORCEMENT: NO LONGER creating legacy vital_update logs
        // Vitals are now written EXCLUSIVELY through isolated hooks (useVitalLogs)
        // Profile vital fields are updated here for display/summary purposes only

        alert("Profile Updated.");
      }

      // Force Refresh
      await fetchLogs(true);
      setProfile(updatedProfile); // Optimistic Update

      // 5. RESET STATE (Atomic)
      setVitalsForm({});
      setUnlockPersonal(false);
      setUnlockComorbidities(false);
      setVitalsLogTime(getNow()); // STRICT: Reset to Device Time
      setIsManualVitalsEdit(false);
      setEditingLog(null);

    } catch (err) {
      console.error("Profile Save Error:", err);
      alert("Save failed: " + err.message);
    }
  };

  const handleDeleteEntry = async (id) => {
    const log = fullHistory.find(l => l.id === id);
    if (!log) return;

    // 30 Minute Lock Protection REMOVED per V2 Governance

    setDeleteConfirmState({
      id: id,
      message: "This action cannot be undone.",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'logs', id));
          auditLogger.log(user.uid, 'DATA_DELETE', { logId: id }); // AUDIT
          fetchLogs(true); // Refresh cache
          setDeleteConfirmState(null);
        } catch (err) { alert("Delete failed: " + err.message); }
      }
    });
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
      // P3 & R: Prescription-Driven Reminder Sync
      const synced = syncRemindersWithPrescription(prescription, reminders);

      // R2 Logic: Permission Policy
      // Trigger request ONLY if we went from 0 reminders to >0 (Newly Created)
      // AND permissions haven't been asked/granted yet.
      const isFirstCreation = reminders.length === 0 && synced.length > 0;

      if (isFirstCreation) {
        try {
          // Force enable on first creation
          setRemindersEnabled(true);
          // Request Permission
          const granted = await requestNotificationPermission();
          if (!granted) {
            alert("Please enable notifications to receive medication reminders.");
          }
        } catch (e) { console.warn("Permission req failed", e); }
      }

      setReminders(synced);

      // Persist enabled state
      if (isFirstCreation) localStorage.setItem('reminders_enabled', 'true');
      localStorage.setItem('start_reminders', JSON.stringify(synced));


      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), {
        profile,
        prescription,
        // Storing reminders in profile doc for redundancy/cloud sync
        reminders: synced,
        lastUpdated: getEpoch()
      }, { merge: true });

      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), { type: 'prescription_update', snapshot: { prescription }, timestamp: serverTimestamp(), tags: ['Rx Change', 'Audit'] });

      alert("Prescription Saved."); setView('diary');
      fetchLogs(true); // Refresh cache
    } catch (err) { alert("Save failed: " + err.message); }
  };

  // Offline Status Listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSaveEntry = async () => {
    // 1. PREPARE PAYLOAD
    const safeHgt = hgt ? parseFloat(hgt) : null;
    const safeMeds = Object.keys(medsTaken).filter(k => medsTaken[k]);
    const safeInsulin = { ...insulinDoses };
    const safeTags = [...contextTags];
    const hasContext = safeTags.length > 0;
    const hasOralMeds = safeMeds.length > 0;
    const hasInsulin = Object.keys(safeInsulin).length > 0;

    // 2. STRICT VALIDATION
    // A. Empty Payload Check
    if (!safeHgt && !hasOralMeds && !hasInsulin && !hasContext) {
      return alert("Empty Log: Please enter a Blood Sugar value, Medication, or Context tag before saving.");
    }

    // B. Numeric Safety
    if (hgt && isNaN(safeHgt)) return alert("Invalid Blood Sugar Value");

    // C. Safety Block: Insulin requires Sugar
    if (hasInsulin && (!safeHgt || safeHgt < 20)) {
      return alert("Safety Block: Cannot log insulin without a valid blood sugar reading (> 20 mg/dL).");
    }

    // D. Timestamp Logic (Atomic Resolution)
    let timestamp;
    if (editingLog && !isManualLogEdit) {
      // Editing Mode (Preserve original unless manually overridden)
      timestamp = safeEpoch(editingLog.timestamp);
    } else {
      // New Entry OR Editing with Manual Override
      timestamp = (isManualLogEdit && logTime) ? fromInputString(logTime) : getEpoch();
    }

    if (!timestamp || isNaN(timestamp)) return alert("Invalid Log Time.");
    if (isFuture(timestamp)) return alert("Cannot log entries in the future.");


    // E. Granular Duplicate Checks (New Entries Only)
    // Legacy duplicate checks logic preserved but strictly ordered before DB calls
    if (!editingLog) {
      // Glucose Check (1 Hour Block)
      if (safeHgt) {
        const recentSugar = fullHistory.find(l =>
          !l.type && l.hgt &&
          Math.abs(timestamp - getLogTimestamp(l.timestamp)) < 3600000
        );
        if (recentSugar) return alert("Action Blocked: Glucose was already logged in the last hour. Please wait before re-checking.");
      }

      // Medication Check (Same Day + Same Slot Block)
      if (hasOralMeds) {
        const entryDateString = new Date(timestamp).toDateString();
        const duplicateMed = safeMeds.find(key => {
          return fullHistory.some(l => {
            const lDate = new Date(getLogTimestamp(l.timestamp));
            return (!l.type) && lDate.toDateString() === entryDateString && (l.medsTaken || []).includes(key);
          });
        });

        if (duplicateMed) {
          const [id, slot] = duplicateMed.split('_');
          const medName = prescription.oralMeds.find(m => m.id === id)?.name || "Medication";
          return alert(`Action Blocked: '${medName}' has already been logged for the '${slot}' slot today. Duplicate doses are prevented for safety.`);
        }
      }

      // Insulin Check (60 Minute Block)
      if (hasInsulin) {
        const recentInsulin = fullHistory.find(l =>
          !l.type && l.insulinDoses && Object.keys(l.insulinDoses).length > 0 &&
          Math.abs(timestamp - getLogTimestamp(l.timestamp)) < 3600000
        );
        if (recentInsulin) return alert("Action Blocked: Insulin was already logged in the last hour. Please ensure at least 60 minutes between doses.");
      }
    }

    // 3. EXECUTION
    const entryData = {
      hgt: safeHgt,
      mealStatus,
      insulinDoses: safeInsulin,
      medsTaken: safeMeds,
      tags: safeTags,
      timestamp,
      snapshot: { profile, prescription } // Snapshot for history
    };

    try {
      if (editingLog && !editingLog.type) {
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'logs', editingLog.id), entryData);
        auditLogger.log(user.uid, 'DATA_UPDATE', { logId: editingLog.id, type: 'diary' });
        alert("Record Updated!");
      } else {
        const ref = await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), entryData);
        auditLogger.log(user.uid, 'DATA_CREATE', { logId: ref.id, type: 'diary' });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }

      // Force refresh to ensure UI is in sync
      await fetchLogs(true);
    } catch (err) {
      console.error("Save Error:", err);
      alert("Save failed: " + err.message);
      return; // Do not reset state on failure
    }

    // 4. RESET STATE (Atomic Reset)
    // Only reachable if try block succeeds
    setHgt('');
    setInsulinDoses({});
    setMedsTaken({});
    setContextTags([]);
    setLogTime(getNow()); // STRICT: Always reset to Live Device Time
    setIsManualLogEdit(false);
    setEditingLog(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartEdit = (log) => {
    // Check if edit is allowed (ONLY within 30 minutes)
    if (!canEdit(log.timestamp)) {
      return alert("Edit Not Allowed: Entries can only be edited within 30 minutes of creation to preserve medical accuracy.");
    }

    setEditingLog(log);
    setHgt(log.hgt?.toString() || '');
    setMealStatus(log.mealStatus || 'Pre-Meal');
    setInsulinDoses(log.insulinDoses || {});
    const medsMap = {};
    (log.medsTaken || []).forEach(m => medsMap[m] = true);
    setMedsTaken(medsMap);
    setContextTags(log.tags || []);
    // When editing, we treat it as a manual override so sync doesn't overwrite it
    // Manual Flag NOT set here to preserve original timestamp precision unless user strictly touches input
    setLogTime(toInputString(log.timestamp));
    setView('diary');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartEditVital = (log, vitalTypeOverride = null) => {
    // 30-Minute Lock Check
    if (!canEdit(log.timestamp)) {
      return alert("Editing Locked: Vitals logs become read-only after 30 minutes for clinical accuracy.");
    }

    // Identify vital type from the log if not provided
    let vitalType = vitalTypeOverride;
    if (!vitalType && log.updatedParams && log.updatedParams.length > 0) {
      vitalType = log.updatedParams[0]; // Assuming single vital per log for new system
    }

    // Strict isolation: Open Deep View
    if (vitalType && ['weight', 'hba1c', 'creatinine'].includes(vitalType)) {
      setActiveVital(vitalType);
      // We don't need to populate 'vitalsForm' here anymore because DeepView handles its own state
      // via the 'initialData' prop or internal logic.
      // But DeepView currently looks at 'fullHistory' to find the log to edit if we pass 'editingLogId'?
      // Actually DeepView has startEdit(log) internal function. 
      // We just need to open the view. 
      // However, to trigger edit mode immediately, we might need a mechanism.
      // For now, let's just open the view. The user can click edit there, OR we pass an initial intent.
      // Simpler: Just open the view. The user can find the log in history and click edit.
      // OR better: if we really want to jump to edit, we can pass 'initialLogToEdit' prop.
      // Let's stick to "Open View" for now as per "Strict Isolation" -> "Fresh HbA1c view".
      // If the user clicked "Edit" on a specific log in a list (where?), 
      // In the new system, history IS inside the view. So this external handleStartEditVital 
      // might only be called from... where? 
      // Ah, the old 'ExpandedGraphModal' had an edit button. 
      // If we replaced ExpandedGraphModal with DeepView, we are good.
      return;
    }

    // Legacy fallback for older logs that might have mixed data or other types
    setEditingLog(log);
    // ... rest of legacy logic ...
  };


  // REMOVED: handleSaveDeepVital
  // This legacy function was creating dual writes to the main logs collection.
  // Vital saves now go EXCLUSIVELY through isolated hooks (useVitalLogs).
  // VitalDeepView onSave handlers call weightLogs.addLog, hba1cLogs.addLog, etc. directly.

  const handleSoftDelete = async () => {
    if (!confirm("Are you sure you want to delete your account? This action is reversible for 30 days.")) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), {
        'profile.deletedAt': getEpoch()
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
    generatePDFReport({
      user, profile, prescription, compliance, fullHistory, pdfStartDate, pdfEndDate,
      trendData: {
        weight: getTrendData('weight'),
        hba1c: getTrendData('hba1c'),
        creatinine: getTrendData('creatinine')
      }
    });
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
          triggerFeedback(hapticsEnabled, soundEnabled, 'success');
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

  if (!profile.hasConsented) return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-stone-100"><div className="text-center text-stone-400 italic">Starting...</div></div>}>
      <ConsentScreen onConsent={() => setProfile(p => ({ ...p, hasConsented: true }))} />
    </Suspense>
  );

  return (
    <GlobalRecoveryBoundary>
      <SecurityGuardian>
        <div className={`max-w-md mx-auto min-h-screen ${isHighContrast ? 'bg-black text-yellow-400' : darkMode ? 'dark bg-stone-950 text-stone-300' : 'bg-[#fffbf5] text-stone-800'} pb-32 font-sans relative select-none ${isHighContrast ? 'high-contrast' : ''}`}>

          <Suspense fallback={null}>
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
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
              remindersEnabled={remindersEnabled}
              setRemindersEnabled={setRemindersEnabled}
            />
          </Suspense>



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
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Sugar-Diary</div>
                  <h1 className="text-2xl font-bold text-stone-800">{user.displayName}</h1>
                  <div className="text-xs text-stone-400 flex items-center gap-2">
                    {profile.gender && <span className="uppercase font-bold text-stone-500">{profile.gender}</span>}
                    {profile.pregnancyStatus && <span className="text-red-500 font-bold flex items-center gap-1"><Baby size={10} /> Preg</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                {!isOnline && (
                  <div className="bg-stone-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 animate-pulse">
                    <WifiOff size={10} /> Offline
                  </div>
                )}
                <button onClick={() => setShowSettings(true)} className="p-2 bg-stone-100 text-stone-500 rounded-xl hover:bg-stone-200 transition-colors"><Settings size={20} /></button>
                <button onClick={() => signOut(auth)}><LogOut size={20} className="text-red-400 hover:text-red-500" /></button>
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <StatBadge emoji="🧘‍♂️" label={T('age')} value={profile.age} unit="Yrs" color="blue" onClick={() => { setHighlightField('dob'); setView('profile'); }} />
              <StatBadge emoji="⚖️" label={T('weight')} value={latestVitals.weight} unit="kg" color="orange" onClick={() => { setActiveVital('weight'); }} />
              <StatBadge emoji="🩸" label={T('hba1c')} value={latestVitals.hba1c} unit="%" color="emerald" onClick={() => { setActiveVital('hba1c'); }} />
              <StatBadge emoji="🧪" label={T('creatinine')} value={latestVitals.creatinine} unit="mg/dL" color="purple" onClick={() => { setActiveVital('creatinine'); }} />
              {estimatedHbA1c && <StatBadge emoji="🎯" label="Est. HbA1c" value={estimatedHbA1c} unit="%" color="stone" onClick={() => { setActiveVital('est_hba1c'); }} />}
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
                      <div className="bg-white dark:bg-stone-800 p-6 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700 mb-6">
                        <label className="text-xs font-bold text-stone-400 uppercase">Blood Sugar</label>
                        <div className="flex items-baseline gap-2 mb-4">
                          <input type="number" value={hgt} onChange={e => setHgt(e.target.value.slice(0, 3))} min="1" max="999" className="text-6xl font-bold w-full outline-none text-emerald-900 dark:text-emerald-400 bg-transparent" placeholder="---" />
                          <span className="text-xl font-bold text-stone-400">mg/dL</span>
                        </div>
                        <div className="flex gap-2 mb-4">
                          {['Fasting', 'Pre-Meal', 'Post-Meal', 'Bedtime'].map(m => <MealOption key={m} label={m} icon={Clock} selected={mealStatus === m} onClick={() => { triggerFeedback(hapticsEnabled, soundEnabled, 'tick'); setMealStatus(m); }} />)}
                        </div>
                      </div>

                      {prescription.insulins.map(insulin => (
                        <div key={insulin.id} className="bg-white dark:bg-stone-800 p-4 rounded-2xl border border-stone-100 dark:border-stone-700 flex justify-between items-center mb-2">
                          <div>
                            <span className="font-bold text-stone-700 dark:text-stone-200 block">{insulin.name}</span>
                            {/* Frequency Hidden per Design Request */}
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
                                triggerFeedback(hapticsEnabled, soundEnabled, 'tick');
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
                                  triggerFeedback(hapticsEnabled, soundEnabled, 'selection');
                                  return newState;
                                })
                              }} className={`px-4 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${medsTaken[`${med.id}_${t}`] ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-500 text-emerald-800 dark:text-emerald-400' : 'bg-stone-50 dark:bg-stone-900 dark:border-stone-700 dark:text-stone-400'}`}>{t}</button>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div className="flex flex-wrap gap-2 mt-4 mb-4">
                        {Object.keys(TAG_EMOJIS).map(t => <ContextTag key={t} label={`${TAG_EMOJIS[t]} ${t}`} icon={Thermometer} color="stone" selected={contextTags.includes(t)} onClick={() => { triggerFeedback(hapticsEnabled, soundEnabled, 'selection'); setContextTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]) }} />)}
                      </div>

                      <div className="mb-6 bg-white dark:bg-stone-800 p-4 rounded-2xl border border-stone-100 dark:border-stone-700">
                        <label className="text-[10px] font-bold text-stone-400 uppercase block mb-2">Back-time Entry (Date & Time)</label>
                        <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-900 p-3 rounded-xl border border-stone-100 dark:border-stone-700 focus-within:border-emerald-500 transition-all">
                          <Calendar size={18} className="text-stone-400" />
                          <input
                            type="datetime-local"
                            value={logTime}
                            onChange={(e) => { setIsManualLogEdit(true); setLogTime(e.target.value); }}
                            max={new Date().toISOString().slice(0, 16)}
                            disabled={!!editingLog} // Locked during edit per strict governance
                            className={`bg-transparent font-bold text-stone-700 dark:text-stone-200 outline-none w-full text-sm ${editingLog ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                        </div>
                      </div>

                      {editingLog && !editingLog.type ? (
                        <div className="flex gap-2 mb-6">
                          <button onClick={() => { triggerFeedback(hapticsEnabled, soundEnabled, 'success'); handleSaveEntry(); }} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg flex justify-center gap-2"><Save /> Update Record</button>
                          <button onClick={() => { triggerFeedback(hapticsEnabled, soundEnabled, 'light'); setEditingLog(null); setHgt(''); setInsulinDoses({}); setMedsTaken({}); setContextTags([]); setLogTime(new Date().toISOString().slice(0, 16)); }} className="flex-1 bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 py-4 rounded-2xl font-bold">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => { triggerFeedback(hapticsEnabled, soundEnabled, 'success'); handleSaveEntry(); }} className="w-full bg-stone-900 dark:bg-stone-700 text-white py-4 rounded-2xl font-bold shadow-lg flex justify-center gap-2 mb-6"><Save /> Save Entry</button>
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

                </div>

                <div className="mt-8 text-center">
                  <button onClick={handleSeedDatabase} className="text-xs font-bold text-stone-300 hover:text-emerald-500 flex items-center justify-center gap-1 mx-auto"><Database size={10} /> Sync Med Database</button>
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
                      onClick={() => setActiveVital('weight')}
                      disableHover={false}
                    />
                  </GraphErrorBoundary>
                  <GraphErrorBoundary>
                    <SimpleTrendGraph
                      data={getTrendData('hba1c')} label="HbA1c" unit="%" color="emerald" normalRange={5.7}
                      onClick={() => setActiveVital('hba1c')}
                      disableHover={false}
                    />
                  </GraphErrorBoundary>
                  <GraphErrorBoundary>
                    <SimpleTrendGraph
                      data={getTrendData('creatinine')} label="Creatinine" unit="mg/dL" color="purple" normalRange={1.2}
                      onClick={() => setActiveVital('creatinine')}
                      disableHover={false}
                    />
                  </GraphErrorBoundary>
                </div>
              </div >
            )
          }

          {
            view === 'prescription' && (
              <div className="px-6 pb-32 animate-in slide-in-from-right">
                <h2 className="text-2xl font-serif font-bold mb-4 flex items-center gap-2 text-stone-800 dark:text-stone-100"><Stethoscope className="text-emerald-600" /> Prescription</h2>

                {/* UNIFIED PRESCRIPTION MANAGER - INCREASED CONTRAST */}
                <div className="bg-stone-100/60 dark:bg-stone-900 p-6 rounded-[24px] shadow-sm mb-6 border border-stone-200/50">


                  {/* MINIMALIST ADD BUTTONS */}
                  <div className="flex flex-col gap-3 mb-6">
                    {/* INSULIN SEARCH */}
                    <div className="relative search-container group">
                      <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-text ${showInsulinResults ? 'bg-white border-stone-400 ring-2 ring-stone-200 shadow-lg' : 'bg-transparent border-stone-200 hover:border-stone-300 hover:bg-white/50'}`}>
                        <Syringe size={18} className="text-stone-600" />
                        <input
                          type="text"
                          placeholder="Add Insulin"
                          value={insulinSearch}
                          onChange={e => { setInsulinSearch(e.target.value); setShowInsulinResults(true); setShowOralResults(false); }}
                          onFocus={() => { setShowInsulinResults(true); setShowOralResults(false); }}
                          className="flex-1 bg-transparent outline-none font-medium text-stone-800 placeholder-stone-400 text-sm"
                        />
                        {insulinSearch && <button onClick={() => { setInsulinSearch(''); setShowInsulinResults(false); }}><X size={16} className="text-stone-400 hover:text-stone-600" /></button>}
                      </div>

                      {showInsulinResults && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-stone-100 max-h-60 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2">
                          {(medDatabase.insulins || []).filter(i => (i.name || i.generic_name || '').toLowerCase().includes(insulinSearch.toLowerCase()) || (i.brands || i.brand_names || []).some(b => b.toLowerCase().includes(insulinSearch.toLowerCase()))).map(insulin => (
                            <button
                              key={insulin.name || insulin.generic_name}
                              onClick={() => {
                                const ctx = detectSearchContext(insulinSearch, insulin);
                                const iName = insulin.name || insulin.generic_name;
                                const genericName = insulin.generic_name || insulin.name;

                                // Enhanced duplicate check - same generic, regardless of brand
                                const duplicate = prescription.insulins.find(i =>
                                  (i.generic_name || i.name) === genericName
                                );
                                if (duplicate) {
                                  return alert(`${genericName} already added!`);
                                }

                                const newInsulin = {
                                  ...insulin,
                                  name: iName,
                                  id: generateId(),
                                  type: 'insulin',
                                  frequency: 'Before Meals',
                                  _displayContext: ctx.context,
                                  _displayBrand: ctx.matchedBrand
                                };
                                setPrescription(p => ({ ...p, insulins: [...p.insulins, newInsulin] }));
                                setInsulinSearch(''); setShowInsulinResults(false);
                              }}
                              className="w-full text-left p-3 hover:bg-stone-50 flex items-center justify-between group"
                            >
                              <div className="flex flex-col">
                                {(() => {
                                  const ctx = detectSearchContext(insulinSearch, insulin);
                                  const genericName = insulin.generic_name || insulin.name;
                                  const allBrands = insulin.brand_names || insulin.brands || [];

                                  if (ctx.context === 'brand') {
                                    return (
                                      <>
                                        <span className="font-bold text-stone-700 text-sm">{ctx.matchedBrand}</span>
                                        <span className="text-[10px] text-stone-400 mt-0.5">
                                          Generic: {genericName} {allBrands.filter(b => b !== ctx.matchedBrand).length > 0 ? '| Other: ' + allBrands.filter(b => b !== ctx.matchedBrand).slice(0, 2).join(', ') : ''}
                                        </span>
                                      </>
                                    );
                                  } else {
                                    return (
                                      <>
                                        <span className="font-bold text-stone-700 text-sm">{genericName}</span>
                                        {allBrands.length > 0 && (
                                          <span className="text-[10px] text-stone-400 mt-0.5">
                                            Brands: {allBrands.slice(0, 3).join(', ')}{allBrands.length > 3 ? '...' : ''}
                                          </span>
                                        )}
                                      </>
                                    );
                                  }
                                })()}
                              </div>
                              <PlusCircle size={16} className="text-stone-300 group-hover:text-emerald-500" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ORAL MEDICATION SEARCH */}
                    <div className="relative search-container group">
                      <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-text ${showOralResults ? 'bg-white border-stone-400 ring-2 ring-stone-200 shadow-lg' : 'bg-transparent border-stone-200 hover:border-stone-300 hover:bg-white/50'}`}>
                        <Pill size={18} className="text-stone-600" />
                        <input
                          type="text"
                          placeholder="Add Medicine"
                          value={oralSearch}
                          onChange={e => { setOralSearch(e.target.value); setShowOralResults(true); setShowInsulinResults(false); }}
                          onFocus={() => { setShowOralResults(true); setShowInsulinResults(false); }}
                          className="flex-1 bg-transparent outline-none font-medium text-stone-800 placeholder-stone-400 text-sm"
                        />
                        {oralSearch && <button onClick={() => { setOralSearch(''); setShowOralResults(false); }}><X size={16} className="text-stone-400 hover:text-stone-600" /></button>}
                      </div>

                      {showOralResults && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-stone-100 max-h-60 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2">
                          {(medDatabase.oralMeds || []).filter(m => (m.name || m.generic_name || '').toLowerCase().includes(oralSearch.toLowerCase()) || (m.brands || m.brand_names || []).some(b => b.toLowerCase().includes(oralSearch.toLowerCase()))).map(med => (
                            <button
                              key={med.name || med.generic_name}
                              onClick={() => {
                                const ctx = detectSearchContext(oralSearch, med);
                                const mName = med.name || med.generic_name;
                                const genericName = med.generic_name || med.name;

                                // Enhanced duplicate check - same generic, regardless of brand
                                const duplicate = prescription.oralMeds.find(m =>
                                  (m.generic_name || m.name) === genericName
                                );
                                if (duplicate) {
                                  return alert(`${genericName} already added!`);
                                }

                                const newMed = {
                                  ...med,
                                  name: mName,
                                  id: generateId(),
                                  type: 'oral',
                                  frequency: 'Twice Daily',
                                  timings: ['Morning', 'Evening'],
                                  _displayContext: ctx.context,
                                  _displayBrand: ctx.matchedBrand
                                };
                                setPrescription(p => ({ ...p, oralMeds: [...p.oralMeds, newMed] }));
                                setOralSearch(''); setShowOralResults(false);
                              }}
                              className="w-full text-left p-3 hover:bg-stone-50 flex items-center justify-between group"
                            >
                              <div className="flex flex-col">
                                {(() => {
                                  const ctx = detectSearchContext(oralSearch, med);
                                  const genericName = med.generic_name || med.name;
                                  const allBrands = med.brand_names || med.brands || [];

                                  if (ctx.context === 'brand') {
                                    return (
                                      <>
                                        <span className="font-bold text-stone-700 text-sm">{ctx.matchedBrand}</span>
                                        <span className="text-[10px] text-stone-400 mt-0.5">
                                          Generic: {genericName} {allBrands.filter(b => b !== ctx.matchedBrand).length > 0 ? '| Other: ' + allBrands.filter(b => b !== ctx.matchedBrand).slice(0, 2).join(', ') : ''}
                                        </span>
                                      </>
                                    );
                                  } else {
                                    return (
                                      <>
                                        <span className="font-bold text-stone-700 text-sm">{genericName}</span>
                                        {allBrands.length > 0 && (
                                          <span className="text-[10px] text-stone-400 mt-0.5">
                                            Brands: {allBrands.slice(0, 3).join(', ')}{allBrands.length > 3 ? '...' : ''}
                                          </span>
                                        )}
                                      </>
                                    );
                                  }
                                })()}
                              </div>
                              <PlusCircle size={16} className="text-stone-300 group-hover:text-blue-500" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ACTIVE LIST */}
                  <div className="space-y-3">
                    {prescription.insulins.map((insulin, idx) => (
                      <div key={insulin.id} className="bg-white/80 p-5 rounded-lg border border-stone-200 border-l-2 border-l-stone-300 relative">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-col">
                            <div className="mb-1">
                              {insulin._displayContext === 'brand' && insulin._displayBrand ? (
                                <>
                                  <div className="font-semibold text-stone-900 text-lg">{insulin._displayBrand}</div>
                                  <div className="text-xs text-stone-500 mt-0.5">Generic: {insulin.generic_name || insulin.name}</div>
                                </>
                              ) : (
                                <div className="font-semibold text-stone-900 text-lg">{insulin.name}</div>
                              )}
                            </div>
                            {/* Clinical Info Button (On-Demand) */}
                            {getMedicationTags(insulin.name).length > 0 && (
                              <button
                                onClick={() => setShowMedInfo(showMedInfo === insulin.id ? null : insulin.id)}
                                className="text-[10px] text-stone-400 hover:text-stone-600 flex items-center gap-1 mt-1"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="12" y1="16" x2="12" y2="12" />
                                  <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                                Clinical Info
                              </button>
                            )}
                            {/* Clinical Tags - Shown only when info button clicked */}
                            {showMedInfo === insulin.id && (
                              <div className="flex flex-wrap gap-1 mt-2 p-2 bg-stone-50 rounded-lg animate-in fade-in slide-in-from-top-1">
                                {getMedicationTags(insulin.name).map(tag => (
                                  <span key={tag} className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${tag.includes('BENEFIT') || tag.includes('SAFE') || tag.includes('LOSS') || tag.includes('NEUTRAL') ? 'bg-emerald-50 text-emerald-600' :
                                    tag.includes('RISK') || tag.includes('CAUTION') || tag.includes('GAIN') ? 'bg-amber-50 text-amber-600' : 'bg-stone-50 text-stone-500'
                                    }`}>
                                    {tag.replace(/_/g, ' ')}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button onClick={() => {
                            if (confirm(`Remove ${insulin.name}?`)) setPrescription(p => ({ ...p, insulins: p.insulins.filter(i => i.id !== insulin.id) }));
                          }} className="text-stone-400 hover:text-red-500 p-1"><X size={16} /></button>
                        </div>

                        <div className="mb-2">
                          <input
                            type="number"
                            placeholder="Dose (Units)"
                            value={insulin.fixedDose || ''}
                            onChange={e => {
                              const newInsulins = [...prescription.insulins];
                              newInsulins[idx].fixedDose = e.target.value;
                              setPrescription({ ...prescription, insulins: newInsulins });
                            }}
                            className="w-full bg-white border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 rounded-xl p-2.5 text-sm font-bold placeholder-stone-400 transition-all outline-none"
                          />
                        </div>

                        {/* Sliding Scale Accordion */}
                        <div>
                          {(insulin.slidingScale) ? (
                            <div className="bg-stone-50 rounded-xl p-2.5 animate-in slide-in-from-top-2">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Sliding Scale Active</span>
                                <button onClick={() => {
                                  if (confirm("Disable sliding scale?")) {
                                    const newInsulins = [...prescription.insulins];
                                    newInsulins[idx].slidingScale = [];
                                    setPrescription({ ...prescription, insulins: newInsulins });
                                  }
                                }} className="text-[10px] text-red-500 font-bold hover:underline">Disable</button>
                              </div>
                              {insulin.slidingScale.map((rule, rIdx) => (
                                <div key={rIdx} className="flex items-center gap-2 mb-2 text-xs">
                                  <div className="flex gap-1 items-center flex-1">
                                    <input
                                      type="number" className="w-12 p-1 bg-white border border-stone-200 rounded text-center font-bold text-stone-600 outline-none focus:border-emerald-400" placeholder="Min"
                                      value={rule.min}
                                      onChange={(e) => {
                                        const newInsulins = [...prescription.insulins];
                                        newInsulins[idx].slidingScale[rIdx].min = e.target.value;
                                        setPrescription({ ...prescription, insulins: newInsulins });
                                      }}
                                    />
                                    <span className="text-stone-300">-</span>
                                    <input
                                      type="number" className="w-12 p-1 bg-white border border-stone-200 rounded text-center font-bold text-stone-600 outline-none focus:border-emerald-400" placeholder="Max"
                                      value={rule.max}
                                      onChange={(e) => {
                                        const newInsulins = [...prescription.insulins];
                                        newInsulins[idx].slidingScale[rIdx].max = e.target.value;
                                        setPrescription({ ...prescription, insulins: newInsulins });
                                      }}
                                    />
                                  </div>
                                  <span className="text-stone-300 mx-1">→</span>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number" className="w-10 p-1 bg-white border border-stone-200 rounded text-center font-bold text-stone-800 outline-none focus:border-emerald-400" placeholder="U"
                                      value={rule.dose}
                                      onChange={(e) => {
                                        const newInsulins = [...prescription.insulins];
                                        newInsulins[idx].slidingScale[rIdx].dose = e.target.value;
                                        setPrescription({ ...prescription, insulins: newInsulins });
                                      }}
                                    />
                                    <span className="text-xs font-bold text-stone-400">u</span>
                                  </div>
                                  <button onClick={() => {
                                    const newInsulins = [...prescription.insulins];
                                    newInsulins[idx].slidingScale = newInsulins[idx].slidingScale.filter((_, i) => i !== rIdx);
                                    setPrescription({ ...prescription, insulins: newInsulins });
                                  }} className="ml-2 text-stone-300 hover:text-red-400"><X size={14} /></button>
                                </div>
                              ))}
                              <button onClick={() => {
                                const newInsulins = [...prescription.insulins];
                                newInsulins[idx].slidingScale = [...(newInsulins[idx].slidingScale || []), { min: '', max: '', dose: '' }];
                                setPrescription({ ...prescription, insulins: newInsulins });
                              }} className="w-full py-2 text-[10px] font-bold text-stone-400 hover:text-emerald-600 border border-dashed border-stone-200 rounded-lg bg-white">+ Add Level</button>
                            </div>
                          ) : (
                            <button onClick={() => {
                              const newInsulins = [...prescription.insulins];
                              newInsulins[idx].slidingScale = []; // Initialize empty container, forcing explicit add
                              setPrescription({ ...prescription, insulins: newInsulins });
                            }} className="text-xs font-bold text-stone-400 hover:text-emerald-600 flex items-center gap-1 transition-colors">
                              <PlusCircle size={14} /> Enable Sliding Scale (Optional)
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {prescription.oralMeds.map((med, idx) => (
                      <div key={med.id} className="bg-white/80 p-5 rounded-lg border border-stone-200 border-l-2 border-l-stone-300 relative">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            {med._displayContext === 'brand' && med._displayBrand ? (
                              <>
                                <div className="font-semibold text-stone-900 text-lg">{med._displayBrand}</div>
                                <div className="text-xs text-stone-500 mt-0.5">Generic: {med.generic_name || med.name}</div>
                              </>
                            ) : (
                              <div className="font-semibold text-stone-900 text-lg">{med.name}</div>
                            )}
                            <span className="text-stone-400 text-sm ml-2 font-medium">{med.dose || 'Standard Dose'}</span>
                            {/* Clinical Tags for Oral Meds */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {/* Clinical Info Button (On-Demand) */}
                              {getMedicationTags(med.name).length > 0 && (
                                <button
                                  onClick={() => setShowMedInfo(showMedInfo === med.id ? null : med.id)}
                                  className="text-[10px] text-stone-400 hover:text-stone-600 flex items-center gap-1"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                  </svg>
                                  Clinical Info
                                </button>
                              )}
                            </div>
                            {/* Clinical Tags - Shown only when info button clicked */}
                            {showMedInfo === med.id && (
                              <div className="flex flex-wrap gap-1 mt-2 p-2 bg-stone-50 rounded-lg animate-in fade-in slide-in-from-top-1">
                                {getMedicationTags(med.name).map(tag => (
                                  <span key={tag} className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${tag.includes('BENEFIT') || tag.includes('SAFE') || tag.includes('LOSS') || tag.includes('NEUTRAL') ? 'bg-emerald-50 text-emerald-600' :
                                    tag.includes('RISK') || tag.includes('CAUTION') || tag.includes('GAIN') ? 'bg-amber-50 text-amber-600' : 'bg-stone-50 text-stone-500'
                                    }`}>
                                    {tag.replace(/_/g, ' ')}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button onClick={() => {
                            if (confirm(`Remove ${med.name}?`)) setPrescription(p => ({ ...p, oralMeds: p.oralMeds.filter(m => m.id !== med.id) }));
                          }} className="text-stone-400 hover:text-red-500 p-1"><X size={16} /></button>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-2">
                          {FREQUENCY_ORDER.map(t => (
                            <button key={t} onClick={() => {
                              const newMeds = [...prescription.oralMeds];
                              if (newMeds[idx].timings.includes(t)) {
                                newMeds[idx].timings = newMeds[idx].timings.filter(x => x !== t);
                              } else {
                                newMeds[idx].timings = [...newMeds[idx].timings, t].sort((a, b) => FREQUENCY_ORDER.indexOf(a) - FREQUENCY_ORDER.indexOf(b));
                              }
                              setPrescription({ ...prescription, oralMeds: newMeds });
                            }} className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${med.timings.includes(t) ? 'bg-stone-700 text-white border-stone-700' : 'bg-transparent text-stone-600 border-stone-300 hover:border-stone-400'}`}>
                              {t}
                            </button>
                          ))}
                        </div>
                        <div className="text-[10px] text-stone-400 font-medium pl-1">
                          {med.name.toLowerCase().includes('metformin') ? 'Take after food' :
                            med.name.toLowerCase().includes('acarbose') ? 'Take with first bite' :
                              med.name.toLowerCase().includes('glimepiride') ? 'Take before food' :
                                med.name.toLowerCase().includes('pantoprazole') ? 'Take empty stomach' : ''}
                        </div>
                      </div>
                    ))}
                  </div>

                  {!isCaregiverMode && <button onClick={handleSavePrescription} className="w-full bg-stone-900 text-white py-5 rounded-full font-bold text-lg shadow-xl shadow-stone-900/10 mt-8 flex justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all"><Save size={22} /> Save Prescription</button>}
                </div>

                {/* SUBTLE CLINICAL ADVISORY (BOTTOM PLACEMENT) */}
                {safetyAlerts.length > 0 && (
                  <div className="mt-8 mb-4">
                    <button onClick={() => setShowAlertDetails(!showAlertDetails)} className="w-full flex items-center justify-between p-4 bg-stone-50/80 dark:bg-stone-900/40 rounded-2xl text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group border border-stone-100/50">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <ShieldAlert className="text-stone-400 group-hover:text-amber-500 transition-colors" size={20} />
                          {safetyAlerts.some(a => a.type === 'danger') && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse ring-2 ring-stone-100" />}
                        </div>
                        <span className="font-bold text-sm uppercase tracking-wide">Clinical Safety Checks</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-stone-200 dark:bg-stone-800 text-stone-500 text-[10px] font-black px-2 py-0.5 rounded-full">{safetyAlerts.length} Alerts</span>
                        {showAlertDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </button>

                    {showAlertDetails && (
                      <div className="mt-2 space-y-2 animate-in slide-in-from-top-1 fade-in duration-200">
                        {safetyAlerts.map((alert, idx) => (
                          <div key={idx} className={`p-4 rounded-xl border flex items-start gap-3 ${alert.type === 'danger' ? 'bg-red-50/30 border-red-100 text-red-800' : 'bg-amber-50/30 border-amber-100 text-amber-800'}`}>
                            {alert.type === 'danger' ? <ShieldAlert className="flex-shrink-0 text-red-400" size={16} /> : <AlertTriangle className="flex-shrink-0 text-amber-400" size={16} />}
                            <div>
                              <p className="font-bold text-xs">{alert.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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

                  {fullHistory.filter(l => (!l.type || !['prescription_update', 'vital_update'].includes(l.type)) && (l.hgt || (l.medsTaken && l.medsTaken.length > 0) || (l.insulinDoses && Object.keys(l.insulinDoses).length > 0))).length === 0 ? (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4"><BookOpen className="text-stone-200" /></div>
                      <p className="text-stone-400 font-bold">No entries found.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sortLogsDes(fullHistory.filter(l => (!l.type || !['prescription_update', 'vital_update'].includes(l.type)) && (l.hgt || (l.medsTaken && l.medsTaken.length > 0) || (l.insulinDoses && Object.keys(l.insulinDoses).length > 0)))).map(log => {
                        const dateObj = log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000) : new Date(log.timestamp);
                        const isLocked = !canEdit(log.timestamp);
                        const isExpanded = expandedLogId === log.id;

                        return (
                          <div key={log.id} onClick={() => setExpandedLogId(isExpanded ? null : log.id)} className={`bg-stone-50 rounded-[32px] border border-stone-100 relative group animate-in slide-in-from-bottom-2 transition-all cursor-pointer ${isExpanded ? 'p-5 ring-2 ring-emerald-500/20 bg-white shadow-md' : 'p-4 hover:bg-stone-100'}`}>

                            {/* SUMMARY VIEW (Always Visible) */}
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                {/* Date Box */}
                                <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl ${isExpanded ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-stone-500'} transition-colors`}>
                                  <span className="text-[10px] font-black uppercase leading-none">{dateObj.toLocaleDateString(undefined, { month: 'short' })}</span>
                                  <span className="text-lg font-black leading-none">{dateObj.getDate()}</span>
                                </div>

                                {/* Main Value (Sugar) */}
                                <div>
                                  <div className="flex items-center gap-2">
                                    {log.hgt ? (
                                      <span className="text-xl font-black text-stone-800">{log.hgt} <span className="text-xs font-bold text-stone-400">mg/dL</span></span>
                                    ) : (
                                      <span className="text-sm font-bold text-stone-400 italic">No glucose logged</span>
                                    )}
                                  </div>
                                  <div className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                                    {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {log.mealStatus && <span>• {log.mealStatus}</span>}
                                  </div>
                                </div>
                              </div>

                              {/* Expansion Indicator */}
                              <div className={`text-stone-300 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-emerald-500' : ''}`}>
                                <ChevronDown size={20} />
                              </div>
                            </div>

                            {/* EXPANDED DETAILS (Hidden by default) */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-stone-100 space-y-2 animate-in fade-in slide-in-from-top-1">

                                {/* Meds List */}
                                {log.medsTaken && log.medsTaken.map(k => {
                                  const [id, time] = k.split('_');
                                  const med = prescription.oralMeds.find(m => m.id === id);
                                  return med ? (
                                    <div key={k} className="flex items-center gap-3 text-xs text-stone-600 py-1">
                                      <div className="w-6 flex justify-center"><Pill size={14} className="text-blue-400" /></div>
                                      <span className="font-bold text-stone-700">{med.name}</span>
                                      <span className="text-stone-400 text-[10px]">• {time}</span>
                                    </div>
                                  ) : null;
                                })}

                                {/* Insulin List */}
                                {log.insulinDoses && Object.entries(log.insulinDoses).map(([id, dose]) => {
                                  const ins = prescription.insulins.find(i => i.id === id);
                                  return ins ? (
                                    <div key={id} className="flex items-center gap-3 text-xs text-stone-600 py-1">
                                      <div className="w-6 flex justify-center"><Syringe size={14} className="text-emerald-500" /></div>
                                      <span className="font-bold text-stone-700">{ins.name}</span>
                                      <span className="bg-emerald-100 text-emerald-700 px-1.5 rounded text-[10px] font-black">{dose}u</span>
                                    </div>
                                  ) : null;
                                })}

                                {/* Tags List - Concatenated */}
                                {log.tags && log.tags.length > 0 && (
                                  <div className="flex items-center gap-3 text-xs text-stone-500 py-1">
                                    <div className="w-6 flex justify-center"><Tag size={14} className="text-stone-300" /></div>
                                    <span>{log.tags.map(t => `${TAG_EMOJIS[t] || ''} ${t}`).join(', ')}</span>
                                  </div>
                                )}

                                {/* Edit/Delete Controls (Bottom Row) */}
                                {!isCaregiverMode && (
                                  <div className="flex gap-3 justify-end mt-2 pt-2">
                                    {/* Strict Edit/Delete Window Rules */}
                                    {/* Strict Edit/Delete Window Rules */}
                                    {/* Edit Button: Active 0-30m, Disabled/Muted >30m */}
                                    <button
                                      disabled={!canEdit(log.timestamp)}
                                      onClick={(e) => { e.stopPropagation(); handleStartEdit(log); }}
                                      className={`px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1 border rounded-lg ${canEdit(log.timestamp)
                                        ? 'border-stone-200 text-stone-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50'
                                        : 'border-transparent text-stone-300 opacity-50 cursor-not-allowed'}`}
                                    >
                                      <Edit3 size={12} /> Edit
                                    </button>

                                    {/* Delete Button: Disabled/Muted 0-30m, Active >30m */}
                                    <button
                                      disabled={!canDelete(log.timestamp)}
                                      onClick={(e) => { e.stopPropagation(); handleDeleteEntry(log.id); }}
                                      className={`px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1 border rounded-lg ${canDelete(log.timestamp)
                                        ? 'border-stone-200 text-stone-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50'
                                        : 'border-transparent text-stone-300 opacity-50 cursor-not-allowed'}`}
                                    >
                                      <Trash2 size={12} /> Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            )
                            }
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          }

          {/* NAV */}
          {/* FLOATING FROSTED PILL NAVBAR */}
          <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-md bg-white/80 dark:bg-stone-900/85 backdrop-blur-xl px-4 py-3 rounded-[32px] flex justify-evenly items-center z-[100] shadow-[0_12px_40px_rgba(0,0,0,0.2)] border border-white/50 ring-1 ring-white/40">
            {[
              { id: 'diary', icon: Edit3, label: 'Diary', activeColor: 'text-emerald-800', activeBg: 'bg-emerald-100', inactiveColor: 'text-stone-400', inactiveBg: 'bg-white/70 dark:bg-stone-800/70' },
              { id: 'prescription', icon: Stethoscope, label: 'Rx', activeColor: 'text-blue-800', activeBg: 'bg-blue-100', inactiveColor: 'text-stone-400', inactiveBg: 'bg-white/70 dark:bg-stone-800/70' },
              { id: 'history', icon: FileText, label: 'Log', activeColor: 'text-amber-800', activeBg: 'bg-amber-100', inactiveColor: 'text-stone-400', inactiveBg: 'bg-white/70 dark:bg-stone-800/70' },
              { id: 'profile', icon: User, label: 'Profile', activeColor: 'text-purple-800', activeBg: 'bg-purple-100', inactiveColor: 'text-stone-400', inactiveBg: 'bg-white/70 dark:bg-stone-800/70' }
            ].map(item => {
              const isActive = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    triggerFeedback(hapticsEnabled, soundEnabled, 'light');
                    setView(item.id);
                    setActiveVital(null); // A2: Auto-collapse Deep View on nav change
                  }}
                  className={`relative group flex flex-col items-center justify-center transition-all duration-300 ${isActive ? '-translate-y-1' : 'opacity-70 hover:opacity-100'}`}
                >
                  <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center mb-1 transition-all shadow-sm backdrop-blur-sm border border-white/20 ${isActive ? item.activeBg + ' shadow-md scale-110' : item.inactiveBg}`}>
                    <item.icon size={24} className={`transition-colors ${isActive ? item.activeColor : item.inactiveColor}`} />
                  </div>
                  <span className={`text-[11px] font-bold transition-colors ${isActive ? item.activeColor : 'text-stone-400'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {
            expandedGraphData && (
              expandedGraphData && (
                <Suspense fallback={null}>
                  <ExpandedGraphModal
                    {...expandedGraphData}
                    fullHistory={fullHistory}
                    onEdit={handleStartEditVital}
                    onDelete={handleDeleteEntry}
                    onClose={() => setExpandedGraphData(null)}
                  />
                </Suspense>
              )
            )
          }

          {/* VITAL DEEP VIEW OVERLAY (Decoupled V5) */}
          {activeVital && (
            <Suspense fallback={null}>
              <VitalDeepView
                vitalType={activeVital}
                // V5: Pass strictly isolated logs
                fullHistory={getMergedVitalHistory(activeVital)}
                // UNIFY GRAPH: Pass exact same data source as Profile Graph
                graphData={getTrendData(activeVital)}
                // RESTORE: Pass calculated Est HbA1c value
                extraValue={activeVital === 'est_hba1c' ? estimatedHbA1c : null}
                onClose={() => setActiveVital(null)}
                // V5: Strict Type-Specific Save
                onSave={async (payload, timestamp, editId) => {
                  // Ensure payload has single key matching vitalType (Legacy compatibility or just value)
                  const val = Object.values(payload)[0];
                  if (activeVital === 'weight') return await weightLogs.addLog(val, timestamp);
                  if (activeVital === 'hba1c') return await hba1cLogs.addLog(val, timestamp);
                  if (activeVital === 'creatinine') return await creatinineLogs.addLog(val, timestamp);
                  return false;
                }}
                // V5: Strict Type-Specific Delete
                onDelete={async (id) => {
                  if (activeVital === 'weight') return await weightLogs.deleteLog(id);
                  if (activeVital === 'hba1c') return await hba1cLogs.deleteLog(id);
                  if (activeVital === 'creatinine') return await creatinineLogs.deleteLog(id);
                  return false;
                }}
              />
            </Suspense>
          )}

          <div className="text-center opacity-40 hover:opacity-100 transition-opacity mt-8 pb-32 pointer-events-none w-full">
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-600">© Dr Divyansh Kotak</p>
            <p className="text-[9px] text-stone-300 dark:text-stone-700 mt-1">Disclaimer: Information provided is for logging purposes only and is not medical advice.</p>
          </div>
        </div >
        {/* DELETE CONFIRMATION MODAL */}
        {deleteConfirmState && (
          <div className="fixed inset-0 z-[9999] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setDeleteConfirmState(null)}>
            <div className="bg-white dark:bg-stone-800 rounded-[24px] p-6 max-w-sm w-full shadow-2xl border border-stone-100 dark:border-stone-700 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Trash2 className="text-red-500" size={24} />
              </div>
              <h3 className="text-xl font-bold text-center text-stone-800 dark:text-stone-100 mb-2">Delete entry?</h3>
              <p className="text-stone-500 dark:text-stone-400 text-center mb-8 font-medium leading-relaxed">
                {deleteConfirmState.message}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeleteConfirmState(null)}
                  className="w-full py-4 rounded-xl font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteConfirmState.onConfirm()}
                  className="w-full py-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </SecurityGuardian >
    </GlobalRecoveryBoundary >
  );
}
