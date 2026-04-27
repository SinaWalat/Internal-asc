import { addMonths, format, subMonths } from 'date-fns';

export interface RevenueData {
    month: string;
    revenue: number;
}

export interface DemographicData {
    category: string;
    value: number;
}

export interface FunnelData {
    stage: string;
    count: number;
    dropOff: number;
}

// Simple linear regression for revenue forecasting
export function calculateRevenueForecast(historicalData: RevenueData[], monthsToForecast: number = 6) {
    if (!historicalData || historicalData.length < 2) return [];

    const n = historicalData.length;
    // Use index as x (0, 1, 2...)
    const xValues = Array.from({ length: n }, (_, i) => i);
    const yValues = historicalData.map(d => d.revenue);

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate forecast
    const forecast = [];
    const lastDate = new Date(); // Assuming historical data ends at current month

    // Add historical data first
    historicalData.forEach(d => {
        forecast.push({
            month: d.month,
            revenue: d.revenue,
            isForecast: false
        });
    });

    // Add predicted data
    for (let i = 1; i <= monthsToForecast; i++) {
        const nextIndex = n - 1 + i;
        const predictedRevenue = slope * nextIndex + intercept;
        const nextMonthDate = addMonths(lastDate, i);

        forecast.push({
            month: format(nextMonthDate, 'MMM yyyy'),
            revenue: Math.max(0, Math.round(predictedRevenue)), // Prevent negative revenue
            isForecast: true,
            confidenceLow: Math.max(0, Math.round(predictedRevenue * 0.9)),
            confidenceHigh: Math.round(predictedRevenue * 1.1)
        });
    }

    return forecast;
}

export function calculateConversionFunnel(applications: any[]) {
    // In a real scenario, we would track these events properly.
    // For now, we'll estimate based on application status.

    const totalVisits = Math.round(applications.length * 2.5); // Estimate: 40% conversion from visit to app
    const started = applications.length;
    const completed = applications.filter(app => app.status !== 'draft').length;
    const paid = applications.filter(app => app.paymentId).length;
    const delivered = applications.filter(app => app.status === 'delivered').length;

    return [
        { stage: 'Site Visits', count: totalVisits, fill: '#8884d8' },
        { stage: 'App Started', count: started, fill: '#83a6ed' },
        { stage: 'Completed', count: completed, fill: '#8dd1e1' },
        { stage: 'Paid', count: paid, fill: '#82ca9d' },
        { stage: 'Delivered', count: delivered, fill: '#a4de6c' },
    ];
}

export function analyzeDemographics(profiles: any[]) {
    // University breakdown
    const universityCounts: Record<string, number> = {};
    profiles.forEach(p => {
        // Check for university field, fallback to 'Unknown' if missing
        const uni = p.university || p.universityName || 'Unknown';
        universityCounts[uni] = (universityCounts[uni] || 0) + 1;
    });

    const universityData = Object.entries(universityCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5

    // Gender breakdown
    const genderCounts: Record<string, number> = { Male: 0, Female: 0, Other: 0 };
    profiles.forEach(p => {
        const gender = p.gender ? p.gender.toLowerCase() : 'unknown';
        if (gender === 'male' || gender === 'm') genderCounts.Male++;
        else if (gender === 'female' || gender === 'f') genderCounts.Female++;
        else genderCounts.Other++;
    });

    // Filter out zero values for cleaner chart
    const genderData = Object.entries(genderCounts)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({ name, value }));

    return {
        universityData,
        genderData
    };
}
