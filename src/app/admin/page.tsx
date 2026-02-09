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
  User, Users as UsersIcon, Infinity, LogOut, ArrowLeft, Image as ImageIcon, AlignLeft, UploadCloud, Pencil, X, ShieldAlert, Mail, Phone, Minus
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
  status: string;
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

interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  packageName?: string; // Made optional to prevent crashes
  slotId: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'requests' | 'schedule' | 'packages' | 'events' | 'gallery'>('requests');

  // DATA STATE
  const [slots, setSlots] = useState<TrainingSlot[]>([]);
  const [packages, setPackages] = useState<PackageTier[]>([]);
  const [events, setEvents] = useState<EventCamp[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // --- MULTI-DATE FORM STATE ---
  const [selectedPackage, setSelectedPackage] = useState('');
  const [slotPrice, setSlotPrice] = useState(0);
  const [slotCapacity, setSlotCapacity] = useState(1);
  const [sessionDates, setSessionDates] = useState([{ date: '', startTime: '' }]);

  // OTHER FORMS
  const [pkgForm, setPkgForm] = useState({ name: '', price: 0, price5: 0, price10: 0, peopleCount: 1, maxQuantity: 0 });
  const [isLimited, setIsLimited] = useState(false);
  const [isGroup, setIsGroup] = useState(false);

  const [eventForm, setEventForm] = useState({ title: '', description: '', startDate: '', endDate: '', price: 0, capacity: 20 });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

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
        onSnapshot(query(collection(db, "training_slots"), orderBy("date")), (snap) => setSlots(snap.docs.map(d => ({ id: d.id, ...d.data() } as TrainingSlot))));
        onSnapshot(query(collection(db, "packages"), orderBy("order")), (snap) => setPackages(snap.docs.map(d => ({ id: d.id, ...d.data() } as PackageTier))));
        onSnapshot(query(collection(db, "events"), orderBy("startDate")), (snap) => setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as EventCamp))));
        onSnapshot(query(collection(db, "gallery"), orderBy("createdAt", "desc")), (snap) => setGalleryItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryItem))));
        onSnapshot(query(collection(db, "bookings"), orderBy("createdAt", "desc")), (snap) => setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking))));
      } else {
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // --- HANDLERS: BULK SCHEDULE ---
  const handleAddDateRow = () => { setSessionDates([...sessionDates, { date: '', startTime: '' }]); };
  const handleRemoveDateRow = (index: number) => { const newDates = [...sessionDates]; newDates.splice(index, 1); setSessionDates(newDates); };
  const handleDateChange = (index: number, field: 'date' | 'startTime', value: string) => { const newDates = [...sessionDates]; newDates[index][field] = value; setSessionDates(newDates); };

  const handleMultiSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return alert("Select a package");
    setIsSubmitting(true);
    try {
      const promises = sessionDates.map(session => {
        if (!session.date || !session.startTime) return null;
        return addDoc(collection(db, "training_slots"), {
          packageName: selectedPackage,
          price: Number(slotPrice),
          capacity: Number(slotCapacity),
          date: session.date,
          startTime: session.startTime,
          bookedCount: 0,
          status: 'available',
          createdAt: new Date().toISOString()
        });
      });
      await Promise.all(promises);
      setSuccessMsg(`${sessionDates.length} Sessions Deployed!`);
      setSessionDates([{ date: '', startTime: '' }]);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { console.error(err); alert("Error creating slots"); }
    setIsSubmitting(false);
  };

  // --- OTHER HANDLERS ---
  const handlePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      await addDoc(collection(db, "packages"), { name: pkgForm.name, price: Number(pkgForm.price), price5: Number(pkgForm.price5), price10: Number(pkgForm.price10), peopleCount: isGroup ? Number(pkgForm.peopleCount) : 1, maxQuantity: isLimited ? Number(pkgForm.maxQuantity) : 0, order: packages.length + 1 });
      setPkgForm({ name: '', price: 0, price5: 0, price10: 0, peopleCount: 1, maxQuantity: 0 }); setIsGroup(false); setIsLimited(false); setSuccessMsg('Package Created'); setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { console.error(err); } setIsSubmitting(false);
  };

  const handleEditEvent = (event: EventCamp) => { setEditingEventId(event.id); setEventForm({ title: event.title, description: event.description, startDate: event.startDate, endDate: event.endDate, price: event.price, capacity: event.capacity }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const cancelEventEdit = () => { setEditingEventId(null); setEventForm({ title: '', description: '', startDate: '', endDate: '', price: 0, capacity: 20 }); };
  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const eventData = { ...eventForm, price: Number(eventForm.price), capacity: Number(eventForm.capacity), status: editingEventId ? events.find(e => e.id === editingEventId)?.status : 'active' };
      if (editingEventId) { await updateDoc(doc(db, "events", editingEventId), eventData); setSuccessMsg('Camp Updated'); } else { await addDoc(collection(db, "events"), { ...eventData, bookedCount: 0, createdAt: new Date().toISOString() }); setSuccessMsg('Camp Announced'); }
      cancelEventEdit(); setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { console.error(err); } setIsSubmitting(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { setSelectedFile(e.target.files[0]); setPreviewUrl(URL.createObjectURL(e.target.files[0])); } };
  const handleEditGallery = (item: GalleryItem) => { setEditingGalleryId(item.id); setGalleryDescription(item.description); setPreviewUrl(item.imageUrl); setSelectedFile(null); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const cancelGalleryEdit = () => { setEditingGalleryId(null); setGalleryDescription(''); setPreviewUrl(null); setSelectedFile(null); };
  const handleGallerySubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingGalleryId && !selectedFile) { alert("Select an image."); return; } setIsSubmitting(true);
    try {
      let url = previewUrl; if (selectedFile) { const storageRef = ref(storage, `gallery/${Date.now()}_${selectedFile.name}`); await uploadBytes(storageRef, selectedFile); url = await getDownloadURL(storageRef); }
      if (editingGalleryId) { await updateDoc(doc(db, "gallery", editingGalleryId), { imageUrl: url, description: galleryDescription }); setSuccessMsg('Photo Updated'); } else { await addDoc(collection(db, "gallery"), { imageUrl: url, description: galleryDescription, createdAt: new Date().toISOString() }); setSuccessMsg('Photo Uploaded'); }
      cancelGalleryEdit(); setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { console.error(err); } setIsSubmitting(false);
  };

  // --- REQUEST APPROVAL HANDLER ---
  const handleUpdateStatus = async (bookingId: string, slotId: string, newStatus: string) => {
    if (!confirm(`Mark as ${newStatus}?`)) return;
    try {
      const res = await fetch('/api/booking/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId, slotId, status: newStatus }) });
      if (res.ok) setSuccessMsg("Updated!"); else alert("Error");
    } catch (e) { alert("Error"); }
  };

  const handleDelete = async (col: string, id: string) => { if (confirm("Delete?")) await deleteDoc(doc(db, col, id)); };
  const handleLogout = async () => { await signOut(auth); router.push('/login'); };

  // Helper to find slot info from booking
  const getSlotDetails = (slotId: string) => {
    // Check Slots
    const slot = slots.find(s => s.id === slotId);
    if (slot) return `${slot.date} @ ${slot.startTime}`;

    // Check Events
    const event = events.find(e => e.id === slotId);
    if (event) return `${event.startDate} - ${event.endDate}`;

    return 'Unknown Date';
  };

  // Helper to get Package Name safely
  const getPackageName = (booking: Booking) => {
    if (booking.packageName) return booking.packageName;

    // Check Slots
    const slot = slots.find(s => s.id === booking.slotId);
    if (slot) return slot.packageName;

    // Check Events
    const event = events.find(e => e.id === booking.slotId);
    if (event) return event.title;

    return 'Unknown Package';
  };

  if (loading) return <div className="h-screen bg-black text-white flex items-center justify-center"><Loader className="animate-spin" /></div>;
  if (!authorized) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white font-sans selection:bg-[#D52B1E] selection:text-white">
      <div className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-12 pt-32 md:pt-40 pb-20">

        {/* NAV HEADER */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 border-b border-white/10 pb-6 gap-6 w-full">
          <div className="w-full lg:w-auto">
            <h1 className="text-3xl font-black uppercase mb-4">Command <span className="text-[#D52B1E]">Center</span></h1>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button onClick={() => setActiveTab('requests')} className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded ${activeTab === 'requests' ? 'bg-[#D52B1E] text-white' : 'bg-white/5 text-gray-400'}`}>
                Requests {bookings.filter(b => b.status === 'pending').length > 0 && <span className="bg-white text-black px-1.5 rounded-full">{bookings.filter(b => b.status === 'pending').length}</span>}
              </button>
              <button onClick={() => setActiveTab('schedule')} className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded ${activeTab === 'schedule' ? 'bg-white text-black' : 'bg-white/5 text-gray-400'}`}>Schedule</button>
              <button onClick={() => setActiveTab('packages')} className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded ${activeTab === 'packages' ? 'bg-white text-black' : 'bg-white/5 text-gray-400'}`}>Packages</button>
              <button onClick={() => setActiveTab('events')} className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded ${activeTab === 'events' ? 'bg-white text-black' : 'bg-white/5 text-gray-400'}`}>Camps</button>
              <button onClick={() => setActiveTab('gallery')} className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded ${activeTab === 'gallery' ? 'bg-white text-black' : 'bg-white/5 text-gray-400'}`}>Gallery</button>
            </div>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-white text-xs uppercase"><LogOut size={14} /> Log Out</button>
        </header>

        {/* ================= REQUESTS TAB ================= */}
        {activeTab === 'requests' && (
          <div className="w-full bg-[#111] border border-white/10 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-white/10"><h2 className="text-lg font-bold uppercase text-white">Incoming Requests</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-white/5 border-b border-white/10"><tr><th className="p-4 text-[10px] text-gray-400 uppercase">Client</th><th className="p-4 text-[10px] text-gray-400 uppercase">Session</th><th className="p-4 text-[10px] text-gray-400 uppercase">Status</th><th className="p-4 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-white/5 text-sm">{bookings.map(b => (
                  <tr key={b.id} className="hover:bg-white/5">
                    <td className="p-4">
                      <div className="font-bold text-white flex gap-2"><User size={14} /> {b.clientName}</div>
                      <div className="text-xs text-gray-500 mt-1 flex gap-2"><Mail size={12} /> {b.clientEmail}</div>
                      <div className="text-xs text-gray-500 mt-1 flex gap-2"><Phone size={12} /> {b.clientPhone}</div>
                    </td>
                    <td className="p-4">
                      {/* FIX: Use helper function to find Package Name if missing */}
                      <div className="text-white font-bold">{getPackageName(b)}</div>
                      <div className="text-[#D52B1E] font-mono text-xs mt-1">{getSlotDetails(b.slotId)}</div>
                    </td>
                    <td className="p-4"><span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${b.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : b.status === 'approved' ? 'bg-blue-500/20 text-blue-500' : 'bg-white/10'}`}>{b.status}</span></td>
                    <td className="p-4 text-right">
                      {b.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleUpdateStatus(b.id, b.slotId, 'approved')} className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded text-[10px] font-bold uppercase tracking-widest">Approve</button>
                          <button onClick={() => handleUpdateStatus(b.id, b.slotId, 'rejected')} className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded text-[10px] font-bold uppercase tracking-widest">Reject</button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 uppercase font-mono">{b.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
                  {bookings.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-500">No pending requests.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= SCHEDULE TAB (BULK ADD) ================= */}
        {activeTab === 'schedule' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-[#111] border border-white/10 p-6 rounded-xl">
              <h2 className="text-lg font-bold uppercase tracking-wide mb-6 flex items-center gap-2 text-[#D52B1E]"><Plus size={18} /> Bulk Schedule</h2>
              <form onSubmit={handleMultiSlotSubmit} className="space-y-4">
                <div className="space-y-1"><label className="text-[10px] uppercase text-gray-500 font-bold">1. Package</label><select className="w-full bg-black/50 border border-white/20 p-3 text-white text-sm rounded focus:border-[#D52B1E] outline-none" value={selectedPackage} onChange={(e) => { const pkg = packages.find(p => p.name === e.target.value); setSelectedPackage(e.target.value); setSlotPrice(pkg ? pkg.price : 0); }}><option value="">-- Choose --</option>{packages.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] uppercase text-gray-500 font-bold">Price</label><input type="number" className="w-full bg-black/50 border border-white/20 p-2 text-white text-sm rounded" value={slotPrice} onChange={e => setSlotPrice(Number(e.target.value))} /></div><div><label className="text-[10px] uppercase text-gray-500 font-bold">Slots</label><input type="number" className="w-full bg-black/50 border border-white/20 p-2 text-white text-sm rounded" value={slotCapacity} onChange={e => setSlotCapacity(Number(e.target.value))} /></div></div>
                <div className="space-y-2 border-t border-white/10 pt-4"><label className="text-[10px] uppercase text-gray-500 font-bold">2. Add Dates</label>
                  {sessionDates.map((session, idx) => (
                    <div key={idx} className="flex gap-2 items-center"><input type="date" required className="bg-black/50 border border-white/20 p-2 text-white text-xs rounded w-1/2" value={session.date} onChange={e => handleDateChange(idx, 'date', e.target.value)} /><input type="time" required className="bg-black/50 border border-white/20 p-2 text-white text-xs rounded w-1/3" value={session.startTime} onChange={e => handleDateChange(idx, 'startTime', e.target.value)} />{idx > 0 && <button type="button" onClick={() => handleRemoveDateRow(idx)} className="text-red-500"><Minus size={16} /></button>}</div>
                  ))}
                  <button type="button" onClick={handleAddDateRow} className="text-xs text-[#D52B1E] font-bold uppercase mt-2 flex items-center gap-1"><Plus size={14} /> Add Date</button>
                </div>
                <button disabled={isSubmitting} className="w-full bg-white text-black py-3 font-bold uppercase text-xs hover:bg-[#D52B1E] hover:text-white transition-colors rounded mt-4">{isSubmitting ? 'Deploying...' : `Deploy ${sessionDates.length} Sessions`}</button>
                {successMsg && <p className="text-green-500 text-xs text-center mt-2">{successMsg}</p>}
              </form>
            </div>
            <div className="lg:col-span-2 bg-[#111] border border-white/10 rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left min-w-[500px]"><thead className="bg-white/5 border-b border-white/10"><tr><th className="p-4 text-[10px] text-gray-400 uppercase">Date</th><th className="p-4 text-[10px] text-gray-400 uppercase">Package</th><th className="p-4 text-[10px] text-gray-400 uppercase">Status</th><th className="p-4 text-right"></th></tr></thead><tbody className="divide-y divide-white/5 text-sm">{slots.map(s => (<tr key={s.id} className="hover:bg-white/5"><td className="p-4 font-mono">{s.date} <span className="text-gray-500">@</span> {s.startTime}</td><td className="p-4 font-bold uppercase">{s.packageName}</td><td className="p-4 text-xs font-mono uppercase">{s.status === 'requested' ? <span className="text-yellow-500">Requested</span> : <span className="text-green-500">Available</span>}</td><td className="p-4 text-right"><button onClick={() => handleDelete('training_slots', s.id)} className="text-gray-600 hover:text-[#D52B1E]"><Trash2 size={16} /></button></td></tr>))}</tbody></table></div></div>
          </div>
        )}

        {/* ================= PACKAGES TAB ================= */}
        {activeTab === 'packages' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#111] border border-white/10 p-6 rounded-xl">
              <h2 className="text-lg font-bold uppercase tracking-wide mb-6 flex items-center gap-2 text-[#0039A6]"><Settings size={18} /> Create Package</h2>
              <form onSubmit={handlePackageSubmit} className="space-y-4">
                <input type="text" placeholder="Package Name" required className="w-full bg-black/50 border border-white/20 p-3 text-white text-sm rounded" value={pkgForm.name} onChange={e => setPkgForm({ ...pkgForm, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-3"><input type="number" placeholder="Price" required className="bg-black/50 border border-white/20 p-3 text-white text-sm rounded" value={pkgForm.price || ''} onChange={e => setPkgForm({ ...pkgForm, price: Number(e.target.value) })} /><select className="bg-black/50 border border-white/20 p-3 text-white text-sm rounded" onChange={e => setIsGroup(e.target.value === 'group')}><option value="private">Private</option><option value="group">Group</option></select></div>
                <button className="w-full bg-white text-black py-3 font-bold uppercase text-xs hover:bg-[#0039A6] hover:text-white rounded">Create Package</button>
              </form>
            </div>
            <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden"><table className="w-full text-left"><thead className="bg-white/5 border-b border-white/10"><tr><th className="p-4 text-[10px] text-gray-400 uppercase">Package</th><th className="p-4 text-right">Action</th></tr></thead><tbody>{packages.map(p => (<tr key={p.id} className="border-b border-white/5"><td className="p-4 text-white font-bold">{p.name} - ${p.price}</td><td className="p-4 text-right"><button onClick={() => handleDelete('packages', p.id)}><Trash2 size={16} className="text-gray-500 hover:text-white" /></button></td></tr>))}</tbody></table></div>
          </div>
        )}

        {/* ================= CAMPS TAB ================= */}
        {activeTab === 'events' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-[#111] border border-white/10 p-6 rounded-xl relative">
              <h2 className="text-lg font-bold uppercase tracking-wide mb-6 flex items-center gap-2 text-[#D52B1E]">{editingEventId ? <Pencil size={18} /> : <Megaphone size={18} />} {editingEventId ? ' Edit Camp' : ' Announce Camp'}</h2>
              {editingEventId && (<div className="mb-4 flex items-center justify-between bg-[#D52B1E]/10 p-2 rounded border border-[#D52B1E]/30"><span className="text-[10px] text-[#D52B1E] font-bold uppercase">Editing Mode</span><button onClick={cancelEventEdit} className="text-gray-400 hover:text-white"><X size={14} /></button></div>)}
              <form onSubmit={handleEventSubmit} className="space-y-4">
                <input type="text" placeholder="Title" required className="w-full bg-black/50 border border-white/20 p-3 text-white text-sm rounded" value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} />
                <textarea placeholder="Description" required className="w-full bg-black/50 border border-white/20 p-3 text-white text-xs h-20 rounded" value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} />
                <div className="grid grid-cols-2 gap-3"><input type="date" required className="bg-black/50 border border-white/20 p-3 text-white text-xs rounded" value={eventForm.startDate} onChange={e => setEventForm({ ...eventForm, startDate: e.target.value })} /><input type="date" required className="bg-black/50 border border-white/20 p-3 text-white text-xs rounded" value={eventForm.endDate} onChange={e => setEventForm({ ...eventForm, endDate: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3"><input type="number" placeholder="Price" className="bg-black/50 border border-white/20 p-3 text-white text-xs rounded" value={eventForm.price} onChange={e => setEventForm({ ...eventForm, price: Number(e.target.value) })} /><input type="number" placeholder="Capacity" className="bg-black/50 border border-white/20 p-3 text-white text-xs rounded" value={eventForm.capacity} onChange={e => setEventForm({ ...eventForm, capacity: Number(e.target.value) })} /></div>
                <button className="w-full bg-white text-black py-3 font-bold uppercase text-xs hover:bg-[#D52B1E] hover:text-white rounded">{editingEventId ? 'Update' : 'Post'}</button>
              </form>
            </div>
            <div className="lg:col-span-2 bg-[#111] border border-white/10 rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left min-w-[500px]"><thead className="bg-white/5 border-b border-white/10"><tr><th className="p-4 text-[10px] text-gray-400 uppercase">Camp</th><th className="p-4 text-[10px] text-gray-400 uppercase">Dates</th><th className="p-4 text-right">Actions</th></tr></thead><tbody>{events.map(e => (<tr key={e.id} className="hover:bg-white/5"><td className="p-4 font-bold">{e.title}</td><td className="p-4 text-xs">{e.startDate} - {e.endDate}</td><td className="p-4 text-right flex gap-2 justify-end"><button onClick={() => handleEditEvent(e)}><Pencil size={14} className="text-gray-400" /></button><button onClick={() => handleDelete('events', e.id)}><Trash2 size={14} className="text-red-500" /></button></td></tr>))}</tbody></table></div></div>
          </div>
        )}

        {/* ================= GALLERY TAB ================= */}
        {activeTab === 'gallery' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-[#111] border border-white/10 p-6 rounded-xl">
              <h2 className="text-lg font-bold uppercase tracking-wide mb-6 flex items-center gap-2 text-[#D52B1E]">{editingGalleryId ? <Pencil size={18} /> : <Plus size={18} />} {editingGalleryId ? ' Edit Photo' : ' Add Photo'}</h2>
              {editingGalleryId && (<div className="mb-4 flex items-center justify-between bg-[#D52B1E]/10 p-2 rounded border border-[#D52B1E]/30"><span className="text-[10px] text-[#D52B1E] font-bold uppercase">Editing Mode</span><button onClick={cancelGalleryEdit} className="text-gray-400 hover:text-white"><X size={14} /></button></div>)}
              <form onSubmit={handleGallerySubmit} className="space-y-4">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-black/50 hover:bg-black hover:border-[#D52B1E] transition-all relative overflow-hidden">{previewUrl ? (<img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-60" />) : (<div className="flex flex-col items-center justify-center pt-5 pb-6"><UploadCloud className="w-8 h-8 mb-2 text-gray-400" /><p className="text-xs text-gray-500 uppercase">Click to Upload</p></div>)}<input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} /></label>
                <textarea placeholder="Description" required className="w-full bg-black/50 border border-white/20 p-3 text-white text-xs h-20 rounded" value={galleryDescription} onChange={e => setGalleryDescription(e.target.value)} />
                <button className="w-full bg-white text-black py-3 font-bold uppercase text-xs hover:bg-[#D52B1E] hover:text-white rounded">{editingGalleryId ? 'Update' : 'Save'}</button>
              </form>
            </div>
            <div className="lg:col-span-2 bg-[#111] border border-white/10 rounded-xl overflow-hidden p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{galleryItems.map(item => (<div key={item.id} className="relative group aspect-square bg-black border border-white/10 rounded-lg overflow-hidden"><img src={item.imageUrl} alt="Gallery" className="w-full h-full object-cover opacity-70 group-hover:opacity-100" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4"><p className="text-xs text-white line-clamp-2 mb-2">{item.description}</p><div className="flex gap-2"><button onClick={() => handleEditGallery(item)} className="text-[10px] text-white bg-white/10 p-2 rounded flex-1 font-bold">Edit</button><button onClick={() => handleDelete('gallery', item.id)} className="text-[10px] text-red-500 bg-red-500/10 p-2 rounded flex-1 font-bold">Delete</button></div></div></div>))}</div>
            </div>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}