'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { IncomeChart } from '@/components/dashboard/income-chart';
import { useFirebase, useMemoFirebase } from '@/firebase/client';
import { collection, query, getDocs } from 'firebase/firestore';
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCachedData } from '@/hooks/use-cached-data';
import { Input } from '@/components/ui/input';

type TimePeriod = '30days' | '7days' | 'today' | 'all';

export default function AdminDashboard() {
    const { firestore } = useFirebase();
    const [timePeriod, setTimePeriod] = React.useState<TimePeriod>('30days');
    const [displayedPeriod, setDisplayedPeriod] = React.useState<TimePeriod>('30days');

    const [statsData, setStatsData] = React.useState({
        totalStudents: { value: 0, history: [] as { value: number }[] },
        newApplications: { value: 0, history: [] as { value: number }[] },
        verifiedStudents: { value: 0, history: [] as { value: number }[] }
    });

    const profilesQuery = useMemoFirebase(
        () => firestore ? collection(firestore, 'profiles') : null,
        [firestore]
    );

    const { data: rawProfiles } = useCachedData<any[]>('admin_profiles_cache', profilesQuery);

    const profiles = React.useMemo(() => {
        if (!rawProfiles) return [];
        return rawProfiles.map(doc => {
            let createdAt = doc.createdAt;
            if (createdAt?.toDate) {
                createdAt = createdAt.toDate().toISOString();
            } else if (createdAt?.seconds) {
                createdAt = new Date(createdAt.seconds * 1000).toISOString();
            } else if (typeof createdAt !== 'string') {
                createdAt = new Date().toISOString();
            }
            return { ...doc, createdAt };
        });
    }, [rawProfiles]);

    const kycQuery = useMemoFirebase(
        () => firestore ? collection(firestore, 'KYC_Verifications') : null,
        [firestore]
    );

    const { data: rawKycDocs } = useCachedData<any[]>('admin_kyc_cache', kycQuery);

    // Query for payments to calculate total revenue
    const paymentsQuery = useMemoFirebase(
        () => firestore ? collection(firestore, 'payments') : null,
        [firestore]
    );

    const { data: rawPaymentDocs } = useCachedData<any[]>('admin_payments_cache', paymentsQuery);

    const kycDocs = React.useMemo(() => {
        if (!rawKycDocs) return [];
        return rawKycDocs.map(doc => {
            let submittedAt = doc.submittedAt;
            if (submittedAt?.toDate) {
                submittedAt = submittedAt.toDate().toISOString();
            } else if (submittedAt?.seconds) {
                submittedAt = new Date(submittedAt.seconds * 1000).toISOString();
            } else if (typeof submittedAt !== 'string') {
                submittedAt = new Date().toISOString();
            }
            return { ...doc, submittedAt };
        });
    }, [rawKycDocs]);

    // Calculate total revenue from unified payments collection filtered by time period
    const totalRevenue = React.useMemo(() => {
        if (!rawPaymentDocs) return 0;
        let total = 0;

        // Get date range for filtering
        const today = new Date();
        let startDate = new Date();

        if (timePeriod === 'today') {
            startDate.setHours(0, 0, 0, 0);
        } else if (timePeriod === '7days') {
            startDate.setDate(today.getDate() - 7);
        } else if (timePeriod === '30days') {
            startDate.setDate(today.getDate() - 30);
        } else {
            // 'all' - no filtering
            startDate = new Date(0); // Beginning of time
        }

        // Count payments in the selected period
        rawPaymentDocs.forEach(doc => {
            if (!doc.createdAt) return;

            let docDate;
            if (doc.createdAt.toDate) {
                docDate = doc.createdAt.toDate();
            } else if (doc.createdAt.seconds) {
                docDate = new Date(doc.createdAt.seconds * 1000);
            } else {
                docDate = new Date(doc.createdAt);
            }

            if (docDate >= startDate && docDate <= today) {
                const amount = doc.amount || 25000;
                total += amount;
            }
        });

        return total;
    }, [rawPaymentDocs, timePeriod]);

    // Calculate previous period revenue for comparison
    const previousRevenue = React.useMemo(() => {
        if (!rawPaymentDocs) return 0;

        const today = new Date();
        let periodStart = new Date();
        let periodEnd = new Date();

        // Determine the previous period based on current timePeriod
        if (timePeriod === '7days') {
            periodStart.setDate(today.getDate() - 14);
            periodEnd.setDate(today.getDate() - 7);
        } else if (timePeriod === 'today') {
            periodStart.setDate(today.getDate() - 1);
            periodStart.setHours(0, 0, 0, 0);
            periodEnd.setDate(today.getDate() - 1);
            periodEnd.setHours(23, 59, 59, 999);
        } else if (timePeriod === '30days') {
            periodStart.setDate(today.getDate() - 60);
            periodEnd.setDate(today.getDate() - 30);
        } else {
            // 'all' - compare last 30 days to previous 30 days
            periodStart.setDate(today.getDate() - 60);
            periodEnd.setDate(today.getDate() - 30);
        }

        let total = 0;

        // Count previous period payments
        rawPaymentDocs.forEach(doc => {
            if (!doc.createdAt) return;

            let docDate;
            if (doc.createdAt.toDate) {
                docDate = doc.createdAt.toDate();
            } else if (doc.createdAt.seconds) {
                docDate = new Date(doc.createdAt.seconds * 1000);
            } else {
                docDate = new Date(doc.createdAt);
            }

            if (docDate >= periodStart && docDate <= periodEnd) {
                const amount = doc.amount || 25000;
                total += amount;
            }
        });

        return total;
    }, [rawPaymentDocs, timePeriod]);

    // Generate chart data from real KYC applications
    const { revenueData, incomeData } = React.useMemo(() => {
        // Last 7 days for application analytics - use ALL applications, not filtered by time period
        const last7Days = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            // Use rawKycDocs to get ALL applications, not just those in the selected time period
            const count = rawKycDocs?.filter(doc => {
                if (!doc.submittedAt) return false;

                // Handle different date formats from Firestore
                let docDate;
                if (typeof doc.submittedAt === 'string') {
                    docDate = new Date(doc.submittedAt);
                } else if (doc.submittedAt?.toDate) {
                    docDate = doc.submittedAt.toDate();
                } else if (doc.submittedAt?.seconds) {
                    docDate = new Date(doc.submittedAt.seconds * 1000);
                } else {
                    return false;
                }

                return docDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === dateStr;
            }).length || 0;

            last7Days.push({ day: dayName, value: count });
        }

        // Last 8 months for PAYMENT analytics (using unified payments collection)
        const last8Months = [];
        for (let i = 7; i >= 0; i--) {
            const date = new Date();
            date.setMonth(today.getMonth() - i);
            const monthName = date.toLocaleDateString('en-US', { month: 'short' });
            const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

            // Count completed payments from unified collection
            const completed = rawPaymentDocs?.filter(doc => {
                if (!doc.createdAt) return false;

                let docDate;
                if (doc.createdAt.toDate) {
                    docDate = doc.createdAt.toDate();
                } else if (doc.createdAt.seconds) {
                    docDate = new Date(doc.createdAt.seconds * 1000);
                } else {
                    docDate = new Date(doc.createdAt);
                }

                const docMonthStr = docDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                return docMonthStr === monthStr && doc.status === 'PAID';
            }).length || 0;

            // Pending payments = KYC applications without paymentId (not yet paid)
            const pending = kycDocs.filter(doc => {
                if (doc.paymentId || !doc.submittedAt) return false; // Already paid or no date
                const docDate = new Date(doc.submittedAt);
                const docMonthStr = docDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                return docMonthStr === monthStr;
            }).length;

            last8Months.push({ month: monthName, completed, pending });
        }

        return {
            revenueData: last7Days,
            incomeData: last8Months
        };
    }, [kycDocs, rawKycDocs, rawPaymentDocs]);

    React.useEffect(() => {
        if (!profiles || !kycDocs) return;

        const processData = () => {
            try {
                const today = new Date();
                const startDate = new Date();
                let days = 30;

                if (timePeriod === '7days') {
                    days = 7;
                    startDate.setDate(today.getDate() - 7);
                } else if (timePeriod === 'today') {
                    days = 1;
                    startDate.setHours(0, 0, 0, 0);
                } else if (timePeriod === 'all') {
                    days = 30;
                    startDate.setTime(0);
                } else {
                    startDate.setDate(today.getDate() - 30);
                }

                const generateHistory = (items: any[], dateField: string, filterFn?: (item: any) => boolean) => {
                    const dailyCounts: Record<string, number> = {};

                    if (timePeriod === 'today') {
                        for (let i = 23; i >= 0; i--) {
                            const hourStr = `${i}:00`;
                            dailyCounts[hourStr] = 0;
                        }
                    } else {
                        for (let i = 0; i < days; i++) {
                            const d = new Date();
                            d.setDate(today.getDate() - i);
                            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            dailyCounts[dateStr] = 0;
                        }
                    }

                    items.forEach(item => {
                        if (filterFn && !filterFn(item)) return;

                        if (item[dateField]) {
                            const date = new Date(item[dateField]);
                            if (date >= (timePeriod === 'all' ? new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29) : startDate)) {
                                if (timePeriod === 'today') {
                                    const hourStr = `${date.getHours()}:00`;
                                    if (dailyCounts[hourStr] !== undefined) {
                                        dailyCounts[hourStr]++;
                                    }
                                } else {
                                    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                    if (dailyCounts[dateStr] !== undefined) {
                                        dailyCounts[dateStr]++;
                                    }
                                }
                            }
                        }
                    });

                    return Object.values(dailyCounts).reverse().map(count => ({ value: count }));
                };

                const filterByDateRange = (items: any[], dateField: string, filterFn?: (item: any) => boolean) => {
                    return items.filter(item => {
                        if (filterFn && !filterFn(item)) return false;
                        if (!item[dateField]) return false;
                        const date = new Date(item[dateField]);
                        return date >= startDate;
                    });
                };

                const studentHistory = generateHistory(profiles, 'createdAt');
                const filteredStudents = filterByDateRange(profiles, 'createdAt');

                const applicationHistory = generateHistory(kycDocs, 'submittedAt');
                const filteredApplications = filterByDateRange(kycDocs, 'submittedAt');

                const verifiedHistory = generateHistory(kycDocs, 'submittedAt', (doc) => doc.status === 'approved');
                const filteredVerified = filterByDateRange(kycDocs, 'submittedAt', (doc) => doc.status === 'approved');

                setStatsData({
                    totalStudents: {
                        value: filteredStudents.length,
                        history: studentHistory
                    },
                    newApplications: {
                        value: filteredApplications.length,
                        history: applicationHistory
                    },
                    verifiedStudents: {
                        value: filteredVerified.length,
                        history: verifiedHistory
                    }
                });

                setDisplayedPeriod(timePeriod);

            } catch (error) {
                console.error("Error processing dashboard data:", error);
            }
        };

        processData();
    }, [profiles, kycDocs, timePeriod]);

    const getPeriodLabel = (period: TimePeriod) => {
        switch (period) {
            case '30days': return 'Last 30 days';
            case '7days': return 'Last 7 days';
            case 'today': return 'Today';
            case 'all': return 'All Time';
        }
    };

    const formatDateRange = () => {
        const today = new Date();
        const startDate = new Date();

        if (timePeriod === '30days') {
            startDate.setDate(today.getDate() - 30);
        } else if (timePeriod === '7days') {
            startDate.setDate(today.getDate() - 7);
        } else if (timePeriod === 'today') {
            return today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } else {
            return 'All Time';
        }

        return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Student ID Card Dashboard</h1>
                    <p className="text-muted-foreground">Overview of applications and verifications</p>
                </div>
                <Select
                    value={timePeriod}
                    onValueChange={(val: any) => setTimePeriod(val)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="7days">Last 7 days</SelectItem>
                        <SelectItem value="30days">Last 30 days</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Stats Cards */}
            <StatsCards
                totalStudents={statsData.totalStudents.value}
                newApplications={statsData.newApplications.value}
                verifiedStudents={statsData.verifiedStudents.value}
                totalRevenue={totalRevenue}
                previousRevenue={previousRevenue}
                period={getPeriodLabel(displayedPeriod)}
                history={{
                    totalStudents: statsData.totalStudents.history,
                    newApplications: statsData.newApplications.history,
                    verifiedStudents: statsData.verifiedStudents.history
                }}
            />

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueChart data={revenueData} />
                <IncomeChart data={incomeData} />
            </div>
        </div>
    );
}
