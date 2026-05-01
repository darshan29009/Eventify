import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatDate, PRIORITY_COLORS } from '../../constants/appConstants';
import './AdminEmployees.css';

const AdminEmployees = () => {
  const { user } = useAuth();
  const emptyFormData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    department: '',
    designation: '',
    specializations: [],
    skills: [],
    experience: 0,
    salary: 0
  };
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState(emptyFormData);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setError(''); // Clear any previous errors
      setLoading(true);
      const res = await api.get('/admin/employees');
      // Handle both response formats: {data: {employees: [...]}} or {employees: [...]}
      const employees = res.data?.data?.employees || res.data?.employees || [];
      setEmployees(employees);
    } catch (err) {
      console.error('❌ API error:', err);
      setError(err.response?.data?.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords match for new employee
    if (!selectedEmployee && formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (!selectedEmployee && formData.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      // Clean phone number - extract exactly 10 digits (last 10 digits if more)
      let cleanPhone = formData.phone ? formData.phone.replace(/\D/g, '') : '';
      // Keep only the last 10 digits (handles Indian numbers with +91 prefix)
      if (cleanPhone.length > 10) {
        cleanPhone = cleanPhone.slice(-10);
      }

      // Transform data to match backend structure
      const payload = {
        email: formData.email,
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          ...(cleanPhone && { phone: cleanPhone })
        },
        address: {
          street: '',
          city: '',
          state: '',
          country: 'India',
          pincode: ''
        },
        department: formData.department,
        designation: formData.designation,
        specializations: formData.specializations,
        skills: formData.skills,
        experience: formData.experience,
        salary: formData.salary,
        joiningDate: new Date()  // Today's date
      };

      // Add password only for new employee
      if (!selectedEmployee && formData.password) {
        payload.password = formData.password;
      }

      if (selectedEmployee) {
        await api.put(`/admin/employees/${selectedEmployee._id}`, payload);
      } else {
        await api.post('/admin/employees', payload);
      }
      setShowAddModal(false);
      setSelectedEmployee(null);
      setFormData(emptyFormData);
      fetchEmployees();
    } catch (err) {
      console.error('❌ Employee save error:', err);
      let errorMessage = err.response?.data?.message || 'Failed to save employee';

      // If there are validation errors, show them
      if (err.response?.data?.errors) {
        const errorList = err.response.data.errors.map(e => e.msg).join(', ');
        errorMessage = `Validation errors: ${errorList}`;
      }

      alert(errorMessage);
    }
  };

  const deleteEmployee = async (employeeId) => {
    if (!window.confirm('Delete this employee?')) return;
    try {
      await api.delete(`/admin/employees/${employeeId}`);
      fetchEmployees();
    } catch (err) {
      alert('Failed to delete employee');
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesDept = filterDepartment === 'all' || emp.department === filterDepartment;
    return matchesDept;
  });

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading employees...</p>
      </div>
    );
  }

  return (
    <div className="admin-employees">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Employees</h1>
          <p className="text-muted">Manage your team</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <i className="bi bi-plus-lg me-2"></i> Add Employee
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Stats */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body">
              <h3>{employees.length}</h3>
              <p className="text-muted mb-0">Total Employees</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body">
              <h3>{employees.filter(e => e.status === 'active').length}</h3>
              <p className="text-muted mb-0">Active</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body">
              <h3>{departments.length}</h3>
              <p className="text-muted mb-0">Departments</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body">
              <h3>
                {employees.reduce((sum, e) => sum + (e.performance?.tasksCompleted || 0), 0)}
              </h3>
              <p className="text-muted mb-0">Tasks Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <select
                className="form-select"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <button className="btn btn-primary w-100" onClick={fetchEmployees}>
                <i className="bi bi-arrow-clockwise"></i> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-people display-4 text-muted"></i>
              <p className="mt-2">No employees found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Experience</th>
                    <th>Specializations</th>
                    <th>Performance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(emp => (
                    <tr key={emp._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={emp.profile?.profilePicture || '/assets/images/default-avatar.svg'}
                            alt=""
                            className="rounded-circle me-2"
                            width="40"
                            height="40"
                          />
                          <div>
                            <strong>{emp.profile?.firstName} {emp.profile?.lastName}</strong>
                            <small className="d-block text-muted">{emp.user?.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>{emp.department}</td>
                      <td>{emp.designation}</td>
                      <td>{emp.experience} years</td>
                      <td>
                        {emp.specializations?.slice(0, 2).map((spec, idx) => (
                          <span key={idx} className="badge bg-primary me-1">{spec}</span>
                        ))}
                        {emp.specializations?.length > 2 && (
                          <span className="badge bg-secondary">+{emp.specializations.length - 2}</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress" style={{ width: '80px', height: '8px' }}>
                            <div
                              className="progress-bar"
                              style={{
                                width: `${Math.min(emp.performance?.tasksCompleted || 0, 100)}%`,
                                background: 'linear-gradient(90deg, #667eea, #764ba2)'
                              }}
                            ></div>
                          </div>
                          <small>{emp.performance?.tasksCompleted || 0} tasks</small>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${emp.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setFormData({
                              ...emptyFormData,
                              firstName: emp.profile?.firstName || '',
                              lastName: emp.profile?.lastName || '',
                              email: emp.user?.email || '',
                              phone: emp.profile?.phone || '',
                              department: emp.department || '',
                              designation: emp.designation || '',
                              specializations: emp.specializations || [],
                              skills: emp.skills || [],
                              experience: emp.experience || 0,
                              salary: emp.salary || 0
                            });
                            setShowAddModal(true);
                          }}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteEmployee(emp._id)}
                        >
                          <i className="bi bi-trash"></i>
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setSelectedEmployee(null); setFormData(emptyFormData); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">{selectedEmployee ? 'Edit Employee' : 'Add New Employee'}</h5>
              <button className="btn-close" onClick={() => { setShowAddModal(false); setSelectedEmployee(null); setFormData(emptyFormData); }}></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="employee-firstName" className="form-label">First Name *</label>
                    <input
                      id="employee-firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      className="form-control"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="employee-lastName" className="form-label">Last Name *</label>
                    <input
                      id="employee-lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      className="form-control"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="employee-email" className="form-label">Email *</label>
                    <input
                      id="employee-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="employee-phone" className="form-label">Phone</label>
                    <input
                      id="employee-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  {!selectedEmployee && (
                    <>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="employee-password" className="form-label">Password *</label>
                        <input
                          id="employee-password"
                          name="password"
                          type="password"
                          autoComplete="new-password"
                          className="form-control"
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          required
                          minLength="6"
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="employee-confirmPassword" className="form-label">Confirm Password *</label>
                        <input
                          id="employee-confirmPassword"
                          name="confirmPassword"
                          type="password"
                          autoComplete="new-password"
                          className="form-control"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          required
                        />
                      </div>
                    </>
                  )}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="employee-department" className="form-label">Department *</label>
                    <select
                      id="employee-department"
                      name="department"
                      autoComplete="off"
                      className="form-select"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      required
                    >
                      <option value="">Select Department</option>
                      <option value="Event Management">Event Management</option>
                      <option value="Operations">Operations</option>
                      <option value="Finance">Finance</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Hospitality">Hospitality</option>
                      <option value="Security">Security</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="employee-designation" className="form-label">Designation *</label>
                    <input
                      id="employee-designation"
                      name="designation"
                      type="text"
                      autoComplete="off"
                      className="form-control"
                      value={formData.designation}
                      onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                      required
                      placeholder="e.g., Event Manager, Coordinator"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="employee-experience" className="form-label">Experience (years)</label>
                    <input
                      id="employee-experience"
                      name="experience"
                      type="number"
                      autoComplete="off"
                      className="form-control"
                      min="0"
                      value={formData.experience}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="employee-salary" className="form-label">Salary (₹)</label>
                    <input
                      id="employee-salary"
                      name="salary"
                      type="number"
                      autoComplete="off"
                      className="form-control"
                      min="0"
                      value={formData.salary}
                      onChange={(e) => setFormData(prev => ({ ...prev, salary: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="col-12">
                    <button type="submit" className="btn btn-primary">
                      {selectedEmployee ? 'Update Employee' : 'Add Employee'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary ms-2"
                      onClick={() => { setShowAddModal(false); setSelectedEmployee(null); setFormData(emptyFormData); }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmployees;
