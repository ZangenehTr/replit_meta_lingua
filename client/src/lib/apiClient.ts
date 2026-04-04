import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
});

// Request interceptor to attach token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if ((error.response?.status === 403 || error.response?.status === 401) && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post('/api/auth/refresh', { 
          token: refreshToken 
        });
        
        const { accessToken } = response.data;
        localStorage.setItem('auth_token', accessToken);
        
        // Update the authorization header for the original request
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear tokens and reject.
        // Do NOT hard-redirect here; React routing (ProtectedRoute) handles
        // unauthenticated states. A hard redirect bypasses the public homepage
        // and forces all users with expired tokens to the auth page.
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;