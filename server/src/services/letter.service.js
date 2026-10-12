import { formatDateOnlyForDisplay } from '../utils/dateOnly.js';

function joinParts(parts, separator = ', ') {
  return parts.filter((part) => part && String(part).trim()).join(separator);
}

/** Format an instant as a readable date/time for the letter decision footer. */
function formatInstantForLetter(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
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
  ].join('\n');
}

/**
 * Append a footer describing the *current* application status so a letter
 * never goes stale: Pending letters show "Pending", and decided letters also
 * show the decision date plus rejection reason / note. Any previously stored
 * footer is stripped first so legacy letters are upgraded on read.
 */
export function composeLetterContent(application) {
  const a = application.toObject ? application.toObject() : application;
  const base = String(a.letterContent || '')
    .replace(/\n*Application ID:[\s\S]*$/, '')
    .trimEnd();

  const footer = ['', `Application ID: ${a.applicationId}`, `Status: ${a.status || 'Pending'}`];

  if (a.status && a.status !== 'Pending') {
    if (a.decisionAt) {
      footer.push(`Decision Date: ${formatInstantForLetter(a.decisionAt)}`);
    }
    if (a.status === 'Rejected' && a.rejectionReason) {
      footer.push(`Rejection Reason: ${a.rejectionReason}`);
    }
    if (a.decisionNote) {
      footer.push(`Remark: ${a.decisionNote}`);
    }
  }

  return `${base}\n${footer.join('\n')}`;
}

/**
 * Structured letter payload returned to the client alongside the raw content.
 */
export function buildLetterPayload(application) {
  const a = application.toObject ? application.toObject() : application;
  return {
    content: composeLetterContent(a),
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
