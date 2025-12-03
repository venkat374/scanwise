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
    Sparkles,
    Sun,
    Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
    const { currentUser, logout, theme, toggleTheme } = useAuth();
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans">

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed h-full z-30">
                <div className="p-6 flex items-center gap-2">
                    <div className="bg-emerald-500 p-2 rounded-lg">
                        <ScanLine className="text-white" size={24} />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        ScanWise
                    </span>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive(item.path)
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                        >
                            <item.icon size={20} className={isActive(item.path) ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'} />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {currentUser?.email?.[0].toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{currentUser?.email}</p>
                            <p className="text-xs text-slate-500">Free Plan</p>
                        </div>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-40 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <div className="bg-emerald-500 p-1.5 rounded-lg">
                        <ScanLine className="text-white" size={20} />
                    </div>
                    <span className="text-lg font-bold">ScanWise</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-30 bg-white dark:bg-slate-950 pt-20 px-4">
                    <nav className="space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-4 rounded-xl text-lg ${isActive(item.path)
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium'
                                    : 'text-slate-500 dark:text-slate-400'
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
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen transition-all duration-300">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-40 flex justify-around items-center h-16 px-2 pb-safe">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive(item.path) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
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
