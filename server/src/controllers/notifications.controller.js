import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notification.service.js';

export async function list(req, res, next) {
  try {
    const data = await listNotifications({ user: req.user, query: req.query });
    res.json({ success: true, data, message: 'OK' });
  } catch (error) {
    next(error);
  }
}

export async function unreadCount(req, res, next) {
  try {
    const data = await getUnreadCount({ user: req.user });
    res.json({ success: true, data, message: 'OK' });
  } catch (error) {
    next(error);
  }
}

export async function markRead(req, res, next) {
  try {
    const notification = await markNotificationRead({
      user: req.user,
      id: req.params.id,
    });
    res.json({ success: true, data: { notification }, message: 'Notification marked read' });
  } catch (error) {
    next(error);
  }
}

export async function markAllRead(req, res, next) {
  try {
    const data = await markAllNotificationsRead({ user: req.user });
    res.json({ success: true, data, message: 'Notifications marked read' });
  } catch (error) {
    next(error);
  }
}
