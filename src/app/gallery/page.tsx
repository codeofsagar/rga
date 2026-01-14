'use client';

import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { X, ZoomIn, Loader, Camera, AlignLeft } from 'lucide-react';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import Footer from '../section/Footer';

// Define the data structure
interface GalleryItem {
  id: string;
  imageUrl: string;
  description: string;
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState(true);

  // --- 1. REAL-TIME DATA FETCH ---
  useEffect(() => {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryItem)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [selectedItem]);

  return (
    <main className="bg-[#050505] min-h-screen flex flex-col text-white font-sans selection:bg-[#D52B1E] selection:text-white">
      <Navbar />
      
      {/* --- HERO HEADER --- */}
      <section className="pt-40 pb-16 px-6 text-center border-b border-white/10 relative overflow-hidden">
          {/* Background Noise */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 border border-white/10 rounded-full bg-white/5">
                <Camera size={14} className="text-[#D52B1E]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Visual Archive</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-4">
                The <span className="text-[#D52B1E]">Vault</span>
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto font-light text-sm md:text-base uppercase tracking-widest leading-relaxed">
                Moments from the crease. Capturing the intensity, discipline, and development of RGA Goaltending.
            </p>
          </div>
      </section>

      {/* --- GALLERY GRID --- */}
      <section className="flex-grow w-full max-w-[1600px] mx-auto px-4 md:px-8 py-12">
        
        {loading ? (
            <div className="flex flex-col items-center justify-center py-32 opacity-50 gap-4">
                <Loader className="animate-spin text-[#D52B1E]" size={40} />
                <span className="text-xs uppercase tracking-widest font-mono">Loading Assets...</span>
            </div>
        ) : items.length === 0 ? (
            <div className="text-center py-32 border border-dashed border-white/10 rounded-2xl bg-white/5">
                <p className="text-gray-500 uppercase tracking-widest text-xs">No images in the archives yet.</p>
            </div>
        ) : (
            // GRID LAYOUT
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item) => (
                    <div 
                        key={item.id} 
                        onClick={() => setSelectedItem(item)}
                        className="group relative aspect-square overflow-hidden bg-[#111] cursor-pointer border border-white/5 hover:border-[#D52B1E]/50 transition-all duration-500 rounded-sm"
                    >
                        {/* Image */}
                        <Image 
                            src={item.imageUrl} 
                            alt="Gallery Item" 
                            fill 
                            className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        />
                        
                        {/* Hover Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                            <div className="flex items-center gap-2 text-white font-bold uppercase tracking-widest text-[10px] bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                <ZoomIn size={12} className="text-[#D52B1E]" /> 
                                View Intel
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </section>

      {/* --- LIGHTBOX MODAL --- */}
      {selectedItem && (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={() => setSelectedItem(null)} // Close on backdrop click
        >
            
            {/* Close Button */}
            <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 p-3 bg-white/10 rounded-full hover:bg-[#D52B1E] hover:text-white transition-colors z-50 group"
            >
                <X size={24} className="group-hover:rotate-90 transition-transform" />
            </button>

            {/* Modal Content */}
            <div 
                className="max-w-7xl w-full h-[85vh] grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
            >
                
                {/* Left: Image Container */}
                <div className="lg:col-span-8 relative bg-black flex items-center justify-center h-[50vh] lg:h-full border-b lg:border-b-0 lg:border-r border-white/10">
                    <div className="relative w-full h-full p-4">
                        <Image 
                            src={selectedItem.imageUrl} 
                            alt="Selected View" 
                            fill 
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                {/* Right: Description Panel */}
                <div className="lg:col-span-4 p-8 lg:p-12 flex flex-col h-full bg-[#0a0a0a] overflow-y-auto">
                    
                    {/* Decorative Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-6 opacity-50">
                            <div className="w-8 h-[1px] bg-white"></div>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-white">Archive Data</span>
                        </div>
                        
                        <h3 className="text-2xl font-black uppercase text-white mb-2 leading-none">
                            Image <span className="text-[#D52B1E]">Details</span>
                        </h3>
                    </div>

                    {/* The Description */}
                    <div className="flex-grow">
                        <div className="flex gap-4">
                            <AlignLeft size={20} className="text-[#D52B1E] flex-shrink-0 mt-1" />
                            <p className="text-gray-300 font-light leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                                {selectedItem.description}
                            </p>
                        </div>
                    </div>

                    {/* Footer of Modal */}
                    <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-end">
                        <div>
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Encrypted</p>
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest">RGA Internal Media</p>
                        </div>
                        <div className="w-12 h-12 border border-white/10 rounded-full flex items-center justify-center">
                            <div className="w-1 h-1 bg-[#D52B1E] rounded-full animate-pulse"></div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
      )}

      <Footer />
    </main>
  );
}