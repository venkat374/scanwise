import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Badge from '../components/Badge';
import config from "../config";
import { motion } from 'framer-motion';

export default function History() {
    const { currentUser } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchHistory() {
            if (!currentUser) return;
            try {
                const token = await currentUser.getIdToken();
                const res = await axios.get(`${config.API_BASE_URL}/history`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setHistory(res.data);
            } catch (err) {
                console.error("Failed to fetch history", err);
            }
            setLoading(false);
        }
        fetchHistory();
    }, [currentUser]);

    if (loading) return <div className="p-8 text-center text-zinc-500">Loading history...</div>;

    return (
        <div className="font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Scan History</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">View your past product scans.</p>
                </div>

                {history.length === 0 ? (
                    <div className="text-center text-zinc-500 py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <p>No scans yet. Go to Dashboard to scan a product!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer border-zinc-200 dark:border-zinc-800">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{item.product_name || "Unknown Product"}</h3>
                                            <div className="text-sm text-zinc-500">{new Date(item.timestamp).toLocaleDateString()}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-2xl font-bold ${item.toxicity_score >= 0.6 ? 'text-red-500' : item.toxicity_score >= 0.3 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                {Math.round(item.toxicity_score * 100)}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
