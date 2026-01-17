import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/app/lib/firebaseAdmin'; 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover', 
});

export async function POST(req: NextRequest) {
  let slotId: string | null = null;

  try {
    const body = await req.json();
    slotId = body.slotId;
    const { customerName, customerEmail, userId } = body;

    if (!slotId || !customerName || !customerEmail || !userId) {
      return NextResponse.json({ error: 'Missing required session information' }, { status: 400 });
    }

    const slotRef = adminDb.collection('training_slots').doc(slotId);
    const slotSnap = await slotRef.get();

    if (!slotSnap.exists) {
        return NextResponse.json({ error: 'Slot not found.' }, { status: 404 });
    }

    const slot = slotSnap.data()!;

    // --- NEW LOGIC: Allow Retry ---
    const isAvailable = slot.status === 'available';
    // If it's pending BUT the current user ID matches the one who locked it, allow retry.
    const isMyPendingBooking = slot.status === 'pending' && slot.userId === userId;

    if (!isAvailable && !isMyPendingBooking) {
      return NextResponse.json({ error: 'This slot is no longer available.' }, { status: 409 });
    }
    // -----------------------------

    // Price Calculation
    const BASE_PRICE = Number(slot.price); 
    if (isNaN(BASE_PRICE)) throw new Error(`Invalid price in database: ${slot.price}`);

    const HST_RATE = 0.13;
    const TOTAL_AMOUNT = BASE_PRICE * (1 + HST_RATE); 
    const UNIT_AMOUNT_CENTS = Math.round(TOTAL_AMOUNT * 100); 

    const trainingDate = new Date(slot.date);

    // Update/Lock Slot
    await slotRef.update({
      status: 'pending',
      customerName,
      customerEmail,
      userId,
      updatedAt: new Date().toISOString() 
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: `RGA Training: ${slot.packageName}`,
              description: `${trainingDate.toLocaleDateString()} @ ${slot.startTime} (Includes HST)`,
            },
            unit_amount: UNIT_AMOUNT_CENTS,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/book?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/book?canceled=true`,
      metadata: {
        slotId: slotId,
        userId: userId,
      },
      customer_email: customerEmail,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });

  } catch (error: unknown) {
    console.error('Booking Process Error:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) errorMessage = error.message;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}