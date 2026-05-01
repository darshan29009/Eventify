import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './EmployeePerformance.css';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b'];

const RANGE_LABELS = {
  '3months': 'Last 3 Months',
  '6months': 'Last 6 Months',
  '1year': 'Last Year'
};

const buildPerformanceView = (payload = {}, range = '6months') => {
  const employee = payload.employee || {};
  const taskStats = payload.taskStats || [];
  const monthlyStats = payload.monthlyStats || { completedCount: 0 };
  const onTimeStats = payload.onTimeStats || [];

  const totalTasks = taskStats.reduce((sum, item) => sum + (item.count || 0), 0);
  const completedTasks = taskStats.find(item => item._id === 'completed')?.count || 0;
  const onTimeCompleted = onTimeStats.find(item => item._id === 'on-time')?.count || 0;
  const lateCompleted = onTimeStats.find(item => item._id === 'late')?.count || 0;
  const ratedValue = Number(employee.performance?.averageRating || 0);

  const stats = {
    totalTasks,
    completedTasks,
    onTimeRate: completedTasks > 0 ? Math.round((onTimeCompleted / completedTasks) * 100) : 0,
    averageRating: employee.performance?.customerFeedbackCount ? ratedValue : null,
    topSkills: (employee.skills || []).slice(0, 4).map(skill => ({ name: skill, count: 1 })),
    bestMonth: monthlyStats.completedCount > 0 ? RANGE_LABELS[range] || 'Recent Period' : 'No data available',
    mostCompletedMonth: {
      tasks: monthlyStats.completedCount || 0,
      month: monthlyStats.completedCount > 0 ? (RANGE_LABELS[range] || 'Recent Period') : 'N/A'
    },
    streak: onTimeCompleted
  };

  const taskDistribution = taskStats.map(item => ({
    name: item._id || 'unknown',
    value: item.count || 0
  }));

  const monthlyData = [
    {
      month: RANGE_LABELS[range] || 'Recent Period',
      assigned: totalTasks,
      completed: completedTasks,
      onTime: onTimeCompleted
    }
  ];

  const ratings = (employee.specializations || []).map(type => ({
    eventType: type,
    count: completedTasks,
    avgRating: ratedValue
  }));

  if (!ratings.length) {
    ratings.push({
      eventType: 'General',
      count: completedTasks,
      avgRating: ratedValue
    });
  }

  return {
    stats,
    monthlyData,
    taskDistribution,
    ratings,
    raw: {
      lateCompleted,
      reviewsCount: payload.reviewsCount || 0
    }
  };
};

const EmployeePerformance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [performance, setPerformance] = useState({
    stats: {},
    monthlyData: [],
    taskDistribution: [],
    ratings: []
  });

  const [timeRange, setTimeRange] = useState('6months'); // 3months, 6months, 1year

  useEffect(() => {
    fetchPerformance();
  }, [timeRange]);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees/performance', { params: { range: timeRange } });
      const payload = res?.data || {};
      setPerformance(buildPerformanceView(payload, timeRange));
      setError('');
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading performance data...</p>
      </div>
    );
  }

  return (
    <div className="employee-performance">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Performance Dashboard</h1>
          <p className="text-muted">Track your work metrics and achievements</p>
        </div>
        <div className="d-flex gap-2">
          <select
            className="form-select"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
          <button className="btn btn-primary" onClick={fetchPerformance}>
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body text-center">
              <h3>{performance.stats?.totalTasks || 0}</h3>
              <p className="text-muted mb-0">Total Tasks</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body text-center">
              <h3>{performance.stats?.completedTasks || 0}</h3>
              <p className="text-muted mb-0">Completed</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body text-center">
              <h3>{performance.stats?.onTimeRate || 0}%</h3>
              <p className="text-muted mb-0">On-Time Rate</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body text-center">
              <h3>{performance.stats?.averageRating != null ? performance.stats.averageRating.toFixed(1) : 'N/A'}</h3>
              <p className="text-muted mb-0">Avg Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card chart-card">
            <div className="card-header">
              <h5 className="mb-0">Monthly Task Completion</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performance.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="assigned" stroke="#667eea" strokeWidth={2} name="Assigned" />
                  <Line type="monotone" dataKey="completed" stroke="#28a745" strokeWidth={2} name="Completed" />
                  <Line type="monotone" dataKey="onTime" stroke="#28a745" strokeWidth={2} name="On-Time" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card chart-card">
            <div className="card-header">
              <h5 className="mb-0">Task Distribution</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={performance.taskDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {(performance.taskDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card chart-card">
            <div className="card-header">
              <h5 className="mb-0">Event Types Handled</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={performance.ratings || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="eventType" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#667eea" name="Events Handled" />
                  <Bar dataKey="avgRating" fill="#ffc107" name="Avg Rating" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Highlights */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Achievements & Highlights</h5>
            </div>
            <div className="card-body">
              <div className="row">
                {performance.stats?.topSkills?.length > 0 && (
                  <div className="col-md-6">
                    <h6>Top Skills</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {performance.stats.topSkills.map((skill, idx) => (
                        <span key={idx} className="badge bg-primary fs-6">
                          {skill.name} ({skill.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="col-md-6">
                  <h6>Best Month</h6>
                  <p className="mb-0">
                    {performance.stats?.bestMonth || 'No data available'}
                  </p>
                </div>
                <div className="col-md-6 mt-3">
                  <h6>Most Completed Tasks in a Month</h6>
                  <h4 className="text-primary">
                    {performance.stats?.mostCompletedMonth?.tasks || 0}
                    <small className="text-muted ms-2">
                      ({performance.stats?.mostCompletedMonth?.month || 'N/A'})
                    </small>
                  </h4>
                </div>
                <div className="col-md-6 mt-3">
                  <h6>On-Time Completion Streak</h6>
                  <h4 className="text-success">
                    {performance.stats?.streak || 0} days
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeePerformance;
