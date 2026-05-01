import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { formatDate, STATUS_BADGES } from '../../constants/appConstants';
import './EmployeeEvents.css';

const EmployeeEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees/events');
      setEvents(res?.data || []);
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div className="employee-events">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Assigned Events</h1>
          <p className="text-muted">Events you are assigned to</p>
        </div>
        <button className="btn btn-primary" onClick={fetchEvents}>
          <i className="bi bi-arrow-clockwise me-2"></i> Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {events.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-calendar-event display-4 text-muted"></i>
            <p className="mt-2">No events assigned yet</p>
            <p className="text-muted small">Events assigned to you by admin will appear here</p>
          </div>
        </div>
      ) : (
        <div className="row">
          {events.map(booking => (
            <div key={booking._id} className="col-md-6 col-lg-4 mb-4">
              <div className="card event-card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="card-title">{booking.event?.name || 'Untitled Event'}</h6>
                    <span className="badge bg-secondary text-capitalize">{booking.event?.type || booking.eventDetails?.eventType || 'event'}</span>
                  </div>
                  <p className="card-text text-muted small mb-3">
                    {booking.event?.description
                      ? `${booking.event.description.substring(0, 100)}...`
                      : 'No description available.'}
                  </p>
                  <div className="event-meta mb-3">
                    <p className="small mb-1">
                      <i className="bi bi-calendar me-2 text-primary"></i>
                      {formatDate(booking.eventDetails?.date)}
                    </p>
                    {booking.eventDetails?.venue && (
                      <p className="small mb-1">
                        <i className="bi bi-geo-alt me-2 text-danger"></i>
                        {booking.eventDetails.venue.name}, {booking.eventDetails.venue.city}
                      </p>
                    )}
                    <p className="small">
                      <i className="bi bi-people me-2 text-success"></i>
                      {booking.eventDetails?.expectedGuests || 'N/A'} guests
                    </p>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className={`badge ${STATUS_BADGES[booking.status]?.class || 'bg-secondary'}`}>
                      {booking.status}
                    </span>
                    <Link
                      to={`/employee/events/${booking._id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      View Details
                    </Link>
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

export default EmployeeEvents;
