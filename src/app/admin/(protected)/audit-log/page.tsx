'use client';

import { AuditLogDashboard } from '@/components/admin/audit-log-dashboard';
export default function AuditLogPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
                <p className="text-muted-foreground">
                    Track all administrative actions performed in the system.
                </p>
            </div>

            <div>
                <AuditLogDashboard />
            </div>
        </div>
    );
}
