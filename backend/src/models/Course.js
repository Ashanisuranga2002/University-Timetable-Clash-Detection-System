const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    courseName: {
      type: String,
      required: true,
      trim: true,
    },

    credits: {
      type: Number,
      required: true,
      min: 0,
    },

    semester: {
      type: Number,
      required: true,
    },

    type: {
      type: String,
      enum: ["Core", "Elective"],
      required: true,
    },

    lecturer: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    schedule: [
      {
        day: { type: String, trim: true },
        startTime: { type: String, trim: true },
        endTime: { type: String, trim: true },
        room: { type: String, trim: true },
        type: { type: String, trim: true }, // e.g. 'Lecture', 'Lab'
      },
    ],

    slots: [
      {
        slotName: { type: String, trim: true }, // e.g. 'Slot A', 'Slot B'
        day: { type: String, trim: true },
        startTime: { type: String, trim: true },
        endTime: { type: String, trim: true },
        room: { type: String, trim: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Course", courseSchema);