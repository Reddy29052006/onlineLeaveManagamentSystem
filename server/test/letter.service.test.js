import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  describeApplicant,
  buildLetterContent,
  composeLetterContent,
  buildLetterPayload,
} from '../src/services/letter.service.js';

const student = {
  role: 'student',
  name: 'Aarav Sharma',
  studentId: 'STU-001',
  course: 'B.Tech CSE',
  department: 'Computer Science',
  year: 2,
  section: 'A',
};

const teacher = {
  role: 'teacher',
  name: 'Dr. Meera Iyer',
  teacherId: 'TCH-014',
  designation: 'Assistant Professor',
  department: 'Mathematics',
};

function countOccurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
}

test('describeApplicant builds a student phrase with affiliation', () => {
  assert.equal(
    describeApplicant(student),
    'Aarav Sharma, student (ID: STU-001) from B.Tech CSE, Computer Science, Year 2, Section A'
  );
});

test('describeApplicant falls back to N/A when the role id is missing', () => {
  assert.equal(
    describeApplicant({ role: 'student', name: 'No Id' }),
    'No Id, student (ID: N/A)'
  );
});

test('describeApplicant builds a teacher phrase from designation and department', () => {
  assert.equal(
    describeApplicant(teacher),
    'Dr. Meera Iyer, teacher (ID: TCH-014), Assistant Professor, Mathematics Department'
  );
});

test('buildLetterContent produces a formal letter with no status footer', () => {
  const content = buildLetterContent({
    user: student,
    startDate: '2026-10-12',
    endDate: '2026-10-14',
    purpose: '[Medical Leave] physician recommended rest',
    institutionName: 'Sunrise Institute of Technology',
    submissionDate: '2026-10-10',
  });

  assert.match(content, /To\n/);
  assert.match(content, /The Administrator/);
  assert.match(content, /Sunrise Institute of Technology/);
  assert.match(content, /Subject: Request for Leave/);
  assert.match(content, /from 12 Oct 2026 to 14 Oct 2026/);
  assert.match(content, /physician recommended rest/);
  assert.match(content, /Yours sincerely,/);
  assert.equal(content.includes('Status:'), false);
  assert.equal(content.includes('Application ID:'), false);
});

test('composeLetterContent shows Pending status for an undecided application', () => {
  const application = {
    applicationId: 'LV-2026-000123',
    status: 'Pending',
    letterContent: 'Body of the letter.',
  };
  const content = composeLetterContent(application);
  assert.match(content, /Application ID: LV-2026-000123/);
  assert.match(content, /Status: Pending/);
  assert.equal(countOccurrences(content, 'Application ID:'), 1);
});

test('composeLetterContent reflects an approved decision with note', () => {
  const application = {
    applicationId: 'LV-2026-000124',
    status: 'Approved',
    decisionAt: new Date('2026-10-11T09:30:00Z'),
    decisionNote: 'Enjoy your leave.',
    letterContent: 'Body of the letter.',
  };
  const content = composeLetterContent(application);
  assert.match(content, /Status: Approved/);
  assert.match(content, /Decision Date: 11 Oct 2026/);
  assert.match(content, /Remark: Enjoy your leave\./);
  assert.equal(content.includes('Rejection Reason:'), false);
});

test('composeLetterContent reflects a rejection with reason', () => {
  const application = {
    applicationId: 'LV-2026-000125',
    status: 'Rejected',
    decisionAt: new Date('2026-10-11T09:30:00Z'),
    rejectionReason: 'Insufficient notice period.',
    letterContent: 'Body of the letter.',
  };
  const content = composeLetterContent(application);
  assert.match(content, /Status: Rejected/);
  assert.match(content, /Rejection Reason: Insufficient notice period\./);
});

test('composeLetterContent upgrades legacy letters with a stale status footer', () => {
  const legacy = 'Body of the letter.\n\nApplication ID: LV-2026-000001\nStatus: Pending';
  const application = {
    applicationId: 'LV-2026-000126',
    status: 'Approved',
    decisionAt: new Date('2026-10-11T09:30:00Z'),
    letterContent: legacy,
  };
  const content = composeLetterContent(application);
  assert.equal(countOccurrences(content, 'Application ID:'), 1);
  assert.match(content, /Application ID: LV-2026-000126/);
  assert.match(content, /Status: Approved/);
  assert.equal(content.includes('Status: Pending'), false);
});

test('composeLetterContent accepts a mongoose-style document with toObject', () => {
  const application = {
    applicationId: 'LV-2026-000127',
    status: 'Pending',
    toObject: () => ({ applicationId: 'LV-2026-000127', status: 'Pending', letterContent: 'Hi' }),
  };
  const content = composeLetterContent(application);
  assert.match(content, /Status: Pending/);
  assert.match(content, /Hi/);
});

test('buildLetterPayload returns structured fields plus the composed content', () => {
  const application = {
    applicationId: 'LV-2026-000128',
    status: 'Pending',
    letterContent: 'Body.',
    applicantNameSnapshot: 'Aarav Sharma',
    applicantIdSnapshot: 'STU-001',
    applicantRoleSnapshot: 'student',
    departmentSnapshot: 'Computer Science',
    classOrDesignationSnapshot: 'B.Tech CSE',
    purpose: '[Casual Leave] family function',
    startDate: '2026-10-12',
    endDate: '2026-10-13',
    requestedCalendarDays: 2,
    requestedPolicyDays: 2,
    submittedAt: new Date('2026-10-10T06:00:00Z'),
    decisionAt: null,
    rejectionReason: null,
    decisionNote: null,
  };

  const payload = buildLetterPayload(application);
  assert.equal(payload.subject, 'Request for Leave');
  assert.equal(payload.applicationId, 'LV-2026-000128');
  assert.equal(payload.applicantName, 'Aarav Sharma');
  assert.equal(payload.requestedPolicyDays, 2);
  assert.match(payload.content, /Status: Pending/);
});
