// backend/src/models/StudentRequest.js
const mongoose = require('mongoose');

const studentRequestSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: [true, 'Student ID is required'],
        trim: true
    },
    courseCode: {
        type: String,
        required: [true, 'Course code is required'],
        trim: true
    },
    currentGroup: {
        type: String,
        required: [true, 'Current group is required'],
        trim: true
    },
    requestedGroup: {
        type: String,
        required: [true, 'Requested alternative group is required'],
        trim: true
    },
    reason: {
        type: String,
        required: [true, 'Reason for the request is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('StudentRequest', studentRequestSchema);