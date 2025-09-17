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
    
    // Check if this is a public endpoint that shouldn't trigger auth redirects
    const isPublicEndpoint = originalRequest.url?.includes('/auth/') || 
                            originalRequest.url?.includes('/branding') ||
                            originalRequest.url?.includes('/public/');
    
    if ((error.response?.status === 403 || error.response?.status === 401) && !originalRequest._retry && !isPublicEndpoint) {
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
        // Refresh failed, clear tokens and redirect (only for protected endpoints)
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        
        // Only redirect if user is not already on auth page
        if (!window.location.pathname.includes('/auth')) {
          window.location.href = '/auth';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;