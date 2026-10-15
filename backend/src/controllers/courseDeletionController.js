const CourseDeletionRequest = require('../models/CourseDeletionRequest');
const Registration = require('../models/Registration');
const Clash = require('../models/Clash');
const { detectClashes } = require('../utils/clashDetector');
const { resolveStudent } = require('../utils/studentResolver');

exports.createDeletionRequest = async (req, res) => {
  try {
    const { studentId, courseId, reason } = req.body;

    if (!studentId || !courseId || !reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'studentId, courseId, and reason are required',
      });
    }

    const student = await resolveStudent(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const registration = await Registration.findOne({
      student: student._id,
      semester: student.semester,
    });

    if (!registration || !registration.courses.some((id) => id.toString() === courseId)) {
      return res.status(400).json({
        success: false,
        message: 'This course is not part of the student registration',
      });
    }

    const existing = await CourseDeletionRequest.findOne({
      studentId: student.studentId,
      registrationId: registration._id,
      courseId,
      status: 'PENDING',
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A deletion request for this course is already pending',
        request: existing,
      });
    }

    const request = await CourseDeletionRequest.create({
      studentId: student.studentId,
      registrationId: registration._id,
      courseId,
      reason: reason.trim(),
    });

    return res.status(201).json({
      success: true,
      message: 'Course deletion request submitted to the administrator',
      request,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create deletion request', error: error.message });
  }
};

exports.getStudentDeletionRequests = async (req, res) => {
  try {
    const requests = await CourseDeletionRequest.find({ studentId: req.params.studentId })
      .populate('courseId')
      .sort({ createdAt: -1 });

    return res.json({ success: true, requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load deletion requests', error: error.message });
  }
};

exports.getAdminDeletionRequests = async (_req, res) => {
  try {
    const requests = await CourseDeletionRequest.find()
      .populate('courseId')
      .populate('registrationId')
      .sort({ createdAt: -1 });

    return res.json({ success: true, requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load deletion requests', error: error.message });
  }
};

exports.approveDeletionRequest = async (req, res) => {
  try {
    const request = await CourseDeletionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Deletion request not found' });
    }
    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'This deletion request has already been processed' });
    }

    const registration = await Registration.findById(request.registrationId).populate('courses');
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    const removedCourse = registration.courses.find((course) => course._id.toString() === request.courseId.toString());
    if (!removedCourse) {
      return res.status(400).json({ success: false, message: 'Course is no longer in the registration' });
    }

    registration.courses = registration.courses.filter(
      (course) => course._id.toString() !== request.courseId.toString()
    );

    if (registration.selectedSlots instanceof Map) {
      registration.selectedSlots.delete(removedCourse.courseCode);
      registration.selectedSlots.delete(removedCourse._id.toString());
    }

    const selectedSlots = registration.selectedSlots instanceof Map
      ? Object.fromEntries(registration.selectedSlots.entries())
      : registration.selectedSlots || {};
    const remainingClashes = detectClashes(registration.courses, selectedSlots);

    registration.totalCredits = registration.courses.reduce((sum, course) => sum + (course.credits || 0), 0);
    registration.status = remainingClashes.length > 0
      ? 'blocked'
      : registration.totalCredits < 12
        ? 'draft'
        : 'confirmed';

    await registration.save();
    await Clash.deleteMany({ student: registration.student });

    for (const clash of remainingClashes) {
      await Clash.create({
        student: registration.student,
        course1: clash.course1,
        course2: clash.course2,
        day: clash.day,
        startTime: clash.startTime,
        endTime: clash.endTime,
        room1: clash.room1,
        room2: clash.room2,
        course1Group: clash.course1Group,
        course2Group: clash.course2Group,
        overlapMinutes: clash.overlapMinutes,
        status: 'active',
      });
    }

    request.status = 'APPROVED';
    request.adminId = req.body.advisorId || req.body.adminId || req.headers['x-admin-id'] || null;
    request.adminComment = req.body.adminComment?.trim() || '';
    await request.save();

    return res.json({
      success: true,
      message: 'Course deletion approved and registration updated',
      request,
      registration,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to approve deletion request', error: error.message });
  }
};

exports.rejectDeletionRequest = async (req, res) => {
  try {
    const request = await CourseDeletionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Deletion request not found' });
    }
    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'This deletion request has already been processed' });
    }

    request.status = 'REJECTED';
    request.adminId = req.body.advisorId || req.body.adminId || req.headers['x-admin-id'] || null;
    request.adminComment = req.body.adminComment?.trim() || '';
    await request.save();

    return res.json({ success: true, message: 'Course deletion request rejected', request });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reject deletion request', error: error.message });
  }
};
