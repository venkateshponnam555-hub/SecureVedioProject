// frontend/src/services/api.js

import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

// ==============================
// REQUEST INTERCEPTOR
// ==============================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==============================
// RESPONSE INTERCEPTOR
// ==============================
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url || '';
    const requestMethod = originalRequest?.method?.toLowerCase();

    console.error(
      `API Error [${status || 'NETWORK'}]`,
      error.response?.data || error.message
    );

    /*
     * Only this endpoint is public:
     * GET /share/{shareToken}
     *
     * OTP verification and key exchange endpoints are protected.
     */
    const isPublicShareMetadataRequest =
      requestMethod === 'get' &&
      /^\/share\/[^/]+\/?$/.test(requestUrl);

    if (isPublicShareMetadataRequest) {
      return Promise.reject(error);
    }

    /*
     * Do not try refreshing again when the refresh request itself fails.
     */
    const isRefreshRequest = requestUrl.includes('/auth/refresh');

    if (
      status === 401 &&
      !originalRequest?._retry &&
      !isRefreshRequest
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken },
            {
              timeout: 60000,
            }
          );

          const newToken = response.data?.accessToken;

          if (newToken) {
            localStorage.setItem('token', newToken);

            originalRequest.headers =
              originalRequest.headers || {};

            originalRequest.headers.Authorization =
              `Bearer ${newToken}`;

            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error(
            'Refresh token failed:',
            refreshError.response?.data || refreshError.message
          );
        }
      }

      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      window.location.replace('/login');

      return Promise.reject(error);
    }

    /*
     * Do not automatically logout for every 403.
     *
     * OTP receiver-email mismatch also returns 403.
     * SharedVideo.jsx must display:
     * "This video was shared with a different email account."
     */
    return Promise.reject(error);
  }
);

export { api, API_BASE_URL };