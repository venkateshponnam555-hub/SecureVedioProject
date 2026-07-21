// frontend/src/components/Navbar.jsx

import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Menu,
  X,
  LogOut,
  User,
  Settings,
  Upload,
  Video,
  Activity,
  Home,
  Info,
} from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAuthenticated = !!(token && user);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setProfileMenuOpen(false);
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
      isActive
        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/40 hover:shadow-[0_0_8px_rgba(6,182,212,0.1)]'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
    }`;

  return (
    <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
              <Shield className="w-8 h-8 text-cyan-400" />
            </motion.div>
            <div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                SecureVault
              </span>
              <span className="block text-[10px] text-slate-500 -mt-1 tracking-wider">
                VIDEO ENCRYPTION
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              <Home className="w-4 h-4" />
              Home
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              <Info className="w-4 h-4" />
              About
            </NavLink>

            {isAuthenticated && (
              <>
                <div className="w-px h-6 bg-slate-700/50 mx-2" />
                <NavLink to="/dashboard" className={navLinkClass}>
                  <Activity className="w-4 h-4" />
                  Dashboard
                </NavLink>
                <NavLink to="/upload" className={navLinkClass}>
                  <Upload className="w-4 h-4" />
                  Upload
                </NavLink>
                <NavLink to="/my-videos" className={navLinkClass}>
                  <Video className="w-4 h-4" />
                  My Videos
                </NavLink>
              </>
            )}
          </div>

          {/* Right Section */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-all duration-300"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm text-slate-300 hidden lg:block">
                    {user?.name || 'User'}
                  </span>
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl py-2 z-50"
                    >
                      <NavLink
                        to="/profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                            isActive ? 'text-cyan-400 bg-slate-800/60' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                          }`
                        }
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </NavLink>
                      <NavLink
                        to="/profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </NavLink>
                      <div className="border-t border-slate-700/50 my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-slate-800/60 transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <NavLink to="/login" className={navLinkClass}>
                  Login
                </NavLink>
                <NavLink to="/register" className={navLinkClass}>
                  Register
                </NavLink>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden border-t border-slate-800/50 bg-slate-950/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-1">
              <NavLink to="/" end onClick={() => setIsOpen(false)} className={mobileNavLinkClass}>
                <Home className="w-4 h-4" />
                Home
              </NavLink>
              <NavLink to="/about" onClick={() => setIsOpen(false)} className={mobileNavLinkClass}>
                <Info className="w-4 h-4" />
                About
              </NavLink>

              {isAuthenticated && (
                <>
                  <div className="border-t border-slate-700/50 my-2" />
                  <NavLink to="/dashboard" onClick={() => setIsOpen(false)} className={mobileNavLinkClass}>
                    <Activity className="w-4 h-4" />
                    Dashboard
                  </NavLink>
                  <NavLink to="/upload" onClick={() => setIsOpen(false)} className={mobileNavLinkClass}>
                    <Upload className="w-4 h-4" />
                    Upload
                  </NavLink>
                  <NavLink to="/my-videos" onClick={() => setIsOpen(false)} className={mobileNavLinkClass}>
                    <Video className="w-4 h-4" />
                    My Videos
                  </NavLink>
                  <div className="border-t border-slate-700/50 my-2" />
                  <NavLink to="/profile" onClick={() => setIsOpen(false)} className={mobileNavLinkClass}>
                    <User className="w-4 h-4" />
                    Profile
                  </NavLink>
                  <NavLink to="/profile" onClick={() => setIsOpen(false)} className={mobileNavLinkClass}>
                    <Settings className="w-4 h-4" />
                    Settings
                  </NavLink>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-slate-800/40 transition-all w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              )}

              {!isAuthenticated && (
                <>
                  <div className="border-t border-slate-700/50 my-2" />
                  <NavLink to="/login" onClick={() => setIsOpen(false)} className={mobileNavLinkClass}>
                    Login
                  </NavLink>
                  <NavLink to="/register" onClick={() => setIsOpen(false)} className={mobileNavLinkClass}>
                    Register
                  </NavLink>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;