/**
 * ConsentScreen Component
 * Medico-legal consent and terms acceptance screen
 * Must be accepted before using the app
 */

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, ScrollText } from 'lucide-react';

/**
 * ConsentScreen - Legal disclaimer and consent collection
 * @param {function} onConsent - Callback when user agrees to terms
 */
const ConsentScreen = ({ onConsent }) => {
    const [agreed, setAgreed] = useState(false);
    const [termsData, setTermsData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load terms and conditions
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

    // Icon mapping for sections
    const iconMap = {
        Activity,
        ScrollText,
        ShieldAlert
    };

    // Render content with bold formatting
    const renderContent = (content) => {
        if (!content) return null;
        return content.map((part, idx) => (
            <span key={idx} className={part.bold ? "font-bold" : ""}>
                {part.text}
            </span>
        ));
    };

    return (
        <div className="min-h-screen bg-stone-100 p-6 flex items-center justify-center font-sans">
            <div className="bg-white max-w-lg w-full rounded-[32px] shadow-2xl overflow-hidden border border-stone-200">
                {/* Header */}
                <div className="bg-stone-900 p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldAlert className="text-amber-400" size={32} />
                        <h1 className="text-2xl font-serif font-bold">Medico-Legal Notice</h1>
                    </div>
                    <p className="text-stone-400 text-sm">
                        Mandatory review required before use.
                    </p>
                </div>

                {/* Terms Content - Scrollable */}
                <div className="p-8 h-96 overflow-y-auto space-y-6 text-stone-600 text-base leading-relaxed border-b border-stone-100">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center text-stone-400 italic">
                                Loading terms...
                            </div>
                        </div>
                    ) : termsData ? (
                        termsData.sections.map((section) => {
                            const Icon = iconMap[section.header?.icon];
                            return (
                                <section key={section.id} className="mb-6">
                                    <h3 className="font-bold text-stone-800 text-lg mb-3 flex items-center gap-2">
                                        {Icon && <Icon size={18} className={section.header?.colorClass} />}
                                        {section.header?.text}
                                    </h3>
                                    {section.blocks?.map((block, bIdx) => {
                                        if (block.type === 'paragraph') {
                                            return (
                                                <p key={bIdx} className="mb-3">
                                                    {renderContent(block.content)}
                                                </p>
                                            );
                                        }
                                        if (block.type === 'alert_paragraph') {
                                            return (
                                                <p key={bIdx} className="mt-2 text-red-600 font-bold bg-red-50 p-3 rounded-lg">
                                                    {renderContent(block.content)}
                                                </p>
                                            );
                                        }
                                        if (block.type === 'list') {
                                            return (
                                                <ul key={bIdx} className="list-disc pl-6 space-y-2 mt-3">
                                                    {block.items?.map((item, iIdx) => (
                                                        <li key={iIdx}>
                                                            {renderContent(item.content)}
                                                        </li>
                                                    ))}
                                                </ul>
                                            );
                                        }
                                        return null;
                                    })}
                                </section>
                            );
                        })
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-red-500 text-center">
                                <p className="font-bold mb-2">Failed to load terms.</p>
                                <p className="text-sm">Please refresh the page to try again.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Agreement Section */}
                <div className="p-6 bg-stone-50">
                    {/* Checkbox Label - Large touch target */}
                    <label
                        className="flex items-start gap-4 cursor-pointer mb-6 p-4 bg-white rounded-xl border border-stone-200 transition-colors hover:border-emerald-200 min-h-[64px]"
                    >
                        <input
                            type="checkbox"
                            className="mt-1 w-6 h-6 accent-blue-600"
                            checked={agreed}
                            onChange={e => setAgreed(e.target.checked)}
                            aria-label="I agree to the terms and conditions"
                        />
                        <span className="text-stone-700 font-medium text-base">
                            I have read and understood the Legal Disclaimer, Research Consent, and Safety Protocols.
                        </span>
                    </label>

                    {/* Continue Button - Large touch target */}
                    <button
                        onClick={onConsent}
                        disabled={!agreed}
                        className={`w-full py-5 rounded-2xl font-bold text-lg shadow-lg transition-all min-h-[60px] ${agreed
                                ? 'bg-stone-900 text-white active:scale-95 hover:bg-stone-800'
                                : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                            }`}
                        aria-label={agreed ? "Proceed to app" : "You must agree to terms first"}
                    >
                        I Agree & Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConsentScreen;
