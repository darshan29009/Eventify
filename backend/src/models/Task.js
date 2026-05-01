const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskId: {
    type: String,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  type: {
    type: String,
    enum: [
      'planning',      // Planning and coordination
      'setup',         // Physical setup/decorations
      'coordination',  // Vendor/client coordination
      'deliverable',   // Deliverables (photos, videos, reports)
      'documentation', // Paperwork, permits
      'maintenance',   // Equipment maintenance
      'other'
    ],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  event: {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    }
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'blocked', 'completed'],
    default: 'todo'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  subtasks: [{
    title: {
      type: String,
      required: true
    },
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
  deadline: {
    type: Date,
    required: true
  },
  estimatedHours: {
    type: Number,
    min: 0,
    default: 1
  },
  actualHours: {
    type: Number,
    min: 0
  },
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
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
      enum: ['image', 'video', 'document', 'other']
    },
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true
    },
    attachments: [{
      name: String,
      url: String
    }],
    isInternal: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  notifications: [{
    type: {
      type: String,
      enum: ['assignment', 'deadline-reminder', 'status-change', 'comment', 'escalation'],
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    },
    channel: {
      type: String,
      enum: ['email', 'sms', 'in-app', 'push'],
      default: 'in-app'
    }
  }],
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  blockReason: {
    type: String,
    maxlength: 2000
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  blockedAt: Date,
  extensionRequested: {
    type: Boolean,
    default: false
  },
  extensionReason: String,
  extensionRequestedAt: Date,
  extensionApproved: {
    type: Boolean
  },
  extensionApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  originalDeadline: Date,
  newDeadline: Date,
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: {
      type: Number,
      default: 1
    },
    endDate: Date,
    occurrences: Number
  },
  parentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  childTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  estimatedCost: {
    type: Number,
    min: 0
  },
  actualCost: {
    type: Number,
    min: 0
  },
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
taskSchema.index({ taskId: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ 'assignedBy': 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ deadline: 1 });
taskSchema.index({ 'event.eventId': 1 });
taskSchema.index({ 'event.bookingId': 1 });
taskSchema.index({ progress: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ completedAt: -1 });

// Generate task ID before saving
taskSchema.pre('save', async function(next) {
  if (!this.taskId) {
    const prefix = 'TSK';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
      }
    });
    const serial = String(count + 1).padStart(5, '0');
    this.taskId = `${prefix}${year}${month}${serial}`;
  }
  next();
});

// Calculate if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  return this.deadline < new Date() && this.status !== 'completed';
});

// Calculate days remaining
taskSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Calculate completion percentage based on subtasks
taskSchema.pre('save', function(next) {
  if (this.subtasks && this.subtasks.length > 0) {
    const completedSubtasks = this.subtasks.filter(st => st.completed).length;
    const totalSubtasks = this.subtasks.length;
    const subtaskProgress = (completedSubtasks / totalSubtasks) * 100;

    // If progress is 0 or not set, use subtask progress
    if (this.progress === 0) {
      this.progress = subtaskProgress;
    } else {
      // Combine both: average of manual progress and subtask progress
      this.progress = (this.progress + subtaskProgress) / 2;
    }

    // Round to nearest integer
    this.progress = Math.round(this.progress);
  }

  // If all subtasks are completed, mark as completed
  if (this.subtasks && this.subtasks.length > 0 &&
      this.subtasks.every(st => st.completed)) {
    this.status = 'completed';
    this.progress = 100;
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  }

  next();
});

module.exports = mongoose.model('Task', taskSchema);
