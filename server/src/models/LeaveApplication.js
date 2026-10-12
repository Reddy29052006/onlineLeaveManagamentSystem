import mongoose from 'mongoose';
import { DATE_ONLY_PATTERN, isValidDateOnly, compareDateOnly } from '../utils/dateOnly.js';

const { Schema } = mongoose;

export const LEAVE_STATUSES = ['Pending', 'Approved', 'Rejected'];

const leaveApplicationSchema = new Schema(
  {
    applicationId: { type: String, required: true, unique: true, trim: true },

    applicant: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Snapshots preserve the identity used on the generated letter even if the
    // applicant's profile changes later.
    applicantRoleSnapshot: { type: String, enum: ['student', 'teacher'] },
    applicantNameSnapshot: { type: String, trim: true },
    applicantIdSnapshot: { type: String, trim: true },
    departmentSnapshot: { type: String, trim: true },
    classOrDesignationSnapshot: { type: String, trim: true },

    purpose: { type: String, required: true, trim: true, minlength: 5, maxlength: 1000 },
    startDate: { type: String, required: true, match: DATE_ONLY_PATTERN },
    endDate: { type: String, required: true, match: DATE_ONLY_PATTERN },

    requestedCalendarDays: { type: Number, required: true, min: 1 },
    requestedPolicyDays: { type: Number, required: true, min: 1 },

    letterContent: { type: String, required: true },

    status: {
      type: String,
      enum: LEAVE_STATUSES,
      default: 'Pending',
    },

    submittedAt: { type: Date, default: Date.now },
    decisionAt: { type: Date, default: null },
    decidedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    rejectionReason: { type: String, trim: true, maxlength: 500, default: null },
    decisionNote: { type: String, trim: true, maxlength: 500, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: false,
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

leaveApplicationSchema.index({ applicant: 1, submittedAt: -1 });
leaveApplicationSchema.index({ status: 1, submittedAt: -1 });
leaveApplicationSchema.index({ startDate: 1, endDate: 1 });
leaveApplicationSchema.index({ status: 1, startDate: 1, endDate: 1 });

leaveApplicationSchema.pre('validate', function validateDatesAndDecision(next) {
  if (!isValidDateOnly(this.startDate)) {
    this.invalidate('startDate', 'startDate must be a valid YYYY-MM-DD date');
  }
  if (!isValidDateOnly(this.endDate)) {
    this.invalidate('endDate', 'endDate must be a valid YYYY-MM-DD date');
  }
  if (
    isValidDateOnly(this.startDate) &&
    isValidDateOnly(this.endDate) &&
    compareDateOnly(this.endDate, this.startDate) < 0
  ) {
    this.invalidate('endDate', 'endDate must be on or after startDate');
  }

  if (this.status === 'Rejected' && !this.rejectionReason) {
    this.invalidate('rejectionReason', 'rejectionReason is required when rejecting');
  }

  if (this.status !== 'Pending' && !this.decidedBy) {
    this.invalidate('decidedBy', 'decidedBy is required once a decision is made');
  }

  next();
});

export default mongoose.model('LeaveApplication', leaveApplicationSchema);
