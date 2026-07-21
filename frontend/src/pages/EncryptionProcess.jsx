// frontend/src/pages/EncryptionProcess.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Key,
  Layers,
  Fingerprint,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Play,
  RefreshCw,
} from 'lucide-react';
import ProgressBar from '../components/ProgressBar';
import EncryptionStatusCard from '../components/EncryptionStatusCard';
import { videoService } from '../services/videoService';

const EncryptionProcess = () => {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [encryptionProgress, setEncryptionProgress] = useState(0);
  const [encryptionStatus, setEncryptionStatus] = useState('processing');
  const [encryptionDetails, setEncryptionDetails] = useState({
    chunking: 'pending',
    aes: 'pending',
    ecc: 'pending',
    rsa: 'pending',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const pollInterval = useRef(null);

  useEffect(() => {
    fetchVideoDetails();
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [id]);

  const fetchVideoDetails = async () => {
    setPageLoading(true);
    setError('');
    try {
      const data = await videoService.getVideoById(id);

      if (!data) {
        setError('Video not found');
        setPageLoading(false);
        return;
      }

      setVideo(data);

      const status = data.encryptionStatus || data.status || 'PENDING';

      if (status === 'ENCRYPTED') {
        setEncryptionProgress(100);
        setEncryptionStatus('completed');
        setEncryptionDetails({
          chunking: 'completed',
          aes: 'completed',
          ecc: 'completed',
          rsa: 'completed',
        });
        setSuccessMessage('Encryption completed successfully!');
        stopPolling();
      } else if (status === 'FAILED') {
        setEncryptionStatus('error');
        setError(data.error || 'Encryption failed');
        stopPolling();
      } else {
        setEncryptionStatus('encrypting');
        startPolling();
      }
    } catch (err) {
      console.error('Failed to fetch video:', err);
      if (err.response?.status === 404) {
        setError('Video not found');
      } else if (err.response?.status === 403) {
        setError('Access denied');
      } else {
        setError('Failed to load video details');
      }
    } finally {
      setPageLoading(false);
    }
  };

  const startPolling = () => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
    }
    pollInterval.current = setInterval(async () => {
      try {
        const status = await videoService.getEncryptionStatus(id);
        updateProgress(status);
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);
  };

  const stopPolling = () => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  };

  const updateProgress = (status) => {
    if (!status) return;

    const progressMap = {
      PENDING: 0,
      CHUNKING: 15,
      CHUNKED: 25,
      ENCRYPTING_AES: 40,
      AES_DONE: 50,
      ECC_EXCHANGE: 65,
      ECC_DONE: 75,
      RSA_WRAPPING: 85,
      RSA_DONE: 90,
      FINALIZING: 95,
      ENCRYPTED: 100,
    };

    const stage = status?.stage || 'PENDING';
    const progress = progressMap[stage] || 0;

    setEncryptionProgress(progress);

    if (stage === 'ENCRYPTED') {
      setEncryptionStatus('completed');
      setEncryptionDetails({
        chunking: 'completed',
        aes: 'completed',
        ecc: 'completed',
        rsa: 'completed',
      });
      stopPolling();
      setVideo((prev) => prev ? { ...prev, encryptionStatus: 'ENCRYPTED' } : null);
      setSuccessMessage('Encryption completed successfully!');
    } else if (stage === 'FAILED') {
      setEncryptionStatus('error');
      setError(status?.error || 'Encryption failed');
      stopPolling();
    } else {
      setEncryptionStatus('encrypting');
      setEncryptionDetails({
        chunking: stage === 'CHUNKING' || stage === 'CHUNKED' ? 'in-progress' :
                  progress > 25 ? 'completed' : 'pending',
        aes: stage === 'ENCRYPTING_AES' ? 'in-progress' :
             progress > 50 ? 'completed' : 'pending',
        ecc: stage === 'ECC_EXCHANGE' ? 'in-progress' :
             progress > 75 ? 'completed' : 'pending',
        rsa: stage === 'RSA_WRAPPING' ? 'in-progress' :
             progress > 90 ? 'completed' : 'pending',
      });
    }
  };

  const handleRetry = async () => {
    setEncryptionStatus('processing');
    setEncryptionProgress(0);
    setEncryptionDetails({
      chunking: 'pending',
      aes: 'pending',
      ecc: 'pending',
      rsa: 'pending',
    });
    setError('');
    setSuccessMessage('');

    try {
      await videoService.encryptVideo(id);
      setEncryptionStatus('encrypting');
      startPolling();
    } catch (err) {
      setEncryptionStatus('error');
      setError(err.response?.data?.message || 'Failed to start encryption');
    }
  };

  const encryptionSteps = [
    {
      icon: Layers,
      label: 'Video Chunking',
      description: 'Splitting video into secure segments for parallel encryption',
      status: encryptionDetails?.chunking || 'pending',
    },
    {
      icon: Lock,
      label: 'AES-256 Encryption',
      description: 'Encrypting each chunk with unique symmetric keys using GCM mode',
      status: encryptionDetails?.aes || 'pending',
    },
    {
      icon: Key,
      label: 'ECC Key Exchange',
      description: 'Establishing secure key agreement using P-521 elliptic curve',
      status: encryptionDetails?.ecc || 'pending',
    },
    {
      icon: Fingerprint,
      label: 'RSA-4096 Protection',
      description: 'Wrapping session keys with asymmetric encryption for long-term security',
      status: encryptionDetails?.rsa || 'pending',
    },
  ];

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'in-progress':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <RefreshCw className="w-5 h-5 text-cyan-400" />
          </motion.div>
        );
      case 'failed':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-slate-600" />;
    }
  };

  if (pageLoading) {
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

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            {encryptionStatus === 'completed'
              ? 'Encryption Complete'
              : encryptionStatus === 'error'
              ? 'Encryption Failed'
              : 'Encrypting Video'}
          </h1>
          <p className="text-slate-400">
            {encryptionStatus === 'completed'
              ? 'Your video is now protected with hybrid multikey cryptography'
              : encryptionStatus === 'error'
              ? 'An error occurred during the encryption process'
              : 'Applying AES-256, ECC, and RSA-4096 hybrid encryption'}
          </p>
        </motion.div>

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center font-medium"
          >
            <CheckCircle className="w-5 h-5 inline mr-2" />
            {successMessage}
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
          >
            <AlertTriangle className="w-5 h-5 inline mr-2" />
            {error}
          </motion.div>
        )}

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <ProgressBar
            progress={encryptionProgress}
            status={encryptionStatus}
            label={
              encryptionStatus === 'completed'
                ? 'Encryption Complete'
                : encryptionStatus === 'error'
                ? 'Encryption Failed'
                : encryptionStatus === 'processing'
                ? 'Starting encryption...'
                : 'Encrypting...'
            }
            variant="detailed"
            size="lg"
          />
        </motion.div>

        {/* Encryption Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Encryption Process
          </h2>
          <div className="space-y-1">
            {encryptionSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                  step.status === 'in-progress'
                    ? 'bg-cyan-500/10 border border-cyan-500/20'
                    : step.status === 'completed'
                    ? 'bg-emerald-500/5 border border-emerald-500/10'
                    : step.status === 'failed'
                    ? 'bg-red-500/5 border border-red-500/10'
                    : 'bg-slate-800/20 border border-slate-700/10'
                }`}
              >
                <div className="flex-shrink-0">{getStepIcon(step.status)}</div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium text-sm ${
                      step.status === 'completed'
                        ? 'text-emerald-400'
                        : step.status === 'in-progress'
                        ? 'text-cyan-400'
                        : step.status === 'failed'
                        ? 'text-red-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                </div>
                {index < encryptionSteps.length - 1 && (
                  <div
                    className={`w-px h-8 ${
                      step.status === 'completed' ? 'bg-emerald-500/30' : 'bg-slate-700/30'
                    }`}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Encryption Status Card */}
        {video && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <EncryptionStatusCard
              video={video}
              encryptionDetails={encryptionDetails}
            />
          </motion.div>
        )}

        {/* Error State with Retry */}
        {encryptionStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-6 border-red-500/20"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-1">Encryption Error</h3>
                <p className="text-sm text-slate-400 mb-4">
                  {error || 'An unexpected error occurred during the encryption process.'}
                </p>
                <button onClick={handleRetry} className="btn-primary py-2 px-6 text-sm">
                  <RefreshCw className="w-4 h-4 mr-2 inline" />
                  Retry Encryption
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons - Only show when complete */}
        {encryptionStatus === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center gap-4"
          >
            <Link
              to={`/watch/${id}`}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              Watch Video
            </Link>
            <Link to="/my-videos" className="btn-secondary inline-flex items-center gap-2">
              <ArrowRight className="w-5 h-5" />
              My Videos
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EncryptionProcess;