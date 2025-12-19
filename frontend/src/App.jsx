import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import History from './pages/History';
import Routine from './pages/Routine';
import SkinAnalysis from './pages/SkinAnalysis';
import { Home as HomeIcon, User, History as HistoryIcon, Layers } from 'lucide-react';


function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-background text-foreground font-sans">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/skin-analysis" element={<PrivateRoute><SkinAnalysis /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
            <Route path="/routine" element={<PrivateRoute><Routine /></PrivateRoute>} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
