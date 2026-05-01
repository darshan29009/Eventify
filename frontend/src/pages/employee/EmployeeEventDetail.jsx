import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { formatDate, STATUS_BADGES } from '../../constants/appConstants';

const EmployeeEventDetail = () => {
  const { id } = useParams();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/employees/events/${id}`);
      const payload = res?.data || res;
      setEventData(payload);
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading event details...</p>
      </div>
    );
  }

  if (error || !eventData?.booking) {
    return (
      <div className="error-container">
        <h2>Event Not Found</h2>
        <p>{error || 'The requested event could not be loaded.'}</p>
        <Link to="/employee/events" className="btn btn-primary">
          Back to Events
        </Link>
      </div>
    );
  }

  const { booking, tasks = [], team = [] } = eventData;

  return (
    <div className="employee-event-detail">
      <div className="mb-4">
        <Link to="/employee/events" className="btn btn-outline-secondary btn-sm mb-2">
          <i className="bi bi-arrow-left me-2"></i>Back to Events
        </Link>
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h1>{booking.event?.name || 'Assigned Event'}</h1>
            <p className="text-muted mb-2">{booking.event?.description || 'No description available'}</p>
            <span className={`badge ${STATUS_BADGES[booking.status]?.class || 'bg-secondary'}`}>
              {booking.status}
            </span>
          </div>
          <div className="text-muted small">
            <div><strong>Booking ID:</strong> {booking.bookingId}</div>
            <div><strong>Date:</strong> {formatDate(booking.eventDetails?.date)}</div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Event Details</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Event Type:</strong> {booking.event?.type || booking.eventDetails?.eventType || 'N/A'}</p>
                  <p><strong>Venue:</strong> {booking.eventDetails?.venue?.name || 'Not set'}</p>
                  <p><strong>Guests:</strong> {booking.eventDetails?.expectedGuests || 'N/A'}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Time:</strong> {booking.eventDetails?.startTime || 'N/A'} - {booking.eventDetails?.endTime || 'N/A'}</p>
                  <p><strong>City:</strong> {booking.eventDetails?.venue?.city || 'N/A'}</p>
                  <p><strong>Special Requirements:</strong> {booking.eventDetails?.specialRequirements || booking.specialRequirements || 'None'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">My Tasks</h5>
              <Link to="/employee/tasks" className="btn btn-sm btn-outline-primary">
                View All Tasks
              </Link>
            </div>
            <div className="card-body">
              {tasks.length === 0 ? (
                <p className="text-muted mb-0">No tasks assigned for this event yet.</p>
              ) : (
                <div className="list-group list-group-flush">
                  {tasks.map(task => (
                    <div key={task._id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-start gap-3">
                        <div>
                          <h6 className="mb-1">{task.title}</h6>
                          <small className="text-muted">
                            Deadline: {formatDate(task.deadline)} • Progress: {task.progress || 0}%
                          </small>
                        </div>
                        <div className="text-end">
                          <span className={`badge ${STATUS_BADGES[task.status]?.class || 'bg-secondary'} d-block mb-2`}>
                            {task.status}
                          </span>
                          <Link to={`/employee/tasks/${task._id}`} className="btn btn-sm btn-outline-primary">
                            Open Task
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Assigned Team</h5>
            </div>
            <div className="card-body">
              {team.length === 0 ? (
                <p className="text-muted mb-0">No team members assigned.</p>
              ) : (
                <div className="list-group list-group-flush">
                  {team.map((member, index) => (
                    <div key={member.employee?._id || index} className="list-group-item px-0">
                      <div className="fw-semibold">
                        {member.employee?.profile?.firstName} {member.employee?.profile?.lastName}
                      </div>
                      <small className="text-muted">
                        {member.role || member.employee?.designation || 'Team Member'}
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeEventDetail;
