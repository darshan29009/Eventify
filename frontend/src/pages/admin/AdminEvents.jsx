import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Table, Badge, Button, Form, Pagination, Spinner } from 'react-bootstrap'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api, makeRequest } from '../../services/api'
import { formatCurrency, formatDate, EVENT_TYPE_LABELS, DEFAULT_EVENT_IMAGE } from '../../constants/appConstants'
import { FaEdit, FaTrash, FaPlus, FaEye, FaImage } from 'react-icons/fa'

// Get API URL for constructing absolute image URLs
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const AdminEvents = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    isActive: searchParams.get('isActive') ?? true
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

      const response = await makeRequest(api.adminEvents(params))
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const deleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return

    try {
      await makeRequest(api.deleteEvent(id))
      toast.success('Event deleted successfully')
      fetchEvents()
    } catch (error) {
      toast.error(error.message || 'Failed to delete event')
    }
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="page-title mb-0">Event Management</h2>
          <p className="text-muted mb-0">Manage all event packages and themes</p>
        </div>
        <Button variant="primary" as={Link} to="/admin/events/new">
          <FaPlus className="me-2" /> Add Event
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={2}>
              <Form.Group>
                <Form.Label htmlFor="event-type-select">Event Type</Form.Label>
                <Form.Select
                  id="event-type-select"
                  name="eventType"
                  autoComplete="off"
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="">All Types</option>
                  {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2}>
              <Form.Group>
                <Form.Label htmlFor="status-select">Status</Form.Label>
                <Form.Select
                  id="status-select"
                  name="status"
                  autoComplete="off"
                  value={String(filters.isActive)}
                  onChange={(e) => handleFilterChange('isActive', e.target.value === 'true')}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2}>
              <Button variant="outline-secondary" onClick={() => setFilters({ type: '', isActive: true })}>
                Clear Filters
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Events Table */}
      <Card>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : error ? (
          <div className="alert alert-danger m-3">{error}</div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <FaImage size={64} />
            <h4>No Events Found</h4>
            <p>Create your first event package to get started.</p>
            <Button variant="primary" as={Link} to="/admin/events/new">
              <FaPlus className="me-2" /> Add Event
            </Button>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <Table striped hover responsive className="table-light">
                <thead className="table-dark">
                  <tr>
                    <th>Event</th>
                    <th>Type</th>
                    <th>Packages</th>
                    <th>Starting Price</th>
                    <th>Bookings</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => {
                    // Construct image URL - handle different possible formats
                    let imgUrl = DEFAULT_EVENT_IMAGE

                    // Try event.images first (array of objects with url property)
                    if (event.images?.length > 0) {
                      imgUrl = event.images[0].url || event.images[0];
                    }
                    // Try venue images
                    else if (event.venues?.[0]?.images?.length > 0) {
                      imgUrl = event.venues[0].images[0]?.url || event.venues[0].images[0];
                    }

                    // Only backend-served files should be prefixed with the API host.
                    // Frontend assets like /assets/... must stay on the frontend origin.
                    if (imgUrl && imgUrl.startsWith('/uploads/')) {
                      const apiBase = API_URL?.replace('/api', '') || 'http://localhost:5000';
                      imgUrl = apiBase + imgUrl;
                    }

                    return (
                      <tr key={event._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={imgUrl}
                              alt={event.name}
                              width="60"
                              height="60"
                              className="rounded me-3 object-fit-cover"
                              onError={(e) => {
                                e.target.onerror = null; // Prevent infinite loop
                                e.target.src = DEFAULT_EVENT_IMAGE;
                              }}
                            />
                            <div>
                              <strong className="d-block">{event.name}</strong>
                              <small className="text-muted">{event.shortDescription?.substring(0, 50)}...</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge bg="info">{EVENT_TYPE_LABELS[event.type] || event.type}</Badge>
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            {event.packages?.filter(p => p.isActive).length > 0 ? (
                              event.packages.filter(p => p.isActive).map((pkg, idx) => (
                                <span key={pkg._id || `${event._id}-pkg-${idx}`} className="small">
                                  {pkg.displayName}: {formatCurrency(pkg.price)}
                                </span>
                              ))
                            ) : (
                              <span className="small text-muted">No packages added</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <strong className="text-primary">{formatCurrency(event.lowestPrice || 0)}</strong>
                        </td>
                        <td>{event.totalBookings || 0}</td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            <Badge bg={event.isActive ? 'success' : 'secondary'}>
                              {event.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {event.isFeatured && (
                              <Badge bg="warning">Featured</Badge>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="link"
                              size="sm"
                              as={Link}
                              to={`/admin/events/${event._id}`}
                            >
                              <FaEye />
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              as={Link}
                              to={`/admin/events/${event._id}/edit`}
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => deleteEvent(event._id)}
                              className="text-danger"
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="d-flex justify-content-between align-items-center p-3">
                <div>
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} events
                </div>
                <Pagination>
                  <Pagination.Prev
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  />
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - pagination.page) <= 2 || p === 1 || p === pagination.pages)
                    .map((p, idx, arr) => (
                      <React.Fragment key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && <Pagination.Ellipsis disabled />}
                        <Pagination.Item
                          active={p === pagination.page}
                          onClick={() => handlePageChange(p)}
                        >
                          {p}
                        </Pagination.Item>
                      </React.Fragment>
                    ))}
                  <Pagination.Next
                    disabled={pagination.page === pagination.pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  />
                </Pagination>
              </div>
            )}
          </>
        )}
      </Card>
    </Container>
  )
}

export default AdminEvents
