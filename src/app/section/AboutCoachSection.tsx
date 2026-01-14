'use client';

import Image from 'next/image';
import { ArrowRight, Star, Trophy, GraduationCap, Heart, Globe, Shield } from 'lucide-react';

// =========================================================
// 1. HELPER: MARQUEE (Optimized)
// =========================================================
const Marquee = () => {
  const items = [
    "PRACTICAL EXPERIENCE",
    "GOALTENDING ACADEMY",
    "INDIVIDUAL APPROACH",
    "RUSSIAN TECHNIQUE",
  ];

  return (
    <div className="relative flex overflow-hidden border-y border-white/10 bg-black py-8 md:py-12 select-none z-20">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10"></div>
      
      <div className="flex min-w-full animate-marquee">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center shrink-0">
            {items.map((text, index) => (
              <div key={index} className="flex items-center">
                <span className="mx-8 text-5xl md:text-8xl font-black uppercase italic text-transparent bg-clip-text bg-gradient-to-b from-white via-[#0039A6] to-[#0039A6] opacity-50">
                  {text}
                </span>
                <span className="text-white/20 text-3xl">★</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// =========================================================
// 2. MAIN PAGE COMPONENT
// =========================================================

export default function AboutCoachPage() {
  return (
    <div className="relative font-sans text-white bg-[#050505] selection:bg-[#D52B1E] selection:text-white overflow-x-hidden">
      
      {/* Global Cinematic Grain (Optimized opacity) */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04] z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* ==================== SECTION 1: HERO & BIO ==================== */}
      <section className="relative min-h-screen w-full overflow-hidden bg-[#050505]">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen">
            
            {/* Desktop Static Image */}
            <div className="hidden lg:block lg:col-span-5 relative h-screen sticky top-0 border-r border-white/5">
                <div className="absolute inset-0 bg-gray-900">
                    <Image 
                      src="/img/co.webp" 
                      alt="Nariman Volkov" 
                      fill 
                      className="object-cover object-top"
                      priority
                      quality={90}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-[#050505]"></div>
                </div>
                <div className="absolute bottom-12 left-12 origin-bottom-left -rotate-90 pointer-events-none select-none">
                      <h1 className="text-[12vh] font-black uppercase text-transparent text-stroke-white opacity-20 whitespace-nowrap">
                            Nariman Volkov
                      </h1>
                </div>
            </div>

            {/* Right: Content */}
            <div className="col-span-1 lg:col-span-7 flex flex-col relative">
                <div className="p-6 md:p-12 lg:p-24 max-w-4xl mx-auto w-full">
                    
                    {/* Mobile Image */}
                    <div className="block lg:hidden relative w-full aspect-[4/5] mb-10 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                        <Image 
                           src="/img/co.webp" 
                           alt="Nariman Volkov" 
                           fill 
                           className="object-cover object-top"
                           priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                        <div className="absolute bottom-4 left-4 right-4">
                            <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#D52B1E] mb-2 block">Founder</span>
                            <h2 className="text-3xl font-black uppercase">Nariman Volkov</h2>
                        </div>
                    </div>

                    <div className="mb-8 relative z-10">
                        <div className="flex items-center gap-3 mb-2 text-[#D52B1E]">
                            <Star size={14} fill="currentColor" />
                            <span className="text-xs font-bold uppercase tracking-[0.3em]">RGA Founder</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-medium uppercase leading-[0.9]">
                            Nariman <span className="font-serif italic text-gray-500">Volkov</span>
                        </h1>
                    </div>

                    <div className="space-y-8 text-gray-300 font-light leading-relaxed">
                        <p className="text-xl text-white">
                            Hockey Goalie Coach, RGA Founder. A graduate of the <b className="text-[#0039A6]">Kazan Hockey Academy</b>.
                        </p>
                        <div className="w-full h-[1px] bg-white/10"></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                 <div className="flex items-center gap-2 text-[#D52B1E] font-bold uppercase text-xs tracking-widest">
                                    <Trophy size={14} /> Competition
                                 </div>
                                 <p className="text-sm">Competed in Russia&apos;s Junior Hockey League and at the University level.</p>
                            </div>
                            <div className="space-y-2">
                                 <div className="flex items-center gap-2 text-[#D52B1E] font-bold uppercase text-xs tracking-widest">
                                    <GraduationCap size={14} /> Education
                                 </div>
                                 <p className="text-sm">Certified Goalie Specialist. Bachelor&apos;s Degree in Physical Education.</p>
                            </div>
                        </div>

                        <div className="bg-white/5 p-6 border-l-2 border-[#0039A6] rounded-r-lg">
                            <h4 className="text-white font-bold uppercase text-sm tracking-widest mb-3">Experience</h4>
                            <p className="text-sm text-gray-300">
                                Provided goaltending coaching to elite athletes and women’s teams competing across 
                                <span className="text-white font-medium block mt-2 text-sm tracking-wide">KHL, VHL, MHL, Junior A, and AAA levels.</span>
                            </p>
                        </div>
                        
                        <div>
                            <div className="flex items-center gap-2 text-[#D52B1E] font-bold uppercase text-xs tracking-widest mb-2">
                                <Heart size={14} /> Social Impact
                            </div>
                            <p className="text-sm">
                                Organizer of Kind Heart charity games and Cool Ice championships for youth development.
                            </p>
                        </div>

                        <p className="font-serif italic text-2xl text-white pt-4 border-t border-white/10 mt-8">
                            I am thrilled to share my knowledge with Canadian goaltenders!
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      <Marquee />

      {/* ==================== SECTION 2: PHILOSOPHY ==================== */}
      <section className="relative w-full bg-[#1d1919] border-t border-white/10 overflow-hidden">
         
         {/* Optimized Backgrounds (No complex blends) */}
         <div className="absolute inset-0 z-0 flex">
             <div className="w-1/2 h-full bg-[#07090c] relative">
                 <div className="absolute inset-0 bg-gradient-to-r from-[#040a16]/40 to-transparent"></div>
             </div>
             <div className="w-1/2 h-full bg-[#1a0505] relative">
                 <div className="absolute inset-0 bg-gradient-to-l from-[#000000]/40 to-transparent"></div>
             </div>
             {/* Center Line */}
             <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/20 z-10"></div>
         </div>

         <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 md:py-48">
             <div className="text-center mb-24 relative">
                 <div className="inline-flex items-center gap-3 border border-white/20 px-5 py-2 rounded-full mb-8 bg-black/60 backdrop-blur-md">
                     <Shield size={16} className="text-white" />
                     <span className="text-xs font-bold uppercase tracking-[0.3em]">The Methodology</span>
                 </div>
                 
                 <h2 className="text-5xl md:text-9xl font-black uppercase font-normal leading-none relative z-10 drop-shadow-2xl">
                     Two Worlds. <br/>
                     <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-[#0039A6] to-[#D52B1E]">
                        One System.
                     </span>
                 </h2>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 relative">
                 <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 bg-[#080808] border border-white/20 rounded-full items-center justify-center">
                    <span className="font-black italic text-white/50 text-sm">VS</span>
                 </div>

                 <div className="text-center md:text-right space-y-6">
                     <div className="inline-block p-4 bg-[#0039A6]/10 rounded-2xl mb-4 border border-[#0039A6]/30">
                        <Globe size={40} className="text-[#0039A6]" />
                     </div>
                     <h3 className="text-3xl md:text-5xl font-black uppercase text-white"><span className="text-[#0039A6]">European</span> <br/> Technique</h3>
                     <div className="h-1 w-20 bg-[#0039A6] ml-auto mr-auto md:mr-0 md:ml-auto"></div>
                     <p className="text-lg text-blue-100/70 leading-relaxed font-light">
                       Built on the Soviet foundation of <strong className="text-white">fluid skating</strong>, positional discipline, and tactical IQ. We teach efficiency over wasted movement.
                     </p>
                 </div>

                 <div className="text-center md:text-left space-y-6">
                     <div className="inline-block p-4 bg-[#3b1917]/10 rounded-2xl mb-4 border border-[#D52B1E]/30">
                        <Shield size={40} className="text-[#D52B1E]" />
                     </div>
                     <h3 className="text-3xl md:text-5xl font-black uppercase text-white"><span className="text-[#D52B1E]">American</span> <br/> Aggression</h3>
                     <div className="h-1 w-20 bg-[#D52B1E] mx-auto md:mx-0"></div>
                     <p className="text-lg text-red-100/70 leading-relaxed font-light">
                       Forged in the fires of North American hockey. We instill <strong className="text-white">battle mentality</strong>, crease control, and the ability to fight through traffic.
                     </p>
                 </div>
             </div>
             
             <div className="mt-32 text-center max-w-3xl mx-auto relative z-10">
                 <p className="text-2xl md:text-4xl font-light text-white leading-tight">
                    Our goal isn&apos;t just to teach saves. It is to engineer <span className="text-white font-bold underline decoration-[#D52B1E] underline-offset-8 decoration-4">dominance</span>.
                 </p>
             </div>
         </div>
      </section>

     

      {/* ==================== SECTION 3: SIGN UP ==================== */}
      <section className="relative w-full py-32 bg-[#0a0a0a] overflow-hidden border-t border-white/10">
         <div className="absolute inset-0 z-0 opacity-20">
             <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[150%] bg-[#421411] blur-[150px] animate-pulse"></div>
             <div className="absolute bottom-[-50%] right-[-20%] w-[80%] h-[150%] bg-[#121824] blur-[150px] animate-pulse"></div>
         </div>

         <div className="relative z-20 w-full max-w-7xl px-6 mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
             <div>
                 <div className="mb-6 flex items-center gap-3">
                     <div className="h-[1px] w-8 bg-[#D52B1E]"></div>
                     <span className="font-mono text-xs uppercase tracking-[0.4em] text-[#D52B1E] font-bold">
                       Excellence Awaits
                     </span>
                 </div>
                 
                 <h2 className="text-6xl md:text-8xl font-black uppercase leading-[1] mb-6 text-white font-normal">
                     Train With <br/>
                     <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D52B1E] via-white to-[#D52B1E]">
                       The Best
                     </span>
                 </h2>
                 
                 <p className="text-xl text-gray-400 font-light max-w-sm border-l-2 border-white/20 pl-4">
                     Limited spots available for the upcoming season.
                 </p>
             </div>

             <div className="flex justify-center md:justify-end">
                 <div className="group relative cursor-pointer">
                     <div className="absolute inset-0 bg-[#D52B1E] blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                     
                     <div className="w-48 h-48 border border-white/20 bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center relative overflow-hidden transition-all duration-300 hover:scale-105 hover:border-white/50 shadow-2xl">
                         <div className="absolute inset-0 bg-[#D52B1E] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.85,0,0.15,1)]"></div>
                         
                         <div className="relative z-10 flex flex-col items-center text-center gap-1 text-white transition-colors duration-300">
                             <span className="text-lg font-bold uppercase tracking-widest">
                                 Join <br/> Now
                             </span>
                             <ArrowRight className="w-5 h-5 mt-1" />
                         </div>
                     </div>
                 </div>
             </div>
         </div>
      </section>

      <style jsx global>{`
        .text-stroke-white { 
            -webkit-text-stroke: 1px rgba(255,255,255,0.3); 
            color: transparent; 
        }
        
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `}</style>
    </div>
  );
}