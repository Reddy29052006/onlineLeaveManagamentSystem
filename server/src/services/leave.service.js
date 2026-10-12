import mongoose from 'mongoose';
import LeaveApplication from '../models/LeaveApplication.js';
import Notification from '../models/Notification.js';
import InstitutionSettings from '../models/InstitutionSettings.js';
import { generateApplicationId } from '../utils/applicationId.js';
import { compareDateOnly, getTodayInTimeZone, isValidDateOnly } from '../utils/dateOnly.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { AppError } from '../utils/AppError.js';
import { checkDateRange } from './calendar.service.js';
import { buildLetterContent, buildLetterPayload } from './letter.service.js';
import { recordAudit } from './audit.service.js';
import { notifyUser, notifyLeaveUpdate, notifyAdmins } from './websocket.service.js';

const MAX_LEAVE_DAYS = 365;
const MAX_ID_ATTEMPTS = 3;

function ensureObjectId(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Invalid application identifier', 400, 'VALIDATION_ERROR', [
      { field: 'id', message: 'Identifier is not valid' },
    ]);
  }
}

function validateSubmissionInput({ startDate, endDate, purpose }) {
  const details = [];

  if (!isValidDateOnly(startDate)) {
    details.push({ field: 'startDate', message: 'Enter a valid start date' });
  }
  if (!isValidDateOnly(endDate)) {
    details.push({ field: 'endDate', message: 'Enter a valid end date' });
  }

  if (typeof purpose !== 'string' || purpose.trim().length === 0) {
    details.push({ field: 'purpose', message: 'Purpose is required' });
  } else if (purpose.trim().length < 5) {
    details.push({ field: 'purpose', message: 'Purpose must be at least 5 characters' });
  } else if (purpose.length > 1000) {
    details.push({ field: 'purpose', message: 'Purpose must be at most 1000 characters' });
  }

  if (details.length > 0) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);
  }

  if (compareDateOnly(endDate, startDate) < 0) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', [
      { field: 'endDate', message: 'End date cannot be before the start date' },
    ]);
  }
}

function snapshotFrom(user) {
  if (user.role === 'student') {
    return {
      applicantRoleSnapshot: 'student',
      applicantNameSnapshot: user.name,
      applicantIdSnapshot: user.studentId || '',
      departmentSnapshot: user.department || '',
      classOrDesignationSnapshot: [
        user.course,
        user.year ? `Year ${user.year}` : '',
        user.section ? `Section ${user.section}` : '',
      ]
        .filter(Boolean)
        .join(', '),
    };
  }

  return {
    applicantRoleSnapshot: 'teacher',
    applicantNameSnapshot: user.name,
    applicantIdSnapshot: user.teacherId || '',
    departmentSnapshot: user.department || '',
    classOrDesignationSnapshot: user.designation || '',
  };
}

async function createConfirmationNotification({ user, application, startDate, endDate }) {
  try {
    const notification = await Notification.create({
      recipient: user._id,
      application: application._id,
      type: 'application_submitted',
      title: `Leave application ${application.applicationId} submitted`,
      message: `Your leave application from ${startDate} to ${endDate} was submitted and is pending review.`,
    });
    notifyUser(user._id, notification.toJSON());
    notifyAdmins('application:submitted', {
      applicationId: application.applicationId,
      applicantName: user.name,
      applicantRole: user.role,
      startDate,
      endDate,
      submittedAt: application.submittedAt,
    });
  } catch (error) {
    console.error('[notifications] failed to create submission notification:', error.message);
  }
}

