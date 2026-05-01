import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Container, Row, Col, Card, Button, Badge, Tab, Tabs, Carousel, Spinner } from 'react-bootstrap'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { formatCurrency, EVENT_TYPE_LABELS } from '../../constants/appConstants'
import toast from 'react-hot-toast'
import {
  FaCalendarAlt, FaUsers, FaMapMarkerAlt, FaCheck,
  FaStar, FaHeart, FaPhone, FaEnvelope,
  FaClock, FaShieldAlt, FaUndo, FaParking, FaImage
} from 'react-icons/fa'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')

const resolveImageUrl = (value) => {
  if (!value) return ''
  if (typeof value === 'object') {
    return resolveImageUrl(value.url)
  }
  if (typeof value !== 'string') return ''
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
    return value
  }
  if (value.startsWith('/assets/')) {
    return value
  }
  if (value.startsWith('/')) {
    return `${API_BASE_URL}${value}`
  }
  return `${API_BASE_URL}/${value.replace(/^\.?\//, '')}`
}

const EventDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { axios, isAuthenticated } = useAuth()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [wishlisted, setWishlisted] = useState(false)

  useEffect(() => {
    if (id) {
      fetchEvent()
    }
  }, [id])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/customers/events/${id}`)
      setEvent(response.data.data)
      const wishlistRes = isAuthenticated
        ? await axios.get('/customers/wishlist')
        : null
      if (wishlistRes) {
        const wishlistItems = wishlistRes.data?.data || []
        setWishlisted(wishlistItems.some(item => item.event?._id === response.data.data._id))
      }

      // Select first active package by default
      const activePkg = response.data.data.packages?.find(p => p.isActive)
      setSelectedPackage(activePkg)
    } catch (error) {
      console.error('Error fetching event:', error)
      setError(error.response?.data?.message || 'Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  const handleBookNow = () => {
    if (!isAuthenticated) {
      toast.error('Please login to book this event')
      navigate('/login', { state: { from: `/customer/events/${id}` } })
      return
    }

    if (!selectedPackage) {
      toast.error('Please select a package')
      return
    }

    navigate('/customer/events/book', {
      state: {
        eventId: event._id,
        package: selectedPackage
      }
    })
  }

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to use wishlist')
      navigate('/login', { state: { from: `/customer/events/${id}` } })
      return
    }

    try {
      if (wishlisted) {
        await axios.delete(`/customers/wishlist/${event._id}`)
        setWishlisted(false)
        toast.success('Removed from wishlist')
      } else {
        await axios.post(`/customers/wishlist/${event._id}`)
        setWishlisted(true)
        toast.success('Added to wishlist')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update wishlist')
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <Container className="py-4">
        <div className="alert alert-danger">
          <p>{error || 'Event not found'}</p>
          <Button as={Link} to="/customer/events">Back to Events</Button>
        </div>
      </Container>
    )
  }

  const images = [
    ...(Array.isArray(event.images) ? event.images : []),
    ...(Array.isArray(event.venues)
      ? event.venues.flatMap((venue) => Array.isArray(venue?.images) ? venue.images : [])
      : [])
  ]
    .map(img => resolveImageUrl(img))
    .filter(Boolean)

  return (
    <Container fluid className="py-4">
      <Row>
        {/* Image Gallery */}
        <Col lg={8}>
          {images.length > 0 ? (
            <Carousel interval={null} className="mb-4" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              {images.map((img, idx) => (
                <Carousel.Item key={idx}>
                  <img
                    src={img}
                    alt={`${event.name} - Image ${idx + 1}`}
                    className="d-block w-100"
                    style={{ height: '500px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </Carousel.Item>
              ))}
            </Carousel>
          ) : (
            <div className="mb-4 bg-light d-flex align-items-center justify-content-center" style={{ borderRadius: '12px', height: '500px' }}>
              <div className="text-center">
                <FaImage size={64} className="text-muted mb-3" />
                <p className="text-muted">No images available</p>
              </div>
            </div>
          )}

          {/* Event Content */}
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h1 className="h2 mb-2">{event.name}</h1>
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    <Badge bg="info">{EVENT_TYPE_LABELS[event.type]}</Badge>
                    {event.subType && <Badge bg="secondary">{event.subType}</Badge>}
                    {event.isFeatured && <Badge bg="warning">Featured</Badge>}
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <Button variant="outline-danger" onClick={handleWishlist}>
                    <FaHeart className={wishlisted ? 'text-danger' : ''} />
                  </Button>
                </div>
              </div>

              {/* Meta Info */}
              <div className="d-flex flex-wrap gap-4 mb-4 text-muted">
                {event.venues?.[0] && (
                  <div className="d-flex align-items-center">
                    <FaMapMarkerAlt className="me-2 text-primary" />
                    <span>{event.venues[0].city}, {event.venues[0].state}</span>
                  </div>
                )}
                {event.lowestPrice > 0 && (
                  <div className="d-flex align-items-center">
                    <FaUsers className="me-2 text-primary" />
                    <span>Up to {event.venues?.[0]?.capacity?.max || '50'} guests</span>
                  </div>
                )}
                {event.averageRating > 0 && (
                  <div className="d-flex align-items-center">
                    <FaStar className="me-2 text-warning" />
                    <strong>{event.averageRating.toFixed(1)}</strong>
                    <span className="ms-1">({event.totalReviews} reviews)</span>
                  </div>
                )}
              </div>

              <Tabs defaultActiveKey="description" id="event-tabs" className="mb-3">
                <Tab eventKey="description" title="Description">
                  <div className="py-3">
                    <p className="lead">{event.description}</p>
                  </div>
                </Tab>

                <Tab eventKey="packages" title="Packages">
                  <div className="py-3">
                    <Row>
                      {event.packages?.filter(p => p.isActive).map(pkg => (
                        <Col md={6} key={pkg._id} className="mb-3">
                          <Card
                            className={`h-100 ${selectedPackage?._id === pkg._id ? 'border-primary' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedPackage(pkg)}
                          >
                            <Card.Header className="bg-white">
                              <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">{pkg.displayName}</h5>
                                {selectedPackage?._id === pkg._id && (
                                  <Badge bg="primary">Selected</Badge>
                                )}
                              </div>
                            </Card.Header>
                            <Card.Body>
                              <h3 className="text-primary mb-3">
                                {formatCurrency(pkg.price)}
                                {pkg.discountedPrice && (
                                  <small className="text-muted text-decoration-line-through ms-2">
                                    {formatCurrency(pkg.discountedPrice)}
                                  </small>
                                )}
                              </h3>
                              <p>{pkg.description}</p>

                              <div className="mb-3">
                                <strong>Capacity:</strong> Up to {pkg.maxGuests} guests
                              </div>
                              <div className="mb-3">
                                <strong>Duration:</strong> {pkg.duration}
                              </div>

                              {pkg.includedServices?.length > 0 && (
                                <div>
                                  <strong>What's Included:</strong>
                                  <ul className="mt-2">
                                    {pkg.includedServices.slice(0, 5).map((service, idx) => (
                                      <li key={idx} className="small">
                                        {service.icon} {service.name}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                </Tab>

                <Tab eventKey="venues" title="Venues">
                  <div className="py-3">
                    {event.venues?.map((venue, idx) => (
                      <Card key={idx} className="mb-3">
                        <Card.Body>
                          <h5>{venue.name}</h5>
                          <p className="text-muted">{venue.address}</p>
                          <Row>
                            <Col md={6}>
                              <p><FaUsers className="me-2" /> Capacity: {venue.capacity.min} - {venue.capacity.max}</p>
                              <p><FaMapMarkerAlt className="me-2" /> {venue.city}, {venue.state}</p>
                            </Col>
                            <Col md={6}>
                              <p><FaCalendarAlt className="me-2" /> Price: {formatCurrency(venue.price)}</p>
                              <p><FaParking className="me-2" /> Parking: {venue.parking ? 'Available' : 'Not Available'}</p>
                            </Col>
                          </Row>
                          {venue.amenities && (
                            <div className="mt-2">
                              {venue.amenities.map((amenity, i) => (
                                <Badge key={i} bg="light" text="dark" className="me-1 mb-1">
                                  {amenity}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>

          {/* Highlights */}
          {event.highlights?.length > 0 && (
            <Card className="mb-4">
              <Card.Body>
                <h4 className="mb-3">Event Highlights</h4>
                <Row>
                  {event.highlights.map((highlight, idx) => (
                    <Col md={6} key={idx} className="mb-2">
                      <div className="d-flex align-items-center">
                        <FaCheck className="text-success me-2" />
                        <span>{highlight}</span>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* Cancellation Policy */}
          {event.cancellationPolicy && (
            <Card className="mb-4">
              <Card.Body>
                <h5><FaUndo className="me-2 text-warning" /> Cancellation Policy</h5>
                <p className="mb-0">{event.cancellationPolicy}</p>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Booking Sidebar */}
        <Col lg={4}>
          <Card className="sticky-top customer-booking-card" style={{ top: '80px' }}>
            <Card.Body>
              {selectedPackage && (
                <>
                  <h5 className="mb-3 customer-booking-title">Book This Event</h5>

                  <div className="mb-3">
                    <label className="form-label">Select Package</label>
                    {event.packages?.filter(p => p.isActive).map(pkg => (
                      <div
                        key={pkg._id}
                        className={`form-check card p-3 mb-2 customer-package-option ${selectedPackage._id === pkg._id ? 'border-primary active' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedPackage(pkg)}
                      >
                        <input
                          type="radio"
                          className="form-check-input"
                          checked={selectedPackage._id === pkg._id}
                          readOnly
                        />
                        <div className="customer-package-copy">
                          <strong>{pkg.displayName}</strong>
                          <div className="text-muted small">{formatCurrency(pkg.price)}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-top pt-3 mb-3">
                    <Row className="text-center">
                      <Col>
                        <div className="text-muted small">Total Amount</div>
                        <div className="h4 text-primary fw-bold mb-0">
                          {formatCurrency(selectedPackage.price)}
                        </div>
                      </Col>
                    </Row>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-100 mb-2 customer-book-now-btn"
                    onClick={handleBookNow}
                  >
                    Book This Event
                  </Button>

                  <div className="text-center text-muted small">
                    <FaShieldAlt className="me-1" /> Secure booking guaranteed
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default EventDetail
