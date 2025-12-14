// // app/book/page.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { db } from '../lib/firebase';
// import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
// import { format } from 'date-fns';
// import { TrainingSlot } from '../types';

// export default function BookSession() {
//   const [slots, setSlots] = useState<TrainingSlot[]>([]);
//   const [selectedSlot, setSelectedSlot] = useState<TrainingSlot | null>(null);
//   const [loading, setLoading] = useState(true);
  
//   // Form State
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');

//   useEffect(() => {
//     // Only fetch slots that are 'available'
//     const q = query(collection(db, "training_slots"), where("status", "==", "available"));
//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const slotsData = snapshot.docs.map(doc => ({ 
//         id: doc.id, 
//         ...doc.data() 
//       } as TrainingSlot));
      
//       // Sort by date then time
//       slotsData.sort((a, b) => {
//         const dateA = new Date(`${a.date}T${a.startTime}`);
//         const dateB = new Date(`${b.date}T${b.startTime}`);
//         return dateA.getTime() - dateB.getTime();
//       });
      
//       setSlots(slotsData);
//       setLoading(false);
//     });
//     return () => unsubscribe();
//   }, []);

//   const handleBook = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedSlot) return;

//     try {
//       const slotRef = doc(db, "training_slots", selectedSlot.id);
      
//       // Atomic update to lock the slot
//       await updateDoc(slotRef, {
//         status: 'booked',
//         customerName: name,
//         customerEmail: email,
//         bookedAt: new Date().toISOString()
//       });

//       alert(`Success! You have booked the session on ${selectedSlot.date}`);
//       setSelectedSlot(null);
//       setName('');
//       setEmail('');
//     } catch (error) {
//       console.error("Booking error:", error);
//       alert("Error booking slot. It might have just been taken.");
//     }
//   };

//   return (
//     <div className="max-w-5xl mx-auto py-12 px-6">
//       <h1 className="text-3xl font-bold mb-8 text-slate-900">Book a Session</h1>

//       {loading ? (
//         <div className="text-center py-20">Loading schedule...</div>
//       ) : (
//         <div className="grid md:grid-cols-2 gap-12">
//           {/* List of Slots */}
//           <div className="space-y-4">
//             <h2 className="text-xl font-semibold text-slate-700 mb-4">Available Times</h2>
//             {slots.length === 0 ? (
//               <p className="text-slate-500 italic">No available slots at the moment. Check back soon!</p>
//             ) : (
//               slots.map(slot => (
//                 <button
//                   key={slot.id}
//                   onClick={() => setSelectedSlot(slot)}
//                   className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
//                     selectedSlot?.id === slot.id 
//                       ? 'border-red-600 bg-red-50 ring-2 ring-red-200' 
//                       : 'border-slate-200 bg-white hover:border-red-300 hover:shadow-md'
//                   }`}
//                 >
//                   <div className="flex justify-between items-center">
//                     <span className="font-bold text-slate-800">
//                       {format(new Date(slot.date), 'EEEE, MMMM do, yyyy')}
//                     </span>
//                     <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
//                       ${slot.price}
//                     </span>
//                   </div>
//                   <div className="text-slate-500 mt-1">
//                     Time: {slot.startTime}
//                   </div>
//                 </button>
//               ))
//             )}
//           </div>

//           {/* Payment / Booking Form */}
//           <div className="relative">
//             <div className={`sticky top-24 bg-white p-8 rounded-2xl shadow-xl border border-slate-100 transition-opacity ${selectedSlot ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
//               <h3 className="text-xl font-bold mb-6 text-slate-900">Finalize Booking</h3>
              
//               {selectedSlot ? (
//                 <form onSubmit={handleBook} className="space-y-5">
//                   <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 mb-4">
//                     Booking for: <br/>
//                     <strong className="text-slate-900 text-lg">
//                       {format(new Date(selectedSlot.date), 'MMMM do')} at {selectedSlot.startTime}
//                     </strong>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
//                     <input 
//                       type="text" 
//                       required
//                       value={name}
//                       onChange={e => setName(e.target.value)}
//                       className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
//                     <input 
//                       type="email" 
//                       required
//                       value={email}
//                       onChange={e => setEmail(e.target.value)}
//                       className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
//                     />
//                   </div>

//                   <button 
//                     type="submit" 
//                     className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg shadow-lg hover:shadow-xl transition-all transform active:scale-95"
//                   >
//                     Pay ${selectedSlot.price} & Book Now
//                   </button>
//                   <p className="text-xs text-center text-slate-400 mt-2">Secure SSL Payment (Mock)</p>
//                 </form>
//               ) : (
//                 <div className="text-center py-10 text-slate-400">
//                   Select a date on the left to unlock the booking form.
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
export default function Book() {
  return <div>Admin page coming soon</div>;
}
