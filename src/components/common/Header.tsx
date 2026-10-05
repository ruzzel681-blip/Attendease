import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LogOut, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Clock, 
  UserCog,
  Compass
} from 'lucide-react';
import { AvatarDisplay } from './AvatarDisplay';
import { ProfileEditModal } from '../profile/ProfileEditModal';

export const Header: React.FC = () => {
  const { userProfile, logout, theme, toggleTheme } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const timer = setInterval(update, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 dark:border-stone-800/90 bg-white/95 dark:bg-[#0E1015]/95 backdrop-blur-md transition-colors">
      {/* Top micro-line accent */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-stone-400/30 dark:via-white/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* Brand & Academic Crest */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          <div className="relative group cursor-pointer shrink-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700/90 flex items-center justify-center text-stone-900 dark:text-white shadow-xs group-hover:border-stone-500 dark:group-hover:border-stone-400 transition-all">
              <Compass className="h-4 w-4 sm:h-5 sm:w-5 stroke-[1.75]" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0E1015]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-display font-bold italic text-base sm:text-xl tracking-tight text-stone-900 dark:text-stone-100 truncate">
                AttendEase
              </span>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-md bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                Team Cedric
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-[10px] text-stone-500 dark:text-stone-400 font-mono truncate">
              <span className="truncate">Portal</span>
              <span className="text-stone-300 dark:text-stone-700">•</span>
              <span className="text-stone-700 dark:text-stone-300 font-medium shrink-0">{currentTime || 'LIVE'}</span>
            </div>
          </div>
        </div>

        {/* Right Section: Theme / Profile / Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          
          {/* Theme Switcher Dial */}
          <button
            onClick={toggleTheme}
            id="theme-toggle-btn"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            className="p-2 sm:p-2.5 rounded-xl text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-850 transition-all cursor-pointer shadow-2xs shrink-0"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4 text-stone-700 hover:text-stone-950 transition-colors" />
            ) : (
              <Sun className="h-4 w-4 text-stone-200 hover:text-white" />
            )}
          </button>

          {/* User Logged In Info */}
          {userProfile && (
            <div className="flex items-center space-x-1.5 sm:space-x-2 pl-1.5 sm:pl-3 border-l border-stone-200 dark:border-stone-800 shrink-0">
              
              {/* Profile Card / Avatar (Clicking opens Edit Profile) */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                title="Open Profile Settings"
                className="flex items-center space-x-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 transition-all shadow-2xs cursor-pointer shrink-0"
              >
                <AvatarDisplay avatarId={userProfile.avatar} name={userProfile.name} size="sm" />
                
                <div className="text-left hidden md:block">
                  <p className="text-xs font-heading font-bold text-stone-900 dark:text-stone-100 leading-tight truncate max-w-[120px] lg:max-w-[160px]">
                    {userProfile.name}
                  </p>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">
                      {userProfile.userCode}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                      {userProfile.role}
                    </span>
                  </div>
                </div>
              </button>

              {/* Status Indicator (Desktop only) */}
              <div className="hidden lg:flex items-center">
                {userProfile.status === 'approved' ? (
                  <span className="inline-flex items-center text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] font-mono font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 bg-stone-500/10 px-2.5 py-1 rounded-lg border border-stone-500/20">
                    <Clock className="h-3 w-3 mr-1" /> Pending
                  </span>
                )}
              </div>

              {/* Edit Profile Button (Desktop only, since avatar is clickable) */}
              <button
                onClick={() => setIsProfileModalOpen(true)}
                id="header-edit-profile-btn"
                title="Edit Profile"
                className="hidden sm:flex p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-all cursor-pointer shrink-0"
              >
                <UserCog className="h-4 w-4" />
              </button>

              {/* Sign Out Button (Compact on mobile) */}
              <button
                onClick={logout}
                id="header-logout-btn"
                title="Sign Out"
                className="p-2 sm:px-3 sm:py-1.5 text-xs font-mono font-bold tracking-wider uppercase text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-800 rounded-xl border border-stone-200 dark:border-stone-800 transition-all cursor-pointer shadow-2xs shrink-0 flex items-center space-x-1.5"
              >
                <LogOut className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Profile & Avatar Edit Modal */}
      {isProfileModalOpen && userProfile && (
        <ProfileEditModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
    </header>
  );
};
