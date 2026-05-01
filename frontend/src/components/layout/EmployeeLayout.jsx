import React from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Container, Navbar, Nav, Badge, NavDropdown } from 'react-bootstrap'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import {
  FaHome, FaTasks, FaClipboardCheck,
  FaUser,
  FaSignOutAlt
} from 'react-icons/fa'

const EmployeeLayout = () => {
  const { user, employee, logout } = useAuth()
  const { darkMode } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path) => {
    return location.pathname.startsWith(`/employee${path}`)
  }

  const menuItems = [
    { path: '/dashboard', icon: FaHome, label: 'Dashboard', exact: true },
    { path: '/tasks', icon: FaTasks, label: 'My Tasks' },
    { path: '/events', icon: FaClipboardCheck, label: 'Assigned Events' },
    { path: '/profile', icon: FaUser, label: 'Profile' }
  ]

  return (
    <>
      {/* Top Navbar */}
      <Navbar bg="light" expand="lg" className="shadow-sm">
        <Container fluid>
          <div className="d-flex align-items-center">
            <Navbar.Brand as={Link} to="/employee/dashboard">
              <span className="text-primary-gradient fw-bold fs-4">Eventify</span>
              <Badge bg="info" className="ms-2">Employee</Badge>
            </Navbar.Brand>
          </div>

          <Nav className="align-items-center ms-auto">
            {/* User Info */}
            <NavDropdown
              title={
                <div className="app-user-trigger">
                  <div className="app-user-avatar employee-user-avatar">
                    <FaUser />
                  </div>
                  <div className="app-user-meta">
                    <span className="app-user-name">{user?.profile?.firstName || 'Employee'}</span>
                    <span className="app-user-role">{employee?.designation || 'Employee'}</span>
                  </div>
                </div>
              }
              id="employee-nav-dropdown"
              className="app-user-dropdown"
            >
              <NavDropdown.Item as={Link} to="/employee/profile">
                <FaUser className="me-2" /> My Profile
              </NavDropdown.Item>

              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout} className="text-danger">
                <FaSignOutAlt className="me-2" /> Logout
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Container>
      </Navbar>

      <div className="d-flex">
        {/* Sidebar */}
        <div className="sidebar app-sidebar employee-sidebar d-none d-lg-block" style={{ width: '240px', minHeight: 'calc(100vh - 56px)' }}>
          <Nav className="flex-column pt-3">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = item.exact
                ? location.pathname === `/employee${item.path}`
                : isActive(item.path)

              return (
                <Nav.Link
                  key={item.path}
                  as={Link}
                  to={`/employee${item.path}`}
                  className={`nav-link sidebar-link ${active ? 'active' : ''}`}
                >
                  <Icon className="me-3" /> {item.label}
                </Nav.Link>
              )
            })}
          </Nav>
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 p-4" style={{ backgroundColor: darkMode ? '#1a202c' : '#f8f9fa', minHeight: 'calc(100vh - 56px)' }}>
          <Outlet />
        </div>
      </div>
    </>
  )
}

export default EmployeeLayout
