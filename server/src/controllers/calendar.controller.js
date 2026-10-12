import {
  checkDateRange,
  listEvents,
  getEventById,
  createEvent as createCalendarEvent,
  updateEvent as updateCalendarEvent,
  deleteEvent as deleteCalendarEvent,
} from '../services/calendar.service.js';

export async function checkRange(req, res, next) {
  try {
    const { startDate, endDate } = req.body || {};
    const range = await checkDateRange({ startDate, endDate });
    res.json({ success: true, data: { range }, message: 'OK' });
  } catch (error) {
    next(error);
  }
}

export async function getEvents(req, res, next) {
  try {
    const events = await listEvents({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      type: req.query.type,
      includeInactive: req.query.includeInactive === 'true' && req.user?.role === 'admin',
    });
    res.json({
      success: true,
      data: { events: events.map((event) => event.toJSON()) },
      message: 'OK',
    });
  } catch (error) {
    next(error);
  }
}

export async function getEvent(req, res, next) {
  try {
    const event = await getEventById({ id: req.params.id });
    res.json({
      success: true,
      data: { event: event.toJSON() },
      message: 'OK',
    });
  } catch (error) {
    next(error);
  }
}

export async function createEvent(req, res, next) {
  try {
    const result = await createCalendarEvent({
      data: req.body || {},
      user: req.user,
    });
    res.status(201).json({
      success: true,
      data: {
        event: result.event.toJSON(),
        overlappingCount: result.overlappingCount,
        overlappingEvents: result.overlappingEvents,
      },
      message: `Calendar event "${result.event.name}" created`,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateEvent(req, res, next) {
  try {
    const updated = await updateCalendarEvent({
      id: req.params.id,
      data: req.body || {},
      user: req.user,
    });
    res.json({
      success: true,
      data: { event: updated.toJSON() },
      message: `Calendar event "${updated.name}" updated`,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteEvent(req, res, next) {
  try {
    const result = await deleteCalendarEvent({
      id: req.params.id,
      user: req.user,
    });
    res.json({
      success: true,
      data: result,
      message: `Calendar event "${result.name}" deleted`,
    });
  } catch (error) {
    next(error);
  }
}
