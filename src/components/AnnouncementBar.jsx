import React from 'react';
import { AlertTriangle } from 'lucide-react';
import paymelogo from '../../payme.svg';
import clicklogo from '../../clicklogo.svg';
import xaznalogo from '../../xazna.png';

const AnnouncementBar = () => {
  // Matnni bir necha marta takrorlaymiz — uzluksiz (seamless) aylanish uchun
  const items = Array.from({ length: 4 });

  const Message = () => (
    <span className="mx-8 inline-flex shrink-0 items-center gap-2 text-sm font-semibold tracking-wide whitespace-nowrap">
      <AlertTriangle size={16} className="text-[#f5b706] shrink-0" />
      <span className="text-white">Payments are accepted</span>
      <span className="text-[#f5b706] font-extrabold">ONLY</span>
      <span className="text-white">via</span>
      <img src={paymelogo} alt="Payme" className="h-5 w-auto" />
      <span className="text-white">—</span>
      <img src={clicklogo} alt="Click" className="h-5 w-auto rounded bg-white/80 px-1.5 py-0.5 opacity-50 grayscale" />
      <img src={xaznalogo} alt="Xazna" className="h-5 w-auto rounded bg-white/80 px-1.5 py-0.5 opacity-50 grayscale" />
      <span className="text-white/80">no longer available.</span>
    </span>
  );

  return (
    <div className="announcement-bar sticky top-0 z-[60] w-full h-11 flex items-center overflow-hidden bg-gradient-to-r from-[#012f5f] via-[#024890] to-[#012f5f] text-white shadow-md border-b border-white/10">
      {/* Marquee matn */}
      <div className="animate-marquee">
        {items.map((_, i) => (
          <Message key={i} />
        ))}
      </div>
    </div>
  );
};

export default AnnouncementBar;
