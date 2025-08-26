import axios from 'axios';

const API_BASE = 'https://chat-backend-b5cl.onrender.com/api';

export const SOCKET_URL = 'https://chat-backend-b5cl.onrender.com';
export const api = {
    // Auth
    register: (data, config) => axios.post(`${API_BASE}/auth/register`, data, config),
    login: (data) => axios.post(`${API_BASE}/auth/login`, data),
    getUsers: (token) => axios.get(`${API_BASE}/auth/users`, { headers: { Authorization: `Bearer ${token}` } }),
    updateProfilePhoto: (token, formData) => axios.post(`${API_BASE}/auth/profile-photo`, formData, { headers: { Authorization: `Bearer ${token}` } }),

    // Messages
    sendMessage: (token, data, config = {}) => {
        const headers = {
            ...(config.headers || {}),
            Authorization: `Bearer ${token}`,
        };
        return axios.post(`${API_BASE}/messages/send`, data, { ...config, headers });
    },
    getHistory: (token, userId) => axios.get(`${API_BASE}/messages/history/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
};
