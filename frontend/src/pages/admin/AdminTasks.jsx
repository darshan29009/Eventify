import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatDate, PRIORITY_COLORS, TASK_STATUS } from '../../constants/appConstants';
import { Form } from 'react-bootstrap';
import './AdminTasks.css';

const AdminTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'planning',
    priority: 'medium',
    event: '',
    assignedTo: '',
    deadline: '',
    estimatedHours: '',
    progress: 0,
    subtasks: []
  });
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, []);

  const fetchTasks = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await api.get('/admin/tasks');
      // Handle both response formats
      setTasks(res.data?.data?.tasks || res.data?.tasks || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/admin/employees');
      setEmployees(res.data?.data?.employees || res.data?.employees || []);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await api.put(`/admin/tasks/${editingTask._id}`, formData);
      } else {
        await api.post('/admin/tasks', formData);
      }
      setShowModal(false);
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        type: 'planning',
        priority: 'medium',
        event: '',
        assignedTo: '',
        deadline: '',
        estimatedHours: '',
        progress: 0,
        subtasks: []
      });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save task');
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/admin/tasks/${taskId}`);
      fetchTasks();
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      const updateData = { status };
      if (status === 'completed') {
        updateData.progress = 100;
      }
      await api.put(`/admin/tasks/${taskId}`, updateData);
      fetchTasks();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const filteredTasks = tasks.filter(task => filterStatus === 'all' || task.status === filterStatus);

  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    'in-progress': filteredTasks.filter(t => t.status === 'in-progress'),
    review: filteredTasks.filter(t => t.status === 'review'),
    completed: filteredTasks.filter(t => t.status === 'completed')
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="admin-tasks">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Task Management</h1>
          <p className="text-muted">Create, assign, and track tasks</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-lg me-2"></i> Create Task
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Stats */}
      <div className="row mb-4">
        {Object.entries(TASK_STATUS).map(([key, value]) => (
          <div key={key} className="col-md-3">
            <div className="card stats-card" onClick={() => setFilterStatus(value)} style={{ cursor: 'pointer' }}>
              <div className="card-body text-center">
                <h3>{tasks.filter(t => t.status === value).length}</h3>
                <small>{value}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {['todo', 'in-progress', 'review', 'completed'].map(status => (
          <div key={status} className="kanban-column">
            <div className="column-header">
              <h6>{TASK_STATUS[status] || status}</h6>
              <span className="badge bg-secondary">{tasksByStatus[status]?.length || 0}</span>
            </div>
            <div className="column-content">
              {tasksByStatus[status]?.map(task => (
                <div
                  key={task._id}
                  className="task-card"
                  style={{ borderLeft: `4px solid var(--priority-${task.priority})` }}
                >
                  <div className="task-card-header">
                    <h6>{task.title}</h6>
                    <span className={`badge bg-${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="task-description">{task.description?.substring(0, 100)}...</p>
                  {task.assignedTo && (
                    <div className="task-assignee">
                      <img
                        src={task.assignedTo.user?.profile?.profilePicture || '/assets/images/default-avatar.svg'}
                        alt=""
                        className="assignee-avatar"
                      />
                      <small>{task.assignedTo.user?.profile?.firstName} {task.assignedTo.user?.profile?.lastName}</small>
                    </div>
                  )}
                  {task.deadline && (
                    <small className={`task-deadline ${task.isOverdue && task.status !== 'completed' ? 'text-danger' : 'text-muted'}`}>
                      <i className="bi bi-calendar"></i> {formatDate(task.deadline)}
                    </small>
                  )}
                  <div className="task-progress">
                    <div className="progress" style={{ height: '6px' }}>
                      <div
                        className="progress-bar"
                        style={{
                          width: `${task.progress || 0}%`,
                          background: 'linear-gradient(90deg, #667eea, #764ba2)'
                        }}
                      ></div>
                    </div>
                    <small>{task.progress || 0}%</small>
                  </div>
                  <div className="task-actions">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        setEditingTask(task);
                        setFormData({
                          title: task.title,
                          description: task.description,
                          type: task.type,
                          priority: task.priority,
                          event: task.event?._id || '',
                          assignedTo: task.assignedTo?._id || '',
                          deadline: task.deadline?.split('T')[0] || '',
                          estimatedHours: task.estimatedHours || '',
                          progress: task.progress || 0
                        });
                        setShowModal(true);
                      }}
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => updateTaskStatus(task._id, task.status === 'todo' ? 'in-progress' : task.status === 'in-progress' ? 'review' : 'completed')}
                      title="Move to next stage"
                    >
                      <i className="bi bi-arrow-right"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => deleteTask(task._id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
              {tasksByStatus[status]?.length === 0 && (
                <div className="empty-column">
                  <p className="text-muted small">No tasks</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingTask(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">{editingTask ? 'Edit Task' : 'Create New Task'}</h5>
              <button className="btn-close" onClick={() => { setShowModal(false); setEditingTask(null); }}></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="task-title" className="form-label">Task Title *</label>
                  <input
                    id="task-title"
                    name="title"
                    type="text"
                    className="form-control"
                    autoComplete="off"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="task-description" className="form-label">Description</label>
                  <textarea
                    id="task-description"
                    name="description"
                    className="form-control"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  ></textarea>
                </div>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label htmlFor="task-type" className="form-label">Type</label>
                    <select
                      id="task-type"
                      name="type"
                      className="form-select"
                      autoComplete="off"
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="planning">Planning</option>
                      <option value="setup">Setup</option>
                      <option value="coordination">Coordination</option>
                      <option value="deliverable">Deliverable</option>
                    </select>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label htmlFor="task-priority-modal" className="form-label">Priority</label>
                    <select
                      id="task-priority-modal"
                      name="priority"
                      className="form-select"
                      autoComplete="off"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label htmlFor="task-deadline" className="form-label">Deadline</label>
                    <input
                      id="task-deadline"
                      name="deadline"
                      type="date"
                      className="form-control"
                      autoComplete="off"
                      value={formData.deadline}
                      onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label htmlFor="task-assignedTo" className="form-label">Assign To (Employee)</label>
                    <select
                      id="task-assignedTo"
                      name="assignedTo"
                      className="form-select"
                      autoComplete="off"
                      value={formData.assignedTo}
                      onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>
                          {emp.user?.profile?.firstName} {emp.user?.profile?.lastName} ({emp.designation})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label htmlFor="task-hours" className="form-label">Estimated Hours</label>
                    <input
                      id="task-hours"
                      name="estimatedHours"
                      type="number"
                      className="form-control"
                      autoComplete="off"
                      min="1"
                      value={formData.estimatedHours}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) || '' }))}
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label htmlFor="task-progress" className="form-label">Progress (%)</label>
                    <input
                      id="task-progress"
                      name="progress"
                      type="number"
                      className="form-control"
                      autoComplete="off"
                      min="0"
                      max="100"
                      value={formData.progress || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                    />
                    <small className="text-muted">0-100</small>
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="task-event" className="form-label">Related Event (Optional)</label>
                  <select
                    id="task-event"
                    name="event"
                    className="form-select"
                    autoComplete="off"
                    value={formData.event}
                    onChange={(e) => setFormData(prev => ({ ...prev, event: e.target.value }))}
                  >
                    <option value="">Select Event</option>
                    {/* Events would be loaded here */}
                  </select>
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => { setShowModal(false); setEditingTask(null); }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingTask ? 'Update Task' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTasks;
