import { Schema, model } from 'mongoose';
const subgroupSchema = new Schema({
  studentId: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 30
  },
  studentName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  program: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  moduleCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 30
  },
  moduleName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160
  },
  subgroup: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 30
  },
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  startTime: {
    type: String,
    required: true,
    match: /^(?:[01]\d|2[0-3]):[0-5]\d$/
  },
  endTime: {
    type: String,
    required: true,
    match: /^(?:[01]\d|2[0-3]):[0-5]\d$/
  },
  venue: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  lecturerName: {
    type: String,
    trim: true,
    maxlength: 120
  },
  timetableId: {
    type: Schema.Types.ObjectId,
    ref: 'Timetable',
    required: true
  },
  sourceFileName: {
    type: String,
    trim: true,
    maxlength: 255
  },
  sourceFileSize: {
    type: Number,
    min: 0
  },
  uploadBatchId: {
    type: String,
    trim: true,
    maxlength: 80
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    required: true
  }
}, {
  timestamps: true,
  versionKey: false
});
subgroupSchema.index({
  studentId: 1
});
subgroupSchema.index({
  moduleCode: 1
});
subgroupSchema.index({
  timetableId: 1
});
subgroupSchema.index({
  subgroup: 1
});
subgroupSchema.index({
  status: 1
});
subgroupSchema.index({
  timetableId: 1,
  day: 1,
  startTime: 1
});
subgroupSchema.index({
  uploadBatchId: 1,
  createdAt: -1
});
export const Subgroup = model('Subgroup', subgroupSchema);
