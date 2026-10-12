import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { AppError } from '../utils/AppError.js';

function ensureObjectId(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Invalid notification identifier', 400, 'VALIDATION_ERROR', [
      { field: 'id', message: 'Identifier is not valid' },
    ]);
  }
}

/**
 * List the current user's notifications. Every query is scoped to the
 * recipient, so a user can never read another user's notifications.
 */
export async function listNotifications({ user, query = {} }) {
  const { page, limit, skip } = parsePagination(query);

  const filter = { recipient: user._id };
  if (query.status === 'unread') filter.readAt = null;
  else if (query.status === 'read') filter.readAt = { $ne: null };

  const [docs, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: user._id, readAt: null }),
  ]);

  return {
    items: docs.map((doc) => doc.toJSON()),
    pagination: buildPaginationMeta({ page, limit, total }),
    unreadCount,
  };
}

export async function getUnreadCount({ user }) {
  const unreadCount = await Notification.countDocuments({
    recipient: user._id,
    readAt: null,
  });
  return { unreadCount };
}

/**
 * Mark one notification read. The recipient is part of the update filter, so a
 * different user's notification ID cannot be marked (it returns 404).
 */
export async function markNotificationRead({ user, id }) {
  ensureObjectId(id);

  const updated = await Notification.findOneAndUpdate(
    { _id: id, recipient: user._id },
    { $set: { readAt: new Date() } },
    { new: true }
  );

  if (!updated) {
    throw new AppError('Notification not found', 404, 'NOT_FOUND');
  }

  return updated.toJSON();
}

export async function markAllNotificationsRead({ user }) {
  const result = await Notification.updateMany(
    { recipient: user._id, readAt: null },
    { $set: { readAt: new Date() } }
  );
  return { updated: result.modifiedCount };
}
