"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
    users: {
        label: "Users",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig

interface ActiveUsersChartProps {
    data: { date: string; users: number }[]
    totalUsers: number
}

export function ActiveUsersChart({ data, totalUsers }: ActiveUsersChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Active Users</CardTitle>
                <CardDescription>
                    Showing total users for the last 30 days
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <div className="text-4xl font-bold">{totalUsers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                        Total registered users
                    </p>
                </div>
                <ChartContainer config={chartConfig}>
                    <AreaChart
                        accessibilityLayer
                        data={data}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <Area
                            dataKey="users"
                            type="natural"
                            fill="var(--color-users)"
                            fillOpacity={0.4}
                            stroke="var(--color-users)"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
