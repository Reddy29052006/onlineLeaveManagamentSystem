import { formatDateOnlyForDisplay } from '../utils/dateOnly.js';

function joinParts(parts, separator = ', ') {
  return parts.filter((part) => part && String(part).trim()).join(separator);
}

/**
 * Human-readable description of the applicant for the letter body, using a
 * role-specific phrase so no raw placeholder is ever shown.
 */
export function describeApplicant(user) {
  if (user.role === 'student') {
    const program = joinParts([user.course, user.department]);
    const secondary = joinParts([
      user.year ? `Year ${user.year}` : '',
      user.section ? `Section ${user.section}` : '',
    ]);
    const affiliation = joinParts([program, secondary]);
    const tail = affiliation ? ` from ${affiliation}` : '';
    return `${user.name}, student (ID: ${user.studentId || 'N/A'})${tail}`;
  }

  const designationDept = joinParts([
    user.designation,
    user.department ? `${user.department} Department` : '',
  ]);
  const tail = designationDept ? `, ${designationDept}` : '';
  return `${user.name}, teacher (ID: ${user.teacherId || 'N/A'})${tail}`;
}

function applicantIdFor(user) {
  return user.role === 'student' ? user.studentId : user.teacherId;
}

/**
 * Build the formal leave letter from trusted profile data and application
 * fields. All placeholders are replaced with real values.
 */
export function buildLetterContent({
  user,
  applicationId,
  startDate,
  endDate,
  purpose,
  institutionName,
  submissionDate,
}) {
  const start = formatDateOnlyForDisplay(startDate);
  const end = formatDateOnlyForDisplay(endDate);
  const applicationDate = formatDateOnlyForDisplay(submissionDate);
  const applicantId = applicantIdFor(user) || 'N/A';

  return [
    'To',
    'The Administrator',
    institutionName,
    '',
    'Subject: Request for Leave',
    '',
    'Respected Sir/Madam,',
    '',
    `I am ${describeApplicant(user)}. I kindly request leave from ${start} to ${end} due to ${purpose}.`,
    '',
    'I request you to kindly consider and approve my leave application.',
    '',
    'Thank you for your consideration.',
    '',
    'Yours sincerely,',
    user.name,
    applicantId,
    applicationDate,
    '',
    `Application ID: ${applicationId}`,
    'Status: Pending',
  ].join('\n');
}

/**
 * Structured letter payload returned to the client alongside the raw content.
 */
export function buildLetterPayload(application) {
  const a = application.toObject ? application.toObject() : application;
  return {
    content: a.letterContent,
    subject: 'Request for Leave',
    applicationId: a.applicationId,
    status: a.status,
    applicantName: a.applicantNameSnapshot,
    applicantId: a.applicantIdSnapshot,
    applicantRole: a.applicantRoleSnapshot,
    department: a.departmentSnapshot,
    classOrDesignation: a.classOrDesignationSnapshot,
    purpose: a.purpose,
    startDate: a.startDate,
    endDate: a.endDate,
    requestedCalendarDays: a.requestedCalendarDays,
    requestedPolicyDays: a.requestedPolicyDays,
    submittedAt: a.submittedAt,
    decisionAt: a.decisionAt,
    rejectionReason: a.rejectionReason,
    decisionNote: a.decisionNote,
  };
}
