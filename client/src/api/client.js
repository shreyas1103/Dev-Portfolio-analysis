import axios from "axios";

let accessToken = null;
let logoutHandler = null;
let refreshPromise = null;

// TODO (M6.3):
// Replace hardcoded URL with:
// import.meta.env.VITE_API_BASE_URL
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setLogoutHandler(handler) {
  logoutHandler = handler;
}

apiClient.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthEndpoint = originalRequest.url?.includes("/auth/login") ||
                            originalRequest.url?.includes("/auth/register") ||
                            originalRequest.url?.includes("/auth/refresh") ||
                            originalRequest.url?.includes("/auth/logout");

    if (
      error.response?.status !== 401 ||
      originalRequest._retry || isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = apiClient
        .post("/auth/refresh")
        .then((res) => {
          const newAccessToken =
            res.data.data.accessToken;

          setAccessToken(newAccessToken);

          return newAccessToken;
        })
        .catch((refreshError) => {
          setAccessToken(null);

          if (logoutHandler) {
            logoutHandler();
          }

          throw refreshError;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      const newAccessToken =
        await refreshPromise;

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;