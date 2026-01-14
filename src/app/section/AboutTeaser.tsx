'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Crosshair, MapPin } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function AboutTeaser() {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      
      // 1. Text Stagger Animation
      gsap.fromTo(contentRef.current,
        { y: 50, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 1, 
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
          }
        }
      );

      // 2. Card Slide In
      gsap.fromTo(cardRef.current,
        { x: 50, opacity: 0 },
        { 
          x: 0, 
          opacity: 1, 
          duration: 1.2, 
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
          }
        }
      );

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative py-32 w-full bg-[#050505] text-white overflow-hidden border-t border-white/10 font-sans">
      
      {/* --- BACKGROUND GRAPHICS --- */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
         {/* Giant Background Number (Changed to 14 for 2014) */}
         <div className="absolute -top-20 -left-20 text-[40vw] font-black text-white/[0.02] leading-none">
            14
         </div>
         {/* Grid Lines */}
         <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:10rem_10rem]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

        {/* --- LEFT: STORY CONTENT --- */}
        <div ref={contentRef}>
            
            <div className="inline-flex items-center gap-2 mb-8">
                <div className="w-2 h-2 bg-[#D52B1E] rounded-full animate-pulse"></div>
                <span className="text-xs font-mono text-[#D52B1E] uppercase tracking-widest">Historical Record // 2014</span>
            </div>

            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-8">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">Origin</span> <br/>
              Protocol
            </h2>

            <div className="space-y-8 text-lg text-gray-400 font-light leading-relaxed max-w-xl border-l border-white/10 pl-8">
               <p>
                  It started at a veterans game. I showed up wearing a retro Soviet jersey to honor the <strong>1972 Super Series</strong>. I spoke no English, only hockey.
               </p>
               <p>
                  NHL Legend <strong>Phil Esposito</strong> saw the jersey, smiled, and said:
               </p>
               <blockquote className="text-white text-2xl font-serif italic">
                  Maybe the USSR national team lacked a goalie like that.
               </blockquote>
            </div>

            <div className="mt-12">
               <Link href="/about" className="group relative inline-flex items-center gap-4 px-8 py-4 bg-[#111] border border-white/20 hover:border-[#D52B1E] hover:bg-[#D52B1E] transition-all duration-300 rounded-none">
                   <div className="flex flex-col items-start leading-none">
                       <span className="text-[10px] uppercase tracking-widest text-gray-500 group-hover:text-white/80 mb-1">Access File</span>
                       <span className="text-sm font-bold uppercase tracking-widest text-white">Read Full Story</span>
                   </div>
                   <ArrowRight className="text-white opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
               </Link>
            </div>
        </div>

        {/* --- RIGHT: UNIFIED TACTICAL CARD (Image + 2014 Data) --- */}
        <div ref={cardRef} className="relative group">
            
            {/* The "Card" Container */}
            <div className="relative bg-[#0a0a0a] border border-white/10 p-2 rounded-2xl shadow-2xl">
                
                {/* Inner Content */}
                <div className="bg-[#050505] border border-white/5 rounded-xl p-8 relative overflow-hidden flex flex-col h-full min-h-[400px]">
                    
                    {/* Decorative Top Bar */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0039A6] via-[#D52B1E] to-transparent"></div>

                    {/* IMAGE BACKGROUND (Rink.jpg as bg for the whole card) */}
                    <div className="absolute inset-0 z-0">
                        <Image
                            src="/img/rink.jpg"
                            alt="Ice Rink"
                            fill
                            className="object-cover opacity-30 mix-blend-luminosity group-hover:opacity-40 group-hover:scale-105 transition-all duration-700"
                        />
                        {/* Gradient Mesh Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent"></div>
                    </div>

                    {/* CONTENT LAYER */}
                    <div className="relative z-10 flex flex-col justify-between flex-grow h-full pt-32">
                        
                        {/* 2014 STATS (Now Overlaying Image) */}
                        <div className="mb-8">
                            <div className="flex items-end gap-4 mb-2">
                                <span className="text-8xl font-black text-white leading-none tracking-tighter drop-shadow-2xl">2014</span>
                                <Crosshair className="text-[#D52B1E] mb-4 animate-spin-slow" size={32} />
                            </div>
                            <div className="text-sm font-mono text-gray-400 uppercase tracking-[0.4em] pl-2 border-l-2 border-[#D52B1E]">
                                Origin Year
                            </div>
                        </div>

                        {/* Footer Data */}
                        <div className="flex justify-between items-end border-t border-white/10 pt-6">
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Subject</div>
                                <div className="text-sm font-bold text-white">Nariman Volkov</div>
                            </div>
                            <div className="text-right">
                                 <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500 mb-1 justify-end">
                                    <MapPin size={10} /> Location
                                 </div>
                                 <div className="text-sm font-bold text-white">Toronto, ON</div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Floating Accents */}
            <div className="absolute -top-4 -right-4 w-24 h-24 border-t-2 border-r-2 border-[#D52B1E] rounded-tr-3xl opacity-50"></div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 border-b-2 border-l-2 border-[#0039A6] rounded-bl-3xl opacity-50"></div>

        </div>

      </div>
    </section>
  );
}