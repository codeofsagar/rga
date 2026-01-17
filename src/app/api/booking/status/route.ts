import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebaseAdmin'; 

export async function POST(req: NextRequest) {
  try {
    const { bookingId, slotId, status } = await req.json();

    // 1. Update Booking Status
    await adminDb.collection('bookings').doc(bookingId).update({ status });

    // 2. Handle Slot Status
    if (status === 'rejected') {
        // Free up the slot
        await adminDb.collection('training_slots').doc(slotId).update({
            status: 'available',
            bookedBy: null,
            bookingId: null
        });
    } else if (status === 'approved') {
        // Keep it locked, maybe mark as approved
        await adminDb.collection('training_slots').doc(slotId).update({
            status: 'approved_pending_payment'
        });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) { // <--- FIXED: Changed 'any' to 'unknown'
    console.error("Request Error:", error);
    
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}