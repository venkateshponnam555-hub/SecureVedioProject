// frontend/src/services/api.js

import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,

  // Video upload and encryption can take several minutes
  timeout: 300000,
});

// ==========================================
// REQUEST INTERCEPTOR
// ==========================================
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

// ==========================================
// RESPONSE INTERCEPTOR
// ==========================================
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    const status = error.response?.status;
    const requestUrl = originalRequest?.url || '';
    const requestMethod =
      originalRequest?.method?.toLowerCase() || '';

    console.error(
      `API Error [${status || 'NETWORK'}]`,
      error.response?.data || error.message
    );

    /*
     * Public endpoint:
     * GET /share/{shareToken}
     *
     * This request must not trigger refresh-token logic.
     */
    const isPublicShareMetadataRequest =
      requestMethod === 'get' &&
      /^\/share\/[^/]+\/?$/.test(requestUrl);

    if (isPublicShareMetadataRequest) {
      return Promise.reject(error);
    }

    /*
     * Prevent refresh request from refreshing itself.
     */
    const isRefreshRequest =
      requestUrl.includes('/auth/refresh');

    /*
     * Refresh expired access token only once.
     */
    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshRequest
    ) {
      originalRequest._retry = true;

      const refreshToken =
        localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            {
              refreshToken,
            },
            {
              timeout: 60000,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          const newAccessToken =
            refreshResponse.data?.accessToken;

          const newRefreshToken =
            refreshResponse.data?.refreshToken;

          if (newAccessToken) {
            localStorage.setItem(
              'token',
              newAccessToken
            );

            if (newRefreshToken) {
              localStorage.setItem(
                'refreshToken',
                newRefreshToken
              );
            }

            originalRequest.headers =
              originalRequest.headers || {};

            originalRequest.headers.Authorization =
              `Bearer ${newAccessToken}`;

            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error(
            'Refresh token failed:',
            refreshError.response?.data ||
              refreshError.message
          );
        }
      }

      clearAuthenticationData();

      /*
       * Preserve share-link path before redirecting.
       */
      const currentPath =
        window.location.pathname +
        window.location.search;

      if (currentPath.startsWith('/share/')) {
        localStorage.setItem(
          'pendingSharePath',
          currentPath
        );
      }

      window.location.replace('/login');

      return Promise.reject(error);
    }

    /*
     * Do not automatically logout on 403.
     *
     * A 403 can mean:
     * - receiver email mismatch
     * - insufficient permission
     * - share access denied
     *
     * The calling page should display the backend message.
     */
    return Promise.reject(error);
  }
);

// ==========================================
// AUTH DATA CLEANUP
// ==========================================
function clearAuthenticationData() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export {
  api,
  API_BASE_URL,
  clearAuthenticationData,
};