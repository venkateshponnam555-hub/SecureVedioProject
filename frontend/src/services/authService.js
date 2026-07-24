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

const clearLocalAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

export const authService = {
  async login(email, password) {
    const { data } = await api.post(AUTH_ENDPOINTS.LOGIN, {
      email: email.trim(),
      password,
    });

    return data;
  },

  async register(userData) {
    const { data } = await api.post(AUTH_ENDPOINTS.REGISTER, {
      name: userData.name?.trim(),
      email: userData.email?.trim(),
      password: userData.password,
    });

    return data;
  },

  async getCurrentUser() {
    const { data } = await api.get(AUTH_ENDPOINTS.ME);
    return data;
  },

  async updateProfile(profileData) {
    const { data } = await api.put(
      AUTH_ENDPOINTS.UPDATE_PROFILE,
      profileData
    );

    return data;
  },

  async changePassword(passwordData) {
    const { data } = await api.put(
      AUTH_ENDPOINTS.CHANGE_PASSWORD,
      passwordData
    );

    return data;
  },

  async refreshToken(refreshToken) {
    const { data } = await api.post(AUTH_ENDPOINTS.REFRESH, {
      refreshToken,
    });

    return data;
  },

  async logout() {
    try {
      const { data } = await api.post(AUTH_ENDPOINTS.LOGOUT);
      return data;
    } finally {
      clearLocalAuthData();
    }
  },

  clearAuthData() {
    clearLocalAuthData();
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem('token'));
  },

  getStoredUser() {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  },
};