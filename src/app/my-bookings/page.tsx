'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, getDoc, doc } from 'firebase/firestore'; 
import { useRouter } from 'next/navigation';
import { Loader, Clock, Package, CheckCircle, History, Shield, AlertCircle, CreditCard, XCircle } from 'lucide-react';
import Footer from '../section/Footer'; 

interface MyBooking {
  id: string; 
  slotId: string;
  bookedAt: string;
  packageName: string;
  date: string;
  startTime: string;
  price: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
}

export default function MyBookings() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Auth Check
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  // 2. Fetch Bookings (Updated for Request Flow)
  useEffect(() => {
    const fetchBookings = async () => {
      if (user) {
        try {
          // Query the root 'bookings' collection (where the Request API saves them)
          const q = query(
            collection(db, 'bookings'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );

          const querySnapshot = await getDocs(q);
          
          const bookingPromises = querySnapshot.docs.map(async (bookingDoc) => {
            const bookingData = bookingDoc.data();
            
            // In the new flow, slotId is inside the document, not a parent
            const slotId = bookingData.slotId;
            
            if (!slotId) return null;

            // Fetch Slot Data to get the Date & Time
            const slotSnap = await getDoc(doc(db, 'training_slots', slotId));
            
            // Even if slot is "locked/requested", the doc still exists, so we can read it
            if (!slotSnap.exists()) return null;

            const slotData = slotSnap.data();

            return {
              id: bookingDoc.id,
              slotId: slotId,
              bookedAt: bookingData.createdAt,
              packageName: bookingData.packageName || slotData.packageName, // Use booking data if available
              date: slotData.date,
              startTime: slotData.startTime,
              price: bookingData.price || slotData.price,
              status: bookingData.status || 'pending'
            } as MyBooking;
          });

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

  // --- PAYMENT HANDLER ---
  const handlePayNow = async (booking: MyBooking) => {
    try {
        const res = await fetch('/api/checkout_sessions', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                bookingId: booking.id, // We pass the Booking ID to update it later
                slotId: booking.slotId,
                price: booking.price,
                packageName: booking.packageName,
                userId: user?.uid,
                customerEmail: user?.email,
                customerName: user?.displayName
            })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Payment failed");
        
        // Redirect to Stripe
        window.location.href = data.url;

    } catch (error) {
        alert("Payment initialization failed. Please contact support.");
        console.error(error);
    }
  };

  // --- UTILS ---
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

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
  // Filter bookings (Pending/Approved go to Upcoming, Paid goes to History if in past)
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
          
          {/* UPCOMING / ACTIVE SECTION */}
          <div>
            <h2 className="text-lg font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2">
              <CheckCircle size={18} className="text-green-500" /> Active Deployments
            </h2>
            
            {upcomingBookings.length > 0 ? (
              <div className="grid gap-4">
                {upcomingBookings.map(slot => (
                  <div key={slot.id} className="group bg-white/5 border border-white/10 p-6 relative overflow-hidden transition-all hover:bg-white/10 hover:border-white/20 rounded-lg">
                    {/* Status Line Color */}
                    <div className={`absolute left-0 top-0 h-full w-[3px] transition-all group-hover:w-[6px]
                        ${slot.status === 'paid' ? 'bg-green-500' : 
                          slot.status === 'approved' ? 'bg-[#D52B1E] animate-pulse' : 
                          'bg-yellow-500'}
                    `} />
                    
                    <div className="flex flex-wrap justify-between items-center relative z-10 pl-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-2xl font-black uppercase tracking-tight text-white">
                              {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                            </span>
                            
                            {/* STATUS BADGE */}
                            {slot.status === 'pending' && (
                                <span className="flex items-center gap-1 text-[10px] font-bold font-mono bg-yellow-500/10 text-yellow-500 px-2 py-1 border border-yellow-500/20 uppercase rounded">
                                    <Clock size={10} /> Pending Approval
                                </span>
                            )}
                            {slot.status === 'approved' && (
                                <span className="flex items-center gap-1 text-[10px] font-bold font-mono bg-[#D52B1E]/10 text-[#D52B1E] px-2 py-1 border border-[#D52B1E]/20 uppercase rounded animate-pulse">
                                    <AlertCircle size={10} /> Action Required
                                </span>
                            )}
                            {slot.status === 'paid' && (
                                <span className="flex items-center gap-1 text-[10px] font-bold font-mono bg-green-500/10 text-green-500 px-2 py-1 border border-green-500/20 uppercase rounded">
                                    <CheckCircle size={10} /> Confirmed
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-400 font-mono uppercase tracking-widest mt-2">
                            <span className="flex items-center gap-1"><Package size={12} /> {slot.packageName}</span>
                            <span className="flex items-center gap-1 text-white"><Clock size={12} className="text-[#D52B1E]" /> {formatTime(slot.startTime)}</span>
                        </div>
                      </div>

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
              </div>
            )}
          </div>

          {/* PAST SECTION */}
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