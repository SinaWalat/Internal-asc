'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface IncomeChartProps {
    data: Array<{
        month: string;
        completed: number;
        pending: number;
    }>;
}

export function IncomeChart({ data }: IncomeChartProps) {
    // Show chart if we have data array (even if all values are 0)
    const hasData = data && data.length > 0;

    return (
        <Card className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 rounded-2xl p-2">
            <CardHeader>
                <CardTitle className="text-base font-semibold">Payment Analytics</CardTitle>
                <CardDescription className="text-sm">Track payments and verifications over time</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm bg-primary"></div>
                        <span className="text-muted-foreground">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm bg-foreground"></div>
                        <span className="text-muted-foreground">Pending</span>
                    </div>
                </div>
                {hasData ? (
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                domain={[0, 'dataMax + 1']}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                }}
                            />
                            <Bar
                                dataKey="completed"
                                stackId="a"
                                fill="hsl(var(--primary))"
                                radius={[4, 4, 0, 0]}
                                isAnimationActive={true}
                                animationDuration={800}
                                animationEasing="ease-in-out"
                            />
                            <Bar
                                dataKey="pending"
                                stackId="a"
                                fill="hsl(var(--foreground))"
                                radius={[4, 4, 0, 0]}
                                isAnimationActive={true}
                                animationDuration={800}
                                animationEasing="ease-in-out"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                        <p className="text-sm">No payment data available</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
