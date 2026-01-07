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
        takeaways.push({ type: 'warning', text: "Contains Fragrance" }); // Keeping warning for fragrance as it's common
    } else {
        takeaways.push({ type: 'good', text: "Fragrance-Free" });
    }

    // Limit to top 6 to avoid clutter
    const displayTakeaways = takeaways.slice(0, 6);

    return (
        <div className="bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm h-full">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-md">
                    <Check size={16} />
                </span>
                Scan Highlights
            </h3>
            <div className="space-y-2">
                {displayTakeaways.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0 last:pb-0">
                        <div className={`mt-0.5 ${item.type === 'good' ? 'text-emerald-500' :
                            item.type === 'bad' ? 'text-red-500' :
                                item.type === 'critical' ? 'text-red-600' :
                                    'text-amber-500'
                            }`}>
                            {item.type === 'good' ? <Check size={16} strokeWidth={3} /> :
                                item.type === 'critical' ? <X size={16} strokeWidth={3} /> :
                                    <AlertTriangle size={16} strokeWidth={3} />}
                        </div>
                        <span className="text-sm text-muted-foreground leading-snug">{item.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
