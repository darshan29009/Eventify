const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    trim: true
  },
  customer: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    phone: {
      type: String,
      default: ''
    }
  },
  event: {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    packageName: {
      type: String,
      required: true
    },
    packagePrice: {
      type: Number,
      required: true
    }
  },
  eventDetails: {
    eventType: {
      type: String,
      required: true
    },
    subType: String,
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String
    },
    duration: {
      type: String,
      required: true
    },
    venue: {
      name: {
        type: String,
        required: true
      },
      address: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: String,
      pincode: String,
      mapUrl: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    expectedGuests: {
      type: Number,
      required: true,
      min: 1
    },
    specialRequirements: {
      type: String,
      maxlength: 2000
    },
    customizations: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  pricing: {
    basePrice: {
      type: Number,
      required: true
    },
    additionalCharges: [{
      item: {
        type: String,
        required: true
      },
      description: String,
      quantity: {
        type: Number,
        default: 1
      },
      unitPrice: {
        type: Number,
        required: true
      },
      total: {
        type: Number,
        required: true
      }
    }],
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    discountType: {
      type: String,
      enum: ['fixed', 'percentage'],
      default: 'fixed'
    },
    discountCode: String,
    subtotal: {
      type: Number,
      required: true
    },
    tax: {
      type: Number,
      required: true
    },
    taxRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    totalAmount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  payment: {
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded', 'cancelled'],
      default: 'pending'
    },
    requiredAdvance: {
      type: Number,
      default: 0
    },
    advancePaid: {
      type: Number,
      default: 0
    },
    dueAmount: {
      type: Number,
      default: 0
    },
    paymentDeadline: Date,
    method: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'wallet', 'emi', 'cash', 'cheque']
    },
    transactions: [{
      transactionId: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      method: {
        type: String,
        required: true
      },
      gateway: {
        type: String,
        default: 'stripe'
      },
      status: {
        type: String,
        enum: ['pending', 'processing', 'successful', 'failed', 'refunded'],
        required: true
      },
      gatewayResponse: mongoose.Schema.Types.Mixed,
      receiptUrl: String,
      paidAt: Date,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    refunds: [{
      amount: {
        type: Number,
        required: true
      },
      reason: {
        type: String,
        required: true
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
      refundId: String
    }],
    lastPaymentAttempt: Date
  },
  assignedTeam: [{
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      required: true
    },
    assignedTasks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    }],
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: [
      'pending',           // Booking requested, awaiting confirmation
      'confirmed',         // Booking confirmed by admin
      'planning',          // Planning phase
      'in-progress',      // Event preparation in progress
      'completed',        // Event successfully completed
      'cancelled',        // Cancelled by customer/admin
      'no-show'           // Customer didn't show up
    ],
    default: 'pending'
  },
  progress: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    milestones: [{
      name: {
        type: String,
        required: true
      },
      description: String,
      completed: {
        type: Boolean,
        default: false
      },
      completedAt: Date,
      order: {
        type: Number,
        default: 0
      }
    }],
    lastUpdated: Date
  },
  timeline: [{
    status: {
      type: String,
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  attachments: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['contract', 'receipt', 'customization', 'other']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  notes: {
    type: String,
    maxlength: 5000
  },
  termsAccepted: {
    type: Boolean,
    default: false
  },
  acceptedAt: Date,
  contractUrl: String,
  contractSigned: {
    type: Boolean,
    default: false
  },
  contractSignedAt: Date,
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      maxlength: 2000
    },
    categories: {
      venue: Number,
      service: Number,
      value: Number,
      organization: Number
    },
    photos: [String],
    submittedAt: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date,
  cancellationReason: String,
  reminderSettings: {
    sendReminders: {
      type: Boolean,
      default: true
    },
    reminderFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'custom'],
      default: 'weekly'
    },
    customReminderDays: [Number]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ 'customer.userId': 1 });
bookingSchema.index({ 'customer.email': 1 });
bookingSchema.index({ 'event.eventId': 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ 'eventDetails.date': 1 });
bookingSchema.index({ 'eventDetails.city': 1 });
bookingSchema.index({ 'payment.status': 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ 'assignedTeam.employee': 1 });
bookingSchema.index({ 'progress.percentage': 1 });

// Generate booking ID before saving
bookingSchema.pre('save', async function(next) {
  if (!this.bookingId) {
    const prefix = 'BKG';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const bookingPrefix = `${prefix}${year}${month}`;

    let sequence = await this.constructor.countDocuments({
      bookingId: { $regex: `^${bookingPrefix}` }
    });

    let nextBookingId = '';
    let exists = true;

    while (exists) {
      sequence += 1;
      const serial = String(sequence).padStart(5, '0');
      nextBookingId = `${bookingPrefix}${serial}`;
      exists = await this.constructor.exists({ bookingId: nextBookingId });
    }

    this.bookingId = nextBookingId;
  }
  next();
});

// Calculate due amount before saving
bookingSchema.pre('save', function(next) {
  if (this.pricing) {
    this.pricing.subtotal = this.pricing.basePrice +
      (this.pricing.additionalCharges || []).reduce((sum, item) => sum + item.total, 0);

    let discountAmount = 0;
    if (this.pricing.discount) {
      if (this.pricing.discountType === 'percentage') {
        discountAmount = (this.pricing.subtotal * this.pricing.discount) / 100;
      } else {
        discountAmount = this.pricing.discount;
      }
    }

    this.pricing.totalAmount = this.pricing.subtotal - discountAmount + this.pricing.tax;
  }
  next();
});

// Update due amount when payment changes
bookingSchema.pre('save', function(next) {
  if (this.payment) {
    this.payment.dueAmount = this.pricing.totalAmount - this.payment.advancePaid;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
