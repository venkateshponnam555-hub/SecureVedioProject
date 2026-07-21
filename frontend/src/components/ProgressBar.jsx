// frontend/src/components/ProgressBar.jsx

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const ProgressBar = ({
  progress = 0,
  status = 'uploading',
  label = 'Uploading...',
  showPercentage = true,
  size = 'md',
  variant = 'default',
}) => {
  const statusConfig = {
    uploading: {
      icon: Loader2,
      color: 'from-cyan-500 to-blue-500',
      textColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      iconClass: 'animate-spin',
    },
    encrypting: {
      icon: Loader2,
      color: 'from-purple-500 to-pink-500',
      textColor: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      iconClass: 'animate-spin',
    },
    processing: {
      icon: Loader2,
      color: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      iconClass: 'animate-spin',
    },
    completed: {
      icon: CheckCircle,
      color: 'from-emerald-500 to-green-500',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      iconClass: '',
    },
    error: {
      icon: AlertCircle,
      color: 'from-red-500 to-red-600',
      textColor: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      iconClass: '',
    },
    pending: {
      icon: Loader2,
      color: 'from-slate-500 to-slate-600',
      textColor: 'text-slate-400',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-slate-500/20',
      iconClass: '',
    },
  };

  const config = statusConfig[status] || statusConfig.uploading;
  const Icon = config.icon;

  const sizeClasses = {
    sm: { height: 'h-1.5', text: 'text-xs' },
    md: { height: 'h-2.5', text: 'text-sm' },
    lg: { height: 'h-3.5', text: 'text-base' },
  };

  const { height, text } = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`w-full ${variant === 'card' ? 'glass-card p-4' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
            <Icon className={`w-3.5 h-3.5 ${config.textColor} ${config.iconClass}`} />
          </div>
          <span className={`${text} font-medium text-slate-300`}>{label}</span>
        </div>
        {showPercentage && (
          <span className={`${text} font-semibold ${config.textColor}`}>
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className={`relative w-full ${height} bg-slate-800/60 rounded-full overflow-hidden border border-slate-700/30`}>
        {/* Background shimmer */}
        {status !== 'completed' && status !== 'error' && (
          <div className="absolute inset-0 animate-shimmer rounded-full" />
        )}

        {/* Progress Fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className={`h-full bg-gradient-to-r ${config.color} rounded-full relative overflow-hidden`}
        >
          {/* Inner glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />

          {/* Animated stripes for active states */}
          {(status === 'uploading' || status === 'encrypting' || status === 'processing') && (
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.2) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.2) 75%)',
                backgroundSize: '20px 20px',
                animation: 'slide-in-right 0.5s linear infinite',
              }}
            />
          )}
        </motion.div>
      </div>

      {/* Sub-steps for encryption process */}
      {status === 'encrypting' && variant === 'detailed' && (
        <div className="mt-3 space-y-1.5">
          {[
            { label: 'Video Chunking', done: progress >= 25 },
            { label: 'AES-256 Encryption', done: progress >= 50 },
            { label: 'ECC Key Exchange', done: progress >= 75 },
            { label: 'RSA Key Protection', done: progress >= 90 },
          ].map((step, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  step.done ? 'bg-emerald-400' : 'bg-slate-600'
                }`}
              />
              <span
                className={`text-xs ${
                  step.done ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {step.label}
              </span>
              {step.done && (
                <CheckCircle className="w-3 h-3 text-emerald-400 ml-auto" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;