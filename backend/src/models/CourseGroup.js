const mongoose = require('mongoose');

const courseGroupSchema = new mongoose.Schema({
    courseCode: { type: String, required: true },
    courseName: { type: String, required: true },
    groupName: { type: String, required: true },
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    venue: { type: String, required: true },
    capacity: { type: Number, required: true },
    enrolledCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('CourseGroup', courseGroupSchema);