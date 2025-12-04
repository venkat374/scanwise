import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ScanLine,
    History,
    User,
    LogOut,
    Menu,
    X,
    Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout({ children }) {
    const { currentUser, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Safety net: Ensure body scroll is enabled on mount/navigation
    React.useEffect(() => {
        document.body.style.overflow = 'unset';
    }, [location.pathname]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Sparkles, label: 'Routine', path: '/routine' },
        { icon: History, label: 'History', path: '/history' },
        { icon: User, label: 'Profile', path: '/profile' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex font-sans selection:bg-emerald-500/30">

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-72 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-r border-zinc-200 dark:border-zinc-800 fixed h-full z-30 transition-all duration-300">
                <div className="p-6 flex items-center gap-3">
                    <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
                        <ScanLine className="text-white" size={24} />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent tracking-tight">
                        ScanWise
                    </span>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${isActive(item.path)
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium shadow-sm'
                                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                        >
                            {isActive(item.path) && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-500/10"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <item.icon size={20} className={`relative z-10 ${isActive(item.path) ? 'text-emerald-500' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`} />
                            <span className="relative z-10">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                            {currentUser?.email?.[0].toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-100">{currentUser?.email}</p>
                            <p className="text-xs text-zinc-500">Free Plan</p>
                        </div>
                    </div>


                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors font-medium"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 z-40 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <div className="bg-emerald-500 p-1.5 rounded-lg">
                        <ScanLine className="text-white" size={20} />
                    </div>
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">ScanWise</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-zinc-600 dark:text-zinc-400">
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="md:hidden fixed inset-0 z-30 bg-white dark:bg-zinc-950 pt-20 px-4"
                    >
                        <nav className="space-y-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-4 rounded-xl text-lg ${isActive(item.path)
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium'
                                        : 'text-zinc-500 dark:text-zinc-400'
                                        }`}
                                >
                                    <item.icon size={24} />
                                    {item.label}
                                </Link>
                            ))}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-4 text-lg text-red-500 mt-8"
                            >
                                <LogOut size={24} />
                                Sign Out
                            </button>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 md:ml-72 pt-16 md:pt-0 min-h-screen transition-all duration-300 bg-zinc-50/50 dark:bg-black/20">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 z-40 flex justify-around items-center h-16 px-2 pb-safe">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive(item.path) ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'
                            }`}
                    >
                        <item.icon size={20} className={isActive(item.path) ? 'fill-current' : ''} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
