import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

export default function ScoreCard({ title, score, maxScore = 100, type = 'safety', description, level, ...props }) {
    const [isExpanded, setIsExpanded] = useState(false);
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

                {/* Details Section */}
                {props.details && props.details.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <span>Why this score?</span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {isExpanded && (
                            <ul className="space-y-2 mt-3 animate-in slide-in-from-top-1 duration-200">
                                {props.details.map((detail, idx) => {
                                    const isObject = typeof detail === 'object';
                                    const text = isObject ? detail.text : detail;
                                    const type = isObject ? detail.type : 'neutral';

                                    // Determine icon/color
                                    let iconColor = "bg-zinc-400";
                                    let textColor = "text-zinc-600 dark:text-zinc-400";
                                    if (text.includes("✅") || type === 'good') {
                                        iconColor = "bg-emerald-500";
                                        textColor = "text-emerald-700 dark:text-emerald-300";
                                    } else if (text.includes("⚠️") || type === 'bad') {
                                        iconColor = "bg-amber-500";
                                        textColor = "text-amber-700 dark:text-amber-300";
                                    } else if (text.includes("❌") || type === 'critical') {
                                        iconColor = "bg-red-500";
                                        textColor = "text-red-700 dark:text-red-300";
                                    }

                                    return (
                                        <li key={idx} className={`text-xs flex items-start gap-2 p-1.5 rounded ${isObject && type !== 'neutral' ? 'bg-zinc-50 dark:bg-zinc-900/50' : ''}`}>
                                            <span className={`mt-1 block w-1.5 h-1.5 rounded-full ${iconColor} shrink-0`} />
                                            <span className={textColor}>{text.replace(/^[✅⚠️❌]\s*/, '')}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
