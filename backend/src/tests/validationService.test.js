import assert from 'node:assert/strict';
import test from 'node:test';
import { validateRecords, timeRangesOverlap } from '../services/validationService.js';
let recordSequence = 0;
function record(overrides = {}) {
  const index = ++recordSequence;
  return {
    _id: `record-${index}`,
    studentId: `STU-${index}`,
    studentName: `Student ${index}`,
    moduleCode: `CS${index}`,
    moduleName: 'Test Module',
    subgroup: 'SLOT-A',
    day: 'Monday',
    startTime: '09:00',
    endTime: '11:00',
    venue: 'Room 1',
    lecturerName: 'Dr. Test',
    ...overrides
  };
}
test('detects overlapping records for the same student and not adjacent sessions', () => {
  const first = record({
    _id: 'student-class-a',
    studentId: 'IT100',
    moduleCode: 'CS100'
  });
  const second = record({
    _id: 'student-class-b',
    studentId: 'IT100',
    moduleCode: 'CS200',
    startTime: '10:30',
    endTime: '12:00',
    venue: 'Room 2',
    lecturerName: 'Dr. Other'
  });
  const issues = validateRecords([first, second], []);
  assert.equal(issues.filter(issue => issue.errorType === 'CLASH').length, 2);
  assert.equal(timeRangesOverlap('09:00', '10:00', '10:00', '11:00'), false);
});
test('detects the IT20601828 test overlap between IT3040 and IT3020', () => {
  const first = record({
    _id: 'it20601828-it3040',
    studentId: ' IT20601828 ',
    moduleCode: 'IT3040',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    venue: 'Room 1'
  });
  const second = record({
    _id: 'it20601828-it3020',
    studentId: 'it20601828',
    moduleCode: 'IT3020',
    day: 'Monday',
    startTime: '09:30',
    endTime: '10:30',
    venue: 'Room 2'
  });
  const clashes = validateRecords([first, second], []).filter(issue => issue.errorType === 'CLASH');
  assert.equal(clashes.length, 2);
  assert.deepEqual(new Set(clashes.map(issue => issue.studentId)), new Set([' IT20601828 ', 'it20601828']));
});
test('detects an overlapping shared venue for different sessions', () => {
  const first = record({
    _id: 'venue-class-a',
    studentId: 'IT100',
    moduleCode: 'CS100',
    venue: 'Room 1'
  });
  const second = record({
    _id: 'venue-class-b',
    studentId: 'IT200',
    moduleCode: 'CS200',
    venue: 'room 1',
    lecturerName: 'Dr. Other'
  });
  const issues = validateRecords([first, second], []);
  assert.equal(issues.filter(issue => issue.errorType === 'VENUE_CONFLICT').length, 2);
});
test('does not report student rows from the same class session as a venue conflict', () => {
  const first = record({
    _id: 'same-session-a',
    studentId: 'IT100',
    moduleCode: 'IT3020',
    subgroup: 'B',
    venue: 'LT-02'
  });
  const second = record({
    _id: 'same-session-b',
    studentId: 'IT100',
    moduleCode: 'IT3020',
    subgroup: 'SLOT-B',
    venue: 'LT-02'
  });
  const issues = validateRecords([first, second], []);
  assert.equal(issues.filter(issue => issue.errorType === 'VENUE_CONFLICT').length, 0);
  assert.equal(issues.filter(issue => issue.errorType === 'CLASH').length, 0);
});
test('identifies same-module venue conflicts by distinct subgroup session', () => {
  const first = record({
    _id: 'it3020-slot-a',
    studentId: 'IT100',
    moduleCode: 'IT3020',
    subgroup: 'SLOT-A',
    venue: 'LT-02'
  });
  const second = record({
    _id: 'it3020-slot-b',
    studentId: 'IT200',
    moduleCode: 'IT3020',
    subgroup: 'SLOT-B',
    venue: 'LT-02'
  });
  const issues = validateRecords([first, second], []).filter(issue => issue.errorType === 'VENUE_CONFLICT');
  assert.equal(issues.length, 2);
  assert.match(issues[0].description, /IT3020 \(SLOT-A\).*IT3020 \(SLOT-B\)/);
});
test('detects lecturer conflicts and venue capacity overages', () => {
  const first = record({
    _id: 'lecturer-class-a',
    studentId: 'IT100',
    moduleCode: 'CS100',
    venue: 'Room 1'
  });
  const second = record({
    _id: 'lecturer-class-b',
    studentId: 'IT200',
    moduleCode: 'CS200',
    venue: 'Room 2'
  });
  const capacityRecords = [record({
    _id: 'capacity-a',
    studentId: 'IT300',
    moduleCode: 'CS300',
    subgroup: 'SLOT-C',
    venue: 'Lab 3',
    lecturerName: 'Dr. C'
  }), record({
    _id: 'capacity-b',
    studentId: 'IT301',
    moduleCode: 'CS300',
    subgroup: 'SLOT-C',
    venue: 'Lab 3',
    lecturerName: 'Dr. C'
  })];
  const issues = validateRecords([first, second, ...capacityRecords], [{
    name: 'Lab 3',
    capacity: 1
  }]);
  assert.equal(issues.filter(issue => issue.errorType === 'LECTURER_CONFLICT').length, 2);
  assert.equal(issues.filter(issue => issue.errorType === 'CAPACITY').length, 2);
});
