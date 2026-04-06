import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { amount, sessionType, userEmail, userId, slotId, date } = await request.json();

    console.log('Create order request:', { amount, sessionType, userEmail, userId, slotId, date });

    if (!amount || !sessionType || !userEmail) {
      console.error('Missing required fields:', { amount, sessionType, userEmail });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    console.log('Razorpay credentials:', { keyId: keyId ? 'set' : 'missing', keySecret: keySecret ? 'set' : 'missing' });

    if (!keyId || !keySecret) {
      console.error('Razorpay credentials not configured');
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    // Create Authorization header
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    // Generate short receipt (max 40 chars)
    const shortId = slotId?.slice(0, 8) || 'booking';
    const timestamp = Date.now().toString().slice(-6);
    const receipt = `${shortId}_${timestamp}`;

    console.log('Receipt:', receipt, 'Length:', receipt.length);

    // Call Razorpay API directly
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        receipt,
        notes: {
          sessionType,
          userId,
          slotId,
          date,
          userEmail,
        },
      }),
    });

    const orderData = await response.json();

    if (!response.ok) {
      console.error('Razorpay API error:', orderData);
      return NextResponse.json(
        { error: `Failed to create order: ${orderData.error?.description || 'Unknown error'}` },
        { status: response.status }
      );
    }

    console.log('Order created:', orderData.id);

    return NextResponse.json({
      orderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      key: keyId,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create payment order: ${errorMsg}` },
      { status: 500 }
    );
  }
}
