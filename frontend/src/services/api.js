// frontend/src/services/api.js

import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

// ==============================
// REQUEST INTERCEPTOR
// ==============================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
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
    const requestUrl = originalRequest?.url || "";

    console.log("================================");
    console.log("API ERROR");
    console.log("URL    :", requestUrl);
    console.log("STATUS :", status);
    console.log("================================");

    // ------------------------------
    // PUBLIC SHARE APIs
    // Never redirect to login
    // ------------------------------
    if (requestUrl.startsWith("/share/")) {
      return Promise.reject(error);
    }

    // ------------------------------
    // Handle 401 only
    // ------------------------------
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            {
              refreshToken,
            }
          );

          const newToken = response.data.accessToken;

          localStorage.setItem("token", newToken);

          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Refresh token failed.");
      }

      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      window.location.href = "/login";
    }

    // ------------------------------
    // Handle 403 only for protected APIs
    // ------------------------------
    if (status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      window.location.href = "/login";
    }

    console.error(
      `API Error [${status || "NETWORK"}]`,
      error.response?.data || error.message
    );

    return Promise.reject(error);
  }
);

export { api, API_BASE_URL };