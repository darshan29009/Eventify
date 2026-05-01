import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useNavigate, useLocation } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const AuthContext = createContext({})

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  // Axios setup
  const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json'
    },
    withCredentials: true
  })

  // Request interceptor to add auth token
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor to handle token refresh
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          const refreshToken = localStorage.getItem('refreshToken')
          if (refreshToken) {
            const response = await axios.post(`${API_URL}/auth/refresh-token`, {
              refreshToken
            })

            const { token } = response.data
            localStorage.setItem('token', token)
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`

            originalRequest.headers.Authorization = `Bearer ${token}`
            return axiosInstance(originalRequest)
          }
        } catch (err) {
          // Refresh failed, logout
          logout()
          navigate('/login')
          return Promise.reject(err)
        }
      }

      if (error.response?.status === 403) {
        toast.error('Access denied. Insufficient permissions.')
      }

      return Promise.reject(error)
    }
  )

  // Check if user is logged in
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await axiosInstance.get('/auth/me')
          setUser(response.data.user)
          setEmployee(response.data.employee || null)
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  // Login
  const login = async (email, password, role) => {
    try {
      const roleLoginEndpoint = role ? `/login/${role}` : '/auth/login'
      const response = await axiosInstance.post(roleLoginEndpoint, {
        email,
        password
      })

      const { token, refreshToken, user, employee } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      setUser(user)
      setEmployee(employee)

      // Redirect based on role
      const redirectPath = getRedirectPath(user.role)
      navigate(redirectPath, { replace: true })

      toast.success(`Welcome back, ${user.profile?.firstName || user.email}!`)
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // Register
  const register = async (userData) => {
    try {
      // Clean and validate phone number (optional - only include if valid)
      let phone = userData.phone?.trim()
      if (phone) {
        // Remove any non-digit characters
        phone = phone.replace(/\D/g, '')
        // Validate: exactly 10 digits, starting with 6-9 (Indian mobile format)
        // Or allow any 10 digits starting with 1-9
        const phoneRegex = /^[1-9]\d{9}$/
        if (!phoneRegex.test(phone)) {
          // Don't send invalid phone number - make it undefined
          phone = undefined
        }
      }

      // Transform frontend data format to backend expected format
      const registerData = {
        email: userData.email,
        password: userData.password,
        profile: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          ...(phone && { phone })
        },
        address: {} // Empty address object as placeholder
      }

      const response = await axiosInstance.post('/auth/register', registerData)
      const { token, refreshToken, user } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      setUser(user)

      toast.success('Account created successfully!')
      navigate('/customer/dashboard', { replace: true })
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // Logout
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        await axiosInstance.post('/auth/logout', { refreshToken })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      setUser(null)
      setEmployee(null)
      navigate('/login', { replace: true })
      toast.success('Logged out successfully')
    }
  }

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      const response = await axiosInstance.put('/customers/profile', profileData)
      setUser(response.data.data)
      toast.success('Profile updated successfully!')
      return { success: true, data: response.data.data }
    } catch (error) {
      const message = error.response?.data?.message || 'Update failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axiosInstance.post('/auth/change-password', {
        currentPassword,
        newPassword
      })
      toast.success('Password changed successfully!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // Get redirect path based on role
  const getRedirectPath = (role) => {
    const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password']
    const currentPath = location.pathname

    if (publicPaths.some(path => currentPath.includes(path))) {
      return role === 'admin' ? '/admin/dashboard' :
             role === 'employee' ? '/employee/dashboard' :
             '/customer/dashboard'
    }

    return role === 'admin' ? '/admin/dashboard' :
           role === 'employee' ? '/employee/dashboard' :
           '/customer/dashboard'
  }

  const value = {
    user,
    employee,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!user,
    userRole: user?.role,
    axios: axiosInstance
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
