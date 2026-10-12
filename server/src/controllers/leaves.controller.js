import {
  submitApplication,
  getApplication,
  getApplicationLetter,
  listApplications,
  approveApplication,
  rejectApplication,
  listMyApplications,
  getApplicantSummary,
} from '../services/leave.service.js';
import { buildLetterPayload } from '../services/letter.service.js';
import {
  checkDateRange,
  listEvents,
} from '../services/calendar.service.js';

export async function createLeave(req, res, next) {
  try {
    const { application, letter, range, warnings } = await submitApplication({
      user: req.user,
      data: req.body || {},
    });
    res.status(201).json({
      success: true,
      data: {
        application,
        letter,
        warnings,
        range: {
          calendarDays: range.calendarDays,
          policyDays: range.policyDays,
          weekendDays: range.weekendDays,
          holidayDays: range.holidayDays,
        },
      },
      message: `Leave application ${application.applicationId} submitted`,
    });
  } catch (error) {
    next(error);
  }
}

export async function getLeave(req, res, next) {
  try {
    const application = await getApplication({ id: req.params.id, user: req.user });
    res.json({
      success: true,
      data: {
        application: application.toJSON(),
        letter: buildLetterPayload(application),
      },
      message: 'OK',
    });
  } catch (error) {
    next(error);
  }
}

export async function getLeaveLetter(req, res, next) {
  try {
    const letter = await getApplicationLetter({ id: req.params.id, user: req.user });
    res.json({ success: true, data: { letter }, message: 'OK' });
  } catch (error) {
    next(error);
  }
}

export async function listLeaves(req, res, next) {
  try {
    const { items, pagination } = await listApplications({ query: req.query });
    res.json({ success: true, data: { items, pagination }, message: 'OK' });
  } catch (error) {
    next(error);
  }
}

export async function approveLeave(req, res, next) {
  try {
    const application = await approveApplication({
      id: req.params.id,
      actor: req.user,
      decisionNote: (req.body || {}).decisionNote,
    });
    res.json({
      success: true,
      data: { application: application.toJSON() },
      message: `Application ${application.applicationId} approved`,
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectLeave(req, res, next) {
  try {
    const application = await rejectApplication({
      id: req.params.id,
      actor: req.user,
      rejectionReason: (req.body || {}).rejectionReason,
      decisionNote: (req.body || {}).decisionNote,
    });
    res.json({
      success: true,
      data: { application: application.toJSON() },
      message: `Application ${application.applicationId} rejected`,
    });
  } catch (error) {
    next(error);
  }
}

export async function listMyLeaves(req, res, next) {
  try {
    const { items, pagination } = await listMyApplications({
      user: req.user,
      query: req.query,
    });
    res.json({ success: true, data: { items, pagination }, message: 'OK' });
  } catch (error) {
    next(error);
  }
}

export async function myLeaveSummary(req, res, next) {
  try {
    const data = await getApplicantSummary({ user: req.user });
    res.json({ success: true, data, message: 'OK' });
  } catch (error) {
    next(error);
  }
}

import { generateLeaveApplicationPdf } from '../services/pdf.service.js';
import { recordAudit } from '../services/audit.service.js';

export async function downloadLeavePdf(req, res, next) {
  try {
    const application = await getApplication({ id: req.params.id, user: req.user });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="Leave_Application_${application.applicationId}.pdf"`
    );

    await generateLeaveApplicationPdf(application, res);

    await recordAudit({
      actor: req.user,
      action: 'leave_pdf_downloaded',
      targetType: 'leave_application',
      targetId: application._id,
      summary: `Downloaded PDF for application ${application.applicationId}`,
    });
  } catch (error) {
    next(error);
  }
}

