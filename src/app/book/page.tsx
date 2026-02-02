'use client';

import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Loader, User, Users, Clock, ArrowRight, ArrowLeft, Calendar, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Footer from '../section/Footer';

interface TrainingSlot {
  id: string;
  date: string;
  startTime: string;
  packageName: string;
  price: number;
  status: string;
}

export default function BookSession() {
  const [allSlots, setAllSlots] = useState<TrainingSlot[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPackageName, setSelectedPackageName] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TrainingSlot | null>(null);

  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMode, setSuccessMode] = useState(false);

  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();



  // 1. Fetch Slots (Admin & User)
  useEffect(() => {
    if (!loading && !user) router.push('/login');

    if (user) {
      const q = query(collection(db, "training_slots"), orderBy("date", "asc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const now = new Date();
        const slotsData = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as TrainingSlot))
          .filter(slot => {
            const slotDate = new Date(`${slot.date}T${slot.startTime}`);
            return slotDate > now && slot.status === 'available';
          });

        setAllSlots(slotsData);
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSelectPackage = (pkgName: string) => {
    setSelectedPackageName(pkgName);
    setStep(2);
  };

  const handleSelectSlot = (slot: TrainingSlot) => {
    setSelectedSlot(slot);
    setStep(3);
  };

  const handleRequestBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !name || !email || !phone) return;

    setFormError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/booking/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          userId: user?.uid,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");

      setSuccessMode(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err: unknown) {
      let msg = "An error occurred";
      if (err instanceof Error) msg = err.message;
      setFormError(msg);
      setIsSubmitting(false);
    }
  };

  const uniquePackages = Array.from(new Set(allSlots.map(s => s.packageName)));
  const formatDate = (dateStr: string) => new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  if (loading || !user) return <div className="h-screen bg-[#050505] flex items-center justify-center text-white"><Loader className="animate-spin text-[#D52B1E]" /></div>;

  if (successMode) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-500"><CheckCircle size={40} /></div>
        <h1 className="text-3xl font-black uppercase mb-4">Request Sent</h1>
        <p className="text-gray-400 max-w-md mb-8">
          Your request for <strong>{selectedSlot?.packageName}</strong> is now Pending. <br />
          We will contact you to confirm the arena/location. Once approved, you can pay in your My Bookings tab.
        </p>
        <button onClick={() => router.push('/my-bookings')} className="bg-white text-black px-8 py-3 rounded font-bold uppercase tracking-widest hover:bg-[#D52B1E] hover:text-white transition-all">Go to My Bookings</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white font-sans selection:bg-[#D52B1E] selection:text-white">
      <div className="flex-grow w-full max-w-5xl mx-auto px-6 pt-32 md:pt-40 pb-20">

        <div className="mb-12 border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#D52B1E] rounded-full animate-pulse shadow-[0_0_10px_#D52B1E]" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">Live Schedule</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">Request <span className="text-[#D52B1E]">Session</span></h1>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">Step 1: Select Protocol</h2>
            {isLoading ? <Loader className="animate-spin text-[#D52B1E]" /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uniquePackages.length === 0 ? (
                  <div className="col-span-2 text-gray-500 italic py-8 border border-white/10 p-8 rounded text-center">No upcoming slots found.</div>
                ) : (
                  uniquePackages.map((pkgName) => (
                    <button key={pkgName} onClick={() => handleSelectPackage(pkgName)} className="group p-8 bg-[#111] border border-white/10 hover:border-[#D52B1E] text-left transition-all rounded-xl">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-full ${pkgName.toLowerCase().includes('private') ? 'bg-[#D52B1E]/10 text-[#D52B1E]' : 'bg-[#0039A6]/10 text-[#0039A6]'}`}>
                          {pkgName.toLowerCase().includes('private') ? <User size={24} /> : <Users size={24} />}
                        </div>
                        <ArrowRight className="text-gray-600 group-hover:text-white transition-colors" />
                      </div>
                      <h3 className="text-2xl font-black uppercase text-white">{pkgName}</h3>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white mb-6"><ArrowLeft size={14} /> Back</button>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#D52B1E] mb-6">Step 2: Select Date</h2>
            <div className="grid grid-cols-1 gap-3">
              {allSlots.filter(s => s.packageName === selectedPackageName).map((slot) => (
                <button key={slot.id} onClick={() => handleSelectSlot(slot)} className="w-full flex items-center justify-between p-5 bg-[#111] border border-white/10 hover:border-white transition-all rounded-lg group">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/5 p-3 rounded text-gray-400 group-hover:text-white"><Calendar size={20} /></div>
                    <div className="text-left">
                      <div className="text-lg font-bold uppercase text-white">{formatDate(slot.date)}</div>
                      <div className="text-sm text-[#D52B1E] font-mono flex items-center gap-2"><Clock size={12} /> {formatTime(slot.startTime)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-mono font-bold text-white">${slot.price}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && selectedSlot && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <button onClick={() => setStep(2)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white mb-6"><ArrowLeft size={14} /> Back</button>
            <div className="bg-[#111] border border-white/10 p-8 rounded-2xl">
              <h2 className="text-xl font-black uppercase text-white mb-8">Request Booking</h2>
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 mb-6 rounded text-sm text-yellow-500">
                <strong>Note:</strong> No payment required yet. We will confirm the arena and then you can pay in your account.
              </div>
              <form onSubmit={handleRequestBooking} className="space-y-4 max-w-lg mx-auto">
                <div><label className="text-[10px] uppercase font-bold text-gray-500">Name</label><input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-black border border-white/20 p-4 text-white text-sm rounded focus:border-[#D52B1E] outline-none" /></div>
                <div><label className="text-[10px] uppercase font-bold text-gray-500">Email</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black border border-white/20 p-4 text-white text-sm rounded focus:border-[#D52B1E] outline-none" /></div>
                <div><label className="text-[10px] uppercase font-bold text-gray-500">Phone</label><input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-black border border-white/20 p-4 text-white text-sm rounded focus:border-[#D52B1E] outline-none" /></div>
                {formError && <div className="text-red-500 text-xs bg-red-500/10 p-3 rounded">{formError}</div>}
                <button disabled={isSubmitting} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest hover:bg-[#D52B1E] hover:text-white transition-all rounded mt-4">{isSubmitting ? <Loader className="animate-spin inline mr-2" size={16} /> : 'Submit Request'}</button>
              </form>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}