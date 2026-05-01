const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const paymentService = require('../services/paymentService');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const emailService = require('../utils/emailService');

// @route   POST /api/payments/create-intent
// @desc    Create payment intent (Stripe)
// @access  Public (Protected internally)
router.post('/create-intent', protect, [
  body('bookingId').notEmpty(),
  body('amount').isFloat({ min: 1 }),
  body('method').isIn(['card', 'upi', 'netbanking', 'wallet', 'emi'])
], async (req, res, next) => {
  try {
    const { bookingId, amount, method } = req.body;

    // Verify booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check customer ownership (if customer)
    if (req.user.role === 'customer' && booking.customer.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Create payment intent with Stripe
    const metadata = {
      bookingId: booking._id.toString(),
      customerId: booking.customer.userId.toString(),
      customerEmail: booking.customer.email,
      customerName: booking.customer.name,
      eventName: booking.event.name || 'Event'
    };

    const result = await paymentService.createStripePaymentIntent(
      amount,
      booking.pricing.currency,
      metadata
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      data: {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        status: result.status
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/payments/create-razorpay-order
// @desc    Create Razorpay order
// @access  Public (Protected internally)
router.post('/create-razorpay-order', protect, [
  body('bookingId').notEmpty(),
  body('amount').isFloat({ min: 1 })
], async (req, res, next) => {
  try {
    const { bookingId, amount } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (req.user.role === 'customer' && booking.customer.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (booking.payment?.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been paid'
      });
    }

    const payableAmount = Number(booking.payment?.dueAmount) > 0
      ? Number(booking.payment.dueAmount)
      : Number(booking.pricing?.totalAmount || 0);

    if (!payableAmount || payableAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No payable amount found for this booking'
      });
    }

    if (Math.abs(Number(amount) - payableAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount does not match booking total'
      });
    }

    const receipt = booking.bookingId || `booking_${bookingId}`;
    const notes = {
      bookingId: bookingId,
      customerId: booking.customer.userId.toString(),
      customerName: booking.customer.name,
      customerEmail: booking.customer.email
    };

    const result = await paymentService.createRazorpayOrder(
      amount,
      booking.pricing.currency,
      receipt,
      notes
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      data: {
        ...result,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/payments/verify-razorpay
// @desc    Verify Razorpay payment
// @access  Public
router.post('/verify-razorpay', protect, [
  body('orderId').notEmpty(),
  body('paymentId').notEmpty(),
  body('signature').notEmpty(),
  body('bookingId').notEmpty(),
  body('amount').isFloat({ min: 1 })
], async (req, res, next) => {
  try {
    const { orderId, paymentId, signature, bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (req.user.role === 'customer' && booking.customer.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const existingPayment = await Payment.findOne({ transactionId: paymentId });
    if (existingPayment) {
      return res.json({
        success: true,
        data: existingPayment,
        message: 'Payment already verified'
      });
    }

    // Verify signature
    const result = await paymentService.verifyRazorpayPayment(orderId, paymentId, signature);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    const amount = Number(result.payment.amount || 0);

    // Create payment record
    const payment = await Payment.create({
      transactionId: paymentId,
      bookingId,
      customer: {
        userId: req.user._id,
        name: booking.customer.name,
        email: booking.customer.email,
        phone: booking.customer.phone || ''
      },
      amount,
      currency: 'INR',
      method: result.payment.method,
      gateway: 'razorpay',
      gatewayTransactionId: paymentId,
      status: 'successful',
      metadata: {
        orderId,
        email: result.payment.email,
        contact: result.payment.contact
      },
      signature
    });

    // Update booking payment status
    await updateBookingPayment(bookingId, payment);

    res.json({
      success: true,
      data: payment,
      message: 'Payment successful'
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/payments/webhook/stripe
// @desc    Stripe webhook endpoint
// @access  Public (no auth - webhook)
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      logger.error(`Stripe webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handlePaymentSuccess(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await handlePaymentFailure(failedPayment);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// @route   GET /api/payments
// @desc    Get all payments (admin) or user's payments
// @access  Admin/User
router.get('/', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, bookingId } = req.query;

    const query = {};

    // Role-based filtering
    if (req.user.role === 'customer') {
      query['customer.userId'] = req.user._id;
    }

    if (status) query.status = status;
    if (bookingId) query.bookingId = bookingId;

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const revenue = await Payment.aggregate([
      { $match: { status: 'successful', ...(req.user.role === 'customer' && { 'customer.userId': req.user._id }) } },
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

// @route   GET /api/payments/:id
// @desc    Get payment by ID
// @access  Owner/Admin
router.get('/:id', protect, async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('bookingId', 'bookingId event.name customer.name')
      .populate('customer', 'profile.firstName profile.lastName email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check authorization
    if (req.user.role === 'customer' && payment.customer.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/payments/refund
// @desc    Process refund
// @access  Admin
router.post('/refund', restrictTo('admin'), [
  body('paymentId').notEmpty(),
  body('amount').isFloat({ min: 0.01 }),
  body('reason').notEmpty()
], async (req, res, next) => {
  try {
    const { paymentId, amount, reason, notes } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'successful') {
      return res.status(400).json({
        success: false,
        message: 'Can only refund successful payments'
      });
    }

    // Check refund amount
    const totalRefunded = payment.refunds.reduce((sum, r) => sum + r.amount, 0);
    if (totalRefunded + amount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount exceeds payment amount'
      });
    }

    // Process refund based on gateway
    let refundResult;
    if (payment.gateway === 'stripe') {
      refundResult = await paymentService.refundStripePayment(
        payment.paymentIntentId,
        amount,
        reason
      );
    } else if (payment.gateway === 'razorpay') {
      refundResult = await paymentService.refundRazorpayPayment(
        payment.gatewayTransactionId,
        amount,
        { notes, processedBy: req.user._id.toString() }
      );
    } else {
      // Manual refund
      refundResult = { success: true, refundId: uuidv4() };
    }

    if (!refundResult.success) {
      return res.status(400).json({
        success: false,
        message: refundResult.message
      });
    }

    // Update payment with refund record
    payment.refunds.push({
      amount,
      reason,
      processedBy: req.user._id,
      status: 'processed',
      refundId: refundResult.refundId
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
      message: 'Refund processed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/payments/transactions/receipt/:transactionId
// @desc    Get payment receipt
// @access  Owner/Admin
router.get('/transactions/receipt/:transactionId', protect, async (req, res, next) => {
  try {
    const payment = await Payment.findOne({
      transactionId: req.params.transactionId
    })
    .populate('bookingId', 'bookingId event.name eventDetails.date customer')
    .populate('customer', 'profile.firstName profile.lastName email address');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Authorization check
    if (req.user.role === 'customer' && payment.customer.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Generate receipt data (for frontend to render)
    const receiptData = {
      receiptNumber: payment.invoiceNumber || `RCP-${payment.transactionId}`,
      date: payment.createdAt,
      paymentMethod: paymentService.getPaymentMethodDisplay(payment.method),
      customer: {
        name: payment.customer.profile.firstName + ' ' + payment.customer.profile.lastName,
        email: payment.customer.email,
        address: payment.customer.address
      },
      eventName: payment.bookingId.event.name,
      bookingId: payment.bookingId.bookingId,
      eventDate: payment.bookingId.eventDetails.date,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      transactionId: payment.transactionId,
      gateway: payment.gateway,
      refunds: payment.refunds
    };

    res.json({
      success: true,
      data: receiptData
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to update booking payment status
async function updateBookingPayment(bookingId, payment) {
  try {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      logger.error(`Booking ${bookingId} not found for payment update`);
      return;
    }

    // Add payment to booking
    booking.payment.transactions.push({
      transactionId: payment.transactionId,
      amount: payment.amount,
      method: payment.method,
      gateway: payment.gateway,
      status: payment.status,
      paidAt: new Date()
    });

    // Update payment status
    const totalPaid = booking.payment.transactions.reduce((sum, t) => sum + t.amount, 0);

    if (totalPaid >= booking.pricing.totalAmount) {
      booking.payment.status = 'paid';
      booking.payment.advancePaid = booking.pricing.totalAmount;
      booking.payment.dueAmount = 0;

      // Update booking status to confirmed if pending
      if (booking.status === 'pending') {
        booking.status = 'confirmed';
      }
    } else {
      booking.payment.status = 'partial';
      booking.payment.advancePaid = totalPaid;
      booking.payment.dueAmount = booking.pricing.totalAmount - totalPaid;
    }

    booking.payment.method = payment.method;
    booking.payment.lastPaymentAttempt = new Date();

    await booking.save();

    // Send confirmation email
    try {
      await emailService.sendPaymentReceiptEmail(
        booking.customer.email,
        booking.customer.name,
        payment,
        booking
      );
      logger.info(`Payment receipt email sent to ${booking.customer.email}`);
    } catch (emailError) {
      logger.error('Failed to send payment email:', emailError);
    }

    logger.info(`Booking ${bookingId} payment updated: ${payment.status}`);
  } catch (error) {
    logger.error('Error updating booking payment:', error);
  }
}

// Helper function to handle Stripe payment success
async function handlePaymentSuccess(paymentIntent) {
  try {
    const bookingId = paymentIntent.metadata.bookingId;
    const amount = paymentIntent.amount / 100; // Convert from cents/paise

    const payment = await Payment.create({
      transactionId: paymentIntent.id,
      bookingId,
      customer: {
        userId: paymentIntent.metadata.customerId,
        name: paymentIntent.metadata.customerName,
        email: paymentIntent.metadata.customerEmail
      },
      amount,
      currency: paymentIntent.currency.toUpperCase(),
      method: 'card', // Could extract from paymentIntent
      gateway: 'stripe',
      gatewayTransactionId: paymentIntent.charges.data[0].id,
      status: 'successful',
      receiptUrl: `/receipts/${paymentIntent.id}`,
      metadata: paymentIntent.metadata
    });

    await updateBookingPayment(bookingId, payment);
    logger.info(`Stripe payment successful for booking ${bookingId}`);
  } catch (error) {
    logger.error('Error handling Stripe payment success:', error);
  }
}

// Helper function to handle Stripe payment failure
async function handlePaymentFailure(paymentIntent) {
  try {
    const bookingId = paymentIntent.metadata.bookingId;

    logger.warn(`Payment failed for booking ${bookingId}: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`);
  } catch (error) {
    logger.error('Error handling Stripe payment failure:', error);
  }
}

module.exports = router;
