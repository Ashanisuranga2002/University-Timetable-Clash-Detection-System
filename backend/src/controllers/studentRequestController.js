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
        const { studentId, requestedGroup, reason } = req.body;
        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }

        const request = await StudentRequest.findOne({ _id: id, studentId });

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
        if (typeof requestedGroup === 'string' && requestedGroup.trim()) {
            request.requestedGroup = requestedGroup.trim();
        }
        if (typeof reason === 'string' && reason.trim()) {
            request.reason = reason.trim();
        }

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
        const { studentId } = req.body || {};
        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }

        const request = await StudentRequest.findOne({ _id: id, studentId });

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
        await StudentRequest.deleteOne({ _id: id, studentId });
        res.status(200).json({ message: 'Request cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting request', error: error.message });
    }
};
