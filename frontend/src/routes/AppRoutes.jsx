// frontend/src/routes/AppRoutes.jsx

import React from 'react';
import { Link, Route, Routes } from 'react-router-dom';

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
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Shared link remains public initially.
          SharedVideo handles login, OTP and receiver verification. */}
      <Route
        path="/share/:shareToken"
        element={<SharedVideo />}
      />

      {/* Protected routes */}
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
        path="/watch/:id"
        element={
          <ProtectedRoute>
            <WatchVideo />
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

      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center px-4">
            <div className="glass-card p-12 text-center max-w-md w-full">
              <h2 className="text-xl font-semibold text-white mb-2">
                404 - Page Not Found
              </h2>

              <p className="text-slate-400 mb-6">
                The page you&apos;re looking for doesn&apos;t exist.
              </p>

              <Link to="/" className="btn-primary inline-block">
                Go Home
              </Link>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

export default AppRoutes;