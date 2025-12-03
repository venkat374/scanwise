import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

import config from "../config";

export default function Profile() {
    const { currentUser, logout, theme, toggleTheme } = useAuth();
    const [skinType, setSkinType] = useState("");
    const [skinTone, setSkinTone] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            if (!currentUser) return;
            try {
                const token = await currentUser.getIdToken();
                const res = await axios.get(`${config.API_BASE_URL}/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data) {
                    setSkinType(res.data.skin_type || "");
                    setSkinTone(res.data.skin_tone || "");
                }
            } catch (err) {
                console.error("Failed to fetch profile", err);
            }
            setLoading(false);
        }
        fetchProfile();
    }, [currentUser]);

    async function handleSave() {
        try {
            setMessage("");
            const token = await currentUser.getIdToken();
            await axios.post(`${config.API_BASE_URL}/users/profile`, {
                uid: currentUser.uid,
                email: currentUser.email,
                skin_type: skinType,
                skin_tone: skinTone,
                theme_preference: theme
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage("Profile updated successfully!");
        } catch (err) {
            setMessage("Failed to update profile: " + err.message);
        }
    }

    async function handleLogout() {
        try {
            await logout();
        } catch (err) {
            console.error("Failed to log out", err);
        }
    }

    if (loading) return <div className="p-8 text-center text-zinc-400">Loading profile...</div>;

    return (
        <div className="font-sans">
            <div className="max-w-xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">My Profile</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your skin profile and settings.</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm mb-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
                        <div className="text-lg font-medium text-slate-900 dark:text-slate-100">{currentUser.email}</div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Skin Type</label>
                        <select
                            value={skinType}
                            onChange={(e) => setSkinType(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        >
                            <option value="">Select Skin Type</option>
                            <option value="Oily">Oily</option>
                            <option value="Dry">Dry</option>
                            <option value="Combination">Combination</option>
                            <option value="Sensitive">Sensitive</option>
                            <option value="Normal">Normal</option>
                        </select>
                    </div>

                    <div className="mb-8">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Skin Tone</label>
                        <select
                            value={skinTone}
                            onChange={(e) => setSkinTone(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        >
                            <option value="">Select Skin Tone</option>
                            <option value="Fair">Fair</option>
                            <option value="Medium">Medium</option>
                            <option value="Dark">Dark</option>
                        </select>
                    </div>

                    <div className="mb-8 flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">Dark Mode</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Switch between light and dark themes</div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${theme === 'dark' ? 'bg-emerald-600' : 'bg-slate-200'}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>

                    {message && <div className="mb-4 text-emerald-600 dark:text-emerald-400 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/50">{message}</div>}

                    <button
                        onClick={handleSave}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                    >
                        Save Profile
                    </button>
                </div>
            </div>
        </div>
    );
}
