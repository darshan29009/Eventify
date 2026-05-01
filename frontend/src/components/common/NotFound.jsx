import React from 'react'
import { Container, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { FaHome, FaArrowLeft } from 'react-icons/fa'

const NotFound = () => {
  return (
    <Container fluid className="d-flex align-items-center justify-content-center min-vh-100">
      <div className="text-center">
        <h1 className="display-1 fw-bold text-primary mb-4">404</h1>
        <h2 className="mb-3">Page Not Found</h2>
        <p className="text-muted mb-4">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="d-flex gap-3 justify-content-center">
          <Button variant="primary" as={Link} to="/">
            <FaHome className="me-2" /> Go Home
          </Button>
          <Button variant="outline-secondary" onClick={() => window.history.back()}>
            <FaArrowLeft className="me-2" /> Go Back
          </Button>
        </div>
      </div>
    </Container>
  )
}

export default NotFound
