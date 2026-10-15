const CourseGroup = require('../models/CourseGroup');
const Course = require('../models/Course');
const { detectClashes, timeToMinutes } = require('../utils/clashDetector');

// Fetch alternative subgroups for a specific course
exports.getSubgroups = async (req, res) => {
    try {
        const { courseCode } = req.params;
        const subgroups = await CourseGroup.find({ courseCode: courseCode.toUpperCase() });
        res.status(200).json({ success: true, subgroups });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch subgroups', error: error.message });
    }
};
// Preview a timetable with proposed subgroup changes
exports.previewTimetable = async (req, res) => {
    try {
        const { courseIds, selectedSlots, proposedSubgroups } = req.body;
        
        // Fetch original courses
        const courses = await Course.find({
            $or: [
              { _id: { $in: courseIds.filter((id) => id.toString().match(/^[0-9a-fA-F]{24}$/)) } },
              { courseCode: { $in: courseIds.map((c) => c.toString().toUpperCase()) } },
            ],
        });

        // Deep copy courses to modify schedule/slots in memory
        const previewCourses = JSON.parse(JSON.stringify(courses));

        // Apply proposed subgroups
        if (proposedSubgroups && proposedSubgroups.length > 0) {
            for (const proposal of proposedSubgroups) {
                const subgroup = await CourseGroup.findById(proposal.subgroupId);
                if (!subgroup) {
                    return res.status(404).json({ success: false, message: `Alternative subgroup ${proposal.subgroupId} was not found` });
                }

                const courseCode = subgroup.courseCode.toUpperCase();
                if (proposal.courseCode?.toUpperCase() !== courseCode) {
                    return res.status(400).json({ success: false, message: 'The selected subgroup does not belong to the requested course' });
                }

                const courseIdx = previewCourses.findIndex(c => c.courseCode?.toUpperCase() === courseCode);
                if (courseIdx === -1) {
                    return res.status(400).json({ success: false, message: `Course ${courseCode} is not included in this timetable` });
                }

                const course = previewCourses[courseIdx];
                const replacedSession = proposal.replaceSession;
                if (replacedSession?.day && replacedSession.startTime && replacedSession.endTime) {
                    const sameTime = (left, right) => (left || '').trim() === (right || '').trim();
                    course.schedule = (course.schedule || []).filter(session => !(
                        sameTime(session.day?.toLowerCase(), replacedSession.day.toLowerCase()) &&
                        sameTime(session.startTime, replacedSession.startTime) &&
                        sameTime(session.endTime, replacedSession.endTime)
                    ));
                }

                // Preserve the course's other meetings, and replace its selected subgroup session.
                course.slots = [{
                    slotName: subgroup.groupName,
                    day: subgroup.day,
                    startTime: subgroup.startTime,
                    endTime: subgroup.endTime,
                    room: subgroup.venue
                }];
            }
        }

        // Detect clashes
        const detectedClashes = detectClashes(previewCourses, selectedSlots || {});

        res.status(200).json({
            success: true,
            hasClashes: detectedClashes.length > 0,
            clashes: detectedClashes,
            previewCourses
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to preview timetable', error: error.message });
    }
};

const StudentRequest = require('../models/StudentRequest');

// Get high-level stats for Coordinator Dashboard
exports.getCoordinatorStats = async (req, res) => {
    try {
        const [courses, subgroups, pendingRequests] = await Promise.all([
            Course.find({ isActive: true }).lean(),
            CourseGroup.find().lean(),
            StudentRequest.find({
                requestType: 'COORDINATOR_CHANGE',
                workflowStatus: 'PENDING_COORDINATOR',
            }).lean(),
        ]);

        const configuredCount = courses.filter(
            (c) => (c.schedule && c.schedule.length > 0) || (c.slots && c.slots.length > 0)
        ).length;

        res.status(200).json({
            success: true,
            stats: {
                totalCourses: courses.length,
                configuredCourses: configuredCount,
                pendingCourses: Math.max(0, courses.length - configuredCount),
                totalSubgroups: subgroups.length,
                pendingClashRequests: pendingRequests.length,
            },
            recentRequests: pendingRequests.slice(0, 5),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch coordinator stats', error: error.message });
    }
};

// Fetch all courses with their schedule and subgroups for coordinator review
exports.getAllCoursesWithTimetable = async (req, res) => {
    try {
        const courses = await Course.find({ isActive: true }).sort({ semester: 1, courseCode: 1 }).lean();

        const enriched = await Promise.all(
            courses.map(async (c) => {
                const subgroups = await CourseGroup.find({ courseCode: c.courseCode }).lean();
                return {
                    ...c,
                    subgroups: subgroups || [],
                    subgroupCount: (subgroups || []).length,
                    scheduleCount: (c.schedule || []).length,
                    isConfigured: (c.schedule && c.schedule.length > 0) || (subgroups && subgroups.length > 0),
                };
            })
        );

        res.status(200).json({ success: true, count: enriched.length, courses: enriched });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch courses', error: error.message });
    }
};

// Get single course details with schedule and subgroups
exports.getCourseDetails = async (req, res) => {
    try {
        const { courseCode } = req.params;
        const course = await Course.findOne({ courseCode: courseCode.toUpperCase() });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        const subgroups = await CourseGroup.find({ courseCode: courseCode.toUpperCase() });
        res.status(200).json({ success: true, course, subgroups });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch course details', error: error.message });
    }
};

// Add a schedule time slot to a course
exports.addScheduleSlot = async (req, res) => {
    try {
        const { courseCode } = req.params;
        const { day, startTime, endTime, room, type } = req.body;
        if (!day || !startTime || !endTime) {
            return res.status(400).json({ success: false, message: 'Day, startTime and endTime are required' });
        }
        const course = await Course.findOne({ courseCode: courseCode.toUpperCase() });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        course.schedule = course.schedule || [];
        course.schedule.push({
            day: day.trim(),
            startTime: startTime.trim(),
            endTime: endTime.trim(),
            room: room ? room.trim() : 'TBA',
            type: type ? type.trim() : 'Lecture',
        });
        await course.save();

        res.status(200).json({ success: true, message: 'Schedule slot added successfully', course });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add schedule slot', error: error.message });
    }
};

// Remove a schedule time slot from a course
exports.deleteScheduleSlot = async (req, res) => {
    try {
        const { courseCode, slotIndex } = req.params;
        const course = await Course.findOne({ courseCode: courseCode.toUpperCase() });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        const idx = parseInt(slotIndex, 10);
        if (isNaN(idx) || idx < 0 || idx >= (course.schedule || []).length) {
            return res.status(400).json({ success: false, message: 'Invalid slot index' });
        }
        course.schedule.splice(idx, 1);
        await course.save();

        res.status(200).json({ success: true, message: 'Schedule slot removed', course });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to remove schedule slot', error: error.message });
    }
};

// Create a subgroup for a course and sync to course.slots
exports.createSubgroup = async (req, res) => {
    try {
        const { courseCode } = req.params;
        const { groupName, day, startTime, endTime, venue, capacity } = req.body;
        if (!groupName || !day || !startTime || !endTime) {
            return res.status(400).json({ success: false, message: 'groupName, day, startTime and endTime are required' });
        }
        const course = await Course.findOne({ courseCode: courseCode.toUpperCase() });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const newGroup = await CourseGroup.create({
            courseCode: course.courseCode,
            courseName: course.courseName,
            groupName: groupName.trim(),
            day: day.trim(),
            startTime: startTime.trim(),
            endTime: endTime.trim(),
            venue: venue ? venue.trim() : 'TBA',
            capacity: Number(capacity) || 40,
            enrolledCount: 0,
        });

        // Also sync into course.slots
        course.slots = course.slots || [];
        // replace if same slotName exists
        course.slots = course.slots.filter(s => s.slotName !== groupName.trim());
        course.slots.push({
            slotName: groupName.trim(),
            day: day.trim(),
            startTime: startTime.trim(),
            endTime: endTime.trim(),
            room: venue ? venue.trim() : 'TBA',
        });
        await course.save();

        res.status(201).json({ success: true, message: 'Subgroup created successfully', subgroup: newGroup });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create subgroup', error: error.message });
    }
};

// Delete a subgroup and sync with course.slots
exports.deleteSubgroup = async (req, res) => {
    try {
        const { subgroupId } = req.params;
        const subgroup = await CourseGroup.findById(subgroupId);
        if (!subgroup) {
            return res.status(404).json({ success: false, message: 'Subgroup not found' });
        }
        const { courseCode, groupName } = subgroup;
        await CourseGroup.findByIdAndDelete(subgroupId);

        const course = await Course.findOne({ courseCode });
        if (course && course.slots) {
            course.slots = course.slots.filter(s => s.slotName !== groupName);
            await course.save();
        }

        res.status(200).json({ success: true, message: 'Subgroup deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete subgroup', error: error.message });
    }
};

// Get all clash requests submitted by students
exports.getClashRequests = async (req, res) => {
    try {
        const requests = await StudentRequest.find({
            requestType: 'COORDINATOR_CHANGE',
            workflowStatus: 'PENDING_COORDINATOR',
        }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: requests.length, requests });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch clash requests', error: error.message });
    }
};

// Coordinator resolves/reschedules a clash and sends to Advisor
exports.resolveClashRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            proposedSubgroup,
            coordinatorNotes,
            coordinatorId,
        } = req.body;
        const request = await StudentRequest.findById(id);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        if (request.requestType !== 'COORDINATOR_CHANGE' || request.workflowStatus !== 'PENDING_COORDINATOR') {
            return res.status(400).json({ success: false, message: 'This request is not waiting for coordinator action' });
        }

        if (!proposedSubgroup) {
            return res.status(400).json({ success: false, message: 'A configured alternative subgroup is required' });
        }

        let subgroup = null;
        if (String(proposedSubgroup).match(/^[0-9a-fA-F]{24}$/)) {
            subgroup = await CourseGroup.findById(proposedSubgroup);
        }
        if (!subgroup) {
            subgroup = await CourseGroup.findOne({
                courseCode: request.courseCode.toUpperCase(),
                groupName: new RegExp(`^${String(proposedSubgroup).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
            });
        }
        if (!subgroup || subgroup.courseCode.toUpperCase() !== request.courseCode.toUpperCase()) {
            return res.status(400).json({ success: false, message: 'Choose a subgroup configured for this course' });
        }

        // When the student included their current registration, verify that
        // the coordinator's chosen subgroup actually removes all timetable
        // overlaps before forwarding the request to the advisor.
        if (Array.isArray(request.courseIds) && request.courseIds.length > 0) {
            const ids = request.courseIds.map(String);
            const courseCodes = ids.filter((value) => !/^[0-9a-fA-F]{24}$/.test(value)).map((value) => value.toUpperCase());
            const objectIds = ids.filter((value) => /^[0-9a-fA-F]{24}$/.test(value));
            const courses = await Course.find({
                $or: [
                    { _id: { $in: objectIds } },
                    { courseCode: { $in: courseCodes } },
                ],
            });

            const selectedSlots = request.selectedSlots instanceof Map
                ? Object.fromEntries(request.selectedSlots.entries())
                : { ...(request.selectedSlots || {}) };
            const previewCourses = courses.map((course) => {
                const previewCourse = course.toObject();
                if (previewCourse.courseCode?.toUpperCase() !== request.courseCode.toUpperCase()) return previewCourse;

                if (request.conflictDay && request.conflictStartTime && request.conflictEndTime) {
                    previewCourse.schedule = (previewCourse.schedule || []).filter((slot) => !(
                        slot.day?.toLowerCase() === request.conflictDay.toLowerCase() &&
                        slot.startTime === request.conflictStartTime &&
                        slot.endTime === request.conflictEndTime
                    ));
                }
                previewCourse.slots = [{
                    slotName: subgroup.groupName,
                    day: subgroup.day,
                    startTime: subgroup.startTime,
                    endTime: subgroup.endTime,
                    room: subgroup.venue,
                }];
                selectedSlots[previewCourse.courseCode] = subgroup.groupName;
                return previewCourse;
            });

            if (!previewCourses.some((course) => course.courseCode?.toUpperCase() === request.courseCode.toUpperCase())) {
                return res.status(400).json({ success: false, message: 'The requested course is not present in the student timetable' });
            }

            const remainingClashes = detectClashes(previewCourses, selectedSlots);
            if (remainingClashes.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: `This subgroup still conflicts with ${remainingClashes[0].course1Code} or ${remainingClashes[0].course2Code}. Choose another subgroup/time.`,
                    clashes: remainingClashes,
                });
            }
        }

        request.requestedGroup = subgroup.groupName;
        request.proposedDay = subgroup.day;
        request.proposedStartTime = subgroup.startTime;
        request.proposedEndTime = subgroup.endTime;
        request.proposedVenue = subgroup.venue;
        request.proposedSubgroupId = subgroup._id;
        if (request.selectedSlots instanceof Map) {
            request.selectedSlots.set(request.courseCode, subgroup.groupName);
        } else {
            request.selectedSlots = { [request.courseCode]: subgroup.groupName };
        }
        request.coordinatorId = coordinatorId || req.headers['x-coordinator-id'] || undefined;
        request.coordinatorNotes = coordinatorNotes?.trim() || undefined;
        request.requestType = 'ADVISOR_APPROVAL';
        request.workflowStatus = 'PENDING_ADVISOR';
        request.status = 'PENDING';
        request.lastDecision = 'PENDING';
        await request.save();

        res.status(200).json({ success: true, message: 'Alternative subgroup assigned and forwarded to Advisor', request });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to resolve clash request', error: error.message });
    }
};

