// frontend/src/components/VideoCard.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play,
  Lock,
  Unlock,
  Download,
  Share2,
  Trash2,
  Eye,
  Calendar,
  Shield,
  MoreVertical,
} from 'lucide-react';

const VideoCard = ({ video, onDelete, onDownload, onShare }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const videoId = video?._id || video?.id || '';
  const videoTitle = video?.title || 'Untitled Video';
  const videoDescription = video?.description || '';
  const videoFileSize = video?.fileSize || video?.size || 0;
  const videoFormat = video?.format || 'MP4';
  const videoDuration = video?.duration || 0;
  const videoViews = video?.views || 0;
  const videoCreatedAt = video?.createdAt || video?.uploadDate || null;
  const encryptionStatus = video?.encryptionStatus || 'UNENCRYPTED';
  const thumbnailUrl = video?.thumbnailUrl || null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Unknown';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Unknown';
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Unknown';
    const numBytes = Number(bytes);
    if (isNaN(numBytes)) return 'Unknown';
    if (numBytes < 1024) return numBytes + ' B';
    if (numBytes < 1024 * 1024) return (numBytes / 1024).toFixed(1) + ' KB';
    if (numBytes < 1024 * 1024 * 1024) return (numBytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (numBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const getStatusBadge = () => {
    if (encryptionStatus === 'ENCRYPTED') {
      return (
        <span className="badge-success flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Encrypted
        </span>
      );
    }
    if (
      encryptionStatus === 'PROCESSING' ||
      encryptionStatus === 'ENCRYPTING_AES' ||
      encryptionStatus === 'CHUNKED' ||
      encryptionStatus === 'AES_DONE'
    ) {
      return (
        <span className="badge-warning flex items-center gap-1">
          <Shield className="w-3 h-3 animate-pulse" />
          Processing
        </span>
      );
    }
    return (
      <span className="badge-error flex items-center gap-1">
        <Unlock className="w-3 h-3" />
        Unencrypted
      </span>
    );
  };

  const durationFormatted = formatDuration(videoDuration);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="video-card group"
    >
      <div className="relative aspect-video bg-slate-800 overflow-hidden">
        {thumbnailUrl && !imageError ? (
          <img
            src={thumbnailUrl}
            alt={videoTitle}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            <VideoPlaceholder />
          </div>
        )}

        <Link
          to={`/watch/${videoId}`}
          className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-300"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ opacity: 1, scale: 1 }}
            className="w-14 h-14 rounded-full bg-cyan-500/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg shadow-cyan-500/30"
          >
            <Play className="w-6 h-6 text-white ml-0.5" />
          </motion.div>
        </Link>

        {durationFormatted && (
          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-xs font-medium backdrop-blur-sm">
            {durationFormatted}
          </span>
        )}

        <span className="absolute top-2 left-2">{getStatusBadge()}</span>

        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 mt-1 w-36 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow-2xl py-1 z-20"
              >
                {onDownload && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDownload(video);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                )}
                {onShare && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onShare(video);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                )}
                {onDelete && (
                  <>
                    <div className="border-t border-slate-700/50 my-1" />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(video);
                        setMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        <Link to={`/watch/${videoId}`} className="block">
          <h3 className="text-white font-semibold text-sm mb-1.5 line-clamp-1 hover:text-cyan-400 transition-colors">
            {videoTitle}
          </h3>
        </Link>

        {videoDescription && (
          <p className="text-slate-500 text-xs mb-3 line-clamp-2">{videoDescription}</p>
        )}

        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(videoCreatedAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>{videoViews}</span>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-800/50 flex items-center justify-between">
          <span className="text-xs text-slate-500">{formatFileSize(videoFileSize)}</span>
          <span className="text-xs text-slate-600 uppercase">{videoFormat}</span>
        </div>
      </div>
    </motion.div>
  );
};

const VideoPlaceholder = () => (
  <svg
    className="w-16 h-16 text-slate-600"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M10 9l5 3-5 3V9z" />
  </svg>
);

export default VideoCard;