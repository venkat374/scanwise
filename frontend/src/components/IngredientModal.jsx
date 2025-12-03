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
                const response = await axios.post(`${config.API_BASE_URL}/explain-ingredient`, {
                    ingredient_name: ingredientName,
                    risk_context: riskLevel
                });

                const newData = response.data;
                setData(newData);

                // Update cache
                const currentCache = cachedData ? JSON.parse(cachedData) : {};
                currentCache[ingredientName] = newData;
                sessionStorage.setItem(cacheKey, JSON.stringify(currentCache));

            } catch (err) {
                setError('Failed to load explanation.');
            } finally {
                setLoading(false);
            }
        };

        if (ingredientName) {
            fetchExplanation();
        }
    }, [ingredientName]);

    if (!ingredientName) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white capitalize">
                        {ingredientName}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X size={20} className="text-zinc-500 dark:text-zinc-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            <p className="text-sm text-zinc-500 animate-pulse">Consulting AI Expert...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-500">
                            <p>{error}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">

                            {/* Description */}
                            <div>
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">What is it?</h4>
                                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                    {data.description}
                                </p>
                            </div>

                            {/* Risk Level */}
                            <div className="flex items-center space-x-3 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg">
                                <div className={`p-2 rounded-full ${data.risk_level?.toLowerCase().includes('high') ? 'bg-red-100 text-red-600' :
                                    data.risk_level?.toLowerCase().includes('moderate') ? 'bg-yellow-100 text-yellow-600' :
                                        'bg-green-100 text-green-600'
                                    }`}>
                                    {data.risk_level?.toLowerCase().includes('high') ? <AlertTriangle size={18} /> :
                                        data.risk_level?.toLowerCase().includes('moderate') ? <Info size={18} /> :
                                            <CheckCircle size={18} />}
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Risk Level</h4>
                                    <p className={`text-sm font-medium ${data.risk_level?.toLowerCase().includes('high') ? 'text-red-600 dark:text-red-400' :
                                        data.risk_level?.toLowerCase().includes('moderate') ? 'text-yellow-600 dark:text-yellow-400' :
                                            'text-green-600 dark:text-green-400'
                                        }`}>
                                        {data.risk_level}
                                    </p>
                                </div>
                            </div>

                            {/* Common Uses */}
                            <div>
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Common Uses</h4>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    {data.common_uses}
                                </p>
                            </div>

                            {/* Side Effects */}
                            {data.side_effects && (
                                <div>
                                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Potential Side Effects</h4>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">
                                        {data.side_effects}
                                    </p>
                                </div>
                            )}

                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-center">
                    <p className="text-xs text-zinc-400">
                        AI-generated content. Verify with a professional.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default IngredientModal;
