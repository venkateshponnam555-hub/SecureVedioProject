// frontend/src/pages/SharedVideo.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Key,
  Video,
  AlertCircle,
  CheckCircle,
  Play,
  RefreshCw,
} from 'lucide-react';
import { videoService } from '../services/videoService';
import { api } from '../services/api';

const SharedVideo = () => {
  const { shareToken } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareData, setShareData] = useState(null);
  const [sharedSecret, setSharedSecret] = useState(null);
  const [encryptedAesKey, setEncryptedAesKey] = useState(null);
  const [exchangeLoading, setExchangeLoading] = useState(false);
  const [videoBlobUrl, setVideoBlobUrl] = useState(null);
  const [streamLoading, setStreamLoading] = useState(false);

  useEffect(() => {
    fetchShareData();
    return () => {
      if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);
    };
  }, [shareToken]);

  const fetchShareData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/share/${shareToken}`);
      setShareData(response.data);
    } catch (err) {
      console.error('Failed to access shared video:', err);
      if (err.response?.status === 410) {
        setError('This share link has expired.');
      } else if (err.response?.status === 403) {
        setError('This share link has already been used.');
      } else if (err.response?.status === 404) {
        setError('Invalid share link.');
      } else {
        setError(err.response?.data?.message || 'Failed to access shared video.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyExchange = async () => {
    setExchangeLoading(true);
    try {
      const eccKeyPair = await generateECCKeyPair();
      const receiverPublicKey = eccKeyPair.publicKey;

      const response = await api.post(`/share/key-exchange/${shareToken}`, {
        receiverPublicKey: receiverPublicKey
      });

      setSharedSecret(response.data.sharedSecret);
      setEncryptedAesKey(response.data.encryptedAesKey);
    } catch (err) {
      console.error('Key exchange failed:', err);
      setError(err.response?.data?.message || 'ECC key exchange failed.');
    } finally {
      setExchangeLoading(false);
    }
  };

  const generateECCKeyPair = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-521' },
      true,
      ['deriveBits']
    );

    const publicKeyRaw = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    const publicKeyBase64 = arrayBufferToBase64(publicKeyRaw);

    return {
      publicKey: publicKeyBase64,
      privateKey: keyPair.privateKey
    };
  };

  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const handleStreamVideo = async () => {
    if (!sharedSecret || !encryptedAesKey || !shareData) return;

    setStreamLoading(true);
    try {
      const streamUrl = videoService.getStreamUrl(shareData.videoId);
      const url = `${streamUrl}?sharedSecret=${encodeURIComponent(sharedSecret)}&encryptedAesKey=${encodeURIComponent(encryptedAesKey)}`;
      const response = await fetch(url);

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setVideoBlobUrl(url);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to stream video');
      }
    } catch (err) {
      console.error('Stream failed:', err);
      setError('Failed to stream video');
    } finally {
      setStreamLoading(false);
    }
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
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 text-center max-w-md"
        >
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link to="/" className="btn-primary inline-block">Go Home</Link>
        </motion.div>
      </div>
    );
  }

  if (videoBlobUrl) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-white">Video Ready</h1>
            <p className="text-slate-400">Decrypted successfully. Enjoy your secure video.</p>
          </motion.div>
          <div className="glass-card p-4">
            <video
              src={videoBlobUrl}
              controls
              className="w-full rounded-xl"
              style={{ maxHeight: '70vh' }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-slate-700/50 flex items-center justify-center">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Secure Video Share</h1>
          <p className="text-slate-400">
            {shareData?.senderName || 'Someone'} shared a video with you
          </p>
        </motion.div>

        {/* Video Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-400" />
            Video Information
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Title</span>
              <span className="text-white">{shareData?.title || 'Untitled Video'}</span>
            </div>
            {shareData?.description && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Description</span>
                <span className="text-white">{shareData.description}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">File Size</span>
              <span className="text-white">{formatBytes(shareData?.fileSize)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Format</span>
              <span className="text-white uppercase">{shareData?.format || 'MP4'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Shared By</span>
              <span className="text-white">{shareData?.senderName || 'Unknown'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Chunks</span>
              <span className="text-white">{shareData?.totalChunks || 0}</span>
            </div>
          </div>
        </motion.div>

        {/* Security Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            Security Verification
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm text-white font-medium">Share Link Verified</p>
                <p className="text-xs text-slate-500">Link is valid and active</p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-xl border ${
              sharedSecret
                ? 'bg-emerald-500/5 border-emerald-500/10'
                : exchangeLoading
                ? 'bg-cyan-500/5 border-cyan-500/10'
                : 'bg-slate-800/20 border-slate-700/10'
            }`}>
              {sharedSecret ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : exchangeLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <RefreshCw className="w-5 h-5 text-cyan-400" />
                </motion.div>
              ) : (
                <Key className="w-5 h-5 text-slate-500" />
              )}
              <div className="flex-1">
                <p className="text-sm text-white font-medium">ECC Key Exchange</p>
                <p className="text-xs text-slate-500">
                  {sharedSecret
                    ? 'Secure key exchange completed'
                    : 'Establish secure connection using P-521 curve'}
                </p>
              </div>
              {!sharedSecret && !exchangeLoading && (
                <button onClick={handleKeyExchange} className="btn-primary py-1.5 px-4 text-xs">Start Exchange</button>
              )}
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-xl border ${
              sharedSecret && encryptedAesKey
                ? 'bg-cyan-500/5 border-cyan-500/10'
                : 'bg-slate-800/20 border-slate-700/10 opacity-50'
            }`}>
              <Play className={`w-5 h-5 ${sharedSecret && encryptedAesKey ? 'text-cyan-400' : 'text-slate-500'}`} />
              <div className="flex-1">
                <p className="text-sm text-white font-medium">Watch Video</p>
                <p className="text-xs text-slate-500">
                  {sharedSecret && encryptedAesKey
                    ? 'Ready to decrypt and stream'
                    : 'Complete key exchange first'}
                </p>
              </div>
              {sharedSecret && encryptedAesKey && !streamLoading && (
                <button onClick={handleStreamVideo} className="btn-primary py-1.5 px-4 text-xs">
                  <Play className="w-3.5 h-3.5 mr-1" />Play
                </button>
              )}
              {streamLoading && (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full" />
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="text-sm font-semibold text-slate-400 mb-3">Protected By</h3>
          <div className="flex flex-wrap gap-2">
            <span className="badge-info">AES-256-GCM</span>
            <span className="badge-info">ECC P-521</span>
            <span className="badge-info">SHA-512</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SharedVideo;