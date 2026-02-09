import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/app/lib/firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, slotId, price, packageName, customerEmail, customerName, userId, type } = body; // Added type

    if (!bookingId || !price) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    // 1. Verify the Booking Exists & is Approved
    const bookingRef = adminDb.collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return NextResponse.json({ error: 'Booking record not found.' }, { status: 404 });
    }

    const bookingData = bookingSnap.data()!;

    // 🚨 CRITICAL FIX: Only allow payment if status is 'approved'
    // We do NOT check if the slot is 'available' because it is already locked (requested) by this user.
    if (bookingData.status !== 'approved') {
      return NextResponse.json({ error: 'This booking is not approved for payment yet.' }, { status: 403 });
    }

    // 2. Price Calculation (13% HST)
    const BASE_PRICE = Number(price);
    const HST_RATE = 0.13;
    const TOTAL_AMOUNT = BASE_PRICE * (1 + HST_RATE);
    const UNIT_AMOUNT_CENTS = Math.round(TOTAL_AMOUNT * 100);

    // 3. Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: `RGA: ${packageName}`,
              description: `Booking ID: ${bookingId}`,
            },
            unit_amount: UNIT_AMOUNT_CENTS,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/my-bookings?success=true`,
      cancel_url: `${req.headers.get('origin')}/my-bookings?canceled=true`,
      metadata: {
        bookingId, // Pass Booking ID to Webhook
        slotId,
        userId,
        type: type || 'slot' // Pass type
      },
      customer_email: customerEmail,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });

  } catch (error: unknown) {
    console.error('Checkout Error:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) errorMessage = error.message;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}