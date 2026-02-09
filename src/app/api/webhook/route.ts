import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/app/lib/firebaseAdmin';
import nodemailer from 'nodemailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();

  // FIX: await headers() before calling .get()
  const headerList = await headers();
  const sig = headerList.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook Error: ${errorMessage}`);
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Extract data
    const metadata = session.metadata || {};
    const { bookingId, slotId, userId, type } = metadata; // Added type
    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name;

    try {
      console.log(`💰 Payment received for Booking: ${bookingId}`);

      // 1. Mark Booking as PAID
      if (bookingId) {
        await adminDb.collection('bookings').doc(bookingId).update({
          status: 'paid',
          stripeSessionId: session.id,
          amountPaid: session.amount_total ? session.amount_total / 100 : 0,
          paidAt: new Date().toISOString()
        });
      }

      // 2. Mark Slot/Event as BOOKED
      if (slotId && userId) {
        if (type === 'event') {
          // FOR CAMPS: Increment bookedCount
          const eventRef = adminDb.collection('events').doc(slotId);
          const eventSnap = await eventRef.get();
          if (eventSnap.exists) {
            const currentCount = eventSnap.data()?.bookedCount || 0;
            const capacity = eventSnap.data()?.capacity || 20;
            const newCount = currentCount + 1;

            await eventRef.update({
              bookedCount: newCount,
              status: newCount >= capacity ? 'full' : 'active'
            });
          }
        } else {
          // FOR SLOTS: Mark as SOLD OUT
          await adminDb.collection('training_slots').doc(slotId).update({
            status: 'sold_out',
            bookedBy: userId,
            bookingId: bookingId
          });
        }
      }

      // 3. Send Confirmation Email
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS && customerEmail) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        await transporter.sendMail({
          from: '"RGA Goaltending" <no-reply@goalieschool.ca>',
          to: customerEmail,
          subject: '✅ Payment Received: Session Confirmed',
          text: `
                  Hi ${customerName || 'Goalie'},

                  Your payment was successful! Your training session is now fully secured.
                  
                  You can view your confirmed schedule in the "My Bookings" tab on our website.

                  Thank you,
                  RGA Team
                `
        });
        console.log("✅ Confirmation email sent.");
      }

    } catch (error) {
      console.error("Error updating database after payment:", error);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}