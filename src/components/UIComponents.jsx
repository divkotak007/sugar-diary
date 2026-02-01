import React from 'react';

const StatBadge = ({ emoji, label, value, unit, color, onClick }) => (
    <button onClick={() => { if (onClick) onClick(); }} className={`flex-shrink-0 p-4 rounded-2xl border-2 flex flex-col items-center min-w-[85px] transition-all relative bg-white dark:bg-stone-800 border-stone-100 dark:border-stone-700 hover:border-stone-200 dark:hover:border-stone-600`}>
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

const ContextTag = ({ label, icon: Icon, selected, onClick, color = 'stone' }) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 text-[10px] font-bold uppercase touch-manipulation ${selected ? `bg-${color}-100 dark:bg-${color}-900/40 border-${color}-400 text-${color}-900 dark:text-${color}-400 shadow-sm scale-95 ring-1 ring-${color}-200 dark:ring-${color}-900` : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 hover:border-stone-300'}`}>
        <Icon size={14} /> {label}
    </button>
);

export { StatBadge, MealOption, ContextTag };
