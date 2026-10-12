import mongoose from 'mongoose';

const { Schema } = mongoose;

export const AUDIT_ACTIONS = [
  'account_created',
  'account_updated',
  'account_status_changed',
  'leave_submitted',
  'leave_approved',
  'leave_rejected',
  'calendar_event_created',
  'calendar_event_updated',
  'calendar_event_deleted',
  'settings_updated',
  'user_login',
];

const auditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true, enum: AUDIT_ACTIONS },
    targetType: { type: String, trim: true, default: '' },
    targetId: { type: String, trim: true, default: '' },
    // Short human-readable summary only. Never store passwords, tokens, or
    // unnecessary personal data here.
    summary: { type: String, trim: true, maxlength: 500, default: '' },
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

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
