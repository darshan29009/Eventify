import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatDate, PRIORITY_COLORS, TASK_STATUS } from '../../constants/appConstants';
import './EmployeeTasks.css';

const EmployeeTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees/tasks');
      // Response: { success: true, data: { tasks: [] } }
      const tasks = res.data?.data?.tasks || res.data?.tasks || [];
      setTasks(tasks);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      await api.put(`/employees/tasks/${taskId}/status`, { status });
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const updateTaskProgress = async (taskId, progress) => {
    try {
      await api.put(`/employees/tasks/${taskId}/progress`, { progress });
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update progress');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  const overdueTasks = tasks.filter(
    t => t.status !== 'completed' && t.deadline && new Date(t.deadline) < new Date()
  );

  const todayTasks = tasks.filter(
    t => t.status !== 'completed' && t.deadline && new Date(t.deadline).toDateString() === new Date().toDateString()
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="employee-tasks">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>My Tasks</h1>
          <p className="text-muted">Track and manage your assigned tasks</p>
        </div>
        <button className="btn btn-primary" onClick={fetchTasks}>
          <i className="bi bi-arrow-clockwise me-2"></i> Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Alert */}
      {overdueTasks.length > 0 && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          You have <strong>{overdueTasks.length}</strong> overdue task(s)!
        </div>
      )}

      {/* Stats */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body">
              <h3>{tasks.filter(t => t.status === 'todo').length}</h3>
              <p className="text-muted mb-0">To Do</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body">
              <h3>{tasks.filter(t => t.status === 'in-progress').length}</h3>
              <p className="text-muted mb-0">In Progress</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body">
              <h3>{tasks.filter(t => t.status === 'completed').length}</h3>
              <p className="text-muted mb-0">Completed</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body">
              <h3>{overdueTasks.length}</h3>
              <p className="text-muted mb-0">Overdue</p>
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
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                {Object.values(TASK_STATUS).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks */}
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-clipboard-check display-4 text-muted"></i>
            <p className="mt-2">No tasks found</p>
          </div>
        </div>
      ) : (
        <div className="tasks-list">
          {filteredTasks.map(task => (
            <div
              key={task._id}
              className={`task-card card mb-3 ${task.isOverdue && task.status !== 'completed' ? 'border-danger' : ''}`}
            >
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 className="task-title">
                      <Link to={`/employee/tasks/${task._id}`}>{task.title}</Link>
                    </h6>
                    {task.event && (
                      <small className="text-muted d-block">
                        <i className="bi bi-calendar-event me-1"></i>
                        {task.event.name} ({task.event.type})
                      </small>
                    )}
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    <span className={`badge bg-${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority.toUpperCase()}
                    </span>
                    <span className={`badge bg-${task.status === 'completed' ? 'success' : 'secondary'}`}>
                      {TASK_STATUS[task.status] || task.status}
                    </span>
                  </div>
                </div>

                <p className="task-description text-muted small mb-3">
                  {task.description?.length > 150
                    ? task.description.substring(0, 150) + '...'
                    : task.description}
                </p>

                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="subtasks mb-3">
                    <small className="text-muted">Subtasks: {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</small>
                    <div className="progress" style={{ height: '6px' }}>
                      <div
                        className="progress-bar"
                        style={{
                          width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%`,
                          background: 'linear-gradient(90deg, #667eea, #764ba2)'
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="task-progress mb-3">
                  <div className="d-flex justify-content-between small mb-1">
                    <span>Progress</span>
                    <span><strong>{task.progress}%</strong></span>
                  </div>
                  <div className="progress" style={{ height: '10px' }}>
                    <div
                      className="progress-bar"
                      style={{
                        width: `${task.progress}%`,
                        background: task.progress === 100
                          ? 'linear-gradient(90deg, #28a745, #20c997)'
                          : 'linear-gradient(90deg, #667eea, #764ba2)'
                      }}
                    ></div>
                  </div>
                </div>

                <div className="task-meta d-flex justify-content-between align-items-center">
                  <div className="task-dates">
                    {task.deadline && (
                      <small className={`${task.isOverdue && task.status !== 'completed' ? 'text-danger' : 'text-muted'}`}>
                        <i className="bi bi-calendar me-1"></i>
                        Due: {formatDate(task.deadline)}
                        {task.daysRemaining !== null && (
                          <span className={`ms-1 ${task.daysRemaining < 0 ? 'text-danger' : task.daysRemaining <= 2 ? 'text-warning' : ''}`}>
                            ({task.daysRemaining < 0 ? `${Math.abs(task.daysRemaining)} days overdue` : `${task.daysRemaining} days left`})
                          </span>
                        )}
                      </small>
                    )}
                  </div>
                  <div className="task-actions d-flex gap-2">
                    {task.status !== 'completed' && (
                      <>
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => updateTaskProgress(task._id, task.progress + 25 > 100 ? 100 : task.progress + 25)}
                          disabled={task.progress >= 100}
                          title="Add 25%"
                        >
                          +25%
                        </button>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => updateTaskStatus(task._id, 'completed')}
                          title="Mark Complete"
                        >
                          <i className="bi bi-check"></i> Complete
                        </button>
                      </>
                    )}
                    {task.status === 'completed' && (
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => updateTaskStatus(task._id, 'in-progress')}
                        title="Reopen"
                      >
                        <i className="bi bi-arrow-counterclockwise"></i> Reopen
                      </button>
                    )}
                    <Link to={`/employee/tasks/${task._id}`} className="btn btn-sm btn-outline-primary">
                      <i className="bi bi-eye"></i> Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeTasks;
