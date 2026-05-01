import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatDate, formatCurrency, STATUS_BADGES, BOOKING_STATUS } from '../../constants/appConstants';
import './BookingDetail.css';

const deriveBookingProgress = (booking, tasks = []) => {
  const savedProgress = booking?.progress?.percentage ?? 0;
  const allTasksCompleted = tasks.length > 0 && tasks.every(task => task?.status === 'completed');

  if (allTasksCompleted) {
    return 100;
  }

  if (savedProgress > 0 || !tasks.length) {
    return savedProgress;
  }

  const taskProgressValues = tasks
    .map(task => Number(task?.progress || 0))
    .filter(progress => Number.isFinite(progress) && progress >= 0);

  if (!taskProgressValues.length) {
    return savedProgress;
  }

  const averageProgress = Math.round(
    taskProgressValues.reduce((sum, progress) => sum + progress, 0) / taskProgressValues.length
  );

  if (averageProgress > 0) {
    return averageProgress;
  }

  return taskProgressValues.some(progress => progress > 0) ? 1 : 0;
};

const deriveBookingStatus = (booking, tasks = []) => {
  const allTasksCompleted = tasks.length > 0 && tasks.every(task => task?.status === 'completed');
  if (allTasksCompleted) {
    return 'completed';
  }

  const hasStartedTask = tasks.some(task =>
    ['in-progress', 'review', 'completed', 'blocked'].includes(task?.status) || Number(task?.progress || 0) > 0
  );

  if (hasStartedTask && ['pending', 'confirmed', 'planning'].includes(booking?.status)) {
    return 'in-progress';
  }

  return booking?.status;
};

const deriveBookingTimeline = (booking, tasks = []) => {
  if (booking?.timeline?.length) {
    return booking.timeline;
  }

  const timeline = [];
  const startedTasks = tasks.filter(task =>
    ['in-progress', 'review', 'completed', 'blocked'].includes(task?.status) || Number(task?.progress || 0) > 0
  );
  const completedTasks = tasks.filter(task => task?.status === 'completed');

  if (startedTasks.length > 0) {
    const startedAt = startedTasks
      .map(task => task?.updatedAt || task?.createdAt || task?.deadline)
      .filter(Boolean)
      .sort()[0];

    timeline.push({
      status: 'in-progress',
      changedAt: startedAt || new Date().toISOString(),
      notes: 'Work on this booking has started.'
    });
  }

  if (completedTasks.length === tasks.length && tasks.length > 0) {
    const completedAt = completedTasks
      .map(task => task?.completedAt || task?.updatedAt || task?.deadline)
      .filter(Boolean)
      .sort()
      .slice(-1)[0];

    timeline.push({
      status: 'completed',
      changedAt: completedAt || new Date().toISOString(),
      notes: 'All assigned tasks have been completed.'
    });
  }

  return timeline;
};

