// frontend/src/pages/Login.jsx

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { authService } from '../services/authService';

const getSafePendingSharePath = () => {
  const path = sessionStorage.getItem('pendingSharePath');
  return path && path.startsWith('/share/') ? path : null;
};

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) return;

    const pendingSharePath = getSafePendingSharePath();

    if (pendingSharePath) {
      sessionStorage.removeItem('pendingSharePath');
      navigate(pendingSharePath, { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }

    if (serverError) {
      setServerError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setServerError('');

    try {
      const response = await authService.login(
        formData.email.trim(),
        formData.password
      );

      if (response?.accessToken) {
        localStorage.setItem('token', response.accessToken);
      }

      if (response?.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }

      if (response?.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      const pendingSharePath = getSafePendingSharePath();

      if (pendingSharePath) {
        sessionStorage.removeItem('pendingSharePath');
        navigate(pendingSharePath, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Invalid email or password';

      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center py-12 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-slate-700/50 flex items-center justify-center"
            >
              <Shield className="w-8 h-8 text-cyan-400" />
            </motion.div>

            <h1 className="text-2xl font-bold text-white">Welcome Back</h1>

            <p className="text-slate-400 text-sm mt-1">
              Sign in to your SecureVault account
            </p>
          </div>

          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
            >
              {serverError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
                  <Mail className="w-4 h-4 text-slate-500" />
                </div>

                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`input-field ${
                    errors.email ? 'input-field-error' : ''
                  }`}
                  autoComplete="email"
                  style={{ paddingLeft: '48px' }}
                />
              </div>

              {errors.email && (
                <p className="text-red-400 text-xs mt-1.5">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>

                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`input-field ${
                    errors.password ? 'input-field-error' : ''
                  }`}
                  autoComplete="current-password"
                  style={{
                    paddingLeft: '48px',
                    paddingRight: '48px',
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 z-10 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="text-red-400 text-xs mt-1.5">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/50" />
            </div>

            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-slate-900 text-slate-500">
                or
              </span>
            </div>
          </div>

          <p className="text-center text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Create one now
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;