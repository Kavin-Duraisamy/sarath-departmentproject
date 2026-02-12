import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest: any = error.config;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');

                if (!refreshToken) {
                    // No refresh token, redirect to login
                    localStorage.clear();
                    window.location.href = '/';
                    return Promise.reject(error);
                }

                // Try to refresh the token
                const response = await axios.post(`${API_URL}/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken } = response.data;
                localStorage.setItem('accessToken', accessToken);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, clear storage and redirect
                localStorage.clear();
                window.location.href = '/';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

// API helper functions
export const apiClient = {
    // Auth
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),

    refreshToken: (refreshToken: string) =>
        api.post('/auth/refresh', { refreshToken }),

    getCurrentUser: () =>
        api.get('/auth/me'),

    // Students
    getStudents: (params?: { year?: string; search?: string }) =>
        api.get('/students', { params }),

    getStudent: (id: string) =>
        api.get(`/students/${id}`),

    createStudent: (data: any) =>
        api.post('/students', data),

    bulkCreateStudents: (students: any[]) =>
        api.post('/students/bulk', { students }),

    updateStudent: (id: string, data: any) =>
        api.put(`/students/${id}`, data),

    updateStudentProfile: (id: string, data: any) =>
        api.put(`/students/${id}/profile`, data),

    deleteStudent: (id: string) =>
        api.delete(`/students/${id}`),

    bulkDeleteStudents: (ids?: string[]) =>
        api.delete('/students/bulk-delete', { data: { ids } }),

    // Users (Staff)
    getUsers: () =>
        api.get('/users'),

    getUser: (id: string) =>
        api.get(`/users/${id}`),

    createUser: (data: any) =>
        api.post('/users', data),

    updateUser: (id: string, data: any) =>
        api.put(`/users/${id}`, data),

    deleteUser: (id: string) =>
        api.delete(`/users/${id}`),

    // File Uploads
    uploadResume: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/upload/resume', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    uploadCertificate: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/upload/certificate', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    uploadProfilePhoto: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/upload/profile-photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    uploadDocument: (file: File, folder?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        if (folder) formData.append('folder', folder);
        return api.post('/upload/document', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};
