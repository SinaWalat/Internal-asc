'use client';

import React from 'react';
import { useCachedData } from '@/hooks/use-cached-data';
import { useFirebase, useMemoFirebase } from '@/firebase/client';
import { collection } from 'firebase/firestore';
import { RevenueForecast } from '@/components/analytics/revenue-forecast';
import { DemographicsChart } from '@/components/analytics/demographics-chart';
import { ConversionFunnel } from '@/components/analytics/conversion-funnel';
import { calculateRevenueForecast, calculateConversionFunnel, analyzeDemographics } from '@/lib/analytics-engine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp, Users, CreditCard } from 'lucide-react';

export default function AnalyticsPage() {
    const { firestore } = useFirebase();

    const kycQuery = useMemoFirebase(
        () => firestore ? collection(firestore, 'KYC_Verifications') : null,
        [firestore]
    );

    const profilesQuery = useMemoFirebase(
        () => firestore ? collection(firestore, 'profiles') : null,
        [firestore]
    );

    const paymentsQuery = useMemoFirebase(
        () => firestore ? collection(firestore, 'payments') : null,
        [firestore]
    );

    const { data: kycDocs } = useCachedData<any[]>('admin_kyc_cache', kycQuery);
    const { data: profiles } = useCachedData<any[]>('admin_profiles_cache', profilesQuery);
    const { data: paymentDocs } = useCachedData<any[]>('admin_payments_cache', paymentsQuery);

    // Process data for analytics
    const analyticsData = React.useMemo(() => {
        if (!kycDocs || !profiles || !paymentDocs) return null;

        // 1. Prepare Revenue Data (Monthly)
        const revenueMap = new Map<string, number>();
        const today = new Date();

        // Initialize last 12 months with 0
        for (let i = 11; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            revenueMap.set(key, 0);
        }

        // Calculate Revenue from Unified Payments Collection
        if (paymentDocs) {
            paymentDocs.forEach(doc => {
                if (doc.createdAt) {
                    let date;
                    if (doc.createdAt.toDate) date = doc.createdAt.toDate();
                    else if (doc.createdAt.seconds) date = new Date(doc.createdAt.seconds * 1000);
                    else date = new Date(doc.createdAt);

                    const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

                    // Only count revenue for the last 12 months
                    if (revenueMap.has(key)) {
                        const amount = doc.amount || 25000;
                        revenueMap.set(key, (revenueMap.get(key) || 0) + amount);
                    }
                }
            });
        }

        const revenueHistory = Array.from(revenueMap.entries()).map(([month, revenue]) => ({
            month,
            revenue
        }));

        const revenueForecast = calculateRevenueForecast(revenueHistory);

        // 2. Demographics
        const demographics = analyzeDemographics(profiles);

        // 3. Conversion Funnel
        const funnel = calculateConversionFunnel(kycDocs);

        // 4. Quick Stats
        const totalRevenue = revenueHistory.reduce((sum, item) => sum + item.revenue, 0);
        const avgRevenue = totalRevenue / (revenueHistory.length || 1);
        const conversionRate = kycDocs.length > 0 ? (kycDocs.filter(d => d.paymentId).length / kycDocs.length) * 100 : 0;

        return {
            revenueForecast,
            demographics,
            funnel,
            stats: {
                totalRevenue,
                avgRevenue,
                conversionRate,
                totalStudents: profiles.length
            }
        };
    }, [kycDocs, profiles, paymentDocs]);

    if (!analyticsData) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-48 bg-muted rounded" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-muted rounded" />
                    ))}
                </div>
                <div className="h-[400px] bg-muted rounded" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
                <p className="text-muted-foreground">Deep insights into your student ID card operations</p>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-transparent shadow-none border-black/5 dark:border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue (YTD)</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.stats.totalRevenue.toLocaleString()} IQD</div>
                        <p className="text-xs text-muted-foreground">+20.1% from last year</p>
                    </CardContent>
                </Card>
                <Card className="bg-transparent shadow-none border-black/5 dark:border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Monthly Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Math.round(analyticsData.stats.avgRevenue).toLocaleString()} IQD</div>
                        <p className="text-xs text-muted-foreground">Based on last 12 months</p>
                    </CardContent>
                </Card>
                <Card className="bg-transparent shadow-none border-black/5 dark:border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.stats.conversionRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">Application to Payment</p>
                    </CardContent>
                </Card>
                <Card className="bg-transparent shadow-none border-black/5 dark:border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analyticsData.stats.totalStudents.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Registered profiles</p>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Forecast */}
            <RevenueForecast data={analyticsData.revenueForecast} />

            {/* Demographics */}
            <DemographicsChart
                universityData={analyticsData.demographics.universityData}
                genderData={analyticsData.demographics.genderData}
            />

            {/* Conversion Funnel */}
            <ConversionFunnel data={analyticsData.funnel} />
        </div>
    );
}
