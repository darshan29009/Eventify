import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Table, Badge, Button, Spinner } from 'react-bootstrap'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { formatCurrency, formatDate, TASK_STATUS, TASK_PRIORITIES } from '../../constants/appConstants'
import {
  FaTasks, FaClock, FaCheckCircle, FaExclamationTriangle,
  FaCalendarAlt, FaArrowRight, FaListAlt
} from 'react-icons/fa'

const EmployeeDashboard = () => {
  const { axios, employee } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dashboard, setDashboard] = useState(null)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/employees/dashboard')
      setDashboard(response.data.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching dashboard:', err)
      setError(err.response?.data?.message || 'Failed to load dashboard')
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
          <p>{error}</p>
          <Button variant="outline-danger" onClick={fetchDashboard}>Retry</Button>
        </div>
      </Container>
    )
  }

  const { employee: empData, todayTasks, overdueTasks, assignedEvents, performance, upcomingDeadlines } = dashboard || {}

  const completedTasks = performance?.completedTasks || 0

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <div className="dashboard-hero d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="page-title dashboard-heading mb-0">My Dashboard</h2>
          <p className="dashboard-subtitle mb-0">
            Welcome back, {empData?.user?.profile?.firstName || 'Employee'}!
          </p>
        </div>
        <div>
          <Button variant="light" as={RouterLink} to="/employee/tasks">
            <FaListAlt className="me-2" /> View All Tasks
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="h-100 stat-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Today's Tasks</p>
                  <h3 className="fw-bold mb-0">{todayTasks?.length || 0}</h3>
                </div>
                <div className="stat-icon bg-warning bg-opacity-10 text-warning">
                  <FaClock />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 stat-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Completed</p>
                  <h3 className="fw-bold mb-0">{completedTasks}</h3>
                </div>
                <div className="stat-icon bg-success bg-opacity-10 text-success">
                  <FaCheckCircle />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 stat-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Overdue</p>
                  <h3 className="fw-bold mb-0 text-danger">{overdueTasks?.length || 0}</h3>
                </div>
                <div className="stat-icon bg-danger bg-opacity-10 text-danger">
                  <FaExclamationTriangle />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="h-100 stat-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Assigned Events</p>
                  <h3 className="fw-bold mb-0">{assignedEvents?.length || 0}</h3>
                </div>
                <div className="stat-icon bg-info bg-opacity-10 text-info">
                  <FaCalendarAlt />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3">
        {/* Today's Tasks */}
        <Col lg={8}>
          <Card className="h-100">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaClock className="text-warning me-2" />
                Today's Tasks
              </h5>
              <Button variant="link" as={RouterLink} to="/employee/tasks">View All</Button>
            </Card.Header>
            <Card.Body>
              {todayTasks?.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {todayTasks.slice(0, 5).map(task => (
                    <div
                      key={task._id}
                      className="task-card p-3"
                      style={{ borderLeftColor: TASK_PRIORITIES[task.priority] || '#667eea' }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">{task.title}</h6>
                          <small className="text-muted">
                            {task.event?.name && `${task.event.name} • `}
                            {formatDate(task.deadline)}
                          </small>
                        </div>
                        <div className="d-flex flex-column align-items-end">
                          <Badge bg="secondary">{task.taskId}</Badge>
                          <small className="text-muted mt-1">
                            {task.progress}% complete
                          </small>
                        </div>
                      </div>
                      <ProgressBar
                        now={task.progress}
                        variant={task.progress === 100 ? 'success' : 'primary'}
                        style={{ height: '4px', marginTop: '8px' }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  <FaTasks size={48} className="mb-3 opacity-25" />
                  <p>No tasks due today</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Upcoming Deadlines */}
        <Col lg={4}>
          <Card className="h-100">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <FaExclamationTriangle className="text-danger me-2" />
                Upcoming Deadlines
              </h5>
            </Card.Header>
            <Card.Body>
              {upcomingDeadlines?.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {upcomingDeadlines.slice(0, 5).map(task => (
                    <div key={task._id} className="d-flex justify-content-between align-items-center p-2 border rounded">
                      <div>
                        <div className="fw-bold">{task.title}</div>
                        <small className="text-muted">
                          {formatDate(task.deadline)}
                          {task.priority === 'urgent' && (
                            <Badge bg="danger" pill className="ms-1">Urgent</Badge>
                          )}
                        </small>
                      </div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        as={RouterLink}
                        to={`/employee/tasks/${task._id}`}
                      >
                        <FaArrowRight />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  <FaCheckCircle size={48} className="mb-3 opacity-25" />
                  <p>All caught up!</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mt-2">
        {/* Assigned Events */}
        <Col lg={6}>
          <Card className="h-100">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaCalendarAlt className="text-info me-2" />
                Assigned Events
              </h5>
              <Button variant="link" as={RouterLink} to="/employee/events">View All</Button>
            </Card.Header>
            <Card.Body>
              {assignedEvents?.length > 0 ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedEvents.slice(0, 5).map(booking => (
                      <tr key={booking._id}>
                        <td>
                          <strong>{booking.event?.name}</strong>
                          <br />
                          <small className="text-muted">{booking.bookingId}</small>
                        </td>
                        <td>{formatDate(booking.eventDetails?.date)}</td>
                        <td>
                          <Badge bg={
                            booking.status === 'confirmed' ? 'info' :
                            booking.status === 'planning' ? 'warning' :
                            booking.status === 'in-progress' ? 'primary' : 'secondary'
                          }>
                            {booking.status}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            as={RouterLink}
                            to={`/employee/events/${booking._id}`}
                          >
                            <FaArrowRight />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted">
                  <FaCalendarAlt size={48} className="mb-3 opacity-25" />
                  <p>No events assigned yet</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

      </Row>
    </Container>
  )
}

export default EmployeeDashboard
