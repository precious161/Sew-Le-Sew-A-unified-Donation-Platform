
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#0b1121] py-16 px-6 md:px-20 border-t border-white/5 w-full mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-center md:text-left">
          <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Developed by</p>
          <p className="text-sm font-black text-white/80 tracking-tight italic">
            Feyruza Dawud • Hanan Mohammed • Hawi Yasin
          </p>
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-medical-red opacity-40">
          © 2026 Sew le Sew Network
        </p>
      </div>
    </footer>
  );
};

export default Footer;