const BookingDetail = () => {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/bookings/${bookingId}`);
      const payload = res?.data || res;
      const bookingData = payload?.booking || null;
      const tasks = payload?.tasks || [];

      if (bookingData) {
        const derivedProgress = deriveBookingProgress(bookingData, tasks);
        const derivedStatus = deriveBookingStatus(bookingData, tasks);
        const derivedTimeline = deriveBookingTimeline(bookingData, tasks);
        setBooking({
          ...bookingData,
          status: derivedStatus,
          progress: {
            ...(bookingData.progress || {}),
            percentage: derivedProgress
          },
          timeline: derivedTimeline
        });
      } else {
        setBooking(null);
      }
    } catch (err) {
      setError(err.data?.error || err.message || 'Booking not found');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async () => {
    if (!window.confirm('Cancel this booking? This action cannot be undone.')) return;

    try {
      await api.post(`/customers/bookings/${bookingId}/cancel`);
      fetchBooking();
    } catch (err) {
      alert(err.data?.error || err.message || 'Failed to cancel booking');
    }
  };

  const makePayment = async () => {
    navigate(`/customer/payment/${bookingId}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading booking details...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="error-container">
        <h2>Booking Not Found</h2>
        <p>{error || 'The requested booking does not exist'}</p>
        <Link to="/customer/bookings" className="btn btn-primary">
          Back to My Bookings
        </Link>
      </div>
    );
  }

  const canCancel = ['pending', 'confirmed'].includes(booking.status);
  const canPay = booking.payment?.status !== 'paid' && booking.payment?.status !== 'refunded';

  return (
    <div className="booking-detail">
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <Link to="/customer/bookings" className="btn btn-outline-secondary btn-sm mb-2">
              <i className="bi bi-arrow-left me-2"></i> Back to Bookings
            </Link>
            <h1>Booking {booking.bookingId}</h1>
            <div className="d-flex gap-2 mt-2">
              <span className={`badge bg-${STATUS_BADGES[booking.status]?.class || 'secondary'}`}>
                {booking.status}
              </span>
              {booking.payment?.status === 'paid' && (
                <span className="badge bg-success">Paid</span>
              )}
              {booking.payment?.status === 'refunded' && (
                <span className="badge bg-info">Refunded</span>
              )}
            </div>
          </div>
          <div className="d-flex gap-2">
            {canPay && (
              <button className="btn btn-success" onClick={makePayment}>
                <i className="bi bi-lock me-2"></i> Complete Payment
              </button>
            )}
            {canCancel && (
              <button className="btn btn-danger" onClick={cancelBooking}>
                <i className="bi bi-x-circle me-2"></i> Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card mb-4">
            <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
                    onClick={() => setActiveTab('details')}
                  >
                    Event Details
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'payment' ? 'active' : ''}`}
                    onClick={() => setActiveTab('payment')}
                  >
                    Payment
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'timeline' ? 'active' : ''}`}
                    onClick={() => setActiveTab('timeline')}
                  >
                    Timeline
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body">
              {activeTab === 'details' && (
                <div>
                  <h4>{booking.event?.name}</h4>
                  <p className="text-muted">{booking.event?.description}</p>

                  <div className="row mt-4">
                    <div className="col-md-6">
                      <h6>Event Information</h6>
                      <table className="table table-sm">
                        <tbody>
                          <tr>
                            <td><strong>Event Type</strong></td>
                            <td>{booking.eventDetails?.eventType}</td>
                          </tr>
                          <tr>
                            <td><strong>Date</strong></td>
                            <td>{formatDate(booking.eventDetails?.date)}</td>
                          </tr>
                          <tr>
                            <td><strong>Time</strong></td>
                            <td>{booking.eventDetails?.startTime} - {booking.eventDetails?.endTime}</td>
                          </tr>
                          <tr>
                            <td><strong>Guests</strong></td>
                            <td>{booking.eventDetails?.expectedGuests}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="col-md-6">
                      <h6>Venue Details</h6>
                      {booking.eventDetails?.venue ? (
                        <table className="table table-sm">
                          <tbody>
                            <tr>
                              <td><strong>Name</strong></td>
                              <td>{booking.eventDetails.venue.name}</td>
                            </tr>
                            <tr>
                              <td><strong>Address</strong></td>
                              <td>{booking.eventDetails.venue.address}</td>
                            </tr>
                            <tr>
                              <td><strong>City</strong></td>
                              <td>{booking.eventDetails.venue.city}</td>
                            </tr>
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-muted">No venue specified</p>
                      )}
                    </div>
                  </div>

                  {booking.specialRequirements && (
                    <div className="mt-3">
                      <h6>Special Requirements</h6>
                      <p className="text-muted">{booking.specialRequirements}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'payment' && (
                <div>
                  <h5>Payment Summary</h5>
                  <table className="table">
                    <tbody>
                      <tr>
                        <td>Base Price</td>
                        <td>{formatCurrency(booking.pricing?.basePrice)}</td>
                      </tr>
                      {booking.pricing?.additionalCharges?.length > 0 && (
                        <tr>
                          <td>Additional Charges</td>
                          <td>
                            {booking.pricing.additionalCharges.map((charge, idx) => (
                              <div key={idx}>{charge.item}: {formatCurrency(charge.price)}</div>
                            ))}
                          </td>
                        </tr>
                      )}
                      {booking.pricing?.discount > 0 && (
                        <tr>
                          <td className="text-success">Discount</td>
                          <td className="text-success">-{formatCurrency(booking.pricing.discount)}</td>
                        </tr>
                      )}
                      <tr>
                        <td>GST (18%)</td>
                        <td>{formatCurrency(booking.pricing?.tax)}</td>
                      </tr>
                      <tr>
                        <td><strong>Total Amount</strong></td>
                        <td><strong className="fs-5">{formatCurrency(booking.pricing?.totalAmount)}</strong></td>
                      </tr>
                    </tbody>
                  </table>

                  <h5 className="mt-4">Payment History</h5>
                  {booking.payment?.transactions?.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {booking.payment.transactions.map((tx, idx) => (
                        <div key={idx} className="list-group-item">
                          <div className="d-flex justify-content-between">
                            <div>
                              <strong>{formatCurrency(tx.amount)}</strong>
                              <small className="d-block text-muted">
                                {tx.gateway} • {tx.method}
                              </small>
                            </div>
                            <div className="text-end">
                              <span className={`badge bg-${tx.status === 'succeeded' ? 'success' : 'warning'}`}>
                                {tx.status}
                              </span>
                              <small className="d-block text-muted">
                                {formatDate(tx.createdAt)}
                              </small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No payments made yet</p>
                  )}
                </div>
              )}

              {activeTab === 'timeline' && (
                <div>
                  <h5>Booking Timeline</h5>
                  {booking.timeline && booking.timeline.length > 0 ? (
                    <div className="timeline">
                      {booking.timeline.map((event, idx) => (
                        <div key={idx} className="timeline-item mb-3 pb-3 border-bottom">
                          <div className="d-flex justify-content-between">
                            <strong>{event.status}</strong>
                            <small className="text-muted">{formatDate(event.changedAt)}</small>
                          </div>
                          {event.notes && <p className="mb-0 small text-muted">{event.notes}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No timeline events yet</p>
                  )}

                  {['pending', 'confirmed', 'in-progress'].includes(booking.status) && (
                    <div className="mt-4">
                      <h6>Current Progress</h6>
                      <div className="progress" style={{ height: '20px' }}>
                        <div
                          className="progress-bar"
                          style={{
                            width: `${booking.progress?.percentage || 0}%`,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          }}
                        >
                          {booking.progress?.percentage || 0}%
                        </div>
                      </div>
                    </div>
                  )}

                  {booking.assignedTeam && booking.assignedTeam.length > 0 && (
                    <div className="mt-4">
                      <h6>Assigned Team</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {booking.assignedTeam.map(member => (
                          <div key={member.employee?._id} className="team-member p-2 bg-light rounded">
                            <img
                              src={member.employee?.profilePicture || '/assets/images/default-avatar.svg'}
                              alt=""
                              className="rounded-circle me-2"
                              width="32"
                              height="32"
                            />
                            <small>{member.employee?.profile?.firstName}</small>
                            <small className="text-muted d-block">({member.role})</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          {/* Booking Summary */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Booking Summary</h5>
            </div>
            <div className="card-body">
              <table className="table table-sm">
                <tbody>
                  <tr>
                    <td><strong>Booking ID</strong></td>
                    <td><code>{booking.bookingId}</code></td>
                  </tr>
                  <tr>
                    <td><strong>Event</strong></td>
                    <td>{booking.event?.name}</td>
                  </tr>
                  <tr>
                    <td><strong>Package</strong></td>
                    <td>{booking.event?.packages?.find(p => p._id === booking.event?.package)?.name || 'Standard'}</td>
                  </tr>
                  <tr>
                    <td><strong>Date</strong></td>
                    <td>{formatDate(booking.eventDetails?.date)}</td>
                  </tr>
                  <tr>
                    <td><strong>Guests</strong></td>
                    <td>{booking.eventDetails?.expectedGuests}</td>
                  </tr>
                  <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>{formatCurrency(booking.pricing?.totalAmount)}</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Status</strong></td>
                    <td>
                      <span className={`badge bg-${STATUS_BADGES[booking.status]?.class || 'secondary'}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                  {booking.createdAt && (
                    <tr>
                      <td><strong>Created</strong></td>
                      <td>{formatDate(booking.createdAt)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Contact Support */}
          <div className="card">
            <div className="card-body text-center">
              <h6>Need Help?</h6>
              <p className="small text-muted mb-3">Contact our support team for assistance</p>
              <button className="btn btn-outline-primary btn-sm">
                <i className="bi bi-envelope me-2"></i> Send Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;
