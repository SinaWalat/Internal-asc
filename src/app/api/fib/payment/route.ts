import { NextResponse } from 'next/server';

const FIB_AUTH_URL = 'https://fib.stage.fib.iq/auth/realms/fib-online-shop/protocol/openid-connect/token';
const FIB_PAYMENT_URL = 'https://fib.stage.fib.iq/protected/v1/payments';
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

export async function POST() {
    try {
        const token = await getAccessToken();

        const paymentResponse = await fetch(FIB_PAYMENT_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                monetaryValue: {
                    amount: '25000',
                    currency: 'IQD',
                },
                description: 'Student ID Card Fee',
            }),
        });

        if (!paymentResponse.ok) {
            const errorText = await paymentResponse.text();
            console.error('FIB Payment Creation Error:', errorText);
            return NextResponse.json({ error: 'Failed to create payment' }, { status: paymentResponse.status });
        }

        const paymentData = await paymentResponse.json();
        return NextResponse.json(paymentData);

    } catch (error) {
        console.error('FIB API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
