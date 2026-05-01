import React, { useState } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FaUser, FaLock, FaSpinner } from 'react-icons/fa'

const Login = ({ defaultRole = null }) => {
  const { login } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const pageTitle = 'Eventify Login'
  const pageSubtitle = 'Sign in with your email and password'

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await login(formData.email, formData.password)

      if (!result.success) {
        setError(result.error)
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <Container>
      <Row>
        <Col md={6} lg={4} className="mx-auto">
          <Card className="login-card">
            <Card.Header className="login-card-header">
              <h2>{pageTitle}</h2>
              <p>{pageSubtitle}</p>
            </Card.Header>
            <Card.Body className="login-card-body">
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit} className="login-form">
                  {/* Email Field */}
                  <Form.Group className="mb-4">
                    <Form.Label htmlFor="login-email">Email address</Form.Label>
                    <div className="input-with-icon">
                      <Form.Control
                        id="login-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                      <FaUser className="icon" />
                    </div>
                  </Form.Group>

                  {/* Password Field */}
                  <Form.Group className="mb-4">
                    <Form.Label htmlFor="login-password">Password</Form.Label>
                    <div className="input-with-icon">
                      <Form.Control
                        id="login-password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <FaLock className="icon" />
                    </div>
                  </Form.Group>

                  {/* Submit Button */}
                  <Button
                    variant="primary"
                    type="submit"
                    className="btn-login w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="fa-spin me-2" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>

                  <div className="text-center mt-3">
                    <Link to="/forgot-password" className="text-decoration-none text-muted small">
                      Forgot Password?
                    </Link>
                  </div>
                </Form>

                <hr className="my-4" />

                <div className="text-center">
                  <p className="mb-2 text-muted">Don't have an account?</p>
                  <Button variant="outline-primary" as={Link} to="/register" className="px-4">
                    Create Account
                  </Button>
                </div>
              </Card.Body>

              <div className="demo-credentials">
                <p className="mb-1"><strong>Demo Credentials:</strong></p>
                <p className="mb-0">
                  <strong>Admin:</strong> admin@eventify.com / Admin@123
                </p>
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default Login
