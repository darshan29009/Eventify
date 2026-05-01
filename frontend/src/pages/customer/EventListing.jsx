import React, { useEffect, useState, useMemo } from 'react'
import { Container, Row, Col, Card, Button, Form, Pagination, Badge, Spinner } from 'react-bootstrap'
import { Link, useSearchParams } from 'react-router-dom'
import { api, makeRequest } from '../../services/api'
import { formatCurrency, EVENT_TYPE_LABELS, CITIES } from '../../constants/appConstants'
import { FaSearch, FaFilter, FaEye, FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaImage } from 'react-icons/fa'

// Get API URL for constructing absolute image URLs
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const EventListing = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [showFilters, setShowFilters] = useState(false)

  // Filters state
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    subType: searchParams.get('subType') || '',
    city: searchParams.get('city') || '',
    search: searchParams.get('search') || '',
    order: searchParams.get('order') || 'desc'
  })

  useEffect(() => {
    fetchEvents()
  }, [pagination.page, filters])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        limit: 20,
        ...filters
      }

      const response = await makeRequest(api.events(params))
      setEvents(response.data.events)
      setPagination(response.data.pagination)
      setError(null)
    } catch (error) {
      console.error('Error fetching events:', error)
      setError(error.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({
      type: '',
      subType: '',
      city: '',
      search: '',
      order: 'desc'
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const activeFilterCount = Object.values(filters).filter(v => v !== '' && v !== null && v !== 'createdAt' && v !== 'desc').length

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="page-title mb-0">Explore Events</h2>
          <p className="text-muted mb-0">Find the perfect venue and package for your special day</p>
        </div>
        <Button
          variant="outline-primary"
          className="d-lg-none"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter className="me-2" /> Filters
          {activeFilterCount > 0 && (
            <Badge bg="primary" pill className="ms-2">{activeFilterCount}</Badge>
          )}
        </Button>
      </div>

      <Row>
        {/* Filters Sidebar */}
        <Col lg={3} className={`${showFilters ? 'd-block' : 'd-none'} d-lg-block`}>
          <Card className="filter-sidebar">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center pb-2">
              <h5 className="mb-0 fw-bold">Filters</h5>
              {activeFilterCount > 0 && (
                <Button variant="link" size="sm" onClick={clearFilters} className="p-0 text-primary">
                  Clear All
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              {/* Search */}
              <Form.Group className="mb-3">
                <Form.Label htmlFor="search-input">Search</Form.Label>
                <div className="search-box customer-search-box">
                  <FaSearch className="icon" />
                  <Form.Control
                    id="search-input"
                    name="search"
                    type="text"
                    autoComplete="off"
                    placeholder="Search events..."
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                  />
                </div>
              </Form.Group>

              {/* Event Type */}
              <Form.Group className="mb-3">
                <Form.Label htmlFor="event-type-filter">Event Type</Form.Label>
                <Form.Select
                  id="event-type-filter"
                  name="eventType"
                  autoComplete="off"
                  value={filters.type}
                  onChange={(e) => {
                    updateFilter('type', e.target.value)
                    updateFilter('subType', '') // Reset sub-type when type changes
                  }}
                >
                  <option value="">All Types</option>
                  {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* City */}
              <Form.Group className="mb-3">
                <Form.Label htmlFor="city-filter">City</Form.Label>
                <Form.Select
                  id="city-filter"
                  name="city"
                  autoComplete="off"
                  value={filters.city}
                  onChange={(e) => updateFilter('city', e.target.value)}
                >
                  <option value="">All Cities</option>
                  {CITIES.map(city => (
                    <option key={city.code} value={city.name}>{city.name}, {city.state}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Button variant="primary" className="w-100" onClick={() => setShowFilters(false)}>
                Apply Filters
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Events Grid */}
        <Col lg={9}>
          {/* Results Header */}
          <div className="results-header">
            <div className="results-count">
              <strong>{pagination.total}</strong> events found
              {activeFilterCount > 0 && (
                <Button variant="link" size="sm" onClick={clearFilters} className="p-0 ms-2 text-primary">
                  Clear filters
                </Button>
              )}
            </div>
            <div className="results-actions">
              <Button
                variant={filters.order === 'asc' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => updateFilter('order', filters.order === 'asc' ? 'desc' : 'asc')}
              >
                {filters.order === 'asc' ? '↑ Price: Low to High' : '↓ Price: High to Low'}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : events.length === 0 ? (
            <Card className="text-center py-5 border-0 shadow-sm">
              <Card.Body className="py-5">
                <div className="empty-state-icon mb-4">
                  <FaSearch size={80} className="text-muted opacity-50" />
                </div>
                <h4 className="mb-2">No Events Found</h4>
                <p className="text-muted mb-4">Try adjusting your search filters to find what you're looking for</p>
                <Button variant="primary" onClick={clearFilters} className="btn-primary-custom">
                  <FaFilter className="me-2" />
                  Clear All Filters
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <>
              <Row g={3}>
                {events.map((event) => {
                  // Construct image URL - handle different possible formats
                  let imgUrl = null;

                  // Try event.images first (array of objects with url property)
                  if (event.images?.length > 0) {
                    imgUrl = event.images[0].url || event.images[0];
                  }
                  // Try venue images
                  else if (event.venues?.[0]?.images?.length > 0) {
                    imgUrl = event.venues[0].images[0]?.url || event.venues[0].images[0];
                  }

                  // If the URL is relative, make it absolute using API base URL
                  if (imgUrl && imgUrl.startsWith('/') && !imgUrl.startsWith('//')) {
                    const apiBase = API_URL?.replace('/api', '') || 'http://localhost:5000';
                    imgUrl = apiBase + imgUrl;
                  }

                  return (
                  <Col md={6} lg={4} key={event._id}>
                    <Card className="event-card h-100">
                      <div className="event-card-img-wrapper">
                        {imgUrl ? (
                          <Card.Img
                            variant="top"
                            src={imgUrl}
                            className="event-card-img"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling?.classList.remove('d-none');
                            }}
                          />
                        ) : null}
                        <div className={imgUrl ? 'd-none' : 'event-card-img-placeholder'}>
                          <div className="placeholder-content">
                            <FaImage size={48} className="text-muted mb-2" />
                            <small>No Image</small>
                          </div>
                        </div>
                        <Badge
                          bg="dark"
                          className="event-card-badge"
                        >
                          {EVENT_TYPE_LABELS[event.type]}
                        </Badge>
                      </div>

                      <Card.Body className="d-flex flex-column">
                        <Card.Title as="h5" className="mb-2">{event.name}</Card.Title>
                        <Card.Text className="text-muted small mb-3">
                          {event.shortDescription || event.description.substring(0, 100) + '...'}
                        </Card.Text>

                        {/* Location & Venue */}
                        <div className="d-flex flex-wrap gap-3 mb-3 text-muted small">
                          {event.venues?.[0] && (
                            <div className="d-flex align-items-center">
                              <FaMapMarkerAlt className="me-1" />
                              {event.venues[0].city}
                            </div>
                          )}
                          {event.lowestPrice > 0 && (
                            <div className="d-flex align-items-center">
                              <FaUsers className="me-1" />
                              Up to {event.venues?.[0]?.capacity?.max || '50'} guests
                            </div>
                          )}
                        </div>

                        {/* Ratings */}
                        {event.averageRating > 0 && (
                          <div className="mb-3">
                            <Badge bg="warning" className="me-1">
                              ⭐ {event.averageRating.toFixed(1)}
                            </Badge>
                            <small className="text-muted">({event.totalReviews || 0} reviews)</small>
                          </div>
                        )}

                        {/* Price */}
                        <div className="mt-auto mb-3">
                          <div className="d-flex align-items-baseline gap-2">
                            <span className="price-current">
                              {formatCurrency(event.lowestPrice)}
                            </span>
                            <span className="text-muted small">starting from</span>
                          </div>
                        </div>

                        <Button
                          variant="primary"
                          as={Link}
                          to={`/customer/events/${event._id}`}
                          className="w-100"
                        >
                          <FaEye className="me-2" /> View Details
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
              </Row>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination>
                    <Pagination.Prev
                      disabled={pagination.page === 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    />
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      let pageNum
                      if (pagination.pages <= 5) {
                        pageNum = i + 1
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1
                      } else if (pagination.page >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i
                      } else {
                        pageNum = pagination.page - 2 + i
                      }

                      return (
                        <Pagination.Item
                          key={pageNum}
                          active={pageNum === pagination.page}
                          onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        >
                          {pageNum}
                        </Pagination.Item>
                      )
                    })}
                    <Pagination.Next
                      disabled={pagination.page === pagination.pages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Col>
      </Row>
    </Container>
  )
}

export default EventListing
