import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Base API service
export const api = {
  // Auth
  register: (data) => ({ url: '/auth/register', method: 'post', data }),
  login: (data) => {
    if (!data?.role) {
      throw new Error('Role is required for login API')
    }

    return {
      url: `/login/${data.role}`,
      method: 'post',
      data: {
        email: data.email,
        password: data.password
      }
    }
  },
  logout: () => ({ url: '/auth/logout', method: 'post' }),
  refreshToken: (token) => ({ url: '/auth/refresh-token', method: 'post', data: { refreshToken: token } }),
  forgotPassword: (email) => ({ url: '/auth/forgot-password', method: 'post', data: { email } }),
  resetPassword: (token, password) => ({ url: '/auth/reset-password', method: 'post', data: { token, password } }),
  verifyEmail: (token) => ({ url: `/auth/verify-email/${token}`, method: 'get' }),
  getProfile: () => ({ url: '/auth/me', method: 'get' }),
  changePassword: (currentPassword, newPassword) => ({
    url: '/auth/change-password',
    method: 'post',
    data: { currentPassword, newPassword }
  }),

  // Admin
  adminDashboard: () => ({ url: '/admin/dashboard', method: 'get' }),
  adminEmployees: (params) => ({ url: '/admin/employees', method: 'get', params }),
  createEmployee: (data) => ({ url: '/admin/employees', method: 'post', data }),
  updateEmployee: (id, data) => ({ url: `/admin/employees/${id}`, method: 'put', data }),
  deleteEmployee: (id) => ({ url: `/admin/employees/${id}`, method: 'delete' }),
  getEmployee: (id) => ({ url: `/admin/employees/${id}`, method: 'get' }),

  adminTasks: (params) => ({ url: '/admin/tasks', method: 'get', params }),
  createTask: (data) => ({ url: '/admin/tasks', method: 'post', data }),
  updateTask: (id, data) => ({ url: `/admin/tasks/${id}`, method: 'put', data }),
  deleteTask: (id) => ({ url: `/admin/tasks/${id}`, method: 'delete' }),

  adminCustomers: (params) => ({ url: '/admin/customers', method: 'get', params }),
  getCustomer: (id) => ({ url: `/admin/customers/${id}`, method: 'get' }),
  updateCustomerStatus: (id, isActive) => ({
    url: `/admin/customers/${id}/status`,
    method: 'put',
    data: { isActive }
  }),

  adminBookings: (params) => ({ url: '/admin/bookings', method: 'get', params }),
  updateBookingStatus: (id, status, notes) => ({
    url: `/admin/bookings/${id}/status`,
    method: 'put',
    data: { status, notes }
  }),

  adminPayments: (params) => ({ url: '/admin/payments', method: 'get', params }),
  processRefund: (data) => ({ url: '/admin/payments/refund', method: 'post', data }),

  adminEvents: (params) => ({ url: '/admin/events', method: 'get', params }),
  createEvent: (data) => ({ url: '/admin/events', method: 'post', data }),
  updateEvent: (id, data) => ({ url: `/admin/events/${id}`, method: 'put', data }),
  deleteEvent: (id) => ({ url: `/admin/events/${id}`, method: 'delete' }),
  featureEvent: (id, isFeatured) => ({
    url: `/admin/events/${id}/feature`,
    method: 'post',
    data: { isFeatured }
  }),

  // Customer
  customerDashboard: () => ({ url: '/customers/dashboard', method: 'get' }),
  customerProfile: () => ({ url: '/customers/profile', method: 'get' }),
  updateCustomerProfile: (data) => ({ url: '/customers/profile', method: 'put', data }),

  events: (params) => ({ url: '/customers/events', method: 'get', params }),
  eventById: (id) => ({ url: `/customers/events/${id}`, method: 'get' }),
  eventBySlug: (slug) => ({ url: `/customers/events/slug/${slug}`, method: 'get' }),
  eventCities: () => ({ url: '/customers/events/cities', method: 'get' }),
  eventTypes: () => ({ url: '/customers/events/types', method: 'get' }),

  bookings: (params) => ({ url: '/customers/bookings', method: 'get', params }),
  createBooking: (data) => ({ url: '/customers/bookings', method: 'post', data }),
  bookingById: (id) => ({ url: `/customers/bookings/${id}`, method: 'get' }),
  updateBooking: (id, data) => ({ url: `/customers/bookings/${id}`, method: 'put', data }),
  cancelBooking: (id, reason) => ({
    url: `/customers/bookings/${id}/cancel`,
    method: 'post',
    data: { reason }
  }),

  paymentHistory: (params) => ({ url: '/customers/payment-history', method: 'get', params }),
  submitReview: (data) => ({ url: '/customers/reviews', method: 'post', data }),

  // Employee
  employeeDashboard: () => ({ url: '/employees/dashboard', method: 'get' }),
  employeeProfile: () => ({ url: '/employees/profile', method: 'get' }),
  updateEmployeeProfile: (data) => ({ url: '/employees/profile', method: 'put', data }),
  employeeAvailability: (isAvailable, unavailabilityDates) => ({
    url: '/employees/availability',
    method: 'put',
    data: { isAvailable, unavailabilityDates }
  }),

  employeeTasks: (params) => ({ url: '/employees/tasks', method: 'get', params }),
  taskById: (id) => ({ url: `/employees/tasks/${id}`, method: 'get' }),
  updateTaskStatus: (id, status, progress, comment, blockReason) => ({
    url: `/employees/tasks/${id}/status`,
    method: 'put',
    data: { status, progress, comment, blockReason }
  }),
  updateTaskProgress: (id, progress, comment) => ({
    url: `/employees/tasks/${id}/progress`,
    method: 'put',
    data: { progress, comment }
  }),
  addTaskComment: (id, text) => ({
    url: `/employees/tasks/${id}/comment`,
    method: 'post',
    data: { text }
  }),

  employeeEvents: () => ({ url: '/employees/events', method: 'get' }),
  eventForEmployee: (id) => ({ url: `/employees/events/${id}`, method: 'get' }),
  employeeSchedule: () => ({ url: '/employees/schedule', method: 'get' }),
  employeePerformance: () => ({ url: '/employees/performance', method: 'get' }),

  // Payment
  createPaymentIntent: (bookingId, amount, method) => ({
    url: '/payments/create-intent',
    method: 'post',
    data: { bookingId, amount, method }
  }),
  createRazorpayOrder: (bookingId, amount) => ({
    url: '/payments/create-razorpay-order',
    method: 'post',
    data: { bookingId, amount }
  }),
  verifyRazorpayPayment: (data) => ({
    url: '/payments/verify-razorpay',
    method: 'post',
    data
  }),
  getAllPayments: (params) => ({ url: '/payments', method: 'get', params }),
  getPayment: (id) => ({ url: `/payments/${id}`, method: 'get' }),
  getPaymentReceipt: (transactionId) => ({
    url: `/payments/transactions/receipt/${transactionId}`,
    method: 'get'
  }),
  processRefund: (data) => ({ url: '/payments/refund', method: 'post', data }),

  // Booking
  assignTeam: (id, team) => ({
    url: `/bookings/${id}/assign-team`,
    method: 'post',
    data: { team }
  }),
  removeTeamMember: (id, employeeId) => ({
    url: `/bookings/${id}/remove-team/${employeeId}`,
    method: 'post'
  }),
  updateBookingProgress: (id, percentage) => ({
    url: `/bookings/${id}/progress`,
    method: 'put',
    data: { percentage }
  }),
  addMilestone: (id, name, description, order) => ({
    url: `/bookings/${id}/milestone`,
    method: 'post',
    data: { name, description, order }
  }),
  completeMilestone: (id, index) => ({
    url: `/bookings/${id}/milestone/${index}/complete`,
    method: 'put'
  }),

  // Status
  health: () => ({ url: '/health', method: 'get' })
}

