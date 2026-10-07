import { Schema, model } from 'mongoose';
const validationResultSchema = new Schema({
  timetableId: {
    type: Schema.Types.ObjectId,
    ref: 'Timetable',
    required: true
  },
  totalRecords: {
    type: Number,
    required: true,
    min: 0
  },
  validRecords: {
    type: Number,
    required: true,
    min: 0
  },
  errorRecords: {
    type: Number,
    required: true,
    min: 0
  },
  cleanPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  clashPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  executionTime: {
    type: Number,
    required: true,
    min: 0
  },
  engineVersion: {
    type: String,
    required: true,
    default: '1.0.0'
  },
  status: {
    type: String,
    enum: ['completed', 'completed_with_errors', 'failed'],
    required: true
  }
}, {
  timestamps: true,
  versionKey: false
});
validationResultSchema.index({
  timetableId: 1,
  createdAt: -1
});
export const ValidationResult = model('ValidationResult', validationResultSchema);
