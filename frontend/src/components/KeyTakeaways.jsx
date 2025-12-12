import React from 'react';
import { Check, AlertTriangle, X } from 'lucide-react';

export default function KeyTakeaways({ result }) {
    const takeaways = [];

    // 1. Safety Takeaways
    if (result.product_status === 'SAFE') {
        takeaways.push({ type: 'good', text: "Free from high-risk toxins" });
    } else if (result.product_status === 'TOXIC') {
        takeaways.push({ type: 'bad', text: "Contains high-risk ingredients" });
    }

    // 2. Wellness Takeaways
    if (result.wellness_match) {
        result.wellness_match.positive_matches.forEach(m => {
            takeaways.push({ type: 'good', text: m });
        });
        result.wellness_match.negative_matches.forEach(m => {
            takeaways.push({ type: 'bad', text: m });
        });
        result.wellness_match.allergy_matches.forEach(m => {
            takeaways.push({ type: 'critical', text: m });
        });
    }

    // 3. General Ingredient Checks (Heuristics)
    const ingredients = result.ingredients.map(i => i.toLowerCase());
    if (ingredients.some(i => i.includes('paraben'))) {
        takeaways.push({ type: 'warning', text: "Contains Parabens" });
    } else {
        takeaways.push({ type: 'good', text: "Paraben-Free" });
    }

    if (ingredients.some(i => i.includes('fragrance') || i.includes('parfum'))) {
        takeaways.push({ type: 'warning', text: "Contains Fragrance" });
    } else {
        takeaways.push({ type: 'good', text: "Fragrance-Free" });
    }

    // Limit to top 6 to avoid clutter
    const displayTakeaways = takeaways.slice(0, 6);

    return (
        <div className="bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Key Takeaways</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {displayTakeaways.map((item, idx) => (
                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg border ${item.type === 'good' ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900' :
                            item.type === 'bad' ? 'bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900' :
                                item.type === 'critical' ? 'bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800' :
                                    'bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900'
                        }`}>
                        <div className={`p-1.5 rounded-full ${item.type === 'good' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400' :
                                item.type === 'bad' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' :
                                    item.type === 'critical' ? 'bg-red-200 text-red-700 dark:bg-red-800 dark:text-red-300' :
                                        'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400'
                            }`}>
                            {item.type === 'good' ? <Check size={14} strokeWidth={3} /> :
                                item.type === 'critical' ? <X size={14} strokeWidth={3} /> :
                                    <AlertTriangle size={14} strokeWidth={3} />}
                        </div>
                        <span className="text-sm font-medium">{item.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
