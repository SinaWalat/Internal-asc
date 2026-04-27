'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { LucideIcon } from 'lucide-react';

export interface DashboardCardProps {
  title: string;
  value: string | number;
  period: string;
  icon: LucideIcon;
  chartData: { value: number }[];
  color: string;
}

export function DashboardCard({
  title,
  value,
  period,
  icon: Icon,
  chartData,
  color,
}: DashboardCardProps) {
  const gradientId = `gradient-${title.replace(/\s/g, '')}`;
  const chartColor = color;

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        <div className="flex items-center gap-2">
          <Icon className="size-5" style={{ color: chartColor }} />
          <span className="text-base font-semibold">{title}</span>
        </div>

        <div className="flex items-end gap-2.5 justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {period}
            </div>
            <div className="text-3xl font-bold text-foreground tracking-tight">
              {value}
            </div>
          </div>

          <div className="max-w-40 h-16 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0.05} />
                  </linearGradient>
                </defs>

                <Tooltip
                  cursor={{ stroke: chartColor, strokeWidth: 1, strokeDasharray: '2 2' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background/95 backdrop-blur-sm border border-border shadow-lg rounded-lg p-2 pointer-events-none">
                          <p className="text-sm font-semibold text-foreground">
                            {payload[0].value}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={chartColor}
                  fill={`url(#${gradientId})`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: chartColor,
                    stroke: '#FFF',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
