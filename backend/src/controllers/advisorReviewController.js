const AdvisorReview = require('../models/AdvisorReview');
const StudentRequest = require('../models/StudentRequest');

// CREATE: Create a review record for a student request (can be saved as DRAFT or SUBMITTED)
exports.createReview = async (req, res) => {
    try {
        const { requestId, advisorId, comments, decision, reviewStatus } = req.body;

        // Check if the request exists and is still pending
        const studentRequest = await StudentRequest.findById(requestId);
        if (!studentRequest) {
            return res.status(404).json({ message: 'Associated student request not found' });
        }
        if (studentRequest.status !== 'PENDING') {
            return res.status(400).json({ message: 'This request has already been processed' });
        }

        const newReview = new AdvisorReview({
            requestId,
            advisorId,
            comments,
            decision,
            reviewStatus
        });

        const savedReview = await newReview.save();

        // If the advisor submits the review immediately, update the student's request status
        if (reviewStatus === 'SUBMITTED') {
            studentRequest.status = decision; 
            await studentRequest.save();
        }

        res.status(201).json({ message: 'Review created successfully', review: savedReview });
    } catch (error) {
        res.status(400).json({ message: 'Error creating review', error: error.message });
    }
};

// READ: View reviews created by a specific advisor (optionally populate the associated student request)
exports.getAdvisorReviews = async (req, res) => {
    try {
        const { advisorId } = req.params;
        
        // Populate pulls in the actual student request data using the requestId reference
        const reviews = await AdvisorReview.find({ advisorId })
            .populate('requestId')
            .sort({ createdAt: -1 });
            
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews', error: error.message });
    }
};

// READ: View a specific review by the Request ID
exports.getReviewByRequestId = async (req, res) => {
    try {
        const { requestId } = req.params;
        const review = await AdvisorReview.findOne({ requestId }).sort({ createdAt: -1 });
        if (!review) {
            return res.status(404).json({ message: 'No review found for this request' });
        }
        res.status(200).json(review);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching review', error: error.message });
    }
};

// UPDATE: Edit a draft review or its comments before submitting the decision
exports.updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { comments, decision, reviewStatus } = req.body;

        // 1. Find the existing review
        const review = await AdvisorReview.findById(id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // 2. Enforce the business rule: Only allow updates if the review is a DRAFT
        if (review.reviewStatus === 'SUBMITTED') {
            return res.status(403).json({ 
                message: 'Cannot edit a submitted review. The decision is final.' 
            });
        }

        // 3. Apply the updates
        review.comments = comments || review.comments;
        review.decision = decision || review.decision;
        review.reviewStatus = reviewStatus || review.reviewStatus;

        const updatedReview = await review.save();

        // 4. If the update changes the status from DRAFT to SUBMITTED, update the StudentRequest
        if (updatedReview.reviewStatus === 'SUBMITTED') {
            await StudentRequest.findByIdAndUpdate(
                updatedReview.requestId, 
                { status: updatedReview.decision }
            );
        }

        res.status(200).json({ message: 'Review updated successfully', review: updatedReview });
    } catch (error) {
        res.status(400).json({ message: 'Error updating review', error: error.message });
    }
};

// DELETE: Delete an unfinished draft review
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Find the existing review
        const review = await AdvisorReview.findById(id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // 2. Enforce the business rule: Only allow deletion if the review is a DRAFT
        if (review.reviewStatus === 'SUBMITTED') {
            return res.status(403).json({ 
                message: 'Cannot delete a submitted review.' 
            });
        }

        // 3. Delete the document
        await AdvisorReview.findByIdAndDelete(id);
        res.status(200).json({ message: 'Draft review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting review', error: error.message });
    }
};