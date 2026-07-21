// frontend/src/pages/Profile.jsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Shield,
  Camera,
  Save,
  Key,
  Lock,
  Calendar,
  Activity,
  CheckCircle,
} from 'lucide-react';
import { authService } from '../services/authService';

const Profile = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) setPasswordErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (formData.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!passwordData.currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!passwordData.newPassword) newErrors.newPassword = 'New password is required';
    else if (passwordData.newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters';
    if (!passwordData.confirmNewPassword) newErrors.confirmNewPassword = 'Please confirm new password';
    else if (passwordData.newPassword !== passwordData.confirmNewPassword) newErrors.confirmNewPassword = 'Passwords do not match';
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;
    setLoading(true);
    try {
      const updatedUser = await authService.updateProfile(formData);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      showMessage('Profile updated successfully');
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setPasswordLoading(true);
    try {
      await authService.changePassword(passwordData);
      showMessage('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setShowPasswordForm(false);
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const activityLog = [
    { action: 'Video encrypted', target: 'project-demo.mp4', date: '2024-01-15T10:30:00', icon: Lock, color: 'text-emerald-400' },
    { action: 'Video uploaded', target: 'tutorial.mp4', date: '2024-01-14T15:20:00', icon: Shield, color: 'text-cyan-400' },
    { action: 'Profile updated', target: 'Account settings', date: '2024-01-13T09:00:00', icon: User, color: 'text-purple-400' },
    { action: 'Password changed', target: 'Security', date: '2024-01-10T14:45:00', icon: Key, color: 'text-amber-400' },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
          <p className="text-slate-400 mt-1">Manage your account and security settings</p>
        </motion.div>

        {/* Message Toast */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-3 rounded-xl text-sm text-center ${
              messageType === 'error'
                ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            }`}
          >
            {message}
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="glass-card p-6 text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-slate-800 border border-slate-600 text-slate-300 hover:text-white hover:border-cyan-500 transition-all">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h2 className="text-lg font-semibold text-white">{user?.name || 'User'}</h2>
              <p className="text-sm text-slate-400">{user?.email}</p>
              <div className="mt-3">
                <span className="badge-success text-xs">
                  <CheckCircle className="w-3 h-3" />
                  Verified Account
                </span>
              </div>
            </div>

            {/* Navigation */}
            <div className="glass-card mt-4 p-2 space-y-1">
              {[
                { id: 'profile', icon: User, label: 'Profile Info' },
                { id: 'security', icon: Shield, label: 'Security' },
                { id: 'activity', icon: Activity, label: 'Activity Log' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'text-white bg-slate-800/60 border border-slate-700/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-400" />
                  Profile Information
                </h2>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="label">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`input-field ${errors.name ? 'input-field-error' : ''}`}
                    />
                    {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="label">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="input-field opacity-60 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label htmlFor="phone" className="label">Phone Number (optional)</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="bio" className="label">Bio (optional)</label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      maxLength={500}
                      className="input-field resize-none"
                    />
                    <p className="text-xs text-slate-500 mt-1 text-right">{formData.bio.length}/500</p>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                      {loading ? (
                        <>
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <>
                <div className="glass-card p-6">
                  <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    Security Settings
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-emerald-400" />
                        <div>
                          <p className="text-white font-medium">Two-Factor Authentication</p>
                          <p className="text-xs text-slate-400">Add an extra layer of security</p>
                        </div>
                      </div>
                      <button className="btn-secondary py-2 px-4 text-sm">Enable</button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
                      <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-cyan-400" />
                        <div>
                          <p className="text-white font-medium">Change Password</p>
                          <p className="text-xs text-slate-400">Last changed 30 days ago</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                        className="btn-secondary py-2 px-4 text-sm"
                      >
                        {showPasswordForm ? 'Cancel' : 'Change'}
                      </button>
                    </div>

                    {showPasswordForm && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handlePasswordUpdate}
                        className="space-y-4 p-4 rounded-xl bg-slate-800/20 border border-slate-700/20"
                      >
                        <div>
                          <label htmlFor="currentPassword" className="label">Current Password</label>
                          <input
                            type="password"
                            id="currentPassword"
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            className={`input-field ${passwordErrors.currentPassword ? 'input-field-error' : ''}`}
                          />
                          {passwordErrors.currentPassword && <p className="text-red-400 text-xs mt-1.5">{passwordErrors.currentPassword}</p>}
                        </div>
                        <div>
                          <label htmlFor="newPassword" className="label">New Password</label>
                          <input
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            className={`input-field ${passwordErrors.newPassword ? 'input-field-error' : ''}`}
                          />
                          {passwordErrors.newPassword && <p className="text-red-400 text-xs mt-1.5">{passwordErrors.newPassword}</p>}
                        </div>
                        <div>
                          <label htmlFor="confirmNewPassword" className="label">Confirm New Password</label>
                          <input
                            type="password"
                            id="confirmNewPassword"
                            name="confirmNewPassword"
                            value={passwordData.confirmNewPassword}
                            onChange={handlePasswordChange}
                            className={`input-field ${passwordErrors.confirmNewPassword ? 'input-field-error' : ''}`}
                          />
                          {passwordErrors.confirmNewPassword && <p className="text-red-400 text-xs mt-1.5">{passwordErrors.confirmNewPassword}</p>}
                        </div>
                        <button type="submit" disabled={passwordLoading} className="btn-primary">
                          {passwordLoading ? 'Updating...' : 'Update Password'}
                        </button>
                      </motion.form>
                    )}
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-white font-semibold mb-4">Active Sessions</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <div>
                          <p className="text-sm text-white">Current Session</p>
                          <p className="text-xs text-slate-500">Chrome on Windows • IP: 192.168.***</p>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-400">Active now</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Activity Log
                </h2>
                <div className="space-y-1">
                  {activityLog.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800/30 transition-colors"
                    >
                      <div className={`p-2 rounded-lg bg-slate-800/60`}>
                        <activity.icon className={`w-4 h-4 ${activity.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white">{activity.action}</p>
                        <p className="text-xs text-slate-500">{activity.target}</p>
                      </div>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(activity.date).toLocaleDateString()}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;