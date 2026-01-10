import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp, 
  onSnapshot, query, orderBy, limit, getDocs 
} from 'firebase/firestore';
import { 
  BookOpen, Settings, Edit3, Save, LogOut, Activity, Droplet, 
  User, CheckCircle2, Clock, Utensils, Syringe, FileText, Download,
  ShieldAlert, ScrollText, Printer, Info, Thermometer, Candy, Dumbbell, 
  AlertTriangle, Zap, Wine, Sandwich, Pill, PlusCircle, Trash2, XCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  <button 
    onClick={onClick}
    className={`flex-1 py-3 px-2 rounded-xl flex flex-col items-center gap-1 transition-all duration-200 border-2 ${
      selected 
      ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-md scale-95' 
      : 'bg-white border-transparent text-stone-400 hover:bg-stone-100'
    }`}
  >
    <Icon size={20} />
    <span className="text-[10px] font-bold uppercase">{label}</span>
  </button>
);

const ContextTag = ({ label, icon: Icon, selected, onClick, color }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 text-xs font-bold uppercase ${
      selected
        ? `bg-${color}-100 border-${color}-400 text-${color}-900 shadow-sm scale-95`
        : 'bg-white border-stone-200 text-stone-400 hover:border-stone-300'
    }`}
  >
    <Icon size={14} />
    {label}
  </button>
);

// --- LEGAL CONSENT SCREEN ---
const ConsentScreen = ({ onConsent }) => {
  const [agreed, setAgreed] = useState(false);

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
          <section>
            <h3 className="font-bold text-stone-800 text-lg mb-2 flex items-center gap-2">
              <Activity size={18} className="text-blue-500"/> 1. Disclaimer of Liability
            </h3>
            <p><strong>SugarDiary is NOT a medical device.</strong> It is a passive data recording tool designed for informational purposes only. It does not provide medical advice, diagnosis, or treatment.</p>
            <p className="mt-2 text-red-600 font-bold">Always consult your physician for insulin dosing and medical management.</p>
          </section>

          <section>
            <h3 className="font-bold text-stone-800 text-lg mb-2 flex items-center gap-2">
              <ScrollText size={18} className="text-emerald-500"/> 2. Data & Privacy
            </h3>
            <p>By proceeding, you explicitly consent to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Collection and storage of health data (Glucose, Insulin, Vitals).</li>
                <li>Data is restricted to your account; however, anonymized aggregates may be used for research.</li>
                <li><strong>Right to Withdraw:</strong> You may cease use at any time. Data deletion requests can be processed via settings.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-stone-800 text-lg mb-2 flex items-center gap-2">
               <ShieldAlert size={18} className="text-amber-500"/> 3. Emergency Protocol
            </h3>
            <p>This app <strong>does not monitor</strong> your health in real-time. If you experience symptoms of severe hypoglycemia (confusion, loss of consciousness) or hyperglycemia (DKA symptoms), <strong>contact emergency services immediately</strong>.</p>
          </section>
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

// --- MAIN APPLICATION ---
export default function App() {
  const [user, setUser] = useState(null);
  
  // Controlled Profile State
  const [profile, setProfile] = useState({
    age: '', weight: '', hba1c: '', creatinine: '',
    prescribedInsulins: [],
    oralMeds: [], 
    slidingScale: [], 
    instructions: '', 
    hasConsented: false
  });

  const [view, setView] = useState('diary');
  const [loading, setLoading] = useState(true);
  
  // Diary Entry States
  const [hgt, setHgt] = useState('');
  const [mealStatus, setMealStatus] = useState('Pre-Meal');
  const [insulinDoses, setInsulinDoses] = useState({});
  const [contextTags, setContextTags] = useState([]); 
  const [showSuccess, setShowSuccess] = useState(false);
  const [history, setHistory] = useState([]);
  const [fullHistory, setFullHistory] = useState([]);

  // 1. Auth & Persistence
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try { await signInWithCustomToken(auth, __initial_auth_token); } catch (err) { console.error(err); }
      }
    };
    initAuth();

    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const d = await getDoc(doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data'));
          if (d.exists()) {
            const data = d.data();
            
            // --- DATA SANITIZATION START ---
            // Ensure slidingScale is an array (handle legacy string data)
            const safeSlidingScale = Array.isArray(data.slidingScale) ? data.slidingScale : [];
            const safeOralMeds = Array.isArray(data.oralMeds) ? data.oralMeds : [];
            // --- DATA SANITIZATION END ---

            setProfile(prev => ({ 
                ...prev, 
                ...data, 
                slidingScale: safeSlidingScale, 
                oralMeds: safeOralMeds
            }));
            
            // Check Profile Completeness
            const isProfileComplete = data.age && data.weight && (data.prescribedInsulins?.length > 0 || safeOralMeds?.length > 0);
            if (!isProfileComplete) setView('profile'); 
          } else {
            setView('profile');
          }
        } catch (e) { console.error("Profile Fetch Error", e); }
      }
      setLoading(false);
    });
  }, []);

  // 2. History Listeners
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), orderBy('timestamp', 'desc'), limit(5));
    return onSnapshot(q, (s) => setHistory(s.docs.map(d => ({id: d.id, ...d.data()}))));
  }, [user]);

  useEffect(() => {
    if (!user || view !== 'history') return;
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), orderBy('timestamp', 'desc'), limit(200)); 
    const unsub = onSnapshot(q, (s) => setFullHistory(s.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => unsub();
  }, [user, view]);

  // 3. Actions
  const handleConsent = async () => {
    if (!user) return;
    setProfile(prev => ({ ...prev, hasConsented: true }));
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), { 
        hasConsented: true, 
        consentDate: serverTimestamp() 
      }, { merge: true });
    } catch (e) { 
        console.error("Consent save error", e); 
        alert("Connection error. Please retry.");
    }
  };

  const handleSaveEntry = async () => {
    if (!hgt) return alert("Please enter a sugar value.");
    
    const sugarVal = parseFloat(hgt);
    if (isNaN(sugarVal)) return alert("Invalid sugar value.");

    const dosesTaken = Object.entries(insulinDoses).reduce((acc, [k, v]) => (parseFloat(v) > 0 ? { ...acc, [k]: parseFloat(v) } : acc), {});
    
    const entryData = {
      hgt: sugarVal,
      doses: dosesTaken,
      mealStatus,
      tags: contextTags,
      timestamp: serverTimestamp(),
      schemaVersion: 4, 
      snapshot: { 
          weight: profile.weight, 
          hba1c: profile.hba1c, 
          creatinine: profile.creatinine 
      }
    };

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    
    setHgt(''); 
    setInsulinDoses({}); 
    setMealStatus('Pre-Meal'); 
    setContextTags([]);

    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), entryData);
    } catch (e) { 
        alert("Error saving data: " + e.message); 
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!user) return;

    // Strict safety: Construct data explicitly
    const dataToSave = {
      age: profile.age,
      weight: profile.weight,
      hba1c: profile.hba1c,
      creatinine: profile.creatinine,
      prescribedInsulins: profile.prescribedInsulins,
      oralMeds: profile.oralMeds || [],
      slidingScale: profile.slidingScale || [],
      instructions: profile.instructions || '',
      lastUpdated: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data'), dataToSave, { merge: true });
      alert("Profile Saved Successfully.");
      setView('diary');
    } catch (e) { 
      alert("Failed to save profile. Please check connection.");
      console.error(e);
    }
  };

  const toggleTag = (tag) => {
    if (contextTags.includes(tag)) setContextTags(contextTags.filter(t => t !== tag));
    else setContextTags([...contextTags, tag]);
  };

  // --- LOGIC ENGINE: SLIDING SCALE ---
  const getSuggestion = () => {
    if (!hgt || !Array.isArray(profile.slidingScale) || profile.slidingScale.length === 0) return null;
    const current = parseFloat(hgt);
    if (isNaN(current)) return null;

    const match = profile.slidingScale.find(rule => {
        const min = parseFloat(rule.min);
        const max = parseFloat(rule.max);
        return current >= min && current < max;
    });

    if (match) return match.units;
    return null;
  };

  // --- PDF GENERATION ---
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(5, 150, 105); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255); doc.setFontSize(22); doc.setFont("helvetica", "bold");
    doc.text("SugarDiary Patient Report", 14, 25);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Patient: ${user.displayName || 'User'}`, 14, 35);

    // 1. Vitals
    doc.setTextColor(0);
    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text("Current Vitals & Prescription", 14, 50);
    
    const oralMedsString = profile.oralMeds?.map(m => `${m.name} ${m.dose} (${m.frequency})`).join(', ') || 'None';

    autoTable(doc, {
      startY: 55,
      head: [['Metric', 'Value', 'Metric', 'Value']],
      body: [
        ['Age', `${profile.age || '-'} yrs`, 'Weight', `${profile.weight || '-'} kg`],
        ['HbA1c', `${profile.hba1c || '-'}%`, 'Creatinine', `${profile.creatinine || '-'} mg/dL`],
        ['Insulins', profile.prescribedInsulins?.join(', ') || 'None', 'Oral Meds', oralMedsString]
      ],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: 50, fontStyle: 'bold' }
    });

    let finalY = doc.lastAutoTable.finalY + 10;

    // 2. Sliding Scale (Structured)
    if (Array.isArray(profile.slidingScale) && profile.slidingScale.length > 0) {
        doc.setFontSize(14); doc.setFont("helvetica", "bold");
        doc.text("Sliding Scale Protocol", 14, finalY);
        
        const scaleRows = profile.slidingScale.map(r => [`${r.min} - ${r.max} mg/dL`, `${r.units} Units`]);
        autoTable(doc, {
            startY: finalY + 5,
            head: [['Glucose Range', 'Suggested Dosage']],
            body: scaleRows,
            theme: 'striped',
            headStyles: { fillColor: [50, 50, 50] }
        });
        finalY = doc.lastAutoTable.finalY + 10;
    }

    // 3. Trends (Logic: Track Only Changes)
    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text("Vitals Trend Analysis (Changes Only)", 14, finalY);
    
    const vitalsTrend = [];
    let lastSnap = null;
    const chronoHistory = [...fullHistory].sort((a,b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
    
    chronoHistory.forEach(log => {
      if (!log.snapshot) return;
      const snap = log.snapshot;
      const changed = !lastSnap || snap.weight !== lastSnap.weight || snap.hba1c !== lastSnap.hba1c || snap.creatinine !== lastSnap.creatinine;
      if (changed) {
        vitalsTrend.push([new Date(log.timestamp.seconds * 1000).toLocaleDateString(), snap.weight || '-', snap.hba1c || '-', snap.creatinine || '-']);
        lastSnap = snap;
      }
    });
    
    if (vitalsTrend.length > 0) {
        autoTable(doc, {
            startY: finalY + 5,
            head: [['Date Changed', 'Weight (kg)', 'HbA1c (%)', 'Creatinine']],
            body: vitalsTrend.reverse(), 
            theme: 'striped',
            headStyles: { fillColor: [100, 100, 100] }
        });
        finalY = doc.lastAutoTable.finalY + 15;
    }

    // 4. Logs
    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text("Detailed Logs", 14, finalY);
    
    const logRows = fullHistory.map(log => {
        const date = log.timestamp ? new Date(log.timestamp.seconds * 1000) : new Date();
        const doseStr = log.doses ? Object.entries(log.doses).map(([k,v]) => `${k}: ${v}u`).join(', ') : '';
        return [
            date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            `${log.hgt} mg/dL`,
            `${log.mealStatus} ${log.tags ? '[' + log.tags.join(', ') + ']' : ''}`,
            doseStr
        ];
    });

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Date/Time', 'Sugar', 'Context', 'Insulin']],
      body: logRows,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], textColor: 255 }
    });

    doc.save(`SugarDiary_${user.displayName}_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const printReport = () => window.print();

  if (loading) return <div className="h-screen flex items-center justify-center font-serif text-stone-400 italic">Opening Secure Environment...</div>;
  if (!user) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#fcfaf7]">
      <div className="text-center">
        <BookOpen className="text-emerald-600 w-16 h-16 mx-auto mb-4" />
        <h1 className="text-4xl font-serif mb-8 text-stone-800">SugarDiary</h1>
        <button onClick={() => signInWithPopup(auth, provider)} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg">Sign in with Google</button>
        <button onClick={() => signInAnonymously(auth)} className="block w-full text-stone-400 mt-4 text-sm font-bold">Guest Mode</button>
      </div>
    </div>
  );

  if (!profile.hasConsented) return <ConsentScreen onConsent={handleConsent} />;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#fffbf5] shadow-2xl relative font-sans text-stone-800 pb-32">
      {showSuccess && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"><div className="bg-white p-8 rounded-3xl shadow-xl"><CheckCircle2 className="text-emerald-500 w-16 h-16 mx-auto"/><h3 className="font-bold mt-2">Saved!</h3></div></div>}
      
      {/* Header */}
      <div className="bg-white p-6 rounded-b-[40px] shadow-sm mb-6 print:hidden">
        <div className="flex items-center gap-4 mb-4">
           {user.photoURL ? <img src={user.photoURL} className="w-12 h-12 rounded-full border-2 border-stone-100" alt="Profile"/> : <User size={32}/>}
           <div><h1 className="text-2xl font-bold text-stone-800">{user.displayName || 'Guest'}</h1>
           <p className="text-xs text-stone-400 font-bold uppercase">
             {profile.prescribedInsulins?.length > 0 ? profile.prescribedInsulins.join(', ') : 'No Insulin Rx'}
           </p></div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <StatBadge emoji="🧘‍♂️" label="Age" value={profile.age} unit="Yrs" color="blue" />
          <StatBadge emoji="🩸" label="HbA1c" value={profile.hba1c} unit="%" color="emerald" />
          <StatBadge emoji="💊" label="Oral Meds" value={profile.oralMeds?.length || 0} unit="Active" color="purple" />
          <StatBadge emoji="⚖️" label="Weight" value={profile.weight} unit="kg" color="orange" />
        </div>
      </div>

      {view === 'diary' && (
        <div className="px-6 animate-in fade-in print:hidden">
          
          {/* Instructions Display */}
          {profile.instructions && (
             <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-sm">
                <div className="flex items-center gap-2 font-bold mb-1 text-amber-700">
                  <Info size={16} /> Medical Instructions
                </div>
                <div className="whitespace-pre-wrap">{profile.instructions}</div>
             </div>
          )}

          <div className="flex gap-2 mb-6 overflow-x-auto">
            {['Fasting', 'Pre-Meal', 'Post-Meal', 'Bedtime'].map(m => <MealOption key={m} label={m} icon={Clock} selected={mealStatus === m} onClick={() => setMealStatus(m)} />)}
          </div>
          
          {/* Sugar Input Block */}
          <div className="bg-emerald-50 p-6 rounded-[32px] border border-emerald-100 shadow-sm mb-6 relative">
            {/* SAFETY ALERTS - FIXED SYNTAX */}
            {hgt && parseInt(hgt) < 60 && (
              <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 text-center text-xs font-bold rounded-t-[32px] animate-pulse flex items-center justify-center gap-2">
                <AlertTriangle size={14}/> LOW SUGAR (&lt;60)! TAKE SUGAR
              </div>
            )}
            {hgt && parseInt(hgt) > 250 && (
              <div className="absolute top-0 left-0 right-0 bg-orange-500 text-white p-2 text-center text-xs font-bold rounded-t-[32px] flex items-center justify-center gap-2">
                <AlertTriangle size={14}/> HIGH (&gt;250)! CHECK KETONES / CONSULT
              </div>
            )}

            <label className="text-xs font-bold text-emerald-800 uppercase block mb-1 mt-2">Blood Sugar</label>
            <div className="flex items-baseline gap-2">
              <input type="number" value={hgt} onChange={e => setHgt(e.target.value)} className="text-7xl font-bold w-full bg-transparent outline-none text-emerald-900" placeholder="---" />
              <span className="text-emerald-600 font-bold text-lg">mg/dL</span>
            </div>
            
            {/* Sliding Scale Automated Suggestion */}
            {getSuggestion() && (
               <div className="mt-2 bg-stone-200 p-2 rounded-xl text-stone-700 text-xs font-bold flex items-center gap-2 border border-stone-300">
                 <Zap size={14} className="fill-current text-amber-500" /> 
                 Scale Suggestion: {getSuggestion()} units
               </div>
            )}
          </div>

          {/* Context Tags - Expanded for Safety */}
          <div className="mb-6">
             <label className="text-xs font-bold text-stone-400 uppercase ml-2 mb-2 block">Deviation Factors</label>
             <div className="flex flex-wrap gap-2">
                <ContextTag label="Sick" icon={Thermometer} color="red" selected={contextTags.includes('Sick')} onClick={() => toggleTag('Sick')} />
                <ContextTag label="Sweets" icon={Candy} color="pink" selected={contextTags.includes('Sweets')} onClick={() => toggleTag('Sweets')} />
                <ContextTag label="Heavy Meal" icon={Utensils} color="orange" selected={contextTags.includes('Heavy Meal')} onClick={() => toggleTag('Heavy Meal')} />
                <ContextTag label="Exercise" icon={Dumbbell} color="blue" selected={contextTags.includes('Exercise')} onClick={() => toggleTag('Exercise')} />
                <ContextTag label="Missed Dose" icon={XCircle} color="red" selected={contextTags.includes('Missed Dose')} onClick={() => toggleTag('Missed Dose')} />
                <ContextTag label="Travel/Sleep" icon={PlaneIcon} color="gray" selected={contextTags.includes('Travel')} onClick={() => toggleTag('Travel')} />
             </div>
          </div>

          <div className="space-y-3">
             <label className="text-xs font-bold text-stone-400 uppercase ml-2 block">Insulin Administered</label>
             {profile.prescribedInsulins?.map(type => (
               <div key={type} className="bg-white p-4 rounded-2xl border border-blue-50 flex justify-between items-center">
                 <span className="font-bold text-stone-700">{type}</span>
                 <input type="number" className="w-16 bg-stone-50 rounded-lg p-2 text-xl font-bold text-right" placeholder="0" 
                   value={insulinDoses[type] || ''} onChange={e => setInsulinDoses({...insulinDoses, [type]: e.target.value})} />
               </div>
             ))}
             {!profile.prescribedInsulins?.length && <div className="p-4 border-2 border-dashed text-center rounded-xl text-stone-400 text-sm">No insulin types configured in Profile</div>}
          </div>
          <button onClick={handleSaveEntry} className="w-full bg-stone-900 text-white py-5 rounded-[24px] font-bold text-xl shadow-xl mt-6 flex justify-center gap-2"><Save /> Save Entry</button>
        </div>
      )}

      {view === 'history' && (
        <div className="px-6 animate-in slide-in-from-right">
           <header className="flex justify-between items-center mb-6 print:hidden">
             <h2 className="text-3xl font-serif text-stone-800">My Data</h2>
             <div className="flex gap-2">
               <button onClick={generatePDF} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-3 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors"><Download size={18} /> PDF</button>
               <button onClick={printReport} className="bg-stone-200 text-stone-600 px-3 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm"><Printer size={18} /> Print</button>
             </div>
           </header>
           
           <div className="space-y-3 pb-24">
             {/* Print View Header */}
             <div className="hidden print:block mb-8">
                <h1 className="text-3xl font-bold">Diabetes Report</h1>
                <p>Patient: {user.displayName} | Age: {profile.age}</p>
             </div>

             {fullHistory.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex justify-between print:border-b print:border-stone-300 print:rounded-none">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-emerald-700">{item.hgt} <span className="text-sm">mg/dL</span></span>
                      <span className="text-[10px] font-bold bg-stone-100 text-stone-500 px-2 py-1 rounded-lg uppercase">{item.mealStatus}</span>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {item.tags.map(tag => <span key={tag} className="text-[8px] bg-stone-200 px-1 rounded">{tag}</span>)}
                        </div>
                       )}
                    </div>
                    <div className="text-xs text-stone-400">{new Date(item.timestamp?.seconds * 1000).toLocaleString()}</div>
                  </div>
                  <div className="text-right font-bold text-blue-600">{item.doses ? JSON.stringify(item.doses).replace(/[{"}]/g, '').replace(/:/g, ': ') : '-'}</div>
                </div>
              ))}
           </div>
        </div>
      )}

      {view === 'profile' && (
        <div className="p-6 print:hidden pb-32">
          <form onSubmit={handleProfileSave} className="bg-white p-6 rounded-[32px] space-y-6">
             <h2 className="text-2xl font-serif font-bold text-stone-800">Medical Profile</h2>

             {/* 1. Basic Vitals (Controlled Inputs) */}
             <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Age" value={profile.age} onChange={e => setProfile({...profile, age: e.target.value})} className="bg-stone-50 p-4 rounded-xl font-bold w-full" required/>
                    <input type="number" placeholder="Weight (kg)" value={profile.weight} onChange={e => setProfile({...profile, weight: e.target.value})} className="bg-stone-50 p-4 rounded-xl font-bold w-full" required/>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <input type="number" step="0.1" placeholder="HbA1c %" value={profile.hba1c} onChange={e => setProfile({...profile, hba1c: e.target.value})} className="bg-stone-50 p-4 rounded-xl font-bold w-full" required/>
                    <input type="number" step="0.1" placeholder="Creatinine" value={profile.creatinine} onChange={e => setProfile({...profile, creatinine: e.target.value})} className="bg-stone-50 p-4 rounded-xl font-bold w-full" required/>
                 </div>
             </div>

             <hr className="border-stone-100"/>

             {/* 2. Oral Medications (Dynamic List) */}
             <div>
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 flex items-center gap-2"><Pill size={14}/> Oral Medications</label>
                {Array.isArray(profile.oralMeds) && profile.oralMeds.map((med, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                        <input placeholder="Name" value={med.name} onChange={e => {
                            const newMeds = [...profile.oralMeds]; newMeds[idx].name = e.target.value; setProfile({...profile, oralMeds: newMeds});
                        }} className="bg-stone-50 p-2 rounded-lg text-sm w-full font-bold" />
                        <input placeholder="Dose" value={med.dose} onChange={e => {
                            const newMeds = [...profile.oralMeds]; newMeds[idx].dose = e.target.value; setProfile({...profile, oralMeds: newMeds});
                        }} className="bg-stone-50 p-2 rounded-lg text-sm w-20" />
                        <button type="button" onClick={() => {
                            setProfile({...profile, oralMeds: profile.oralMeds.filter((_, i) => i !== idx)});
                        }} className="text-red-400"><Trash2 size={18}/></button>
                    </div>
                ))}
                <button type="button" onClick={() => {
                    const currentMeds = Array.isArray(profile.oralMeds) ? profile.oralMeds : [];
                    setProfile({...profile, oralMeds: [...currentMeds, {name: '', dose: '', frequency: ''}]})
                }} className="text-xs font-bold text-blue-600 flex items-center gap-1">+ Add Medication</button>
             </div>

             <hr className="border-stone-100"/>

             {/* 3. Insulin Config */}
             <div className="space-y-2">
                <label className="font-bold text-stone-400 text-xs uppercase flex items-center gap-2"><Syringe size={14}/> Insulin Types</label>
                <div className="grid grid-cols-2 gap-2">
                    {['Rapid', 'Regular', 'NPH', 'Basal', 'Mix 70/30'].map(t => (
                    <label key={t} className={`flex items-center gap-2 p-3 rounded-xl border ${profile.prescribedInsulins.includes(t) ? 'bg-blue-50 border-blue-200' : 'bg-stone-50 border-transparent'}`}>
                        <input type="checkbox" checked={profile.prescribedInsulins.includes(t)} 
                        onChange={e => {
                            const newRx = e.target.checked 
                                ? [...profile.prescribedInsulins, t]
                                : profile.prescribedInsulins.filter(i => i !== t);
                            setProfile({...profile, prescribedInsulins: newRx});
                        }} className="w-5 h-5 accent-emerald-600"/>
                        <span className="font-bold text-sm">{t}</span>
                    </label>
                    ))}
                </div>
             </div>

             <hr className="border-stone-100"/>

             {/* 4. Structured Sliding Scale */}
             <div>
                <label className="text-xs font-bold text-stone-400 uppercase mb-2 flex items-center gap-2"><Zap size={14}/> Sliding Scale Logic</label>
                <div className="bg-stone-50 p-4 rounded-xl">
                    <div className="flex text-[10px] text-stone-400 font-bold uppercase mb-2">
                        <span className="flex-1">Min Sugar</span>
                        <span className="flex-1">Max Sugar</span>
                        <span className="w-16">Units</span>
                        <span className="w-8"></span>
                    </div>
                    {Array.isArray(profile.slidingScale) && profile.slidingScale.map((row, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                             <input type="number" value={row.min} placeholder="150" onChange={e => {
                                 const newScale = [...profile.slidingScale]; newScale[idx].min = e.target.value; setProfile({...profile, slidingScale: newScale});
                             }} className="flex-1 p-2 rounded border border-stone-200 text-sm font-bold"/>
                             <input type="number" value={row.max} placeholder="200" onChange={e => {
                                 const newScale = [...profile.slidingScale]; newScale[idx].max = e.target.value; setProfile({...profile, slidingScale: newScale});
                             }} className="flex-1 p-2 rounded border border-stone-200 text-sm font-bold"/>
                             <input type="number" value={row.units} placeholder="2" onChange={e => {
                                 const newScale = [...profile.slidingScale]; newScale[idx].units = e.target.value; setProfile({...profile, slidingScale: newScale});
                             }} className="w-16 p-2 rounded border border-stone-200 text-sm font-bold"/>
                             <button type="button" onClick={() => {
                                 setProfile({...profile, slidingScale: profile.slidingScale.filter((_, i) => i !== idx)});
                             }} className="text-stone-400 hover:text-red-500"><XCircle size={16}/></button>
                        </div>
                    ))}
                    <button type="button" onClick={() => {
                         const currentScale = Array.isArray(profile.slidingScale) ? profile.slidingScale : [];
                         setProfile({...profile, slidingScale: [...currentScale, {min: '', max: '', units: ''}]})
                    }} className="mt-2 text-xs bg-stone-200 px-3 py-2 rounded-lg font-bold text-stone-600">+ Add Rule</button>
                </div>
             </div>

             {/* 5. Doctor's Instructions (Text Blob) */}
             <div>
                 <label className="text-xs font-bold text-stone-400 uppercase mb-2">Notes / Other Instructions</label>
                 <textarea 
                    value={profile.instructions} 
                    onChange={e => setProfile({...profile, instructions: e.target.value})}
                    placeholder="Doctor's specific notes..."
                    className="w-full bg-stone-50 p-3 rounded-xl text-sm min-h-[80px] outline-none"
                 ></textarea>
             </div>

             <button className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg">Save Profile</button>
             <button type="button" onClick={() => signOut(auth)} className="w-full text-red-400 py-2 font-bold text-sm">Sign Out</button>
          </form>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md p-4 flex justify-around border-t z-50 print:hidden">
        <button onClick={() => setView('diary')}><Edit3 size={24} className={view === 'diary' ? "text-stone-900" : "text-stone-400"}/></button>
        <button onClick={() => setView('history')}><FileText size={24} className={view === 'history' ? "text-stone-900" : "text-stone-400"}/></button>
        <button onClick={() => setView('profile')}><Settings size={24} className={view === 'profile' ? "text-stone-900" : "text-stone-400"}/></button>
      </nav>
    </div>
  );
}

// Simple Icon fallback for Travel
const PlaneIcon = ({size, className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12h20"/><path d="M13 5l7 7-7 7"/></svg>
);
