import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api, makeRequest } from '../../services/api';
import { formatCurrency } from '../../constants/appConstants';
import './Payment.css';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!bookingId) {
      setError('No booking ID provided');
      setLoading(false);
      return;
    }
    fetchBooking();
  }, [bookingId, user, navigate]);

  useEffect(() => {
    let isMounted = true;

    const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existingScript) {
      setScriptReady(true);
      return undefined;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (isMounted) {
        setScriptReady(true);
      }
    };
    script.onerror = () => {
      if (isMounted) {
        setError('Failed to load Razorpay checkout. Please refresh and try again.');
      }
    };

    document.body.appendChild(script);

    return () => {
      isMounted = false;
    };
  }, []);

  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return '/assets/images/default-event.jpg';
    }

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/assets/')) {
      return imagePath;
    }

    if (imagePath.startsWith('/uploads/')) {
      return `${API_BASE_URL}${imagePath}`;
    }

    return imagePath;
  };

  const getEventName = (bookingData) => (
    bookingData?.event?.name
    || bookingData?.event?.eventId?.name
    || bookingData?.event?.packageName
    || 'N/A'
  );

  const eventName = getEventName(booking);

  const fetchBooking = async () => {
    if (!bookingId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/customers/bookings/${bookingId}`);
      let bookingData = response?.data?.booking || response?.booking || response;

      if (!bookingData || !bookingData._id) {
        throw new Error('Invalid booking: missing ID');
      }

      const normalizePricing = (pricing) => {
        if (!pricing) return null;
        const base = Number(pricing.basePrice) || 0;
        if (base <= 0) return null;
        const taxRate = 0.18;
        const tax = base * taxRate;
        const total = base + tax;
        return {
          basePrice: base,
          tax,
          taxRate,
          totalAmount: total,
          currency: pricing.currency || 'INR'
        };
      };

      let pricing = normalizePricing(bookingData.pricing);
      if (!pricing) {
        if (bookingData.event?.packages && Array.isArray(bookingData.event.packages)) {
          const pkgName = bookingData.event.packageName || (bookingData.event.package && bookingData.event.package.name);
          const pkg = bookingData.event.packages.find(p => p.name === pkgName || p._id === pkgName);
          if (pkg && pkg.price > 0) {
            pricing = normalizePricing({ basePrice: pkg.price, currency: 'INR' });
          }
        }
      }

      if (!pricing) {
        throw new Error('Cannot determine pricing for this booking. Please contact support.');
      }

      bookingData.pricing = pricing;
      setBooking(bookingData);
    } catch (err) {
      setError(err?.data?.message || err.message || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    setError('');

    try {
      const amount = Number(booking?.pricing?.totalAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid payment amount. Please refresh and try again.');
      }

      if (!scriptReady || !window.Razorpay) {
        throw new Error('Razorpay checkout is still loading. Please try again.');
      }

      const orderResponse = await makeRequest(api.createRazorpayOrder(bookingId, amount));
      const order = orderResponse?.data || orderResponse;
      const razorpayKeyId = order?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!order?.orderId || !razorpayKeyId) {
        throw new Error('Razorpay configuration is missing. Please check your payment keys.');
      }

      const fullName = `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() || user?.name || booking?.customer?.name || 'Eventify Customer';
      const rawContact = booking?.customer?.phone || user?.profile?.phone || '';
      const contactDigits = rawContact ? rawContact.replace(/\D/g, '').slice(-10) : '';
      const prefill = {
        name: fullName,
        email: user?.email || booking?.customer?.email || ''
      };

      if (contactDigits.length === 10) {
        prefill.contact = `+91${contactDigits}`;
      }

      const razorpay = new window.Razorpay({
        key: razorpayKeyId,
        amount: Math.round(amount * 100),
        currency: order.currency || booking?.pricing?.currency || 'INR',
        name: 'Eventify',
        description: `Payment for ${getEventName(booking)}`,
        order_id: order.orderId,
        prefill,
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          emi: true,
          paylater: true
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay by UPI',
                instruments: [{ method: 'upi' }]
              },
              other: {
                name: 'Other Payment Methods',
                instruments: [
                  { method: 'card' },
                  { method: 'netbanking' },
                  { method: 'wallet' },
                  { method: 'emi' },
                  { method: 'paylater' }
                ]
              }
            },
            sequence: ['block.upi', 'block.other'],
            preferences: {
              show_default_blocks: false
            }
          }
        },
        notes: {
          bookingId: booking?._id,
          eventName: getEventName(booking)
        },
        theme: {
          color: '#667eea'
        },
        handler: async (response) => {
          try {
            await makeRequest(api.verifyRazorpayPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              bookingId: booking._id,
              amount
            }));

            setPaymentSuccess(true);
            await fetchBooking();
          } catch (verificationError) {
            setError(verificationError?.data?.message || verificationError.message || 'Payment verification failed.');
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          }
        }
      });

      razorpay.on('payment.failed', (response) => {
        setError(response?.error?.description || 'Payment failed. Please try again.');
        setProcessing(false);
      });

      razorpay.open();
    } catch (err) {
      setError(err?.data?.message || err.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading payment details...</p>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="error-container">
        <h2>Payment Error</h2>
        <p>{error}</p>
        <Link to="/customer/bookings" className="btn btn-primary">
          View My Bookings
        </Link>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="payment-success">
        <div className="container text-center py-5">
          <div className="success-animation mb-4">
            <div className="checkmark-circle">
              <i className="bi bi-check-lg"></i>
            </div>
          </div>
          <h1 className="mb-3">Payment Successful! 🎉</h1>
          <p className="lead mb-4">
            Your booking has been confirmed. A confirmation email has been sent to {user.email}.
          </p>
          <div className="success-details card mb-4">
            <div className="card-body">
              <h5 className="card-title">Booking Details</h5>
              <p><strong>Booking ID:</strong> {booking?.bookingId}</p>
              {eventName !== 'N/A' && <p><strong>Event:</strong> {eventName}</p>}
              <p><strong>Amount Paid:</strong> {formatCurrency(booking?.pricing?.totalAmount || 0)}</p>
              <p><strong>Date:</strong> {booking?.eventDetails?.date ? new Date(booking.eventDetails.date).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
          <div className="d-flex gap-2 justify-content-center">
            <Link to="/customer/bookings" className="btn btn-primary">
              View My Bookings
            </Link>
            <Link to="/customer/dashboard" className="btn btn-outline-primary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="container">
        <div className="payment-header">
          <h1>Complete Your Payment</h1>
          <p className="text-muted">Secure Razorpay test checkout</p>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        <div className="payment-content">
          <div className="payment-form">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Pay With Razorpay</h5>
              </div>
              <div className="card-body">
                <div className="payment-methods">
                  <div className="payment-method active">
                    <div className="method-icon">
                      <i className="bi bi-shield-lock"></i>
                    </div>
                    <div className="method-details">
                      <h6>Card, UPI, Netbanking, Wallet</h6>
                      <small className="text-muted">Razorpay test mode checkout</small>
                    </div>
                    <div className="method-badge">Test</div>
                  </div>
                </div>

                <hr />

                <button
                  type="button"
                  className="btn btn-primary btn-lg w-100"
                  onClick={handlePayment}
                  disabled={processing || !booking?.pricing || !scriptReady}
                >
                  {processing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Opening Razorpay...
                    </>
                  ) : (
                    <>
                      Pay {formatCurrency(booking?.pricing?.totalAmount || 0)} <i className="bi bi-lock ms-2"></i>
                    </>
                  )}
                </button>

                <div className="mt-3">
                  <small className="text-muted">
                    <i className="bi bi-shield-lock"></i> This uses Razorpay test mode, so no real charge will be made.
                  </small>
                </div>

                <div className="test-info mt-3">
                  <small className="text-muted">
                    <strong>Test Mode:</strong> Use Razorpay test details in the popup to complete the booking payment.
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="payment-summary">
            <div className="card sticky">
              <div className="card-body">
                <h5 className="card-title">Order Summary</h5>

                {booking && booking.event && (
                  <>
                    <div className="event-item mb-3">
                      <img
                        src={getImageUrl(booking.event.images?.[0])}
                        alt={eventName}
                        className="event-image"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/assets/images/default-event.jpg';
                        }}
                      />
                      <div className="event-info">
                        <h6>{eventName !== 'N/A' ? eventName : 'Booked Event'}</h6>
                        <small className="text-muted">
                          {booking.eventDetails ? new Date(booking.eventDetails.date).toLocaleDateString() : ''}
                        </small>
                        <small className="text-muted d-block">
                          {booking.eventDetails?.startTime} - {booking.eventDetails?.endTime}
                        </small>
                      </div>
                    </div>

                    <div className="booking-details mb-3">
                      <small className="text-muted">
                        <p><strong>Guests:</strong> {booking.eventDetails?.expectedGuests || ''}</p>
                        <p><strong>Venue:</strong> {booking.eventDetails?.venue?.name || ''}</p>
                      </small>
                    </div>

                    <hr />

                    <div className="price-details">
                      <div className="price-row">
                        <span>Package</span>
                        <span>{formatCurrency(booking.pricing?.basePrice || 0)}</span>
                      </div>
                      <div className="price-row">
                        <span>GST (18%)</span>
                        <span>{formatCurrency(booking.pricing?.tax || 0)}</span>
                      </div>
                      <hr />
                      <div className="price-row total">
                        <span>Total</span>
                        <span>{formatCurrency(booking.pricing?.totalAmount || 0)}</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <small className="text-muted">
                        <i className="bi bi-calendar-check"></i> Booking ID: {booking.bookingId}
                      </small>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="secure-badge text-center mt-3">
              <i className="bi bi-shield-check display-6 text-success"></i>
              <p className="small mt-2 mb-0">Razorpay Test Mode</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
