import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatDate, formatCurrency, STATUS_BADGES, BOOKING_STATUS } from '../../constants/appConstants';
import { Form } from 'react-bootstrap';
import './AdminBookings.css';

const AdminBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState([]); // For team assignment

  useEffect(() => {
    fetchBookings();
    fetchEmployees(); // Load employees for team assignment
  }, []);

  const fetchBookings = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await api.get('/admin/bookings');
      const bookings = res.data?.data?.bookings || res.data?.bookings || [];
      setBookings(bookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/admin/employees');
      setEmployees(res.data?.data?.employees || res.data?.employees || []);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  const assignTeamMember = async (bookingId, employeeId, role = 'Event Staff') => {
    try {
      const response = await api.post(`/bookings/${bookingId}/assign-team`, {
        team: [{ employee: employeeId, role }]
      });
      alert('Success! ' + (response.message || 'Employee assigned'));
      // Refresh booking details
      await viewBookingDetails(selectedBooking);
      // Also refresh bookings list to update any displayed info
      await fetchBookings();
    } catch (err) {
      console.error('[AdminBookings] Assign failed:', err);
      alert('Failed to assign employee: ' + (err.response?.data?.message || err.response?.data || err.message));
    }
  };

  const removeTeamMember = async (bookingId, employeeId) => {
    if (!window.confirm('Remove this team member?')) return;
    try {
      await api.post(`/bookings/${bookingId}/remove-team/${employeeId}`);
      // Refresh booking details
      await viewBookingDetails(selectedBooking);
      await fetchBookings();
    } catch (err) {
      alert('Failed to remove employee: ' + (err.response?.data?.message || err.message));
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    if (!bookingId) {
      console.error('updateBookingStatus called with empty bookingId');
      return;
    }
    try {
      const res = await api.put(`/admin/bookings/${bookingId}/status`, { status });
      await fetchBookings();
      if (showModal && selectedBooking && selectedBooking._id === bookingId) {
        const detailRes = await api.get(`/admin/bookings/${bookingId}`);
        const updated = detailRes.data?.data?.booking || detailRes.data;
        if (updated) {
          setSelectedBooking(updated);
        }
      }
    } catch (err) {
      console.error('Update failed:', err.response?.data || err);
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const viewBookingDetails = async (booking) => {
    try {
      if (!booking._id) {
        console.error('Cannot view booking details: booking._id is missing', booking);
        setError('Invalid booking - missing ID');
        return;
      }
      const res = await api.get(`/admin/bookings/${booking._id}`);

      // Response could be: { data: { booking } } OR { booking: {} }
      const bookingData = res.data?.data?.booking || res.data?.booking || res.data;
      if (!bookingData || !bookingData._id) {
        console.error('Invalid booking data in response', res.data);
        setError('Failed to load booking details: invalid data');
        return;
      }

      setSelectedBooking(bookingData);
      setShowModal(true);
    } catch (err) {
      console.error('Error fetching booking details:', err);
      setError(err.response?.data?.message || 'Failed to fetch booking details');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filterStatus === 'all') return true;
    return booking.status === filterStatus;
  });

  const getStatusColor = (status) => {
    const badge = STATUS_BADGES[status] || { class: 'secondary', label: status };
    return badge.class;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="admin-bookings">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Bookings</h1>
          <p className="text-muted">Manage all customer bookings</p>
        </div>
        <Link to="/admin/dashboard" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i> Back to Dashboard
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Stats */}
      <div className="row mb-4">
        {Object.entries(BOOKING_STATUS).map(([key, value]) => (
          <div key={key} className="col-md-2 col-6">
            <div className="card stats-card" onClick={() => setFilterStatus(value)} style={{ cursor: 'pointer' }}>
              <div className="card-body text-center">
                <h3>{bookings.filter(b => b.status === value).length}</h3>
                <small>{value}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-4 admin-filter-card">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label htmlFor="booking-status">Status</Form.Label>
                <Form.Select
                  className="admin-filter-control"
                  id="booking-status"
                  name="status"
                  autoComplete="off"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  {Object.entries(BOOKING_STATUS).map(([key, value]) => (
                    <option key={key} value={value}>{value}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-6 d-flex align-items-end">
              <button className="btn btn-primary w-100 admin-filter-action" onClick={fetchBookings}>
                <i className="bi bi-arrow-clockwise"></i> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-calendar-x display-4 text-muted"></i>
              <p className="mt-2">No bookings found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Event</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Guests</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map(booking => (
                    <tr key={booking._id || booking.bookingId || Math.random()}>
                      <td><code>{booking.bookingId}</code></td>
                      <td>
                        <div>
                          <strong>{booking.event?.name}</strong>
                          <small className="d-block text-muted">
                            {booking.event?.type}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div>
                          {booking.customer?.name || 'N/A'}
                          <small className="d-block text-muted">
                            {booking.customer?.email}
                          </small>
                        </div>
                      </td>
                      <td>{formatDate(booking.eventDetails?.date)}</td>
                      <td>{booking.eventDetails?.expectedGuests}</td>
                      <td><strong>{formatCurrency(booking.pricing?.totalAmount)}</strong></td>
                      <td>
                        <span className={`badge bg-${getStatusColor(booking.status)} text-dark`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => viewBookingDetails(booking)}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        {booking.status === 'confirmed' && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => updateBookingStatus(booking._id, 'in-progress')}
                            title="Mark as In Progress"
                          >
                            <i className="bi bi-play"></i>
                          </button>
                        )}
                        {booking.status === 'in-progress' && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => updateBookingStatus(booking._id, 'completed')}
                            title="Mark as Completed"
                          >
                            <i className="bi bi-check"></i>
                          </button>
                        )}
                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                            title="Cancel Booking"
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Booking Details Modal */}
      {showModal && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">Booking Details - {selectedBooking.bookingId}</h5>
              <button className="btn-close" onClick={() => setShowModal(false)}></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>Event Information</h6>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td><strong>Event</strong></td>
                        <td>{selectedBooking.event?.name}</td>
                      </tr>
                      <tr>
                        <td><strong>Type</strong></td>
                        <td>{selectedBooking.eventDetails?.eventType}</td>
                      </tr>
                      <tr>
                        <td><strong>Date</strong></td>
                        <td>{formatDate(selectedBooking.eventDetails?.date)}</td>
                      </tr>
                      <tr>
                        <td><strong>Time</strong></td>
                        <td>{selectedBooking.eventDetails?.startTime} - {selectedBooking.eventDetails?.endTime}</td>
                      </tr>
                      <tr>
                        <td><strong>Guests</strong></td>
                        <td>{selectedBooking.eventDetails?.expectedGuests}</td>
                      </tr>
                      <tr>
                        <td><strong>Venue</strong></td>
                        <td>{selectedBooking.eventDetails?.venue?.name}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h6 className="mt-3">Assigned Team</h6>
                  {selectedBooking.assignedTeam && selectedBooking.assignedTeam.length > 0 ? (
                    <ul className="list-unstyled">
                      {selectedBooking.assignedTeam.map(member => (
                        <li key={member.employee?._id} className="mb-2 p-2 border rounded bg-light">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <strong>{member.employee?.user?.profile?.firstName} {member.employee?.user?.profile?.lastName}</strong>
                              <small className="text-muted d-block">{member.role || 'Team Member'}</small>
                            </div>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeTeamMember(selectedBooking._id, member.employee._id)}
                              title="Remove from team"
                            >
                              <i className="bi bi-trash"></i> Remove
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted small">No team members assigned yet</p>
                  )}

                  {/* Add Team Member */}
                  <div className="mt-3">
                    <label className="form-label small">Assign Employee to this Booking</label>
                    <div className="d-flex gap-2">
                      <select
                        className="form-select"
                        id="assign-employee-select"
                        onChange={(e) => {
                          if (e.target.value) {
                            const role = prompt('Enter role for this employee (e.g., Event Manager, Staff):', 'Event Staff');
                            if (role) {
                              assignTeamMember(selectedBooking._id, e.target.value, role);
                            }
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="">Select Employee...</option>
                        {employees
                          .filter(emp => !selectedBooking.assignedTeam?.some(at => at.employee === emp._id))
                          .map(emp => (
                          <option key={emp._id} value={emp._id}>
                            {emp.user?.profile?.firstName} {emp.user?.profile?.lastName} ({emp.designation})
                          </option>
                        ))}
                      </select>
                    </div>
                    <small className="text-muted">Selected employees will be able to see this booking on their dashboard.</small>
                  </div>
                </div>

                <div className="col-md-6">
                  <h6>Customer Information</h6>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td><strong>Name</strong></td>
                        <td>{selectedBooking.customer?.name}</td>
                      </tr>
                      <tr>
                        <td><strong>Email</strong></td>
                        <td>{selectedBooking.customer?.email}</td>
                      </tr>
                      <tr>
                        <td><strong>Phone</strong></td>
                        <td>{selectedBooking.customer?.phone || '-'}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h6 className="mt-3">Payment Summary</h6>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td>Base Price</td>
                        <td>{formatCurrency(selectedBooking.pricing?.basePrice)}</td>
                      </tr>
                      {selectedBooking.pricing?.additionalCharges?.length > 0 && (
                        <tr>
                          <td>Additional Charges</td>
                          <td>{formatCurrency(selectedBooking.pricing.additionalCharges.reduce((sum, c) => sum + c.price, 0))}</td>
                        </tr>
                      )}
                      {selectedBooking.pricing?.discount > 0 && (
                        <tr>
                          <td className="text-success">Discount</td>
                          <td className="text-success">-{formatCurrency(selectedBooking.pricing.discount)}</td>
                        </tr>
                      )}
                      <tr>
                        <td>GST</td>
                        <td>{formatCurrency(selectedBooking.pricing?.tax)}</td>
                      </tr>
                      <tr>
                        <td><strong>Total</strong></td>
                        <td><strong>{formatCurrency(selectedBooking.pricing?.totalAmount)}</strong></td>
                      </tr>
                    </tbody>
                  </table>

                  <h6 className="mt-3">Progress</h6>
                  <div className="progress" style={{ height: '20px' }}>
                    <div
                      className="progress-bar"
                      style={{
                        width: `${selectedBooking.progress?.percentage || 0}%`,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      }}
                    >
                      {selectedBooking.progress?.percentage || 0}%
                    </div>
                  </div>
                </div>
              </div>

              {selectedBooking.specialRequirements && (
                <div className="mt-3">
                  <h6>Special Requirements</h6>
                  <p className="text-muted">{selectedBooking.specialRequirements}</p>
                </div>
              )}

              <div className="mt-3 text-end">
                <small className="text-muted">
                  Created: {formatDate(selectedBooking.createdAt)} | Updated: {formatDate(selectedBooking.updatedAt)}
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
              <div className="flex-grow-1">
                {selectedBooking.status === 'pending' && (
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      updateBookingStatus(selectedBooking._id, 'confirmed');
                      setShowModal(false);
                    }}
                  >
                    <i className="bi bi-check me-2"></i> Confirm Booking
                  </button>
                )}
                {selectedBooking.status === 'confirmed' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      updateBookingStatus(selectedBooking._id, 'in-progress');
                      setShowModal(false);
                    }}
                  >
                    <i className="bi bi-play me-2"></i> Mark In Progress
                  </button>
                )}
                {selectedBooking.status === 'in-progress' && (
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      updateBookingStatus(selectedBooking._id, 'completed');
                      setShowModal(false);
                    }}
                  >
                    <i className="bi bi-check-circle me-2"></i> Mark Completed
                  </button>
                )}
                {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      if (window.confirm('Cancel this booking?')) {
                        updateBookingStatus(selectedBooking._id, 'cancelled');
                        setShowModal(false);
                      }
                    }}
                  >
                    <i className="bi bi-x-circle me-2"></i> Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