// Helper function to make API calls
export const makeRequest = async (config, onUploadProgress) => {
  try {
    const { url, method = 'get', params, data } = config

    const instance = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    })

    // Add auth token
    const token = localStorage.getItem('token')
    if (token) {
      instance.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }

    const response = await instance({
      url,
      method,
      params,
      data,
      onUploadProgress
    })

    return response.data
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Request failed'
    const status = error.response?.status || 500

    if (status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
    }

    throw {
      message,
      status,
      data: error.response?.data
    }
  }
}

// Helper hooks for API calls
export const useApi = () => {
  const { user } = useAuth()

  const request = async (config, options = {}) => {
    const { onSuccess, onError, ...requestConfig } = config

    try {
      const response = await makeRequest(requestConfig)
      if (onSuccess) onSuccess(response)
      return response
    } catch (error) {
      if (onError) onError(error)
      throw error
    }
  }

  return { request, user }
}

// HTTP shortcut methods for backwards compatibility
api.get = (url, config) => makeRequest({ url, method: 'get', ...config })
api.post = (url, data, config) => makeRequest({ url, method: 'post', data, ...config })
api.put = (url, data, config) => makeRequest({ url, method: 'put', data, ...config })
api.delete = (url, data, config) => makeRequest({ url, method: 'delete', data, ...config })

export default api
