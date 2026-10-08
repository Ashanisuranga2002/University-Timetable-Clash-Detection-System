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
                if (subgroup) {
                    const courseIdx = previewCourses.findIndex(c => c.courseCode === subgroup.courseCode);
                    if (courseIdx !== -1) {
                        // Keep the original schedule (lecture) intact, but override the slots (lab/tutorial)
                        previewCourses[courseIdx].slots = [{
                            slotName: subgroup.groupName,
                            day: subgroup.day,
                            startTime: subgroup.startTime,
                            endTime: subgroup.endTime,
                            room: subgroup.venue
                        }];
                    }
                }
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
