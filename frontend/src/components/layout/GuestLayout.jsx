import React from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { Container, Navbar, Nav, Button, NavDropdown } from 'react-bootstrap'
import { useAuth } from '../../context/AuthContext'
import { FaHome, FaUser } from 'react-icons/fa'

const GuestLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <>
      {/* Navbar */}
      <Navbar bg="light" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand as={Link} to="/">
            <span className="text-primary-gradient fw-bold fs-4">Eventify</span>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
            <Nav className="align-items-center">
              <Link to="/" className="nav-link me-3">
                <FaHome className="me-1" /> Home
              </Link>

              {user ? (
                <>
                  <NavDropdown
                    title={<><FaUser className="me-2" /> {user.profile?.firstName || 'User'}</>}
                    id="basic-nav-dropdown"
                  >
                    <NavDropdown.Item as={Link} to="/customer/dashboard">
                      Dashboard
                    </NavDropdown.Item>

                    <NavDropdown.Item as={Link} to="/customer/profile">
                      Profile
                    </NavDropdown.Item>

                    {user.role === 'admin' && (
                      <NavDropdown.Item as={Link} to="/admin/dashboard">
                        Admin Panel
                      </NavDropdown.Item>
                    )}

                    {user.role === 'employee' && (
                      <NavDropdown.Item as={Link} to="/employee/dashboard">
                        Employee Panel
                      </NavDropdown.Item>
                    )}

                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={handleLogout}>
                      Logout
                    </NavDropdown.Item>
                  </NavDropdown>
                </>
              ) : (
                <div className="d-flex gap-2">
                  <Button variant="outline-primary" as={Link} to="/login">
                    Login
                  </Button>
                  <Button variant="primary" as={Link} to="/register">
                    Sign Up
                  </Button>
                </div>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <main className="flex-grow-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-dark text-light py-4 mt-auto">
        <Container className="text-center">
          <p className="mb-0">
            © {new Date().getFullYear()} Eventify by Brainybeam Info-Tech. All rights reserved.
          </p>
        </Container>
      </footer>
    </>
  )
}

export default GuestLayout
