import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, makeRequest } from '../../services/api';
import { formatDate, formatCurrency } from '../../constants/appConstants';
import './CustomerProfile.css';

const EMPTY_ADDRESS = {
  street: '',
  city: '',
  state: '',
  country: '',
  pincode: ''
};

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  address: EMPTY_ADDRESS
};

const normalizeAddress = (address = {}) => ({
  street: address.street || '',
  city: address.city || '',
  state: address.state || '',
  country: address.country || '',
  pincode: address.pincode || ''
});

const normalizeDateValue = (value) => (value ? String(value).slice(0, 10) : '');

const normalizeAvatar = (profilePicture) => {
  if (!profilePicture || profilePicture === 'default-avatar.png') {
    return '/assets/images/default-avatar.svg';
  }

  return profilePicture;
};

const CustomerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers/profile');
      const userData = res?.data || {};
      setProfile(userData);
      if (userData?.user) {
        setFormData({
          firstName: userData.user.firstName || '',
          lastName: userData.user.lastName || '',
          phone: userData.user.phone || '',
          dateOfBirth: normalizeDateValue(userData.user.dateOfBirth),
          gender: userData.user.gender || '',
          address: normalizeAddress(userData.user.address)
        });
      } else {
        setFormData(EMPTY_FORM);
      }
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const cleanedPhone = formData.phone.replace(/\D/g, '');
      const normalizedPhone = cleanedPhone ? cleanedPhone.slice(-10) : undefined;
      const payload = {
        profile: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: normalizedPhone,
          dateOfBirth: formData.dateOfBirth || undefined,
          gender: formData.gender || undefined
        },
        address: {
          street: formData.address.street.trim() || undefined,
          city: formData.address.city.trim() || undefined,
          state: formData.address.state.trim() || undefined,
          country: formData.address.country.trim() || undefined,
          pincode: formData.address.pincode.trim() || undefined
        }
      };

      await makeRequest(api.updateCustomerProfile(payload));
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
      await fetchProfile();
    } catch (err) {
      setMessage({ type: 'danger', text: err.data?.error || err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'danger', text: 'Passwords do not match' });
      return;
    }

    try {
      setChangingPassword(true);
      await api.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="customer-profile">
      <div className="mb-4">
        <h1>My Profile</h1>
        <p className="text-muted">Manage your personal information</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
        </div>
      )}

      <div className="row">
        <div className="col-lg-4">
          <div className="card profile-card mb-4">
            <div className="card-body text-center">
              <img
                src={normalizeAvatar(profile?.user?.profilePicture)}
                alt="Profile"
                className="rounded-circle mb-3"
                width="120"
                height="120"
                style={{ border: '4px solid #667eea', padding: '4px' }}
              />
              <h5>{profile?.user?.firstName} {profile?.user?.lastName}</h5>
              <p className="text-muted">{profile?.user?.email}</p>
              <div className="text-start small mt-3">
                <p className="mb-1"><strong>Member Since:</strong> {formatDate(profile?.user?.createdAt)}</p>
                <p className="mb-1"><strong>Total Bookings:</strong> {profile?.stats?.totalBookings || 0}</p>
                <p className="mb-0"><strong>Total Spent:</strong> {formatCurrency(profile?.stats?.totalSpent || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Profile Information</h5>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setEditing(!editing)}
              >
                {editing ? 'Cancel' : <><i className="bi bi-pencil me-2"></i>Edit</>}
              </button>
            </div>
            <div className="card-body">
              {editing ? (
                <form onSubmit={handleProfileSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        className="form-control"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        className="form-control"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        className="form-control"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Gender</label>
                      <select
                        name="gender"
                        className="form-select"
                        value={formData.gender}
                        onChange={handleInputChange}
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <hr className="col-12" />
                    <h6 className="col-12 mt-3">Address</h6>
                    <div className="col-12 mb-3">
                      <label className="form-label">Street Address</label>
                      <input
                        type="text"
                        name="address.street"
                        className="form-control"
                        value={formData.address.street}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        name="address.city"
                        className="form-control"
                        value={formData.address.city}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">State</label>
                      <input
                        type="text"
                        name="address.state"
                        className="form-control"
                        value={formData.address.state}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Country</label>
                      <input
                        type="text"
                        name="address.country"
                        className="form-control"
                        value={formData.address.country}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">PIN Code</label>
                      <input
                        type="text"
                        name="address.pincode"
                        className="form-control"
                        value={formData.address.pincode}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="profile-info">
                  <div className="row">
                    <div className="col-md-6">
                      <table className="table">
                        <tbody>
                          <tr>
                            <td><strong>Full Name</strong></td>
                            <td>{profile?.user?.firstName} {profile?.user?.lastName}</td>
                          </tr>
                          <tr>
                            <td><strong>Email</strong></td>
                            <td>{profile?.user?.email}</td>
                          </tr>
                          <tr>
                            <td><strong>Phone</strong></td>
                            <td>{profile?.user?.phone || 'Not set'}</td>
                          </tr>
                          <tr>
                            <td><strong>Date of Birth</strong></td>
                            <td>{profile?.user?.dateOfBirth || 'Not set'}</td>
                          </tr>
                          <tr>
                            <td><strong>Gender</strong></td>
                            <td>{profile?.user?.gender || 'Not set'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="col-md-6">
                      <h6>Address</h6>
                      <address>
                        {profile?.user?.address?.street && <p>{profile.user.address.street}</p>}
                        {profile?.user?.address?.city && <p>{profile.user.address.city}</p>}
                        {profile?.user?.address?.state && <p>{profile.user.address.state}</p>}
                        {profile?.user?.address?.country && <p>{profile.user.address.country}</p>}
                        {profile?.user?.address?.pincode && <p>{profile.user.address.pincode}</p>}
                        {!profile?.user?.address && <p className="text-muted">No address set</p>}
                      </address>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Change Password */}
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">Change Password</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-3">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    minLength="6"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={changingPassword}>
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
