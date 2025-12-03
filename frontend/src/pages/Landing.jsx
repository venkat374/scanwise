import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Layers, ArrowRight, Scan, Smartphone } from 'lucide-react';

const Landing = () => {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
            {/* Navbar */}
            <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <Scan className="w-5 h-5 text-zinc-950" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">ScanWise</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                        Login
                    </Link>
                    <Link
                        to="/signup"
                        className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-semibold px-4 py-2 rounded-full transition-all"
                    >
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="container mx-auto px-6 py-20 md:py-32 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full -z-10 pointer-events-none" />

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-emerald-400 mb-8 animate-fade-in-up">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    AI-Powered Skincare Analysis
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent max-w-4xl">
                    Know What's In Your <br className="hidden md:block" />
                    <span className="text-emerald-500">Skincare Routine</span>
                </h1>

                <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
                    Instantly analyze ingredients for toxicity, find safer alternatives, and build a conflict-free routine with the power of AI.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Link
                        to="/login"
                        className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold px-8 py-4 rounded-full text-lg transition-all hover:scale-105 active:scale-95"
                    >
                        Start Scanning Free
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>

                {/* Mobile Preview Mockup (CSS only) */}
                <div className="mt-20 relative w-full max-w-sm mx-auto perspective-[2000px]">
                    <div className="relative bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-2 shadow-2xl transform rotate-x-12 hover:rotate-x-0 transition-transform duration-700">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-zinc-950 rounded-b-xl z-10"></div>
                        <div className="bg-zinc-950 rounded-[2rem] overflow-hidden aspect-[9/19] relative">
                            {/* Mock UI */}
                            <div className="p-6 pt-12 space-y-6">
                                <div className="h-40 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 border-dashed">
                                    <Scan className="w-12 h-12 text-zinc-700" />
                                </div>
                                <div className="space-y-3">
                                    <div className="h-4 w-3/4 bg-zinc-900 rounded"></div>
                                    <div className="h-4 w-1/2 bg-zinc-900 rounded"></div>
                                </div>
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                        <span className="font-semibold text-emerald-500">Safe to use</span>
                                    </div>
                                    <p className="text-xs text-zinc-400">No harmful ingredients detected.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section className="py-24 bg-zinc-900/50 border-t border-zinc-800/50">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need for safe skincare</h2>
                        <p className="text-zinc-400">Advanced tools to help you make informed decisions.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<ShieldCheck className="w-8 h-8 text-emerald-500" />}
                            title="Toxicity Analysis"
                            description="Scan barcodes or ingredients to instantly detect harmful chemicals and irritants."
                        />
                        <FeatureCard
                            icon={<Zap className="w-8 h-8 text-amber-500" />}
                            title="Smart Alternatives"
                            description="Found something toxic? We'll recommend safer, cleaner alternatives automatically."
                        />
                        <FeatureCard
                            icon={<Layers className="w-8 h-8 text-purple-500" />}
                            title="Routine Builder"
                            description="Check your entire routine for ingredient conflicts like Retinol + Vitamin C."
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-zinc-800 bg-zinc-950 text-center">
                <p className="text-zinc-500 text-sm">
                    © {new Date().getFullYear()} ScanWise. Built for safer skincare.
                </p>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }) => (
    <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
        <div className="mb-6 p-3 bg-zinc-950 rounded-xl w-fit border border-zinc-800">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-zinc-400 leading-relaxed">
            {description}
        </p>
    </div>
);

export default Landing;
