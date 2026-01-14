'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
// Make sure this type exists in your types file, or define it locally if needed
import { TrainingSlot } from '../types'; 
import { Loader, CheckCircle, AlertCircle, Lock, Clock, ArrowRight } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Footer from '../section/Footer'; // Import Footer

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function BookSession() {
  const [slots, setSlots] = useState<TrainingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TrainingSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // User Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [bookingStatus, setBookingStatus] = useState<'success' | 'error' | null>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  // --- 1. HANDLE URL PARAMS (Success/Cancel) ---
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('session_id')) {
      setBookingStatus('success');
    } else if (queryParams.get('canceled')) {
      setBookingStatus('error');
    }
  }, []);

  // --- 2. AUTH PROTECTION ---
  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/create-account');
      else if (isAdmin) router.push('/admin');
    }
  }, [user, loading, isAdmin, router]);

  // --- 3. FETCH SLOTS (Real-time) ---
  useEffect(() => {
    if (user && !isAdmin) {
      const q = query(
        collection(db, "training_slots"), 
        orderBy("date", "asc") 
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const now = new Date();
        const slotsData = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as TrainingSlot))
          .filter(slot => {
            const slotDate = new Date(`${slot.date}T${slot.startTime}`);
            return slotDate > now;
          });
        
        setSlots(slotsData);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching slots: ", error);
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user, isAdmin]);

  // --- 4. AUTO-FILL USER DATA ---
  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Scroll to form when slot selected
  useEffect(() => {
    if (selectedSlot && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [selectedSlot]);

  // --- HANDLERS ---
  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !name || !email) {
      setFormError('Please fill out all fields.');
      return;
    }
    setFormError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/checkout_sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          slotId: selectedSlot.id,
          customerName: name,
          customerEmail: email,
          userId: user?.uid
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create Stripe session.");
      }

      const { url } = await response.json();
      window.location.href = url; 

    } catch (error: unknown) { 
      console.error("Frontend booking error:", error);
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      setFormError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  if (loading || !user || isAdmin) {
    return (
      <div className="h-screen bg-[#050505] flex items-center justify-center text-white gap-3">
        <Loader className="animate-spin text-[#D52B1E]" /> 
        <span className="text-xs uppercase tracking-widest">Loading System...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white font-sans selection:bg-[#D52B1E] selection:text-white">
      
      {/* MAIN CONTENT WRAPPER */}
      {/* pt-32 (mobile) and md:pt-40 (desktop) clears the navbar */}
      <div className="flex-grow w-full max-w-6xl mx-auto px-6 md:px-12 pt-32 md:pt-40 pb-20">
        
        {/* HEADER */}
        <div className="mb-12 border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 bg-[#D52B1E] rounded-full animate-pulse shadow-[0_0_10px_#D52B1E]" />
             <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">Live Schedule</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">Secure Your <span className="text-[#D52B1E]">Position</span></h1>
        </div>

        {/* NOTIFICATIONS */}
        <div>
          {bookingStatus === 'success' && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-4 mb-8 flex items-center gap-3">
              <CheckCircle size={20} />
              <div>
                <p className="font-bold uppercase tracking-wide text-sm">Deployment Confirmed</p>
                <p className="text-xs opacity-80">Your session is booked. Check your email for orders.</p>
              </div>
            </div>
          )}
          {bookingStatus === 'error' && (
            <div className="bg-[#D52B1E]/10 border border-[#D52B1E]/50 text-[#D52B1E] p-4 mb-8 flex items-center gap-3">
              <AlertCircle size={20} />
              <div>
                <p className="font-bold uppercase tracking-wide text-sm">Booking Failed</p>
                <p className="text-xs opacity-80">The selected slot may be unavailable. Please try again.</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* --- LEFT: SLOTS LIST --- */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">1. Available Sessions</h2>
            
            {isLoading ? (
               <div className="text-center py-10 opacity-50"><Loader className="animate-spin inline-block" /></div>
            ) : slots.length === 0 ? (
               <p className="text-gray-500 italic bg-white/5 p-6 border border-white/10 text-center">No sessions available right now.</p>
            ) : (
              slots.map(slot => {
                const booked = slot.bookedCount || 0;
                const capacity = slot.capacity || 1;
                const isFull = booked >= capacity;
                const isSelected = selectedSlot?.id === slot.id;

                return (
                  <button 
                    key={slot.id} 
                    onClick={() => !isFull && setSelectedSlot(slot)} 
                    disabled={isFull}
                    className={`
                      w-full text-left p-6 relative group transition-all duration-300 border
                      ${isFull 
                          ? 'bg-white/5 border-transparent opacity-50 cursor-not-allowed grayscale' 
                          : isSelected 
                            ? 'bg-[#D52B1E] border-[#D52B1E] shadow-[0_0_30px_rgba(213,43,30,0.3)] scale-[1.02]' 
                            : 'bg-black border-white/10 hover:border-white/30 hover:bg-white/5'}
                    `}
                  >
                    <div className="flex justify-between items-center relative z-10">
                      
                      {/* Date / Time */}
                      <div>
                        <div className={`text-lg md:text-xl font-black uppercase tracking-tighter ${isSelected ? 'text-white' : 'text-white'}`}>
                          {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className={`flex items-center gap-2 mt-1 font-mono text-xs ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                          <Clock size={12} />
                          {formatTime(slot.startTime)}
                        </div>
                      </div>

                      {/* Right Side Info */}
                      <div className="text-right">
                        <div className={`text-xs md:text-sm font-bold uppercase tracking-wide mb-1 ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                          {slot.packageName}
                        </div>
                        
                        {isFull ? (
                          <span className="inline-block px-2 py-1 bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest border border-white/20">
                            Sold Out
                          </span>
                        ) : (
                          <div className="flex flex-col items-end gap-1">
                             <span className={`text-[10px] font-mono uppercase tracking-widest ${isSelected ? 'text-white' : 'text-[#D52B1E]'}`}>
                               {capacity - booked} Spots Left
                             </span>
                             <span className={`font-mono text-lg font-bold ${isSelected ? 'text-white' : 'text-white'}`}>
                               ${slot.price}
                             </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* --- RIGHT: BOOKING FORM --- */}
          <div className="relative" ref={formRef}>
            <div className={`lg:sticky lg:top-32 transition-all duration-500 ${selectedSlot ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none'}`}>
              
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">2. Confirm Details</h2>

              <div className="bg-white/5 border border-white/10 p-6 md:p-8 backdrop-blur-md relative overflow-hidden rounded-xl">
                
                {!selectedSlot ? (
                  <div className="text-center py-20 text-gray-500">
                    <ArrowRight className="mx-auto mb-4 opacity-20" size={40} />
                    <p className="text-xs uppercase tracking-widest">Select a session to proceed</p>
                  </div>
                ) : (
                  <form onSubmit={handleBook} className="space-y-6 relative z-10">
                    
                    {/* Selected Summary */}
                    <div className="bg-black/40 border-l-2 border-[#D52B1E] p-4 mb-6">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Target Session</p>
                      <div className="text-lg font-bold text-white uppercase">
                        {new Date(selectedSlot.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                      </div>
                      <div className="flex justify-between items-center mt-1">
                         <span className="font-mono text-sm text-[#D52B1E]">{formatTime(selectedSlot.startTime)}</span>
                         <span className="font-mono text-sm text-gray-400">${selectedSlot.price}</span>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Operative Name</label>
                      <input 
                        type="text" 
                        required 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="w-full bg-black/50 border border-white/20 p-4 text-white focus:border-[#D52B1E] focus:outline-none transition-colors font-mono text-sm rounded"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Contact Email</label>
                      <input 
                        type="email" 
                        required 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className="w-full bg-black/50 border border-white/20 p-4 text-white focus:border-[#D52B1E] focus:outline-none transition-colors font-mono text-sm rounded"
                      />
                    </div>

                    {formError && <p className="text-[#D52B1E] text-xs font-mono border border-[#D52B1E] p-2 bg-[#D52B1E]/10">{formError}</p>}

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-white text-black py-4 font-bold uppercase tracking-widest hover:bg-[#D52B1E] hover:text-white transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 mt-4 group rounded"
                    >
                      {isSubmitting ? (
                        <><Loader className="animate-spin" size={16} /> Processing...</>
                      ) : (
                        <><Lock size={16} className="text-gray-400 group-hover:text-white transition-colors"/> Initiate Secure Payment</>
                      )}
                    </button>
                    
                    <div className="flex justify-center items-center gap-2 mt-4 opacity-50">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest">Encrypted via Stripe</span>
                    </div>

                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}