export async function submitApplication({ user, data = {} }) {
  const startDate = typeof data.startDate === 'string' ? data.startDate.trim() : data.startDate;
  const endDate = typeof data.endDate === 'string' ? data.endDate.trim() : data.endDate;
  const purpose = typeof data.purpose === 'string' ? data.purpose.trim() : data.purpose;

  validateSubmissionInput({ startDate, endDate, purpose });

  const settings = await InstitutionSettings.getSettings();
  const timeZone = settings.timezone || 'Asia/Kolkata';

  const range = await checkDateRange({ startDate, endDate, settings });

  if (range.calendarDays > MAX_LEAVE_DAYS) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', [
      { field: 'endDate', message: `Leave duration cannot exceed ${MAX_LEAVE_DAYS} days` },
    ]);
  }
  if (range.policyDays < 1) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', [
      {
        field: 'startDate',
        message: 'The selected dates contain no countable leave days under the current policy',
      },
    ]);
  }

  const existing = await LeaveApplication.findOne({
    applicant: user._id,
    status: 'Pending',
    startDate,
    endDate,
    purpose,
  });
  if (existing) {
    throw new AppError(
      'You already have a pending application for the same dates and purpose',
      409,
      'DUPLICATE',
      [
        {
          field: 'startDate',
          message: 'A pending application for the same dates and purpose already exists',
        },
      ]
    );
  }

  const submissionDate = getTodayInTimeZone(timeZone);
  const institutionName =
    settings.institutionName || 'Online Leave Management Institution';

  let application = null;
  for (let attempt = 0; attempt < MAX_ID_ATTEMPTS && !application; attempt += 1) {
    const applicationId = await generateApplicationId({
      prefix: settings.applicationIdPrefix || 'LV',
      timeZone,
    });

    const letterContent = buildLetterContent({
      user,
      applicationId,
      startDate,
      endDate,
      purpose,
      institutionName,
      submissionDate,
    });

    const candidate = new LeaveApplication({
      applicationId,
      applicant: user._id,
      ...snapshotFrom(user),
      purpose,
      startDate,
      endDate,
      requestedCalendarDays: range.calendarDays,
      requestedPolicyDays: range.policyDays,
      letterContent,
      status: 'Pending',
      submittedAt: new Date(),
    });

    try {
      application = await candidate.save();
    } catch (error) {
      if (error && error.code === 11000 && attempt < MAX_ID_ATTEMPTS - 1) {
        continue;
      }
      throw error;
    }
  }

  if (!application) {
    throw new AppError('Unable to generate an application ID', 500, 'INTERNAL_ERROR');
  }

  await createConfirmationNotification({ user, application, startDate, endDate });

  await recordAudit({
    actor: user,
    action: 'leave_submitted',
    targetType: 'leave_application',
    targetId: application._id,
    summary: `Submitted application ${application.applicationId}`,
  });

  return {
    application: application.toJSON(),
    letter: buildLetterPayload(application),
    range,
    warnings: range.warnings,
  };
}

export async function getApplication({ id, user }) {
  let application = null;
  if (mongoose.isValidObjectId(id)) {
    application = await LeaveApplication.findById(id);
  }
  if (!application) {
    application = await LeaveApplication.findOne({ applicationId: id });
  }
  if (!application) {
    throw new AppError('Application not found', 404, 'NOT_FOUND');
  }
  if (user.role !== 'admin' && String(application.applicant) !== String(user._id)) {
    throw new AppError(
      'You do not have permission to view this application',
      403,
      'FORBIDDEN'
    );
  }
  return application;
}

export async function getApplicationLetter({ id, user }) {
  const application = await getApplication({ id, user });
  return buildLetterPayload(application);
}

/**
 * Fields shown in the admin review table. Deliberately excludes the generated
 * letter body to keep the list payload small.
 */
const ADMIN_LIST_FIELDS =
  'applicationId applicant applicantRoleSnapshot applicantNameSnapshot ' +
  'applicantIdSnapshot departmentSnapshot classOrDesignationSnapshot ' +
  'startDate endDate requestedCalendarDays requestedPolicyDays status ' +
  'submittedAt decisionAt rejectionReason decisionNote';

const ADMIN_SORTABLE = new Set([
  'submittedAt',
  'decisionAt',
  'startDate',
  'endDate',
  'status',
  'applicationId',
  'applicantNameSnapshot',
]);

const DECISION_STATUSES = new Set(['Pending', 'Approved', 'Rejected']);
const ROLES = new Set(['student', 'teacher']);

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function normalizeNote(value) {
  if (value === undefined || value === null) return null;
  const note = String(value).trim();
  if (note === '') return null;
  if (note.length > 500) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', [
      { field: 'decisionNote', message: 'Decision note must be at most 500 characters' },
    ]);
  }
  return note;
}

