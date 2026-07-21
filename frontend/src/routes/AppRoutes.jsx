// frontend/src/routes/AppRoutes.jsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from '../pages/Home';
import About from '../pages/About';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import UploadVideo from '../pages/UploadVideo';
import EncryptionProcess from '../pages/EncryptionProcess';
import MyVideos from '../pages/MyVideos';
import WatchVideo from '../pages/WatchVideo';
import Profile from '../pages/Profile';
import SharedVideo from '../pages/SharedVideo';

import ProtectedRoute from '../components/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>

      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <UploadVideo />
          </ProtectedRoute>
        }
      />

      <Route
        path="/encryption-process/:id"
        element={
          <ProtectedRoute>
            <EncryptionProcess />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-videos"
        element={
          <ProtectedRoute>
            <MyVideos />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />


      {/* Public Share & Watch Routes */}
      <Route path="/watch/:id" element={<WatchVideo />} />
      <Route path="/share/:shareToken" element={<SharedVideo />} />


      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="glass-card p-12 text-center max-w-md">
              <h2 className="text-xl font-semibold text-white mb-2">
                404 - Page Not Found
              </h2>
              <p className="text-slate-400 mb-4">
                The page you're looking for doesn't exist.
              </p>
              <a href="/" className="btn-primary inline-block">
                Go Home
              </a>
            </div>
          </div>
        }
      />

    </Routes>
  );
};

export default AppRoutes;