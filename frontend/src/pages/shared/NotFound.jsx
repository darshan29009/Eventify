import React from 'react'
import { Container, Row, Col, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { FaHome, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa'

const NotFound = () => {
  const { darkMode } = useTheme()

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center py-5" style={{
      background: darkMode ? '#0a0a0a' : '#f8f9fa'
    }}>
      <Row>
        <Col lg={8} xl={6} className="text-center mx-auto">
          {/* 404 Icon */}
          <div className="mb-4">
            <FaExclamationTriangle
              size={120}
              className="text-warning mb-3"
              style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
            />
            <h1 className="display-1 fw-bold mb-0" style={{
              color: darkMode ? '#667eea' : '#667eea',
              fontSize: '8rem',
              lineHeight: 1
            }}>
              404
            </h1>
          </div>

          {/* Content */}
          <h2 className="mb-3" style={{
            color: darkMode ? '#ffffff' : '#2d3748',
            fontWeight: '600',
            fontSize: '2rem'
          }}>
            Oops! Page Not Found
          </h2>

          <p className="lead mb-4" style={{
            color: darkMode ? '#a0aec0' : '#718096',
            fontSize: '1.1rem'
          }}>
            The page you're looking for seems to have vanished into the void.
            Don't worry, even the best events sometimes get lost in translation!
          </p>

          {/* Actions */}
          <div className="d-flex gap-3 justify-content-center flex-wrap mt-4">
            <Link to="/">
              <Button
                variant="primary"
                size="lg"
                className="px-4"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '8px'
                }}
              >
                <FaHome className="me-2" />
                Back to Home
              </Button>
            </Link>

            <Button
              variant="outline-secondary"
              size="lg"
              className="px-4"
              onClick={() => window.history.back()}
              style={{
                borderWidth: '2px',
                borderRadius: '8px',
                color: darkMode ? '#a0aec0' : '#4a5568',
                borderColor: darkMode ? '#4a5568' : '#cbd5e0'
              }}
            >
              <FaArrowLeft className="me-2" />
              Go Back
            </Button>
          </div>

          {/* Decorative Elements */}
          <div className="mt-5 pt-4" style={{
            borderTop: `1px dashed ${darkMode ? '#2d3748' : '#e2e8f0'}`
          }}>
            <p className="mb-0" style={{ color: darkMode ? '#718096' : '#a0aec0' }}>
              {/* eslint-disable-next-line no-inner-declarations */}
              {(() => {
                const funnyMsg = [
                  "While you're here, why not plan an event?",
                  "Lost? Our events are never lost!",
                  "404: Page not found, but events are always around the corner!",
                  "This page took a day off. We'll find it tomorrow!"
                ]
                return funnyMsg[Math.floor(Math.random() * funnyMsg.length)]
              })()}
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  )
}

export default NotFound
