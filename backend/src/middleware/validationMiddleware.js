const { body, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      errors: errors.array()
    });
  };
};

// User validations
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('profile.firstName').trim().notEmpty().withMessage('First name is required'),
  body('profile.lastName').trim().notEmpty().withMessage('Last name is required'),
  body('profile.phone').optional().isMobilePhone('any').withMessage('Invalid phone number')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

const updateProfileValidation = [
  body('profile.firstName').optional().trim(),
  body('profile.lastName').optional().trim(),
  body('profile.phone').optional().isMobilePhone('any'),
  body('address.city').optional().trim(),
  body('address.state').optional().trim(),
  body('address.country').optional().trim(),
  body('address.pincode').optional().isPostalCode('any')
];

// Event validations
const eventValidation = [
  body('name').trim().notEmpty().withMessage('Event name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('type').isIn(['wedding', 'birthday', 'corporate', 'party', 'religious', 'college-fest', 'music-concert', 'sports-event', 'product-launch', 'other']).withMessage('Invalid event type'),
  body('subType').optional().trim()
];

const packageValidation = [
  body('packages.*.name').isIn(['basic', 'premium', 'luxury', 'custom']).withMessage('Invalid package name'),
  body('packages.*.displayName').trim().notEmpty(),
  body('packages.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('packages.*.includedServices').optional().isArray()
];

// Booking validations
const bookingValidation = [
  body('customer.name').trim().notEmpty().withMessage('Customer name is required'),
  body('customer.email').isEmail().normalizeEmail(),
  body('customer.phone').isMobilePhone('any').withMessage('Invalid phone number'),
  body('event.eventId').notEmpty().withMessage('Event ID is required'),
  body('event.packageName').notEmpty().withMessage('Package name is required'),
  body('eventDetails.date').isDate().withMessage('Invalid date'),
  body('eventDetails.startTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
  body('eventDetails.duration').notEmpty(),
  body('eventDetails.expectedGuests').isInt({ min: 1 }).withMessage('At least 1 guest required'),
  body('eventDetails.venue.name').trim().notEmpty(),
  body('eventDetails.venue.address').trim().notEmpty(),
  body('eventDetails.venue.city').trim().notEmpty()
];

// Task validations
const taskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('description').trim().notEmpty().withMessage('Task description is required'),
  body('assignedTo').notEmpty().withMessage('Assigned employee is required'),
  body('deadline').isDate().withMessage('Invalid deadline'),
  body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
];

const taskStatusUpdate = [
  body('status').isIn(['todo', 'in-progress', 'review', 'blocked', 'completed']).withMessage('Invalid status'),
  body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100')
];

// Payment validations
const paymentValidation = [
  body('bookingId').notEmpty().withMessage('Booking ID is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
  body('method').isIn(['card', 'upi', 'netbanking', 'wallet', 'emi']).withMessage('Invalid payment method'),
  body('paymentIntentId').optional()
];

// Employee validations
const employeeValidation = [
  body('employeeId').optional().trim(),
  body('department').isIn(['Event Management', 'Operations', 'Finance', 'Marketing', 'Hospitality', 'Security']).withMessage('Invalid department'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
  body('specializations').optional().isArray(),
  body('experience').optional().isInt({ min: 0, max: 50 }).withMessage('Experience must be between 0 and 50 years'),
  body('salary').optional().isFloat({ min: 0 })
];

// Review validations
const reviewValidation = [
  body('rating.overall').isInt({ min: 1, max: 5 }).withMessage('Overall rating must be between 1 and 5'),
  body('review').trim().notEmpty().withMessage('Review text is required').isLength({ max: 2000 })
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  updateProfileValidation,
  eventValidation,
  packageValidation,
  bookingValidation,
  taskValidation,
  taskStatusUpdate,
  paymentValidation,
  employeeValidation,
  reviewValidation
};
