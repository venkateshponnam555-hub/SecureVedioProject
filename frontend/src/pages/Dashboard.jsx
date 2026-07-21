// frontend/src/pages/Dashboard.jsx



import React, { useState, useEffect } from 'react';

import { Link } from 'react-router-dom';

import { motion } from 'framer-motion';

import '../styles/Dashboard.css';

import {

  Upload,

  Video,

  Shield,

  Lock,

  Activity,

  HardDrive,

  ArrowRight,

  Plus,

  AlertCircle,

} from 'lucide-react';

import { videoService } from '../services/videoService';



const Dashboard = () => {

  const [stats, setStats] = useState({

    totalVideos: 0,

    encryptedVideos: 0,

    totalSize: 0,

    recentActivity: [],

  });

  const [recentVideos, setRecentVideos] = useState([]);

  const [loading, setLoading] = useState(true);



  const user = JSON.parse(localStorage.getItem('user') || 'null');



  useEffect(() => {

    fetchDashboardData();

  }, []);



  const fetchDashboardData = async () => {

    try {

      const [videosResponse, statsResponse] = await Promise.all([

        videoService.getMyVideos({ limit: 5, sort: 'newest' }),

        videoService.getMyVideos({ limit: 100 }),

      ]);



      const allVideos = statsResponse?.videos || statsResponse || [];

      const encrypted = allVideos.filter((v) => v.encryptionStatus === 'ENCRYPTED').length;

      const totalSize = allVideos.reduce((acc, v) => acc + (v.fileSize || 0), 0);



      setStats({

        totalVideos: allVideos.length,

        encryptedVideos: encrypted,

        totalSize,

        recentActivity: allVideos.slice(0, 5),

      });



      setRecentVideos(videosResponse?.videos || videosResponse?.slice(0, 5) || []);

    } catch (error) {

      console.error('Failed to fetch dashboard data:', error);

    } finally {

      setLoading(false);

    }

  };



  const formatBytes = (bytes) => {

    if (!bytes || bytes === 0) return '0 MB';

    const mb = bytes / (1024 * 1024);

    if (mb < 1024) return mb.toFixed(1) + ' MB';

    return (mb / 1024).toFixed(2) + ' GB';

  };



  const statCards = [

    {

      icon: Video,

      label: 'Total Videos',

      value: stats.totalVideos,

      iconWrapperClass: 'stat-icon-cyan',

    },

    {

      icon: Shield,

      label: 'Encrypted',

      value: stats.encryptedVideos,

      iconWrapperClass: 'stat-icon-emerald',

    },

    {

      icon: HardDrive,

      label: 'Storage Used',

      value: formatBytes(stats.totalSize),

      iconWrapperClass: 'stat-icon-purple',

    },

    {

      icon: Activity,

      label: 'Encryption Rate',

      value: stats.totalVideos > 0

        ? `${Math.round((stats.encryptedVideos / stats.totalVideos) * 100)}%`

        : '0%',

      iconWrapperClass: 'stat-icon-amber',

    },

  ];



  const containerVariants = {

    hidden: { opacity: 0 },

    visible: {

      opacity: 1,

      transition: { staggerChildren: 0.08 },

    },

  };



  const itemVariants = {

    hidden: { opacity: 0, y: 20 },

    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },

  };



  return (

    <div className="min-h-screen py-8">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Welcome Banner */}

        <motion.div

          initial={{ opacity: 0, y: 20 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.6 }}

          className="mb-8"

        >

          <div className="dashboard-welcome">

            <h1 className="dashboard-welcome-title">

              Welcome back,{' '}

              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">

                {user?.name || 'User'}

              </span>

            </h1>

            <p className="dashboard-welcome-subtitle">

              Here's an overview of your encrypted video collection

            </p>

            <div className="mt-5 relative z-10">

              <Link to="/upload" className="btn-primary inline-flex items-center gap-2">

                <Plus className="w-5 h-5" />

                Upload New Video

              </Link>

            </div>

          </div>

        </motion.div>



        {/* Stats Grid */}

        <motion.div

          variants={containerVariants}

          initial="hidden"

          animate="visible"

          className="stats-grid mb-8"

        >

          {statCards.map((stat, index) => (

            <motion.div key={index} variants={itemVariants} className="stat-card-dashboard">

              <div className={`stat-icon-wrapper ${stat.iconWrapperClass}`}>

                <stat.icon className="w-6 h-6" />

              </div>

              <div>

                <p className="stat-value">{stat.value}</p>

                <p className="stat-label">{stat.label}</p>

              </div>

            </motion.div>

          ))}

        </motion.div>



        {/* Main Content */}

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Recent Videos */}

          <motion.div

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            transition={{ delay: 0.3 }}

            className="lg:col-span-2"

          >

            <div className="recent-videos-card">

              <div className="recent-videos-header">

                <h2 className="recent-videos-title">

                  <Video className="w-5 h-5 text-cyan-400" />

                  Recent Videos

                </h2>

                <Link

                  to="/my-videos"

                  className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"

                >

                  View All <ArrowRight className="w-4 h-4" />

                </Link>

              </div>



              {loading ? (

                <div className="space-y-3">

                  {[1, 2, 3].map((i) => (

                    <div key={i} className="skeleton-card">

                      <div className="flex items-center gap-4 p-3">

                        <div className="skeleton-thumb" style={{ width: '88px', height: '52px', borderRadius: '10px' }} />

                        <div className="flex-1">

                          <div className="skeleton-line" style={{ width: '75%' }} />

                          <div className="skeleton-line skeleton-line-short" />

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              ) : recentVideos.length > 0 ? (

                <div className="space-y-1">

                  {recentVideos.map((video, index) => (

                    <Link

                      key={video._id || video.id || index}

                      to={`/watch/${video._id || video.id}`}

                      className="recent-video-item"

                    >

                      <div className="recent-video-thumb">

                        {video.thumbnailUrl ? (

                          <img src={video.thumbnailUrl} alt="" />

                        ) : (

                          <div className="w-full h-full flex items-center justify-center">

                            <Video className="w-5 h-5 text-slate-600" />

                          </div>

                        )}

                      </div>

                      <div className="recent-video-info">

                        <p className="recent-video-name">{video.title || 'Untitled Video'}</p>

                        <p className="recent-video-date">

                          {new Date(video.createdAt || video.uploadDate).toLocaleDateString()}

                        </p>

                      </div>

                      <div>

                        {video.encryptionStatus === 'ENCRYPTED' ? (

                          <span className="badge-success text-xs"><Lock className="w-3 h-3" /></span>

                        ) : (

                          <span className="badge-error text-xs"><AlertCircle className="w-3 h-3" /></span>

                        )}

                      </div>

                    </Link>

                  ))}

                </div>

              ) : (

                <div className="empty-state">

                  <Upload className="empty-state-icon" />

                  <p className="empty-state-title">No videos uploaded yet</p>

                  <p className="empty-state-desc">Upload your first video and encrypt it securely</p>

                  <Link to="/upload" className="btn-primary text-sm py-2 px-6 inline-flex items-center gap-2">

                    <Plus className="w-4 h-4" />

                    Upload Your First Video

                  </Link>

                </div>

              )}

            </div>

          </motion.div>



          {/* Sidebar */}

          <motion.div

            initial={{ opacity: 0, y: 20 }}

            animate={{ opacity: 1, y: 0 }}

            transition={{ delay: 0.4 }}

            className="space-y-5"

          >

            {/* Security Overview */}

            <div className="security-overview-card">

              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">

                <Shield className="w-5 h-5 text-cyan-400" />

                Security Overview

              </h2>

              <div className="mb-4">

                <div className="security-progress-label">

                  <span className="text-slate-400">Encryption Progress</span>

                  <span className="text-cyan-400 font-medium">

                    {stats.totalVideos > 0

                      ? Math.round((stats.encryptedVideos / stats.totalVideos) * 100)

                      : 0}%

                  </span>

                </div>

                <div className="security-progress-bar">

                  <motion.div

                    initial={{ width: 0 }}

                    animate={{

                      width: `${stats.totalVideos > 0 ? (stats.encryptedVideos / stats.totalVideos) * 100 : 0}%`,

                    }}

                    transition={{ duration: 0.8, ease: 'easeOut' }}

                    className="security-progress-fill"

                  />

                </div>

              </div>

              <div className="security-badge security-badge-emerald">

                <Lock className="w-4 h-4 text-emerald-400" />

                <div>

                  <p className="text-sm text-white font-medium">AES-256 Active</p>

                  <p className="text-xs text-slate-500">Symmetric encryption enabled</p>

                </div>

              </div>

              <div className="security-badge security-badge-cyan mt-2">

                <Shield className="w-4 h-4 text-cyan-400" />

                <div>

                  <p className="text-sm text-white font-medium">ECC + RSA Hybrid</p>

                  <p className="text-xs text-slate-500">Key exchange & protection</p>

                </div>

              </div>

            </div>



            {/* Quick Actions */}

            <div className="quick-actions-card">

              <h2 className="text-base font-semibold text-white mb-3">Quick Actions</h2>

              <Link to="/upload" className="quick-action-item quick-action-item-cyan">

                <Upload className="w-4 h-4 text-cyan-400" />

                <span className="quick-action-label">Upload Video</span>

              </Link>

              <Link to="/my-videos" className="quick-action-item quick-action-item-purple">

                <Video className="w-4 h-4 text-purple-400" />

                <span className="quick-action-label">Manage Videos</span>

              </Link>

              <Link to="/profile" className="quick-action-item quick-action-item-slate">

                <Activity className="w-4 h-4 text-slate-400" />

                <span className="quick-action-label">View Activity</span>

              </Link>

            </div>



            {/* Storage Info */}

            <div className="storage-card">

              <h2 className="storage-title">

                <HardDrive className="w-5 h-5 text-purple-400" />

                Storage

              </h2>

              <div className="storage-info">

                <span>Used</span>

                <span className="text-white font-medium">{formatBytes(stats.totalSize)}</span>

              </div>

              <div className="storage-bar">

                <motion.div

                  initial={{ width: 0 }}

                  animate={{ width: `${Math.min((stats.totalSize / (5 * 1024 * 1024 * 1024)) * 100, 100)}%` }}

                  transition={{ duration: 0.8, ease: 'easeOut' }}

                  className="storage-bar-fill"

                />

              </div>

              <p className="text-xs text-slate-500 mt-2">5 GB total storage</p>

            </div>

          </motion.div>

        </div>

      </div>

    </div>

  );

};



export default Dashboard;