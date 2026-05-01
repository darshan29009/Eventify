import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import './AdminSettings.css';

const AdminSettings = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Profile settings
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  // Password settings
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.profile?.firstName || user.firstName || '',
        lastName: user.profile?.lastName || user.lastName || '',
        email: user.email || '',
        phone: user.profile?.phone || user.phone || ''
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const normalizedPhone = profileData.phone.replace(/\D/g, '').slice(-10);

      await api.put('/auth/me', {
        profile: {
          firstName: profileData.firstName.trim(),
          lastName: profileData.lastName.trim(),
          phone: normalizedPhone
        }
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'danger', text: err?.data?.message || err.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'danger', text: 'New passwords do not match' });
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ type: 'danger', text: err?.data?.message || err.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'bi-person' },
    { id: 'password', label: 'Password', icon: 'bi-key' }
  ];

  return (
    <div className="admin-settings">
      <div className="mb-4">
        <h1>Settings</h1>
        <p className="text-muted">Manage your account and system preferences</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
        </div>
      )}

      <div className="row">
        <div className="col-lg-3">
          <div className="list-group settings-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`list-group-item list-group-item-action ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <i className={`bi ${tab.icon} me-2`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="col-lg-9">
          {activeTab === 'profile' && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Profile Information</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleProfileSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="admin-firstName" className="form-label">First Name</label>
                      <input
                        id="admin-firstName"
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        className="form-control"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="admin-lastName" className="form-label">Last Name</label>
                      <input
                        id="admin-lastName"
                        name="lastName"
                        type="text"
                        autoComplete="family-name"
                        className="form-control"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="admin-email" className="form-label">Email</label>
                      <input
                        id="admin-email"
                        name="email"
                        type="email"
                        className="form-control"
                        value={profileData.email}
                        disabled
                      />
                      <small className="text-muted">Email cannot be changed</small>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="admin-phone" className="form-label">Phone</label>
                      <input
                        id="admin-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        className="form-control"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Change Password</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handlePasswordSubmit}>
                  <div className="mb-3">
                    <label htmlFor="current-password" className="form-label">Current Password</label>
                    <input
                      id="current-password"
                      name="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      className="form-control"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="new-password" className="form-label">New Password</label>
                    <input
                      id="new-password"
                      name="newPassword"
                      type="password"
                      autoComplete="new-password"
                      className="form-control"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                      minLength="6"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="confirm-new-password" className="form-label">Confirm New Password</label>
                    <input
                      id="confirm-new-password"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      className="form-control"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
