import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatDate, formatCurrency, PAYMENT_STATUS } from '../../constants/appConstants';
import './PaymentHistory.css';

const PaymentHistory = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('[PaymentHistory] Fetching payments...');
      const res = await api.get('/customers/payment-history');
      console.log('[PaymentHistory] API response:', res);
      // Response structure: { success: true, data: { payments, pagination } }
      const paymentsData = res?.data?.data?.payments || res?.data?.payments || [];
      console.log('[PaymentHistory] Extracted payments:', paymentsData);
      setPayments(paymentsData);
    } catch (err) {
      console.error('[PaymentHistory] Fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
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

  const totalSpent = payments
    .filter(p => p.status === 'succeeded' || p.status === 'successful')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading payment history...</p>
      </div>
    );
  }

  return (
    <div className="payment-history">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Payment History</h1>
          <p className="text-muted">Track all your transactions</p>
        </div>
        <button className="btn btn-outline-primary" onClick={fetchPayments}>
          <i className="bi bi-arrow-clockwise me-2"></i> Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Summary */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card stats-card">
            <div className="card-body">
              <h3>{payments.length}</h3>
              <p className="text-muted mb-0">Total Transactions</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card stats-card">
            <div className="card-body">
              <h3>{formatCurrency(totalSpent)}</h3>
              <p className="text-muted mb-0">Total Spent</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card stats-card">
            <div className="card-body">
              <h3>
                {payments.filter(p => p.status === 'succeeded' || p.status === 'successful').length}
              </h3>
              <p className="text-muted mb-0">Successful Payments</p>
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
          ) : payments.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-credit-card display-4 text-muted"></i>
              <p className="mt-2">No payment history</p>
              <p className="text-muted small">Your transactions will appear here</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Transaction ID</th>
                    <th>Amount</th>
                    <th>Gateway</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(payment => (
                    <tr key={payment._id}>
                      <td>{formatDate(payment.createdAt)}</td>
                      <td>
                        <code className="small">{payment.transactionId?.slice(-8)}</code>
                        <small className="d-block text-muted">...{payment.transactionId?.slice(-8)}</small>
                      </td>
                      <td><strong>{formatCurrency(payment.amount)}</strong></td>
                      <td>
                        <span className="badge bg-secondary text-capitalize">{payment.gateway}</span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td>
                        {payment.receiptUrl && (
                          <a
                            href={payment.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="bi bi-file-earmark-pdf"></i>
                          </a>
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
    </div>
  );
};

export default PaymentHistory;
