import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { formatDate } from '../../constants/appConstants';
import './EmployeeSchedule.css';

const EmployeeSchedule = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // list or calendar

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees/schedule');
      const scheduleData = res.data.data || res.data;
      setSchedule(Array.isArray(scheduleData) ? scheduleData : []);
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const groupScheduleByDate = (scheduleData) => {
    const grouped = {};
    const items = Array.isArray(scheduleData) ? scheduleData : [];
    items.forEach(item => {
      const date = new Date(item.date).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    return grouped;
  };

  const grouped = groupScheduleByDate(schedule);
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading schedule...</p>
      </div>
    );
  }

  return (
    <div className="employee-schedule">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>My Schedule</h1>
          <p className="text-muted">Your upcoming events and tasks</p>
        </div>
        <div className="d-flex gap-2">
          <button
            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setViewMode('list')}
          >
            <i className="bi bi-list"></i> List
          </button>
          <button
            className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setViewMode('calendar')}
          >
            <i className="bi bi-calendar"></i> Calendar
          </button>
          <button className="btn btn-primary" onClick={fetchSchedule}>
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {schedule.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-calendar-week display-4 text-muted"></i>
            <p className="mt-2">No upcoming events</p>
            <p className="text-muted small">Your schedule will appear here when events are assigned</p>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="schedule-list">
          {sortedDates.map(date => (
            <div key={date} className="schedule-day mb-4">
              <h5 className="date-header">
                <i className="bi bi-calendar-day me-2"></i>
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h5>
              <div className="card">
                <div className="card-body p-0">
                  {grouped[date].map((item, idx) => (
                    <div
                      key={item._id || idx}
                      className={`schedule-item p-3 ${idx < grouped[date].length - 1 ? 'border-bottom' : ''}`}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">
                            {item.type === 'event' ? (
                              <Link to={`/employee/events/${item._id}`}>{item.name}</Link>
                            ) : (
                              <>Task: {item.name}</>
                            )}
                          </h6>
                          <small className="text-muted">{item.description}</small>
                        </div>
                        <div className="text-end">
                          <span className={`badge ${item.type === 'event' ? 'bg-primary' : 'bg-secondary'}`}>
                            {item.type}
                          </span>
                          {item.startTime && item.endTime && (
                            <small className="d-block text-muted mt-1">
                              {item.startTime} - {item.endTime}
                            </small>
                          )}
                          {item.location && (
                            <small className="d-block text-muted">
                              <i className="bi bi-geo-alt"></i> {item.location}
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card calendar-view">
          <div className="card-body">
            <div className="calendar-month">
              <h5>
                {new Date().toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </h5>
            </div>
            <div className="calendar-grid">
              {Array.from({ length: 30 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const dateStr = date.toDateString();
                const daySchedule = grouped[dateStr] || [];

                return (
                  <div key={i} className="calendar-day">
                    <div className="day-header">
                      <strong>{date.toLocaleDateString('en-US', { weekday: 'short' })}</strong>
                      <span>{date.getDate()}</span>
                    </div>
                    <div className="day-events">
                      {daySchedule.slice(0, 2).map((event, idx) => (
                        <div
                          key={idx}
                          className={`calendar-event ${event.type === 'event' ? 'bg-primary' : 'bg-secondary'}`}
                          style={{ fontSize: '0.75rem', marginBottom: '2px' }}
                        >
                          {event.name.substring(0, 15)}
                          {event.name.length > 15 && '...'}
                        </div>
                      ))}
                      {daySchedule.length > 2 && (
                        <div className="calendar-event text-muted small">
                          +{daySchedule.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeSchedule;
