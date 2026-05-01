const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true // One review per booking
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  customer: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: String,
    email: String
  },
  rating: {
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be an integer'
      }
    },
    venue: {
      type: Number,
      min: 1,
      max: 5
    },
    service: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: Number,
      min: 1,
      max: 5
    },
    organization: {
      type: Number,
      min: 1,
      max: 5
    },
    staff: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  review: {
    type: String,
    required: true,
    maxlength: 2000,
    trim: true
  },
  title: {
    type: String,
    maxlength: 200,
    trim: true
  },
  photos: [{
    url: {
      type: String,
      required: true
    },
    caption: String,
    order: {
      type: Number,
      default: 0
    }
  }],
  video: {
    url: String,
    thumbnail: String
  },
  recommended: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  helpfulVotes: {
    type: Number,
    default: 0
  },
  helpfulVoters: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    votedAt: Date
  }],
  reply: {
    text: String,
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    repliedAt: Date,
    isFromAdmin: {
      type: Boolean,
      default: false
    }
  },
  tags: [{
    type: String,
    enum: ['great-service', 'value-money', 'well-organized', 'amazing-venue', 'friendly-staff', 'could-improve']
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
reviewSchema.index({ bookingId: 1 });
reviewSchema.index({ eventId: 1 });
reviewSchema.index({ 'customer.userId': 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ isPublished: 1 });
reviewSchema.index({ helpfulVotes: -1 });
reviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
