import crypto from 'node:crypto';
import mongoose from 'mongoose';
import User, { getPublicUser } from '../models/User.js';
import LeaveApplication from '../models/LeaveApplication.js';
import { hashPassword } from '../utils/password.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { AppError } from '../utils/AppError.js';
import { recordAudit } from './audit.service.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COMMON_EDITABLE = ['name', 'email', 'username', 'department', 'phone'];
const EDITABLE_FIELDS = {
  student: [...COMMON_EDITABLE, 'studentId', 'course', 'year', 'section'],
  teacher: [...COMMON_EDITABLE, 'teacherId', 'designation'],
};

const SORTABLE = new Set([
  'name',
  'email',
  'username',
  'createdAt',
  'updatedAt',
  'accountStatus',
  'department',
  'studentId',
  'teacherId',
]);

function editableFieldsFor(role) {
  return EDITABLE_FIELDS[role] || COMMON_EDITABLE;
}

function ensureObjectId(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Invalid account identifier', 400, 'VALIDATION_ERROR', [
      { field: 'id', message: 'Identifier is not valid' },
    ]);
  }
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasValue(data, key) {
  return (
    data[key] !== undefined &&
    data[key] !== null &&
    String(data[key]).trim() !== ''
  );
}

function generateTemporaryPassword(length = 10) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i += 1) {
    password += alphabet[bytes[i] % alphabet.length];
  }
  // Guarantee at least one digit and one symbol for a reasonable policy.
  return `${password}#7`;
}

function handleSaveError(error) {
  if (error && error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    const message = `A record with this ${field} already exists`;
    throw new AppError(message, 409, 'DUPLICATE', [{ field, message }]);
  }
  throw error;
}

function validateAccountPayload(role, data = {}, { partial = false } = {}) {
  const details = [];

  if (!partial || data.name !== undefined) {
    if (!hasValue(data, 'name')) {
      details.push({ field: 'name', message: 'Name is required' });
    }
  }

  if (!partial || data.email !== undefined) {
    if (!hasValue(data, 'email')) {
      details.push({ field: 'email', message: 'Email is required' });
    } else if (!EMAIL_REGEX.test(String(data.email).trim())) {
      details.push({ field: 'email', message: 'Enter a valid email address' });
    }
  }

  if (!partial || data.username !== undefined) {
    if (!hasValue(data, 'username')) {
      details.push({ field: 'username', message: 'Username is required' });
    } else if (String(data.username).trim().length < 3) {
      details.push({ field: 'username', message: 'Username must be at least 3 characters' });
    }
  }

  if (role === 'student') {
    if (!partial || data.studentId !== undefined) {
      if (!hasValue(data, 'studentId')) {
        details.push({ field: 'studentId', message: 'Student ID is required' });
      }
    }
    if (!partial && !hasValue(data, 'department') && !hasValue(data, 'course')) {
      details.push({
        field: 'department',
        message: 'Department or course is required',
      });
    }
  } else {
    if (!partial || data.teacherId !== undefined) {
      if (!hasValue(data, 'teacherId')) {
        details.push({ field: 'teacherId', message: 'Teacher ID is required' });
      }
    }
    if (!partial || data.designation !== undefined) {
      if (!hasValue(data, 'designation')) {
        details.push({ field: 'designation', message: 'Designation is required' });
      }
    }
    if (!partial || data.department !== undefined) {
      if (!hasValue(data, 'department')) {
        details.push({ field: 'department', message: 'Department is required' });
      }
    }
  }

  if (data.password !== undefined && data.password !== null && data.password !== '') {
    if (String(data.password).length < 8) {
      details.push({
        field: 'password',
        message: 'Password must be at least 8 characters',
      });
    }
  }

  if (details.length > 0) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);
  }
}

function pickEditable(role, data = {}) {
  const fields = editableFieldsFor(role);
  const picked = {};
  for (const field of fields) {
    if (data[field] !== undefined) {
      picked[field] = data[field];
    }
  }
  return picked;
}

export async function createAccount({ role, data, actor }) {
  validateAccountPayload(role, data, { partial: false });

  const doc = {
    ...pickEditable(role, data),
    role,
    accountStatus: 'active',
    mustChangePassword: true,
  };

  let temporaryPassword = null;
  if (hasValue(data, 'password')) {
    doc.passwordHash = await hashPassword(String(data.password));
  } else {
    temporaryPassword = generateTemporaryPassword();
    doc.passwordHash = await hashPassword(temporaryPassword);
  }

  let user;
  try {
    user = await User.create(doc);
  } catch (error) {
    handleSaveError(error);
  }

  await recordAudit({
    actor,
    action: 'account_created',
    targetType: role,
    targetId: user._id,
    summary: `Created ${role} account ${user.username}`,
  });

  return { user: getPublicUser(user), temporaryPassword };
}

