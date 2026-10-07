export const VALIDATION_ENGINE_VERSION = '1.0.0';
export function validateRecords(records, venues) {
  const issues = new Map();
  const sessions = groupSessions(records);
  detectStudentClashes(records, issues);
  detectSessionConflicts(sessions, 'venue', 'VENUE_CONFLICT', 'SEV-1', issues);
  detectSessionConflicts(sessions, 'lecturerName', 'LECTURER_CONFLICT', 'SEV-2', issues);
  detectCapacityIssues(sessions, venues, issues);
  return [...issues.values()];
}
export function timeRangesOverlap(leftStart, leftEnd, rightStart, rightEnd) {
  const leftStartMinute = parseTime(leftStart);
  const leftEndMinute = parseTime(leftEnd);
  const rightStartMinute = parseTime(rightStart);
  const rightEndMinute = parseTime(rightEnd);
  if ([leftStartMinute, leftEndMinute, rightStartMinute, rightEndMinute].some(value => value === null)) return false;
  return leftStartMinute < rightEndMinute && rightStartMinute < leftEndMinute;
}
function detectStudentClashes(records, issues) {
  const byStudent = groupBy(records, record => record.studentId.trim().toUpperCase());
  for (const studentRecords of byStudent.values()) {
    for (let leftIndex = 0; leftIndex < studentRecords.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < studentRecords.length; rightIndex += 1) {
        const left = studentRecords[leftIndex];
        const right = studentRecords[rightIndex];
        if (sameSession(left, right) || left.day !== right.day || !timeRangesOverlap(left.startTime, left.endTime, right.startTime, right.endTime)) continue;
        const description = `${left.moduleCode} ${left.startTime}–${left.endTime} overlaps ${right.moduleCode} ${right.startTime}–${right.endTime} on ${left.day}.`;
        addIssue(issues, left, right, 'CLASH', 'SEV-1', description);
        addIssue(issues, right, left, 'CLASH', 'SEV-1', description);
      }
    }
  }
}
function detectSessionConflicts(sessions, field, errorType, severity, issues) {
  const byResource = groupBy(sessions, session => {
    const value = session.representative[field];
    return typeof value === 'string' ? value.trim().toLocaleLowerCase() : '';
  });
  for (const [resource, resourceSessions] of byResource) {
    if (!resource) continue;
    for (let leftIndex = 0; leftIndex < resourceSessions.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < resourceSessions.length; rightIndex += 1) {
        const left = resourceSessions[leftIndex];
        const right = resourceSessions[rightIndex];
        if (left.key === right.key || left.representative._id.toString() === right.representative._id.toString() || left.representative.day !== right.representative.day || !timeRangesOverlap(left.representative.startTime, left.representative.endTime, right.representative.startTime, right.representative.endTime)) continue;
        const resourceLabel = field === 'venue' ? `Venue ${left.representative.venue}` : `Lecturer ${left.representative.lecturerName}`;
        const leftSession = `${left.representative.moduleCode} (${left.representative.subgroup})`;
        const rightSession = `${right.representative.moduleCode} (${right.representative.subgroup})`;
        const description = `${resourceLabel} is assigned to ${leftSession} and ${rightSession} at overlapping times on ${left.representative.day}.`;
        for (const record of left.records) addIssue(issues, record, right.representative, errorType, severity, description);
        for (const record of right.records) addIssue(issues, record, left.representative, errorType, severity, description);
      }
    }
  }
}
function detectCapacityIssues(sessions, venues, issues) {
  const capacities = new Map(venues.filter(venue => typeof venue.capacity === 'number').map(venue => [venue.name.trim().toLocaleLowerCase(), venue.capacity]));
  for (const session of sessions) {
    const venueName = session.representative.venue.trim().toLocaleLowerCase();
    const capacity = capacities.get(venueName);
    if (capacity === undefined || session.records.length <= capacity) continue;
    const description = `${session.records.length} assigned students exceed ${session.representative.venue} capacity (${capacity}).`;
    for (const record of session.records) addIssue(issues, record, undefined, 'CAPACITY', 'SEV-2', description);
  }
}
function groupSessions(records) {
  const groups = groupBy(records, sessionKey);
  return [...groups.entries()].map(([key, sessionRecords]) => ({
    key,
    records: sessionRecords,
    representative: sessionRecords[0]
  }));
}
function sameSession(left, right) {
  return sessionKey(left) === sessionKey(right);
}
function sessionKey(record) {
  const subgroup = record.subgroup.trim().toUpperCase();
  const canonicalSubgroup = subgroup.startsWith('SLOT-') ? subgroup : `SLOT-${subgroup}`;
  return [record.moduleCode.trim().toUpperCase(), canonicalSubgroup, record.day, record.startTime, record.endTime, record.venue.trim().toLocaleLowerCase()].join('|');
}
function addIssue(issues, record, related, errorType, severity, description, recommendedSlot) {
  const recordId = record._id.toString();
  const relatedId = related?._id.toString();
  const issueKey = [errorType, recordId, relatedId ?? 'resource'].join(':');
  if (issues.has(issueKey)) return;
  issues.set(issueKey, {
    issueKey,
    subgroupId: record._id,
    ...(related ? {
      relatedSubgroupId: related._id
    } : {}),
    studentId: record.studentId,
    studentName: record.studentName,
    moduleCode: record.moduleCode,
    moduleName: record.moduleName,
    errorType,
    severity,
    description,
    currentSlot: {
      subgroup: record.subgroup,
      day: record.day,
      startTime: record.startTime,
      endTime: record.endTime,
      venue: record.venue
    },
    ...(recommendedSlot ? {
      recommendedSlot
    } : {})
  });
}
function parseTime(value) {
  const match = /^(?:([01]\d|2[0-3])):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}
function groupBy(items, keyFn) {
  const groups = new Map();
  for (const item of items) {
    const key = keyFn(item);
    const group = groups.get(key);
    if (group) group.push(item);else groups.set(key, [item]);
  }
  return groups;
}
