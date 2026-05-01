const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Task = require('../models/Task');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const Review = require('../models/Review');
const { protect, employeeOnly } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const logger = require('../utils/logger');

// All employee routes
router.use(protect, employeeOnly);

const syncBookingProgressFromTasks = async (bookingId) => {
  if (!bookingId) {
    return;
  }

  const tasks = await Task.find({ 'event.bookingId': bookingId }).select('progress status');
  if (!tasks.length) {
    return;
  }

  const totalProgress = tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
  const percentage = Math.round(totalProgress / tasks.length);
  const allTasksCompleted = tasks.every(task => task.status === 'completed');
  const nextStatus = allTasksCompleted ? 'completed' : (percentage > 0 ? 'in-progress' : null);

  const booking = await Booking.findById(bookingId).select('status progress timeline');
  if (!booking) {
    return;
  }

  booking.progress = {
    ...(booking.progress || {}),
    percentage,
    lastUpdated: new Date()
  };

  if (nextStatus && booking.status !== nextStatus) {
    booking.status = nextStatus;
    booking.timeline.push({
      status: nextStatus,
      changedAt: new Date(),
      notes: nextStatus === 'completed'
        ? 'All assigned tasks have been completed.'
        : 'Work on this booking has started.'
    });
  }

  await booking.save();
};

const deriveBookingStatusFromTasks = (booking, tasks = []) => {
  const allTasksCompleted = tasks.length > 0 && tasks.every(task => task.status === 'completed');
  if (allTasksCompleted) {
    return 'completed';
  }

  const hasStartedTask = tasks.some(task =>
    ['in-progress', 'review', 'completed', 'blocked'].includes(task.status) || Number(task.progress || 0) > 0
  );

  if (hasStartedTask && ['pending', 'confirmed', 'planning'].includes(booking?.status)) {
    return 'in-progress';
  }

  return booking?.status;
};

