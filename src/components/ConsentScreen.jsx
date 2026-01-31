import React, { useState } from 'react';
import { ShieldAlert, Activity, ScrollText, Shield } from 'lucide-react';
import { TERMS_AND_CONDITIONS } from '../data/terms';

const ConsentScreen = ({ onConsent }) => {
    const [agreed, setAgreed] = useState(false);
    // PRELOADED TERMS
    const termsData = TERMS_AND_CONDITIONS;
    const loading = false;

    const iconMap = { Activity, ScrollText, ShieldAlert, Shield }; // Added Shield just in case
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

export default ConsentScreen;
