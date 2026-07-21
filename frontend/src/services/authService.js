// frontend/src/services/authService.js

import { api } from './api';

const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  ME: '/auth/me',
  UPDATE_PROFILE: '/auth/profile',
  CHANGE_PASSWORD: '/auth/change-password',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
};

export const authService = {
  async login(email, password) {
    const { data } = await api.post(AUTH_ENDPOINTS.LOGIN, { email, password });
    return data;
  },

  async register(userData) {
    const { data } = await api.post(AUTH_ENDPOINTS.REGISTER, userData);
    return data;
  },

  async getCurrentUser() {
    const { data } = await api.get(AUTH_ENDPOINTS.ME);
    return data;
  },

  async updateProfile(profileData) {
    const { data } = await api.put(AUTH_ENDPOINTS.UPDATE_PROFILE, profileData);
    return data;
  },

  async changePassword(passwordData) {
    const { data } = await api.put(AUTH_ENDPOINTS.CHANGE_PASSWORD, passwordData);
    return data;
  },

  async refreshToken(refreshToken) {
    const { data } = await api.post(AUTH_ENDPOINTS.REFRESH, { refreshToken });
    return data;
  },

  async logout() {
    const { data } = await api.post(AUTH_ENDPOINTS.LOGOUT);
    return data;
  },
};