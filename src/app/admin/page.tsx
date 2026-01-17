'use client';

import { useState, useEffect } from 'react';
import { auth, db, storage } from '../lib/firebase';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, query, onSnapshot, deleteDoc, doc, orderBy, updateDoc } from 'firebase/firestore'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Trash2, Plus, Loader, Calendar, Megaphone, 
  Settings, DollarSign, ShoppingBag, CheckCircle, 
  User, Users as UsersIcon, Infinity, LogOut, ArrowLeft, Image as ImageIcon, AlignLeft, UploadCloud, Pencil, X, Phone, Mail, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import Footer from '../section/Footer'; 

// --- TYPES ---
interface TrainingSlot {
  id: string;
  date: string;
  startTime: string;
  packageName: string;
  price: number;
  capacity: number;
  bookedCount: number;
  status: 'available' | 'sold_out' | 'pending' | 'requested' | 'approved';
}

interface PackageTier {
  id: string;
  name: string;
  price: number;
  price5: number;
  price10: number;
  peopleCount: number;
  maxQuantity: number;
  order: number;
}

interface EventCamp {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  price: number;
  capacity: number;
  bookedCount: number;
  status: 'active' | 'full' | 'ended';
}

interface GalleryItem {
  id: string;
  imageUrl: string;
  description: string;
  createdAt: string;
}

