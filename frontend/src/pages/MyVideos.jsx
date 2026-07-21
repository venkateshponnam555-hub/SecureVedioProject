// frontend/src/pages/MyVideos.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  Upload,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { videoService } from '../services/videoService';
import { api } from '../services/api';

const MyVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    sortBy: 'newest',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
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

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 12,
        sort: filters.sortBy,
        search: searchQuery || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
      };

      const response = await videoService.getMyVideos(params);

      let videoList = [];
      if (response?.videos && Array.isArray(response.videos)) {
        videoList = response.videos;
      } else if (response?.data && Array.isArray(response.data)) {
        videoList = response.data;
      } else if (Array.isArray(response)) {
        videoList = response;
      }

      setVideos(videoList);
      setTotalPages(response?.totalPages || response?.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      showMessage('Failed to load videos', 'error');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters, searchQuery]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleDelete = async (video) => {
    setDeleteConfirm(video);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const videoId = deleteConfirm._id || deleteConfirm.id;
      await videoService.deleteVideo(videoId);
      showMessage('Video deleted successfully');
      setVideos((prev) =>
        prev.filter((v) => (v._id || v.id) !== videoId)
      );
    } catch (error) {
      showMessage('Failed to delete video', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleDownload = async (video) => {
    try {
      const videoId = video._id || video.id;

      const response = await api.get(`/videos/download/${videoId}`, {
        responseType: 'blob',
      });

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = `${video.title || 'video'}.${video.format || 'mp4'}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+?)"?$/);
        if (match) filename = match[1];
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      showMessage('Failed to download video', 'error');
    }
  };

  const handleShare = (video) => {
    const videoId = video._id || video.id;
    const url = `${window.location.origin}/watch/${videoId}`;
    navigator.clipboard.writeText(url).then(() => {
      showMessage('Video link copied to clipboard');
    }).catch(() => {
      showMessage('Failed to copy link', 'error');
    });
  };

  const clearFilters = () => {
    setFilters({ status: 'all', sortBy: 'newest' });
    setSearchQuery('');
    setPage(1);
  };

  const hasActiveFilters = filters.status !== 'all' || searchQuery;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">My Videos</h1>
              <p className="text-slate-400 mt-1">Manage your encrypted video collection</p>
            </div>
            <Link to="/upload" className="btn-primary inline-flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload New
            </Link>
          </div>
        </motion.div>

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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
                <Search className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search videos by title..."
                className="input-field py-2.5"
                style={{ paddingLeft: '48px', paddingRight: searchQuery ? '40px' : '16px' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 z-10 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-800/60 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'grid'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'list'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-secondary p-2.5 ${showFilters ? 'border-cyan-500/50' : ''}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-slate-700/50 mt-4 pt-4 flex flex-wrap items-center gap-4">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => {
                        setFilters((prev) => ({ ...prev, status: e.target.value }));
                        setPage(1);
                      }}
                      className="input-field py-2 text-sm"
                    >
                      <option value="all">All Videos</option>
                      <option value="ENCRYPTED">Encrypted</option>
                      <option value="UNENCRYPTED">Unencrypted</option>
                      <option value="PROCESSING">Processing</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => {
                        setFilters((prev) => ({ ...prev, sortBy: e.target.value }));
                        setPage(1);
                      }}
                      className="input-field py-2 text-sm"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="name">Name A-Z</option>
                      <option value="size">Size</option>
                    </select>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-cyan-400 hover:text-cyan-300 mt-5"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="glass-card overflow-hidden animate-pulse">
                <div className="aspect-video bg-slate-800" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                  <div className="h-3 bg-slate-800 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length > 0 ? (
          <>
            <motion.div
              layout
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              }
            >
              <AnimatePresence>
                {videos.map((video) => (
                  <VideoCard
                    key={video._id || video.id}
                    video={video}
                    onDelete={handleDelete}
                    onDownload={handleDownload}
                    onShare={handleShare}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={p === page ? 'pagination-btn-active' : 'pagination-btn'}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-12 text-center"
          >
            {hasActiveFilters ? (
              <>
                <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No videos found</h3>
                <p className="text-slate-400 mb-4">
                  No videos match your search criteria. Try adjusting your filters.
                </p>
                <button onClick={clearFilters} className="btn-secondary">
                  <RefreshCw className="w-4 h-4 mr-2 inline" />
                  Clear Filters
                </button>
              </>
            ) : (
              <>
                <Upload className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No videos yet</h3>
                <p className="text-slate-400 mb-4">
                  Upload your first video and encrypt it with our hybrid cryptography system.
                </p>
                <Link to="/upload" className="btn-primary inline-flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Video
                </Link>
              </>
            )}
          </motion.div>
        )}

        <AnimatePresence>
          {deleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-overlay"
              onClick={() => setDeleteConfirm(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white text-center mb-2">
                  Delete Video?
                </h3>
                <p className="text-sm text-slate-400 text-center mb-6">
                  This action cannot be undone. The encrypted video and all associated data will be
                  permanently deleted.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="btn-secondary flex-1 py-2.5"
                  >
                    Cancel
                  </button>
                  <button onClick={confirmDelete} className="btn-danger flex-1 py-2.5">
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MyVideos;