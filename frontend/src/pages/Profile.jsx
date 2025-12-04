import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { User, Mail, Moon, Sun, Save, Palette, Droplets } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { motion } from 'framer-motion';

import config from "../config";

export default function Profile() {
    const { currentUser, logout, theme, toggleTheme } = useAuth();
    const [skinType, setSkinType] = useState("");
    const [skinTone, setSkinTone] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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
        setSaving(true);
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
        setSaving(false);
    }

    if (loading) return <div className="p-8 text-center text-zinc-400">Loading profile...</div>;

    return (
        <div className="font-sans">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">My Profile</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Manage your skin profile and settings.</p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card className="p-0 overflow-hidden">
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <User size={32} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Account Details</h2>
                                    <div className="flex items-center text-zinc-500 dark:text-zinc-400 mt-1">
                                        <Mail size={14} className="mr-2" />
                                        {currentUser.email}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Skin Profile Section */}
                            <div>
                                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                                    <Droplets size={18} className="text-emerald-500" />
                                    Skin Profile
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Skin Type</label>
                                        <select
                                            value={skinType}
                                            onChange={(e) => setSkinType(e.target.value)}
                                            className="input-field bg-zinc-50 dark:bg-zinc-900/50"
                                        >
                                            <option value="">Select Skin Type</option>
                                            <option value="Oily">Oily</option>
                                            <option value="Dry">Dry</option>
                                            <option value="Combination">Combination</option>
                                            <option value="Sensitive">Sensitive</option>
                                            <option value="Normal">Normal</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Skin Tone</label>
                                        <select
                                            value={skinTone}
                                            onChange={(e) => setSkinTone(e.target.value)}
                                            className="input-field bg-zinc-50 dark:bg-zinc-900/50"
                                        >
                                            <option value="">Select Skin Tone</option>
                                            <option value="Fair">Fair</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Dark">Dark</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Preferences Section */}
                            <div>
                                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                                    <Palette size={18} className="text-emerald-500" />
                                    Preferences
                                </h3>
                                <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        {theme === 'dark' ? <Moon size={20} className="text-zinc-400" /> : <Sun size={20} className="text-amber-500" />}
                                        <div>
                                            <div className="font-medium text-zinc-900 dark:text-zinc-100">Dark Mode</div>
                                            <div className="text-xs text-zinc-500 dark:text-zinc-400">Switch between light and dark themes</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={toggleTheme}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${theme === 'dark' ? 'bg-emerald-600' : 'bg-zinc-200'}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {message && (
                                <div className="text-emerald-600 dark:text-emerald-400 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                    {message}
                                </div>
                            )}

                            <div className="pt-4">
                                <Button
                                    onClick={handleSave}
                                    loading={saving}
                                    className="w-full"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Profile
                                </Button>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
