import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatDate, formatCurrency, STATUS_BADGES, BOOKING_STATUS } from '../../constants/appConstants';
import './MyBookings.css';

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers/bookings');
      setBookings(res.data?.data?.bookings || res.data?.bookings || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await api.post(`/customers/bookings/${bookingId}/cancel`);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    const matchesSearch =
      booking.bookingId.toLowerCase().includes(search.toLowerCase()) ||
      booking.event?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="my-bookings">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>My Bookings</h1>
          <p className="text-muted">Track and manage your event bookings</p>
        </div>
        <button className="btn btn-outline-primary" onClick={fetchBookings}>
          <i className="bi bi-arrow-clockwise me-2"></i> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="search-box customer-search-box">
                <i className="bi bi-search icon"></i>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by Booking ID or Event name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                {Object.entries(BOOKING_STATUS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-calendar-x display-4 text-muted"></i>
            <p className="mt-2">No bookings found</p>
            <Link to="/customer/events" className="btn btn-primary btn-sm">
              Browse Events
            </Link>
          </div>
        </div>
      ) : (
        <div className="bookings-list">
          {filteredBookings.map(booking => (
            <div key={booking._id} className="card booking-card mb-3">
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-9">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="mb-1">
                          <Link to={`/customer/bookings/${booking._id}`} className="text-decoration-none text-dark">
                            {booking.event?.name}
                          </Link>
                        </h6>
                        <small className="text-muted">
                          <i className="bi bi-hash me-1"></i>{booking.bookingId}
                        </small>
                      </div>
                      <span className={`badge bg-${STATUS_BADGES[booking.status]?.class || 'secondary'}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="booking-details mb-2">
                      <p className="small mb-1">
                        <i className="bi bi-calendar me-2 text-primary"></i>
                        {formatDate(booking.eventDetails?.date)}
                      </p>
                      <p className="small mb-1">
                        <i className="bi bi-geo-alt me-2 text-danger"></i>
                        {booking.eventDetails?.venue?.name || 'Venue N/A'}
                      </p>
                      <p className="small mb-0">
                        <i className="bi bi-people me-2 text-success"></i>
                        {booking.eventDetails?.expectedGuests} guests
                      </p>
                    </div>
                    <div>
                      <strong>{formatCurrency(booking.pricing?.totalAmount)}</strong>
                      <small className="text-muted ms-2">
                        {booking.payment?.status === 'paid' ? '✓ Paid' : '⏳ Pending Payment'}
                      </small>
                    </div>
                  </div>
                  <div className="col-md-3 d-flex flex-column justify-content-between align-items-end">
                    <div className="text-end">
                      <small className="text-muted d-block">Progress</small>
                      <div className="progress" style={{ width: '150px', height: '8px' }}>
                        <div
                          className="progress-bar"
                          style={{
                            width: `${booking.progress?.percentage || 0}%`,
                            background: 'linear-gradient(90deg, #667eea, #764ba2)'
                          }}
                        ></div>
                      </div>
                      <small className="text-muted">{booking.progress?.percentage || 0}% complete</small>
                    </div>
                    <div className="d-flex flex-column gap-2 w-100">
                      <Link
                        to={`/customer/bookings/${booking._id}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        <i className="bi bi-eye me-2"></i>View Details
                      </Link>
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => cancelBooking(booking._id)}
                        >
                          <i className="bi bi-x-circle me-2"></i>Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
