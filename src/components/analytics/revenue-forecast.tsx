'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface RevenueForecastProps {
    data: any[];
}

export function RevenueForecast({ data }: RevenueForecastProps) {
    return (
        <Card className="col-span-2 bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-orange-500/5 rounded-2xl p-2">
            <CardHeader>
                <CardTitle>Revenue Forecast</CardTitle>
                <CardDescription>
                    Historical revenue and 6-month predictive analysis
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
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
                                tickFormatter={(value) => `${value / 1000}k`}
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px'
                                }}
                                formatter={(value: number) => [`${value.toLocaleString()} IQD`, 'Revenue']}
                            />
                            <Legend />

                            {/* Historical Data Area */}
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#8884d8"
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                name="Historical Revenue"
                            />

                            {/* Forecast Line (dashed) */}
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#82ca9d"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                activeDot={false}
                                name="Projected Trend"
                                connectNulls
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
