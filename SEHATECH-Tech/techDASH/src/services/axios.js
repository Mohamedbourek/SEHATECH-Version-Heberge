import axios from 'axios';

// Create a custom axios instance with default config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://sehatech-api.onrender.com/api', // Utilise la variable d'environnement
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000 // Ajouter un timeout
});

// Add a request interceptor to attach the auth token to every request
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('Token_TECHNICIEN');
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
    // Handle 401 Unauthorized responses
    if (error.response?.status === 401) {
      localStorage.removeItem('Token_TECHNICIEN');
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