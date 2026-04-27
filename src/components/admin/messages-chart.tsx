'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { useTheme } from 'next-themes';

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: {
    seconds: number;
    nanoseconds: number;
  } | null;
  read: boolean;
};

interface MessagesChartProps {
  messages: Message[];
}

export function MessagesChart({ messages }: MessagesChartProps) {
  const { theme } = useTheme();

  const chartData = React.useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) =>
      subDays(new Date(), i)
    ).reverse();

    return last7Days.map((day) => {
      const formattedDate = format(day, 'MMM d');
      const messageCount = messages.filter((message) => {
        if (!message.created_at) return false;
        const messageDate = new Date(message.created_at.seconds * 1000);
        return format(messageDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      }).length;

      return {
        date: formattedDate,
        messages: messageCount,
      };
    });
  }, [messages]);

  const tickColor = theme === 'dark' ? '#888' : '#333';
  const strokeColor = '#8b5cf6';
  const fillColor = 'url(#colorMessages)';

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis dataKey="date" tick={{ fill: tickColor }} tickLine={{ stroke: tickColor }} />
          <YAxis allowDecimals={false} tick={{ fill: tickColor }} tickLine={{ stroke: tickColor }} />
          <Tooltip
            contentStyle={{
              backgroundColor: theme === 'dark' ? '#0f172a' : '#fff',
              borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
            }}
          />
          <Area
            type="monotone"
            dataKey="messages"
            stroke={strokeColor}
            fill={fillColor}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
