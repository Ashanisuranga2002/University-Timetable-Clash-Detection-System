const StudentRequest = require('../models/StudentRequest');

// CREATE: Submit a new request to change a course group
exports.createRequest = async (req, res) => {
    try {
        const {
            studentId,
            courseCode,
            currentGroup,
            requestedGroup,
            conflictDetails,
            conflictDay,
            conflictStartTime,
            conflictEndTime,
            reason,
            requestType = 'COORDINATOR_CHANGE',
            courseIds,
            selectedSlots,
        } = req.body;

        if (!['COORDINATOR_CHANGE', 'ADVISOR_APPROVAL'].includes(requestType)) {
            return res.status(400).json({ message: 'Invalid request type' });
        }

        const newRequest = new StudentRequest({
            studentId,
            courseCode: courseCode?.toUpperCase(),
            currentGroup,
            requestedGroup,
            conflictDetails,
            conflictDay,
            conflictStartTime,
            conflictEndTime,
            reason,
            requestType,
            workflowStatus: requestType === 'ADVISOR_APPROVAL' ? 'PENDING_ADVISOR' : 'PENDING_COORDINATOR',
            status: 'PENDING',
            lastDecision: 'PENDING',
            courseIds: Array.isArray(courseIds) ? courseIds : undefined,
            selectedSlots: selectedSlots && typeof selectedSlots === 'object' ? selectedSlots : undefined,
        });

        const savedRequest = await newRequest.save();
        res.status(201).json({ message: 'Request submitted successfully', request: savedRequest });
    } catch (error) {
        res.status(400).json({ message: 'Error submitting request', error: error.message });
    }
};

// READ: View all submitted requests (for Advisor Dashboard)
exports.getAllRequests = async (req, res) => {
    try {
        const filter = {};
        if (req.query.requestType) filter.requestType = req.query.requestType;
        if (req.query.workflowStatus) filter.workflowStatus = req.query.workflowStatus;
        if (req.query.advisorHistory === 'true') {
            // Before workflow stages existed, student subgroup requests went
            // directly to the advisor. Move those pending records into the
            // advisor queue so they remain reviewable after this upgrade.
            await StudentRequest.updateMany(
                {
                    requestType: { $exists: false },
                    workflowStatus: { $exists: false },
                    status: 'PENDING',
                },
                {
                    $set: {
                        requestType: 'ADVISOR_APPROVAL',
                        workflowStatus: 'PENDING_ADVISOR',
                        lastDecision: 'PENDING',
                    },
                }
            );
            filter.$or = [
                { requestType: 'ADVISOR_APPROVAL' },
                { advisorId: { $exists: true, $ne: '' } },
            ];
        }
        const requests = await StudentRequest.find(filter).sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching all requests', error: error.message });
    }
};

// READ: View all submitted requests for a specific student
exports.getStudentRequests = async (req, res) => {
    try {
        const { studentId } = req.params;
        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }
        
        // Find all requests matching the student ID (case-insensitive) and sort by newest first
        const requests = await StudentRequest.find({
            studentId: { $regex: new RegExp(`^${studentId.trim()}$`, 'i') }
        }).sort({ createdAt: -1 });
        
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching requests', error: error.message });
    }
};

// READ: View a specific request by its ID
exports.getRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await StudentRequest.findById(id);
        
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        
        res.status(200).json(request);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching request details', error: error.message });
    }
};

// UPDATE: Edit a request that has not yet been reviewed (approved/rejected)
exports.updateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { studentId, requestedGroup, reason, conflictDetails } = req.body;
        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }

        const request = await StudentRequest.findOne({
            _id: id,
            studentId: { $regex: new RegExp(`^${studentId.trim()}$`, 'i') }
        });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Rule: Only allow updates before the request is approved or rejected by the advisor
        const isFinalized = request.status === 'APPROVED' || request.status === 'REJECTED' ||
                            request.lastDecision === 'APPROVED' || request.lastDecision === 'REJECTED';
        if (isFinalized) {
            return res.status(403).json({ 
                message: `Cannot update request. The advisor has already ${request.lastDecision?.toLowerCase() || request.status.toLowerCase()} it.` 
            });
        }

        // Apply updates
        if (typeof requestedGroup === 'string' && requestedGroup.trim()) {
            request.requestedGroup = requestedGroup.trim();
        }
        if (typeof reason === 'string' && reason.trim()) {
            request.reason = reason.trim();
        }
        if (typeof conflictDetails === 'string' && conflictDetails.trim()) {
            request.conflictDetails = conflictDetails.trim();
        }

        const updatedRequest = await request.save();
        res.status(200).json({ message: 'Request updated successfully', request: updatedRequest });
    } catch (error) {
        res.status(400).json({ message: 'Error updating request', error: error.message });
    }
};

// DELETE: Cancel a pending request before it is approved or rejected
exports.deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { studentId } = req.body || {};
        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }

        const request = await StudentRequest.findOne({
            _id: id,
            studentId: { $regex: new RegExp(`^${studentId.trim()}$`, 'i') }
        });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Rule: Only allow deletion if the request has not yet been approved or rejected
        const isFinalized = request.status === 'APPROVED' || request.status === 'REJECTED' ||
                            request.lastDecision === 'APPROVED' || request.lastDecision === 'REJECTED';
        if (isFinalized) {
            return res.status(403).json({ 
                message: 'This request has already been reviewed by the advisor and cannot be deleted.'
            });
        }

        // Delete the request document
        await StudentRequest.deleteOne({ _id: id });

        // Clean up any linked draft advisor review
        try {
            const AdvisorReview = require('../models/AdvisorReview');
            if (AdvisorReview) {
                await AdvisorReview.deleteMany({ requestId: id });
            }
        } catch (_) {}

        res.status(200).json({ message: 'Request cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting request', error: error.message });
    }
};
