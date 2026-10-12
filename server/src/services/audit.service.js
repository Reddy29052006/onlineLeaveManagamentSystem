import AuditLog from '../models/AuditLog.js';
import { env } from '../config/env.js';

/**
 * Best-effort audit trail. Never let an audit failure break the request, and
 * never store secrets (only short human-readable summaries).
 */
export async function recordAudit({ actor, action, targetType, targetId, summary }) {
  if (!env.auditLogEnabled) return;

  try {
    await AuditLog.create({
      actor: actor ? actor._id || actor : null,
      action,
      targetType: targetType || '',
      targetId: targetId ? String(targetId) : '',
      summary: summary || '',
    });
  } catch (error) {
    console.error('[audit] failed to record entry:', error.message);
  }
}
