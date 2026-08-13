import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: "/api",
    headers: {
        "Content-Type": "application/json",
    },
});

const refreshClient = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Attach access token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Handle expired access token
api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            const refreshToken =
                localStorage.getItem("refreshToken");

            if (!refreshToken) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");

                window.location.href = "/";

                return Promise.reject(error);
            }

            try {
                const { data } = await refreshClient.post(
                    "/api/refresh-token",
                    {
                        refreshToken,
                    }
                );

                localStorage.setItem(
                    "accessToken",
                    data.accessToken
                );

                localStorage.setItem(
                    "refreshToken",
                    data.refreshToken
                );

                originalRequest.headers.Authorization =
                    `Bearer ${data.accessToken}`;

                return api(originalRequest);

            } catch (refreshError) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");

                window.location.href = "/";

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;