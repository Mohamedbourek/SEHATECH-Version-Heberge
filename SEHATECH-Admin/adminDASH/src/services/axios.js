import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000
})

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).token : null
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth')
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      // Handle forbidden access
      console.error('Forbidden access:', error.response.data.message)
    } else if (error.response?.status === 404) {
      // Handle not found
      console.error('Resource not found:', error.response.data.message)
    } else if (error.response?.status === 422) {
      // Handle validation errors
      console.error('Validation error:', error.response.data.errors)
    } else if (!error.response) {
      // Handle network errors
      console.error('Network error:', error.message)
    }
    return Promise.reject(error)
  }
)

export default axiosInstance