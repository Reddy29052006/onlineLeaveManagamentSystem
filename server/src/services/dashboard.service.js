import { User } from '../models/index.js';
import LeaveApplication from '../models/LeaveApplication.js';
import InstitutionSettings from '../models/InstitutionSettings.js';
import { getTodayInTimeZone } from '../utils/dateOnly.js';
import { getApplicantSummary } from './leave.service.js';
import { getUnreadCount } from './notification.service.js';

/**
 * Statistics for a single student/teacher: application counts and days,
 * upcoming approved leave, currently active approved leave, unread
 * notifications, and recent records.
 */
export async function getApplicantDashboard({ user }) {
  const { today, summary, recentApplications } = await getApplicantSummary({ user });
  const { unreadCount } = await getUnreadCount({ user });

  return {
    today,
    stats: {
      total: summary.total,
      pending: summary.pending,
      approved: summary.approved,
      rejected: summary.rejected,
      pendingDays: summary.pendingDays,
      approvedDays: summary.approvedDays,
      rejectedDays: summary.rejectedDays,
      upcomingApproved: summary.upcomingApproved,
      currentOnLeave: summary.currentOnLeave,
      unreadNotifications: unreadCount,
    },
    recentApplications,
  };
}

/**
 * Institution-wide statistics for the administrator. "Currently on leave"
 * counts distinct applicants (deduplicated across overlapping approved
 * applications) whose approved range includes today in the institution
 * timezone.
 */
export async function getAdminDashboard() {
  const settings = await InstitutionSettings.getSettings();
  const today = getTodayInTimeZone(settings.timezone || 'Asia/Kolkata');

  const [students, teachers, statusGroups, onLeaveGroups, recentApplications] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'teacher' }),
    LeaveApplication.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    LeaveApplication.aggregate([
      {
        $match: {
          status: 'Approved',
          startDate: { $lte: today },
          endDate: { $gte: today },
        },
      },
      { $group: { _id: '$applicant', role: { $first: '$applicantRoleSnapshot' } } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
    LeaveApplication.find()
      .sort({ submittedAt: -1 })
      .limit(6),
  ]);

  const applications = { total: 0, pending: 0, approved: 0, rejected: 0 };
  for (const group of statusGroups) {
    applications.total += group.count;
    if (group._id === 'Pending') applications.pending = group.count;
    else if (group._id === 'Approved') applications.approved = group.count;
    else if (group._id === 'Rejected') applications.rejected = group.count;
  }

  const onLeave = { students: 0, teachers: 0, total: 0 };
  for (const group of onLeaveGroups) {
    if (group._id === 'student') onLeave.students = group.count;
    else if (group._id === 'teacher') onLeave.teachers = group.count;
    onLeave.total += group.count;
  }

  return {
    today,
    users: {
      students,
      teachers,
      totalStudents: students,
      totalTeachers: teachers,
      total: students + teachers,
    },
    applications,
    onLeave,
    recentApplications: recentApplications.map((doc) => doc.toJSON()),
  };
}
