import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await register({
        ...formData,
        role: 'customer'
      });
      navigate('/customer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header text-center">
            <h1>Create Account</h1>
            <p className="text-muted">Join Eventify and start planning your events</p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="register-firstName" className="form-label">First Name *</label>
                <input
                  id="register-firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  className="form-control"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="register-lastName" className="form-label">Last Name *</label>
                <input
                  id="register-lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  className="form-control"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="register-email" className="form-label">Email *</label>
              <input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                className="form-control"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="register-phone" className="form-label">Phone</label>
              <input
                id="register-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                className="form-control"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="register-password" className="form-label">Password *</label>
              <input
                id="register-password"
                name="password"
                type="password"
                autoComplete="new-password"
                className="form-control"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength="6"
              />
              <small className="text-muted">At least 6 characters</small>
            </div>

            <div className="mb-3">
              <label htmlFor="register-confirmPassword" className="form-label">Confirm Password *</label>
              <input
                id="register-confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="form-control"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 btn-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="auth-footer text-center mt-4">
            <p className="text-muted">
              Already have an account? <Link to="/login">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;