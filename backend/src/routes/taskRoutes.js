const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Employee = require('../models/Employee');
const Booking = require('../models/Booking');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const { getIO } = require('../utils/socketIO');
const logger = require('../utils/logger');

// Helper to get socket.io instance
const getSocketIO = () => {
  return getIO();
};

// Helper function to send task notification
const sendTaskNotification = async (task, employee, event = null) => {
  try {
    const io = getSocketIO();
    if (io) {
      // Emit to employee's personal room
      io.to(`user:${employee.user}`).emit('task-assigned', {
        taskId: task._id,
        title: task.title,
        deadline: task.deadline,
        priority: task.priority,
        event: event ? event.name : null
      });
      logger.info(`Socket notification sent for task ${task._id} to employee ${employee._id}`);
    }
  } catch (error) {
    logger.error('Failed to send task notification:', error);
  }
};

// @route   GET /api/tasks
// @desc    Get tasks with filters
// @access  Admin/Employee (role-based)
router.get('/', protect, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      priority,
      assignedTo,
      eventId,
      search,
      overdue = false,
      myTasks = false
    } = req.query;

    const query = {};

    // Role-based filtering
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ user: req.user._id });
      if (employee) {
        query.assignedTo = employee._id;
      } else {
        query.assignedTo = null; // Will return no results
      }
    }

    if (req.user.role === 'admin') {
      if (assignedTo) query.assignedTo = assignedTo;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (eventId) query.event = eventId;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { taskId: { $regex: search, $options: 'i' } }
      ];
    }
    if (overdue === 'true') {
      query.deadline = { $lt: new Date() };
      query.status = { $in: ['todo', 'in-progress', 'blocked'] };
    }

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('assignedTo', 'employeeId profile.firstName profile.lastName')
      .populate('assignedBy', 'profile.firstName profile.lastName')
      .populate('event', 'name type')
      .sort({ priority: -1, deadline: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-__v');

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

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Admin/Assigned Employee
router.get('/:id', protect, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'employeeId profile.firstName profile.lastName')
      .populate('assignedBy', 'profile.firstName profile.lastName email')
      .populate('event', 'name type')
      .populate('comments.user', 'profile.firstName profile.lastName profile.profilePicture')
      .populate('dependencies');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check authorization
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ user: req.user._id });
      if (!employee || task.assignedTo._id.toString() !== employee._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this task'
        });
      }
    }

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/tasks
// @desc    Create task
// @access  Admin
router.post('/', [
  body('title').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('assignedTo').notEmpty(),
  body('deadline').isDate(),
  body('priority').isIn(['low', 'medium', 'high', 'urgent'])
], async (req, res, next) => {
  try {
    const {
      title,
      description,
      type,
      priority,
      event,
      assignedTo,
      deadline,
      estimatedHours,
      dependencies,
      tags
    } = req.body;

    // Validate assigned employee exists
    const employee = await Employee.findOne({ _id: assignedTo });
    if (!employee) {
      return res.status(400).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check employee availability
    if (!employee.availability.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Employee is currently not available'
      });
    }

    // Check if employee has unavailability on this date
    const deadlineDate = new Date(deadline).toDateString();
    const isUnavailable = employee.availability.unavailabilityDates.some(
      date => date.toDateString() === deadlineDate
    );

    if (isUnavailable) {
      // Warning but allow assignment
      logger.warn(`Assigning task to unavailable employee ${employee._id} on ${deadlineDate}`);
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      type: type || 'planning',
      priority,
      event,
      assignedTo,
      assignedBy: req.user._id,
      deadline,
      estimatedHours,
      dependencies,
      tags
    });

    // Populate
    await task.populate([
      { path: 'assignedTo', select: 'employeeId profile.firstName profile.lastName' },
      { path: 'assignedBy', select: 'profile.firstName profile.lastName' },
      { path: 'event', select: 'name type' }
    ]);

    // Send notification
    await sendTaskNotification(task, employee, event ? task.event : null);

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created and assigned successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Admin
router.put('/:id', async (req, res, next) => {
  try {
    const updates = req.body;

    // Prevent updating certain fields
    delete updates.taskId;
    delete updates.createdAt;
    delete updates.completedAt;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
    .populate('assignedTo', 'employeeId profile.firstName profile.lastName')
    .populate('assignedBy', 'profile.firstName profile.lastName')
    .populate('event', 'name type');

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

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Admin
router.delete('/:id', async (req, res, next) => {
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

// @route   PUT /api/tasks/:id/status
// @desc    Update task status (employee/assigned)
router.put('/:id/status', [
  body('status').isIn(['todo', 'in-progress', 'review', 'blocked', 'completed'])
], async (req, res, next) => {
  try {
    const { status, progress, comment, blockReason } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user is assigned to this task or is admin
    if (req.user.role !== 'admin') {
      const employee = await Employee.findOne({ user: req.user._id });
      if (!employee || task.assignedTo.toString() !== employee._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this task'
        });
      }
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
      const employee = await Employee.findById(task.assignedTo);
      if (employee) {
        employee.performance.tasksCompleted += 1;
        if (new Date(task.deadline) >= task.completedAt) {
          employee.performance.tasksOnTime += 1;
        }
        await employee.save();
      }
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
    await task.populate('event');

    // Emit socket notification for real-time updates
    const io = getSocketIO();
    if (io) {
      io.to(`task:${task._id}`).emit('task-updated', {
        taskId: task._id,
        status: task.status,
        progress: task.progress,
        updatedBy: req.user._id
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

// @route   POST /api/tasks/:id/subtask
// @desc    Add subtask
// @access  Assigned Employee/Admin
router.post('/:id/subtask', [
  body('title').trim().notEmpty()
], async (req, res, next) => {
  try {
    const { title, order } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.subtasks.push({
      title,
      order: order || task.subtasks.length
    });

    await task.save();

    res.json({
      success: true,
      data: task,
      message: 'Subtask added successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/tasks/:id/subtask/:subtaskIndex
// @desc    Update subtask (toggle complete)
// @access  Assigned Employee/Admin
router.put('/:id/subtask/:subtaskIndex', async (req, res, next) => {
  try {
    const { completed } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const subtaskIndex = parseInt(req.params.subtaskIndex);
    if (!task.subtasks[subtaskIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Subtask not found'
      });
    }

    task.subtasks[subtaskIndex].completed = completed;
    task.subtasks[subtaskIndex].completedAt = completed ? new Date() : undefined;

    await task.save();

    // Recalculate overall progress based on subtasks
    if (task.subtasks.length > 0) {
      const completedCount = task.subtasks.filter(st => st.completed).length;
      task.progress = Math.round((completedCount / task.subtasks.length) * 100);
      await task.save();
    }

    res.json({
      success: true,
      data: task,
      message: 'Subtask updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/tasks/kanban
// @desc    Get tasks grouped by status for kanban board
// @access  Admin
router.get('/kanban', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { assignedTo, priority, eventId } = req.query;

    const query = {};
    if (assignedTo) query.assignedTo = assignedTo;
    if (priority) query.priority = priority;
    if (eventId) query.event = eventId;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'employeeId profile.firstName profile.lastName')
      .populate('event', 'name type')
      .sort({ createdAt: -1 });

    // Group tasks by status
    const kanbanData = {
      todo: tasks.filter(t => t.status === 'todo'),
      'in-progress': tasks.filter(t => t.status === 'in-progress'),
      review: tasks.filter(t => t.status === 'review'),
      blocked: tasks.filter(t => t.status === 'blocked'),
      completed: tasks.filter(t => t.status === 'completed')
    };

    res.json({
      success: true,
      data: kanbanData,
      summary: {
        total: tasks.length,
        todo: kanbanData.todo.length,
        'in-progress': kanbanData['in-progress'].length,
        review: kanbanData.review.length,
        blocked: kanbanData.blocked.length,
        completed: kanbanData.completed.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/tasks/overdue
// @desc    Get overdue tasks
// @access  Admin
router.get('/overdue', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const overdueTasks = await Task.find({
      deadline: { $lt: new Date() },
      status: { $in: ['todo', 'in-progress', 'blocked'] }
    })
    .populate('assignedTo', 'employeeId profile.firstName profile.lastName employeeId')
    .populate('event', 'name')
    .sort({ deadline: 1 });

    res.json({
      success: true,
      data: overdueTasks
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/tasks/stats
// @desc    Get task statistics
// @access  Admin
router.get('/stats', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    const startDate = period === 'week' ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) :
                     period === 'year' ? new Date(now.getFullYear(), 0, 1) :
                     new Date(now.getFullYear(), now.getMonth(), 1);

    // Status distribution
    const statusDistribution = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Priority distribution
    const priorityDistribution = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Tasks by employee
    const tasksByEmployee = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$assignedTo',
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          onTime: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$status', 'completed'] },
                  { $gte: ['$completedAt', '$deadline'] }
                ] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $project: {
          employeeName: '$employee.profile.firstName',
          total: 1,
          completed: 1,
          completionRate: { $multiply: [{ $divide: ['$completed', '$total'] }, 100] }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Average completion time
    const avgCompletionTime = await Task.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          avgHours: {
            $avg: {
              $divide: [
                { $subtract: ['$completedAt', '$createdAt'] },
                60 * 60 * 1000 // Convert ms to hours
              ]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        statusDistribution,
        priorityDistribution,
        tasksByEmployee,
        avgCompletionTime: avgCompletionTime.length > 0 ? avgCompletionTime[0].avgHours : 0,
        period
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
