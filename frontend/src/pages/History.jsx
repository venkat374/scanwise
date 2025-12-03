import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Badge from '../components/Badge';
import config from "../config";

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
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Scan History</h1>
                    <p className="text-slate-500 dark:text-slate-400">View your past product scans.</p>
                </div>

                {history.length === 0 ? (
                    <div className="text-center text-slate-500 py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                        <p>No scans yet. Go to Dashboard to scan a product!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((item, index) => (
                            <Card key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{item.product_name || "Unknown Product"}</h3>
                                        <div className="text-sm text-slate-500">{new Date(item.timestamp).toLocaleDateString()}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-2xl font-bold ${item.toxicity_score >= 0.6 ? 'text-red-500' : item.toxicity_score >= 0.3 ? 'text-yellow-500' : 'text-green-500'}`}>
                                            {Math.round(item.toxicity_score * 100)}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
