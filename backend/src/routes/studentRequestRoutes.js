// backend/src/routes/studentRequestRoutes.js
const express = require('express');
const router = express.Router();

// Import the controller functions
const {
    createRequest,
    getAllRequests,
    getStudentRequests,
    updateRequest,
    deleteRequest
} = require('../controllers/studentRequestController');

// READ: View all submitted requests (for Advisor Dashboard)
// Route: GET /api/student-requests/all
router.get('/all', getAllRequests);

// CREATE: Submit a new request to change a course group
// Route: POST /api/student-requests
router.post('/', createRequest);

// READ: View all submitted requests for a specific student
// Route: GET /api/student-requests/:studentId
router.get('/:studentId', getStudentRequests);

// UPDATE: Edit a request that has not yet been reviewed
// Route: PUT /api/student-requests/:id
router.put('/:id', updateRequest);

// DELETE: Cancel a pending request
// Route: DELETE /api/student-requests/:id
router.delete('/:id', deleteRequest);

module.exports = router;