import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  // Configure axios defaults and interceptors
  useEffect(() => {
    // Set base URL for API calls
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    axios.defaults.baseURL = apiUrl;
    axios.defaults.withCredentials = true; // Enable cookies for refresh tokens
    console.log('🔧 Axios configured with baseURL:', apiUrl);
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      console.log('🔑 Authorization header set with token');
    } else {
      delete axios.defaults.headers.common['Authorization']
      console.log('🚫 Authorization header removed');
    }

    // Response interceptor for automatic token refresh
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            console.log('🔄 Attempting to refresh token...');
            const refreshResponse = await axios.post('/api/auth/refresh');
            const newToken = refreshResponse.data.token;
            
            localStorage.setItem('token', newToken);
            setToken(newToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            
            console.log('✅ Token refreshed successfully');
            return axios(originalRequest);
          } catch (refreshError) {
            console.log('❌ Token refresh failed, logging out');
            logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [token])

  // Load user on app start
  useEffect(() => {
    initializeAuth();
  }, [])

  const initializeAuth = async () => {
    const storedToken = localStorage.getItem('token');
    
    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      await loadUser();
    } else {
      // Try to refresh token from cookie
      try {
        console.log('🔄 Attempting to restore session from refresh token...');
        const response = await axios.post('/api/auth/refresh');
        const { token, user } = response.data;
        
        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log('✅ Session restored from refresh token');
      } catch (error) {
        console.log('ℹ️ No valid session found');
      }
    }
    
    setLoading(false);
  }

  const loadUser = async () => {
    try {
      const response = await axios.get('/api/auth/me')
      setUser(response.data.user)
      console.log('✅ User loaded successfully');
    } catch (error) {
      console.error('❌ Error loading user:', error)
      logout()
    }
  }

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await axios.post('/api/auth/login', { 
        email, 
        password, 
        rememberMe 
      })
      const { token, user } = response.data
      
      localStorage.setItem('token', token)
      setToken(token)
      setUser(user)
      
      toast.success('Welcome back!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return { success: false, message }
    }
  }

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData)
      const { token, user } = response.data
      
      localStorage.setItem('token', token)
      setToken(token)
      setUser(user)
      
      toast.success('Account created successfully!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      return { success: false, message }
    }
  }

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
    toast.success('Logged out successfully')
  }

  const logoutFromAllDevices = async () => {
    try {
      await axios.post('/api/auth/logout-all')
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
      delete axios.defaults.headers.common['Authorization']
      toast.success('Logged out from all devices')
    } catch (error) {
      console.error('Logout all error:', error)
      toast.error('Error logging out from all devices')
    }
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    logoutFromAllDevices,
    updateUser,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}