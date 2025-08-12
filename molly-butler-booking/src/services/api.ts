import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/admin';
    }
    return Promise.reject(error);
  }
);

// Room API calls
export const roomsAPI = {
  getAll: () => api.get('/rooms'),
  getById: (id: string) => api.get(`/rooms/${id}`),
  checkAvailability: (roomId: string, checkIn: string, checkOut: string) => 
    api.post('/rooms/check-availability', { roomId, checkIn, checkOut }),
};

// Reservation API calls
export const reservationsAPI = {
  create: (reservationData: any) => api.post('/reservations', reservationData),
  getByConfirmation: (confirmationNumber: string) => 
    api.get(`/reservations/confirmation/${confirmationNumber}`),
  cancel: (confirmationNumber: string) => 
    api.patch(`/reservations/confirmation/${confirmationNumber}`, { status: 'cancelled' }),
  getAll: (filters?: any) => api.get('/reservations', { params: filters }),
  getById: (id: string) => api.get(`/reservations/${id}`),
  update: (id: string, data: any) => api.put(`/reservations/${id}`, data),
  delete: (id: string) => api.delete(`/reservations/${id}`),
  getStats: () => api.get('/reservations/admin/stats'),
};

// Auth API calls
export const authAPI = {
  login: (credentials: { username: string; password: string }) => 
    api.post('/auth/login', credentials),
  register: (userData: any) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
};

export default api;