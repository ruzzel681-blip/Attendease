import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Clock, 
  ShieldAlert, 
  RefreshCw, 
  LogOut, 
  Compass,
  FileCheck2
} from 'lucide-react';

export const PendingApprovalState: React.FC = () => {
  const { userProfile, logout, showToast } = useAuth();

  if (!userProfile) return null;

  const handleRefresh = () => {
    showToast('Checking approval status...', 'info');
  };

  return (
    <div className="max-w-xl mx-auto my-8 sm:my-14 px-4">
      <div className="relative bg-white/95 dark:bg-[#111318]/95 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-9 shadow-2xl shadow-stone-900/5 dark:shadow-black/50 backdrop-blur-md folio-card text-center space-y-6">
        
        {/* Corner Marks */}
        <div className="absolute top-3 left-3 text-[9px] font-mono text-stone-400 dark:text-stone-600 select-none">+</div>
        <div className="absolute top-3 right-3 text-[9px] font-mono text-stone-400 dark:text-stone-600 select-none">+</div>
        <div className="absolute bottom-3 left-3 text-[9px] font-mono text-stone-400 dark:text-stone-600 select-none">+</div>
        <div className="absolute bottom-3 right-3 text-[9px] font-mono text-stone-400 dark:text-stone-600 select-none">+</div>

        {/* Emblem in monochrome outline */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white flex items-center justify-center relative">
          <Clock className="h-9 w-9" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-stone-600 dark:bg-stone-300"></span>
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-transparent text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 text-[10px] font-mono font-bold uppercase tracking-wider">
            <Compass className="h-3 w-3" />
            <span>Pending Review</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold italic text-stone-900 dark:text-stone-100 tracking-tight">
            Awaiting Approval
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed font-sans">
            Welcome, <strong className="text-stone-900 dark:text-stone-100">{userProfile.name}</strong>. Your account registration is awaiting review by a faculty member.
          </p>
        </div>

        {/* Details Card */}
        <div className="bg-stone-50 dark:bg-[#0A0B0E] rounded-2xl p-5 border border-stone-200 dark:border-stone-800 text-left text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2.5">
            <div className="flex items-center space-x-2 text-stone-900 dark:text-stone-100 font-heading font-bold">
              <ShieldAlert className="h-4 w-4 text-stone-700 dark:text-stone-300" />
              <span>Account Credentials</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[10px] uppercase text-stone-400 block font-semibold">User ID</span>
              <span className="font-mono font-bold text-stone-900 dark:text-stone-100 text-sm">{userProfile.userCode}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-stone-400 block font-semibold">Role</span>
              <span className="font-mono font-bold text-stone-900 dark:text-white uppercase text-xs">{userProfile.role}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-stone-400 block font-semibold">Section / Location</span>
              <span className="text-stone-800 dark:text-stone-200 font-medium">{userProfile.departmentOrLocation}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-stone-400 block font-semibold">Registered On</span>
              <span className="font-mono text-stone-800 dark:text-stone-200">{new Date(userProfile.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Verification Guidance */}
        <div className="p-4 rounded-2xl bg-stone-100/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 text-left flex items-start space-x-3">
          <FileCheck2 className="h-4 w-4 mt-0.5 shrink-0 text-stone-600 dark:text-stone-400" />
          <div className="leading-relaxed font-sans">
            <strong className="text-stone-900 dark:text-stone-100 block font-heading text-[11px] uppercase tracking-wider mb-0.5">Faculty Verification:</strong>
            A teacher must approve your account before access is unlocked.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleRefresh}
            id="pending-refresh-btn"
            className="flex-1 py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-heading font-bold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 transition-all shadow-sm cursor-pointer border border-stone-900 dark:border-white"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Check Status</span>
          </button>

          <button
            onClick={logout}
            id="pending-logout-btn"
            className="py-3 px-5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </div>
  );
};
