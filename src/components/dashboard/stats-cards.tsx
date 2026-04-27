'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, FileCheck, ShieldCheck, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardsProps {
    totalStudents: number;
    newApplications: number;
    verifiedStudents: number;
    totalRevenue: number;
    previousRevenue: number;
    period: string;
    history: {
        totalStudents: { value: number }[];
        newApplications: { value: number }[];
        verifiedStudents: { value: number }[];
    };
}

export function StatsCards({ totalStudents, newApplications, verifiedStudents, totalRevenue, previousRevenue, period, history }: StatsCardsProps) {
    // Calculate percentage change based on history
    const calculateChange = (currentValue: number, historyData: { value: number }[]) => {
        if (!historyData || historyData.length < 2) return { percentage: 0, isPositive: true };

        const previousValue = historyData[historyData.length - 2]?.value || 0;
        if (previousValue === 0) return { percentage: currentValue > 0 ? 100 : 0, isPositive: currentValue > 0 };

        const change = ((currentValue - previousValue) / previousValue) * 100;
        return {
            percentage: Math.abs(change).toFixed(1),
            isPositive: change >= 0
        };
    };

    // Calculate revenue change
    const revenueChange = React.useMemo(() => {
        if (previousRevenue === 0) {
            return { percentage: totalRevenue > 0 ? '100.0' : '0.0', isPositive: totalRevenue > 0 };
        }
        const change = ((totalRevenue - previousRevenue) / previousRevenue) * 100;
        return {
            percentage: Math.abs(change).toFixed(1),
            isPositive: change >= 0
        };
    }, [totalRevenue, previousRevenue]);

    const cards = [
        {
            title: 'Total Students',
            value: totalStudents.toLocaleString(),
            change: calculateChange(totalStudents, history.totalStudents),
            icon: Users,
        },
        {
            title: 'New Applications',
            value: newApplications.toLocaleString(),
            change: calculateChange(newApplications, history.newApplications),
            icon: FileCheck,
        },
        {
            title: 'Verified Students',
            value: verifiedStudents.toLocaleString(),
            change: calculateChange(verifiedStudents, history.verifiedStudents),
            icon: ShieldCheck,
        },
        {
            title: 'Total Revenue',
            value: `${totalRevenue.toLocaleString()} IQD`,
            change: revenueChange,
            icon: ShoppingCart,
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, i) => (
                <StatsCard key={i} card={card} />
            ))}
        </div>
    );
}

function StatsCard({ card }: { card: any }) {
    const divRef = React.useRef<HTMLDivElement>(null);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = React.useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;

        const div = divRef.current;
        const rect = div.getBoundingClientRect();

        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseEnter = () => {
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    const Icon = card.icon;

    return (
        <Card
            ref={divRef}
            className="relative overflow-hidden bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 rounded-2xl transition-all duration-300 hover:shadow-black/10"
        >
            <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Icon className="h-4 w-4" />
                            <span>{card.title}</span>
                        </div>
                        <div className="space-y-1">
                            <div className="text-3xl font-bold tracking-tight">
                                {card.value}
                            </div>
                            <div className={`flex items-center gap-1 text-xs ${card.change.isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                {card.change.isPositive ? (
                                    <TrendingUp className="h-3 w-3" />
                                ) : (
                                    <TrendingDown className="h-3 w-3" />
                                )}
                                <span className="font-medium">{card.change.percentage}%</span>
                                <span className="text-muted-foreground">vs last period</span>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-full bg-primary/10 p-3">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
