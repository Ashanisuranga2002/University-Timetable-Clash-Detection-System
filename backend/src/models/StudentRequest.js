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
    conflictDetails: {
        type: String,
        trim: true
    },
    conflictDay: { type: String, trim: true },
    conflictStartTime: { type: String, trim: true },
    conflictEndTime: { type: String, trim: true },
    reason: {
        type: String,
        required: [true, 'Reason for the request is required'],
        trim: true
    },
    // The request owner changes as it moves through the workflow. Keeping this
    // separate from status lets the dashboards show their own queue.
    requestType: {
        type: String,
        enum: ['COORDINATOR_CHANGE', 'ADVISOR_APPROVAL'],
        default: 'COORDINATOR_CHANGE',
        index: true
    },
    workflowStatus: {
        type: String,
        enum: ['PENDING_COORDINATOR', 'PENDING_ADVISOR', 'APPROVED'],
        default: 'PENDING_COORDINATOR',
        index: true
    },
    lastDecision: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    coordinatorId: { type: String, trim: true },
    coordinatorNotes: { type: String, trim: true },
    advisorId: { type: String, trim: true },
    advisorNotes: { type: String, trim: true },
    proposedDay: { type: String, trim: true },
    proposedStartTime: { type: String, trim: true },
    proposedEndTime: { type: String, trim: true },
    proposedVenue: { type: String, trim: true },
    proposedSubgroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseGroup' },
    courseIds: [{ type: String, trim: true }],
    selectedSlots: { type: Map, of: String },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('StudentRequest', studentRequestSchema);
