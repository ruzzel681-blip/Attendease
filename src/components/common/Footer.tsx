import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-stone-200/80 dark:border-stone-800/90 bg-white/80 dark:bg-[#0A0B0E]/80 backdrop-blur-md py-4 transition-colors mt-auto text-xs text-stone-500 dark:text-stone-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="font-semibold italic font-display text-stone-800 dark:text-stone-200">AttendEase</span>
          <span>•</span>
          <span>Student Attendance System</span>
        </div>

        <div className="flex items-center space-x-2 text-stone-500 dark:text-stone-400 font-mono text-[11px]">
          <span>Made by Team Cedric</span>
        </div>
      </div>
    </footer>
  );
};
