// backend/src/models/AdvisorReview.js
const mongoose = require('mongoose');

const advisorReviewSchema = new mongoose.Schema({
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentRequest', // Links this review to the specific student request
        required: [true, 'Associated Student Request ID is required']
    },
    advisorId: {
        type: String,
        required: [true, 'Advisor ID is required'],
        trim: true
    },
    comments: {
        type: String,
        required: [true, 'Review comments are required'],
        trim: true
    },
    decision: {
        type: String,
        enum: ['APPROVED', 'REJECTED', 'PENDING'],
        default: 'PENDING'
    },
    reviewStatus: {
        type: String,
        enum: ['DRAFT', 'SUBMITTED'],
        default: 'DRAFT'
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('AdvisorReview', advisorReviewSchema);