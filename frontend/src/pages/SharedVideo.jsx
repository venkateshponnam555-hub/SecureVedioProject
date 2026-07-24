import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  Mail,
  Hash,
} from 'lucide-react';
import { videoService } from '../services/videoService';
import { api } from '../services/api';

const OTP_STATE_PREFIX = 'secureVideoOtpState:';

const getOtpStorageKey = (shareToken) =>
  `${OTP_STATE_PREFIX}${shareToken}`;

const readStoredOtpState = (shareToken) => {
  try {
    const raw = localStorage.getItem(getOtpStorageKey(shareToken));
    if (!raw) return null;

    const state = JSON.parse(raw);

    if (
      state?.shareToken !== shareToken ||
      !state?.otpSent ||
      !state?.otpExpiresAt
    ) {
      localStorage.removeItem(getOtpStorageKey(shareToken));
      return null;
    }

    if (Date.now() >= new Date(state.otpExpiresAt).getTime()) {
      localStorage.removeItem(getOtpStorageKey(shareToken));
      return null;
    }

    return state;
  } catch {
    localStorage.removeItem(getOtpStorageKey(shareToken));
    return null;
  }
};

const saveOtpState = (shareToken, data = {}) => {
  const state = {
    shareToken,
    otpSent: true,
    otpExpiresAt:
      data.otpExpiresAt ||
      new Date(
        Date.now() +
          (data.otpExpiresInMinutes || 5) * 60 * 1000
      ).toISOString(),
    resendAvailableAt:
      data.resendAvailableAt ||
      new Date(
        Date.now() +
          (data.resendCooldownSeconds ?? 60) * 1000
      ).toISOString(),
    receiverEmailMasked: data.receiverEmailMasked || '',
  };

  localStorage.setItem(
    getOtpStorageKey(shareToken),
    JSON.stringify(state)
  );

  return state;
};

const clearOtpState = (shareToken) => {
  localStorage.removeItem(getOtpStorageKey(shareToken));
};

const getRemainingSeconds = (dateValue) => {
  if (!dateValue) return 0;

  const targetTime = new Date(dateValue).getTime();

  if (Number.isNaN(targetTime)) return 0;

  return Math.max(
    0,
    Math.ceil((targetTime - Date.now()) / 1000)
  );
};

