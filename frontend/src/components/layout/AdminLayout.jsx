import React from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Container, Navbar, Nav, NavDropdown, Badge } from 'react-bootstrap'
import { useAuth } from '../../context/AuthContext'
import {
  FaHome, FaUsers, FaTasks, FaCalendarCheck, FaUserFriends,
  FaMoneyBillWave, FaCalendarAlt, FaCog,
  FaUser, FaSignOutAlt,
  FaProjectDiagram
} from 'react-icons/fa'

const AdminLayout = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path) => {
    return location.pathname.startsWith(`/admin${path}`)
  }

  const sidebarNavItems = [
    { path: '/dashboard', icon: FaHome, label: 'Dashboard', exact: true },
    { path: '/employees', icon: FaUsers, label: 'Employees' },
    { path: '/tasks', icon: FaTasks, label: 'Task Management' },
    { path: '/customers', icon: FaUserFriends, label: 'Customers' },
    { path: '/bookings', icon: FaCalendarCheck, label: 'Bookings' },
    { path: '/payments', icon: FaMoneyBillWave, label: 'Payments' },
    { path: '/events', icon: FaProjectDiagram, label: 'Events' },
    { path: '/settings', icon: FaCog, label: 'Settings' }
  ]

  // Get stats (will come from API)
  const stats = {
    customers: 0,
    employees: 0,
    bookings: 0,
    revenue: 0
  }

  return (
    <>
      {/* Top Navbar */}
      <Navbar bg="light" expand="lg" className="shadow-sm">
        <Container fluid>
          <div className="d-flex align-items-center">
            <Navbar.Brand as={Link} to="/admin/dashboard">
              <span className="text-primary-gradient fw-bold fs-4">Eventify</span>
              <Badge bg="primary" className="ms-2">Admin</Badge>
            </Navbar.Brand>
          </div>

          <Nav className="align-items-center ms-auto">
            <NavDropdown
              title={(
                <div className="app-user-trigger">
                  <div className="app-user-avatar">
                    <FaUser />
                  </div>
                  <div className="app-user-meta">
                    <span className="app-user-name">{user?.profile?.firstName || 'Admin'}</span>
                    <span className="app-user-role">Administrator</span>
                  </div>
                </div>
              )}
              id="admin-nav-dropdown"
              className="app-user-dropdown"
            >
              <NavDropdown.Item as={Link} to="/admin/profile">
                <FaUser className="me-2" /> Profile
              </NavDropdown.Item>

              <NavDropdown.Item as={Link} to="/admin/settings">
                <FaCog className="me-2" /> Settings
              </NavDropdown.Item>

              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}>
                <FaSignOutAlt className="me-2" /> Logout
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Container>
      </Navbar>

      <div className="d-flex">
        {/* Sidebar */}
        <div className="sidebar app-sidebar admin-sidebar d-none d-lg-block" style={{ width: '260px', minHeight: 'calc(100vh - 56px)' }}>
          <Nav className="flex-column pt-3">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon
              const active = item.exact
                ? location.pathname === `/admin${item.path}`
                : isActive(item.path)

              return (
                <Nav.Link
                  key={item.path}
                  as={Link}
                  to={`/admin${item.path}`}
                  className={`nav-link sidebar-link ${active ? 'active' : ''}`}
                >
                  <Icon className="me-3" /> {item.label}
                </Nav.Link>
              )
            })}
          </Nav>
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 56px)' }}>
          <Outlet />
        </div>
      </div>
    </>
  )
}

export default AdminLayout
