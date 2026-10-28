import { logger } from '../utils/logger.js';
import { firebaseRtdbAdapter } from '../integrations/firebase/firebaseRtdbAdapter.js';

export const auditService = {
  logEvent: async ({ actorUserId, actorRole, action, targetResource, ipAddress, userAgent, metadata = {} }) => {
    const auditRecord = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      actorUserId: actorUserId || 'anonymous',
      actorRole: actorRole || 'system',
      action,
      targetResource: targetResource || 'unknown',
      ipAddress: ipAddress || '127.0.0.1',
      userAgent: userAgent || 'internal',
      metadata, // Sanitized, no PII or clinical notes
    };

    // Log securely to logger
    logger.info(`Audit Log: [${action}] by [${auditRecord.actorRole}:${auditRecord.actorUserId}] on [${targetResource}]`);

    // In Phase 2+, write to Firebase RTDB /auditLogs node
    if (firebaseRtdbAdapter.isConfigured()) {
      await firebaseRtdbAdapter.set(`auditLogs/${auditRecord.id}`, auditRecord);
    }

    return auditRecord;
  },

  record: async ({ action, userId, details = {}, ...rest }) => {
    return auditService.logEvent({
      action,
      actorUserId: userId,
      metadata: details,
      ...rest,
    });
  },

  log: async (args) => {
    return auditService.record(args);
  },
};
