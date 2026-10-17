// backend/src/routes/advisorReviewRoutes.js
const express = require('express');
const router = express.Router();

// Import the controller functions
const {
    createReview,
    getAdvisorReviews,
    updateReview,
    deleteReview
} = require('../controllers/advisorReviewController');

// CREATE: Create a new review record for a student request (DRAFT or SUBMITTED)
// Route: POST /api/advisor-reviews
router.post('/', createReview);

// READ: View all reviews (drafts and submitted) created by a specific advisor
// Route: GET /api/advisor-reviews/:advisorId
router.get('/:advisorId', getAdvisorReviews);

// UPDATE: Edit a draft review or its comments
// Route: PUT /api/advisor-reviews/:id
router.put('/:id', updateReview);

// DELETE: Delete an unfinished draft review
// Route: DELETE /api/advisor-reviews/:id
router.delete('/:id', deleteReview);

module.exports = router;