const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  customer: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: String,
    email: String,
    phone: String
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  method: {
    type: String,
    enum: [
      'card', 'upi', 'netbanking', 'wallet', 'emi', 'cash',
      'cheque', 'bank-transfer', 'other'
    ],
    required: true
  },
  gateway: {
    type: String,
    default: 'stripe',
    enum: ['stripe', 'razorpay', 'manual']
  },
  gatewayTransactionId: String,
  status: {
    type: String,
    enum: [
      'pending', 'processing', 'successful',
      'failed', 'refunded', 'partially-refunded', 'cancelled'
    ],
    required: true,
    default: 'pending'
  },
  metadata: {
    cardLastFour: String,
    cardBrand: String,
    bankName: String,
    upiId: String,
    walletName: String,
    emiPlan: String,
    emiMonths: Number,
    customerName: String,
    customerEmail: String,
    customFields: mongoose.Schema.Types.Mixed
  },
  webhookData: mongoose.Schema.Types.Mixed,
  paymentIntentId: String, // Stripe payment intent ID
  clientSecret: String, // Stripe client secret (temporary)
  receiptUrl: String,
  invoiceNumber: String,
  refunds: [{
    amount: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      required: true,
      enum: [
        'requested_by_customer',
        'duplicate_payment',
        'product_unavailable',
        'cancellation',
        'fraud',
        'other'
      ]
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    processedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending'
    },
    refundId: String,
    gatewayRefundId: String,
    notes: String
  }],
  failureReason: {
    code: String,
    message: String,
    declineCode: String
  },
  retryCount: {
    type: Number,
    default: 0
  },
  lastRetryAt: Date,
  ipAddress: String,
  userAgent: String,
  signature: String // For webhook verification
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ 'customer.userId': 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ method: 1 });
paymentSchema.index({ gatewayTransactionId: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ 'metadata.cardLastFour': 1 });
paymentSchema.index({ 'metadata.upiId': 1 });

// Calculate total refunded amount
paymentSchema.virtual('totalRefunded').get(function() {
  if (!this.refunds || this.refunds.length === 0) return 0;
  return this.refunds.reduce((sum, refund) => sum + refund.amount, 0);
});

// Check if fully refunded
paymentSchema.virtual('isFullyRefunded').get(function() {
  return this.totalRefunded >= this.amount;
});

// Calculate net amount after refunds
paymentSchema.virtual('netAmount').get(function() {
  return this.amount - this.totalRefunded;
});

module.exports = mongoose.model('Payment', paymentSchema);
