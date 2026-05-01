const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const logger = require('../utils/logger');

// Public routes
router.use(protect, restrictTo('admin'));

// @route   GET /api/events
// @desc    Get all events (admin view)
// @access  Admin
router.get('/', async (req, res, next) => {
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
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .select('-__v');

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

// @route   POST /api/events
// @desc    Create new event
// @access  Admin
router.post('/', [
  body('name').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('type').isIn(['wedding', 'birthday', 'corporate', 'party', 'religious', 'college-fest', 'music-concert', 'sports-event', 'product-launch', 'other']),
  body('packages').optional().isArray(),
  body('venues').optional().isArray(),
  body('servicesIncluded').optional().isArray()
], async (req, res, next) => {
  try {
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

// @route   GET /api/events/:id
// @desc    Get single event (admin)
// @access  Admin
router.get('/:id', async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .populate('reviews.customer', 'profile.firstName profile.lastName');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Admin
router.put('/:id', async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'profile.firstName profile.lastName');

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

// @route   DELETE /api/events/:id
// @desc    Delete event (soft delete)
// @access  Admin
router.delete('/:id', async (req, res, next) => {
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
      message: 'Event deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/events/:id/feature
// @desc    Toggle event featured status
// @access  Admin
router.post('/:id/feature', async (req, res, next) => {
  try {
    const { isFeatured } = req.body;

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { isFeatured },
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
      data: event,
      message: `Event ${isFeatured ? 'featured' : 'unfeatured'} successfully`
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/events/venues/cities
// @desc    Get all cities with venues
// @access  Public/Admin
router.get('/venues/cities', async (req, res, next) => {
  try {
    const cities = await Event.distinct('venues.city', { isActive: true });
    res.json({ success: true, data: cities.sort() });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/events/analytics
// @desc    Get event analytics
// @access  Admin
router.get('/analytics', async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    const startDate = period === 'week' ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) :
                     period === 'year' ? new Date(now.getFullYear(), 0, 1) :
                     new Date(now.getFullYear(), now.getMonth(), 1);

    // Top events by bookings
    const topEvents = await Booking.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$event.eventId',
          bookings: { $sum: 1 },
          revenue: { $sum: '$pricing.totalAmount' }
        }
      },
      {
        $sort: { bookings: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: '_id',
          as: 'event'
        }
      },
      { $unwind: '$event' },
      {
        $project: {
          name: '$event.name',
          type: '$event.type',
          bookings: 1,
          revenue: 1
        }
      }
    ]);

    // Event type distribution
    const typeDistribution = await Booking.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$eventDetails.eventType',
          count: { $sum: 1 },
          revenue: { $sum: '$pricing.totalAmount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Monthly booking trend
    const monthlyTrend = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
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
          bookings: { $sum: 1 },
          revenue: { $sum: '$pricing.totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        topEvents,
        typeDistribution,
        monthlyTrend,
        period
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
