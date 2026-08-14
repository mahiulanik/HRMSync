import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

const refreshClient = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
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

        // Only try refresh for 401 responses
        // and only once for the same request
        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry
        ) {

            originalRequest._retry = true;

            try {

                // Refresh token is automatically
                // sent through HttpOnly cookie
                const { data } = await refreshClient.post(
                    "/refresh-token"
                );

                // Store only the new access token
                localStorage.setItem(
                    "accessToken",
                    data.accessToken
                );

                // Retry original request
                originalRequest.headers.Authorization =
                    `Bearer ${data.accessToken}`;

                return api(originalRequest);

            } catch (refreshError) {

                // Refresh token expired/invalid
                localStorage.removeItem("accessToken");

                window.location.href = "/";

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;