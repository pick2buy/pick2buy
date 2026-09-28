import { prisma } from './prisma';

export interface AuditLogParams {
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        userEmail: params.userEmail || null,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId || null,
        oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
        newValue: params.newValue ? JSON.stringify(params.newValue) : null,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    console.error('[AuditLog] Failed to record audit log:', error);
  }
}
