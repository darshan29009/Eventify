import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatDate, formatCurrency, PAYMENT_STATUS } from '../../constants/appConstants';
import { Form } from 'react-bootstrap';
import './AdminPayments.css';

const AdminPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGateway, setFilterGateway] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setError('');
      setLoading(true);
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterGateway !== 'all') params.gateway = filterGateway;

      const res = await api.get('/admin/payments', { params });
      setPayments(res.data?.data?.payments || res.data?.payments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const processRefund = async (paymentId, amount, reason) => {
    if (!window.confirm(`Are you sure you want to refund ${formatCurrency(amount)}?`)) {
      return;
    }

    try {
      setRefunding(true);
      await api.post('/admin/payments/refund', {
        paymentId,
        amount,
        reason
      });
      fetchPayments();
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Refund failed');
    } finally {
      setRefunding(false);
    }
  };

  const viewPaymentDetails = async (payment) => {
    try {
      const res = await api.get(`/payments/${payment._id}`);
      setSelectedPayment(res.data.data);
      setShowModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch payment details');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'succeeded':
      case 'successful':
        return 'bg-success';
      case 'pending':
      case 'processing':
        return 'bg-warning text-dark';
      case 'failed':
        return 'bg-danger';
      case 'refunded':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  };

  const filteredPayments = payments.filter(payment => {
    // Extract booking ID string from either ObjectId or populated Booking object
    const getBookingId = (bId) => {
      if (!bId) return '';
      if (typeof bId === 'object') {
        return bId.bookingId || bId._id || '';
      }
      return bId;
    };

    const bookingIdStr = getBookingId(payment.bookingId);

    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesGateway = filterGateway === 'all' || payment.gateway === filterGateway;

    return matchesStatus && matchesGateway;
  });

  // Calculate totals
  const totalRevenue = filteredPayments
    .filter(p => p.status === 'succeeded' || p.status === 'successful')
    .reduce((sum, p) => sum + p.amount, 0);

  const avgPayment = filteredPayments.length > 0
    ? filteredPayments.reduce((sum, p) => sum + p.amount, 0) / filteredPayments.length
    : 0;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading payments...</p>
      </div>
    );
  }

  return (
    <div className="admin-payments">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Payments</h1>
          <p className="text-muted">Track and manage all transactions</p>
        </div>
        <Link to="/admin/dashboard" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i> Back to Dashboard
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Summary Stats */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body">
              <h3>{filteredPayments.length}</h3>
              <p className="text-muted mb-0">Total Transactions</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body">
              <h3>{formatCurrency(totalRevenue)}</h3>
              <p className="text-muted mb-0">Total Revenue</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body">
              <h3>{formatCurrency(avgPayment)}</h3>
              <p className="text-muted mb-0">Average Payment</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body">
              <h3>{payments.filter(p => p.status === 'succeeded' || p.status === 'successful').length}</h3>
              <p className="text-muted mb-0">Successful</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4 admin-filter-card">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <Form.Group>
                <Form.Label htmlFor="payment-status">Status</Form.Label>
                <Form.Select
                  className="admin-filter-control"
                  id="payment-status"
                  name="status"
                  autoComplete="off"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  {Object.values(PAYMENT_STATUS).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group>
                <Form.Label htmlFor="payment-gateway">Gateway</Form.Label>
                <Form.Select
                  className="admin-filter-control"
                  id="payment-gateway"
                  name="gateway"
                  autoComplete="off"
                  value={filterGateway}
                  onChange={(e) => setFilterGateway(e.target.value)}
                >
                  <option value="all">All Gateways</option>
                  <option value="stripe">Stripe</option>
                  <option value="razorpay">Razorpay</option>
                  <option value="manual">Manual</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button className="btn btn-primary w-100 admin-filter-action" onClick={fetchPayments}>
                <i className="bi bi-arrow-clockwise me-2"></i> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-credit-card display-4 text-muted"></i>
              <p className="mt-2">No payments found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Gateway</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map(payment => (
                    <tr key={payment._id}>
                      <td>
                        <code className="small">{payment.transactionId?.slice(-8)}</code>
                        <small className="d-block text-muted">...{payment.transactionId?.slice(-8)}</small>
                      </td>
                      <td>
                        <Link to={`/admin/bookings?search=${payment.bookingId?.bookingId || payment.bookingId?._id || payment.bookingId}`}>
                          {payment.bookingId?.bookingId || payment.bookingId?._id || payment.bookingId}
                        </Link>
                      </td>
                      <td>{payment.customer?.email}</td>
                      <td><strong>{formatCurrency(payment.amount)}</strong></td>
                      <td>
                        <span className="badge bg-secondary text-capitalize">{payment.gateway}</span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td>{formatDate(payment.createdAt)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => viewPaymentDetails(payment)}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        {payment.status === 'succeeded' && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => viewPaymentDetails(payment)}
                            title="Refund"
                          >
                            <i className="bi bi-arrow-left-right"></i>
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

      {/* Payment Details Modal */}
      {showModal && selectedPayment && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">Payment Details</h5>
              <button className="btn-close" onClick={() => setShowModal(false)}></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>Transaction Information</h6>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td><strong>Transaction ID</strong></td>
                        <td><code>{selectedPayment.transactionId}</code></td>
                      </tr>
                      <tr>
                        <td><strong>Status</strong></td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(selectedPayment.status)}`}>
                            {selectedPayment.status}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Gateway</strong></td>
                        <td className="text-capitalize">{selectedPayment.gateway}</td>
                      </tr>
                      <tr>
                        <td><strong>Amount</strong></td>
                        <td><strong className="text-success">{formatCurrency(selectedPayment.amount)}</strong></td>
                      </tr>
                      <tr>
                        <td><strong>Currency</strong></td>
                        <td>{selectedPayment.currency?.toUpperCase()}</td>
                      </tr>
                      <tr>
                        <td><strong>Created</strong></td>
                        <td>{formatDate(selectedPayment.createdAt)}</td>
                      </tr>
                    </tbody>
                  </table>

                  {selectedPayment.metadata && (
                    <>
                      <h6 className="mt-3">Payment Details</h6>
                      <table className="table table-sm">
                        <tbody>
                          {selectedPayment.metadata.cardLastFour && (
                            <tr>
                              <td><strong>Card</strong></td>
                              <td>**** {selectedPayment.metadata.cardLastFour}</td>
                            </tr>
                          )}
                          {selectedPayment.metadata.bankName && (
                            <tr>
                              <td><strong>Bank</strong></td>
                              <td>{selectedPayment.metadata.bankName}</td>
                            </tr>
                          )}
                          {selectedPayment.metadata.upiId && (
                            <tr>
                              <td><strong>UPI ID</strong></td>
                              <td>{selectedPayment.metadata.upiId}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>

                <div className="col-md-6">
                  <h6>Booking Information</h6>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td><strong>Booking ID</strong></td>
                        <td>
                          <Link to={`/admin/bookings?search=${selectedPayment.bookingId?.bookingId || selectedPayment.bookingId?._id || selectedPayment.bookingId}`}>
                            {selectedPayment.bookingId?.bookingId || selectedPayment.bookingId?._id || selectedPayment.bookingId}
                          </Link>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Customer</strong></td>
                        <td>{selectedPayment.customer?.email}</td>
                      </tr>
                      <tr>
                        <td><strong>Event</strong></td>
                        <td>{selectedPayment.bookingId?.event?.name || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>

                  {selectedPayment.refunds && selectedPayment.refunds.length > 0 && (
                    <>
                      <h6 className="mt-3">Refunds</h6>
                      <ul className="list-unstyled">
                        {selectedPayment.refunds.map((refund, idx) => (
                          <li key={idx} className="mb-2 p-2 bg-light rounded">
                            <div className="d-flex justify-content-between">
                              <strong className="text-danger">{formatCurrency(refund.amount)}</strong>
                              <small>{formatDate(refund.refundedAt)}</small>
                            </div>
                            <small className="text-muted d-block">{refund.reason}</small>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>

              {selectedPayment.receiptUrl && (
                <div className="mt-3 text-center">
                  <a
                    href={selectedPayment.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-primary"
                  >
                    <i className="bi bi-file-earmark-pdf me-2"></i> View Receipt
                  </a>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Close
              </button>
              {(selectedPayment.status === 'succeeded') && (
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    const amount = prompt('Refund amount:', selectedPayment.amount.toString());
                    if (amount) {
                      const reason = prompt('Refund reason:', 'Customer requested refund');
                      if (reason) {
                        processRefund(selectedPayment._id, parseFloat(amount), reason);
                      }
                    }
                  }}
                >
                  <i className="bi bi-arrow-left-right me-2"></i> Process Refund
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
