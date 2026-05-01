import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api, makeRequest } from '../../services/api';
import { EVENT_TYPE_LABELS, STATUS_BADGES, PRIORITY_COLORS, formatCurrency } from '../../constants/appConstants';
import './BookingFlow.css';

const BookingFlow = () => {
  const { eventId: paramEventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get eventId from location.state (passed from EventDetail) or from route params
  const eventId = location.state?.eventId || paramEventId;

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    package: '',
    date: '',
    startTime: '',
    endTime: '',
    expectedGuests: '',
    specialRequirements: '',
    customizations: {},
    termsAccepted: false
  });
  const [totalAmount, setTotalAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!eventId) {
      // No eventId provided, redirect to events listing
      navigate('/customer/events');
      return;
    }
    fetchEvent();
  }, [eventId, user, navigate]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers/events/${eventId}`);
      const eventData = res.data.data || res.data; // Handle both response formats
      setEvent(eventData);
      if (eventData.packages && eventData.packages.length > 0) {
        setFormData(prev => ({ ...prev, package: eventData.packages[0]._id }));
        setTotalAmount(eventData.packages[0].price);
      }
      // Set some default available dates based on event availability if needed
      // For now, we'll leave it empty - user can select any date
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Recalculate total if package changes
    if (name === 'package' && event) {
      const selectedPackage = event.packages.find(pkg => pkg._id === value);
      if (selectedPackage) {
        setTotalAmount(selectedPackage.price);
      }
    }
  };

  // Helper to format time for display (24h to 12h format)
  const formatTimeDisplay = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleCustomizationChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      customizations: { ...prev.customizations, [key]: value }
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.package && formData.date && formData.startTime && formData.endTime;
      case 2:
        return formData.expectedGuests && parseInt(formData.expectedGuests) > 0;
      case 3:
        return formData.termsAccepted;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const submitBooking = async () => {
    try {
      setSubmitting(true);

      // Get the selected package to use its duration
      const selectedPackage = event.packages.find(pkg => pkg._id === formData.package);
      if (!selectedPackage) {
        setError('Selected package not found');
        setSubmitting(false);
        return;
      }

      const payload = {
        event: { eventId: eventId },
        package: formData.package,
        eventDetails: {
          eventType: event.type,
          subType: event.subType,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          duration: selectedPackage.duration || '4 hours',
          venue: event.venues[0] ? {
            name: event.venues[0].name,
            address: event.venues[0].address,
            city: event.venues[0].city,
            state: event.venues[0].state,
            pincode: event.venues[0].pincode,
            mapUrl: event.venues[0].mapUrl,
            coordinates: event.venues[0].coordinates
          } : {
            name: event.name,
            address: 'Venue address will be provided',
            city: 'City',
            state: 'State'
          },
          expectedGuests: parseInt(formData.expectedGuests),
          specialRequirements: formData.specialRequirements,
          customizations: formData.customizations
        }
      };

      const res = await makeRequest(api.createBooking(payload));
      // The response from makeRequest is response.data, so res is { success, data, message }
      // The booking is in res.data
      const booking = res.data;
      if (!booking || !booking._id) {
        setError('Failed to get booking ID from response. Please try again.');
        setSubmitting(false);
        return;
      }
      navigate(`/customer/payment/${booking._id}`);
    } catch (err) {
      console.error('Booking error details:', err.data || err.response?.data || err);
      const validationErrors = Array.isArray(err.data?.errors)
        ? err.data.errors.map((item) => item.msg || item.message).filter(Boolean).join(', ')
        : '';
      const errorMsg = err.data?.error ||
                       err.data?.message ||
                       validationErrors ||
                       err.response?.data?.error ||
                       err.response?.data?.message ||
                       'Failed to create booking';
      setError(errorMsg);
      setSubmitting(false);
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

  if (error || !event) {
    return (
      <div className="error-container">
        <h2>Oops! Something went wrong</h2>
        <p>{error || 'Event not found'}</p>
        <Link to="/customer/events" className="btn btn-primary">
          Browse Events
        </Link>
      </div>
    );
  }

  return (
    <div className="booking-flow">
      <div className="container">
        {/* Header */}
        <div className="booking-header">
          <h1>Book Your Event</h1>
          <p className="text-muted">{event.name}</p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          {['Select Package', 'Event Details', 'Review & Confirm'].map((label, index) => (
            <div
              key={label}
              className={`step ${currentStep > index + 1 ? 'completed' : ''} ${currentStep === index + 1 ? 'active' : ''}`}
            >
              <div className="step-number">{index + 1}</div>
              <div className="step-label">{label}</div>
              {index < 2 && <div className="step-connector"></div>}
            </div>
          ))}
        </div>

        <div className="booking-content">
          {/* Sidebar - Summary */}
          <div className="booking-sidebar">
            <div className="card sticky">
              <div className="card-body">
                <h5 className="card-title">Booking Summary</h5>
                <div className="summary-details mb-3">
                  <h6>{event.name}</h6>
                  <p className="text-muted small">{EVENT_TYPE_LABELS[event.type]}</p>
                </div>

                {formData.package && (() => {
                  const selectedPkg = event.packages.find(p => p._id === formData.package);
                  return selectedPkg ? (
                    <div className="package-summary">
                      <h6>Selected Package: {selectedPkg.name}</h6>
                      <ul className="included-services">
                        {selectedPkg.includedServices.slice(0, 4).map((service, idx) => (
                          <li key={idx}>{service.name}</li>
                        ))}
                        {selectedPkg.includedServices.length > 4 && (
                          <li>+{selectedPkg.includedServices.length - 4} more</li>
                        )}
                      </ul>
                    </div>
                  ) : null;
                })()}

                <div className="price-summary">
                  <div className="price-row">
                    <span>Package Price</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="price-row">
                    <span>GST (18%)</span>
                    <span>{formatCurrency(totalAmount * 0.18)}</span>
                  </div>
                  <hr />
                  <div className="price-row total">
                    <span>Total</span>
                    <span>{formatCurrency(totalAmount * 1.18)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="booking-main">
            {/* Step 1: Select Package */}
            {currentStep === 1 && (
              <div className="step-content">
                <h2>Select Package & Date</h2>

                <div className="package-selection">
                  <h5>Choose a Package</h5>
                  <div className="package-cards">
                    {event.packages.map(pkg => (
                      <div
                        key={pkg._id}
                        className={`package-card ${formData.package === pkg._id ? 'selected' : ''}`}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, package: pkg._id }));
                          setTotalAmount(pkg.price);
                        }}
                      >
                        <div className="package-header">
                          <h6>{pkg.name}</h6>
                          <div className="package-price">{formatCurrency(pkg.price)}</div>
                        </div>
                        <div className="package-features">
                          {pkg.features.slice(0, 4).map((feature, idx) => (
                            <div key={idx} className="feature-item">
                              <i className={`bi ${feature.included ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'}`}></i>
                              <span>{feature.name}</span>
                            </div>
                          ))}
                        </div>
                        {pkg.discountedPrice && (
                          <div className="discount-badge">
                            Save {Math.round((1 - pkg.discountedPrice / pkg.price) * 100)}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="date-selection mt-4">
                  <h5>Select Date & Time</h5>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Event Date *</label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">Start Time *</label>
                      <input
                        type="time"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">End Time *</label>
                      <input
                        type="time"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-4">
                  <button className="btn btn-primary btn-lg" onClick={nextStep}>
                    Continue <i className="bi bi-arrow-right ms-2"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Event Details */}
            {currentStep === 2 && (
              <div className="step-content">
                <h2>Event Details</h2>

                <div className="mb-4">
                  <h5>Guest Count</h5>
                  <div className="row">
                    <div className="col-md-6">
                      <label className="form-label">Expected Number of Guests *</label>
                      <input
                        type="number"
                        name="expectedGuests"
                        value={formData.expectedGuests}
                        onChange={handleInputChange}
                        min="1"
                        max="1000"
                        className="form-control"
                        required
                      />
                      <small className="text-muted">
                        {event.venues[0] && `Venue capacity: ${event.venues[0].capacity} people`}
                      </small>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h5>Special Requirements</h5>
                  <textarea
                    name="specialRequirements"
                    value={formData.specialRequirements}
                    onChange={handleInputChange}
                    className="form-control"
                    rows="4"
                    placeholder="Any special requests, dietary restrictions, theme preferences, etc."
                  />
                </div>

                {event.includes && event.includes.length > 0 && (
                  <div className="mb-4">
                    <h5>Additional Services</h5>
                    <div className="row">
                      {event.includes.map((service, idx) => (
                        <div key={idx} className="col-md-6">
                          <div className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={formData.customizations[service?.name || service] || false}
                              onChange={(e) => handleCustomizationChange(service?.name || service, e.target.checked)}
                              id={`service-${idx}`}
                            />
                            <label className="form-check-label" htmlFor={`service-${idx}`}>
                              {service?.name || service}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="d-flex justify-content-between mt-4">
                  <button className="btn btn-outline-secondary" onClick={prevStep}>
                    <i className="bi bi-arrow-left me-2"></i> Back
                  </button>
                  <button className="btn btn-primary btn-lg" onClick={nextStep}>
                    Continue <i className="bi bi-arrow-right ms-2"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Confirm */}
            {currentStep === 3 && (
              <div className="step-content">
                <h2>Review & Confirm</h2>

                <div className="review-sections">
                  <div className="review-section card mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Event Information</h5>
                      <table className="table table-sm">
                        <tbody>
                          <tr>
                            <td><strong>Event</strong></td>
                            <td>{event.name}</td>
                          </tr>
                          <tr>
                            <td><strong>Package</strong></td>
                            <td>{event.packages.find(p => p._id === formData.package)?.name}</td>
                          </tr>
                          <tr>
                            <td><strong>Date</strong></td>
                            <td>{new Date(formData.date).toLocaleDateString()}</td>
                          </tr>
                          <tr>
                            <td><strong>Time</strong></td>
                            <td>{formatTimeDisplay(formData.startTime)} - {formatTimeDisplay(formData.endTime)}</td>
                          </tr>
                          <tr>
                            <td><strong>Guests</strong></td>
                            <td>{formData.expectedGuests}</td>
                          </tr>
                          {formData.specialRequirements && (
                            <tr>
                              <td><strong>Special Requirements</strong></td>
                              <td>{formData.specialRequirements}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="review-section card mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Payment Summary</h5>
                      <table className="table table-sm">
                        <tbody>
                          <tr>
                            <td>Package Price</td>
                            <td>{formatCurrency(totalAmount)}</td>
                          </tr>
                          <tr>
                            <td>GST (18%)</td>
                            <td>{formatCurrency(totalAmount * 0.18)}</td>
                          </tr>
                          <tr>
                            <td><strong>Total Amount</strong></td>
                            <td><strong>{formatCurrency(totalAmount * 1.18)}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                      <small className="text-muted">
                        <i className="bi bi-shield-check"></i> Secure payment powered by Stripe
                      </small>
                    </div>
                  </div>

                  <div className="review-section card mb-3">
                    <div className="card-body">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          name="termsAccepted"
                          checked={formData.termsAccepted}
                          onChange={handleInputChange}
                          className="form-check-input"
                          required
                          id="terms"
                        />
                        <label className="form-check-label" htmlFor="terms">
                          I agree to the Terms & Conditions and Privacy Policy
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-between mt-4">
                  <button className="btn btn-outline-secondary" onClick={prevStep}>
                    <i className="bi bi-arrow-left me-2"></i> Back
                  </button>
                  <button
                    className="btn btn-success btn-lg"
                    onClick={submitBooking}
                    disabled={submitting || !formData.termsAccepted}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        Proceed to Payment <i className="bi bi-lock ms-2"></i>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingFlow;
