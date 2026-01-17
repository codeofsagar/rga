import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/app/lib/firebaseAdmin'; 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover', // Use a stable version
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

    // 1. Get slot from Admin DB
    const slotRef = adminDb.collection('training_slots').doc(slotId);
    const slotSnap = await slotRef.get();

    // 2. Check availability
    if (!slotSnap.exists || slotSnap.data()?.status !== 'available') {
      return NextResponse.json({ error: 'This slot is no longer available.' }, { status: 409 });
    }

    const slot = slotSnap.data()!;

    // 3. Validation
    if (!slot.price || !slot.date || !slot.startTime) {
      throw new Error('Corrupt slot data in database.');
    }

    const trainingDate = new Date(slot.date);

    // 4. Mark as Pending
    await slotRef.update({
      status: 'pending',
      customerName,
      customerEmail,
      userId,
    });

    // --- 5. CALCULATE PRICE + HST (Client Requirement) ---
    const BASE_PRICE = slot.price; // e.g. 150
    const HST_RATE = 0.13;         // 13% Tax
    const TAX_AMOUNT = BASE_PRICE * HST_RATE; 
    const TOTAL_AMOUNT = BASE_PRICE + TAX_AMOUNT; // e.g. 169.50

    // Stripe requires amount in CENTS (Integers only)
    const UNIT_AMOUNT_CENTS = Math.round(TOTAL_AMOUNT * 100); 

    // 6. Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cad', // <--- CHANGED TO CAD
            product_data: {
              name: `RGA Training: ${slot.packageName}`,
              description: `${trainingDate.toLocaleDateString()} @ ${slot.startTime} (Includes HST)`,
            },
            unit_amount: UNIT_AMOUNT_CENTS, // <--- USES TOTAL WITH TAX
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

    // Revert logic
    if (slotId) {
      try {
        const slotRef = adminDb.collection('training_slots').doc(slotId);
        const slotSnap = await slotRef.get();
        if (slotSnap.exists && slotSnap.data()?.status === 'pending') {
          await slotRef.update({
            status: 'available',
            customerName: null,
            customerEmail: null,
            userId: null,
          });
        }
      } catch (revertError) {
        console.error('Failed to revert slot:', revertError);
      }
    }

    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) errorMessage = error.message;

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}