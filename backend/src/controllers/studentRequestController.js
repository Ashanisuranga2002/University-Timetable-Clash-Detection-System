const StudentRequest = require('../models/StudentRequest');

// CREATE: Submit a new request to change a course group
exports.createRequest = async (req, res) => {
    try {
        const { studentId, courseCode, currentGroup, requestedGroup, reason } = req.body;

        const newRequest = new StudentRequest({
            studentId,
            courseCode,
            currentGroup,
            requestedGroup,
            reason
        });

        const savedRequest = await newRequest.save();
        res.status(201).json({ message: 'Request submitted successfully', request: savedRequest });
    } catch (error) {
        res.status(400).json({ message: 'Error submitting request', error: error.message });
    }
};

// READ: View all submitted requests for a specific student
exports.getStudentRequests = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        // Find all requests matching the student ID and sort by newest first
        const requests = await StudentRequest.find({ studentId }).sort({ createdAt: -1 });
        
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching requests', error: error.message });
    }
};

// UPDATE: Edit a request that has not yet been reviewed
exports.updateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { requestedGroup, reason } = req.body;

        // 1. Find the existing request
        const request = await StudentRequest.findById(id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // 2. Enforce the business rule: Only allow updates if the status is PENDING
        if (request.status !== 'PENDING') {
            return res.status(403).json({ 
                message: `Cannot update request. The advisor has already ${request.status.toLowerCase()} it.` 
            });
        }

        // 3. Apply the updates
        request.requestedGroup = requestedGroup || request.requestedGroup;
        request.reason = reason || request.reason;

        const updatedRequest = await request.save();
        res.status(200).json({ message: 'Request updated successfully', request: updatedRequest });
    } catch (error) {
        res.status(400).json({ message: 'Error updating request', error: error.message });
    }
};

// DELETE: Cancel a pending request
exports.deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Find the existing request
        const request = await StudentRequest.findById(id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // 2. Enforce the business rule: Only allow deletion if the status is PENDING
        if (request.status !== 'PENDING') {
            return res.status(403).json({ 
                message: `Cannot delete request. The advisor has already ${request.status.toLowerCase()} it.` 
            });
        }

        // 3. Delete the document
        await StudentRequest.findByIdAndDelete(id);
        res.status(200).json({ message: 'Request cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting request', error: error.message });
    }
};