import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatDate, formatCurrency, STATUS_BADGES } from '../../constants/appConstants';
import { Form } from 'react-bootstrap';
import './AdminCustomers.css';

const AdminCustomers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await api.get('/admin/customers');
      setCustomers(res.data?.data?.customers || res.data?.customers || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const toggleCustomerStatus = async (customerId, isActive) => {
    try {
      await api.put(`/admin/customers/${customerId}/status`, { isActive: !isActive });
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const viewCustomerDetails = async (customer) => {
    try {
      const res = await api.get(`/admin/customers/${customer._id}`);
      setSelectedCustomer(res.data?.data || res.data);
      setShowModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch customer details');
    }
  };

  const filteredCustomers = customers.filter(customer => {
    if (filterStatus === 'all') return true;
    return customer.isActive === (filterStatus === 'active');
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="admin-customers">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Customers</h1>
          <p className="text-muted">Manage registered customers</p>
        </div>
        <Link to="/admin/dashboard" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i> Back to Dashboard
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Stats */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body">
              <h3>{customers.length}</h3>
              <p className="text-muted mb-0">Total Customers</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body">
              <h3>{customers.filter(c => c.isActive).length}</h3>
              <p className="text-muted mb-0">Active</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body">
              <h3>{customers.filter(c => !c.isActive).length}</h3>
              <p className="text-muted mb-0">Blocked</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body">
              <h3>{customers.reduce((sum, c) => sum + (c.totalBookings || 0), 0)}</h3>
              <p className="text-muted mb-0">Total Bookings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4 admin-filter-card">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label htmlFor="customer-status">Status</Form.Label>
                <Form.Select
                  className="admin-filter-control"
                  id="customer-status"
                  name="status"
                  autoComplete="off"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Blocked</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-6 d-flex align-items-end">
              <button className="btn btn-primary w-100 admin-filter-action" onClick={fetchCustomers}>
                <i className="bi bi-arrow-clockwise"></i> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-people display-4 text-muted"></i>
              <p className="mt-2">No customers found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>City</th>
                    <th>Bookings</th>
                    <th>Total Spent</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(customer => (
                    <tr key={customer._id}>
                      <td>
                        <div>
                          <strong>{customer.profile?.firstName} {customer.profile?.lastName}</strong>
                          <small className="d-block text-muted">
                            Joined {formatDate(customer.createdAt)}
                          </small>
                        </div>
                      </td>
                      <td>{customer.email}</td>
                      <td>{customer.profile?.phone || '-'}</td>
                      <td>{customer.profile?.city || '-'}</td>
                      <td>{customer.totalBookings || 0}</td>
                      <td>
                        {formatCurrency(customer.totalSpent || 0)}
                      </td>
                      <td>
                        <span className={`badge ${customer.isActive ? 'bg-success' : 'bg-danger'}`}>
                          {customer.isActive ? 'Active' : 'Blocked'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => viewCustomerDetails(customer)}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          className={`btn btn-sm ${customer.isActive ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => toggleCustomerStatus(customer._id, customer.isActive)}
                          title={customer.isActive ? 'Block Customer' : 'Unblock Customer'}
                        >
                          <i className={`bi ${customer.isActive ? 'bi-person-x' : 'bi-person-check'}`}></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Customer Details Modal */}
      {showModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">Customer Details</h5>
              <button className="btn-close" onClick={() => setShowModal(false)}></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-4 text-center mb-3">
                  <img
                    src={selectedCustomer.profile?.profilePicture || '/assets/images/default-avatar.svg'}
                    alt=""
                    className="rounded-circle mb-2"
                    width="120"
                    height="120"
                  />
                  <h6>{selectedCustomer.profile?.firstName} {selectedCustomer.profile?.lastName}</h6>
                  <span className={`badge ${selectedCustomer.isActive ? 'bg-success' : 'bg-danger'}`}>
                    {selectedCustomer.isActive ? 'Active' : 'Blocked'}
                  </span>
                </div>
                <div className="col-md-8">
                  <h6>Contact Information</h6>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td><strong>Email:</strong></td>
                        <td>{selectedCustomer.email}</td>
                      </tr>
                      <tr>
                        <td><strong>Phone:</strong></td>
                        <td>{selectedCustomer.profile?.phone || '-'}</td>
                      </tr>
                      <tr>
                        <td><strong>Date of Birth:</strong></td>
                        <td>{selectedCustomer.profile?.dateOfBirth || '-'}</td>
                      </tr>
                      <tr>
                        <td><strong>Gender:</strong></td>
                        <td>{selectedCustomer.profile?.gender || '-'}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h6 className="mt-3">Address</h6>
                  <p className="text-muted">
                    {selectedCustomer.address?.street}<br />
                    {selectedCustomer.address?.city}, {selectedCustomer.address?.state} {selectedCustomer.address?.pincode}<br />
                    {selectedCustomer.address?.country}
                  </p>

                  <h6 className="mt-3">Account Stats</h6>
                  <div className="row g-2">
                    <div className="col-3">
                      <div className="p-2 bg-light rounded">
                        <strong>{selectedCustomer.bookings?.length || 0}</strong><br />
                        <small>Bookings</small>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="p-2 bg-light rounded">
                        <strong>{formatCurrency(selectedCustomer.statistics?.totalSpent || 0)}</strong><br />
                        <small>Total Spent</small>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="p-2 bg-light rounded">
                        <strong>{selectedCustomer.reviews?.length || 0}</strong><br />
                        <small>Reviews</small>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="p-2 bg-light rounded">
                        <strong>{selectedCustomer.lastLogin ? new Date(selectedCustomer.lastLogin).toLocaleDateString() : 'Never'}</strong><br />
                        <small>Last Login</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
              {selectedCustomer.bookings?.length > 0 && (
                <Link to={`/admin/bookings?customer=${selectedCustomer._id}`} className="btn btn-primary">
                  View Bookings
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
