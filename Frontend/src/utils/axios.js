import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8080/api/',
  withCredentials: true,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor
instance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error status is 401 and there is no originalRequest._retry flag,
    // it means the token has expired and we need to refresh it
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const response = await instance.post('auth/refresh');
        const { token } = response.data;

        // Update the token in localStorage
        localStorage.setItem('token', token);

        // Update the Authorization header
        originalRequest.headers.Authorization = `Bearer ${token}`;

        // Retry the original request
        return instance(originalRequest);
      } catch (error) {
        // If refresh token fails, redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
