import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebaseAdmin';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slotId, type, customerName, customerEmail, customerPhone, userId } = body; // Added type

    // Validate inputs
    if (!slotId || !customerName || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let bookingData: any = {
      slotId,
      userId,
      clientName: customerName,
      clientEmail: customerEmail,
      clientPhone: customerPhone,
      status: 'pending',
      createdAt: new Date().toISOString(),
      type: type || 'slot' // Default to slot
    };

    let notificationDetails = "";

    // --- HANDLE EVENT BOOKING ---
    if (type === 'event') {
      const eventRef = adminDb.collection('events').doc(slotId);
      const eventSnap = await eventRef.get();

      if (!eventSnap.exists) {
        return NextResponse.json({ error: 'Camp event not found.' }, { status: 404 });
      }

      const eventData = eventSnap.data()!;

      // Check Capacity
      if (eventData.bookedCount >= eventData.capacity) {
        return NextResponse.json({ error: 'This camp is fully booked.' }, { status: 409 });
      }

      bookingData.packageName = eventData.title;
      bookingData.price = eventData.price;
      bookingData.trainingDate = `${eventData.startDate} - ${eventData.endDate}`; // Store range
      bookingData.trainingTime = 'All Day';

      notificationDetails = `
              Camp: ${eventData.title}
              Dates: ${eventData.startDate} to ${eventData.endDate}
        `;

      // --- HANDLE SLOT BOOKING (DEFAULT) ---
    } else {
      // 1. Check Slot Availability
      const slotRef = adminDb.collection('training_slots').doc(slotId);
      const slotSnap = await slotRef.get();

      if (!slotSnap.exists || slotSnap.data()?.status !== 'available') {
        return NextResponse.json({ error: 'This slot is no longer available.' }, { status: 409 });
      }

      const slotData = slotSnap.data()!;
      bookingData.packageName = slotData.packageName;
      bookingData.price = slotData.price;
      // trainingDate/Time are inferred from slotId relation usually, but good to store for snapshot

      notificationDetails = `
              Package: ${slotData.packageName}
              Session: ${slotData.date} @ ${slotData.startTime}
        `;

      // 3. Lock the Slot (Status: Requested) -> Only for Slots
      await slotRef.update({
        status: 'requested',
        bookedBy: userId,
        bookingId: null, // Will update after creation logic if needed, but usually we just link booking -> slot
        updatedAt: new Date().toISOString()
      });
    }

    // 2. Create Booking Record
    const bookingRef = await adminDb.collection('bookings').add(bookingData);

    // Update Slot with Booking ID if it was a slot
    if (type !== 'event') {
      await adminDb.collection('training_slots').doc(slotId).update({
        bookingId: bookingRef.id
      });
    }


    // 4. Send Email Notification to Admin (Valerie)
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: '"RGA System" <no-reply@goalieschool.ca>',
        to: process.env.EMAIL_USER,
        subject: `📢 NEW REQUEST: ${customerName}`,
        text: `
              NEW BOOKING REQUEST
              -------------------
              Client: ${customerName}
              Phone:  ${customerPhone}
              Email:  ${customerEmail}
              
              ${notificationDetails}
              
              ACTION REQUIRED:
              Go to your Admin Command Center to Approve or Reject this request.
            `
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ Admin notification email sent.");

    } catch (emailError) {
      console.error("❌ Email failed to send:", emailError);
    }

    return NextResponse.json({ success: true, bookingId: bookingRef.id });

  } catch (error: unknown) { // <--- FIXED: Changed 'any' to 'unknown'
    console.error("Request Error:", error);

    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}