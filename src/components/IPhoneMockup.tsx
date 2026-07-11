import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal, Sun, Moon } from 'lucide-react';

interface IPhoneMockupProps {
  children: React.ReactNode;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function IPhoneMockup({ children, isDarkMode, toggleDarkMode }: IPhoneMockupProps) {
  const [time, setTime] = useState('');

  // Clock mechanism
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      // Format 24-hour style or standard standard 12-hour
      const formattedTime = `${hours}:${minutes}`;
      setTime(formattedTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full md:py-10 flex items-center justify-center bg-[#F5F5F7] dark:bg-[#0F0F11] text-black dark:text-white transition-colors duration-200 p-0 md:px-4">
      {/* Physical buttons on left and right for desktop */}
      <div className="relative flex items-center justify-center">
        {/* Silent Switch - Left */}
        <div className="hidden md:block absolute left-[-15px] top-[100px] w-[3px] h-[30px] bg-neutral-700 dark:bg-neutral-800 rounded-l" />
        {/* Volume Up - Left */}
        <div className="hidden md:block absolute left-[-15px] top-[150px] w-[3px] h-[50px] bg-neutral-700 dark:bg-neutral-800 rounded-l" />
        {/* Volume Down - Left */}
        <div className="hidden md:block absolute left-[-15px] top-[215px] w-[3px] h-[50px] bg-neutral-700 dark:bg-neutral-800 rounded-l" />
        {/* Power Button - Right */}
        <div className="hidden md:block absolute right-[-15px] top-[175px] w-[3px] h-[75px] bg-neutral-700 dark:bg-neutral-800 rounded-r" />

        {/* iPhone Outer Chassis */}
        <div
          id="iphone-chassis"
          className="relative w-full md:w-[390px] h-screen md:h-[844px] bg-[#F2F2F7] dark:bg-black md:rounded-[48px] md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.45)] md:border-[12px] md:border-neutral-900 md:ring-4 md:ring-neutral-800 overflow-hidden flex flex-col transition-colors duration-200"
        >
          {/* Top Notch Area (Dynamic Island) - Desktop Only */}
          <div className="hidden md:block absolute top-[11px] left-1/2 -translate-x-1/2 w-[110px] h-[30px] bg-black rounded-3xl z-50 flex items-center justify-center shadow-inner">
            <div className="w-3.5 h-3.5 rounded-full bg-[#111115] border border-neutral-900/30 ml-auto mr-4 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-900/20" />
            </div>
          </div>

          {/* iOS System Status Bar - Desktop Only */}
          <div className="hidden md:flex justify-between items-center px-6 pt-3 pb-2 bg-transparent text-black dark:text-white shrink-0 z-40 text-xs font-semibold select-none">
            {/* Time */}
            <span className="tracking-tight text-[14px] font-medium pl-1">{time || '9:41'}</span>

            {/* Spacer for Dynamic Island */}
            <div className="w-[110px]" />

            {/* Icons */}
            <div className="flex items-center gap-1.5 pr-1">
              <Signal size={14} strokeWidth={2.5} />
              <Wifi size={14} strokeWidth={2.5} />
              <div className="flex items-center gap-0.5">
                <span className="text-[10px]">100%</span>
                <Battery size={16} strokeWidth={2.5} className="rotate-0 text-black dark:text-white" />
              </div>
            </div>
          </div>

          {/* Quick manual theme control widget - Desktop Only */}
          <div className="hidden md:flex absolute right-4 top-[50px] z-30">
            <button
              onClick={toggleDarkMode}
              className="p-1.5 rounded-full bg-white/85 dark:bg-neutral-800/85 backdrop-blur-md shadow-sm border border-neutral-200/40 dark:border-neutral-700/40 hover:scale-105 active:scale-95 transition-all text-neutral-700 dark:text-neutral-200"
              title={isDarkMode ? 'Chuyển sang Chế độ sáng' : 'Chuyển sang Chế độ tối'}
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>

          {/* Main App Content Container */}
          <div className="flex-1 overflow-hidden relative flex flex-col">
            {children}
          </div>

          {/* iOS Home Indicator Bar - Desktop Only */}
          <div className="hidden md:block absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[125px] h-[4.5px] bg-neutral-900 dark:bg-neutral-200/60 rounded-full z-40 opacity-60 hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Floating Theme Switcher for Mobile Layout (only visible below md) */}
      <button
        onClick={toggleDarkMode}
        className="md:hidden fixed bottom-6 right-6 p-4 rounded-full bg-ios-accent text-white shadow-xl hover:scale-105 active:scale-95 transition-all z-50 flex items-center justify-center"
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </div>
  );
}
