import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";
import config from "../config";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(true); // New state for profile fetch

    function signup(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    }

    function logout() {
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const [theme, setTheme] = useState('light');

    useEffect(() => {
        // Check local storage on mount, default to light
        const savedTheme = localStorage.getItem('scanwise_theme');
        if (savedTheme) {
            setTheme(savedTheme);
        }
        // Removed system preference check to default to light mode
    }, []);

    useEffect(() => {
        // Apply theme to document
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('scanwise_theme', theme);
    }, [theme]);


    const fetchUserProfile = async () => {
        if (currentUser) {
            setProfileLoading(true); // Start loading
            try {
                const token = await currentUser.getIdToken();
                const res = await fetch(`${config.API_BASE_URL}/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUserProfile(data);
                    if (data.theme_preference) {
                        setTheme(data.theme_preference);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch profile", err);
            } finally {
                setProfileLoading(false); // End loading
            }
        } else {
            setUserProfile(null);
            setProfileLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, [currentUser]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const value = {
        currentUser,
        signup,
        login,
        loginWithGoogle,
        logout,
        theme,
        toggleTheme,
        userProfile,
        profileLoading, // Expose profileLoading
        refreshProfile: fetchUserProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