// NEW INTERFACE FOR BOOKINGS
interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  packageName: string;
  slotId: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  createdAt: string;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'requests' | 'schedule' | 'packages' | 'events' | 'gallery'>('requests');

  // Data State
  const [slots, setSlots] = useState<TrainingSlot[]>([]);
  const [packages, setPackages] = useState<PackageTier[]>([]);
  const [events, setEvents] = useState<EventCamp[]>([]); 
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]); // NEW STATE
  const [slotsLoading, setSlotsLoading] = useState(true);

  // --- FORMS ---
  const [slotForm, setSlotForm] = useState({ date: '', startTime: '', packageName: '', price: 0, capacity: 10 });
  const [pkgForm, setPkgForm] = useState({ name: '', price: 0, price5: 0, price10: 0, peopleCount: 1, maxQuantity: 0 });
  const [isLimited, setIsLimited] = useState(false);
  const [isGroup, setIsGroup] = useState(false);
  
  // EVENT EDITING STATE
  const [eventForm, setEventForm] = useState({ title: '', description: '', startDate: '', endDate: '', price: 0, capacity: 20 });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // GALLERY EDITING STATE
  const [galleryDescription, setGalleryDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // --- FETCHERS ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      if (user && user.email === adminEmail) {
        setAuthorized(true);
        
        // 1. Slots
        onSnapshot(query(collection(db, "training_slots"), orderBy("date")), (snap) => {
            setSlots(snap.docs.map(d => ({ id: d.id, ...d.data() } as TrainingSlot)));
            setSlotsLoading(false);
        });
        // 2. Packages
        onSnapshot(query(collection(db, "packages"), orderBy("order")), (snap) => {
            setPackages(snap.docs.map(d => ({ id: d.id, ...d.data() } as PackageTier)));
        });
        // 3. Events
        onSnapshot(query(collection(db, "events"), orderBy("startDate")), (snap) => {
            setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as EventCamp)));
        });
        // 4. Gallery
        onSnapshot(query(collection(db, "gallery"), orderBy("createdAt", "desc")), (snap) => {
            setGalleryItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryItem)));
        });
        // 5. NEW: Bookings (Requests)
        onSnapshot(query(collection(db, "bookings"), orderBy("createdAt", "desc")), (snap) => {
            setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
        });

      } else {
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // --- SLOT HANDLER ---
  const handleSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "training_slots"), {
        ...slotForm,
        price: Number(slotForm.price),
        capacity: Number(slotForm.capacity),
        bookedCount: 0,
        status: 'available',
        createdAt: new Date().toISOString()
      });
      setSuccessMsg('Session Deployed');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { console.error(err); alert("Error creating slot"); }
    setIsSubmitting(false);
  };

  // --- PACKAGE HANDLER ---
  const handlePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "packages"), {
        name: pkgForm.name,
        price: Number(pkgForm.price),
        price5: Number(pkgForm.price5),
        price10: Number(pkgForm.price10),
        peopleCount: isGroup ? Number(pkgForm.peopleCount) : 1,
        maxQuantity: isLimited ? Number(pkgForm.maxQuantity) : 0,
        order: packages.length + 1
      });
      setPkgForm({ name: '', price: 0, price5: 0, price10: 0, peopleCount: 1, maxQuantity: 0 }); 
      setIsGroup(false); setIsLimited(false);
      setSuccessMsg('Package Created');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { console.error(err); alert("Error creating package"); }
    setIsSubmitting(false);
  };

  // --- CAMP HANDLERS ---
  const handleEditEvent = (event: EventCamp) => {
    setEditingEventId(event.id);
    setEventForm({ title: event.title, description: event.description, startDate: event.startDate, endDate: event.endDate, price: event.price, capacity: event.capacity });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEventEdit = () => {
    setEditingEventId(null);
    setEventForm({ title: '', description: '', startDate: '', endDate: '', price: 0, capacity: 20 });
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const eventData = { ...eventForm, price: Number(eventForm.price), capacity: Number(eventForm.capacity), status: editingEventId ? events.find(e => e.id === editingEventId)?.status : 'active' };
      if (editingEventId) { await updateDoc(doc(db, "events", editingEventId), eventData); setSuccessMsg('Camp Updated'); } 
      else { await addDoc(collection(db, "events"), { ...eventData, bookedCount: 0, createdAt: new Date().toISOString() }); setSuccessMsg('Camp Announced'); }
      cancelEventEdit(); setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { console.error(err); alert("Error saving event"); }
    setIsSubmitting(false);
  };

  // --- GALLERY HANDLERS ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) { const file = e.target.files[0]; setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
  };

  const handleEditGallery = (item: GalleryItem) => {
      setEditingGalleryId(item.id); setGalleryDescription(item.description); setPreviewUrl(item.imageUrl); setSelectedFile(null); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelGalleryEdit = () => { setEditingGalleryId(null); setGalleryDescription(''); setPreviewUrl(null); setSelectedFile(null); };

  const handleGallerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGalleryId && !selectedFile) { alert("Please select an image."); return; }
    setIsSubmitting(true);
    try {
      let url = previewUrl; 
      if (selectedFile) { const storageRef = ref(storage, `gallery/${Date.now()}_${selectedFile.name}`); await uploadBytes(storageRef, selectedFile); url = await getDownloadURL(storageRef); }
      if (editingGalleryId) { await updateDoc(doc(db, "gallery", editingGalleryId), { imageUrl: url, description: galleryDescription }); setSuccessMsg('Photo Updated'); } 
      else { await addDoc(collection(db, "gallery"), { imageUrl: url, description: galleryDescription, createdAt: new Date().toISOString() }); setSuccessMsg('Photo Uploaded'); }
      cancelGalleryEdit(); setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { console.error(err); alert("Error saving photo."); }
    setIsSubmitting(false);
  };

  // --- NEW: REQUEST APPROVAL HANDLER ---
  const handleUpdateStatus = async (bookingId: string, slotId: string, newStatus: string) => {
    if (!confirm(`Mark this request as ${newStatus}?`)) return;
    try {
        // We use the API route to ensure both Booking and Slot status are updated safely
        const res = await fetch('/api/booking/status', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ bookingId, slotId, status: newStatus })
        });
        
        if (res.ok) {
            setSuccessMsg(`Request marked as ${newStatus}`);
            setTimeout(() => setSuccessMsg(''), 3000);
        } else {
            alert("Error communicating with server.");
        }
    } catch (e) { alert("Error updating status"); }
  };

  const handleDelete = async (collectionName: string, id: string) => { if (confirm("Permanently delete?")) { await deleteDoc(doc(db, collectionName, id)); } };
  const handleLogout = async () => { await signOut(auth); router.push('/login'); };

  // HELPER: Match booking to slot date
  const getSlotDetails = (slotId: string) => {
      const slot = slots.find(s => s.id === slotId);
      return slot ? `${slot.date} @ ${slot.startTime}` : 'Unknown Date';
  };

  if (loading) return <div className="h-screen bg-black text-white flex items-center justify-center"><Loader className="animate-spin" /></div>;
  if (!authorized) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white font-sans selection:bg-[#D52B1E] selection:text-white">
      
      <div className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-12 pt-32 md:pt-40 pb-20">
        
        {/* HEADER & NAV */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 border-b border-white/10 pb-6 gap-6 w-full">
          <div className="w-full lg:w-auto">
            <div className="flex items-center justify-between lg:justify-start gap-4 mb-6">
               <div className="flex items-center gap-4">
                   <Link href="/" className="p-2 bg-white/10 rounded-full hover:bg-[#D52B1E] transition-colors" title="Back to Website">
                      <ArrowLeft size={18} />
                   </Link>
                   <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase">Command <span className="text-[#D52B1E]">Center</span></h1>
               </div>
               <button onClick={handleLogout} className="lg:hidden text-gray-500 hover:text-white p-2"><LogOut size={20} /></button>
            </div>
            
            <div className="w-full overflow-x-auto pb-2 -mb-2">
                <div className="flex gap-2 md:gap-4 min-w-max">
                    <button onClick={() => setActiveTab('requests')} className={`flex items-center gap-2 px-4 py-3 md:py-2 text-xs font-bold uppercase tracking-widest transition-all rounded ${activeTab === 'requests' ? 'bg-[#D52B1E] text-white' : 'text-gray-500 hover:text-white bg-white/5'}`}>
                        <ShieldAlert size={14} /> Requests {bookings.filter(b => b.status === 'pending').length > 0 && <span className="bg-white text-black px-1.5 rounded-full text-[9px]">{bookings.filter(b => b.status === 'pending').length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('schedule')} className={`flex items-center gap-2 px-4 py-3 md:py-2 text-xs font-bold uppercase tracking-widest transition-all rounded ${activeTab === 'schedule' ? 'bg-white text-black' : 'text-gray-500 hover:text-white bg-white/5'}`}><Calendar size={14} /> Schedule</button>
                    <button onClick={() => setActiveTab('packages')} className={`flex items-center gap-2 px-4 py-3 md:py-2 text-xs font-bold uppercase tracking-widest transition-all rounded ${activeTab === 'packages' ? 'bg-white text-black' : 'text-gray-500 hover:text-white bg-white/5'}`}><Settings size={14} /> Packages</button>
                    <button onClick={() => setActiveTab('events')} className={`flex items-center gap-2 px-4 py-3 md:py-2 text-xs font-bold uppercase tracking-widest transition-all rounded ${activeTab === 'events' ? 'bg-white text-black' : 'text-gray-500 hover:text-white bg-white/5'}`}><Megaphone size={14} /> Camps</button>
                    <button onClick={() => setActiveTab('gallery')} className={`flex items-center gap-2 px-4 py-3 md:py-2 text-xs font-bold uppercase tracking-widest transition-all rounded ${activeTab === 'gallery' ? 'bg-white text-black' : 'text-gray-500 hover:text-white bg-white/5'}`}><ImageIcon size={14} /> Gallery</button>
                </div>
            </div>
          </div>
          <button onClick={handleLogout} className="hidden lg:flex text-gray-500 hover:text-white text-xs uppercase tracking-widest items-center gap-2"><LogOut size={14} /> Log Out</button>
        </header>

        {/* === REQUESTS TAB (NEW) === */}
        {activeTab === 'requests' && (
            <div className="w-full">
                <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                        <h2 className="text-lg font-bold uppercase tracking-wide text-white">Incoming Requests</h2>
                        <span className="text-xs text-gray-500 uppercase tracking-widest">Client Approval Queue</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="p-4 text-[10px] text-gray-400 uppercase">Client Details</th>
                                    <th className="p-4 text-[10px] text-gray-400 uppercase">Requested Session</th>
                                    <th className="p-4 text-[10px] text-gray-400 uppercase">Status</th>
                                    <th className="p-4 text-[10px] text-gray-400 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {bookings.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">No requests found.</td></tr>
                                ) : (
                                    bookings.map(b => (
                                        <tr key={b.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-white flex items-center gap-2"><User size={14}/> {b.clientName}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-2 mt-1"><Mail size={12}/> {b.clientEmail}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-2 mt-1"><Phone size={12}/> {b.clientPhone}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-white font-bold">{b.packageName}</div>
                                                <div className="text-[#D52B1E] font-mono text-xs mt-1">{getSlotDetails(b.slotId)}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                                                    b.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                                                    b.status === 'approved' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' :
                                                    b.status === 'paid' ? 'bg-green-500/20 text-green-500 border border-green-500/30' :
                                                    'bg-red-500/20 text-red-500 border border-red-500/30'
                                                }`}>
                                                    {b.status === 'approved' ? 'Awaiting Payment' : b.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {b.status === 'pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleUpdateStatus(b.id, b.slotId, 'approved')}
                                                            className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateStatus(b.id, b.slotId, 'rejected')}
                                                            className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                                {b.status === 'approved' && <span className="text-xs text-gray-500 italic">Client can now pay</span>}
                                                {b.status === 'paid' && <span className="text-xs text-green-500 font-bold flex items-center justify-end gap-1"><CheckCircle size={12}/> Secured</span>}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* === SCHEDULE TAB === */}
        {activeTab === 'schedule' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-[#111] border border-white/10 p-6 rounded-xl">
                    <h2 className="text-lg font-bold uppercase tracking-wide mb-6 flex items-center gap-2 text-[#D52B1E]"><Plus size={18} /> Add Session</h2>
                    <form onSubmit={handleSlotSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase text-gray-500 font-bold">Package</label>
                            <select className="w-full bg-black/50 border border-white/20 p-3 text-white text-sm rounded focus:border-[#D52B1E] outline-none" value={slotForm.packageName} onChange={(e) => { const pkg = packages.find(p => p.name === e.target.value); setSlotForm({ ...slotForm, packageName: e.target.value, price: pkg ? pkg.price : 0 }); }}>{packages.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-[10px] uppercase text-gray-500 font-bold">Date</label><input type="date" required className="w-full bg-black/50 border border-white/20 p-3 text-white text-sm rounded focus:border-[#D52B1E] outline-none" value={slotForm.date} onChange={e => setSlotForm({...slotForm, date: e.target.value})} /></div>
                            <div><label className="text-[10px] uppercase text-gray-500 font-bold">Time</label><input type="time" required className="w-full bg-black/50 border border-white/20 p-3 text-white text-sm rounded focus:border-[#D52B1E] outline-none" value={slotForm.startTime} onChange={e => setSlotForm({...slotForm, startTime: e.target.value})} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-[10px] uppercase text-gray-500 font-bold">Price ($)</label><input type="number" required className="w-full bg-black/50 border border-white/20 p-3 text-white text-sm rounded focus:border-[#D52B1E] outline-none" value={slotForm.price} onChange={e => setSlotForm({...slotForm, price: Number(e.target.value)})} /></div>
                            <div><label className="text-[10px] uppercase text-gray-500 font-bold">Slots</label><input type="number" required className="w-full bg-black/50 border border-white/20 p-3 text-white text-sm rounded focus:border-[#D52B1E] outline-none" value={slotForm.capacity} onChange={e => setSlotForm({...slotForm, capacity: Number(e.target.value)})} /></div>
                        </div>
                        <button disabled={isSubmitting} className="w-full bg-white text-black py-3 font-bold uppercase text-xs hover:bg-[#D52B1E] hover:text-white transition-colors rounded">{isSubmitting ? 'Processing...' : 'Deploy Session'}</button>
                        {successMsg && <p className="text-green-500 text-xs text-center">{successMsg}</p>}
                    </form>
                </div>
                <div className="lg:col-span-2 bg-[#111] border border-white/10 rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left min-w-[500px]"><thead className="bg-white/5 border-b border-white/10"><tr><th className="p-4 text-[10px] text-gray-400 uppercase">Date</th><th className="p-4 text-[10px] text-gray-400 uppercase">Type</th><th className="p-4 text-[10px] text-gray-400 uppercase">Status</th><th className="p-4 text-right"></th></tr></thead><tbody className="divide-y divide-white/5 text-sm">{slots.map(s => (<tr key={s.id} className="hover:bg-white/5"><td className="p-4 font-mono">{s.date} <span className="text-gray-500">@</span> {s.startTime}</td><td className="p-4 font-bold uppercase">{s.packageName}</td><td className="p-4 text-xs font-mono uppercase">{s.status === 'requested' ? <span className="text-yellow-500">Requested</span> : s.status === 'available' ? <span className="text-green-500">Available</span> : <span className="text-red-500">{s.status}</span>}</td><td className="p-4 text-right"><button onClick={() => handleDelete('training_slots', s.id)} className="text-gray-600 hover:text-[#D52B1E]"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div></div>
            </div>
        )}

        {/* === PACKAGES TAB === */}
        {activeTab === 'packages' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-[#111] border border-white/10 p-6 rounded-xl relative"><h2 className="text-lg font-bold uppercase tracking-wide mb-6 flex items-center gap-2 text-[#0039A6]"><Settings size={18} /> Package Builder</h2><form onSubmit={handlePackageSubmit} className="space-y-6"><div className="space-y-2"><label className="text-[10px] uppercase text-gray-500 font-bold">Package Name</label><input type="text" placeholder="e.g. Group of 3" required className="w-full bg-black/50 border border-white/20 p-3 text-white text-sm rounded focus:border-[#0039A6] outline-none" value={pkgForm.name} onChange={e => setPkgForm({...pkgForm, name: e.target.value})} /></div><div className="space-y-2"><label className="text-[10px] uppercase text-gray-500 font-bold">Format</label><div className="flex bg-black/50 border border-white/20 p-1 rounded"><button type="button" onClick={() => setIsGroup(false)} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded flex items-center justify-center gap-2 transition-all ${!isGroup ? 'bg-white text-black' : 'text-gray-500'}`}><User size={12}/> Private</button><button type="button" onClick={() => setIsGroup(true)} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded flex items-center justify-center gap-2 transition-all ${isGroup ? 'bg-[#0039A6] text-white' : 'text-gray-500'}`}><UsersIcon size={12}/> Group</button></div>{isGroup && (<div className="animate-in fade-in slide-in-from-top-2 pt-2"><div className="flex items-center gap-2 bg-[#0039A6]/10 p-2 rounded border border-[#0039A6]/30"><span className="text-[10px] text-[#0039A6] font-bold uppercase">Players per group:</span><input type="number" min="2" className="w-16 bg-black border border-[#0039A6] text-center text-white text-xs p-1 rounded" value={pkgForm.peopleCount} onChange={e => setPkgForm({...pkgForm, peopleCount: Number(e.target.value)})} /></div></div>)}</div><div className="space-y-3 pt-2 border-t border-white/10"><label className="text-[10px] uppercase text-gray-500 font-bold">Pricing Model</label><div className="relative"><DollarSign className="absolute left-3 top-3 text-gray-500 w-3 h-3" /><input type="number" required placeholder="Single Session Price" className="w-full bg-black/50 border border-white/20 p-3 pl-8 text-white text-sm rounded focus:border-white outline-none" value={pkgForm.price} onChange={e => setPkgForm({...pkgForm, price: Number(e.target.value)})} /></div><div className="grid grid-cols-2 gap-3"><input type="number" placeholder="5-Pack Price (Optional)" className="w-full bg-black/50 border border-white/20 p-3 text-white text-xs rounded focus:border-white outline-none" value={pkgForm.price5 || ''} onChange={e => setPkgForm({...pkgForm, price5: Number(e.target.value)})} /><input type="number" placeholder="10-Pack Price (Optional)" className="w-full bg-black/50 border border-white/20 p-3 text-white text-xs rounded focus:border-white outline-none" value={pkgForm.price10 || ''} onChange={e => setPkgForm({...pkgForm, price10: Number(e.target.value)})} /></div></div><div className="space-y-2 pt-2 border-t border-white/10"><label className="text-[10px] uppercase text-gray-500 font-bold">Inventory</label><div className="flex bg-black/50 border border-white/20 p-1 rounded"><button type="button" onClick={() => setIsLimited(false)} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded flex items-center justify-center gap-2 transition-all ${!isLimited ? 'bg-white text-black' : 'text-gray-500'}`}><Infinity size={12}/> Unlimited</button><button type="button" onClick={() => setIsLimited(true)} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded flex items-center justify-center gap-2 transition-all ${isLimited ? 'bg-[#D52B1E] text-white' : 'text-gray-500'}`}><ShoppingBag size={12}/> Limited</button></div>{isLimited && (<div className="animate-in fade-in slide-in-from-top-2 pt-2"><div className="flex items-center gap-2 bg-[#D52B1E]/10 p-2 rounded border border-[#D52B1E]/30"><span className="text-[10px] text-[#D52B1E] font-bold uppercase">Max Sales:</span><input type="number" min="1" className="w-16 bg-black border border-[#D52B1E] text-center text-white text-xs p-1 rounded" value={pkgForm.maxQuantity} onChange={e => setPkgForm({...pkgForm, maxQuantity: Number(e.target.value)})} /></div></div>)}</div><button disabled={isSubmitting} className="w-full bg-white text-black py-3 font-bold uppercase text-xs tracking-widest hover:bg-[#0039A6] hover:text-white transition-all rounded shadow-lg flex items-center justify-center gap-2">{isSubmitting ? <Loader className="animate-spin" size={14}/> : <><CheckCircle size={14}/> Create Package</>}</button>{successMsg && <p className="text-green-500 text-xs text-center">{successMsg}</p>}</form></div>
                <div className="lg:col-span-2 bg-[#111] border border-white/10 rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left min-w-[500px]"><thead className="bg-white/5 border-b border-white/10"><tr><th className="p-4 text-[10px] text-gray-400 uppercase">Package Name</th><th className="p-4 text-[10px] text-gray-400 uppercase">Details</th><th className="p-4 text-[10px] text-gray-400 uppercase">Pricing</th><th className="p-4 text-right"></th></tr></thead><tbody className="divide-y divide-white/5 text-sm">{packages.map(p => (<tr key={p.id} className="hover:bg-white/5"><td className="p-4 font-bold uppercase text-white">{p.name}</td><td className="p-4"><div className="flex flex-col gap-1"><span className="text-xs text-gray-400 flex items-center gap-1">{p.peopleCount === 1 ? <User size={12}/> : <UsersIcon size={12}/>} {p.peopleCount === 1 ? 'Private' : `Group of ${p.peopleCount}`}</span><span className={`text-[10px] font-bold uppercase ${p.maxQuantity === 0 ? 'text-green-500' : 'text-[#D52B1E]'}`}>{p.maxQuantity === 0 ? 'Unlimited Stock' : `${p.maxQuantity} Available`}</span></div></td><td className="p-4"><div className="font-mono text-white">${p.price}</div><div className="text-[10px] text-gray-500">{p.price5 > 0 && <span className="mr-2">5x: ${p.price5}</span>}{p.price10 > 0 && <span>10x: ${p.price10}</span>}</div></td><td className="p-4 text-right"><button onClick={() => handleDelete('packages', p.id)} className="text-gray-600 hover:text-[#D52B1E] p-2"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div></div>
            </div>
        )}

        {/* === CAMPS TAB === */}
        {activeTab === 'events' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-[#111] border border-white/10 p-6 rounded-xl relative">
                    <h2 className="text-lg font-bold uppercase tracking-wide mb-6 flex items-center gap-2 text-[#D52B1E]">
                        {editingEventId ? <Pencil size={18} /> : <Megaphone size={18} />} 
                        {editingEventId ? ' Edit Camp' : ' Announce Camp'}
                    </h2>
                    {editingEventId && (<div className="mb-4 flex items-center justify-between bg-[#D52B1E]/10 p-2 rounded border border-[#D52B1E]/30"><span className="text-[10px] text-[#D52B1E] font-bold uppercase">Editing Mode</span><button onClick={cancelEventEdit} className="text-gray-400 hover:text-white"><X size={14}/></button></div>)}
                    <form onSubmit={handleEventSubmit} className="space-y-4">
                        <div className="space-y-1"><label className="text-[10px] uppercase text-gray-500 font-bold">Title</label><input type="text" placeholder="e.g. March Break Camp" required className="w-full bg-black/50 border border-white/20 p-3 text-white text-sm rounded focus:border-[#D52B1E] outline-none" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} /></div>
                        <div className="space-y-1"><label className="text-[10px] uppercase text-gray-500 font-bold">Description</label><textarea placeholder="Camp details..." required className="w-full bg-black/50 border border-white/20 p-3 text-white text-xs h-20 rounded focus:border-[#D52B1E] outline-none" value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-3"><input type="date" required className="bg-black/50 border border-white/20 p-3 text-white text-xs rounded" value={eventForm.startDate} onChange={e => setEventForm({...eventForm, startDate: e.target.value})} /><input type="date" required className="bg-black/50 border border-white/20 p-3 text-white text-xs rounded" value={eventForm.endDate} onChange={e => setEventForm({...eventForm, endDate: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-3"><input type="number" required placeholder="Price $" className="bg-black/50 border border-white/20 p-3 text-white text-xs rounded" value={eventForm.price} onChange={e => setEventForm({...eventForm, price: Number(e.target.value)})} /><input type="number" required placeholder="Capacity" className="bg-black/50 border border-white/20 p-3 text-white text-xs rounded" value={eventForm.capacity} onChange={e => setEventForm({...eventForm, capacity: Number(e.target.value)})} /></div>
                        <div className="flex gap-2">{editingEventId && (<button type="button" onClick={cancelEventEdit} className="w-1/3 bg-white/10 text-white py-3 font-bold uppercase text-xs hover:bg-white/20 transition-colors rounded">Cancel</button>)}<button disabled={isSubmitting} className="flex-grow bg-white text-black py-3 font-bold uppercase text-xs hover:bg-[#D52B1E] hover:text-white transition-colors rounded">{isSubmitting ? 'Saving...' : editingEventId ? 'Update Camp' : 'Post Announcement'}</button></div>
                        {successMsg && <p className="text-green-500 text-xs text-center">{successMsg}</p>}
                    </form>
                </div>
                <div className="lg:col-span-2 bg-[#111] border border-white/10 rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left min-w-[500px]"><thead className="bg-white/5 border-b border-white/10"><tr><th className="p-4 text-[10px] text-gray-400 uppercase">Camp Name</th><th className="p-4 text-[10px] text-gray-400 uppercase">Dates</th><th className="p-4 text-[10px] text-gray-400 uppercase">Price</th><th className="p-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-white/5 text-sm">{events.map(e => (<tr key={e.id} className={`hover:bg-white/5 ${editingEventId === e.id ? 'bg-[#D52B1E]/10' : ''}`}><td className="p-4 font-bold uppercase">{e.title}</td><td className="p-4 font-mono text-xs">{e.startDate} to {e.endDate}</td><td className="p-4 font-mono">${e.price}</td><td className="p-4 text-right flex justify-end gap-2"><button onClick={() => handleEditEvent(e)} className="text-gray-400 hover:text-white p-2 bg-white/5 rounded"><Pencil size={14}/></button><button onClick={() => handleDelete('events', e.id)} className="text-gray-600 hover:text-[#D52B1E] p-2"><Trash2 size={14}/></button></td></tr>))}{events.length === 0 && (<tr><td colSpan={4} className="p-8 text-center text-gray-600 text-xs uppercase">No active camps.</td></tr>)}</tbody></table></div></div>
            </div>
        )}

        {/* === GALLERY TAB === */}
        {activeTab === 'gallery' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-[#111] border border-white/10 p-6 rounded-xl relative">
                    <h2 className="text-lg font-bold uppercase tracking-wide mb-6 flex items-center gap-2 text-[#D52B1E]">{editingGalleryId ? <Pencil size={18} /> : <Plus size={18} />} {editingGalleryId ? ' Edit Photo' : ' Add Photo'}</h2>
                    {editingGalleryId && (<div className="mb-4 flex items-center justify-between bg-[#D52B1E]/10 p-2 rounded border border-[#D52B1E]/30"><span className="text-[10px] text-[#D52B1E] font-bold uppercase">Editing Mode</span><button onClick={cancelGalleryEdit} className="text-gray-400 hover:text-white"><X size={14}/></button></div>)}
                    <form onSubmit={handleGallerySubmit} className="space-y-4">
                        <div className="space-y-2"><label className="text-[10px] uppercase text-gray-500 font-bold">Image {editingGalleryId ? '(Optional to change)' : ''}</label><label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-black/50 hover:bg-black hover:border-[#D52B1E] transition-all relative overflow-hidden group">{previewUrl ? (<img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-40" />) : (<div className="flex flex-col items-center justify-center pt-5 pb-6"><UploadCloud className="w-8 h-8 mb-2 text-gray-400 group-hover:text-[#D52B1E]" /><p className="text-xs text-gray-500 uppercase tracking-widest">Click to Upload</p></div>)}<input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileSelect} /></label></div>
                        <div className="space-y-1"><label className="text-[10px] uppercase text-gray-500 font-bold">Description</label><div className="flex gap-2 bg-black/50 border border-white/20 p-3 rounded focus-within:border-[#D52B1E] transition-colors h-32"><AlignLeft size={14} className="text-gray-500 mt-1" /><textarea placeholder="Write the story behind this photo..." required className="bg-transparent w-full h-full text-white text-sm outline-none resize-none placeholder:text-gray-700" value={galleryDescription} onChange={e => setGalleryDescription(e.target.value)} /></div></div>
                        <div className="flex gap-2">{editingGalleryId && (<button type="button" onClick={cancelGalleryEdit} className="w-1/3 bg-white/10 text-white py-3 font-bold uppercase text-xs hover:bg-white/20 transition-colors rounded">Cancel</button>)}<button disabled={isSubmitting} className="flex-grow bg-white text-black py-3 font-bold uppercase text-xs hover:bg-[#D52B1E] hover:text-white transition-colors rounded shadow-lg">{isSubmitting ? 'Saving...' : editingGalleryId ? 'Update Photo' : 'Save to Gallery'}</button></div>
                        {successMsg && <p className="text-green-500 text-xs text-center">{successMsg}</p>}
                    </form>
                </div>
                <div className="lg:col-span-2 bg-[#111] border border-white/10 rounded-xl overflow-hidden p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {galleryItems.map(item => (<div key={item.id} className={`relative group aspect-square bg-black border border-white/10 rounded-lg overflow-hidden ${editingGalleryId === item.id ? 'ring-2 ring-[#D52B1E]' : ''}`}><img src={item.imageUrl} alt="Gallery" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4"><p className="text-xs text-white line-clamp-2 mb-2">{item.description}</p><div className="flex gap-2"><button onClick={() => handleEditGallery(item)} className="text-[10px] text-white bg-white/10 hover:bg-white/20 p-2 rounded flex-1 text-center font-bold uppercase">Edit</button><button onClick={() => handleDelete('gallery', item.id)} className="text-[10px] text-red-500 bg-red-500/10 hover:bg-red-500/20 p-2 rounded flex-1 text-center font-bold uppercase"><Trash2 size={12} className="mx-auto"/></button></div></div></div>))}
                        {galleryItems.length === 0 && (<div className="col-span-full py-12 text-center text-gray-500 text-xs uppercase tracking-widest">Gallery is empty. Upload your first photo.</div>)}
                    </div>
                </div>
            </div>
        )}

      </div>
      <Footer />
    </div>
  );
}