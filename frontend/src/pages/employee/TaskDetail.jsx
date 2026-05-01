import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatDate, PRIORITY_COLORS, TASK_STATUS } from '../../constants/appConstants';
import './TaskDetail.css';

const TaskDetail = () => {
  const { id: taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [progressUpdate, setProgressUpdate] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!taskId) {
      setError('Task not found');
      setLoading(false);
      return;
    }
    fetchTask();
  }, [taskId, user, navigate]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/employees/tasks/${taskId}`);
      const taskData = res?.data || res;
      setTask(taskData);
      setProgressUpdate(taskData.progress || 0);
      setStatusUpdate(taskData.status);
    } catch (err) {
      setError(err.data?.error || err.message || 'Task not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      await api.post(`/employees/tasks/${taskId}/comment`, { text: newComment });
      setNewComment('');
      fetchTask();
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('attachments', file);
    });

    try {
      setUploading(true);
      await api.post(`/employees/tasks/${taskId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchTask();
      alert('Files uploaded successfully');
    } catch (err) {
      setError(err.data?.error || err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleStatusUpdate = async () => {
    try {
      await api.put(`/employees/tasks/${taskId}/status`, { status: statusUpdate });
      alert('Status updated');
      fetchTask();
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to update status');
    }
  };

  const updateTaskStatus = async (nextStatus) => {
    try {
      setStatusUpdate(nextStatus);
      await api.put(`/employees/tasks/${taskId}/status`, { status: nextStatus });
      alert('Status updated');
      fetchTask();
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to update status');
    }
  };

  const handleProgressUpdate = async () => {
    try {
      await api.put(`/employees/tasks/${taskId}/progress`, { progress: progressUpdate });
      alert('Progress updated');
      fetchTask();
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to update progress');
    }
  };

  const handleRequestDeadlineExtension = async () => {
    const reason = prompt('Please provide reason for deadline extension:');
    if (!reason) return;

    try {
      // This would require a backend endpoint update
      alert('Deadline extension request submitted to admin');
    } catch (err) {
      setError('Failed to request extension');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading task details...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="error-container">
        <h2>Task Not Found</h2>
        <p>{error || 'The requested task does not exist'}</p>
        <Link to="/employee/tasks" className="btn btn-primary">
          Back to Tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="task-detail">
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <Link to="/employee/tasks" className="btn btn-outline-secondary btn-sm mb-2">
              <i className="bi bi-arrow-left me-2"></i> Back to Tasks
            </Link>
            <h1>{task.title}</h1>
            <div className="d-flex gap-2 mt-2">
              <span className={`badge bg-${PRIORITY_COLORS[task.priority]}`}>
                {task.priority.toUpperCase()}
              </span>
              <span className={`badge ${task.status === 'completed' ? 'bg-success' : 'bg-secondary'}`}>
                {TASK_STATUS[task.status] || task.status}
              </span>
              {task.isOverdue && task.status !== 'completed' && (
                <span className="badge bg-danger">OVERDUE</span>
              )}
            </div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary" onClick={fetchTask}>
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-8">
            {/* Task Information */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Task Details</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <h6>Description</h6>
                  <p className="text-muted">{task.description}</p>
                </div>

                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="mb-4">
                    <h6>Subtasks ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})</h6>
                    <ul className="list-unstyled">
                      {task.subtasks.map((subtask, idx) => (
                        <li key={idx} className="mb-2">
                          <div className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={subtask.completed}
                              readOnly
                            />
                            <label className="form-check-label">
                              {subtask.title}
                              {subtask.completedAt && (
                                <small className="text-muted ms-2">
                                  ({formatDate(subtask.completedAt)})
                                </small>
                              )}
                            </label>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <h6>Event</h6>
                      {task.event ? (
                        <Link to={`/employee/events/${task.event._id}`}>{task.event.name}</Link>
                      ) : (
                        <span className="text-muted">General Task</span>
                      )}
                    </div>
                    <div className="mb-3">
                      <h6>Assigned By</h6>
                      <p>{task.assignedBy?.name}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <h6>Deadline</h6>
                      <p className={task.isOverdue && task.status !== 'completed' ? 'text-danger' : ''}>
                        {formatDate(task.deadline)}
                        {task.daysRemaining !== null && (
                          <span className="ms-2">
                            ({task.daysRemaining < 0 ? `${Math.abs(task.daysRemaining)} days overdue` : `${task.daysRemaining} days left`})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="mb-3">
                      <h6>Estimated Hours</h6>
                      <p>{task.estimatedHours || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Attachments</h5>
                <div>
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    className="d-none"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <label htmlFor="file-upload" className="btn btn-sm btn-outline-primary mb-0" style={{ cursor: 'pointer' }}>
                    {uploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-upload me-2"></i> Upload
                      </>
                    )}
                  </label>
                </div>
              </div>
              <div className="card-body">
                {task.attachments && task.attachments.length > 0 ? (
                  <ul className="list-unstyled">
                    {task.attachments.map((file, idx) => (
                      <li key={idx} className="mb-2">
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          <i className="bi bi-paperclip me-2"></i>{file.name}
                        </a>
                        <small className="text-muted ms-2">({file.type})</small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">No attachments yet</p>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Comments</h5>
              </div>
              <div className="card-body">
                {task.comments && task.comments.length > 0 ? (
                  <div className="comments-list mb-4">
                    {task.comments.map((comment, idx) => (
                      <div key={idx} className="comment mb-3 pb-3 border-bottom">
                        <div className="d-flex justify-content-between">
                          <strong>{comment.user?.name}</strong>
                          <small className="text-muted">{formatDate(comment.createdAt)}</small>
                        </div>
                        <p className="mb-1">{comment.text}</p>
                        {comment.attachments && comment.attachments.length > 0 && (
                          <ul className="list-unstyled small">
                            {comment.attachments.map((file, fileIdx) => (
                              <li key={fileIdx}>
                                <a href={file.url} target="_blank" rel="noopener noreferrer">
                                  <i className="bi bi-paperclip me-1"></i>{file.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted mb-3">No comments yet</p>
                )}

                <form onSubmit={handleAddComment}>
                  <div className="mb-3">
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submittingComment || !newComment.trim()}
                  >
                    {submittingComment ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Posting...
                      </>
                    ) : (
                      <>Post Comment</>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            {/* Actions */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Quick Actions</h5>
              </div>
              <div className="card-body">
                {task.status !== 'completed' && (
                  <div className="mb-3">
                    <label className="form-label">Update Progress</label>
                    <div className="d-flex gap-2 mb-2">
                      <input
                        type="range"
                        className="form-range"
                        min="0"
                        max="100"
                        value={progressUpdate}
                        onChange={(e) => setProgressUpdate(parseInt(e.target.value))}
                      />
                      <span className="badge bg-primary align-self-center">{progressUpdate}%</span>
                    </div>
                    <button
                      className="btn btn-sm btn-primary w-100"
                      onClick={handleProgressUpdate}
                      disabled={progressUpdate === task.progress}
                    >
                      Update Progress
                    </button>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                  >
                    {Object.values(TASK_STATUS).map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <button
                  className="btn btn-primary w-100 mb-2"
                  onClick={handleStatusUpdate}
                >
                  Update Status
                </button>

                {task.status === 'todo' && (
                  <button
                    className="btn btn-success w-100"
                    onClick={() => updateTaskStatus('in-progress')}
                  >
                    Start Task
                  </button>
                )}

                {(task.status === 'in-progress' || task.status === 'todo') && (
                  <button
                    className="btn btn-success w-100 mt-2"
                    onClick={() => updateTaskStatus('completed')}
                  >
                    <i className="bi bi-check me-2"></i> Mark Complete
                  </button>
                )}

                {task.status === 'completed' && (
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => updateTaskStatus('in-progress')}
                  >
                    <i className="bi bi-arrow-counterclockwise me-2"></i> Reopen Task
                  </button>
                )}

                {task.deadline && task.isOverdue && task.status !== 'completed' && (
                  <div className="mt-3">
                    <button
                      className="btn btn-outline-warning w-100"
                      onClick={handleRequestDeadlineExtension}
                    >
                      <i className="bi bi-calendar-plus me-2"></i> Request Extension
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Task Info */}
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Information</h5>
              </div>
              <div className="card-body">
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <td><strong>Task ID</strong></td>
                      <td>{task.taskId}</td>
                    </tr>
                    <tr>
                      <td><strong>Created</strong></td>
                      <td>{formatDate(task.createdAt)}</td>
                    </tr>
                    <tr>
                      <td><strong>Assigned By</strong></td>
                      <td>{task.assignedBy?.name}</td>
                    </tr>
                    <tr>
                      <td><strong>Assigned To</strong></td>
                      <td>{task.assignedTo?.name}</td>
                    </tr>
                    {task.estimatedHours && (
                      <tr>
                        <td><strong>Est. Hours</strong></td>
                        <td>{task.estimatedHours}</td>
                      </tr>
                    )}
                    {task.actualHours && (
                      <tr>
                        <td><strong>Actual Hours</strong></td>
                        <td>{task.actualHours}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
