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

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');

                if (!refreshToken) {
                    localStorage.clear();
                    window.location.href = '/';
                    return Promise.reject(error);
                }

                const response = await axios.post(`${API_URL}/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken } = response.data;
                localStorage.setItem('accessToken', accessToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
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

    getUsers: (params?: any) =>
        api.get('/users', { params }),

    createUser: (data: any) =>
        api.post('/users', data),

    updateUser: (id: string, data: any) =>
        api.put(`/users/${id}`, data),

    deleteUser: (id: string) =>
        api.delete(`/users/${id}`),

    // Students
    getStudents: (params?: { year?: string; search?: string; department?: string }) =>
        api.get('/students', { params }),

    getStudent: (id: string) =>
        api.get(`/students/${id}`),

    getStudentProfile: () =>
        api.get('/students/profile/me'),

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

    bulkDeleteStudents: (ids: string[]) =>
        api.delete('/students/bulk-delete', { data: { ids } }),

    resetStudentPassword: (id: string) =>
        api.post(`/students/${id}/reset-password`),

    // Projects
    getFacultyProjects: () => api.get('/students/projects/faculty'),
    getAllProjects: () => api.get('/students/projects/all'),
    updateProjectStatus: (studentId: string, projectId: string, data: any) =>
        api.put(`/students/${studentId}/projects/${projectId}/status`, data),

    // Placement
    getCompanies: () => api.get('/placement/companies'),
    createCompany: (data: any) => api.post('/placement/companies', data),
    getApplications: () => api.get('/placement/applications'),
    applyForCompany: (data: any) => api.post('/placement/applications', data),
    updateApplicationStatus: (id: string, status: string) => api.put(`/placement/applications/${id}`, { status }),
    getPlacementStats: () => api.get('/placement/stats'),

    // Notifications
    getNotifications: () => api.get('/notifications'),
    getSentNotifications: () => api.get('/notifications/sent'),
    markNotificationAsRead: (id: string) => api.put(`/notifications/${id}/read`),
    sendNotification: (data: any) => api.post('/notifications/bulk', data),

    // Timetable
    getTimetableSettings: () => api.get('/timetable/settings'),
    updateTimetableSettings: (data: any) => api.post('/timetable/settings', data),
    getTimetableEntries: (params?: any) => api.get('/timetable/entries', { params }),
    updateTimetableEntries: (data: any) => api.post('/timetable/entries', data),

    // Departments
    getDepartments: () => api.get('/departments'),
    getSystemStats: () => api.get('/departments/stats'),
    createDepartment: (data: any) => api.post('/departments', data),
    deleteDepartment: (id: string) => api.delete(`/departments/${id}`),

    // Settings
    getSystemSettings: () => api.get('/settings'),
    updateSystemSettings: (data: any) => api.post('/settings', data),
};
