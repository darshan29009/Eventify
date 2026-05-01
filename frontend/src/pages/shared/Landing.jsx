import React from 'react'
import { Container, Row, Col, Button, Card, Carousel } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { EVENT_TYPE_LABELS } from '../../constants/appConstants'
import {
  FaArrowRight, FaUsers, FaCalendarCheck, FaCalendarAlt, FaMoneyBillWave,
  FaShieldAlt, FaHeadset, FaClock, FaCheckCircle
} from 'react-icons/fa'

const Landing = () => {
  const { isAuthenticated, user } = useAuth()
  const { darkMode } = useTheme()

  const features = [
    {
      icon: FaCalendarCheck,
      title: 'Easy Booking',
      description: 'Book events in minutes with our simple 3-step process'
    },
    {
      icon: FaUsers,
      title: 'Professional Team',
      description: 'Experienced event managers, decorators, and coordinators'
    },
    {
      icon: FaMoneyBillWave,
      title: 'Best Prices',
      description: 'Competitive pricing with transparent billing'
    },
    {
      icon: FaShieldAlt,
      title: 'Secure Payment',
      description: 'SSL encrypted payments with multiple options'
    },
    {
      icon: FaClock,
      title: 'On-Time Delivery',
      description: 'We guarantee timely execution of all events'
    },
    {
      icon: FaHeadset,
      title: '24/7 Support',
      description: 'Always here to help you plan your perfect event'
    }
  ]

  const eventTypes = Object.entries(EVENT_TYPE_LABELS).slice(0, 6)

  const stats = [
    { value: '500+', label: 'Events Managed' },
    { value: '1000+', label: 'Happy Customers' },
    { value: '50+', label: 'Expert Team' },
    { value: '98%', label: 'Satisfaction Rate' }
  ]

  const testimonials = [
    {
      name: 'Priya Sharma',
      event: 'Wedding',
      text: 'Eventify made our dream wedding come true. Everything was perfectly organized!',
      rating: 5
    },
    {
      name: 'Rahul Verma',
      event: 'Corporate Event',
      text: 'Professional service with great attention to detail. Highly recommended!',
      rating: 5
    },
    {
      name: 'Anjali Patel',
      event: 'Birthday Party',
      text: 'Amazing experience! The team was very cooperative and creative.',
      rating: 5
    }
  ]

  return (
    <div className={darkMode ? 'bg-dark text-light' : 'bg-light'}>
      {/* Hero Section */}
      <section className="position-relative overflow-hidden"
               style={{
                 background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                 minHeight: '80vh',
                 display: 'flex',
                 alignItems: 'center'
               }}>
        <Container fluid>
          <Row className="align-items-center min-vh-75">
            <Col lg={6}>
              <div className="text-white p-lg-5">
                <h1 className="display-3 fw-bold mb-4">
                  Create Unforgettable <span className="text-warning">Events</span>
                </h1>
                <p className="lead mb-4">
                  From intimate gatherings to grand celebrations, we bring your vision to life.
                  Experience premium event management with Eventify.
                </p>
                <div className="d-flex gap-3 flex-wrap">
                  {isAuthenticated ? (
                    <Button variant="light" size="lg" as={Link} to="/customer/dashboard">
                      Go to Dashboard <FaArrowRight className="ms-2" />
                    </Button>
                  ) : (
                    <>
                      <Button variant="light" size="lg" as={Link} to="/register">
                        Get Started <FaArrowRight className="ms-2" />
                      </Button>
                      <Button variant="outline-light" size="lg" as={Link} to="/login">
                        Login
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Col>
            <Col lg={6} className="d-none d-lg-block">
              <div className="position-relative">
                <img
                  src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=600&fit=crop"
                  alt="Event"
                  className="img-fluid rounded-3 shadow-lg"
                />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="py-5 position-relative" style={{ marginTop: '-50px' }}>
        <Container>
          <Row>
            {stats.map((stat, idx) => (
              <Col key={idx} className="text-center mb-4">
                <div className="bg-white rounded-3 shadow p-4">
                  <h2 className="display-4 fw-bold text-primary mb-0">{stat.value}</h2>
                  <p className="text-muted mb-0">{stat.label}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Event Types */}
      <section className="py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="h1 fw-bold mb-3">Explore Event Categories</h2>
            <p className="lead text-muted">Choose from our wide range of event types</p>
          </div>

          <Row>
            {eventTypes.map(([value, label]) => (
              <Col md={4} lg={3} key={value} className="mb-4">
                <Card className="h-100 event-card">
                  <Card.Body className="text-center p-4">
                    <div className="mb-3">
                      <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center"
                           style={{ width: '80px', height: '80px' }}>
                        <FaCalendarAlt size={36} />
                      </div>
                    </div>
                    <Card.Title>{label}</Card.Title>
                    <Button variant="outline-primary" as={Link} to={`/customer/events?type=${value}`}>
                      Explore
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Features */}
      <section className="py-5 bg-light">
        <Container>
          <div className="text-center mb-5">
            <h2 className="h1 fw-bold mb-3">Why Choose Eventify?</h2>
            <p className="lead text-muted">We deliver exceptional experiences</p>
          </div>

          <Row>
            {features.map((feature, idx) => (
              <Col md={4} key={idx} className="mb-4">
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="text-center p-4">
                    <div className="mb-3">
                      <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                           style={{ width: '64px', height: '64px' }}>
                        <feature.icon size={28} />
                      </div>
                    </div>
                    <Card.Title as="h4">{feature.title}</Card.Title>
                    <Card.Text className="text-muted">{feature.description}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="h1 fw-bold mb-3">How It Works</h2>
            <p className="lead text-muted">Simple 3-step process to book your dream event</p>
          </div>

          <Row>
            <Col md={4} className="text-center mb-4">
              <div className="position-relative mb-3">
                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mx-auto"
                     style={{ width: '100px', height: '100px' }}>
                  <span className="display-4 fw-bold">1</span>
                </div>
              </div>
              <h4>Browse Events</h4>
              <p className="text-muted">Explore our curated collection of event packages and venues</p>
            </Col>

            <Col md={4} className="text-center mb-4">
              <div className="position-relative mb-3">
                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mx-auto"
                     style={{ width: '100px', height: '100px' }}>
                  <span className="display-4 fw-bold">2</span>
                </div>
              </div>
              <h4>Customize & Book</h4>
              <p className="text-muted">Select your preferences and make a secure booking</p>
            </Col>

            <Col md={4} className="text-center mb-4">
              <div className="position-relative mb-3">
                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mx-auto"
                     style={{ width: '100px', height: '100px' }}>
                  <span className="display-4 fw-bold">3</span>
                </div>
              </div>
              <h4>Enjoy Your Event</h4>
              <p className="text-muted">Sit back and let us handle the details while you celebrate</p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Testimonials */}
      <section className="py-5 bg-light">
        <Container>
          <div className="text-center mb-5">
            <h2 className="h1 fw-bold mb-3">What Our Customers Say</h2>
          </div>

          <Row>
            {testimonials.map((testimonial, idx) => (
              <Col md={4} key={idx} className="mb-4">
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body>
                    <div className="mb-3">
                      {'★'.repeat(testimonial.rating)}
                    </div>
                    <Card.Text className="fst-italic">"{testimonial.text}"</Card.Text>
                  </Card.Body>
                  <Card.Footer className="bg-white">
                    <strong>{testimonial.name}</strong>
                    <br />
                    <small className="text-muted">{testimonial.event}</small>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-5"
               style={{
                 background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                 color: 'white'
               }}>
        <Container className="text-center">
          <h2 className="h1 fw-bold mb-4">Ready to Create Your Perfect Event?</h2>
          <p className="lead mb-4">Join thousands of happy customers who trust Eventify</p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            {isAuthenticated ? (
              <Button variant="light" size="lg" as={Link} to="/customer/events">
                Browse Events <FaArrowRight className="ms-2" />
              </Button>
            ) : (
              <>
                <Button variant="light" size="lg" as={Link} to="/register">
                  Get Started Free <FaArrowRight className="ms-2" />
                </Button>
                <Button variant="outline-light" size="lg" as={Link} to="/login">
                  Customer Login
                </Button>
              </>
            )}
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-light py-4">
        <Container>
          <Row>
            <Col md={6}>
              <h5>Eventify</h5>
              <p className="small mb-0">Your trusted partner for memorable events</p>
            </Col>
            <Col md={6} className="text-md-end">
              <p className="small mb-0">© {new Date().getFullYear()} Eventify by Brainybeam Info-Tech</p>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  )
}

export default Landing