// @route   GET /api/employees/dashboard
// @desc    Get employee dashboard
// @access  Employee
router.get('/dashboard', async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id })
      .populate('user', 'profile.firstName profile.lastName email');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    // Today's tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasks = await Task.find({
      assignedTo: employee._id,
      deadline: { $gte: today, $lt: tomorrow },
      status: { $in: ['todo', 'in-progress'] }
    })
    .populate('event.eventId', 'name type')
    .select('taskId title deadline priority');

    // Flatten task.event
    todayTasks.forEach(t => {
      if (t.event && t.event.eventId) {
        t.event = { ...t.event, ...t.event.eventId };
      }
    });

    // Overdue tasks
    const overdueTasks = await Task.find({
      assignedTo: employee._id,
      deadline: { $lt: new Date() },
      status: { $in: ['todo', 'in-progress', 'blocked'] }
    })
    .populate('event.eventId', 'name type')
    .select('taskId title deadline priority');

    // Flatten task.event
    overdueTasks.forEach(t => {
      if (t.event && t.event.eventId) {
        t.event = { ...t.event, ...t.event.eventId };
      }
    });

    // Active tasks count
    const activeTasksCount = await Task.countDocuments({
      assignedTo: employee._id,
      status: { $in: ['todo', 'in-progress', 'review'] }
    });

    // Completed this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const completedThisWeek = await Task.countDocuments({
      assignedTo: employee._id,
      status: 'completed',
      completedAt: { $gte: weekAgo }
    });

    // Assigned events
    const assignedEvents = await Booking.find({
      'assignedTeam.employee': employee._id,
      status: { $in: ['confirmed', 'planning', 'in-progress'] }
    })
    .populate('event.eventId', 'name type images')
    .select('bookingId event eventDetails status');

    // Flatten event.eventId into event for frontend compatibility
    assignedEvents.forEach(b => {
      if (b.event && b.event.eventId) {
        b.event = { ...b.event, ...b.event.eventId };
      }
    });

    const assignedEventIds = assignedEvents.map(booking => booking._id);
    const assignedEventTasks = await Task.find({
      'event.bookingId': { $in: assignedEventIds },
      assignedTo: employee._id
    }).select('event.bookingId status progress');

    const tasksByAssignedEventId = assignedEventTasks.reduce((acc, task) => {
      const bookingId = task.event?.bookingId?.toString();
      if (!bookingId) {
        return acc;
      }

      if (!acc[bookingId]) {
        acc[bookingId] = [];
      }
      acc[bookingId].push(task);
      return acc;
    }, {});

    const normalizedAssignedEvents = assignedEvents.map(booking => {
      const bookingData = booking.toObject ? booking.toObject() : booking;
      const tasks = tasksByAssignedEventId[booking._id.toString()] || [];
      const status = deriveBookingStatusFromTasks(bookingData, tasks);
      const progress = tasks.length > 0 && tasks.every(task => task.status === 'completed')
        ? 100
        : (bookingData.progress?.percentage || 0);

      return {
        ...bookingData,
        status,
        progress: {
          ...(bookingData.progress || {}),
          percentage: progress
        }
      };
    });

    // Performance stats
    const totalTasks = await Task.countDocuments({ assignedTo: employee._id });
    const completedTasks = await Task.countDocuments({
      assignedTo: employee._id,
      status: 'completed'
    });

    // On-time tasks: completedAt <= deadline
    const onTimeTasks = await Task.countDocuments({
      assignedTo: employee._id,
      status: 'completed',
      $expr: { $lte: ['$completedAt', '$deadline'] }
    });

    const performance = {
      totalTasks,
      completedTasks,
      onTimeTasks
    };

    // Upcoming deadlines (next 3 days)
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const upcomingDeadlines = await Task.find({
      assignedTo: employee._id,
      status: { $in: ['todo', 'in-progress'] },
      deadline: { $lte: threeDaysLater }
    })
    .sort({ deadline: 1 })
    .limit(5)
    .select('taskId title deadline priority status')
    .populate('event.eventId', 'name');

    // Flatten task.event
    upcomingDeadlines.forEach(t => {
      if (t.event && t.event.eventId) {
        t.event = { ...t.event, ...t.event.eventId };
      }
    });

    res.json({
      success: true,
      data: {
        employee,
        todayTasks,
        overdueTasks,
        activeTasksCount,
        completedThisWeek,
        assignedEvents: normalizedAssignedEvents,
        performance,
        upcomingDeadlines
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/employees/profile
// @desc    Get employee profile
// @access  Employee
router.get('/profile', async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id })
      .populate('user', 'email profile lastLogin');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/employees/profile
// @desc    Update employee profile
// @access  Employee
router.put('/profile', async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    const user = await User.findById(req.user._id);

    if (!employee || !user) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    const { profile, emergencyContact, shiftPreference, skills, specializations } = req.body;

    if (profile) {
      user.profile.firstName = profile.firstName ?? user.profile.firstName;
      user.profile.lastName = profile.lastName ?? user.profile.lastName;
      user.profile.phone = profile.phone ?? user.profile.phone;
      user.profile.dateOfBirth = profile.dateOfBirth || user.profile.dateOfBirth;
      user.profile.gender = profile.gender ?? user.profile.gender;
      user.profile.bio = profile.bio ?? user.profile.bio;
    }

    if (Array.isArray(skills)) {
      employee.skills = skills;
    }

    if (Array.isArray(specializations)) {
      employee.specializations = specializations;
    }

    if (emergencyContact) {
      employee.emergencyContact = {
        ...employee.emergencyContact?.toObject?.(),
        ...emergencyContact
      };
    }

    if (shiftPreference) {
      employee.shiftPreference = shiftPreference;
    }

    await user.save();
    await employee.save();

    res.json({
      success: true,
      data: await Employee.findById(employee._id).populate('user', 'email profile lastLogin'),
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/employees/availability
// @desc    Update availability status
// @access  Employee
router.put('/availability', [
  body('isAvailable').isBoolean(),
  body('unavailabilityDates').optional().isArray()
], async (req, res, next) => {
  try {
    const { isAvailable, unavailabilityDates } = req.body;

    const employee = await Employee.findOneAndUpdate(
      { user: req.user._id },
      {
        'availability.isAvailable': isAvailable,
        ...(unavailabilityDates && { 'availability.unavailabilityDates': unavailabilityDates })
      },
      { new: true }
    );

    res.json({
      success: true,
      data: employee,
      message: 'Availability updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/employees/tasks
// @desc    Get employee's tasks
// @access  Employee
router.get('/tasks', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      eventId,
      upcoming = false
    } = req.query;

    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    const query = { assignedTo: employee._id };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (eventId) query.event = eventId;
    if (upcoming === 'true') {
      query.deadline = { $gte: new Date() };
    }

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('event.eventId', 'name type')
      .populate('assignedBy', 'profile.firstName profile.lastName')
      .sort({
        priority: -1, // urgent first
        deadline: 1,
        createdAt: -1
      })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-__v');

    // Flatten task.event
    tasks.forEach(t => {
      if (t.event && t.event.eventId) {
        t.event = { ...t.event, ...t.event.eventId };
      }
    });

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/employees/tasks/:id
// @desc    Get task details
// @access  Employee
router.get('/tasks/:id', async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      assignedTo: employee._id
    })
    .populate('event.eventId', 'name type description')
    .populate('assignedBy', 'profile.firstName profile.lastName email')
    .populate('comments.user', 'profile.firstName profile.lastName profile.profilePicture');

    // Flatten task.event
    if (task && task.event && task.event.eventId) {
      task.event = { ...task.event, ...task.event.eventId };
    }

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/employees/tasks/:id/status
// @desc    Update task status
// @access  Employee
router.put('/tasks/:id/status', [
  body('status').isIn(['todo', 'in-progress', 'review', 'blocked', 'completed'])
], async (req, res, next) => {
  try {
    const { status, progress, comment, blockReason } = req.body;
    const employee = await Employee.findOne({ user: req.user._id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      assignedTo: employee._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Update status
    if (status) task.status = status;
    if (progress !== undefined) task.progress = progress;

    // Handle blocked status
    if (status === 'blocked' && blockReason) {
      task.blockReason = blockReason;
      task.blockedBy = req.user._id;
      task.blockedAt = new Date();
    }

    // Handle completion
    if (status === 'completed' && !task.completedAt) {
      task.completedAt = new Date();
      task.completedBy = req.user._id;
      task.progress = 100;

      // Update employee performance
      employee.performance.tasksCompleted += 1;
      await employee.save();
    }

    // Add comment if provided
    if (comment) {
      task.comments.push({
        user: req.user._id,
        text: comment,
        createdAt: new Date()
      });
    }

    await task.save();
    await task.populate('event.eventId');
    await syncBookingProgressFromTasks(task.event?.bookingId);

    // Flatten task.event
    if (task.event && task.event.eventId) {
      task.event = { ...task.event, ...task.event.eventId };
    }

    res.json({
      success: true,
      data: task,
      message: 'Task status updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/employees/tasks/:id/progress
// @desc    Update task progress
// @access  Employee
router.put('/tasks/:id/progress', [
  body('progress').isInt({ min: 0, max: 100 })
], async (req, res, next) => {
  try {
    const { progress, comment } = req.body;
    const employee = await Employee.findOne({ user: req.user._id });

    const task = await Task.findOne({
      _id: req.params.id,
      assignedTo: employee._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.progress = progress;
    if (progress === 100 && task.status !== 'completed') {
      task.status = 'completed';
      task.completedAt = new Date();
      task.completedBy = req.user._id;
    }

    if (comment) {
      task.comments.push({
        user: req.user._id,
        text: comment,
        createdAt: new Date()
      });
    }

    await task.save();
    await syncBookingProgressFromTasks(task.event?.bookingId);

    res.json({
      success: true,
      data: task,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/employees/tasks/:id/comment
// @desc    Add comment to task
// @access  Employee
router.post('/tasks/:id/comment', [
  body('text').trim().notEmpty()
], async (req, res, next) => {
  try {
    const { text } = req.body;
    const employee = await Employee.findOne({ user: req.user._id });

    const task = await Task.findOne({
      _id: req.params.id,
      assignedTo: employee._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.comments.push({
      user: req.user._id,
      text,
      createdAt: new Date()
    });

    await task.save();
    await task.populate('comments.user', 'profile.firstName');

    res.json({
      success: true,
      data: task,
      message: 'Comment added successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/employees/tasks/:id/upload
// @desc    Upload attachment to task
// @access  Employee
router.post('/tasks/:id/upload', async (req, res, next) => {
  try {
    // This would use multer file upload middleware
    // For now, return method not implemented
    res.status(501).json({
      success: false,
      message: 'File upload endpoint needs to be configured with multer'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/employees/events
// @desc    Get assigned events
// @access  Employee
router.get('/events', async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const bookings = await Booking.find({
      'assignedTeam.employee': employee._id,
      status: { $in: ['confirmed', 'planning', 'in-progress'] }
    })
    .populate('event.eventId', 'name type images description venues')
    .select('bookingId event customer eventDetails status progress')
    .sort({ 'eventDetails.date': 1 });

    // Flatten event.eventId into event for frontend compatibility
    bookings.forEach(b => {
      if (b.event && b.event.eventId) {
        b.event = { ...b.event, ...b.event.eventId };
      }
    });

    const bookingIds = bookings.map(booking => booking._id);
    const relatedTasks = await Task.find({
      'event.bookingId': { $in: bookingIds },
      assignedTo: employee._id
    }).select('event.bookingId status progress');

    const tasksByBookingId = relatedTasks.reduce((acc, task) => {
      const bookingId = task.event?.bookingId?.toString();
      if (!bookingId) {
        return acc;
      }

      if (!acc[bookingId]) {
        acc[bookingId] = [];
      }
      acc[bookingId].push(task);
      return acc;
    }, {});

    const normalizedBookings = bookings.map(booking => {
      const bookingData = booking.toObject ? booking.toObject() : booking;
      const tasks = tasksByBookingId[booking._id.toString()] || [];
      const status = deriveBookingStatusFromTasks(bookingData, tasks);
      const progress = tasks.length > 0 && tasks.every(task => task.status === 'completed')
        ? 100
        : (bookingData.progress?.percentage || 0);

      return {
        ...bookingData,
        status,
        progress: {
          ...(bookingData.progress || {}),
          percentage: progress
        }
      };
    });

    res.json({ success: true, data: normalizedBookings });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/employees/events/:id
// @desc    Get event details for employee
// @access  Employee
router.get('/events/:id', async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });

    const booking = await Booking.findOne({
      _id: req.params.id,
      'assignedTeam.employee': employee._id
    })
    .populate('event.eventId', 'name type description images packages venues')
    .populate('customer', 'profile.firstName profile.lastName email phone')
    .populate('assignedTeam.employee', 'employeeId profile.firstName profile.lastName designation');

    // Flatten event.eventId into event for frontend compatibility
    if (booking && booking.event && booking.event.eventId) {
      booking.event = { ...booking.event, ...booking.event.eventId };
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or you are not assigned'
      });
    }

    // Get all tasks for this event
    const tasks = await Task.find({
      'event.bookingId': booking._id,
      assignedTo: employee._id
    }).select('taskId title status priority deadline progress');

    const normalizedBooking = {
      ...(booking.toObject ? booking.toObject() : booking),
      status: deriveBookingStatusFromTasks(booking, tasks),
      progress: {
        ...(booking.progress || {}),
        percentage: tasks.length > 0 && tasks.every(task => task.status === 'completed')
          ? 100
          : (booking.progress?.percentage || 0)
      }
    };

    res.json({
      success: true,
      data: {
        booking: normalizedBooking,
        tasks,
        team: booking.assignedTeam
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/employees/schedule
// @desc    Get employee schedule/calendar
// @access  Employee
router.get('/schedule', async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all tasks in date range
    const tasks = await Task.find({
      assignedTo: employee._id,
      deadline: { $gte: startOfMonth, $lte: endOfMonth }
    })
    .populate('event.eventId', 'name')
    .select('taskId title deadline status priority event');

    // Flatten task.event
    tasks.forEach(t => {
      if (t.event && t.event.eventId) {
        t.event = { ...t.event, ...t.event.eventId };
      }
    });

    // Get booked events
    const events = await Booking.find({
      'assignedTeam.employee': employee._id,
      'eventDetails.date': { $gte: startOfMonth, $lte: endOfMonth },
      status: { $in: ['confirmed', 'planning', 'in-progress'] }
    })
    .select('bookingId eventDetails.date event.name status');

    res.json({
      success: true,
      data: {
        tasks: tasks.map(t => ({
          id: t._id,
          title: t.title,
          type: 'task',
          date: t.deadline,
          status: t.status,
          priority: t.priority,
          event: t.event ? t.event.name : null
        })),
        events: events.map(e => ({
          id: e._id,
          title: e.event.name,
          type: 'booking',
          date: e.eventDetails.date,
          status: e.status
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/employees/performance
// @desc    Get employee performance metrics
// @access  Employee
router.get('/performance', async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id })
      .populate('user', 'profile.firstName profile.lastName');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);

    // Task statistics
    const taskStats = await Task.aggregate([
      {
        $match: {
          assignedTo: employee._id
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgProgress: { $avg: '$progress' }
        }
      }
    ]);

    // Tasks completed this month
    const monthlyStats = await Task.aggregate([
      {
        $match: {
          assignedTo: employee._id,
          completedAt: { $gte: lastMonth }
        }
      },
      {
        $group: {
          _id: null,
          completedCount: { $sum: 1 },
          avgCompletionTime: {
            $avg: {
              $subtract: ['$completedAt', '$createdAt']
            }
          }
        }
      }
    ]);

    // On-time vs late completions
    const onTimeStats = await Task.aggregate([
      {
        $match: {
          assignedTo: employee._id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $gte: ['$completedAt', '$deadline'] },
              'late',
              'on-time'
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Reviews/ratings received
    const reviewsCount = await Review.countDocuments({
      'customer.userId': { $exists: true } // For now, placeholder
    });

    res.json({
      success: true,
      data: {
        employee,
        taskStats,
        monthlyStats: monthlyStats.length > 0 ? monthlyStats[0] : { completedCount: 0, avgCompletionTime: 0 },
        onTimeStats,
        reviewsCount
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
