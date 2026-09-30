// Helper to convert "HH:MM" (24h or "09:00") to minutes from midnight
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1] || "0", 10);
  return hours * 60 + minutes;
}

/**
 * Detect clashes among a list of courses (and optional student slot selections)
 * @param {Array} courses - Array of Course mongoose documents
 * @param {Object} selectedSlots - Map of courseId -> slotName (optional)
 * @returns {Array} List of detected clash descriptors
 */
function detectClashes(courses, selectedSlots = {}) {
  const clashes = [];

  // Extract all sessions for each course
  const sessions = [];

  for (const course of courses) {
    // 1. Regular schedule sessions
    if (course.schedule && course.schedule.length > 0) {
      for (const item of course.schedule) {
        if (item.day && item.startTime && item.endTime) {
          sessions.push({
            course,
            day: item.day.trim(),
            startTime: item.startTime.trim(),
            endTime: item.endTime.trim(),
            room: item.room || "TBA",
            sessionType: item.type || "Class",
          });
        }
      }
    }

    // 2. Elective slot sessions
    if (course.slots && course.slots.length > 0) {
      const chosenSlotName =
        selectedSlots[course._id?.toString()] ||
        selectedSlots[course.courseCode] ||
        selectedSlots[course.courseCode?.toUpperCase()];
      const activeSlot = chosenSlotName
        ? course.slots.find((s) => s.slotName === chosenSlotName)
        : course.slots[0];

      if (activeSlot && activeSlot.day && activeSlot.startTime && activeSlot.endTime) {
        sessions.push({
          course,
          day: activeSlot.day.trim(),
          startTime: activeSlot.startTime.trim(),
          endTime: activeSlot.endTime.trim(),
          room: activeSlot.room || "TBA",
          sessionType: activeSlot.slotName || "Slot",
        });
      }
    }
  }

  // Compare every pair of sessions
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const s1 = sessions[i];
      const s2 = sessions[j];

      // Ignore sessions belonging to the same course
      if (s1.course._id.toString() === s2.course._id.toString()) continue;

      // Check if same day (case-insensitive)
      if (s1.day.toLowerCase() === s2.day.toLowerCase()) {
        const start1 = timeToMinutes(s1.startTime);
        const end1 = timeToMinutes(s1.endTime);
        const start2 = timeToMinutes(s2.startTime);
        const end2 = timeToMinutes(s2.endTime);

        const overlapStart = Math.max(start1, start2);
        const overlapEnd = Math.min(end1, end2);

        if (overlapStart < overlapEnd) {
          const overlapMinutes = overlapEnd - overlapStart;

          clashes.push({
            course1: s1.course._id,
            course1Code: s1.course.courseCode,
            course1Name: s1.course.courseName,
            course2: s2.course._id,
            course2Code: s2.course.courseCode,
            course2Name: s2.course.courseName,
            day: s1.day,
            startTime: s1.startTime,
            endTime: s1.endTime,
            room1: s1.room,
            room2: s2.room,
            overlapMinutes,
          });
        }
      }
    }
  }

  return clashes;
}

module.exports = {
  detectClashes,
  timeToMinutes,
};
