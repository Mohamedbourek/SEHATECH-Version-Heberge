import axios from 'axios';

// Create a custom axios instance with default config
const apiClient = axios.create({
  baseURL: 'https://sehatech-api.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Access-Control-Allow-Origin': 'https://sehatech-medecin.vercel.app',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  },
  timeout: 30000,
  withCredentials: true
});

// Add a request interceptor to attach the auth token to every request
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('Token_MEDECIN');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Add a response interceptor to handle common response scenarios
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('Token_MEDECIN');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      // Handle forbidden access
      console.error('Accès interdit:', error.response.data.message);
    } else if (error.response?.status === 404) {
      // Handle not found
      console.error('Ressource non trouvée:', error.response.data.message);
    } else if (error.response?.status === 422) {
      // Handle validation errors
      console.error('Erreur de validation:', error.response.data.errors);
    } else if (!error.response) {
      // Handle network errors
      console.error('Erreur réseau:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;