import React from 'react';
import { ArrowRight, Check, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export default function DupeCard({ dupes }) {
    if (!dupes || dupes.length === 0) return null;

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                    <Sparkles className="text-indigo-500" size={20} />
                    Smart Swaps Found!
                </h3>
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 rounded-full">
                    {dupes.length} Suggested
                </span>
            </div>

            <div className="space-y-4">
                {dupes.map((dupe, idx) => (
                    <div key={idx} className="bg-white dark:bg-card rounded-lg p-4 border border-indigo-100 dark:border-indigo-900/50 shadow-sm flex gap-4 items-center transition-transform hover:scale-[1.02]">
                        {dupe.image_url ? (
                            <img src={dupe.image_url} alt={dupe.product_name} className="w-16 h-16 object-contain rounded-md bg-white p-1 border border-gray-100" />
                        ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 text-xs text-center">No Image</div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-indigo-950 dark:text-indigo-50 truncate">{dupe.product_name}</h4>
                            <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium truncate">{dupe.brand}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                                <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">
                                    <Check size={12} /> {dupe.similarity}% Match
                                </span>
                                {dupe.is_cleaner && (
                                    <span className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                                        <ShieldCheck size={12} /> Cleaner Formula
                                    </span>
                                )}
                                {dupe.is_more_effective && (
                                    <span className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full font-bold">
                                        <Zap size={12} /> Higher Efficacy
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <button className="mt-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-sm">
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
