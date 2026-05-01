const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Employee = require('../models/Employee');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Task = require('../models/Task');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// All admin routes require authentication and admin role
router.use(protect, adminOnly);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Admin
router.get('/dashboard', async (req, res, next) => {
  try {
    // Debug: Log raw counts
    console.log('[Dashboard Debug] Counting documents...');

    // Total counts (no isActive filter temporarily to see all data)
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalEmployees = await Employee.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalBookings = await Booking.countDocuments();

    console.log('[Dashboard Debug] Counts:', {
      totalCustomers,
      totalEmployees,
      totalEvents,
      totalBookings
    });

    // Today's tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasks = await Task.countDocuments({
      deadline: { $gte: today, $lt: tomorrow },
      status: { $in: ['todo', 'in-progress'] }
    });

    // Overdue tasks
    const overdueTasks = await Task.countDocuments({
      deadline: { $lt: new Date() },
      status: { $in: ['todo', 'in-progress', 'blocked'] }
    });

    // Revenue this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const revenueResult = await Payment.aggregate([
      {
        $match: {
          status: 'successful',
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    const monthlyRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Recent bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('event.eventId', 'name type')
      .select('-__v');

    // Flatten event.eventId into event for frontend compatibility
    recentBookings.forEach(b => {
      if (b.event && b.event.eventId) {
        b.event = { ...b.event, ...b.event.eventId };
      }
    });

    // Recent tasks
    const recentTasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('assignedTo', 'profile.firstName profile.lastName')
      .populate('assignedBy', 'profile.firstName profile.lastName')
      .select('-__v');

    // Event type distribution
    const eventTypes = await Booking.aggregate([
      {
        $group: {
          _id: '$eventDetails.eventType',
          count: { $sum: 1 },
          revenue: { $sum: '$pricing.totalAmount' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Task status distribution
    const taskStatus = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top performing employees
    const topEmployees = await Employee.find()
      .sort({ 'performance.tasksCompleted': -1 })
      .limit(5)
      .select('employeeId profile.firstName profile.lastName designation performance')
      .populate('user', 'email');

    // Payment method distribution
    const paymentMethods = await Payment.aggregate([
      {
        $match: { status: 'successful' }
      },
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Daily booking trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyBookings = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$pricing.totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        counts: {
          customers: totalCustomers,
          employees: totalEmployees,
          events: totalEvents,
          bookings: totalBookings
        },
        tasks: {
          today: todayTasks,
          overdue: overdueTasks
        },
        revenue: {
          monthly: monthlyRevenue
        },
        recentActivity: {
          bookings: recentBookings,
          tasks: recentTasks
        },
        analytics: {
          eventTypes,
          taskStatus,
          topEmployees,
          paymentMethods,
          dailyBookings
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/employees
// @desc    Get all employees with filters
// @access  Admin
router.get('/employees', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      department,
      designation,
      status,
      specialization,
      search
    } = req.query;

    const query = {};

    if (department) query.department = department;
    if (designation) query.designation = designation;
    if (status) query.status = status;
    if (specialization) query.specializations = { $in: [specialization] };
    if (search) {
      query.$or = [
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { 'profile.phone': { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('user', 'email')
      .sort({ createdAt: -1 })
      .select('-__v');

    const employeeIds = employees.map(employee => employee._id);
    const completedTaskCounts = await Task.aggregate([
      {
        $match: {
          assignedTo: { $in: employeeIds },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$assignedTo',
          count: { $sum: 1 }
        }
      }
    ]);

    const completedTaskMap = completedTaskCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    const normalizedEmployees = employees.map(employee => {
      const employeeData = employee.toObject ? employee.toObject() : employee;
      const tasksCompleted = completedTaskMap[employee._id.toString()] || 0;

      return {
        ...employeeData,
        performance: {
          ...(employeeData.performance || {}),
          tasksCompleted
        }
      };
    });

    res.json({
      success: true,
      data: {
        employees: normalizedEmployees,
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

// @route   POST /api/admin/employees
// @desc    Create new employee
// @access  Admin
router.post('/employees', [
  body('profile.firstName').trim().notEmpty(),
  body('profile.lastName').trim().notEmpty(),
  body('profile.phone').optional().isMobilePhone('any'),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('department').isIn(['Event Management', 'Operations', 'Finance', 'Marketing', 'Hospitality', 'Security']),
  body('designation').trim().notEmpty()
], async (req, res, next) => {
  try {
    const {
      email,
      password,
      profile,
      address,
      department,
      designation,
      specializations,
      skills,
      experience,
      salary,
      joiningDate,
      shiftPreference,
      emergencyContact
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user account
    const user = await User.create({
      email,
      password,
      role: 'employee',
      profile,
      address
    });

    // Create employee record
    const employee = await Employee.create({
      user: user._id,
      department,
      designation,
      specializations: specializations || [],
      skills: skills || [],
      experience: experience || 0,
      salary,
      joiningDate: joiningDate || new Date(),
      shiftPreference: shiftPreference || 'flexible',
      emergencyContact
    });

    res.status(201).json({
      success: true,
      data: employee,
      message: 'Employee created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/employees/:id
// @desc    Get single employee with details
// @access  Admin
router.get('/employees/:id', async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('user', 'email profile.firstName profile.lastName profile.phone isActive lastLogin')
      .populate('workHistory.event', 'name type date');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Get assigned tasks
    const assignedTasks = await Task.find({ assignedTo: employee._id })
      .populate('event.eventId', 'name type')
      .select('taskId title status priority deadline progress event')
      .sort({ createdAt: -1 })
      .limit(10);

    // Flatten task.event
    assignedTasks.forEach(t => {
      if (t.event && t.event.eventId) {
        t.event = { ...t.event, ...t.event.eventId };
      }
    });

    // Get performance stats
    const performance = await Task.aggregate([
      { $match: { assignedTo: employee._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgProgress: { $avg: '$progress' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        employee,
        stats: {
          activeTasks: assignedTasks.filter(t => !['completed', 'cancelled'].includes(t.status)).length,
          completedTasks: assignedTasks.filter(t => t.status === 'completed').length,
          assignedTasks: assignedTasks
        },
        performance
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/employees/:id
// @desc    Update employee
// @access  Admin
router.put('/employees/:id', async (req, res, next) => {
  try {
    const updates = req.body;

    // Don't allow updating certain fields
    delete updates._id;
    delete updates.__v;
    delete updates.user;

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('user', 'email profile.firstName profile.lastName');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: employee,
      message: 'Employee updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/employees/:id
// @desc    Delete employee (soft delete)
// @access  Admin
router.delete('/employees/:id', async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Soft delete - just mark as inactive
    employee.status = 'inactive';
    employee.isActive = false;
    await employee.save();

    // Also deactivate user account
    await User.findByIdAndUpdate(employee.user, { isActive: false });

    res.json({
      success: true,
      message: 'Employee deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/tasks
// @desc    Get all tasks (admin view)
// @access  Admin
router.get('/tasks', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      priority,
      assignedTo,
      eventId,
      search
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (eventId) query.event = eventId;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { taskId: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Task.countDocuments(query);
    let tasks = [];

    try {
      tasks = await Task.find(query)
        .populate('assignedTo', 'employeeId profile.firstName profile.lastName')
        .populate('assignedBy', 'profile.firstName profile.lastName')
        .populate('event.eventId', 'name type')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .select('-__v');
    } catch (populateErr) {
      console.error('[AdminTasks] Populate failed, retrying without populate:', populateErr.message);
      // Fallback: fetch without populate to avoid CastError from invalid references
      tasks = await Task.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .select('-__v');
    }

    // Flatten task.event (only if populated)
    tasks.forEach(t => {
      if (t.event && t.event.eventId && t.event.eventId._id) {
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

// @route   POST /api/admin/tasks
// @desc    Create new task
// @access  Admin
router.post('/tasks', [
  body('title').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('assignedTo').notEmpty(),
  body('deadline').isDate(),
  body('priority').isIn(['low', 'medium', 'high', 'urgent'])
], async (req, res, next) => {
  try {
    const taskData = {
      ...req.body,
      assignedBy: req.user._id
    };

    const task = await Task.create(taskData);

    // Populate details
    await task.populate([
      { path: 'assignedTo', select: 'employeeId profile.firstName profile.lastName' },
      { path: 'assignedBy', select: 'profile.firstName profile.lastName' }
    ]);

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/tasks/:id
// @desc    Update task
// @access  Admin
router.put('/tasks/:id', async (req, res, next) => {
  try {
    const updates = req.body;

    // Auto-set progress to 100 if status is completed
    if (updates.status === 'completed') {
      updates.progress = 100;
      updates.completedAt = new Date();
      updates.completedBy = req.user._id;
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('assignedTo').populate('assignedBy');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task,
      message: 'Task updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/tasks/:id
// @desc    Delete task
// @access  Admin
router.delete('/tasks/:id', async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/customers
// @desc    Get all customers
// @access  Admin
router.get('/customers', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query = { role: 'customer' };

    if (search) {
      query.$or = [
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const customers = await User.find(query)
      .select('-password -refreshTokens')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    // Get booking statistics for these customers
    const customerIds = customers.map(c => c._id);
    const bookingStats = await Booking.aggregate([
      {
        $match: {
          'customer.userId': { $in: customerIds },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: '$customer.userId',
          totalBookings: { $sum: 1 },
          totalSpent: { $sum: '$pricing.totalAmount' }
        }
      }
    ]);

    // Create a map for quick lookup
    const statsMap = {};
    bookingStats.forEach(stat => {
      statsMap[stat._id.toString()] = {
        totalBookings: stat.totalBookings,
        totalSpent: stat.totalSpent
      };
    });

    // Attach stats to each customer
    const customersWithStats = customers.map(customer => {
      const stats = statsMap[customer._id.toString()] || { totalBookings: 0, totalSpent: 0 };
      return {
        ...customer.toObject(),
        totalBookings: stats.totalBookings,
        totalSpent: stats.totalSpent
      };
    });

    res.json({
      success: true,
      data: {
        customers: customersWithStats,
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

// @route   GET /api/admin/customers/:id
// @desc    Get customer details with bookings
// @access  Admin
router.get('/customers/:id', async (req, res, next) => {
  try {
    const customer = await User.findById(req.params.id)
      .select('-password -refreshTokens');

    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const bookings = await Booking.find({ 'customer.userId': customer._id })
      .populate('event.eventId', 'name type images')
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-__v');

    // Flatten event.eventId into event for frontend compatibility
    bookings.forEach(b => {
      if (b.event && b.event.eventId) {
        b.event = { ...b.event, ...b.event.eventId };
      }
    });

    const totalSpent = await Payment.aggregate([
      {
        $match: {
          'customer.userId': customer._id,
          status: 'successful'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        customer,
        bookings,
        statistics: {
          totalBookings: bookings.length,
          totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/customers/:id/status
// @desc    Block/Unblock customer
// @access  Admin
router.put('/customers/:id/status', async (req, res, next) => {
  try {
    const { isActive } = req.body;

    const customer = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer,
      message: `Customer ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/bookings
// @desc    Get all bookings (admin view)
// @access  Admin
router.get('/bookings', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      eventType,
      city,
      dateFrom,
      dateTo,
      search
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (eventType) query['eventDetails.eventType'] = eventType;
    if (city) query['eventDetails.venue.city'] = { $regex: city, $options: 'i' };
    if (dateFrom || dateTo) {
      query['eventDetails.date'] = {};
      if (dateFrom) query['eventDetails.date'].$gte = new Date(dateFrom);
      if (dateTo) query['eventDetails.date'].$lte = new Date(dateTo);
    }

    if (search) {
      query.$or = [
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { bookingId: { $regex: search, $options: 'i' } },
        { 'event.name': { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('event.eventId', 'name type images')
      .populate('assignedTeam.employee', 'employeeId profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('bookingId customer event eventDetails pricing status payment progress createdAt');

    // Flatten event.eventId into event for frontend compatibility
    bookings.forEach(b => {
      if (b.event && b.event.eventId) {
        b.event = { ...b.event, ...b.event.eventId };
      }
    });

    const bookingIds = bookings.map(booking => booking._id);
    const relatedTasks = await Task.find({
      'event.bookingId': { $in: bookingIds }
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
      const allTasksCompleted = tasks.length > 0 && tasks.every(task => task.status === 'completed');
      const hasStartedTask = tasks.some(task =>
        ['in-progress', 'review', 'completed', 'blocked'].includes(task.status) || Number(task.progress || 0) > 0
      );

      const derivedStatus = allTasksCompleted
        ? 'completed'
        : (hasStartedTask && ['pending', 'confirmed', 'planning'].includes(bookingData.status)
          ? 'in-progress'
          : bookingData.status);

      const derivedProgress = allTasksCompleted
        ? 100
        : (bookingData.progress?.percentage || 0);

      return {
        ...bookingData,
        status: derivedStatus,
        progress: {
          ...(bookingData.progress || {}),
          percentage: derivedProgress
        }
      };
    });

    res.json({
      success: true,
      data: {
        bookings: normalizedBookings,
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

// @route   GET /api/admin/bookings/:id
// @desc    Get single booking details (admin)
// @access  Admin
router.get('/bookings/:id', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event.eventId', 'name description type images packages venues')
      .populate('assignedTeam.employee', 'employeeId profile.firstName profile.lastName designation profile.profilePicture');

    // Flatten event.eventId into event for frontend compatibility
    if (booking && booking.event && booking.event.eventId) {
      booking.event = {
        ...booking.event,
        ...booking.event.eventId,
      };
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Get payment transactions
    const payments = await Payment.find({ bookingId: booking._id })
      .sort({ createdAt: -1 });

    // Get related tasks
    const tasks = await Task.find({ 'event.bookingId': booking._id })
      .populate('assignedTo', 'employeeId profile.firstName profile.lastName')
      .select('taskId title status progress deadline createdAt');

    console.log(`Admin GET /bookings/${req.params.id} - returning booking:`, { bookingId: booking._id, hasPricing: !!booking.pricing });
    res.json({
      success: true,
      data: {
        booking,
        payments,
        tasks
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/bookings/:id/status
// @desc    Update booking status
// @access  Admin
router.put('/bookings/:id/status', [
  body('status').isIn(['pending', 'confirmed', 'planning', 'in-progress', 'completed', 'cancelled', 'no-show'])
], async (req, res, next) => {
  try {
    console.log(`Admin updating booking ${req.params.id} to status: ${req.body.status}`);
    const { status, notes } = req.body;

    const updateData = {
      status,
      ...(notes && { notes })
    };

    // If status is completed, set progress to 100%
    if (status === 'completed') {
      updateData.progress = { percentage: 100, lastUpdated: new Date() };
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking,
      message: 'Booking status updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/payments
// @desc    Get all payments
// @access  Admin
router.get('/payments', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      method,
      dateFrom,
      dateTo
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (method) query.method = method;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('bookingId', 'bookingId event.name')
      .populate('customer', 'profile.firstName profile.lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const revenue = await Payment.aggregate([
      { $match: { status: 'successful' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        payments,
        totalRevenue: revenue.length > 0 ? revenue[0].total : 0,
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

// @route   POST /api/admin/payments/refund
// @desc    Process refund
// @access  Admin
router.post('/payments/refund', [
  body('paymentId').notEmpty(),
  body('amount').isFloat({ min: 0.01 }),
  body('reason').notEmpty()
], async (req, res, next) => {
  try {
    const { paymentId, amount, reason, processedBy } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const totalRefunded = payment.refunds.reduce((sum, r) => sum + r.amount, 0);
    if (totalRefunded + amount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount exceeds payment amount'
      });
    }

    // Add refund record
    payment.refunds.push({
      amount,
      reason,
      processedBy: processedBy || req.user._id,
      status: 'pending'
    });

    // Update payment status if fully refunded
    const newTotal = totalRefunded + amount;
    if (newTotal >= payment.amount) {
      payment.status = 'refunded';
    } else {
      payment.status = 'partially-refunded';
    }

    await payment.save();

    res.json({
      success: true,
      data: payment,
      message: 'Refund initiated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ========== EVENT MANAGEMENT ROUTES ==========

// @route   GET /api/admin/events
// @desc    Get all events (admin view with all details)
// @access  Admin
router.get('/events', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      subType,
      isActive,
      isFeatured,
      search
    } = req.query;

    const query = {};

    if (type) query.type = type;
    if (subType) query.subType = subType;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';
    if (search) {
      query.$text = { $search: search };
    }

    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-__v');

    const eventIds = events.map(event => event._id);
    const bookingCounts = await Booking.aggregate([
      {
        $match: {
          'event.eventId': { $in: eventIds }
        }
      },
      {
        $group: {
          _id: '$event.eventId',
          totalBookings: { $sum: 1 }
        }
      }
    ]);

    const bookingCountMap = bookingCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.totalBookings;
      return acc;
    }, {});

    const normalizedEvents = events.map(event => {
      const eventData = event.toObject ? event.toObject() : event;

      return {
        ...eventData,
        totalBookings: bookingCountMap[event._id.toString()] || 0
      };
    });

    res.json({
      success: true,
      data: {
        events: normalizedEvents,
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

// @route   POST /api/admin/events
// @desc    Create new event
// @access  Admin
router.post('/events', [
  body('name').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('type').isIn(['wedding', 'birthday', 'corporate', 'party', 'religious', 'college-fest', 'music-concert', 'sports-event', 'product-launch', 'other']),
  body('subType').optional().trim(),
  body('slug').optional().trim(),
  body('isActive').optional().isBoolean(),
  body('isFeatured').optional().isBoolean(),
  body('packages').isArray({ min: 1 }).withMessage('At least one package is required'),
  body('venues').isArray({ min: 1 }).withMessage('At least one venue is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const eventData = {
      ...req.body,
      createdBy: req.user._id
    };

    const event = await Event.create(eventData);

    res.status(201).json({
      success: true,
      data: event,
      message: 'Event created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/events/:id
// @desc    Get single event with full details
// @access  Admin
router.get('/events/:id', async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .populate('reviews.bookingId');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/events/:id
// @desc    Update event
// @access  Admin
router.put('/events/:id', async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event,
      message: 'Event updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/events/:id
// @desc    Delete event (soft delete by setting isActive=false)
// @access  Admin
router.delete('/events/:id', async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/events/:id/feature
// @desc    Toggle event featured status
// @access  Admin
router.post('/events/:id/feature', async (req, res, next) => {
  try {
    const { isFeatured } = req.body;

    if (isFeatured === undefined) {
      return res.status(400).json({
        success: false,
        message: 'isFeatured field is required'
      });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { isFeatured },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event,
      message: `Event ${isFeatured ? 'featured' : 'unfeatured'} successfully`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
