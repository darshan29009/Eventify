import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/common/ProtectedRoute'

// Layouts
import AdminLayout from './components/layout/AdminLayout'
import CustomerLayout from './components/layout/CustomerLayout'
import EmployeeLayout from './components/layout/EmployeeLayout'
import GuestLayout from './components/layout/GuestLayout'

// Pages - Auth
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

// Pages - Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminEmployees from './pages/admin/AdminEmployees'
import AdminTasks from './pages/admin/AdminTasks'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminBookings from './pages/admin/AdminBookings'
import AdminPayments from './pages/admin/AdminPayments'
import AdminEvents from './pages/admin/AdminEvents'
import AdminSettings from './pages/admin/AdminSettings'
import AdminEventForm from './pages/admin/AdminEventForm'

// Pages - Customer
import CustomerDashboard from './pages/customer/CustomerDashboard'
import EventListing from './pages/customer/EventListing'
import EventDetail from './pages/customer/EventDetail'
import BookingFlow from './pages/customer/BookingFlow'
import MyBookings from './pages/customer/MyBookings'
import BookingDetail from './pages/customer/BookingDetail'
import Payment from './pages/customer/Payment'
import PaymentHistory from './pages/customer/PaymentHistory'
import CustomerProfile from './pages/customer/CustomerProfile'
import CustomerReviews from './pages/customer/CustomerReviews'
import Wishlist from './pages/customer/Wishlist'

// Pages - Employee
import EmployeeDashboard from './pages/employee/EmployeeDashboard'
import EmployeeTasks from './pages/employee/EmployeeTasks'
import TaskDetail from './pages/employee/TaskDetail'
import EmployeeEvents from './pages/employee/EmployeeEvents'
import EmployeeEventDetail from './pages/employee/EmployeeEventDetail'
import EmployeeProfile from './pages/employee/EmployeeProfile'

// Pages - Shared
import Landing from './pages/shared/Landing'
import NotFound from './pages/shared/NotFound'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<GuestLayout />}>
            <Route index element={<Landing />} />
            <Route path="login" element={<Login />} />
            <Route path="login/customer" element={<Login defaultRole="customer" />} />
            <Route path="login/employee" element={<Login defaultRole="employee" />} />
            <Route path="login/admin" element={<Login defaultRole="admin" />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']} redirectTo="/login/admin">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="employees" element={<AdminEmployees />} />
            <Route path="tasks" element={<AdminTasks />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="events/new" element={<AdminEventForm />} />
            <Route path="events/:id" element={<AdminEventForm />} />
            <Route path="events/:id/edit" element={<AdminEventForm />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Customer Routes */}
          <Route path="/customer" element={
            <ProtectedRoute allowedRoles={['customer', 'admin']} redirectTo="/login/customer">
              <CustomerLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="events" element={<EventListing />} />
            <Route path="events/:id" element={<EventDetail />} />
            <Route path="events/book" element={<BookingFlow />} />
            <Route path="bookings/:id" element={<BookingDetail />} />
            <Route path="bookings" element={<MyBookings />} />
            <Route path="payment/:bookingId" element={<Payment />} />
            <Route path="payment-history" element={<PaymentHistory />} />
            <Route path="profile" element={<CustomerProfile />} />
            <Route path="reviews" element={<CustomerReviews />} />
            <Route path="wishlist" element={<Wishlist />} />
          </Route>

          {/* Employee Routes */}
          <Route path="/employee" element={
            <ProtectedRoute allowedRoles={['employee', 'admin']} redirectTo="/login/employee">
              <EmployeeLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="tasks" element={<EmployeeTasks />} />
            <Route path="tasks/:id" element={<TaskDetail />} />
            <Route path="events" element={<EmployeeEvents />} />
            <Route path="events/:id" element={<EmployeeEventDetail />} />
            <Route path="profile" element={<EmployeeProfile />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
