import React from 'react';
import { Info } from 'lucide-react';

export default function ScoreCard({ title, score, maxScore = 100, type = 'safety', description, level }) {
    // type: 'safety' (Low score is good) or 'wellness' (High score is good)

    let percentage = (score / maxScore) * 100;

    // Determine color and label based on type
    let colorClass = 'bg-gray-500';
    let textClass = 'text-gray-700';
    let label = level || 'Unknown';

    if (type === 'safety') {
        // Safety: Low score is SAFE (Green), High is TOXIC (Red)
        // But usually we display "Safety Score" where High is Safe?
        // Let's stick to the plan: "Safety Rating". 
        // If input is "Toxicity Score" (0-1), we invert it for "Safety".
        // Wait, the plan said "Safety Rating" (Low/Medium/High Risk).
        // Let's assume the input `score` here is already normalized to 0-100 representing "Goodness" if possible,
        // OR we handle the logic here.

        // Let's assume `score` passed in is the "Goodness" (0-100).
        if (score >= 80) {
            colorClass = 'bg-emerald-500';
            textClass = 'text-emerald-600';
            if (!level) label = 'Clean & Safe';
        } else if (score >= 50) {
            colorClass = 'bg-amber-500';
            textClass = 'text-amber-600';
            if (!level) label = 'Moderate Risk';
        } else {
            colorClass = 'bg-red-500';
            textClass = 'text-red-600';
            if (!level) label = 'High Risk';
        }
    } else {
        // Wellness: High score is GOOD (Green)
        if (score >= 80) {
            colorClass = 'bg-emerald-500';
            textClass = 'text-emerald-600';
            if (!level) label = 'Great Match';
        } else if (score >= 50) {
            colorClass = 'bg-blue-500';
            textClass = 'text-blue-600';
            if (!level) label = 'Fair Match';
        } else {
            colorClass = 'bg-red-500';
            textClass = 'text-red-600';
            if (!level) label = 'Poor Match';
        }
    }

    return (
        <div className="bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    {title}
                    <div className="group relative">
                        <Info size={16} className="text-muted-foreground cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {description}
                        </div>
                    </div>
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-opacity-10 ${colorClass.replace('bg-', 'bg-').replace('500', '100')} ${textClass}`}>
                    {label}
                </span>
            </div>

            <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-end gap-2 mb-2">
                    <span className={`text-5xl font-black ${textClass}`}>
                        {Math.round(score)}
                    </span>
                    <span className="text-muted-foreground font-medium mb-1">/ {maxScore}</span>
                </div>

                {/* Progress Bar */}
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div
                        className={`h-full ${colorClass} transition-all duration-1000 ease-out`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                    {type === 'safety' ? (
                        score >= 80 ? "This product contains mostly safe ingredients." :
                            score >= 50 ? "Contains some ingredients that may be irritating." :
                                "Contains ingredients with potential health concerns."
                    ) : (
                        score >= 80 ? "Aligns perfectly with your skin profile." :
                            score >= 50 ? "Good, but check for specific conflicts." :
                                "May not be suitable for your skin type or concerns."
                    )}
                </p>
            </div>
        </div>
    );
}
