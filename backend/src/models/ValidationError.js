import { Schema, model } from 'mongoose';
const slotSchema = new Schema({
  subgroup: {
    type: String,
    required: true
  },
  day: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  venue: {
    type: String,
    required: true
  }
}, {
  _id: false
});
const auditSchema = new Schema({
  action: {
    type: String,
    required: true
  },
  actorId: String,
  actorName: String,
  details: {
    type: String,
    required: true,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  _id: false
});
const validationErrorSchema = new Schema({
  timetableId: {
    type: Schema.Types.ObjectId,
    ref: 'Timetable',
    required: true
  },
  validationResultId: {
    type: Schema.Types.ObjectId,
    ref: 'ValidationResult'
  },
  issueKey: {
    type: String,
    required: true,
    maxlength: 240
  },
  subgroupId: {
    type: Schema.Types.ObjectId,
    ref: 'Subgroup'
  },
  relatedSubgroupId: {
    type: Schema.Types.ObjectId,
    ref: 'Subgroup'
  },
  studentId: {
    type: String,
    trim: true,
    uppercase: true
  },
  studentName: {
    type: String,
    trim: true
  },
  moduleCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  moduleName: {
    type: String,
    required: true,
    trim: true
  },
  errorType: {
    type: String,
    enum: ['CLASH', 'CAPACITY', 'LECTURER_CONFLICT', 'VENUE_CONFLICT'],
    required: true
  },
  severity: {
    type: String,
    enum: ['SEV-1', 'SEV-2', 'SEV-3'],
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  currentSlot: {
    type: slotSchema,
    required: true
  },
  recommendedSlot: {
    type: String,
    trim: true,
    maxlength: 30
  },
  status: {
    type: String,
    enum: ['unresolved', 'in_progress', 'resolved'],
    default: 'unresolved',
    required: true
  },
  advisor: {
    type: String,
    trim: true,
    maxlength: 160
  },
  justification: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  coordinatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  cohortBatch: {
    type: Boolean,
    default: false
  },
  sendNotification: {
    type: Boolean,
    default: false
  },
  resolvedAt: Date,
  auditLog: {
    type: [auditSchema],
    default: []
  }
}, {
  timestamps: true,
  versionKey: false
});
validationErrorSchema.index({
  issueKey: 1
}, {
  unique: true
});
validationErrorSchema.index({
  timetableId: 1,
  status: 1,
  createdAt: -1
});
validationErrorSchema.index({
  severity: 1
});
validationErrorSchema.index({
  errorType: 1
});
validationErrorSchema.index({
  studentId: 1
});
export const ValidationError = model('ValidationError', validationErrorSchema);