const SharedVideo = () => {
  const { shareToken } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareData, setShareData] = useState(null);

  // OTP states
  const [otp, setOtp] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [wrongReceiver, setWrongReceiver] = useState(false);

  // Key exchange states
  const [sharedSecret, setSharedSecret] = useState(null);
  const [encryptedAesKey, setEncryptedAesKey] = useState(null);
  const [exchangeLoading, setExchangeLoading] = useState(false);
  const [exchangeError, setExchangeError] = useState('');

  // Stream states
  const [videoBlobUrl, setVideoBlobUrl] = useState(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState('');

  const otpRequestedRef = useRef(false);
  const resendTimerRef = useRef(null);
  const videoBlobUrlRef = useRef(null);

  const isLoggedIn = !!localStorage.getItem('token');

  const restoreOtpUi = (state) => {
    if (!state) return false;

    setOtpSent(true);
    setMaskedEmail(
      state.receiverEmailMasked || maskedEmail
    );
    setResendSeconds(
      getRemainingSeconds(state.resendAvailableAt)
    );
    setOtpMessage(
      'OTP was already sent. Enter the same OTP from your email.'
    );

    return true;
  };

  const fetchShareData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/share/${shareToken}`);
      const data = response.data;

      setShareData(data);

      if (data.receiverEmailMasked) {
        setMaskedEmail(data.receiverEmailMasked);
      }

      if (data.receiverVerified) {
        setOtpVerified(true);
        setOtpSent(true);
        clearOtpState(shareToken);
        return;
      }

      /*
       * Backend is the source of truth. When an OTP is still valid,
       * restore the OTP form instead of automatically sending another one.
       */
      if (data.otpPending && data.otpExpiresAt) {
        const restoredState = saveOtpState(shareToken, {
          otpExpiresAt: data.otpExpiresAt,
          resendAvailableAt: data.resendAvailableAt,
          receiverEmailMasked: data.receiverEmailMasked,
          resendCooldownSeconds: 0,
        });

        restoreOtpUi(restoredState);
        otpRequestedRef.current = true;
        return;
      }

      /*
       * localStorage covers temporary app switching or page restoration
       * while the backend request is still being completed.
       */
      const storedState = readStoredOtpState(shareToken);

      if (storedState) {
        restoreOtpUi(storedState);
        otpRequestedRef.current = true;
      } else {
        clearOtpState(shareToken);
      }
    } catch (err) {
      console.error('Failed to access shared video:', err);

      if (err.response?.status === 410) {
        setError('This share link has expired.');
      } else if (err.response?.status === 403) {
        setError('This share link has already been used.');
      } else if (err.response?.status === 404) {
        setError('Invalid share link.');
      } else {
        setError(
          err.response?.data?.message ||
            'Failed to access shared video.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    otpRequestedRef.current = false;
    fetchShareData();

    return () => {
      if (videoBlobUrlRef.current) {
        URL.revokeObjectURL(videoBlobUrlRef.current);
      }

      if (resendTimerRef.current) {
        clearInterval(resendTimerRef.current);
      }
    };
  }, [shareToken]);

  useEffect(() => {
    videoBlobUrlRef.current = videoBlobUrl;
  }, [videoBlobUrl]);

  // Check login and redirect if needed
  useEffect(() => {
    if (!loading && shareData && !isLoggedIn) {
      sessionStorage.setItem(
        'pendingSharePath',
        `/share/${shareToken}`
      );
      navigate('/login', { replace: true });
    }
  }, [
    loading,
    shareData,
    isLoggedIn,
    navigate,
    shareToken,
  ]);

  // Auto-send only when no valid OTP session can be restored.
  useEffect(() => {
    if (
      !loading &&
      shareData &&
      isLoggedIn &&
      !otpVerified &&
      !otpSent &&
      !otpRequestedRef.current
    ) {
      otpRequestedRef.current = true;
      handleSendOtp();
    }
  }, [
    loading,
    shareData,
    isLoggedIn,
    otpVerified,
    otpSent,
  ]);

  // Resend countdown
  useEffect(() => {
    if (resendTimerRef.current) {
      clearInterval(resendTimerRef.current);
    }

    if (resendSeconds <= 0) {
      return undefined;
    }

    resendTimerRef.current = setInterval(() => {
      setResendSeconds((previous) => {
        if (previous <= 1) {
          clearInterval(resendTimerRef.current);
          resendTimerRef.current = null;
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      if (resendTimerRef.current) {
        clearInterval(resendTimerRef.current);
        resendTimerRef.current = null;
      }
    };
  }, [resendSeconds > 0]);

  const handleSendOtp = async () => {
    setOtpSending(true);
    setOtpMessage('');
    setOtpError('');
    setWrongReceiver(false);

    try {
      const response = await api.post(
        `/share/send-otp/${shareToken}`
      );

      const data = response.data;

      if (data.alreadyVerified) {
        setOtpVerified(true);
        setOtpSent(true);
        setOtpMessage('You are already verified.');
        clearOtpState(shareToken);
        return;
      }

      const storedState = saveOtpState(
        shareToken,
        data
      );

      setOtpSent(true);
      setOtpMessage(
        data.alreadySent
          ? 'OTP was already sent and is still valid.'
          : data.message || 'OTP sent successfully'
      );
      setMaskedEmail(
        data.receiverEmailMasked ||
          storedState.receiverEmailMasked ||
          maskedEmail
      );
      setResendSeconds(
        getRemainingSeconds(
          storedState.resendAvailableAt
        )
      );
      setOtp('');
      setOtpError('');
    } catch (err) {
      if (err.response?.status === 403) {
        setWrongReceiver(true);
        setOtpError(
          'This video was shared with a different email account.'
        );
      } else if (err.response?.status === 401) {
        sessionStorage.setItem(
          'pendingSharePath',
          `/share/${shareToken}`
        );
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
      } else {
        setOtpError(
          err.response?.data?.message ||
            'Failed to send OTP'
        );
      }
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;

    setOtpVerifying(true);
    setOtpError('');

    try {
      const response = await api.post(
        `/share/verify-otp/${shareToken}`,
        { otp }
      );

      if (response.data.verified) {
        setOtpVerified(true);
        setOtpSent(true);
        setOtpMessage(
          'Email verified successfully!'
        );
        setOtpError('');
        setResendSeconds(0);
        setOtp('');
        clearOtpState(shareToken);
      }
    } catch (err) {
      const message =
        err.response?.data?.message || 'Invalid OTP';

      setOtpError(message);

      if (
        message.toLowerCase().includes('expired') ||
        message.toLowerCase().includes(
          'request a new otp'
        )
      ) {
        clearOtpState(shareToken);
        setOtpSent(false);
        setResendSeconds(0);
        otpRequestedRef.current = true;
      }

      if (err.response?.status === 401) {
        sessionStorage.setItem(
          'pendingSharePath',
          `/share/${shareToken}`
        );
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
      }
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleKeyExchange = async () => {
    setExchangeLoading(true);
    setExchangeError('');
    try {
      const eccKeyPair = await generateECCKeyPair();
      const receiverPublicKey = eccKeyPair.publicKey;

      const response = await api.post(`/share/key-exchange/${shareToken}`, {
        receiverPublicKey: receiverPublicKey,
      });

      setSharedSecret(response.data.sharedSecret);
      setEncryptedAesKey(response.data.encryptedAesKey);
    } catch (err) {
      console.error('Key exchange failed:', err);
      setExchangeError(err.response?.data?.message || 'ECC key exchange failed.');
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
    return { publicKey: publicKeyBase64, privateKey: keyPair.privateKey };
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
    setStreamError('');
    try {
      const streamUrl = videoService.getStreamUrl(shareData.videoId);
      const url = `${streamUrl}?sharedSecret=${encodeURIComponent(sharedSecret)}&encryptedAesKey=${encodeURIComponent(encryptedAesKey)}`;
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setVideoBlobUrl(blobUrl);
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          setStreamError(errorData.message || 'Failed to stream video');
        } else {
          setStreamError('Failed to stream video');
        }
      }
    } catch (err) {
      console.error('Stream failed:', err);
      setStreamError('Failed to stream video');
    } finally {
      setStreamLoading(false);
    }
  };

  const handleOtpInputChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(value);
    if (otpError) setOtpError('');
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
            {shareData?.senderId || 'Someone'} shared a video with you
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
              <span className="text-white">{shareData?.senderId || 'Unknown'}</span>
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
            {/* Step 1: Link Verified */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm text-white font-medium">Share Link Verified</p>
                <p className="text-xs text-slate-500">Link is valid and active</p>
              </div>
            </div>

            {/* Step 2: Receiver Login Verified */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${
              isLoggedIn
                ? 'bg-emerald-500/5 border-emerald-500/10'
                : 'bg-slate-800/20 border-slate-700/10'
            }`}>
              {isLoggedIn ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-600" />
              )}
              <div>
                <p className="text-sm text-white font-medium">Receiver Login Verified</p>
                <p className="text-xs text-slate-500">
                  {isLoggedIn ? 'Logged in successfully' : 'Login required'}
                </p>
              </div>
            </div>

            {/* Step 3: OTP Verification */}
            <div className={`p-4 rounded-xl border ${
              otpVerified
                ? 'bg-emerald-500/5 border-emerald-500/10'
                : wrongReceiver
                ? 'bg-red-500/5 border-red-500/10'
                : 'bg-slate-800/20 border-slate-700/10'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                {otpVerified ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : otpSending ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <RefreshCw className="w-5 h-5 text-cyan-400" />
                  </motion.div>
                ) : (
                  <Mail className="w-5 h-5 text-slate-500" />
                )}
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">Email OTP Verification</p>
                  <p className="text-xs text-slate-500">
                    {otpVerified
                      ? 'Email verified successfully'
                      : wrongReceiver
                      ? 'This video was shared with a different email account'
                      : maskedEmail
                      ? `OTP sent to ${maskedEmail}`
                      : 'Verify your email with OTP'}
                  </p>
                </div>
              </div>

              {!otpVerified && !wrongReceiver && (
                <div className="space-y-3">
                  {otpSent && (
                    <>
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete="one-time-code"
                          maxLength={6}
                          value={otp}
                          onChange={handleOtpInputChange}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && otp.length === 6 && !otpVerifying) {
                              handleVerifyOtp();
                            }
                          }}
                          placeholder="Enter 6-digit OTP"
                          className="input-field text-sm text-center tracking-widest"
                          disabled={otpVerifying}
                          style={{ letterSpacing: '0.5em' }}
                        />
                      </div>
                      {otpError && (
                        <p className="text-red-400 text-xs">{otpError}</p>
                      )}
                      {otpMessage && (
                        <p className="text-emerald-400 text-xs">{otpMessage}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleVerifyOtp}
                          disabled={otp.length !== 6 || otpVerifying}
                          className="btn-primary py-1.5 px-4 text-xs disabled:opacity-50"
                        >
                          {otpVerifying ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                          ) : (
                            'Verify OTP'
                          )}
                        </button>
                        <button
                          onClick={handleSendOtp}
                          disabled={resendSeconds > 0 || otpSending}
                          className="btn-secondary py-1.5 px-3 text-xs"
                        >
                          {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend OTP'}
                        </button>
                      </div>
                    </>
                  )}
                  {!otpSent && otpSending && (
                    <p className="text-xs text-slate-400">Sending OTP...</p>
                  )}
                  {otpError && otpError.includes('different email') && (
                    <p className="text-red-400 text-xs">{otpError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Step 4: ECC Key Exchange */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${
              sharedSecret
                ? 'bg-emerald-500/5 border-emerald-500/10'
                : exchangeLoading
                ? 'bg-cyan-500/5 border-cyan-500/10'
                : !otpVerified
                ? 'bg-slate-800/20 border-slate-700/10 opacity-50'
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
                    : !otpVerified
                    ? 'Verify OTP first'
                    : exchangeError
                    ? exchangeError
                    : 'Establish secure connection using P-521 curve'}
                </p>
              </div>
              {otpVerified && !sharedSecret && !exchangeLoading && (
                <button onClick={handleKeyExchange} className="btn-primary py-1.5 px-4 text-xs">
                  Start Exchange
                </button>
              )}
            </div>

            {/* Step 5: Watch Video */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${
              sharedSecret && encryptedAesKey
                ? 'bg-cyan-500/5 border-cyan-500/10'
                : 'bg-slate-800/20 border-slate-700/10 opacity-50'
            }`}>
              <Play className={`w-5 h-5 ${sharedSecret && encryptedAesKey ? 'text-cyan-400' : 'text-slate-500'}`} />
              <div className="flex-1">
                <p className="text-sm text-white font-medium">Watch Video</p>
                <p className="text-xs text-slate-500">
                  {streamError
                    ? streamError
                    : sharedSecret && encryptedAesKey
                    ? 'Ready to decrypt and stream'
                    : 'Complete previous steps first'}
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
            <span className="badge-info">OTP Verified</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SharedVideo;