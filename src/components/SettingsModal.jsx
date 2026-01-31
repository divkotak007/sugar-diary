import React from 'react';
import { Settings, X, Sun, Moon, Zap, Smartphone, Volume2, Lock, Trash2 } from 'lucide-react';
import { feedback } from '../utils/feedback';

const SettingsModal = ({ isOpen, onClose, compliance, onShare, profile, onSoftDelete, darkMode, setDarkMode, isHighContrast, setIsHighContrast, hapticsEnabled, setHapticsEnabled, soundEnabled, setSoundEnabled }) => {
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
                            <button onClick={() => { feedback.trigger(hapticsEnabled, soundEnabled, 'light'); setDarkMode(!darkMode); }} className={`w-14 h-8 rounded-full transition-all relative flex items-center px-1 ${darkMode ? 'bg-emerald-500' : 'bg-stone-300'}`}>
                                <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${darkMode ? 'translate-x-[24px]' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-1 border-t border-stone-50 dark:border-stone-800 pt-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isHighContrast ? 'bg-blue-100 text-blue-600' : 'bg-stone-100 text-stone-400'}`}><Zap size={18} /></div>
                                <span className="font-bold text-stone-700 dark:text-stone-300">High Contrast</span>
                            </div>
                            <button onClick={() => { feedback.trigger(hapticsEnabled, soundEnabled, 'light'); setIsHighContrast(!isHighContrast); }} className={`w-14 h-8 rounded-full transition-all relative flex items-center px-1 ${isHighContrast ? 'bg-blue-500' : 'bg-stone-300'}`}>
                                <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${isHighContrast ? 'translate-x-[24px]' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-1 border-t border-stone-50 dark:border-stone-800 pt-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${hapticsEnabled ? 'bg-purple-100 text-purple-600' : 'bg-stone-100 text-stone-400'}`}><Smartphone size={18} /></div>
                                <span className="font-bold text-stone-700 dark:text-stone-300">Haptics</span>
                            </div>
                            <button onClick={() => { feedback.trigger(hapticsEnabled, soundEnabled, 'light'); setHapticsEnabled(!hapticsEnabled); }} className={`w-14 h-8 rounded-full transition-all relative flex items-center px-1 ${hapticsEnabled ? 'bg-emerald-500' : 'bg-stone-300'}`}>
                                <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${hapticsEnabled ? 'translate-x-[24px]' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-1 border-t border-stone-50 dark:border-stone-800 pt-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${soundEnabled ? 'bg-pink-100 text-pink-600' : 'bg-stone-100 text-stone-400'}`}><Volume2 size={18} /></div>
                                <span className="font-bold text-stone-700 dark:text-stone-300">Sound Effects</span>
                            </div>
                            <button onClick={() => { feedback.trigger(hapticsEnabled, soundEnabled, 'light'); setSoundEnabled(!soundEnabled); }} className={`w-14 h-8 rounded-full transition-all relative flex items-center px-1 ${soundEnabled ? 'bg-emerald-500' : 'bg-stone-300'}`}>
                                <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${soundEnabled ? 'translate-x-[24px]' : 'translate-x-0'}`} />
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

export default SettingsModal;
