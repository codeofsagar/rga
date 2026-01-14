'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Mail, Phone, Instagram, Facebook, ArrowUpRight, MapPin, Globe } from 'lucide-react';

export default function FounderCTA() {
  return (
    <section className="relative w-full bg-[#050505] text-white overflow-hidden py-20 md:py-32 border-t border-white/10" id="contact">
      
      {/* --- BACKGROUND ACCENTS --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
          {/* Subtle Glows */}
          <div className="absolute top-1/2 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-[#0039A6] opacity-[0.04] blur-[120px] rounded-full -translate-y-1/2"></div>
          <div className="absolute top-1/2 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-[#D52B1E] opacity-[0.04] blur-[120px] rounded-full -translate-y-1/2"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-6">
        
        {/* ==================== MAIN CARD CONTAINER ==================== */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative shadow-2xl">
            
            {/* Decorative Top Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D52B1E] via-transparent to-[#0039A6] opacity-50"></div>

            <div className="grid grid-cols-1 lg:grid-cols-2">

                {/* --- LEFT: IDENTITY & MISSION --- */}
                <div className="p-8 md:p-16 border-b lg:border-b-0 lg:border-r border-white/10 relative">
                    <div className="flex flex-col justify-between h-full space-y-10">
                        
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-[#D52B1E] mb-6">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D52B1E] animate-pulse"></span>
                                Direct Access
                            </div>
                            <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
                                Nariman <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">Volkov</span>
                            </h2>
                            <p className="text-gray-400 text-base md:text-lg max-w-md font-light leading-relaxed">
                                Founder of <strong className="text-white">RGA Goaltending</strong>. Bringing elite Russian goaltending discipline and technical precision to the Canadian crease since 2014.
                            </p>
                        </div>

                        {/* Location Badge */}
                        <div className="flex flex-col md:flex-row md:items-center gap-4 text-sm font-mono text-gray-500">
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-[#0039A6]" />
                                <span>Toronto, ON</span>
                            </div>
                            <div className="hidden md:block w-1 h-1 bg-gray-700 rounded-full"></div>
                            <div className="flex items-center gap-2">
                                <Globe size={16} className="text-[#0039A6]" />
                                <span>Global Remote Support</span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* --- RIGHT: ACTION GRID --- */}
                <div className="p-8 md:p-16 bg-[#080808]">
                    <div className="grid grid-cols-1 gap-4 h-full">
                        
                        {/* PHONE CARD */}
                        <ContactCard 
                            href="tel:4388559083"
                            icon={<Phone size={24} />}
                            label="Direct Line"
                            value="438-855-9083"
                            accentColor="group-hover:text-[#D52B1E]"
                            borderColor="group-hover:border-[#D52B1E]"
                        />

                        {/* EMAIL CARD */}
                        <ContactCard 
                            href="mailto:narimanvolkov@gmail.com"
                            icon={<Mail size={24} />}
                            label="Email Inquiries"
                            value="narimanvolkov@gmail.com"
                            accentColor="group-hover:text-[#0039A6]"
                            borderColor="group-hover:border-[#0039A6]"
                        />

                        {/* SOCIALS ROW */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <SocialCard 
                                icon={<Instagram size={20} />} 
                                label="Instagram" 
                                handle="@rga_goalies" 
                                href="https://www.instagram.com/rga_goalies?igsh=MXg4YmRxaDVnbzVkaA=="
                            />
                            <SocialCard 
                                icon={<Facebook size={20} />} 
                                label="Facebook" 
                                handle="RGA Goaltending" 
                                href="#"
                            />
                        </div>

                    </div>
                </div>

            </div>
        </div>

      </div>
    </section>
  );
}

// --- SUB-COMPONENTS WITH TYPES ---

interface ContactCardProps {
    href: string;
    icon: ReactNode;
    label: string;
    value: string;
    accentColor: string;
    borderColor: string;
}

const ContactCard = ({ href, icon, label, value, accentColor, borderColor }: ContactCardProps) => (
    <Link href={href} className={`group relative p-6 bg-[#111] border border-white/5 rounded-2xl flex items-center justify-between transition-all duration-300 ${borderColor} hover:bg-[#161616]`}>
        <div className="flex items-center gap-5 overflow-hidden">
            <div className={`p-4 bg-black rounded-xl text-gray-400 border border-white/5 transition-colors flex-shrink-0 ${accentColor}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{label}</span>
                <span className="block text-lg md:text-xl font-mono text-white tracking-tight truncate">{value}</span>
            </div>
        </div>
        <ArrowUpRight className={`text-gray-600 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 ${accentColor} flex-shrink-0`} />
    </Link>
);

interface SocialCardProps {
    icon: ReactNode;
    label: string;
    handle: string;
    href: string;
}

const SocialCard = ({ icon, label, handle, href }: SocialCardProps) => (
    <Link href={href} target="_blank" rel="noopener noreferrer" className="group p-6 bg-[#111] border border-white/5 rounded-2xl flex flex-col justify-between hover:border-white/20 transition-all hover:bg-[#161616]">
        <div className="flex justify-between items-start mb-4">
            <div className="text-gray-400 group-hover:text-white transition-colors">{icon}</div>
            <ArrowUpRight size={16} className="text-gray-600 group-hover:text-white transition-all opacity-0 group-hover:opacity-100" />
        </div>
        <div>
            <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold">{label}</span>
            <span className="text-sm text-white font-medium">{handle}</span>
        </div>
    </Link>
);