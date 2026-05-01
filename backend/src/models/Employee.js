const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeId: {
    type: String,
    unique: true,
    trim: true
  },
  department: {
    type: String,
    enum: ['Event Management', 'Operations', 'Finance', 'Marketing', 'Hospitality', 'Security'],
    required: true
  },
  designation: {
    type: String,
    required: true,
    trim: true
  },
  specializations: [{
    type: String,
    enum: [
      'wedding', 'birthday', 'corporate', 'party', 'religious',
      'college-fest', 'music-concert', 'sports-event', 'product-launch'
    ]
  }],
  skills: [{
    type: String,
    trim: true
  }],
  experience: {
    type: Number,
    min: 0,
    max: 50,
    default: 0
  },
  salary: {
    type: Number,
    min: 0
  },
  joiningDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'on-leave', 'inactive'],
    default: 'active'
  },
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    unavailabilityDates: [{
      type: Date
    }],
    totalWorkingHoursPerWeek: {
      type: Number,
      default: 48
    }
  },
  performance: {
    tasksCompleted: {
      type: Number,
      default: 0
    },
    tasksOnTime: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    customerFeedbackCount: {
      type: Number,
      default: 0
    }
  },
  documents: {
    resume: String,
    idProof: String,
    addressProof: String,
    offerLetter: String,
    nda: String,
    experienceCertificates: [String]
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  shiftPreference: {
    type: String,
    enum: ['morning', 'evening', 'night', 'flexible'],
    default: 'flexible'
  },
  workHistory: [{
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    role: String,
    tasksCompleted: Number,
    duration: Number, // days
    rating: Number
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
employeeSchema.index({ user: 1 });
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ designation: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ 'performance.averageRating': -1 });
employeeSchema.index({ specializations: 1 });

// Generate employee ID before saving
employeeSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    const prefix = 'EMP';
    const count = await this.constructor.countDocuments();
    this.employeeId = `${prefix}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Calculate on-time completion rate
employeeSchema.virtual('onTimeRate').get(function() {
  if (this.performance.tasksCompleted === 0) return 0;
  return ((this.performance.tasksOnTime / this.performance.tasksCompleted) * 100).toFixed(2);
});

// Get current active tasks
employeeSchema.virtual('activeTasksCount', function() {
  // This will be populated from Task model
  return 0; // Virtual field - calculated in queries
});

module.exports = mongoose.model('Employee', employeeSchema);
