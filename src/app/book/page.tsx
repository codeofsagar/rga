'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Loader, CheckCircle, AlertCircle, Lock, Clock, ArrowRight, ArrowLeft, Calendar, User, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Footer from '../section/Footer';

// Define Interface Locally if needed
interface TrainingSlot {
  id: string;
  date: string;
  startTime: string;
  packageName: string;
  price: number;
  capacity: number;
  bookedCount: number;
}

export default function BookSession() {
  // --- STATE ---
  const [allSlots, setAllSlots] = useState<TrainingSlot[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1=Package, 2=Date, 3=Form
  
  // Selection State
  const [selectedPackageName, setSelectedPackageName] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TrainingSlot | null>(null);
  
  // App State
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [bookingStatus, setBookingStatus] = useState<'success' | 'error' | null>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  // --- 1. SETUP & FETCH ---
  useEffect(() => {
    // Check URL for Stripe redirect status
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('session_id')) setBookingStatus('success');
    if (queryParams.get('canceled')) setBookingStatus('error');

    // Auth Protection
    if (!loading) {
      if (!user) router.push('/create-account');
      else if (isAdmin) router.push('/admin');
    }

    // Fetch Slots
    if (user && !isAdmin) {
      const q = query(collection(db, "training_slots"), orderBy("date", "asc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const now = new Date();
        const slotsData = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as TrainingSlot))
          .filter(slot => {
            // Filter out past dates AND full slots
            const slotDate = new Date(`${slot.date}T${slot.startTime}`);
            const isFull = slot.bookedCount >= slot.capacity;
            return slotDate > now && !isFull;
          });
        
        setAllSlots(slotsData);
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user, loading, isAdmin, router]);

  // Auto-fill user data
  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // --- HELPERS ---
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00'); // Prevent timezone shift
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // --- UNIQUE PACKAGES ---
  // Get unique package names from available slots
  const uniquePackages = Array.from(new Set(allSlots.map(s => s.packageName)));

  // --- HANDLERS ---
  const handleSelectPackage = (pkgName: string) => {
    setSelectedPackageName(pkgName);
    setStep(2);
  };

  const handleSelectSlot = (slot: TrainingSlot) => {
    setSelectedSlot(slot);
    setStep(3);
    // Scroll to form
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleBack = () => {
    if (step === 3) setStep(2);
    if (step === 2) setStep(1);
  };

  // Inside src/app/book/page.tsx

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !name || !email) return;
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
          userId: user?.uid,
          price: selectedSlot.price 
        }),
      });

      // --- NEW: Read the error details ---
      const data = await response.json(); 

      if (!response.ok) {
        throw new Error(data.error || "Payment initialization failed");
      }

      window.location.href = data.url; 

    } catch (err: unknown) {
      console.error("Booking Error:", err);
      let errorMessage = "An error occurred";
      if (err instanceof Error) errorMessage = err.message;
      setFormError(errorMessage); // Now this will show the REAL error on screen
      setIsSubmitting(false);
    }
  };

  // --- LOADING STATE ---
  if (loading || !user || isAdmin) return <div className="h-screen bg-[#050505] flex items-center justify-center text-white"><Loader className="animate-spin text-[#D52B1E]" /></div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white font-sans selection:bg-[#D52B1E] selection:text-white">
      
      <div className="flex-grow w-full max-w-5xl mx-auto px-6 pt-32 md:pt-40 pb-20">
        
        {/* HEADER */}
        <div className="mb-12 border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 bg-[#D52B1E] rounded-full animate-pulse shadow-[0_0_10px_#D52B1E]" />
             <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">Live Schedule</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">
            Secure Your <span className="text-[#D52B1E]">Session</span>
          </h1>
        </div>

        {/* STATUS MESSAGES */}
        {bookingStatus === 'success' && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-6 mb-8 flex items-center gap-4 rounded-lg">
                <CheckCircle size={24} />
                <div><p className="font-bold uppercase">Deployment Confirmed</p><p className="text-sm opacity-80">Check your email for details.</p></div>
            </div>
        )}

        {/* ======================================================== */}
        {/* STEP 1: SELECT PACKAGE TYPE */}
        {/* ======================================================== */}
        {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">Step 1: Select Protocol</h2>
                
                {isLoading ? <Loader className="animate-spin text-[#D52B1E]" /> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {uniquePackages.length === 0 ? (
                            <div className="col-span-2 text-gray-500 italic py-8">No sessions currently available.</div>
                        ) : (
                            uniquePackages.map((pkgName) => (
                                <button 
                                    key={pkgName}
                                    onClick={() => handleSelectPackage(pkgName)}
                                    className="group relative p-8 bg-[#111] border border-white/10 hover:border-[#D52B1E] text-left transition-all duration-300 rounded-xl hover:bg-white/5"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-full ${pkgName.toLowerCase().includes('private') ? 'bg-[#D52B1E]/10 text-[#D52B1E]' : 'bg-[#0039A6]/10 text-[#0039A6]'}`}>
                                            {pkgName.toLowerCase().includes('private') ? <User size={24} /> : <Users size={24} />}
                                        </div>
                                        <ArrowRight className="text-gray-600 group-hover:text-white transition-colors" />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase text-white">{pkgName}</h3>
                                    <p className="text-sm text-gray-400 mt-2">View available dates & times</p>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: SELECT DATE (Filtered by Package) */}
        {/* ======================================================== */}
        {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <button onClick={handleBack} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white mb-6 transition-colors">
                    <ArrowLeft size={14} /> Back to Packages
                </button>

                <h2 className="text-xs font-bold uppercase tracking-widest text-[#D52B1E] mb-6">
                    Step 2: Select Date for <span className="text-white">{selectedPackageName}</span>
                </h2>

                <div className="grid grid-cols-1 gap-3">
                    {allSlots.filter(s => s.packageName === selectedPackageName).map((slot) => (
                        <button
                            key={slot.id}
                            onClick={() => handleSelectSlot(slot)}
                            className="w-full flex items-center justify-between p-5 bg-[#111] border border-white/10 hover:border-white hover:bg-white/5 transition-all rounded-lg group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-white/5 p-3 rounded text-gray-400 group-hover:text-white transition-colors">
                                    <Calendar size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="text-lg font-bold uppercase text-white">{formatDate(slot.date)}</div>
                                    <div className="text-sm text-[#D52B1E] font-mono flex items-center gap-2">
                                        <Clock size={12} /> {formatTime(slot.startTime)}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-mono font-bold text-white">${slot.price}<span className="text-[10px] text-gray-500 font-sans ml-1">+ HST</span></div>
                                <div className="text-[10px] uppercase tracking-widest text-green-500">Available</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: FINAL CONFIRMATION FORM */}
        {/* ======================================================== */}
        {step === 3 && selectedSlot && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-500" ref={formRef}>
                <button onClick={handleBack} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white mb-6 transition-colors">
                    <ArrowLeft size={14} /> Back to Dates
                </button>

                <div className="bg-[#111] border border-white/10 p-8 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D52B1E] to-[#0039A6]"></div>
                    
                    <h2 className="text-xl font-black uppercase text-white mb-8">Confirm Mission Details</h2>

                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                        <div className="space-y-4">
                            <div className="p-4 bg-black border border-white/10 rounded-lg">
                                <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Package</span>
                                <span className="text-lg font-bold text-white uppercase">{selectedSlot.packageName}</span>
                            </div>
                            <div className="p-4 bg-black border border-white/10 rounded-lg">
                                <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Date & Time</span>
                                <span className="text-lg font-bold text-white uppercase">{formatDate(selectedSlot.date)} @ {formatTime(selectedSlot.startTime)}</span>
                            </div>
                        </div>
                        <div className="flex flex-col justify-center items-center bg-[#D52B1E]/5 border border-[#D52B1E]/20 rounded-lg p-6">
                            <span className="text-[10px] text-[#D52B1E] uppercase tracking-widest mb-1">Total Due (Pre-Tax)</span>
                            <span className="text-5xl font-black text-white tracking-tighter">${selectedSlot.price}</span>
                            <span className="text-xs text-gray-500 mt-2 font-mono uppercase">+ Applicable Taxes</span>
                        </div>
                    </div>

                    <form onSubmit={handleBook} className="space-y-4 max-w-lg mx-auto">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500">Operative Name</label>
                            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-black border border-white/20 p-4 text-white text-sm rounded focus:border-[#D52B1E] outline-none transition-colors" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500">Contact Email</label>
                            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black border border-white/20 p-4 text-white text-sm rounded focus:border-[#D52B1E] outline-none transition-colors" />
                        </div>

                        {formError && <div className="text-red-500 text-xs bg-red-500/10 p-3 rounded border border-red-500/20">{formError}</div>}

                        <button disabled={isSubmitting} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest hover:bg-[#D52B1E] hover:text-white transition-all rounded shadow-lg flex items-center justify-center gap-2 mt-4">
                            {isSubmitting ? <Loader className="animate-spin" size={16} /> : <><Lock size={16} /> Proceed to Secure Payment</>}
                        </button>
                    </form>
                </div>
            </div>
        )}

      </div>
      <Footer />
    </div>
  );
}