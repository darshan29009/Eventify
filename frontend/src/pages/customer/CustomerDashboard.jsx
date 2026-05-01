import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api, makeRequest } from '../../services/api';
import { formatCurrency, formatDate, STATUS_BADGES } from '../../constants/appConstants';
import './CustomerDashboard.css';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingEvents: 0,
    totalSpent: 0,
    completedEvents: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await makeRequest(api.customerDashboard());
      const dashboardData = res.data || {};
      const recent = dashboardData.recentBookings || [];
      const upcoming = dashboardData.upcomingEvents || [];

      setStats({
        totalBookings: dashboardData.totalBookings || recent.length || 0,
        upcomingEvents: upcoming.length,
        totalSpent: Number(dashboardData.totalSpent || 0),
        completedEvents: dashboardData.completedBookings ?? recent.filter(booking => booking.status === 'completed').length
      });
      setRecentBookings(recent);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="customer-dashboard">
      <div className="dashboard-hero dashboard-header mb-4">
        <h1 className="dashboard-heading">Welcome back, {user?.firstName}!</h1>
        <p className="dashboard-subtitle">Here's an overview of your event journey</p>
      </div>

      {/* Stats */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card stats-card" style={{ cursor: 'pointer' }} onClick={() => {/* Navigate to bookings */}}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3>{stats.totalBookings}</h3>
                  <p className="text-muted mb-0">Total Bookings</p>
                </div>
                <i className="bi bi-calendar-check display-4 text-primary opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3>{stats.upcomingEvents}</h3>
                  <p className="text-muted mb-0">Upcoming</p>
                </div>
                <i className="bi bi-calendar-event display-4 text-success opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3>{formatCurrency(stats.totalSpent)}</h3>
                  <p className="text-muted mb-0">Total Spent</p>
                </div>
                <i className="bi bi-currency-dollar display-4 text-warning opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3>{stats.completedEvents}</h3>
                  <p className="text-muted mb-0">Completed</p>
                </div>
                <i className="bi bi-check-circle display-4 text-info opacity-25"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          {/* Quick Actions */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <Link to="/customer/events" className="btn btn-outline-primary w-100">
                    <i className="bi bi-search me-2"></i> Browse Events
                  </Link>
                </div>
                <div className="col-md-4">
                  <Link to="/customer/bookings" className="btn btn-outline-primary w-100">
                    <i className="bi bi-calendar-check me-2"></i> My Bookings
                  </Link>
                </div>
                <div className="col-md-4">
                  <Link to="/customer/wishlist" className="btn btn-outline-primary w-100">
                    <i className="bi bi-heart me-2"></i> Wishlist
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Bookings</h5>
              <Link to="/customer/bookings" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              {recentBookings.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-calendar display-4 text-muted"></i>
                  <p className="mt-2">No bookings yet</p>
                  <Link to="/customer/events" className="btn btn-primary btn-sm">
                    Browse Events
                  </Link>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {recentBookings.map(booking => (
                    <Link
                      key={booking._id}
                      to={`/customer/bookings/${booking._id}`}
                      className="list-group-item list-group-item-action"
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6>{booking.event?.name}</h6>
                          <small className="text-muted">
                            {formatDate(booking.eventDetails?.date)} • {booking.eventDetails?.expectedGuests} guests
                          </small>
                        </div>
                        <span className={`badge bg-${STATUS_BADGES[booking.status]?.class || 'secondary'}`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="mt-2">
                        <strong>{formatCurrency(booking.pricing?.totalAmount)}</strong>
                        <small className="text-muted ms-2">• {booking.eventDetails?.venue?.name}</small>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          {/* Profile Card */}
          <div className="card mb-4">
            <div className="card-body text-center">
              <img
                src={user?.profilePicture || '/assets/images/default-avatar.svg'}
                alt="Profile"
                className="rounded-circle mb-3"
                width="100"
                height="100"
              />
              <h5>{user?.firstName} {user?.lastName}</h5>
              <p className="text-muted">{user?.email}</p>
              <Link to="/customer/profile" className="btn btn-outline-primary btn-sm">
                <i className="bi bi-pencil me-2"></i> Edit Profile
              </Link>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Upcoming Events</h5>
            </div>
            <div className="card-body">
              {recentBookings.filter(b => ['confirmed', 'in-progress'].includes(b.status)).length === 0 ? (
                <p className="text-muted small">No upcoming events</p>
              ) : (
                <ul className="list-unstyled">
                  {recentBookings
                    .filter(b => ['confirmed', 'in-progress'].includes(b.status))
                    .map(booking => (
                      <li key={booking._id} className="mb-3 pb-3 border-bottom">
                        <div className="d-flex justify-content-between">
                          <Link to={`/customer/bookings/${booking._id}`} className="text-decoration-none">
                            <strong className="text-dark">{booking.event?.name}</strong>
                          </Link>
                          <span className={`badge bg-${STATUS_BADGES[booking.status]?.class || 'secondary'}`} style={{ fontSize: '0.7rem' }}>
                            {booking.status}
                          </span>
                        </div>
                        <small className="text-muted">
                          {formatDate(booking.eventDetails?.date)}
                        </small>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
