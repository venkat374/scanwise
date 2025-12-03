import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            setError("");
            setLoading(true);
            await login(email, password);
            navigate("/dashboard");
        } catch (err) {
            setError("Failed to log in: " + err.message);
        }
        setLoading(false);
    }

    async function handleGoogleLogin() {
        try {
            setError("");
            setLoading(true);
            await loginWithGoogle();
            navigate("/dashboard");
        } catch (err) {
            setError("Failed to log in with Google: " + err.message);
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-4">
            <div className="w-full max-w-md bg-zinc-900 rounded-xl p-8 border border-zinc-800 shadow-xl">
                <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">ScanWise Login</h2>
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
                    <button
                        disabled={loading}
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded transition-all disabled:opacity-50"
                    >
                        Log In
                    </button>
                </form>

                <div className="mt-4">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full bg-white text-black font-bold py-3 rounded hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                    >
                        Sign in with Google
                    </button>
                </div>

                <div className="mt-6 text-center text-zinc-500">
                    Need an account? <Link to="/signup" className="text-emerald-400 hover:underline">Sign Up</Link>
                </div>
            </div>
        </div>
    );
}
