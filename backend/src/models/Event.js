const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true,
    maxlength: [200, 'Event name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  shortDescription: {
    type: String,
    maxlength: 300
  },
  type: {
    type: String,
    enum: [
      'wedding', 'birthday', 'corporate', 'party',
      'religious', 'college-fest', 'music-concert',
      'sports-event', 'product-launch', 'other'
    ],
    required: true
  },
  subType: {
    type: String,
    enum: [
      // Wedding sub-types
      'sangeet', 'mehndi', 'haldi', 'reception', 'marriage', 'engagement',
      // Birthday sub-types
      'kids', 'teen', 'adult', 'milestone', 'surprise',
      // Corporate sub-types
      'conference', 'team-building', 'product-launch', 'annual-day', 'seminar', 'workshop',
      // Party sub-types
      'anniversary', 'housewarming', 'retirement', 'baby-shower', 'gender-reveal',
      // Other
      'puja', 'havan', 'eid', 'christmas', 'navratri', 'ganesh-chaturthi'
    ]
  },
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  virtualTour: {
    type: String,
    default: ''
  },
  packages: [{
    name: {
      type: String,
      required: true,
      enum: ['basic', 'premium', 'luxury', 'custom']
    },
    displayName: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    discountedPrice: {
      type: Number,
      min: 0
    },
    compareAtPrice: {
      type: Number,
      min: 0
    },
    maxGuests: {
      type: Number,
      min: 1
    },
    duration: {
      type: String,
      default: '4 hours'
    },
    includedServices: [{
      name: String,
      description: String,
      icon: String
    }],
    features: [{
      name: String,
      included: {
        type: Boolean,
        default: true
      },
      icon: String
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    packageOrder: {
      type: Number,
      default: 0
    }
  }],
  venues: [{
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
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'India'
    },
    pincode: String,
    capacity: {
      min: {
        type: Number,
        default: 0
      },
      max: {
        type: Number,
        required: true
      }
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    amenities: [String],
    images: [String],
    mapUrl: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    parking: {
      type: Boolean,
      default: false
    },
    parkingDetails: String,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  availability: {
    availableDates: [Date],
    blackoutDates: [Date],
    advanceBookingDays: {
      type: Number,
      default: 365
    },
    minimumAdvanceHours: {
      type: Number,
      default: 24
    }
  },
  servicesIncluded: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    icon: String,
    category: {
      type: String,
      enum: ['venue', 'catering', 'decoration', 'photography', 'music', 'lighting', 'entertainment', 'staffing', 'other']
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  highlights: [{
    type: String
  }],
  includes: [String], // Legacy field
  excludes: [String],
  customizationsAvailable: {
    type: Boolean,
    default: true
  },
  availableCustomizations: [{
    name: String,
    description: String,
    price: Number,
    category: String
  }],
  cancellationPolicy: {
    type: String,
    default: 'Free cancellation up to 7 days before event. 50% refund within 3-7 days. No refund within 3 days.'
  },
  termsAndConditions: {
    type: String
  },
  faqs: [{
    question: String,
    answer: String
  }],
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    ogImage: String
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
    set: (val) => Math.round(val * 10) / 10
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  ratingBreakdown: {
    5: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    1: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredOrder: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  metadata: {
    views: { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
eventSchema.index({ name: 'text', description: 'text', shortDescription: 'text' });
eventSchema.index({ type: 1 });
eventSchema.index({ subType: 1 });
eventSchema.index({ 'venues.city': 1 });
eventSchema.index({ isActive: 1, isFeatured: -1 });
eventSchema.index({ 'packages.price': 1 });
eventSchema.index({ 'averageRating': -1 });
eventSchema.index({ totalBookings: -1 });
eventSchema.index({ createdAt: -1 });
eventSchema.index({ slug: 1 });

// Generate slug before saving
eventSchema.pre('save', async function(next) {
  if (this.isModified('name') || this.isNew) {
    const slugify = require('slugify');
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });

    // Ensure slug is unique
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*)?)$`, 'i');
    const slugFound = await this.constructor.findOne({ slug: slugRegEx });

    if (slugFound) {
      this.slug = `${this.slug}-${Date.now()}`;
    }
  }
  next();
});

// Calculate average price
eventSchema.virtual('lowestPrice').get(function() {
  if (!this.packages || this.packages.length === 0) return 0;
  const activePackages = this.packages.filter(p => p.isActive);
  if (activePackages.length === 0) return 0;
  return Math.min(...activePackages.map(p => p.price));
});

// Get active packages only
eventSchema.virtual('activePackages').get(function() {
  if (!this.packages) return [];
  return this.packages.filter(p => p.isActive);
});

module.exports = mongoose.model('Event', eventSchema);
