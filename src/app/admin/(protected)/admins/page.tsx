'use client';
import { AdminsDashboard } from '@/components/admin/admins-dashboard';
export default function AdminsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Management</h1>
                <p className="text-muted-foreground">
                    View and manage existing administrators.
                </p>
            </div>

            <div>
                <AdminsDashboard />
            </div>
        </div>
    )
}
