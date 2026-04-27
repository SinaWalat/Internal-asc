import { PaymentsDashboard } from '@/components/admin/payments-dashboard';

export default function PaymentsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
                <p className="text-muted-foreground">
                    View all successful payments for student ID cards.
                </p>
            </div>
            <PaymentsDashboard />
        </div>
    );
}
