import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

import config from "../config";

const IngredientModal = ({ ingredientName, riskLevel, onClose }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchExplanation = async () => {
            setLoading(true);
            setData(null);
            setError(null);

            // Check cache first
            const cacheKey = 'scanwise_ingredient_cache_v2';
            const cachedData = sessionStorage.getItem(cacheKey);
            if (cachedData) {
                const cache = JSON.parse(cachedData);
                if (cache[ingredientName]) {
                    setData(cache[ingredientName]);
                    setLoading(false);
                    return;
                }
            }

            try {
                // Use the new Incidecoder endpoint
                const response = await axios.get(`${config.API_BASE_URL}/ingredient-details/${encodeURIComponent(ingredientName)}`);

                const newData = response.data;
                setData(newData);

                // Update cache
                const currentCache = cachedData ? JSON.parse(cachedData) : {};
                currentCache[ingredientName] = newData;
                sessionStorage.setItem(cacheKey, JSON.stringify(currentCache));

            } catch (err) {
                console.error("Failed to fetch details:", err);
                setError('Failed to load ingredient details.');
            } finally {
                setLoading(false);
            }
        };

        if (ingredientName) {
            fetchExplanation();
        }
    }, [ingredientName]);

    useEffect(() => {
        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!ingredientName) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white capitalize truncate pr-4">
                        {ingredientName}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors shrink-0"
                    >
                        <X size={20} className="text-zinc-500 dark:text-zinc-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            <p className="text-sm text-zinc-500 animate-pulse">Fetching details from Incidecoder...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-500">
                            <p>{error}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">

                            {/* Description */}
                            <div>
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">What It Is</h4>
                                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                    {data.description || "No description available."}
                                </p>
                            </div>

                            {/* Functions */}
                            {data.functions && data.functions.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">What It Does</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {data.functions.map((func, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full border border-indigo-100 dark:border-indigo-800">
                                                {func}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quick Facts */}
                            {data.quick_facts && data.quick_facts.length > 0 && (
                                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg">
                                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Quick Facts</h4>
                                    <ul className="space-y-1">
                                        {data.quick_facts.map((fact, idx) => (
                                            <li key={idx} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start">
                                                <span className="mr-2 text-indigo-500">•</span>
                                                {fact}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-center shrink-0">
                    <p className="text-xs text-zinc-400">
                        Data given by ScanWise AI.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default IngredientModal;
