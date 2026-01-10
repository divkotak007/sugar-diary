import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp, 
  onSnapshot, query, orderBy, limit, getDocs 
} from 'firebase/firestore';
import { 
  BookOpen, Settings, Edit3, Save, LogOut, ChevronRight, Activity, Droplet, 
  User, CheckCircle2, Clock, Utensils, Moon, Syringe, FileText, Download,
  ShieldAlert, ScrollText
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- CONFIGURATION ---
// ✅ YOUR REAL KEYS ARE NOW INSERTED HERE
const firebaseConfig = {
  apiKey: "AIzaSyAAmGSRYXVfTL9iDNPPf7vtvGeIsna4MiI",
  authDomain: "sugerdiary.firebaseapp.com",
  projectId: "sugerdiary",
  storageBucket: "sugerdiary.firebasestorage.app",
  messagingSenderId: "467564721006",
  appId: "1:467564721006:web:bf4720ad00e356c841477f",
  measurementId: "G-YKKD6WVKD8"
};

// Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

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

// --- LEGAL CONSENT SCREEN ---
const ConsentScreen = ({ onConsent }) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen bg-stone-100 p-6 flex items-center justify-center font-sans">
      <div className="bg-white max-w-lg w-full rounded-[32px] shadow-2xl overflow-hidden border border-stone-200">
        <div className="bg-stone-900 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="text-amber-400" size={32} />
            <h1 className="text-2xl font-serif font-bold">Important Notice</h1>
          </div>
          <p className="text-stone-400 text-sm">Please read carefully before proceeding.</p>
        </div>
        
        <div className="p-8 h-80 overflow-y-auto space-y-6 text-stone-600 text-sm leading-relaxed border-b border-stone-100">
          <section>
            <h3 className="font-bold text-stone-800 text-lg mb-2 flex items-center gap-2">
              <Activity size={18} className="text-blue-500"/> Not a Medical Device
            </h3>
            <p>SugarDiary is a <strong>data recording tool</strong>. It does NOT provide medical advice. Never disregard professional advice because of this app.</p>
          </section>
          <section>
            <h3 className="font-bold text-stone-800 text-lg mb-2 flex items-center gap-2">
              <ScrollText size={18} className="text-emerald-500"/> Research Consent
            </h3>
            <p className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              <strong>Agreement:</strong> You agree that your <strong>anonymized</strong> data may be used for research and AI training to improve diabetes technology.
            </p>
          </section>
          <section>
            <h3 className="font-bold text-stone-800 text-lg mb-2">Emergency</h3>
            <p>If you have severe symptoms, <strong>call emergency services immediately</strong>.</p>
          </section>
        </div>

        <div className="p-6 bg-stone-50">
          <label className="flex items-start gap-4 cursor-pointer mb-6 p-4 bg-white rounded-xl border border-stone-200">
            <input type="checkbox" className="mt-1 w-6 h-6 accent-blue-600" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
            <span className="text-stone-700 font-medium">I agree to the Terms & Research Consent.</span>
          </label>
          <button onClick={onConsent} disabled={!agreed} className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg ${agreed ? 'bg-stone-900 text-white active:scale-95' : 'bg-stone-300 text-stone-500'}`}>
            I Agree & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({}); 
  const [view, setView] = useState('diary');
  const [loading, setLoading] = useState(true);
  const [consented, setConsented] = useState(false);
  
  // Data States
  const [hgt, setHgt] = useState('');
  const [mealStatus, setMealStatus] = useState('Pre-Meal');
  const [insulinDoses, setInsulinDoses] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [history, setHistory] = useState([]);
  const [fullHistory, setFullHistory] = useState([]);

  // 1. Auth & Persistence
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const d = await getDoc(doc(db, "users", u.uid));
          if (d.exists()) {
            const data = d.data();
            setProfile(data);
            if (data.hasConsented) setConsented(true);
          } else {
            setView('profile');
          }
        } catch (e) { console.error(e); }
      }
      setLoading(false);
    });
  }, []);

  // 2. Real-time Recent History
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "logs"), orderBy('timestamp', 'desc'), limit(5));
    return onSnapshot(q, (s) => setHistory(s.docs.map(d => ({id: d.id, ...d.data()}))));
  }, [user]);

  // 3. Full History for Data Tab
  useEffect(() => {
    if (!user || view !== 'history') return;
    const q = query(collection(db, "users", user.uid, "logs"), orderBy('timestamp', 'desc'), limit(50));
    const unsub = onSnapshot(q, (s) => setFullHistory(s.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => unsub();
  }, [user, view]);

  // 4. Actions
  const handleConsent = async () => {
    if (!user) return;
    setConsented(true); // Optimistic Update
    try {
      await setDoc(doc(db, "users", user.uid), { hasConsented: true, consentDate: serverTimestamp() }, { merge: true });
    } catch (e) { console.error("Consent save background error", e); }
  };

  const handleSaveEntry = async () => {
    if (!hgt) return alert("Please enter a sugar value.");

    const dosesTaken = Object.entries(insulinDoses).reduce((acc, [k, v]) => (parseFloat(v) > 0 ? { ...acc, [k]: parseFloat(v) } : acc), {});
    const entryData = {
      hgt: parseFloat(hgt),
      doses: dosesTaken,
      mealStatus,
      timestamp: serverTimestamp(),
      schemaVersion: 2,
      snapshot: { weight: profile.weight, hba1c: profile.hba1c, age: profile.age }
    };

    setHgt(''); setInsulinDoses({}); setMealStatus('Pre-Meal');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    try {
      await addDoc(collection(db, "users", user.uid, "logs"), entryData);
    } catch (e) { alert("Saved locally (Offline)."); }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const selectedInsulins = ['Rapid', 'Regular', 'NPH', 'Basal', 'Mix 70/30'].filter(t => fd.get(`ins_${t}`));
    const data = {
      age: fd.get('age'), weight: fd.get('weight'), hba1c: fd.get('hba1c'),
      creatinine: fd.get('creatinine'), prescribedInsulins: selectedInsulins,
      lastUpdated: new Date().toISOString()
    };

    setProfile(prev => ({...prev, ...data})); 
    setView('diary');

    try {
      await setDoc(doc(db, "users", user.uid), data, { merge: true });
    } catch (e) { alert("Profile saved locally (Offline)."); }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(5, 150, 105); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255); doc.setFontSize(22); doc.text("SugarDiary Report", 14, 25);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35);
    
    doc.setTextColor(0);
    autoTable(doc, {
      startY: 45,
      head: [['Patient', 'Age', 'Weight', 'HbA1c']],
      body: [[user.displayName, profile.age, `${profile.weight}kg`, `${profile.hba1c}%`]],
    });

    const rows = fullHistory.map(log => [
      log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : '-',
      `${log.hgt} mg/dL`,
      log.mealStatus,
      log.doses ? JSON.stringify(log.doses).replace(/[{"}]/g, '').replace(/:/g, ': ') : '-'
    ]);

    autoTable(doc, { startY: doc.lastAutoTable.finalY + 10, head: [['Date', 'Sugar', 'Context', 'Insulin']], body: rows });
    doc.save('SugarDiary_Report.pdf');
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-serif text-stone-400 italic">Opening...</div>;

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#fcfaf7]">
      <div className="text-center">
        <BookOpen className="text-emerald-600 w-16 h-16 mx-auto mb-4" />
        <h1 className="text-4xl font-serif mb-8 text-stone-800">SugarDiary</h1>
        <button onClick={() => signInWithPopup(auth, provider)} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg">Sign in with Google</button>
      </div>
    </div>
  );
  
  if (!consented) return <ConsentScreen onConsent={handleConsent} />;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#fffbf5] shadow-2xl relative font-sans text-stone-800 pb-32">
      {showSuccess && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"><div className="bg-white p-8 rounded-3xl shadow-xl"><CheckCircle2 className="text-emerald-500 w-16 h-16 mx-auto"/><h3 className="font-bold mt-2">Saved!</h3></div></div>}
      
      {/* Header */}
      <div className="bg-white p-6 rounded-b-[40px] shadow-sm mb-6">
        <div className="flex items-center gap-4 mb-4">
           {user.photoURL ? <img src={user.photoURL} className="w-12 h-12 rounded-full border-2 border-stone-100" /> : <User size={32}/>}
           <div><h1 className="text-2xl font-bold text-stone-800">{user.displayName}</h1><p className="text-xs text-stone-400 font-bold uppercase">{profile.prescribedInsulins?.join(', ') || 'No Rx'}</p></div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <StatBadge emoji="🧘‍♂️" label="Age" value={profile.age} unit="Yrs" color="blue" />
          <StatBadge emoji="🩸" label="HbA1c" value={profile.hba1c} unit="%" color="emerald" />
          <StatBadge emoji="🧪" label="Creat" value={profile.creatinine} unit="mg/dL" color="purple" />
          <StatBadge emoji="⚖️" label="Weight" value={profile.weight} unit="kg" color="orange" />
        </div>
      </div>

      {view === 'diary' && (
        <div className="px-6 animate-in fade-in">
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {['Fasting', 'Pre-Meal', 'Post-Meal', 'Bedtime'].map(m => <MealOption key={m} label={m} icon={Clock} selected={mealStatus === m} onClick={() => setMealStatus(m)} />)}
          </div>
          <div className="bg-emerald-50 p-6 rounded-[32px] border border-emerald-100 shadow-sm mb-6">
            <label className="text-xs font-bold text-emerald-800 uppercase block mb-1">Blood Sugar</label>
            <div className="flex items-baseline gap-2">
              <input type="number" value={hgt} onChange={e => setHgt(e.target.value)} className="text-7xl font-bold w-full bg-transparent outline-none text-emerald-900" placeholder="---" />
              <span className="text-emerald-600 font-bold text-lg">mg/dL</span>
            </div>
          </div>
          <div className="space-y-3">
             {profile.prescribedInsulins?.map(type => (
               <div key={type} className="bg-white p-4 rounded-2xl border border-blue-50 flex justify-between items-center">
                 <span className="font-bold text-stone-700">{type}</span>
                 <input type="number" className="w-16 bg-stone-50 rounded-lg p-2 text-xl font-bold text-right" placeholder="0" 
                   value={insulinDoses[type] || ''} onChange={e => setInsulinDoses({...insulinDoses, [type]: e.target.value})} />
               </div>
             ))}
             {!profile.prescribedInsulins?.length && <div onClick={()=>setView('profile')} className="p-4 border-2 border-dashed text-center rounded-xl text-stone-400">Tap to set insulin type</div>}
          </div>
          <button onClick={saveEntry} className="w-full bg-stone-900 text-white py-5 rounded-[24px] font-bold text-xl shadow-xl mt-6 flex justify-center gap-2"><Save /> Save Entry</button>
        </div>
      )}

      {view === 'history' && (
        <div className="px-6 animate-in slide-in-from-right">
           <header className="flex justify-between items-center mb-6">
             <h2 className="text-3xl font-serif text-stone-800">My Data</h2>
             <button onClick={generatePDF} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors"><Download size={18} /> PDF</button>
           </header>
           <div className="space-y-3 pb-24">
             {fullHistory.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex justify-between">
                  <div>
                    <div className="text-xl font-bold text-emerald-700">{item.hgt} <span className="text-sm">mg/dL</span></div>
                    <div className="text-xs text-stone-400">{new Date(item.timestamp?.seconds * 1000).toLocaleString()}</div>
                  </div>
                  <div className="text-right font-bold text-blue-600">{JSON.stringify(item.doses).replace(/[{"}]/g, '').replace(/:/g, ': ')}</div>
                </div>
              ))}
           </div>
        </div>
      )}

      {view === 'profile' && (
        <div className="p-6">
          <form onSubmit={handleProfileSave} className="bg-white p-6 rounded-[32px] space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <input name="age" type="number" placeholder="Age" defaultValue={profile.age} className="bg-stone-50 p-4 rounded-xl font-bold w-full" required/>
               <input name="weight" type="number" placeholder="Weight" defaultValue={profile.weight} className="bg-stone-50 p-4 rounded-xl font-bold w-full" required/>
             </div>
             <input name="hba1c" type="number" step="0.1" placeholder="HbA1c" defaultValue={profile.hba1c} className="bg-stone-50 p-4 rounded-xl font-bold w-full" required/>
             <input name="creatinine" type="number" step="0.1" placeholder="Creatinine" defaultValue={profile.creatinine} className="bg-stone-50 p-4 rounded-xl font-bold w-full" required/>
             <div className="space-y-2">
                <label className="font-bold text-stone-400 text-xs uppercase">Insulin Types</label>
                {['Rapid', 'Regular', 'NPH', 'Basal', 'Mix 70/30'].map(t => (
                  <label key={t} className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl">
                    <input type="checkbox" name={`ins_${t}`} defaultChecked={profile.prescribedInsulins?.includes(t)} className="w-5 h-5 accent-emerald-600"/>
                    <span className="font-bold">{t}</span>
                  </label>
                ))}
             </div>
             <button className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold">Save Profile</button>
             <button type="button" onClick={() => signOut(auth)} className="w-full text-red-400 py-2 font-bold">Sign Out</button>
          </form>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md p-4 flex justify-around border-t z-50">
        <button onClick={() => setView('diary')}><Edit3 size={24} className={view === 'diary' ? "text-stone-900" : "text-stone-400"}/></button>
        <button onClick={() => setView('history')}><FileText size={24} className={view === 'history' ? "text-stone-900" : "text-stone-400"}/></button>
        <button onClick={() => setView('profile')}><Settings size={24} className={view === 'profile' ? "text-stone-900" : "text-stone-400"}/></button>
      </nav>
    </div>
  );
}