export async function listAccounts({ role, query = {} }) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { role };

  if (query.status === 'active' || query.status === 'inactive') {
    filter.accountStatus = query.status;
  }

  if (hasValue(query, 'department')) {
    filter.department = {
      $regex: `^${escapeRegex(query.department)}$`,
      $options: 'i',
    };
  }

  if (role === 'student' && hasValue(query, 'course')) {
    filter.course = { $regex: `^${escapeRegex(query.course)}$`, $options: 'i' };
  }
  if (role === 'student' && hasValue(query, 'year')) {
    filter.year = { $regex: `^${escapeRegex(query.year)}$`, $options: 'i' };
  }

  if (hasValue(query, 'q')) {
    const rx = { $regex: escapeRegex(query.q), $options: 'i' };
    const or = [{ name: rx }, { email: rx }, { username: rx }, { department: rx }];
    if (role === 'student') {
      or.push({ studentId: rx }, { course: rx });
    } else {
      or.push({ teacherId: rx }, { designation: rx });
    }
    filter.$or = or;
  }

  const sortField = SORTABLE.has(query.sort) ? query.sort : 'createdAt';
  const sortDir = query.order === 'asc' ? 1 : -1;

  const [docs, total] = await Promise.all([
    User.find(filter).sort({ [sortField]: sortDir }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    items: docs.map(getPublicUser),
    pagination: buildPaginationMeta({ page, limit, total }),
  };
}

export async function getAccount({ role, id }) {
  ensureObjectId(id);
  const user = await User.findOne({ _id: id, role });
  if (!user) {
    throw new AppError('Account not found', 404, 'NOT_FOUND');
  }
  return getPublicUser(user);
}

export async function updateAccount({ role, id, data, actor }) {
  ensureObjectId(id);
  validateAccountPayload(role, data, { partial: true });

  const user = await User.findOne({ _id: id, role });
  if (!user) {
    throw new AppError('Account not found', 404, 'NOT_FOUND');
  }

  const updates = pickEditable(role, data);
  Object.assign(user, updates);

  try {
    await user.save();
  } catch (error) {
    handleSaveError(error);
  }

  await recordAudit({
    actor,
    action: 'account_updated',
    targetType: role,
    targetId: user._id,
    summary: `Updated ${role} account ${user.username}`,
  });

  return getPublicUser(user);
}

async function destroyUserSessions(userId) {
  try {
    const collection = mongoose.connection.db.collection('sessions');
    await collection.deleteMany({ session: { $regex: String(userId) } });
  } catch (error) {
    console.error('[sessions] failed to purge sessions:', error.message);
  }
}

export async function setAccountStatus({ role, id, accountStatus, actor }) {
  if (accountStatus !== 'active' && accountStatus !== 'inactive') {
    throw new AppError('Invalid account status', 400, 'VALIDATION_ERROR', [
      { field: 'accountStatus', message: 'Must be "active" or "inactive"' },
    ]);
  }

  ensureObjectId(id);
  const user = await User.findOne({ _id: id, role });
  if (!user) {
    throw new AppError('Account not found', 404, 'NOT_FOUND');
  }

  const previous = user.accountStatus;
  user.accountStatus = accountStatus;
  await user.save();

  if (accountStatus === 'inactive') {
    await destroyUserSessions(user._id);
  }

  await recordAudit({
    actor,
    action: 'account_status_changed',
    targetType: role,
    targetId: user._id,
    summary: `${user.username}: ${previous} -> ${accountStatus}`,
  });

  return getPublicUser(user);
}

export async function getLeaveSummary({ id }) {
  ensureObjectId(id);
  const user = await User.findById(id);
  if (!user) {
    throw new AppError('Account not found', 404, 'NOT_FOUND');
  }

  const applicantId = new mongoose.Types.ObjectId(id);

  const grouped = await LeaveApplication.aggregate([
    { $match: { applicant: applicantId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        days: { $sum: '$requestedPolicyDays' },
      },
    },
  ]);

  const summary = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    pendingDays: 0,
    approvedDays: 0,
    rejectedDays: 0,
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

  const recentApplications = await LeaveApplication.find({ applicant: applicantId })
    .sort({ submittedAt: -1 })
    .limit(5)
    .select(
      'applicationId status startDate endDate requestedCalendarDays requestedPolicyDays submittedAt'
    );

  return {
    user: getPublicUser(user),
    summary,
    recentApplications: recentApplications.map((doc) => doc.toJSON()),
  };
}
