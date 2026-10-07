import { Schema, model } from 'mongoose';
const venueSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  capacity: {
    type: Number,
    min: 1
  },
  type: {
    type: String,
    trim: true,
    maxlength: 80
  }
}, {
  _id: false
});
const timetableSchema = new Schema({
  sessions: {
    type: [new Schema({
      moduleCode: {
        type: String,
        required: true
      },
      moduleName: {
        type: String,
        required: true
      },
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
      },
      lecturerName: String
    }, {
      _id: false
    })],
    default: undefined
  },
  academicYear: {
    type: String,
    required: true,
    trim: true,
    match: /^\d{4}\/\d{4}$/
  },
  semester: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80
  },
  faculty: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160
  },
  fileName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  fileSize: {
    type: Number,
    required: true,
    min: 0
  },
  fileUrl: {
    type: String,
    trim: true,
    maxlength: 2048
  },
  sheetsDetected: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  allocatedSlots: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  venues: {
    type: [venueSchema],
    default: []
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'processed', 'failed'],
    default: 'uploaded',
    required: true
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  versionKey: false
});
timetableSchema.index({
  academicYear: 1,
  semester: 1
});
timetableSchema.index({
  status: 1,
  createdAt: -1
});
timetableSchema.index({
  uploadedBy: 1
});
export const Timetable = model('Timetable', timetableSchema);
