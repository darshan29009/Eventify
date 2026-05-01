const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Task = require('../models/Task');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Payment = require('../models/Payment');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

// All booking routes require authentication (optional - can be removed for public access)
router.use(protect);

// @route   GET /api/bookings
// @desc    Get bookings based on role
// @access  Admin/Customer
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      city,
      dateFrom,
      dateTo
    } = req.query;

    const query = {};

    // Role-based filtering
    if (req.user.role === 'customer') {
      query['customer.userId'] = req.user._id;
    }

    if (req.user.role === 'admin') {
      // Admin can see all, but can filter
      if (status) query.status = status;
      if (type) query['eventDetails.eventType'] = type;
      if (city) query['eventDetails.venue.city'] = { $regex: city, $options: 'i' };
      if (dateFrom || dateTo) {
        query['eventDetails.date'] = {};
        if (dateFrom) query['eventDetails.date'].$gte = new Date(dateFrom);
        if (dateTo) query['eventDetails.date'].$lte = new Date(dateTo);
      }
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('event.eventId', 'name type images')
      .populate('assignedTeam.employee', 'employeeId profile.firstName profile.lastName designation')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-__v');

    // Flatten event.eventId into event for frontend compatibility
    bookings.forEach(b => {
      if (b.event && b.event.eventId) {
        b.event = { ...b.event, ...b.event.eventId };
      }
    });

    res.json({
      success: true,
      data: {
        bookings,
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

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Admin/Customer (own only)
router.get('/:id', async (req, res, next) => {
  try {
    const query = { _id: req.params.id };

    // Customer can only see own bookings
    if (req.user.role === 'customer') {
      query['customer.userId'] = req.user._id;
    }

    console.log('[GET /bookings/:id] Query:', JSON.stringify(query));

    // Fetch booking without event populate first
    const booking = await Booking.findOne(query)
      .select('-__v');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // NOTE: customer data is already embedded in the booking (name, email, phone)
    // No need to populate; if we need user profile fields, we would populate 'customer.userId'
    // Skipping populate for now to avoid errors.

    // Conditionally populate event.eventId if it exists
    if (booking.event && booking.event.eventId) {
      await booking.populate('event.eventId', 'name description type images packages virtualTour faqs termsAndConditions');
      // Flatten event.eventId into event for frontend compatibility
      booking.event = {
        ...booking.event,
        ...booking.event.eventId,
      };
    } else {
      // Ensure event is at least an empty object
      booking.event = booking.event || {};
    }

    // Populate assignedTeam.employee
    await booking.populate('assignedTeam.employee', 'employeeId profile.firstName profile.lastName designation profile.profilePicture');

    // Get payments
    const payments = await Payment.find({ bookingId: booking._id })
      .sort({ createdAt: -1 });

    // Merge payments into booking.payment.transactions for frontend compatibility
    if (booking.payment && Array.isArray(payments)) {
      booking.payment.transactions = payments.map(p => ({
        transactionId: p.transactionId,
        amount: p.amount,
        method: p.method,
        gateway: p.gateway,
        status: p.status,
        paidAt: p.createdAt,
        createdAt: p.createdAt
      }));
    } else if (!booking.payment) {
      booking.payment = {
        transactions: payments.map(p => ({
          transactionId: p.transactionId,
          amount: p.amount,
          method: p.method,
          gateway: p.gateway,
          status: p.status,
          paidAt: p.createdAt,
          createdAt: p.createdAt
        }))
      };
    }

    // Get tasks for this booking
    let tasks = [];
    try {
      tasks = await Task.find({
        'event.bookingId': booking._id
      })
      .populate('assignedTo', 'employeeId profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .select('-__v');
    } catch (taskError) {
      console.error('[WARN] Failed to fetch tasks for booking:', taskError.message);
      // Continue without tasks
    }

    res.json({
      success: true,
      data: {
        booking,
        payments,
        tasks
      }
    });
  } catch (error) {
    console.error('ERROR in GET /bookings/:id:', error.message);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/bookings/:id
// @desc    Update booking
// @access  Admin
router.put('/:id', async (req, res, next) => {
  try {
    const updates = req.body;

    // Prevent updating certain fields
    delete updates._id;
    delete updates.bookingId;
    delete updates.customer;
    delete updates.createdAt;

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
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
      message: 'Booking updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/bookings/:id/assign-team
// @desc    Assign team to booking and create tasks for assigned employees
// @access  Admin
router.post('/:id/assign-team', [
  body('team').isArray(),
  body('team.*.employee').notEmpty(),
  body('team.*.role').notEmpty()
], async (req, res, next) => {
  try {
    const { team } = req.body;

    const booking = await Booking.findById(req.params.id)
      .populate('event.eventId', 'name type')
      .select('bookingId event eventDetails assignedTeam');
    // Ensure eventDetails is populated
    if (booking.event?.eventId && !booking.eventDetails?.date) {
      // If eventDetails.date not available, try getting from event model
      const Event = require('../models/Event');
      const fullEvent = await Event.findById(booking.event.eventId).select('date venue');
      if (fullEvent) {
        booking.eventDetails = booking.eventDetails || {};
        booking.eventDetails.date = fullEvent.date;
        booking.eventDetails.venue = fullEvent.venue;
      }
    }
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Get event details for task creation
    const eventName = booking.event?.eventId?.name || 'Event';
    const eventDate = booking.eventDetails?.date || (booking.event?.eventId?.date ? booking.event.eventId.date : null);
    const eventType = booking.eventDetails?.eventType || booking.event?.eventId?.type || 'Event';

    console.log(`[AssignTeam] Event data - name: ${eventName}, date: ${eventDate}, type: ${eventType}`);
    console.log(`[AssignTeam] booking.event.eventId:`, booking.event?.eventId);
    console.log(`[AssignTeam] booking.eventDetails:`, booking.eventDetails);

    // Append new team members and create tasks for them
    const Task = require('../models/Task');
    const createdTasks = [];
    console.log(`[AssignTeam] Booking: ${booking._id}, Event: ${eventName}, Date: ${eventDate}, EventId: ${booking.event?.eventId?._id || booking.event?.eventId}`);
    console.log(`[AssignTeam] Team members to add: ${JSON.stringify(team)}`);

    // Ensure assignedTeam exists
    if (!booking.assignedTeam || !Array.isArray(booking.assignedTeam)) {
      booking.assignedTeam = [];
    }

    for (const member of team) {
      console.log(`[AssignTeam] Processing member: ${member.employee}, role: ${member.role}`);
      let teamMember = booking.assignedTeam.find(
        t => t.employee.toString() === member.employee
      );

      if (!teamMember) {
        // Add to team if not exists
        teamMember = {
          employee: member.employee,
          role: member.role,
          assignedAt: new Date(),
          assignedTasks: []
        };
        booking.assignedTeam.push(teamMember);
        console.log(`[AssignTeam] Added new team member: ${member.employee}`);
      } else {
        console.log(`[AssignTeam] Employee ${member.employee} already in team, checking for missing task`);
        // Ensure teamMember has assignedTasks array
        if (!teamMember.assignedTasks) {
          teamMember.assignedTasks = [];
        }
      }

      // Check if a task already exists for this employee, event, and booking
      const existingTask = await Task.findOne({
        assignedTo: member.employee,
        'event.bookingId': booking._id,
        title: `${member.role}: ${eventName}`
      });
      console.log(`[AssignTeam] Existing task check: ${existingTask ? 'Found: ' + existingTask._id : 'None found'}`);

      // Create a default task for this employee if no similar task exists
      if (!existingTask) {
        try {
          if (!eventDate) {
            console.error(`[AssignTeam] No event date for booking ${booking._id}, skipping task creation`);
            continue;
          }
          const deadline = new Date(eventDate);
          deadline.setHours(18, 0, 0, 0); // Set deadline to 6 PM on event date

          const taskData = {
            title: `${member.role}: ${eventName}`,
            description: `Perform ${member.role} duties for ${eventName} on ${new Date(eventDate).toLocaleDateString()}. Event Type: ${eventType}. Venue: ${booking.eventDetails?.venue?.name || 'TBD'}.`,
            type: 'coordination',
            priority: 'medium',
            event: {
              eventId: booking.event?.eventId?._id || booking.event?.eventId,
              bookingId: booking._id
            },
            assignedTo: member.employee,
            assignedBy: req.user._id,
            deadline: deadline,
            estimatedHours: 8,
            progress: 0,
            status: 'todo',
            tags: [`${member.role}`, eventType]
          };
          console.log(`[AssignTeam] Creating task with data:`, JSON.stringify(taskData, null, 2));
          const task = await Task.create(taskData);
          console.log(`[AssignTeam] Created task: ${task._id} for employee ${member.employee}`);
          createdTasks.push(task);

          // Also add to booking's assignedTasks array for reference
          if (teamMember.assignedTasks) {
            teamMember.assignedTasks.push(task._id);
          }
        } catch (taskErr) {
          console.error(`[AssignTeam] Failed to create task for employee ${member.employee}:`, taskErr.message);
          // Continue with other team members even if task creation fails
        }
      } else {
        // Make sure existing task is in assignedTasks array
        if (teamMember.assignedTasks && !teamMember.assignedTasks.includes(existingTask._id)) {
          teamMember.assignedTasks.push(existingTask._id);
        }
        console.log(`[AssignTeam] Skipping task creation - already exists: ${existingTask._id}`);
      }
    }
    console.log(`[AssignTeam] Total tasks created: ${createdTasks.length}`);

    await booking.save();
    await booking.populate('assignedTeam.employee', 'employeeId profile.firstName profile.lastName designation');

    res.json({
      success: true,
      data: booking,
      tasksCreated: createdTasks.length,
      message: `Team assigned successfully${createdTasks.length > 0 ? ` with ${createdTasks.length} task(s) created` : ''}`
    });
  } catch (error) {
    console.error('[AssignTeam] ERROR:', error.message);
    console.error('[AssignTeam] Stack:', error.stack);
    console.error('[AssignTeam] Request body:', JSON.stringify(req.body, null, 2));
    console.error('[AssignTeam] Booking ID:', req.params.id);
    next(error);
  }
});

// @route   POST /api/bookings/:id/remove-team/:employeeId
// @desc    Remove team member from booking
// @access  Admin
router.post('/:id/remove-team/:employeeId', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.assignedTeam = booking.assignedTeam.filter(
      t => t.employee.toString() !== req.params.employeeId
    );

    await booking.save();

    res.json({
      success: true,
      data: booking,
      message: 'Team member removed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/bookings/:id/progress
// @desc    Update booking progress
// @access  Admin
router.put('/:id/progress', [
  body('percentage').isInt({ min: 0, max: 100 })
], async (req, res, next) => {
  try {
    const { percentage } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        'progress.percentage': percentage,
        'progress.lastUpdated': new Date()
      },
      { new: true }
    );

    res.json({
      success: true,
      data: booking,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/bookings/:id/milestone
// @desc    Add milestone to booking
// @access  Admin
router.post('/:id/milestone', [
  body('name').trim().notEmpty(),
  body('description').optional().trim(),
  body('order').optional().isInt()
], async (req, res, next) => {
  try {
    const { name, description, order } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.progress.milestones.push({
      name,
      description,
      order: order || booking.progress.milestones.length
    });

    await booking.save();

    res.json({
      success: true,
      data: booking,
      message: 'Milestone added successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/bookings/:id/milestone/:milestoneIndex/complete
// @desc    Complete a milestone
// @access  Admin
router.put('/:id/milestone/:milestoneIndex/complete', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const milestoneIndex = parseInt(req.params.milestoneIndex);
    const milestone = booking.progress.milestones[milestoneIndex];

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    milestone.completed = true;
    milestone.completedAt = new Date();

    // Recalculate overall progress
    const completedMilestones = booking.progress.milestones.filter(m => m.completed).length;
    const totalMilestones = booking.progress.milestones.length;
    booking.progress.percentage = Math.round((completedMilestones / totalMilestones) * 100);

    await booking.save();

    res.json({
      success: true,
      data: booking,
      message: 'Milestone completed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/bookings/:id/payment
// @desc    Update booking payment status and create Payment record
// @access  Admin/Customer (own booking only)
router.put('/:id/payment', async (req, res, next) => {
  try {
    const { status, paymentMethod, transactionId, amount } = req.body;

    // Find booking
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if customer is updating their own booking
    if (req.user.role === 'customer' && booking.customer.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    // Build transaction record
    const paymentAmount = amount || booking.pricing.totalAmount;
    if (typeof paymentAmount !== 'number' || isNaN(paymentAmount) || paymentAmount <= 0) {
      console.error('[Payment Error] Invalid payment amount:', paymentAmount, 'amount:', amount, 'booking.pricing.totalAmount:', booking.pricing.totalAmount);
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    const txTransactionId = transactionId || `TXN${Date.now()}`;
    const method = paymentMethod || 'card';
    const paymentStatus = status === 'paid' ? 'successful' : 'failed';

    const transaction = {
      transactionId: txTransactionId,
      amount: paymentAmount,
      method,
      status: paymentStatus,
      paidAt: new Date()
    };

    // Create Payment record
    console.log('[Payment Creation] START');
    console.log('  booking.customer.userId:', booking.customer.userId.toString());
    console.log('  req.user._id:', req.user._id.toString());
    console.log('  bookingId:', booking._id.toString());
    console.log('  paymentStatus:', paymentStatus);
    console.log('  paymentAmount:', paymentAmount);
    console.log('  method:', method);
    console.log('  transactionId:', txTransactionId);
    console.log('  booking.pricing:', booking.pricing);

    try {
      const paymentData = {
        transactionId: txTransactionId,
        bookingId: booking._id,
        customer: {
          userId: booking.customer.userId,
          name: booking.customer.name,
          email: booking.customer.email
        },
        amount: paymentAmount,
        currency: booking.pricing?.currency || 'INR',
        method: method,
        gateway: 'manual',
        gatewayTransactionId: txTransactionId,
        status: paymentStatus,
        metadata: {
          updatedBy: req.user._id,
          updatedVia: 'booking-payment-endpoint'
        }
      };
      console.log('  Payment data to create:', JSON.stringify(paymentData, null, 2));

      const payment = await Payment.create(paymentData);
      console.log('[Payment Created] SUCCESS - payment._id:', payment._id.toString(), 'customer.userId:', payment.customer.userId.toString());
    } catch (createError) {
      console.error('[Payment Creation] FAILED:', createError.message);
      console.error('  Full error:', createError);
      throw createError;
    }

    // Update booking status, payment status, and add transaction to payment.transactions
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: status === 'paid' ? 'confirmed' : status,
          'payment.status': status === 'paid' ? 'paid' : 'pending',
          'payment.method': method,
          'payment.advancePaid': status === 'paid' ? paymentAmount : (booking.payment?.advancePaid || 0),
          'payment.dueAmount': status === 'paid' ? 0 : (booking.payment?.dueAmount || 0)
        },
        $push: { 'payment.transactions': transaction }
      },
      { new: true, runValidators: true }
    ).populate('event', 'name images');

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Payment status updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/bookings/:id/attachment
// @desc    Upload attachment to booking
// @access  Admin/Customer (own booking only)
router.post('/:id/attachment', async (req, res, next) => {
  try {
    // File upload middleware would be applied here
    res.status(501).json({
      success: false,
      message: 'File upload endpoint needs multer configuration'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
