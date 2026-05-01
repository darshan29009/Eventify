import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatDate } from '../../constants/appConstants';
import './EmployeeProfile.css';

const EmployeeProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bio: '',
    skills: [],
    specializations: []
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees/profile');
      const employeeProfile = res.data.data || res.data;
      const userProfile = employeeProfile?.user?.profile || {};

      setProfile(employeeProfile);
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phone: userProfile.phone || '',
        dateOfBirth: userProfile.dateOfBirth ? String(userProfile.dateOfBirth).slice(0, 10) : '',
        gender: userProfile.gender || '',
        bio: userProfile.bio || '',
        skills: employeeProfile?.skills || [],
        specializations: employeeProfile?.specializations || []
      });
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillAdd = () => {
    const skill = prompt('Enter a new skill:');
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
    }
  };

  const handleSkillRemove = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      let cleanPhone = formData.phone ? formData.phone.replace(/\D/g, '') : '';
      if (cleanPhone.length > 10) {
        cleanPhone = cleanPhone.slice(-10);
      }

      await api.put('/employees/profile', {
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: cleanPhone || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          gender: formData.gender || undefined,
          bio: formData.bio || undefined
        },
        skills: formData.skills,
        specializations: formData.specializations
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
      await fetchProfile();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
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
    <div className="employee-profile">
      <div className="mb-4">
        <h1>My Profile</h1>
        <p className="text-muted">Manage your personal and professional information</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="row">
        <div className="col-lg-4">
          <div className="card profile-card mb-4">
            <div className="card-body text-center">
              <h5>{profile?.user?.profile?.firstName} {profile?.user?.profile?.lastName}</h5>
              <p className="text-muted">{profile?.designation}</p>
              <div className="d-flex justify-content-center gap-2 mb-3">
                {profile?.specializations?.map((spec, idx) => (
                  <span key={idx} className="badge bg-primary">{spec}</span>
                ))}
              </div>
              <div className="text-start small">
                <p className="mb-1"><i className="bi bi-envelope me-2"></i>{profile?.user?.email}</p>
                <p className="mb-1"><i className="bi bi-phone me-2"></i>{profile?.user?.profile?.phone || 'Not set'}</p>
                <p className="mb-1"><i className="bi bi-building me-2"></i>{profile?.department}</p>
                <p className="mb-1"><i className="bi bi-calendar me-2"></i>Joined {formatDate(profile?.joiningDate)}</p>
                <p className="mb-0"><i className="bi bi-award me-2"></i>{profile?.experience} years experience</p>
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
                <form onSubmit={handleSubmit}>
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
                    <div className="col-12 mb-3">
                      <label className="form-label">Bio</label>
                      <textarea
                        name="bio"
                        className="form-control"
                        rows="3"
                        value={formData.bio}
                        onChange={handleInputChange}
                      ></textarea>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Skills</label>
                      <div className="d-flex gap-2 mb-2">
                        {formData.skills.map((skill, idx) => (
                          <span key={idx} className="badge bg-primary">
                            {skill}
                            <button
                              type="button"
                              className="btn-close btn-close-white ms-2"
                              style={{ fontSize: '0.5rem' }}
                              onClick={() => handleSkillRemove(skill)}
                            ></button>
                          </span>
                        ))}
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleSkillAdd}>
                          + Add
                        </button>
                      </div>
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Saving...
                          </>
                        ) : (
                          <>Save Changes</>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="profile-info">
                  <table className="table">
                    <tbody>
                      <tr>
                        <td><strong>Full Name</strong></td>
                        <td>{profile?.user?.profile?.firstName} {profile?.user?.profile?.lastName}</td>
                      </tr>
                      <tr>
                        <td><strong>Email</strong></td>
                        <td>{profile?.user?.email}</td>
                      </tr>
                      <tr>
                        <td><strong>Phone</strong></td>
                        <td>{profile?.user?.profile?.phone || 'Not set'}</td>
                      </tr>
                      <tr>
                        <td><strong>Date of Birth</strong></td>
                        <td>{profile?.user?.profile?.dateOfBirth ? formatDate(profile.user.profile.dateOfBirth) : 'Not set'}</td>
                      </tr>
                      <tr>
                        <td><strong>Gender</strong></td>
                        <td>{profile?.user?.profile?.gender || 'Not set'}</td>
                      </tr>
                      <tr>
                        <td><strong>Employee ID</strong></td>
                        <td>{profile?.employeeId}</td>
                      </tr>
                      <tr>
                        <td><strong>Department</strong></td>
                        <td>{profile?.department}</td>
                      </tr>
                      <tr>
                        <td><strong>Designation</strong></td>
                        <td>{profile?.designation}</td>
                      </tr>
                      <tr>
                        <td><strong>Experience</strong></td>
                        <td>{profile?.experience} years</td>
                      </tr>
                      <tr>
                        <td><strong>Joining Date</strong></td>
                        <td>{formatDate(profile?.joiningDate)}</td>
                      </tr>
                      <tr>
                        <td><strong>Status</strong></td>
                        <td>
                          <span className={`badge ${profile?.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                            {profile?.status}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Skills</strong></td>
                        <td>
                          {profile?.skills?.length > 0 ? (
                            <div className="d-flex flex-wrap gap-2">
                              {profile.skills.map((skill, idx) => (
                                <span key={idx} className="badge bg-primary">{skill}</span>
                              ))}
                            </div>
                          ) : 'No skills added'}
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Bio</strong></td>
                        <td>{profile?.user?.profile?.bio || 'No bio available'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
