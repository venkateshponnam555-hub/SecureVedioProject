// frontend/src/pages/WatchVideo.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Download,
  Share2,
  Shield,
  Lock,
  Key,
  Eye,
  Calendar,
  HardDrive,
  Clock,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import EncryptionStatusCard from '../components/EncryptionStatusCard';
import { videoService } from '../services/videoService';

const WatchVideo = () => {
  const { id } = useParams();
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [videoBlobUrl, setVideoBlobUrl] = useState(null);
 
  const [shareLoading, setShareLoading] = useState(false);
  const controlsTimeout = useRef(null);

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  useEffect(() => {
    fetchVideo();
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);
    };
  }, [id]);

  const fetchVideo = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await videoService.getVideoById(id);
      setVideo(data);

      if (data.encryptionStatus === 'ENCRYPTED') {
        await loadEncryptedVideo(id);
      } else if (data.encryptionStatus === 'UNENCRYPTED') {
        await loadUnencryptedVideo(id);
      }
    } catch (err) {
      console.error('Failed to fetch video:', err);
      if (err.response?.status === 404) {
        setError('Video not found.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view this video.');
      } else {
        setError('Failed to load video. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadEncryptedVideo = async (videoId) => {
    try {
      const streamUrl = videoService.getStreamUrl(videoId);
      const token = localStorage.getItem('token');
      const response = await fetch(streamUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.startsWith('video/')) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setVideoBlobUrl(url);
        } else {
          showMessage('This video is encrypted. Use the share link to play it.', 'info');
        }
      }
    } catch (err) {
      console.error('Failed to load encrypted video:', err);
      showMessage('Failed to load encrypted video', 'error');
    }
  };

  const loadUnencryptedVideo = async (videoId) => {
    try {
      const streamUrl = videoService.getStreamUrl(videoId);
      const token = localStorage.getItem('token');
      const response = await fetch(streamUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setVideoBlobUrl(url);
      }
    } catch (err) {
      console.error('Failed to load unencrypted video:', err);
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {
        showMessage('Failed to play video.', 'error');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeToggle = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    if (videoRef.current) {
      videoRef.current.currentTime = percentage * duration;
      setCurrentTime(percentage * duration);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const handleDownload = async () => {
    try {
      const url = videoService.getDownloadUrl(id);
      window.open(url, '_blank');
    } catch (err) {
      showMessage('Failed to download video', 'error');
    }
  };

  const handleShare = async () => {
    setShareLoading(true);
    try {
      const videoId = video?._id || video?.id || id;
      const receiverEmail = prompt('Enter receiver email address:');

      if (!receiverEmail || !receiverEmail.trim()) {
        setShareLoading(false);
        return;
      }

      const response = await videoService.shareVideo(videoId, {
        receiverEmail: receiverEmail.trim()
      });

      
      showMessage('Share link sent successfully');
    } catch (err) {
      console.error('Share failed:', err);
      showMessage(err.response?.data?.message || 'Failed to generate share link', 'error');
    } finally {
      setShareLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return mb.toFixed(1) + ' MB';
    return (mb / 1024).toFixed(2) + ' GB';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="glass-card p-12 text-center max-w-md mx-auto">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link to="/my-videos" className="btn-primary">
            <ArrowLeft className="w-4 h-4 mr-2 inline" />
            Back to My Videos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-3 rounded-xl text-sm text-center ${
              messageType === 'error'
                ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                : messageType === 'info'
                ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            }`}
          >
            {message}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-4">
          <Link
            to="/my-videos"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to My Videos</span>
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <div
              ref={playerContainerRef}
              className="relative bg-black rounded-2xl overflow-hidden shadow-2xl group"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => isPlaying && setShowControls(false)}
            >
              {videoBlobUrl ? (
                <video
                  ref={videoRef}
                  src={videoBlobUrl}
                  className="w-full aspect-video object-contain bg-black cursor-pointer"
                  onClick={handlePlayPause}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />
              ) : (
                <div className="w-full aspect-video bg-slate-900 flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Encrypted video requires share link to play</p>
                  </div>
                </div>
              )}

              {!isPlaying && videoBlobUrl && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
                  onClick={handlePlayPause}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-20 h-20 rounded-full bg-cyan-500/90 flex items-center justify-center shadow-lg shadow-cyan-500/30"
                  >
                    <Play className="w-10 h-10 text-white ml-1" />
                  </motion.div>
                </div>
              )}

              {videoBlobUrl && (
                <div
                  className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 transition-opacity duration-300 ${
                    showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <div
                    className="w-full h-1.5 bg-slate-600/50 rounded-full mb-3 cursor-pointer group/progress"
                    onClick={handleSeek}
                  >
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full relative"
                      style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={handlePlayPause} className="text-white hover:text-cyan-400 transition-colors">
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                      <button onClick={() => { if (videoRef.current) { videoRef.current.currentTime -= 10; } }} className="text-white/70 hover:text-white transition-colors">
                        <SkipBack className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if (videoRef.current) { videoRef.current.currentTime += 10; } }} className="text-white/70 hover:text-white transition-colors">
                        <SkipForward className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-2 group/volume">
                        <button onClick={handleVolumeToggle} className="text-white/70 hover:text-white transition-colors">
                          {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-20 h-1 bg-slate-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                        />
                      </div>
                      <span className="text-white text-xs ml-2">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    <button onClick={handleFullscreen} className="text-white/70 hover:text-white transition-colors">
                      {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6 mt-6"
            >
              <h1 className="text-2xl font-bold text-white mb-2">
                {video?.title || 'Untitled Video'}
              </h1>
              {video?.description && (
                <p className="text-slate-400 mb-4">{video.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {video?.views || 0} views
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {video?.createdAt ? new Date(video.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }) : 'Unknown date'}
                </span>
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4" />
                  {formatBytes(video?.fileSize)}
                </span>
                {video?.duration && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {formatTime(video.duration)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-700/50">
                <button onClick={handleDownload} className="btn-secondary py-2 px-4 text-sm">
                  <Download className="w-4 h-4 mr-1.5 inline" />
                  Download
                </button>
                <button
                  onClick={handleShare}
                  disabled={shareLoading}
                  className="btn-secondary py-2 px-4 text-sm"
                >
                  <Share2 className="w-4 h-4 mr-1.5 inline" />
                  {shareLoading ? 'Generating...' : 'Share'}
                </button>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <EncryptionStatusCard
              video={video}
              encryptionDetails={video?.encryptionDetails}
            />

            <div className="glass-card p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                Security Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="text-sm text-white font-medium">AES-256 Encryption</p>
                    <p className="text-xs text-slate-500">Video content encrypted with AES-256-GCM</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                  <Key className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="text-sm text-white font-medium">ECC Key Exchange</p>
                    <p className="text-xs text-slate-500">P-521 curve for secure key agreement</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-sm text-white font-medium">RSA-4096 Protected</p>
                    <p className="text-xs text-slate-500">Session keys wrapped with RSA</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-white font-semibold mb-4">Video Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Format</span>
                  <span className="text-white uppercase">{video?.format || 'MP4'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Resolution</span>
                  <span className="text-white">{video?.resolution || '1920x1080'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">File Size</span>
                  <span className="text-white">{formatBytes(video?.fileSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className={video?.encryptionStatus === 'ENCRYPTED' ? 'text-emerald-400' : 'text-red-400'}>
                    {video?.encryptionStatus || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

       
      </div>
    </div>
  );
};

export default WatchVideo;