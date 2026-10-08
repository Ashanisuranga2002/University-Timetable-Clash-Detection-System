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
