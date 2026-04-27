import { NextResponse } from 'next/server';

const FIB_AUTH_URL = 'https://fib.stage.fib.iq/auth/realms/fib-online-shop/protocol/openid-connect/token';
const CLIENT_ID = 'uni-system-testpayment';
const CLIENT_SECRET = 'e7c0e3b0-3f46-4c3a-a9ee-da81b5c05bf0';

async function getAccessToken() {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);

    const response = await fetch(FIB_AUTH_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
    });

    if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
}

export async function GET(
    request: Request,
    { params }: { params: { paymentId: string } }
) {
    const paymentId = params.paymentId;

    if (!paymentId) {
        return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    try {
        const token = await getAccessToken();
        const statusUrl = `https://fib.stage.fib.iq/protected/v1/payments/${paymentId}/status`;

        const statusResponse = await fetch(statusUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!statusResponse.ok) {
            // If 404 or other error, return it
            return NextResponse.json({ error: 'Failed to fetch status' }, { status: statusResponse.status });
        }

        const statusData = await statusResponse.json();
        return NextResponse.json(statusData);

    } catch (error) {
        console.error('FIB Status Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
