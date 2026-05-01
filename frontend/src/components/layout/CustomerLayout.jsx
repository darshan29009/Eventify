import React, { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Container, Navbar, Nav, Button, Badge, Dropdown, Collapse } from 'react-bootstrap'
import { useAuth } from '../../context/AuthContext'
import {
  FaHome, FaShoppingCart,
  FaHeart, FaChevronDown, FaSignOutAlt,
  FaCalendarAlt, FaTasks, FaWallet, FaCog, FaBars
} from 'react-icons/fa'

const CustomerLayout = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path) => {
    return location.pathname.startsWith(`/customer${path}`)
  }

  const customerMenuItems = [
    { path: '/dashboard', icon: FaHome, label: 'Dashboard' },
    { path: '/events', icon: FaHome, label: 'Browse Events' },
    { path: '/bookings', icon: FaCalendarAlt, label: 'My Bookings' },
    { path: '/wishlist', icon: FaHeart, label: 'Wishlist' },
    { path: '/payment-history', icon: FaWallet, label: 'Payment History' },
    { path: '/profile', icon: FaCog, label: 'Profile' }
  ]

  const wishlistCount = 0

  return (
    <>
      {/* Top Navigation */}
      <Navbar bg="light" expand="lg" className="shadow-sm sticky-top">
        <Container fluid>
          <div className="d-flex align-items-center">
            <Button
              variant="link"
              className="btn btn-link text-secondary border-0 d-lg-none me-2"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <FaBars size={24} />
            </Button>

            <Navbar.Brand as={Link} to="/">
              <span className="text-primary-gradient fw-bold fs-4">Eventify</span>
            </Navbar.Brand>
          </div>

          <Nav className="align-items-center ms-auto">
            {/* Wishlist */}
            <Button variant="link" as={Link} to="/customer/wishlist" className="btn text-secondary position-relative me-3">
              <FaHeart size={18} />
              {wishlistCount > 0 && (
                <Badge
                  bg="primary"
                  pill
                  className="position-absolute top-0 start-100 translate-middle"
                  style={{ fontSize: '0.65rem' }}
                >
                  {wishlistCount}
                </Badge>
              )}
            </Button>

            {/* User Dropdown */}
            <Dropdown>
              <Dropdown.Toggle variant="link" className="app-user-dropdown-toggle">
                <div className="app-user-trigger app-user-trigger-text-only">
                  <div className="app-user-meta d-none d-md-flex">
                    <span className="app-user-name">{user?.profile?.firstName || 'User'}</span>
                    <span className="app-user-role text-capitalize">{user?.role || 'Customer'}</span>
                  </div>
                </div>
                <FaChevronDown size={12} className="ms-2" />
              </Dropdown.Toggle>

              <Dropdown.Menu align="end">
                <Dropdown.Header>
                  <strong>{user?.profile?.firstName} {user?.profile?.lastName}</strong>
                  <br />
                  <small className="text-muted">{user?.email}</small>
                </Dropdown.Header>

                <Dropdown.Divider />

                {customerMenuItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.path)

                  return (
                    <Dropdown.Item
                      key={item.path}
                      as={Link}
                      to={`/customer${item.path}`}
                      className={active ? 'active' : ''}
                    >
                      <Icon className="me-2" /> {item.label}
                    </Dropdown.Item>
                  )
                })}

                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="text-danger">
                  <FaSignOutAlt className="me-2" /> Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Container>
      </Navbar>

      {/* Mobile Menu */}
      <Collapse in={showMobileMenu}>
        <div className="d-lg-none bg-white border-bottom py-3">
          <Container>
            <div className="d-flex flex-column gap-2">
              {customerMenuItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)

                return (
                  <Button
                    key={item.path}
                    as={Link}
                    to={`/customer${item.path}`}
                    variant={active ? 'primary' : 'light'}
                    className="justify-content-start text-start"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Icon className="me-2" /> {item.label}
                  </Button>
                )
              })}
            </div>
          </Container>
        </div>
      </Collapse>

      {/* Main Content */}
      <main className="flex-grow-1">
        <Container fluid className="py-4">
          <Outlet />
        </Container>
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="d-lg-none fixed-bottom bg-white border-top py-2">
        <Container fluid>
          <div className="d-flex justify-content-around">
            {customerMenuItems.slice(0, 5).map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)

              return (
                <Button
                  key={item.path}
                  as={Link}
                  to={`/customer${item.path}`}
                  variant="link"
                  className={`d-flex flex-column align-items-center p-2 ${active ? 'text-primary' : 'text-muted'}`}
                >
                  <Icon size={20} />
                  <small className="mt-1">{item.label}</small>
                </Button>
              )
            })}
          </div>
        </Container>
      </nav>
    </>
  )
}

export default CustomerLayout
