// frontend/src/services/videoService.js

import { api } from './api';

const VIDEO_ENDPOINTS = {
  UPLOAD: '/videos/upload',
  GET_ALL: '/videos',
  GET_BY_ID: '/videos',
  UPDATE: '/videos',
  DELETE: '/videos',
  STREAM: '/videos/stream',
  DOWNLOAD: '/videos/download',
  ENCRYPT: '/videos/encrypt',
  DECRYPT: '/videos/decrypt',
  MY_VIDEOS: '/videos/my-videos',
  SHARE: '/share/generate',
  METADATA: '/videos/metadata',
  STATUS: '/videos/status',
};

export const videoService = {
  // ==============================
  // VIDEO UPLOAD
  // ==============================

  async uploadVideo(formData, onProgress) {
    const { data } = await api.post(
      VIDEO_ENDPOINTS.UPLOAD,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentage = Math.round(
              (progressEvent.loaded * 100) /
                progressEvent.total
            );

            onProgress(percentage);
          }
        },
      }
    );

    return data;
  },

  // ==============================
  // VIDEO LISTS
  // ==============================

  async getAllVideos(params = {}) {
    const { data } = await api.get(
      VIDEO_ENDPOINTS.GET_ALL,
      {
        params,
      }
    );

    return data;
  },

  async getMyVideos(params = {}) {
    const { data } = await api.get(
      VIDEO_ENDPOINTS.MY_VIDEOS,
      {
        params,
      }
    );

    return data;
  },

  // ==============================
  // VIDEO DETAILS
  // ==============================

  async getVideoById(id) {
    const { data } = await api.get(
      `${VIDEO_ENDPOINTS.GET_BY_ID}/${id}`
    );

    return data;
  },

  async getVideoMetadata(id) {
    const { data } = await api.get(
      `${VIDEO_ENDPOINTS.METADATA}/${id}`
    );

    return data;
  },

  async getEncryptionStatus(id) {
    const { data } = await api.get(
      `${VIDEO_ENDPOINTS.STATUS}/${id}`
    );

    return data;
  },

  // ==============================
  // UPDATE AND DELETE
  // ==============================

  async updateVideo(id, videoData) {
    const { data } = await api.put(
      `${VIDEO_ENDPOINTS.UPDATE}/${id}`,
      videoData
    );

    return data;
  },

  async deleteVideo(id) {
    const { data } = await api.delete(
      `${VIDEO_ENDPOINTS.DELETE}/${id}`
    );

    return data;
  },

  // ==============================
  // VIDEO STREAM AND DOWNLOAD
  // ==============================

  getStreamUrl(id) {
    return `${api.defaults.baseURL}${VIDEO_ENDPOINTS.STREAM}/${id}`;
  },

  getDownloadUrl(id) {
    return `${api.defaults.baseURL}${VIDEO_ENDPOINTS.DOWNLOAD}/${id}`;
  },

  // ==============================
  // ENCRYPTION AND DECRYPTION
  // ==============================

  async encryptVideo(id) {
    const { data } = await api.post(
      `${VIDEO_ENDPOINTS.ENCRYPT}/${id}`
    );

    return data;
  },

  async decryptVideo(id, keyData) {
    const { data } = await api.post(
      `${VIDEO_ENDPOINTS.DECRYPT}/${id}`,
      keyData
    );

    return data;
  },

  // ==============================
  // SENDER SHARE LINK
  // ==============================

  async shareVideo(id, shareData) {
    const { data } = await api.post(
      `${VIDEO_ENDPOINTS.SHARE}/${id}`,
      shareData
    );

    return data;
  },

  // ==============================
  // PUBLIC SHARE INFORMATION
  // GET /api/share/{shareToken}
  // ==============================

  async getSharedVideo(shareToken) {
    const { data } = await api.get(
      `/share/${shareToken}`
    );

    return data;
  },

  // ==============================
  // SEND RECEIVER OTP
  // POST /api/share/send-otp/{shareToken}
  // ==============================

  async sendOtp(shareToken) {
    const { data } = await api.post(
      `/share/send-otp/${shareToken}`
    );

    return data;
  },

  // ==============================
  // VERIFY RECEIVER OTP
  // POST /api/share/verify-otp/{shareToken}
  // ==============================

  async verifyOtp(shareToken, otp) {
    const { data } = await api.post(
      `/share/verify-otp/${shareToken}`,
      {
        otp,
      }
    );

    return data;
  },

  // ==============================
  // ECC KEY EXCHANGE
  // POST /api/share/key-exchange/{shareToken}
  // ==============================

  async performKeyExchange(
    shareToken,
    receiverPublicKey
  ) {
    const { data } = await api.post(
      `/share/key-exchange/${shareToken}`,
      {
        receiverPublicKey,
      }
    );

    return data;
  },
};