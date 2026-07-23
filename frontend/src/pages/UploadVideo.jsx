// frontend/src/pages/UploadVideo.jsx

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileVideo,
  Shield,
  Lock,
  Key,
  ArrowRight,
  X,
  AlertCircle,
} from 'lucide-react';
import UploadBox from '../components/UploadBox';
import ProgressBar from '../components/ProgressBar';
import { videoService } from '../services/videoService';

const UploadVideo = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('pending');
  const [encryptAfterUpload, setEncryptAfterUpload] = useState(true);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();
  const tagInputRef = useRef(null);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    if (!title && file) {
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      setTitle(fileName);
    }
    if (errors.file) {
      setErrors((prev) => ({ ...prev, file: '' }));
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !tags.includes(tag) && tags.length < 10) {
        setTags([...tags, tag]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedFile) {
      newErrors.file = 'Please select a video file to upload';
    }

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (title.trim().length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (description.length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpload = async () => {
    if (!validateForm()) return;

    setUploading(true);
    setUploadStatus('uploading');
    setServerError('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('tags', JSON.stringify(tags));
      formData.append('encrypt', encryptAfterUpload.toString());

      // Detect network speed and send to backend for adaptive chunk sizing
      const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

      const networkSpeedMbps = connection?.downlink ?? 10;
      formData.append('networkSpeedMbps', networkSpeedMbps.toString());
      console.log('Detected Network Speed:', `${networkSpeedMbps} Mbps`);

      const response = await videoService.uploadVideo(formData, (progress) => {
        setUploadProgress(progress);
      });

      setUploadStatus('completed');
      setSuccessMessage('Video uploaded successfully!');

      if (encryptAfterUpload) {
        setTimeout(() => {
          navigate(`/encryption-process/${response._id || response.id}`);
        }, 2000);
      } else {
        setTimeout(() => {
          navigate('/my-videos');
        }, 2000);
      }
    } catch (error) {
      setUploadStatus('error');
      const message = error.response?.data?.message || 'Upload failed. Please try again.';
      setServerError(message);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Upload Video</h1>
          <p className="text-slate-400">
            Upload your video and encrypt it with AES-256, ECC, and RSA-4096
          </p>
        </motion.div>

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center"
          >
            {successMessage}
          </motion.div>
        )}

        {/* Error Message */}
        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
          >
            {serverError}
          </motion.div>
        )}

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 mb-6"
        >
          <UploadBox
            onFileSelect={handleFileSelect}
            maxSize={500}
            disabled={uploading}
          />
          {errors.file && (
            <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.file}
            </p>
          )}
        </motion.div>

        {/* Video Details */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* File Info */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileVideo className="w-5 h-5 text-cyan-400" />
                  File Information
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">File Name</span>
                    <p className="text-white font-medium truncate">{selectedFile.name}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Size</span>
                    <p className="text-white font-medium">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Type</span>
                    <p className="text-white font-medium uppercase">
                      {selectedFile.type.split('/')[1] || 'Video'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Last Modified</span>
                    <p className="text-white font-medium">
                      {new Date(selectedFile.lastModified).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Title & Description */}
              <div className="glass-card p-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="label">
                      Video Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                      }}
                      placeholder="Enter video title"
                      className={`input-field ${errors.title ? 'input-field-error' : ''}`}
                      maxLength={200}
                      disabled={uploading}
                    />
                    {errors.title && (
                      <p className="text-red-400 text-xs mt-1.5">{errors.title}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="description" className="label">
                      Description (optional)
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                      }}
                      placeholder="Describe your video content..."
                      rows={4}
                      className="input-field resize-none"
                      maxLength={2000}
                      disabled={uploading}
                    />
                    <p className="text-xs text-slate-500 mt-1 text-right">
                      {description.length}/2000
                    </p>
                  </div>
                  <div>
                    <label className="label">Tags (optional)</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="tag group cursor-pointer"
                          onClick={() => !uploading && handleRemoveTag(tag)}
                        >
                          {tag}
                          {!uploading && (
                            <X className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </span>
                      ))}
                    </div>
                    <input
                      ref={tagInputRef}
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Add tags (press Enter)"
                      className="input-field"
                      disabled={uploading || tags.length >= 10}
                    />
                    <p className="text-xs text-slate-500 mt-1">{tags.length}/10 tags</p>
                  </div>
                </div>
              </div>

              {/* Encryption Option */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  Encryption Settings
                </h2>
                <label className="flex items-start gap-3 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10 cursor-pointer hover:bg-cyan-500/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={encryptAfterUpload}
                    onChange={(e) => setEncryptAfterUpload(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/50"
                    disabled={uploading}
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium">Encrypt after upload</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Automatically apply AES-256, ECC, and RSA-4096 hybrid encryption to your video
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Lock className="w-3 h-3 text-cyan-400" /> AES-256
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Key className="w-3 h-3 text-purple-400" /> ECC
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Shield className="w-3 h-3 text-blue-400" /> RSA-4096
                      </span>
                    </div>
                  </div>
                </label>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <ProgressBar
                    progress={uploadProgress}
                    status={uploadStatus}
                    label={
                      uploadStatus === 'completed'
                        ? 'Upload Complete'
                        : uploadStatus === 'error'
                        ? 'Upload Failed'
                        : 'Uploading Video...'
                    }
                    variant="card"
                  />
                </motion.div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                  className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload & Encrypt
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UploadVideo;