/**
 * Paginated, filterable list of every application for the admin review table.
 */
export async function listApplications({ query = {} } = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (DECISION_STATUSES.has(query.status)) {
    filter.status = query.status;
  }
  if (ROLES.has(query.role)) {
    filter.applicantRoleSnapshot = query.role;
  }
  if (hasValue(query.department)) {
    filter.departmentSnapshot = {
      $regex: `^${escapeRegex(String(query.department).trim())}$`,
      $options: 'i',
    };
  }
  if (hasValue(query.applicant) && mongoose.isValidObjectId(query.applicant)) {
    filter.applicant = query.applicant;
  }

  if (hasValue(query.startDateFrom) || hasValue(query.startDateTo)) {
    const range = {};
    if (isValidDateOnly(query.startDateFrom)) range.$gte = query.startDateFrom;
    if (isValidDateOnly(query.startDateTo)) range.$lte = query.startDateTo;
    if (Object.keys(range).length > 0) filter.startDate = range;
  }

  if (hasValue(query.submittedFrom) || hasValue(query.submittedTo)) {
    const range = {};
    if (isValidDateOnly(query.submittedFrom)) {
      range.$gte = new Date(`${query.submittedFrom}T00:00:00.000Z`);
    }
    if (isValidDateOnly(query.submittedTo)) {
      const end = new Date(`${query.submittedTo}T00:00:00.000Z`);
      end.setUTCDate(end.getUTCDate() + 1);
      range.$lt = end;
    }
    if (Object.keys(range).length > 0) filter.submittedAt = range;
  }

  if (hasValue(query.q)) {
    const rx = { $regex: escapeRegex(String(query.q).trim()), $options: 'i' };
    filter.$or = [
      { applicationId: rx },
      { applicantNameSnapshot: rx },
      { applicantIdSnapshot: rx },
      { purpose: rx },
    ];
  }

  const sortField = ADMIN_SORTABLE.has(query.sortBy) ? query.sortBy : 'submittedAt';
  const sortDir = query.sortOrder === 'asc' ? 1 : -1;

  const [docs, total] = await Promise.all([
    LeaveApplication.find(filter)
      .select(ADMIN_LIST_FIELDS)
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(limit),
    LeaveApplication.countDocuments(filter),
  ]);

  return {
    items: docs.map((doc) => doc.toJSON()),
    pagination: buildPaginationMeta({ page, limit, total }),
  };
}

async function createDecisionNotification({ application, type, title, message }) {
  try {
    const notification = await Notification.create({
      recipient: application.applicant,
      application: application._id,
      type,
      title,
      message,
    });
    notifyUser(application.applicant, notification.toJSON());
    notifyLeaveUpdate(application.applicant, application.toJSON ? application.toJSON() : application);
  } catch (error) {
    console.error('[notifications] failed to create decision notification:', error.message);
  }
}

/**
 * Concurrency-safe decision: the conditional update only succeeds while the
 * stored status is still `Pending`, so two simultaneous decisions cannot both
 * win. Never trusts a status supplied by the client.
 */
async function decideApplication({ id, actor, status, rejectionReason = null, decisionNote = null }) {
  const filter = { status: 'Pending' };
  if (mongoose.isValidObjectId(id)) {
    filter._id = id;
  } else {
    filter.applicationId = id;
  }

  const updated = await LeaveApplication.findOneAndUpdate(
    filter,
    {
      $set: {
        status,
        decidedBy: actor._id,
        decisionAt: new Date(),
        rejectionReason,
        decisionNote,
      },
    },
    { new: true }
  );

  if (!updated) {
    const query = mongoose.isValidObjectId(id) ? { _id: id } : { applicationId: id };
    const exists = await LeaveApplication.findOne(query).select('status');
    if (!exists) {
      throw new AppError('Application not found', 404, 'NOT_FOUND');
    }
    throw new AppError('This application has already been decided', 409, 'CONFLICT');
  }

  return updated;
}

