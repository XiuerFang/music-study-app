import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000
})

// Request interceptor
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data)
}

// Tasks API
export const tasksAPI = {
  getAll: (category) => api.get('/tasks', { params: { category } }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`)
}

// Records API
export const recordsAPI = {
  getAll: (params) => api.get('/records', { params }),
  getCalendar: (year, month) => api.get('/records/calendar', { params: { year, month } }),
  getStats: () => api.get('/records/stats'),
  create: (data) => api.post('/records', data),
  delete: (id) => api.delete(`/records/${id}`)
}

// Settings API
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data)
}

// Games API
export const gamesAPI = {
  getScores: () => api.get('/games/scores'),
  saveScore: (data) => api.post('/games/scores', data)
}

export default api
