'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPin, CheckCircle2, Quote, Play, Check, Users, Trophy, ArrowRight } from 'lucide-react';
import Footer from '../section/Footer';
import Image from 'next/image';
gsap.registerPlugin(ScrollTrigger);

// --- 1. HELPER: TEXT PRESSURE (Cinematic Title) ---
interface TextPressureProps {
  text?: string;
  fontFamily?: string;
  fontUrl?: string;
  width?: boolean;
  weight?: boolean;
  italic?: boolean;
  alpha?: boolean;
  flex?: boolean;
  stroke?: boolean;
  scale?: boolean;
  textColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  className?: string;
  minFontSize?: number;
}
const TextPressure: React.FC<TextPressureProps> = ({
  text = 'Compressa',
  fontFamily = 'Compressa VF',
  fontUrl = 'https://res.cloudinary.com/dr6lvwubh/raw/upload/v1529908256/CompressaPRO-GX.woff2',
  width = true,
  weight = true,
  italic = true,
  alpha = false,
  flex = true,
  stroke = false,
  scale = false,
  textColor = '#FFFFFF',
  strokeColor = '#FF0000',
  strokeWidth = 2,
  className = '',
  minFontSize = 24
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const spansRef = useRef<(HTMLSpanElement | null)[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const cursorRef = useRef({ x: 0, y: 0 });
  const [fontSize, setFontSize] = useState(minFontSize);
  const [scaleY, setScaleY] = useState(1);
  const [lineHeight, setLineHeight] = useState(1);
  const chars = text.split('');

  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  useLayoutEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { cursorRef.current.x = e.clientX; cursorRef.current.y = e.clientY; };
    const handleTouchMove = (e: TouchEvent) => { const t = e.touches[0]; cursorRef.current.x = t.clientX; cursorRef.current.y = t.clientY; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    if (containerRef.current) {
      const { left, top, width, height } = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = left + width / 2;
      mouseRef.current.y = top + height / 2;
      cursorRef.current.x = mouseRef.current.x;
      cursorRef.current.y = mouseRef.current.y;
    }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('touchmove', handleTouchMove); };
  }, []);

  const setSize = () => {
    if (!containerRef.current || !titleRef.current) return;
    const { width: containerW, height: containerH } = containerRef.current.getBoundingClientRect();
    let newFontSize = containerW / (chars.length / 2);
    newFontSize = Math.max(newFontSize, minFontSize);
    setFontSize(newFontSize);
    setScaleY(1);
    setLineHeight(1);
    requestAnimationFrame(() => {
      if (!titleRef.current) return;
      const textRect = titleRef.current.getBoundingClientRect();
      if (scale && textRect.height > 0) {
        const yRatio = containerH / textRect.height;
        setScaleY(yRatio);
        setLineHeight(yRatio);
      }
    });
  };

  useLayoutEffect(() => { setSize(); window.addEventListener('resize', setSize); return () => window.removeEventListener('resize', setSize); }, [scale, text]);

  useLayoutEffect(() => {
    let rafId: number;
    const animate = () => {
      mouseRef.current.x += (cursorRef.current.x - mouseRef.current.x) / 15;
      mouseRef.current.y += (cursorRef.current.y - mouseRef.current.y) / 15;
      if (titleRef.current) {
        const titleRect = titleRef.current.getBoundingClientRect();
        const maxDist = titleRect.width / 2;
        spansRef.current.forEach(span => {
          if (!span) return;
          const rect = span.getBoundingClientRect();
          const charCenter = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
          const d = dist(mouseRef.current, charCenter);
          const getAttr = (distance: number, minVal: number, maxVal: number) => {
            const val = maxVal - Math.abs((maxVal * distance) / maxDist);
            return Math.max(minVal, val + minVal);
          };
          const wdth = width ? Math.floor(getAttr(d, 5, 200)) : 100;
          const wght = weight ? Math.floor(getAttr(d, 100, 900)) : 400;
          const italVal = italic ? getAttr(d, 0, 1).toFixed(2) : '0';
          const alphaVal = alpha ? getAttr(d, 0, 1).toFixed(2) : '1';
          span.style.opacity = alphaVal;
          span.style.fontVariationSettings = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${italVal}`;
        });
      }
      rafId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(rafId);
  }, [width, weight, italic, alpha, chars.length]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-transparent">
      <style>{`
        @font-face { font-family: '${fontFamily}'; src: url('${fontUrl}'); font-style: normal; }
        .stroke span { position: relative; color: ${textColor}; }
        .stroke span::after { content: attr(data-char); position: absolute; left: 0; top: 0; color: transparent; z-index: -1; -webkit-text-stroke-width: ${strokeWidth}px; -webkit-text-stroke-color: ${strokeColor}; }
      `}</style>
      <h1 ref={titleRef} className={`text-pressure-title ${className} ${flex ? 'flex justify-between' : ''} ${stroke ? 'stroke' : ''} uppercase text-center`} style={{ fontFamily, fontSize: fontSize, lineHeight, transform: `scale(1, ${scaleY})`, transformOrigin: 'center top', margin: 0, fontWeight: 100, color: stroke ? undefined : textColor }}>
        {chars.map((char, i) => (
          <span key={i} ref={el => { spansRef.current[i] = el; }} data-char={char} className="inline-block">{char}</span>
        ))}
      </h1>
    </div>
  );
};

// --- 2. MAIN COMPONENT ---
export default function AboutPage() {
  const mainRef = useRef(null);
  
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      
      // Hero Parallax (Always active)
      gsap.to(".hero-img", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: { trigger: ".hero-section", start: "top top", end: "bottom top", scrub: true }
      });

      // --- MOBILE vs DESKTOP LOGIC ---
      const mm = gsap.matchMedia();

      // DESKTOP ONLY: Horizontal Scroll
      mm.add("(min-width: 768px)", () => {
          const races = document.querySelector(".races");
          if(races) {
            gsap.to(races, {
                x: () => -(races.scrollWidth - window.innerWidth),
                ease: "none",
                scrollTrigger: {
                    trigger: ".esposito-wrapper",
                    start: "top top",
                    end: () => `+=${races.scrollWidth - window.innerWidth}`,
                    pin: true,
                    scrub: 1,
                    invalidateOnRefresh: true,
                }
            });
          }
      });

      // --- ANIMATIONS THAT RUN ON BOTH ---
      // Marquee
      gsap.to(".marquee-text", {
        xPercent: -50,
        repeat: -1,
        duration: 20,
        ease: "linear"
      });

    }, mainRef);
    return () => ctx.revert();
  }, []);

  return (
    <main ref={mainRef} className="bg-[#050505] text-white overflow-x-hidden font-sans selection:bg-[#D52B1E] selection:text-white">
      
      {/* ===================================================
          1. HERO SECTION
         =================================================== */}
      <section className="hero-section relative h-screen flex items-center justify-center overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0 hero-img opacity-40">
           <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#050505] z-10"></div>
           <Image
             src="/img/g2.jpg" 
             alt="Hockey History" 
             className="w-full h-full object-cover  brightness-50"
             fill
           />
        </div>

        <div className="relative z-20 w-full max-w-[95vw] md:max-w-[85vw] flex flex-col items-center">
            <div className="mb-6 flex items-center gap-3">
                <div className="h-[1px] w-12 bg-[#D52B1E]"></div>
                <span className="text-xs font-mono uppercase tracking-[0.5em] text-white/60">My Story</span>
                <div className="h-[1px] w-12 bg-[#D52B1E]"></div>
            </div>
             
             <div className="w-full h-[18vh] md:h-[30vh]">
               <TextPressure 
                 text="THE ORIGIN" 
                 flex={true} 
                 alpha={false} 
                 stroke={false} 
                 width={true} 
                 weight={true} 
                 italic={false} 
                 textColor="#FFFFFF" 
                 minFontSize={50}
               />
             </div>
             
             <div className="mt-8 flex flex-col items-center gap-2">
                 <p className="text-neutral-400 text-sm md:text-xl font-light tracking-widest text-center uppercase">
                   From the <span className="text-[#D52B1E] font-bold">USSR</span> to the NHL Dream
                 </p>
             </div>
        </div>
      </section>

      {/* ===================================================
          2. THE ESPOSITO PARADOX 
          (Mobile: Vertical Stack | Desktop: Horizontal Scroll)
         =================================================== */}
      <div className="esposito-wrapper relative bg-[#111]">
        
        {/* Background Marquee */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full opacity-[0.03] pointer-events-none select-none overflow-hidden whitespace-nowrap hidden md:block">
            <div className="marquee-text text-[30vw] font-black leading-none uppercase">
                Dream Big • Work Hard • Esposito • Tretiak • Canada •
            </div>
        </div>

        <div className="races flex flex-col md:flex-row md:h-full md:w-[300vw] w-full h-auto">
            
            {/* --- PANEL 1: THE CATALYST (2014) --- */}
            <div className="panel w-full md:w-[100vw] h-auto md:h-screen flex items-center justify-center relative border-b md:border-b-0 md:border-r border-white/5 bg-[#0a0a0a] py-16 md:py-0 px-6 md:px-0">
                 <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    {/* Text Side */}
                    <div className="order-2 md:order-1 space-y-6 md:space-y-8">
                        <div className="inline-block px-4 py-2 border border-[#D52B1E] text-[#D52B1E] text-xs font-mono uppercase tracking-widest">
                            Chapter 01: The Encounter
                        </div>
                        <h2 className="text-4xl md:text-6xl font-bold uppercase leading-none">
                            2014.<br/>The Veterans<br/><span className="text-transparent stroke-text" style={{ WebkitTextStroke: '1px white' }}>Game.</span>
                        </h2>
                        <div className="text-base md:text-xl text-gray-400 font-light leading-relaxed space-y-4">
                            <p>
                            My dream to visit Canada began in 2014 when I participated in a hockey veterans game with <span className="text-white font-bold">Phil Esposito</span>. 
                            Many hockey fans already know about this legendary player, playing a career in the NHL and the Canadian National Team.
                            </p>
                            <p>
                            At the time I spoke no English at all, but I was eager to learn about the Canada-USSR Super Series firsthand. Chance and a bit of luck helped: In a few weeks I learned about this legendary guest from Canada and decided to prepare.
                            </p>
                        </div>
                    </div>
                    {/* Image Side - 9:16 Aspect Ratio */}
                    <div className="order-1 md:order-2 flex justify-center">
                        <div className="relative aspect-[9/16] w-full md:w-[360px] lg:w-[400px] overflow-hidden rounded-lg shadow-2xl group">
                            <div className="absolute inset-0 bg-[#D52B1E] mix-blend-multiply opacity-20 group-hover:opacity-0 transition-all duration-500 z-10"></div>
                            <Image
                                 src="/img/ab1.jpg"
                                 alt="Hockey Rink"
                                 fill
                                 className="object-cover scale-110 group-hover:scale-100 transition-transform duration-700"
                                 sizes="(max-width: 768px) 100vw, 400px"
                                 priority={false}
                            />
                        </div>
                    </div>
                 </div>
            </div>

            {/* --- PANEL 2: THE JERSEY & THE JOKE (REMOVED EMPTY IMAGE FIELD) --- */}
            <div className="panel w-full md:w-[100vw] h-auto md:h-screen flex items-center justify-center relative border-b md:border-b-0 md:border-r border-white/5 bg-[#0e0e0e] py-16 md:py-0 px-6 md:px-0">
                 <div className="w-full max-w-5xl mx-auto flex flex-col items-center text-center">
                    
                    <div className="mb-8">
                        <Quote className="text-[#D52B1E] w-16 h-16 opacity-80 mx-auto" />
                    </div>

                    <h3 className="text-3xl md:text-6xl font-light leading-tight mb-8">
                        He looked at my uniform... and jokingly said that maybe the <span className="font-black text-white">USSR national team</span> lacked a goalie like that.
                    </h3>
                    
                    <div className="h-px w-32 bg-white/20 my-8"></div>
                    
                    <p className="text-base md:text-xl text-gray-400 font-light leading-relaxed max-w-3xl">
                        I had ordered pant shells to help Esposito remember his youth and all the great hockey moments. The battles against the Soviet team, specifically <span className="text-white">Tretiak</span>, had been a huge challenge for Team Canada.
                    </p>
                 </div>
            </div>

             {/* --- PANEL 3: THE REALIZATION --- */}
             <div className="panel w-full md:w-[100vw] h-auto md:h-screen flex items-center justify-center relative bg-black py-24 md:py-0 px-6 md:px-0">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="w-full max-w-4xl text-center relative z-10">
                    <h2 className="text-4xl md:text-8xl font-black uppercase mb-8 ">
                        The <span className="text-[#D52B1E]">Paradigm</span> Shift
                    </h2>
                    <p className="text-lg md:text-3xl text-gray-300 font-light leading-relaxed mb-12">
                        With the help of an interpreter, I asked about Ken Dryden and Valery Kharlamov. At that moment I realized that I wanted to personally immerse myself in the atmosphere of North American hockey... To develop my hockey skills by learning from true masters of their craft.
                    </p>
                    <div className="flex flex-col md:flex-row gap-4 md:gap-8 justify-center items-center text-sm font-mono text-[#D52B1E] uppercase tracking-widest">
                         <div className="flex items-center gap-2">
                             <CheckCircle2 size={16} /> Learning English
                         </div>
                         <div className="flex items-center gap-2">
                             <CheckCircle2 size={16} /> Immersion
                         </div>
                         <div className="flex items-center gap-2">
                             <CheckCircle2 size={16} /> Mastery
                         </div>
                    </div>
                </div>
             </div>

        </div>
      </div>


      {/* ===================================================
          3. MYSHKIN SECTION (High Contrast)
         =================================================== */}
      <section className="relative py-24 md:py-32 bg-[#080808] border-t border-white/10 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-[#0039A6]/10 to-transparent pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center relative z-10">
            <div className="relative group order-2 lg:order-1">
                 {/* Floating Image Effect */}
                 <div className="relative aspect-[4/5] overflow-hidden rounded-sm  transition-all duration-700 ease-out border-2 border-white/5 group-hover:border-[#D52B1E]/50">
                    <Image 
                      src="/img/g2.jpg"
                      alt="Hockey Rink"
                      fill
                      className="object-cover scale-110 group-hover:scale-100 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={false}
                    />
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent p-8 pt-20">
                        <p className="text-white font-bold text-lg">Vladimir Semenovich Myshkin</p>
                        <p className="text-[#D52B1E] text-sm uppercase tracking-wider">Idol & Mentor</p>
                    </div>
                 </div>
            </div>

            <div className="space-y-8 md:space-y-10 order-1 lg:order-2">
                <div>
                    <h2 className="text-5xl md:text-7xl font-black uppercase leading-[0.9]  text-white">
                        The Power of <br/>
                        <span className="text-[#0039A6]">Patience</span>
                    </h2>
                </div>

                <div className="pl-6 border-l-4 border-[#0039A6] space-y-6">
                    <p className="text-xl md:text-2xl text-white leading-tight font-light italic">
                         It&apos;s very hard to get on the ice when he&apos;s the best goaltender in the world! But I did not stop working.
                    </p>
                    <p className="text-base md:text-lg text-gray-400 leading-relaxed">
                        Myshkin, who was Tretiak&apos;s backup, continued waiting for his chance. It came in <span className="text-white font-bold">1979 at the Challenge Cup</span> against the NHL All-Stars. Unexpectedly given the start, Myshkin did not disappoint, shutting out some of the world&apos;s best.
                    </p>
                </div>
                
                <div className="bg-[#111] p-6 rounded-lg border border-white/10">
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                        The legendary goalie is credited with winning the Olympics, European and World Championships, as well as the Canada Cup. His story inspires us to never give up on our dream because the result will always come!
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Trophy size={20} className="text-[#FFD700]" />
                        <span className="text-xs uppercase tracking-widest text-white/50">Olympics • World Champ • Canada Cup</span>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* ===================================================
          4. PROCESS SECTION (NEW "TACTICAL PLAYBOOK" DESIGN)
         =================================================== */}
      <section className="relative bg-[#050505] pt-24 pb-32">
          {/* Section Header */}
          <div className="container mx-auto px-6 mb-20">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/10 pb-8">
                <div>
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-[#D52B1E] rounded-full animate-pulse"></div>
                        <span className="text-xs font-mono uppercase text-[#D52B1E]">RGA Methodology</span>
                    </div>
                    <h2 className="text-4xl md:text-7xl font-black uppercase  text-white">
                        The <span className="text-white" style={{ WebkitTextStroke: '1px white'}}>Playbook</span>
                    </h2>
                </div>
                <p className="max-w-md text-gray-400 font-light text-sm md:text-base">
                    Founded on European and North American knowledge. We tailor a suitable developmental pace for each goaltender.
                </p>
              </div>
          </div>

          {/* NEW GRID DESIGN: "The Tactical Board" */}
          <div className="container mx-auto px-4 md:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  
                  {/* Step 1 */}
                  <div className="group relative bg-[#111] hover:bg-[#161616] border border-white/10 p-8 md:p-12 transition-all duration-300">
                      <div className="flex justify-between items-start mb-8">
                          <span className="text-5xl font-black text-[#222] group-hover:text-white/20 transition-colors">01</span>
                          <div className="bg-[#D52B1E]/10 p-3 rounded-full text-[#D52B1E]">
                              <Users size={24} />
                          </div>
                      </div>
                      <h3 className="text-2xl font-bold uppercase text-white mb-4 flex items-center gap-2">
                          Sign Up <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-[#D52B1E]" />
                      </h3>
                      <p className="text-gray-400 font-light leading-relaxed">
                          You sign up for a training session. Please leave a request or contact us using the page. Simple, direct, and secure.
                      </p>
                  </div>

                  {/* Step 2 */}
                  <div className="group relative bg-[#111] hover:bg-[#161616] border border-white/10 p-8 md:p-12 transition-all duration-300">
                      <div className="flex justify-between items-start mb-8">
                          <span className="text-5xl font-black text-[#222] group-hover:text-white/20 transition-colors">02</span>
                          <div className="bg-[#D52B1E]/10 p-3 rounded-full text-[#D52B1E]">
                              <MapPin size={24} />
                          </div>
                      </div>
                      <h3 className="text-2xl font-bold uppercase text-white mb-4 flex items-center gap-2">
                          Coordinates <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-[#D52B1E]" />
                      </h3>
                      <p className="text-gray-400 font-light leading-relaxed">
                          We agree on a training location. We can either arrange to have a session at a rink near you or come to your team&apos;s practice.
                      </p>
                  </div>

                  {/* Step 3 */}
                  <div className="group relative bg-[#111] hover:bg-[#161616] border border-white/10 p-8 md:p-12 transition-all duration-300">
                      <div className="flex justify-between items-start mb-8">
                          <span className="text-5xl font-black text-[#222] group-hover:text-white/20 transition-colors">03</span>
                          <div className="bg-[#D52B1E]/10 p-3 rounded-full text-[#D52B1E]">
                              <Play size={24} />
                          </div>
                      </div>
                      <h3 className="text-2xl font-bold uppercase text-white mb-4 flex items-center gap-2">
                          The Session <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-[#D52B1E]" />
                      </h3>
                      <p className="text-gray-400 font-light leading-relaxed">
                          We sharpen your skills and help you improve your technique. Intense focus on mechanics and game-situation reads.
                      </p>
                  </div>

                  {/* Step 4 */}
                  <div className="group relative bg-[#D52B1E] border border-[#D52B1E] p-8 md:p-12 transition-all duration-300">
                      <div className="flex justify-between items-start mb-8">
                          <span className="text-5xl font-black text-black/20 group-hover:text-black/40 transition-colors">04</span>
                          <div className="bg-white p-3 rounded-full text-[#D52B1E]">
                              <Check size={24} />
                          </div>
                      </div>
                      <h3 className="text-2xl font-bold uppercase text-white mb-4">
                          Custom Plan
                      </h3>
                      <p className="text-white/90 font-light leading-relaxed">
                          We make a training based on your needs and practice accordingly. Convenience for parents and rapid development for athletes.
                      </p>
                  </div>

              </div>
              
          </div>
           <Footer/>
      </section>

      {/* Global Style Overrides */}
      <style jsx global>{`
        .text-pressure-title { width: 100%; }
        /* Hide scrollbar for the horizontal section */
        .races {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .races::-webkit-scrollbar {
            display: none;
        }
      `}</style>
    </main>
  );
}