import React from 'react';
import { Lock, Unlock, Activity, Baby, Calendar, Database, ChevronRight, Trash2, Clock, TrendingUp } from 'lucide-react';

export const TestProfile = ({ view, profile, unlockPersonal, setUnlockPersonal, vitalsForm, setVitalsForm, calculateAge, unlockComorbidities, setProfile, setUnlockComorbidities, vitalsLogTime, setVitalsLogTime, editingLog, isCaregiverMode, handleSaveProfile, setEditingLog, triggerHaptic, handleSeedDatabase, handleShareLink, T, handleSoftDelete, remindersEnabled, requestNotificationPermission, scheduleDemoReminder, getTrendData, setExpandedGraphData, expandedGraphData }) => {
    return (
        <>
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
                    </div>


                    <div className="flex justify-between items-center mb-4 mt-8">
                        <h3 className="font-bold text-stone-400 text-xs uppercase flex items-center gap-2"><TrendingUp size={12} /> Vital Trends</h3>
                    </div>
                    {/* Vertical Stack for Small Charts */}
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
                </div>
            )}
        </>
    );
};
