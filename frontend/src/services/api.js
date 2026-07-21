// frontend/src/services/api.js

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 OR 403
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      // Try refresh only for 401
      if (error.response?.status === 401) {
        try {
          const refreshToken = localStorage.getItem("refreshToken");

          if (refreshToken) {
            const { data } = await axios.post(
              `${API_BASE_URL}/auth/refresh`,
              {
                refreshToken,
              }
            );

            const newToken = data.accessToken;

            localStorage.setItem("token", newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            return api(originalRequest);
          }
        } catch (refreshError) {
          // Ignore and continue to logout
        }
      }

      // Logout for invalid or expired token
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      window.location.href = "/login";
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    console.error(
      `API Error [${error.response?.status || "Network"}]:`,
      message
    );

    return Promise.reject(error);
  }
);
export { api, API_BASE_URL };