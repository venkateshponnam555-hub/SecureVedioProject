// frontend/src/components/UploadBox.jsx

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileVideo, AlertCircle, CheckCircle } from 'lucide-react';

const UploadBox = ({ onFileSelect, maxSize = 500, accept = 'video/*', disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const validateFile = useCallback(
    (file) => {
      setError('');

      if (!file) return false;

      const maxSizeBytes = maxSize * 1024 * 1024;

      if (file.size > maxSizeBytes) {
        setError(`File size exceeds ${maxSize}MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
        return false;
      }

      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file (MP4, WebM, AVI, etc.).');
        return false;
      }

      return true;
    },
    [maxSize]
  );

  const handleFile = useCallback(
    (file) => {
      if (validateFile(file)) {
        setSelectedFile(file);
        setError('');

        if (file.type.startsWith('video/')) {
          const url = URL.createObjectURL(file);
          setPreview(url);
        }

        if (onFileSelect) {
          onFileSelect(file);
        }
      }
    },
    [validateFile, onFileSelect]
  );

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target?.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (preview) URL.revokeObjectURL(preview);
    setSelectedFile(null);
    setPreview(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onFileSelect) onFileSelect(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  return (
    <div className="w-full">
      <motion.div
        className={`relative border-2 border-dashed rounded-2xl p-8 md:p-12 transition-all duration-300 cursor-pointer overflow-hidden ${
          disabled
            ? 'border-slate-700/50 bg-slate-900/30 cursor-not-allowed opacity-60'
            : isDragging
            ? 'border-cyan-400 bg-cyan-500/10 scale-[1.02] shadow-2xl shadow-cyan-500/10'
            : selectedFile
            ? 'border-emerald-500/50 bg-emerald-500/5'
            : 'border-slate-600 hover:border-cyan-500/50 hover:bg-slate-800/30'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        whileHover={!disabled ? { scale: 1.01 } : {}}
        whileTap={!disabled ? { scale: 0.99 } : {}}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />

        {/* Glow effect when dragging */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-cyan-500/10 flex items-center justify-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-center"
              >
                <Upload className="w-16 h-16 text-cyan-400 mx-auto mb-2" />
                <p className="text-cyan-400 font-semibold text-lg">Drop your video here</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedFile ? (
          <div className="relative z-10 text-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-slate-600 flex items-center justify-center"
            >
              <Upload className="w-10 h-10 text-cyan-400" />
            </motion.div>
            <h3 className="text-xl font-semibold text-white mb-2">Upload Video</h3>
            <p className="text-slate-400 mb-4 text-sm">
              Drag & drop your video file here, or click to browse
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-500">
              <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700">
                MP4
              </span>
              <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700">
                WebM
              </span>
              <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700">
                AVI
              </span>
              <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700">
                MOV
              </span>
              <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700">
                MKV
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-3">Maximum file size: {maxSize}MB</p>
          </div>
        ) : (
          <div className="relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <FileVideo className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <p className="text-white font-medium truncate">{selectedFile.name}</p>
                </div>
                <p className="text-sm text-slate-400">
                  {formatFileSize(selectedFile.size)} &bull;{' '}
                  {selectedFile.type.split('/')[1]?.toUpperCase() || 'VIDEO'}
                </p>
              </div>
              <button
                onClick={handleRemove}
                className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadBox;