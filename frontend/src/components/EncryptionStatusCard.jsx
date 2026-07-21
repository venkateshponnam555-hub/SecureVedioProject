// frontend/src/components/EncryptionStatusCard.jsx

import React from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Key,
  Fingerprint,
  CheckCircle,
  AlertTriangle,
  Clock,
  Cpu,
  Layers,
} from 'lucide-react';

const EncryptionStatusCard = ({ video, encryptionDetails }) => {
  const isEncrypted = video?.encryptionStatus === 'ENCRYPTED';
  const isProcessing = video?.encryptionStatus === 'PROCESSING';
  const isFailed = video?.encryptionStatus === 'FAILED';

  const statusConfig = {
    ENCRYPTED: {
      icon: Shield,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      label: 'Encrypted & Secure',
      description: 'Your video is protected with hybrid multikey encryption',
    },
    PROCESSING: {
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      label: 'Encryption in Progress',
      description: 'Please wait while we secure your video',
    },
    FAILED: {
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      label: 'Encryption Failed',
      description: 'An error occurred during encryption. Please try again.',
    },
    UNENCRYPTED: {
      icon: AlertTriangle,
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-slate-500/20',
      label: 'Not Encrypted',
      description: 'This video has not been encrypted yet',
    },
  };

  const config = statusConfig[video?.encryptionStatus] || statusConfig.UNENCRYPTED;
  const StatusIcon = config.icon;

  const encryptionSteps = [
    {
      icon: Layers,
      label: 'Video Chunking',
      description: 'Video split into secure chunks',
      status: encryptionDetails?.chunking || 'pending',
    },
    {
      icon: Lock,
      label: 'AES-256 Encryption',
      description: 'Symmetric key encryption applied',
      status: encryptionDetails?.aes || 'pending',
    },
    {
      icon: Key,
      label: 'ECC Key Exchange',
      description: 'Elliptic curve key agreement',
      status: encryptionDetails?.ecc || 'pending',
    },
    {
      icon: Fingerprint,
      label: 'RSA-4096 Protection',
      description: 'Asymmetric key wrapping',
      status: encryptionDetails?.rsa || 'pending',
    },
  ];

  const getStepStatus = (status) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
      case 'in-progress':
        return { icon: Cpu, color: 'text-cyan-400', bg: 'bg-cyan-500/10' };
      case 'failed':
        return { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' };
      default:
        return { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-500/10' };
    }
  };

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <motion.div
          animate={isProcessing ? { rotate: 360 } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className={`p-3 rounded-xl ${config.bgColor} border ${config.borderColor}`}
        >
          <StatusIcon className={`w-6 h-6 ${config.color}`} />
        </motion.div>
        <div>
          <h3 className={`text-lg font-semibold ${config.color}`}>{config.label}</h3>
          <p className="text-sm text-slate-400">{config.description}</p>
        </div>
        {isEncrypted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="ml-auto"
          >
            <Shield className="w-8 h-8 text-emerald-400" />
          </motion.div>
        )}
      </div>

      {/* Encryption Steps */}
      <div className="space-y-3">
        {encryptionSteps.map((step, index) => {
          const stepStatus = getStepStatus(step.status);
          const StepStatusIcon = stepStatus.icon;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-xl ${stepStatus.bg} border border-slate-700/30 transition-all duration-300`}
            >
              <div className={`p-2 rounded-lg ${stepStatus.bg}`}>
                <step.icon className={`w-4 h-4 ${stepStatus.color}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${stepStatus.color}`}>{step.label}</p>
                <p className="text-xs text-slate-500">{step.description}</p>
              </div>
              <StepStatusIcon className={`w-4 h-4 ${stepStatus.color}`} />
            </motion.div>
          );
        })}
      </div>

      {/* Encryption Info */}
      {isEncrypted && encryptionDetails && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 rounded-xl bg-slate-800/40 border border-slate-700/30"
        >
          <h4 className="text-sm font-semibold text-slate-300 mb-3">Encryption Details</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500">Algorithm</span>
              <p className="text-slate-300 font-medium mt-0.5">
                {encryptionDetails?.algorithm || 'AES-256-GCM'}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Key Exchange</span>
              <p className="text-slate-300 font-medium mt-0.5">
                {encryptionDetails?.keyExchange || 'ECC P-521'}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Key Protection</span>
              <p className="text-slate-300 font-medium mt-0.5">
                {encryptionDetails?.keyProtection || 'RSA-4096'}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Encrypted At</span>
              <p className="text-slate-300 font-medium mt-0.5">
                {encryptionDetails?.encryptedAt
                  ? new Date(encryptionDetails.encryptedAt).toLocaleString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Warning for unencrypted */}
      {!isEncrypted && !isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-400/80">
            This video is not encrypted. Upload it to the encryption service to protect it with
            AES-256, ECC, and RSA-4096 hybrid encryption.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default EncryptionStatusCard;