import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }

        try {
            setError("");
            setLoading(true);
            await signup(email, password);
            navigate("/dashboard");
        } catch (err) {
            setError("Failed to create an account: " + err.message);
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-4">
            <div className="w-full max-w-md bg-zinc-900 rounded-xl p-8 border border-zinc-800 shadow-xl">
                <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Create Account</h2>
                {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-zinc-800 border border-zinc-700 rounded p-3 focus:outline-none focus:border-emerald-500 transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-zinc-800 border border-zinc-700 rounded p-3 focus:outline-none focus:border-emerald-500 transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-zinc-800 border border-zinc-700 rounded p-3 focus:outline-none focus:border-emerald-500 transition-colors"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    <button
                        disabled={loading}
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded transition-all disabled:opacity-50"
                    >
                        Sign Up
                    </button>
                </form>
                <div className="mt-6 text-center text-zinc-500">
                    Already have an account? <Link to="/login" className="text-emerald-400 hover:underline">Log In</Link>
                </div>
            </div>
        </div>
    );
}
