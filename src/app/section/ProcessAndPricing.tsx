'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '../lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Check, MapPin, Activity, ArrowRight, Zap, Users, Star, Calendar, Loader } from 'lucide-react';
import Copy from '../components/Copy';

// Matches your Admin definition
interface PackageData {
  id?: string;
  name: string;
  price: number;
  price5: number;
  price10: number;
  peopleCount: number; // Used for dynamic tagging
  maxQuantity: number;
}

export default function CinematicPricing() {
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH REAL DATA ONLY ---
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const pkgCollection = collection(db, 'packages');
        // Order by the 'order' field we set in Admin, or fallback to price
        const q = query(pkgCollection, orderBy('order', 'asc')); 
        const querySnapshot = await getDocs(q);
        
        const data = querySnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        } as PackageData));
        
        setPackages(data);
      } catch (error) {
        console.error("Error fetching packages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  // --- LIMIT TO 3 ITEMS ---
  const displayPackages = packages.slice(0, 3);

  return (
    <section className="relative min-h-screen bg-[#000000] text-white font-sans overflow-hidden py-24 md:py-32 md:pb-0 selection:bg-[#D52B1E] selection:text-white border-t border-white/20" id='price'>
      
      {/* Background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vw] h-[800px] bg-[radial-gradient(circle_at_top,rgba(133,80,80,0.15)_0%,transparent_70%)] blur-[60px]"></div>
          <div className="absolute top-[20%] right-[-10%] w-[800px] h-[800px] bg-[#0c1320] opacity-[0.08] blur-[150px] rounded-full"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-[#180e0d] opacity-[1] blur-[150px] rounded-full"></div>
          <div className="absolute inset-0 opacity-[0.15] bg-[url('https://www.transparenttextures.com/patterns/scratch-pad.png')] mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6">
        
        {/* HEADER */}
        <div className="text-center mb-12 relative">
            <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 px-6 py-2 rounded-full backdrop-blur-md mb-8 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <Star size={14} className="text-[#D52B1E] fill-[#D52B1E]" />
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-white">Elite Training Rates</span>
                <Star size={14} className="text-[#0039A6] fill-[#0039A6]" />
            </div>
            
            <div className="mb-2">
                <Copy>
                    <h2 className="text-7xl md:text-[10rem] font-black uppercase drop-shadow-2xl leading-[0.85]">
                        Price <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">List</span>
                    </h2>
                </Copy>
            </div>
        </div>

        <div className="text-center mb-10">
            <p className="inline-block text-white/90 font-bold uppercase tracking-[0.25em] text-sm border-b border-[#D52B1E] pb-2">
                <span className="text-[#D52B1E] mr-2">•</span> 
                HST (13%) Applied to all prices 
                <span className="text-[#D52B1E] ml-2">•</span>
            </p>
        </div>

        {/* ==================== PRICING CARDS (REAL DATA) ==================== */}
        {loading ? (
             <div className="flex justify-center py-20"><Loader className="animate-spin text-[#D52B1E]" size={40} /></div>
        ) : packages.length === 0 ? (
             <div className="text-center py-20 bg-white/5 border border-white/10 rounded-xl">
                 <p className="text-gray-500 font-mono uppercase tracking-widest text-sm">No packages currently available.</p>
                 <Link href="/admin" className="text-[#D52B1E] text-xs underline mt-2 inline-block hover:text-white">Admin: Create Packages</Link>
             </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 relative items-start">
                {displayPackages.map((pkg, index) => (
                    <DynamicPricingCard key={pkg.id || index} pkg={pkg} index={index} />
                ))}
            </div>
        )}

        {/* ==================== SEE ALL BUTTON ==================== */}
        {packages.length > 0 && (
            <div className="flex justify-center mb-24 relative z-20">
                <Link 
                    href="/book" 
                    className="group relative px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-[#D52B1E] hover:text-white transition-all duration-300 skew-x-[-10deg]"
                >
                    <div className="absolute inset-0 border border-white/20 skew-x-[10deg] scale-105 opacity-0 group-hover:opacity-100 transition-all"></div>
                    <span className="flex items-center gap-3 skew-x-[10deg]">
                        View All Packages & Availability <ArrowRight size={16} />
                    </span>
                </Link>
            </div>
        )}

        {/* ==================== PROCESS SECTION ==================== */}
        <div className="text-center mb-32 relative z-20">
            <p className="text-gray-400 font-mono text-sm uppercase tracking-widest bg-black/50 inline-block px-8 py-4 rounded border border-white/10 backdrop-blur-sm">
                ⚠️ Note: All prices are exclusive of HST • Ice rental fees are paid separately
            </p>
        </div>

        <div className="bg-[#000000] border border-white/10 rounded-[3rem] p-8 md:p-16 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex flex-col md:flex-row gap-12 items-start">
                    <div className="md:w-1/3">
                        <Copy>
                            <h3 className="text-6xl md:text-7xl font-normal uppercase mb-6 ">
                                The <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D52B1E] to-[#0039A6]">Protocol</span>
                            </h3>
                        </Copy>
                        <Copy delay={0.2}>
                            <p className="text-gray-400 text-lg font-light leading-relaxed max-w-sm">
                                A seamless path from registration to on-ice dominance. System designed for efficiency.
                            </p>
                        </Copy>
                    </div>

                    <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ProcessCard num="01" title="Sign Up" desc="Contact us via the booking form to secure your spot." icon={<Check size={20} />} />
                        <ProcessCard num="02" title="Location" desc="We deploy to a rink near you or attend your team practice." icon={<MapPin size={20} />} />
                        <ProcessCard num="03" title="Session" desc="Intense technical refinement and drill execution." icon={<Activity size={20} />} />
                        <ProcessCard num="04" title="Custom Plan" desc="Long-term development strategy based on your data." icon={<Calendar size={20} />} />
                    </div>
                </div>
            </div>
        </div>

      </div>
    </section>
  );
}

// --- SUB-COMPONENTS ---

const DynamicPricingCard = ({ pkg, index }: { pkg: PackageData, index: number }) => {
    
    // Determine Tagline based on REAL data (peopleCount)
    // If peopleCount is 1 -> "Private Focus". If > 1 -> "Group of X"
    const dynamicTagline = pkg.peopleCount === 1 
        ? "Private Focus" 
        : `Group of ${pkg.peopleCount}`;

    // STYLES CONFIGURATION (Cyclical: Red -> Blue -> White)
    const styles = [
        // Index 0: RED
        {
            borderColor: 'hover:border-[#D52B1E]',
            gradient: 'from-transparent via-[#D52B1E] to-transparent',
            iconBg: 'bg-[#D52B1E]',
            iconColor: 'text-white',
            shadow: 'shadow-[0_0_20px_rgba(213,43,30,0.4)]',
            btnBg: 'bg-[#1a1a1a] hover:bg-[#D52B1E]',
            activeText: 'text-[#D52B1E]',
            Icon: Zap,
            isHero: false
        },
        // Index 1: BLUE (Hero)
        {
            borderColor: 'border-[#0039A6]',
            gradient: 'from-transparent via-[#0039A6] to-transparent',
            iconBg: 'bg-[#0039A6]',
            iconColor: 'text-white',
            shadow: 'shadow-[0_0_20px_rgba(0,57,166,0.4)]',
            btnBg: 'bg-[#0039A6] text-white hover:bg-white hover:text-[#0039A6]',
            activeText: 'text-[#0039A6]',
            Icon: Users,
            isHero: true
        },
        // Index 2: WHITE
        {
            borderColor: 'hover:border-white',
            gradient: 'from-transparent via-white to-transparent',
            iconBg: 'bg-white/10 border border-white/20',
            iconColor: 'text-white',
            shadow: '',
            btnBg: 'bg-[#1a1a1a] hover:bg-white hover:text-black',
            activeText: 'text-white',
            Icon: Activity,
            isHero: false
        }
    ];

    const style = styles[index % 3]; 
    const isHero = index === 1; // 2nd card is always the "Hero" visually

    return (
        <div className={`group relative bg-[#111] border ${isHero ? 'border-2' : 'border'} ${isHero ? style.borderColor : 'border-[#333]'} rounded-[2rem] p-1 overflow-hidden ${style.borderColor} transition-colors duration-500 shadow-2xl ${isHero ? 'transform lg:-translate-y-6 shadow-[0_0_50px_rgba(0,57,166,0.15)] z-20' : ''}`}>
            
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${style.gradient} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
            
            {/* Tagline Badge */}
            {isHero && <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#0039A6] text-white text-xs font-black uppercase tracking-widest px-6 py-2 rounded-b-xl z-20 shadow-lg">Most Popular</div>}

            <div className="bg-[#080808] rounded-[1.8rem] p-8 md:p-10 h-full relative z-10 flex flex-col">
                <div className="flex-grow">
                    <div className="flex justify-between items-start mb-8 mt-2">
                        <div className={`p-4 rounded-2xl ${style.iconBg} ${style.iconColor} ${style.shadow}`}>
                            <style.Icon size={28} fill="currentColor" />
                        </div>
                        <div className="text-right">
                            <h3 className="text-2xl font-black uppercase italic text-white leading-tight">{pkg.name}</h3>
                            <p className={`${index === 1 ? 'text-[#0039A6]' : index === 0 ? 'text-[#D52B1E]' : 'text-gray-400'} font-bold uppercase text-xs tracking-widest mt-1`}>
                                {dynamicTagline}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6 mb-12">
                        <PriceItem label="1 Session" price={pkg.price} />
                        {pkg.price5 > 0 && <PriceItem label="5 Sessions" price={pkg.price5} sub="/session" />}
                        {pkg.price10 > 0 && <PriceItem label="10 Sessions" price={pkg.price10} sub="/session" activeColor={style.activeText} />}
                    </div>
                </div>
                
                <Link href="/book" className={`w-full mt-auto py-4 border border-transparent rounded-xl uppercase font-black tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${style.btnBg}`}>
                    Select Plan <ArrowRight size={18} />
                </Link>
            </div>
        </div>
    );
};

// 2. HELPER COMPONENTS
interface PriceItemProps {
  label: string;
  price: string | number;
  sub?: string;
  activeColor?: string;
}

const PriceItem: React.FC<PriceItemProps> = ({ label, price, sub, activeColor = "text-white" }) => (
    <div className="flex justify-between items-end border-b border-white/10 pb-4 last:border-0 hover:border-white/30 transition-colors">
        <span className="font-mono text-sm text-gray-400 uppercase font-bold">{label}</span>
        <div className="text-right leading-none">
            <span className={`text-3xl font-black ${activeColor}`}>${price}</span>
            {sub && <span className="text-[10px] text-gray-500 uppercase font-bold ml-1">{sub}</span>}
        </div>
    </div>
);

interface ProcessCardProps {
  num: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}

const ProcessCard: React.FC<ProcessCardProps> = ({ num, title, desc, icon }) => (
    <div className="bg-[#111] hover:bg-[#1a1a1a] p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-300 group">
        <div className="flex justify-between items-start mb-4">
            <span className="text-3xl font-black text-white/10 group-hover:text-white/40">{num}</span>
            <div className="text-white opacity-50 group-hover:opacity-100 group-hover:text-[#D52B1E] transition-all">
                {icon}
            </div>
        </div>
        <h4 className="text-lg font-black uppercase mb-2">{title}</h4>
        <p className="text-sm text-gray-400">{desc}</p>
    </div>
);