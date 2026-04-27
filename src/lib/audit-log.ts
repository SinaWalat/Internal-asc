import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

export type AuditAction =
    | 'message_deleted'
    | 'message_edited'
    | 'admin_deleted'
    | 'admin_edited'
    | 'admin_created'
    | 'kyc_approved'
    | 'kyc_rejected'
    | 'kyc_on_hold';

export interface AuditLogEntry {
    action: AuditAction;
    adminEmail: string;
    targetId: string;
    targetType: 'message' | 'admin' | 'kyc';
    details?: Record<string, any>;
    timestamp: any;
}

/**
 * Logs an admin action to the audit_logs collection in Firestore
 */
export async function logAuditAction(
    firestore: Firestore,
    action: AuditAction,
    adminEmail: string,
    targetId: string,
    targetType: 'message' | 'admin' | 'kyc',
    details?: Record<string, any>
): Promise<void> {
    try {
        const auditLogsRef = collection(firestore, 'audit_logs');
        await addDoc(auditLogsRef, {
            action,
            adminEmail,
            targetId,
            targetType,
            details: details || {},
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error('Failed to log audit action:', error);
        // Don't throw - we don't want audit logging failures to break the main action
    }
}

/**
 * Gets a human-readable description of an audit action
 */
export function getAuditActionDescription(action: AuditAction): string {
    const descriptions: Record<AuditAction, string> = {
        message_deleted: 'Deleted a message',
        message_edited: 'Edited a message',
        admin_deleted: 'Deleted an admin',
        admin_edited: 'Edited an admin',
        admin_created: 'Created an admin',
        kyc_approved: 'Approved KYC verification',
        kyc_rejected: 'Rejected KYC verification',
        kyc_on_hold: 'Put KYC verification on hold',
    };
    return descriptions[action] || action;
}
