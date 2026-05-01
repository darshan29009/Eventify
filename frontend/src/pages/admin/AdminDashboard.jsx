import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Table, Badge, ProgressBar, Spinner, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { formatCurrency, formatDate } from '../../constants/appConstants'
import {
  FaUsers, FaUserFriends, FaCalendarCheck, FaMoneyBillWave,
  FaTasks, FaExclamationTriangle, FaArrowUp, FaArrowDown,
  FaEye, FaPlus, FaClock
} from 'react-icons/fa'

const AdminDashboard = () => {
  const { axios } = useAuth()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/admin/dashboard')
      setDashboardData(response.data.data)
      setError(null)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      setError(error.response?.data?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Container className="py-4">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle me-2" />
          {error}
          <Button variant="outline-danger" size="sm" onClick={fetchDashboardData} className="ms-2">
            Retry
          </Button>
        </div>
      </Container>
    )
  }

  const { counts, tasks, revenue, recentActivity, analytics } = dashboardData || {}
  const {
    customers: totalCustomers,
    employees: totalEmployees,
    bookings: totalBookings,
    events: totalEvents
  } = counts || {}

  const { today: todayTasks, overdue: overdueTasks } = tasks || {}
  const { monthly: monthlyRevenue } = revenue || {}
  const { bookings: recentBookings, tasks: recentTasks } = recentActivity || {}
  const {
    eventTypes,
    topEmployees
  } = analytics || {}

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <div className="dashboard-hero d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="page-title dashboard-heading mb-0">Admin Dashboard</h2>
          <p className="dashboard-subtitle mb-0">Welcome back! Here's what's happening today.</p>
        </div>
        <div>
          <Button variant="light" as={Link} to="/admin/events/new">
            <FaPlus className="me-2" /> Add Event
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="stat-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1 small">Total Customers</p>
                  <h3 className="fw-bold mb-0">{totalCustomers || 0}</h3>
                </div>
                <div className="stat-icon bg-primary bg-opacity-10 text-primary">
                  <FaUsers />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="stat-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1 small">Total Employees</p>
                  <h3 className="fw-bold mb-0">{totalEmployees || 0}</h3>
                </div>
                <div className="stat-icon bg-success bg-opacity-10 text-success">
                  <FaUserFriends />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="stat-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1 small">Total Bookings</p>
                  <h3 className="fw-bold mb-0">{totalBookings || 0}</h3>
                </div>
                <div className="stat-icon bg-warning bg-opacity-10 text-warning">
                  <FaCalendarCheck />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="stat-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted mb-1 small">Monthly Revenue</p>
                  <h3 className="fw-bold mb-0">{formatCurrency(monthlyRevenue || 0)}</h3>
                </div>
                <div className="stat-icon bg-info bg-opacity-10 text-info">
                  <FaMoneyBillWave />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Task Alerts */}
      <Row className="g-3 mb-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <FaExclamationTriangle className="text-warning me-2" />
                Task Alerts
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="row">
                <Col xs={6}>
                  <div className="text-center p-3 bg-light rounded">
                    <h2 className="text-primary mb-0">{todayTasks || 0}</h2>
                    <small className="text-muted">Due Today</small>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="text-center p-3 bg-light rounded">
                    <h2 className="text-danger mb-0">{overdueTasks || 0}</h2>
                    <small className="text-muted">Overdue</small>
                  </div>
                </Col>
              </div>
              <div className="mt-3">
                <Link to="/admin/tasks" className="btn btn-sm btn-outline-primary">
                  View All Tasks
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <FaClock className="text-info me-2" />
                Recent Activities
              </h5>
            </Card.Header>
            <Card.Body>
              {recentBookings?.length > 0 ? (
                <ul className="list-unstyled mb-0">
                  {recentBookings.slice(0, 3).map((booking, idx) => (
                    <li key={idx} className="mb-3 pb-2 border-bottom">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{booking.customer?.profile?.firstName || 'Customer'}</strong>
                          <br />
                          <small className="text-muted">{booking.event?.name || 'Event'}</small>
                        </div>
                        <Badge bg="primary">{booking.bookingId}</Badge>
                      </div>
                      <small className="text-muted">{formatDate(booking.createdAt)}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted text-center mb-0">No recent activity</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Analytics */}
      <Row className="g-3 mb-4">
        <Col md={8}>
          <Card className="h-100">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Event Type Distribution</h5>
            </Card.Header>
            <Card.Body>
              {eventTypes?.length > 0 ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Event Type</th>
                      <th>Bookings</th>
                      <th>Revenue</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventTypes.map((type, idx) => (
                      <tr key={idx}>
                        <td>
                          <Badge bg="secondary" className="me-2">{type._id}</Badge>
                        </td>
                        <td>{type.count}</td>
                        <td>{formatCurrency(type.revenue)}</td>
                        <td>
                          <ProgressBar
                            now={(type.count / eventTypes[0].count) * 100}
                            style={{ height: '8px' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted text-center mb-0">No data available</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Top Employees</h5>
            </Card.Header>
            <Card.Body>
              {topEmployees?.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {topEmployees.map((emp, idx) => (
                    <div key={idx} className="d-flex align-items-center">
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                           style={{ width: '40px', height: '40px' }}>
                        <strong>{emp.profile?.firstName?.charAt(0) || 'E'}</strong>
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-bold">{emp.profile?.firstName} {emp.profile?.lastName}</div>
                        <small className="text-muted">{emp.designation || 'Employee'}</small>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold">{emp.performance?.tasksCompleted || 0}</div>
                        <small className="text-muted">tasks</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center mb-0">No employee data</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="g-3 mb-4">
        <Col md={12}>
          <Card>
            <Card.Header className="bg-white">
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap gap-2">
                <Button variant="primary" as={Link} to="/admin/employees">
                  <FaUserFriends className="me-2" /> Manage Employees
                </Button>
                <Button variant="success" as={Link} to="/admin/tasks">
                  <FaTasks className="me-2" /> Create Task
                </Button>
                <Button variant="info" as={Link} to="/admin/bookings">
                  <FaCalendarCheck className="me-2" /> View Bookings
                </Button>
                <Button variant="warning" as={Link} to="/admin/payments">
                  <FaMoneyBillWave className="me-2" /> Process Refunds
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default AdminDashboard
