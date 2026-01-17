import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebaseAdmin'; 
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slotId, customerName, customerEmail, customerPhone, userId } = body;

    // Validate inputs
    if (!slotId || !customerName || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Check Slot Availability
    const slotRef = adminDb.collection('training_slots').doc(slotId);
    const slotSnap = await slotRef.get();

    if (!slotSnap.exists || slotSnap.data()?.status !== 'available') {
      return NextResponse.json({ error: 'This slot is no longer available.' }, { status: 409 });
    }

    const slotData = slotSnap.data()!;

    // 2. Create Booking Record (Status: Pending)
    const bookingRef = await adminDb.collection('bookings').add({
      slotId,
      userId,
      clientName: customerName,
      clientEmail: customerEmail,
      clientPhone: customerPhone,
      packageName: slotData.packageName,
      price: slotData.price,
      status: 'pending', 
      createdAt: new Date().toISOString()
    });

    // 3. Lock the Slot (Status: Requested)
    await slotRef.update({
      status: 'requested', 
      bookedBy: userId,
      bookingId: bookingRef.id,
      updatedAt: new Date().toISOString()
    });

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
            to: process.env.EMAIL_USER, // Sends to herself
            subject: `📢 NEW REQUEST: ${customerName}`,
            text: `
              NEW BOOKING REQUEST
              -------------------
              Client: ${customerName}
              Phone:  ${customerPhone}
              Email:  ${customerEmail}
              
              Package: ${slotData.packageName}
              Session: ${slotData.date} @ ${slotData.startTime}
              
              ACTION REQUIRED:
              Go to your Admin Command Center to Approve or Reject this request.
            `
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ Admin notification email sent.");

    } catch (emailError) {
        console.error("❌ Email failed to send:", emailError);
        // We continue even if email fails, so the booking is not lost
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