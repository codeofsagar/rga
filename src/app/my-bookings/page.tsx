'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, getDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Loader, Clock, Package, CheckCircle, History, Shield, AlertCircle, CreditCard, HelpCircle } from 'lucide-react';
import Footer from '../section/Footer';

// Define the structure of a Booking for the frontend
interface MyBooking {
  id: string;
  slotId: string;
  bookedAt: string;
  packageName: string;
  date: string;
  startTime: string;
  price: number;
  status: string; // e.g. 'pending', 'approved', 'paid'
  type?: 'slot' | 'event'; // Added type
}

export default function MyBookings() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Auth Check: Redirect to login if not signed in
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  // 2. Fetch Bookings from Firestore
  useEffect(() => {
    const fetchBookings = async () => {
      if (user) {
        try {
          // Query the 'bookings' collection for the current user
          const q = query(
            collection(db, 'bookings'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );

          const querySnapshot = await getDocs(q);

          const bookingPromises = querySnapshot.docs.map(async (bookingDoc) => {
            const bookingData = bookingDoc.data();
            const slotId = bookingData.slotId;
            const type = bookingData.type || 'slot'; // Default to slot if missing

            if (!slotId) return null;

            let finalData: Partial<MyBooking> = {
              id: bookingDoc.id,
              slotId: slotId,
              bookedAt: bookingData.createdAt,
              price: bookingData.price,
              status: bookingData.status || 'pending',
              type: type,
              packageName: bookingData.packageName
            };

            // IF EVENT, we trust the booking data (snapshot) or fetch event if needed
            // But since we stored packageName/trainingDate in booking request API for events, we can use that.
            if (type === 'event') {
              finalData.date = bookingData.trainingDate || 'Date Range';
              finalData.startTime = bookingData.trainingTime || 'All Day';
            }
            // IF SLOT, we fetch the slot to get the latest date/time (in case it changed?) 
            // OR we can rely on what we stored if we start storing it there too. 
            // Existing logic fetched slot. Let's keep fetching slot for backward compatibility.
            else {
              const slotSnap = await getDoc(doc(db, 'training_slots', slotId));
              const slotData = slotSnap.exists() ? slotSnap.data() : {};
              finalData.date = slotData.date || bookingData.trainingDate || 'Date TBD';
              finalData.startTime = slotData.startTime || bookingData.trainingTime || 'Time TBD';
              if (!finalData.packageName) finalData.packageName = slotData.packageName;
              if (!finalData.price) finalData.price = slotData.price;
            }

            return finalData as MyBooking;
          });

          // Wait for all data to load
          const results = await Promise.all(bookingPromises);
          setBookings(results.filter((b): b is MyBooking => b !== null));

        } catch (error) {
          console.error("Error fetching bookings: ", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (user) fetchBookings();
  }, [user]);

  // 3. Payment Logic: Trigger Stripe when "Pay Now" is clicked
  const handlePayNow = async (booking: MyBooking) => {
    try {
      const res = await fetch('/api/checkout_sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          slotId: booking.slotId,
          price: booking.price,
          packageName: booking.packageName,
          userId: user?.uid,
          customerEmail: user?.email,
          customerName: user?.displayName,
          type: booking.type // Pass type to checkout
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment initialization failed");

      // Redirect the user to the Stripe Checkout page
      window.location.href = data.url;

    } catch (error) {
      alert("Payment system is currently busy. Please try again.");
      console.error("Payment Error:", error);
    }
  };

  // Helper to format 24h time to 12h AM/PM
  const formatTime = (time: string) => {
    if (!time || time.includes('TBD')) return time;
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Loading State
  if (loading || isLoading) {
    return (
      <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center text-white gap-4">
        <Loader className="animate-spin text-[#D52B1E]" size={32} />
        <span className="text-xs uppercase tracking-widest font-mono">Retrieving Mission Data...</span>
      </div>
    );
  }

  if (!user) return null;

  const now = new Date();

  // Filter logic:
  // - Upcoming: Status is NOT 'rejected' AND (Status is NOT 'paid' OR Date is in future)
  // - History: Status IS 'paid' AND Date is in past
  const upcomingBookings = bookings.filter(b => b.status !== 'rejected' && (b.status !== 'paid' || new Date(b.date + 'T' + b.startTime) >= now));
  const pastBookings = bookings.filter(b => b.status === 'paid' && new Date(b.date + 'T' + b.startTime) < now);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#D52B1E] selection:text-white flex flex-col">

      <div className="flex-grow max-w-4xl mx-auto w-full px-6 md:px-12 pt-32 md:pt-40 pb-20">

        {/* HEADER */}
        <div className="mb-12 border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={12} className="text-[#D52B1E]" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">Operative Profile</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">
            My <span className="text-[#D52B1E]">Bookings</span>
          </h1>
        </div>

        <div className="space-y-16">

          {/* === ACTIVE DEPLOYMENTS LIST === */}
          <div>
            <h2 className="text-lg font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2">
              <CheckCircle size={18} className="text-green-500" /> Active Deployments
            </h2>

            {upcomingBookings.length > 0 ? (
              <div className="grid gap-4">
                {upcomingBookings.map(slot => (
                  <div key={slot.id} className="group bg-white/5 border border-white/10 p-6 relative overflow-hidden transition-all hover:bg-white/10 hover:border-white/20 rounded-lg">

                    {/* Status Color Indicator Bar */}
                    <div className={`absolute left-0 top-0 h-full w-[3px] transition-all group-hover:w-[6px]
                        ${slot.status === 'paid' ? 'bg-green-500' :
                        slot.status === 'approved' ? 'bg-[#D52B1E] animate-pulse' :
                          'bg-yellow-500'}
                    `} />

                    <div className="flex flex-wrap justify-between items-center relative z-10 pl-3">
                      <div>
                        {/* DATE & BADGE ROW */}
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-2xl font-black uppercase tracking-tight text-white">
                            {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                          </span>

                          {/* DYNAMIC BADGES BASED ON STATUS */}
                          {slot.status === 'pending' && (
                            <span className="flex items-center gap-1 text-[10px] font-bold font-mono bg-yellow-500/10 text-yellow-500 px-2 py-1 border border-yellow-500/20 uppercase rounded">
                              <Clock size={10} /> Pending Approval
                            </span>
                          )}
                          {slot.status === 'approved' && (
                            <span className="flex items-center gap-1 text-[10px] font-bold font-mono bg-[#D52B1E]/10 text-[#D52B1E] px-2 py-1 border border-[#D52B1E]/20 uppercase rounded animate-pulse">
                              <AlertCircle size={10} /> Payment Required
                            </span>
                          )}
                          {slot.status === 'paid' && (
                            <span className="flex items-center gap-1 text-[10px] font-bold font-mono bg-green-500/10 text-green-500 px-2 py-1 border border-green-500/20 uppercase rounded">
                              <CheckCircle size={10} /> Confirmed
                            </span>
                          )}

                          {/* Fallback for unknown statuses */}
                          {slot.status !== 'pending' && slot.status !== 'approved' && slot.status !== 'paid' && (
                            <span className="flex items-center gap-1 text-[10px] font-bold font-mono bg-gray-500/10 text-gray-400 px-2 py-1 border border-gray-500/20 uppercase rounded">
                              <HelpCircle size={10} /> {slot.status}
                            </span>
                          )}
                        </div>

                        {/* PACKAGE & TIME */}
                        <div className="flex items-center gap-4 text-xs text-gray-400 font-mono uppercase tracking-widest mt-2">
                          <span className="flex items-center gap-1"><Package size={12} /> {slot.packageName}</span>
                          <span className="flex items-center gap-1 text-white"><Clock size={12} className="text-[#D52B1E]" /> {formatTime(slot.startTime)}</span>
                        </div>
                      </div>

                      {/* PRICE & ACTION BUTTON */}
                      <div className="text-right mt-4 sm:mt-0 flex flex-col items-end gap-2">
                        <div className="text-xl font-bold font-mono text-gray-500 group-hover:text-white transition-colors">
                          ${slot.price}
                        </div>

                        {/* PAY BUTTON - Only shows if Approved */}
                        {slot.status === 'approved' && (
                          <button
                            onClick={() => handlePayNow(slot)}
                            className="flex items-center gap-2 bg-[#D52B1E] hover:bg-red-700 text-white px-5 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-red-900/50"
                          >
                            <CreditCard size={14} /> Pay Now
                          </button>
                        )}

                        {slot.status === 'pending' && (
                          <span className="text-[10px] text-gray-500 uppercase tracking-widest">Waiting for Admin</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 border border-white/5 border-dashed bg-white/5 text-center text-gray-500 text-xs uppercase tracking-widest rounded-lg">
                No active missions detected.
                <button
                  onClick={() => router.push('/book')}
                  className="block w-full mt-4 py-3 bg-[#D52B1E] text-white font-bold uppercase tracking-widest text-xs rounded hover:bg-red-700 transition-colors"
                >
                  Book New Mission
                </button>
              </div>
            )}
          </div>

          {/* === PAST HISTORY LIST === */}
          {pastBookings.length > 0 && (
            <div className="opacity-60 hover:opacity-100 transition-opacity duration-500">
              <h2 className="text-lg font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                <History size={18} /> Mission History
              </h2>

              <div className="grid gap-4">
                {pastBookings.map(slot => (
                  <div key={slot.id} className="bg-black/40 border border-white/5 p-5 flex flex-wrap justify-between items-center grayscale hover:grayscale-0 transition-all rounded-lg">
                    <div>
                      <div className="text-lg font-bold uppercase text-gray-400 mb-1">
                        {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">
                        {slot.packageName} • {formatTime(slot.startTime)}
                      </div>
                    </div>
                    <div className="text-xs font-bold font-mono text-gray-600 uppercase border border-gray-800 px-2 py-1 rounded">
                      Completed
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
}