export async function approveApplication({ id, actor, decisionNote = null }) {
  const note = normalizeNote(decisionNote);
  const application = await decideApplication({
    id,
    actor,
    status: 'Approved',
    decisionNote: note,
  });

  await createDecisionNotification({
    application,
    type: 'application_approved',
    title: `Leave application ${application.applicationId} approved`,
    message: `Your leave application from ${application.startDate} to ${application.endDate} was approved.`,
  });

  await recordAudit({
    actor,
    action: 'leave_approved',
    targetType: 'leave_application',
    targetId: application._id,
    summary: `Approved application ${application.applicationId}`,
  });

  return application;
}

export async function rejectApplication({ id, actor, rejectionReason, decisionNote = null }) {
  const reason = typeof rejectionReason === 'string' ? rejectionReason.trim() : '';
  if (!reason) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', [
      { field: 'rejectionReason', message: 'A rejection reason is required' },
    ]);
  }
  if (reason.length > 500) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', [
      { field: 'rejectionReason', message: 'Rejection reason must be at most 500 characters' },
    ]);
  }

  const note = normalizeNote(decisionNote);
  const application = await decideApplication({
    id,
    actor,
    status: 'Rejected',
    rejectionReason: reason,
    decisionNote: note,
  });

  await createDecisionNotification({
    application,
    type: 'application_rejected',
    title: `Leave application ${application.applicationId} rejected`,
    message: `Your leave application from ${application.startDate} to ${application.endDate} was rejected. Reason: ${reason}`,
  });

  await recordAudit({
    actor,
    action: 'leave_rejected',
    targetType: 'leave_application',
    targetId: application._id,
    summary: `Rejected application ${application.applicationId}`,
  });

  return application;
}

const APPLICANT_LIST_FIELDS =
  'applicationId status startDate endDate requestedCalendarDays requestedPolicyDays ' +
  'purpose submittedAt decisionAt rejectionReason decisionNote';

/**
 * List only the current applicant's own applications (paginated, optional
 * status filter). Scoped to the authenticated user.
 */
export async function listMyApplications({ user, query = {} }) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { applicant: user._id };
  if (DECISION_STATUSES.has(query.status)) {
    filter.status = query.status;
  }

  const [docs, total] = await Promise.all([
    LeaveApplication.find(filter)
      .select(APPLICANT_LIST_FIELDS)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit),
    LeaveApplication.countDocuments(filter),
  ]);

  return {
    items: docs.map((doc) => doc.toJSON()),
    pagination: buildPaginationMeta({ page, limit, total }),
  };
}

/**
 * Aggregate summary for one applicant plus recent records, upcoming approved
 * leave, and currently active approved leave (using the institution timezone).
 */
export async function getApplicantSummary({ user }) {
  const settings = await InstitutionSettings.getSettings();
  const today = getTodayInTimeZone(settings.timezone || 'Asia/Kolkata');
  const applicantId = user._id;

  const [grouped, upcomingApproved, currentOnLeave, recentApplications] =
    await Promise.all([
      LeaveApplication.aggregate([
        { $match: { applicant: applicantId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            days: { $sum: '$requestedPolicyDays' },
          },
        },
      ]),
      LeaveApplication.countDocuments({
        applicant: applicantId,
        status: 'Approved',
        startDate: { $gt: today },
      }),
      LeaveApplication.countDocuments({
        applicant: applicantId,
        status: 'Approved',
        startDate: { $lte: today },
        endDate: { $gte: today },
      }),
      LeaveApplication.find({ applicant: applicantId })
        .select(APPLICANT_LIST_FIELDS)
        .sort({ submittedAt: -1 })
        .limit(5),
    ]);

  const summary = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    pendingDays: 0,
    approvedDays: 0,
    rejectedDays: 0,
    upcomingApproved,
    currentOnLeave,
  };

  for (const group of grouped) {
    summary.total += group.count;
    if (group._id === 'Pending') {
      summary.pending = group.count;
      summary.pendingDays = group.days;
    } else if (group._id === 'Approved') {
      summary.approved = group.count;
      summary.approvedDays = group.days;
    } else if (group._id === 'Rejected') {
      summary.rejected = group.count;
      summary.rejectedDays = group.days;
    }
  }

  return {
    today,
    summary,
    recentApplications: recentApplications.map((doc) => doc.toJSON()),
  };
}
