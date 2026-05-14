import React from 'react';

const Hero = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-[#F8F9FA] dark:bg-[#111C44] transition-colors duration-500 pt-20">
      <div className="relative z-10 text-center px-6 max-w-5xl">
          <h1 className="text-[90px] md:text-[150px] text-[#111C44] dark:text-white tracking-[-0.05em] leading-[0.8] mb-10 select-none drop-shadow-2xl transition-colors">
            Sew<span className="text-medical-red font-thin italic px-4">le</span>Sew
          </h1>
          <div className="flex items-center justify-center gap-6 mb-12 opacity-80">
            <div className="h-[1px] w-12 bg-gray-300 dark:bg-white/20"></div>
            <h2 className="text-[#1B2559] dark:text-white font-bold text-sm md:text-lg uppercase tracking-[0.8em]">Save a Life. Give Hope.</h2>
            <div className="h-[1px] w-12 bg-gray-300 dark:bg-white/20"></div>
          </div>
          <p className="text-gray-500 dark:text-white/40 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed italic border-l-2 border-medical-red/30 pl-8 transition-colors">
            "A unified healthcare ecosystem bridging the gap between donors and patients through AI-driven intelligence."
          </p>
      </div>
    </section>
  );
};

export default Hero;