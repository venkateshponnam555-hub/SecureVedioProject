// frontend/src/components/Loader.jsx

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Key } from 'lucide-react';

const Loader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/95 backdrop-blur-sm">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/3 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Animated Security Icons */}
        <div className="relative w-24 h-24">
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <Lock className="w-12 h-12 text-cyan-400/20" />
          </motion.div>
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          >
            <Key className="w-8 h-8 text-purple-400/20" />
          </motion.div>
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Shield className="w-16 h-16 text-cyan-400" />
          </motion.div>
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <motion.h2
            className="text-2xl font-bold gradient-text mb-2"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            SecureVault
          </motion.h2>
          <p className="text-dark-400 text-sm">Initializing secure environment...</p>
        </div>

        {/* Progress Bar */}
        <div className="w-64 h-1.5 bg-dark-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 rounded-full"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: '50%' }}
          />
        </div>

        {/* Security Status Indicators */}
        <div className="flex items-center gap-6 text-xs text-dark-500">
          <motion.span
            className="flex items-center gap-1.5"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
          >
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
            AES-256
          </motion.span>
          <motion.span
            className="flex items-center gap-1.5"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          >
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
            ECC
          </motion.span>
          <motion.span
            className="flex items-center gap-1.5"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
          >
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            RSA-4096
          </motion.span>
        </div>
      </div>
    </div>
  );
};

export default Loader;