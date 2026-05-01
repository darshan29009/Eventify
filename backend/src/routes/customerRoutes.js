const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Task = require('../models/Task');
const { protect, restrictTo, customerOnly } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// All customer routes require authentication
router.use(protect);

// @route   GET /api/customers/dashboard
// @desc    Get customer dashboard
// @access  Customer
router.get('/dashboard', customerOnly, async (req, res, next) => {
  try {
    const customerId = req.user._id;

    const deriveBookingSnapshot = (booking, tasks = []) => {
      const allTasksCompleted = tasks.length > 0 && tasks.every(task => task.status === 'completed');
      const hasStartedTask = tasks.some(task =>
        ['in-progress', 'review', 'completed', 'blocked'].includes(task.status) || Number(task.progress || 0) > 0
      );

      const derivedStatus = allTasksCompleted
        ? 'completed'
        : (hasStartedTask && ['pending', 'confirmed', 'planning'].includes(booking.status)
          ? 'in-progress'
          : booking.status);

      const derivedProgress = allTasksCompleted
        ? 100
        : (booking.progress?.percentage || 0);

      return {
        ...booking,
        status: derivedStatus,
        progress: {
          ...(booking.progress || {}),
          percentage: derivedProgress
        }
      };
    };

    // Upcoming events
    const upcomingBookings = await Booking.find({
      'customer.userId': customerId,
      status: { $in: ['confirmed', 'planning', 'in-progress'] },
      'eventDetails.date': { $gte: new Date() }
    })
    .populate('event.eventId', 'name type images')
    .sort({ 'eventDetails.date': 1 })
    .limit(5)
    .select('-__v');

    // Flatten event.eventId into event for frontend compatibility
    upcomingBookings.forEach(b => {
      if (b.event && b.event.eventId) {
        b.event = { ...b.event, ...b.event.eventId };
      }
    });

    // Recent bookings (last 5)
    const recentBookings = await Booking.find({ 'customer.userId': customerId })
      .populate('event.eventId', 'name type')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-__v');

    // Flatten event.eventId into event for frontend compatibility
    recentBookings.forEach(b => {
      if (b.event && b.event.eventId) {
        b.event = { ...b.event, ...b.event.eventId };
      }
    });

    const dashboardBookingIds = [...new Set([
      ...upcomingBookings.map(booking => booking._id.toString()),
      ...recentBookings.map(booking => booking._id.toString())
    ])];

    const relatedTasks = await Task.find({
      'event.bookingId': { $in: dashboardBookingIds }
    })
      .select('event.bookingId status progress');

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

    const normalizedUpcomingBookings = upcomingBookings
      .map(booking => deriveBookingSnapshot(booking.toObject ? booking.toObject() : booking, tasksByBookingId[booking._id.toString()] || []))
      .filter(booking => booking.status !== 'completed');

    const normalizedRecentBookings = recentBookings
      .map(booking => deriveBookingSnapshot(booking.toObject ? booking.toObject() : booking, tasksByBookingId[booking._id.toString()] || []));

    const totalBookings = await Booking.countDocuments({ 'customer.userId': customerId });
    const completedBookings = await Booking.find({ 'customer.userId': customerId })
      .select('_id status progress');

    const completedBookingIds = completedBookings.map(booking => booking._id.toString());
    const completedTasks = await Task.find({
      'event.bookingId': { $in: completedBookingIds }
    }).select('event.bookingId status progress');

    const completedTaskMap = completedTasks.reduce((acc, task) => {
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

    const completedCount = completedBookings.filter(booking => {
      const tasks = completedTaskMap[booking._id.toString()] || [];
      return deriveBookingSnapshot(booking.toObject ? booking.toObject() : booking, tasks).status === 'completed';
    }).length;

    // Total spent
    const totalSpentResult = await Payment.aggregate([
      {
        $match: {
          'customer.userId': customerId,
          status: 'successful'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
            transactionCount: { $sum: 1 }
        }
      }
    ]);

    // Pending payments
    const pendingPayments = await Booking.find({
      'customer.userId': customerId,
      'payment.status': { $in: ['pending', 'partial'] },
      status: { $ne: 'cancelled' }
    }).select('bookingId payment.eventDetails.date event.name');

    // Wishlist count (need to implement wishlist model/capability)
    const wishlistCount = 0; // Placeholder

    // Recommended events
    const recommendedEvents = await Event.find({
      isActive: true,
      isFeatured: true
    })
    .limit(6)
    .select('name type images packages');

    // Notifications count
    const tasksDue = await Task.countDocuments({
      assignedTo: customerId,
      status: { $in: ['todo', 'in-progress'] },
      deadline: { $lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      data: {
        upcomingEvents: normalizedUpcomingBookings,
        recentBookings: normalizedRecentBookings,
        totalBookings,
        completedBookings: completedCount,
        totalSpent: totalSpentResult.length > 0 ? totalSpentResult[0].totalAmount : 0,
        totalTransactions: totalSpentResult.length > 0 ? totalSpentResult[0].transactionCount : 0,
        pendingPayments,
        wishlistCount,
        recommendedEvents,
        tasksDue
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/customers/profile
// @desc    Get customer profile with stats
// @access  Customer
router.get('/profile', customerOnly, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshTokens');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Compute stats
    const customerId = req.user._id;

    // Total bookings count
    const totalBookings = await Booking.countDocuments({ 'customer.userId': customerId });

    // Total spent (successful payments only)
    const totalSpentResult = await Payment.aggregate([
      {
        $match: {
          'customer.userId': customerId,
          status: 'successful'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const totalSpent = totalSpentResult.length > 0 ? totalSpentResult[0].totalAmount : 0;

    // Transform to match frontend expected structure
    const userObject = user.toObject ? user.toObject() : user;
    const userProfile = userObject.profile || {};
    const responseData = {
      user: {
        _id: userObject._id,
        email: userObject.email,
        role: userObject.role,
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phone: userProfile.phone || '',
        dateOfBirth: userProfile.dateOfBirth || '',
        gender: userProfile.gender || '',
        profilePicture: userProfile.profilePicture || '/assets/images/default-avatar.svg',
        address: userObject.address || {},
        createdAt: userObject.createdAt
      },
      stats: {
        totalBookings,
        totalSpent
      }
    };

    res.json({
      success: true,
      data: responseData,
      message: 'Profile fetched successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/customers/wishlist
// @desc    Get customer wishlist
// @access  Customer
router.get('/wishlist', customerOnly, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'wishlist',
        select: 'name type description shortDescription images venues packages slug isActive'
      })
      .select('wishlist');

    const wishlist = (user?.wishlist || [])
      .filter(event => event && event.isActive)
      .map(event => ({
        _id: event._id,
        event
      }));

    res.json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/customers/wishlist/:eventId
// @desc    Add event to wishlist
// @access  Customer
router.post('/wishlist/:eventId', customerOnly, async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }

    const event = await Event.findById(eventId).select('_id isActive');
    if (!event || !event.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { wishlist: event._id }
    });

    await Event.findByIdAndUpdate(eventId, {
      $inc: { 'metadata.wishlistCount': 1 }
    });

    res.json({
      success: true,
      message: 'Added to wishlist'
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/customers/wishlist/:eventId
// @desc    Remove event from wishlist
// @access  Customer
router.delete('/wishlist/:eventId', customerOnly, async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }

    const user = await User.findById(req.user._id).select('wishlist');
    const existed = user?.wishlist?.some(id => id.toString() === eventId);

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { wishlist: eventId }
    });

    if (existed) {
      await Event.findByIdAndUpdate(eventId, {
        $inc: { 'metadata.wishlistCount': -1 }
      });
    }

    res.json({
      success: true,
      message: 'Removed from wishlist'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/customers/profile
// @desc    Update customer profile
// @access  Customer
router.put('/profile', customerOnly, [
  body('profile.firstName').optional().trim(),
  body('profile.lastName').optional().trim(),
  body('profile.phone').optional().isMobilePhone('any'),
  body('profile.gender').optional().isIn(['male', 'female', 'other']),
  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.state').optional().trim(),
  body('address.country').optional().trim(),
  body('address.pincode').optional().isPostalCode('any')
], async (req, res, next) => {
  try {
    const updates = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/customers/events
// @desc    Browse events with filters
// @access  Customer & Admin
router.get('/events', restrictTo('admin', 'customer'), async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      subType,
      city,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      isFeatured
    } = req.query;

    const query = { isActive: true };

    if (type) query.type = type;
    if (subType) query.subType = subType;
    if (city) query['venues.city'] = { $regex: city, $options: 'i' };
    if (isFeatured) query.isFeatured = isFeatured === 'true';

    // Price range filter
    if (minPrice || maxPrice) {
      const min = parseFloat(minPrice) || 0;
      const max = parseFloat(maxPrice);

      query['packages.price'] = max ? { $gte: min, $lte: max } : { $gte: min };
    }

    // Search
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { shortDescription: searchRegex },
        { type: searchRegex },
        { subType: searchRegex },
        { 'venues.name': searchRegex },
        { 'venues.city': searchRegex }
      ];
    }

    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort(sortBy === 'price' ? { 'packages.price': order === 'asc' ? 1 : -1 } : { [sortBy]: order === 'asc' ? 1 : -1 })
      .select('name slug description type subType images virtualTour packages venues averageRating totalBookings isFeatured createdAt');

    res.json({
      success: true,
      data: {
        events,
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

// @route   GET /api/customers/events/:id
// @desc    Get event details
// @access  Customer & Admin
router.get('/events/:id', restrictTo('admin', 'customer'), async (req, res, next) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }

    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'profile.firstName profile.lastName');

    if (!event || !event.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Increment view count safely
    if (!event.metadata) {
      event.metadata = { views: 0, wishlistCount: 0, shareCount: 0 };
    }
    event.metadata.views = (event.metadata.views || 0) + 1;
    await event.save();

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    next(error);
  }
});

// @route   GET /api/customers/events/slug/:slug
// @desc    Get event by slug
// @access  Customer & Admin
router.get('/events/slug/:slug', restrictTo('admin', 'customer'), async (req, res, next) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug, isActive: true });

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

// @route   GET /api/customers/events/cities
// @desc    Get list of cities with events
// @access  Customer & Admin
router.get('/events/cities', restrictTo('admin', 'customer'), async (req, res, next) => {
  try {
    const cities = await Event.distinct('venues.city', { isActive: true });
    res.json({ success: true, data: cities.sort() });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/customers/events/types
// @desc    Get all event types and sub-types
// @access  Customer & Admin
router.get('/events/types', restrictTo('admin', 'customer'), async (req, res, next) => {
  try {
    const types = await Event.distinct('type', { isActive: true });
    const subTypes = await Event.distinct('subType', { isActive: true });

    res.json({
      success: true,
      data: { types, subTypes }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/customers/bookings
// @desc    Create booking
// @access  Customer
router.post('/bookings', customerOnly, [
  body('event.eventId').notEmpty(),
  body('package').notEmpty(),
  body('eventDetails.date').isDate(),
  body('eventDetails.startTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format'),
  body('eventDetails.endTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format'),
  body('eventDetails.duration').notEmpty().withMessage('Duration is required'),
  body('eventDetails.expectedGuests').isInt({ min: 1 }).withMessage('Expected guests must be at least 1'),
  body('eventDetails.venue.name').notEmpty().withMessage('Venue name is required'),
  body('eventDetails.venue.address').notEmpty().withMessage('Venue address is required'),
  body('eventDetails.venue.city').notEmpty().withMessage('Venue city is required')
], async (req, res, next) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const bookingData = req.body;
    const customerId = req.user._id;

    // Get customer details
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get event details with populated packages
    const event = await Event.findById(bookingData.event.eventId)
      .populate('packages');

    if (!event || !event.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or not available'
      });
    }

    // Check if selected package exists by ID
    const selectedPackage = event.packages.find(
      p => p._id.toString() === bookingData.package && p.isActive
    );

    if (!selectedPackage) {
      return res.status(400).json({
        success: false,
        message: 'Selected package not available'
      });
    }

    // Check if date is available
    const eventDate = new Date(bookingData.eventDetails.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book events in the past'
      });
    }

    if (event.availability?.blackoutDates?.includes(eventDate)) {
      return res.status(400).json({
        success: false,
        message: 'This date is not available for booking'
      });
    }

    // Calculate pricing with 18% GST
    const basePrice = selectedPackage.price;
    const taxRate = 0.18;
    const tax = basePrice * taxRate;
    const totalAmount = basePrice + tax;

    // Create booking
    const booking = await Booking.create({
      event: {
        eventId: event._id,
        packageName: selectedPackage.name,
        packagePrice: selectedPackage.price
      },
      eventDetails: bookingData.eventDetails,
      'customer.userId': customer._id,
      'customer.name': customer.fullName || `${customer.profile?.firstName} ${customer.profile?.lastName}`,
      'customer.email': customer.email,
      'customer.phone': customer.profile?.phone || '',
      pricing: {
        basePrice,
        discount: 0,
        subtotal: basePrice,
        tax,
        taxRate,
        totalAmount,
        currency: 'INR'
      },
      status: 'pending'
    });

    // Load event data for response
    await booking.populate('event.eventId', 'name images');
    if (booking.event && booking.event.eventId) {
      booking.event = { ...booking.event, ...booking.event.eventId };
    }

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully. Please proceed to payment.'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/customers/bookings
// @desc    Get customer's bookings
// @access  Customer
router.get('/bookings', customerOnly, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      upcoming = false
    } = req.query;

    const query = { 'customer.userId': req.user._id };

    if (status) query.status = status;
    if (upcoming === 'true') {
      query['eventDetails.date'] = { $gte: new Date() };
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('event.eventId', 'name type images')
      .sort({ 'eventDetails.date': upcoming === 'true' ? 1 : -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-__v');

    // Flatten event.eventId into event for frontend compatibility
    bookings.forEach(b => {
      if (b.event && b.event.eventId) {
        b.event = { ...b.event, ...b.event.eventId };
      }
    });

    const bookingIds = bookings.map(booking => booking._id.toString());
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

// @route   GET /api/customers/bookings/:id
// @desc    Get booking details
// @access  Customer
router.get('/bookings/:id', customerOnly, async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      'customer.userId': req.user._id
    })
    .populate('event.eventId', 'name description type images packages venues')
    .populate('assignedTeam.employee', 'employeeId profile.firstName profile.lastName designation profile.profilePicture');

    // Flatten event.eventId into event for frontend compatibility
    if (booking && booking.event && booking.event.eventId) {
      booking.event = { ...booking.event, ...booking.event.eventId };
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
    const tasks = await Task.find({ event: { bookingId: booking._id } })
      .populate('assignedTo', 'employeeId profile.firstName profile.lastName')
      .select('taskId title status progress deadline createdAt');

    // Log the booking structure to ensure pricing is included
    console.log('GET /customers/bookings/:id returning booking:', JSON.stringify(booking, null, 2));

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

// @route   PUT /api/customers/bookings/:id
// @desc    Update booking (before confirmation)
// @access  Customer
router.put('/bookings/:id', customerOnly, async (req, res, next) => {
  try {
    const { status, eventDetails, specialRequirements, customizations } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.id,
      'customer.userId': req.user._id
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Can only update pending bookings
    if (!['pending'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update confirmed bookings. Please contact support.'
      });
    }

    // Update allowed fields
    if (eventDetails) booking.eventDetails = { ...booking.eventDetails, ...eventDetails };
    if (specialRequirements !== undefined) booking.eventDetails.specialRequirements = specialRequirements;
    if (customizations) booking.eventDetails.customizations = customizations;
    if (status) booking.status = status;

    await booking.save();

    res.json({
      success: true,
      data: booking,
      message: 'Booking updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/customers/bookings/:id/cancel
// @desc    Cancel booking
// @access  Customer
router.post('/bookings/:id/cancel', customerOnly, [
  body('reason').optional().trim()
], async (req, res, next) => {
  try {
    const { reason } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.id,
      'customer.userId': req.user._id
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!['pending', 'confirmed', 'planning'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel this booking'
      });
    }

    booking.status = 'cancelled';
    booking.cancelledBy = req.user._id;
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;
    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/customers/payment-history
// @desc    Get payment history
// @access  Customer
router.get('/payment-history', customerOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    console.log('\n[PaymentHistory] ==========');
    console.log('  req.user._id:', req.user._id.toString());
    console.log('  req.user.role:', req.user.role);

    const query = { 'customer.userId': req.user._id };
    console.log('  Query:', JSON.stringify(query));

    // First, check all payments in DB (debug - remove in production)
    const allPaymentsCount = await Payment.countDocuments();
    console.log('  Total payments in DB (any customer):', allPaymentsCount);

    const allPayments = await Payment.find({}).select('_id customerId bookingId customer.status').limit(5);
    console.log('  Sample payments (first 5):', allPayments.map(p => ({
      _id: p._id.toString(),
      userId: p.customer?.userId?.toString(),
      status: p.status
    })));

    const payments = await Payment.find(query)
      .populate('bookingId', 'bookingId event.name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Payment.countDocuments(query);
    console.log('  Query result: Found', payments.length, 'payments (total:', total, ')');
    if (payments.length > 0) {
      console.log('  First payment customer.userId:', payments[0].customer?.userId?.toString());
    }
    console.log('[PaymentHistory] ==========\n');

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('[PaymentHistory Error]', error.message);
    console.error(error.stack);
    next(error);
  }
});

// @route   POST /api/customers/reviews
// @desc    Submit review
// @access  Customer
router.post('/reviews', customerOnly, [
  body('bookingId').notEmpty(),
  body('rating.overall').isInt({ min: 1, max: 5 }),
  body('review').trim().notEmpty().isLength({ max: 2000 })
], async (req, res, next) => {
  try {
    const { bookingId, rating, review, title, photos } = req.body;

    // Check if booking exists and belongs to customer
    const booking = await Booking.findOne({
      _id: bookingId,
      'customer.userId': req.user._id,
      status: 'completed'
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Completed booking not found'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Review already submitted for this booking'
      });
    }

    const reviewDoc = await Review.create({
      bookingId,
      eventId: booking.event.eventId,
      customer: {
        userId: req.user._id,
        name: req.user.fullName,
        email: req.user.email
      },
      rating,
      review,
      title,
      photos: photos || []
    });

    // Update event average rating
    const allReviews = await Review.countDocuments({ eventId: booking.event.eventId, isActive: true });
    const avgRatingResult = await Review.aggregate([
      { $match: { eventId: booking.event.eventId, isActive: true } },
      { $group: { _id: null, avgRating: { $avg: '$rating.overall' } } }
    ]);

    await Event.findByIdAndUpdate(booking.event.eventId, {
      averageRating: avgRatingResult.length > 0 ? avgRatingResult[0].avgRating : 0,
      totalReviews: allReviews
    });

    res.status(201).json({
      success: true,
      data: reviewDoc,
      message: 'Review submitted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
