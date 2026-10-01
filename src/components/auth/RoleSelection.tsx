import React, { useState } from 'react';
import { UserRole } from '../../types';
import { GraduationCap, UserCheck, Shield, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface RoleSelectionProps {
  onSelectRole: (role: UserRole) => void;
}

export const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelectRole }) => {
  const { enterAdminMode } = useAuth();
  const [isAdminLoading, setIsAdminLoading] = useState<boolean>(false);

  const handleAdminMode = async (role: UserRole) => {
    setIsAdminLoading(true);
    try {
      await enterAdminMode(role);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdminLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 text-center space-y-8">
      
      {/* Hero Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#e9eee0] dark:bg-[#2a3320] border border-[#d9e0cf] dark:border-[#313a26] text-[#5a6344] dark:text-[#b2c098] text-xs font-bold tracking-wide uppercase">
          <GraduationCap className="h-3.5 w-3.5 text-[#5a6344]" />
          <span>Attendance Portal</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#2d3321] dark:text-[#e5eadc] tracking-tight italic">
          Welcome to <span className="text-[#5a6344] dark:text-[#b2c098] not-italic">AttendEase</span>
        </h1>
        <p className="text-sm sm:text-lg text-[#5a6344]/80 dark:text-[#a3b088]/80 max-w-xl mx-auto font-normal">
          Select your portal to record daily attendance, review class statistics, and manage subject enrollments.
        </p>
      </div>

      {/* Admin Mode Fast-Track Banner */}
      <div className="max-w-3xl mx-auto soft-card p-5 border-2 border-dashed border-[#5a6344]/30 dark:border-[#b2c098]/30 bg-[#e9eee0]/40 dark:bg-[#2a3320]/40 text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-[#5a6344] text-white shadow-md shadow-[#5a6344]/20 shrink-0">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#5a6344] dark:text-[#b2c098]">
                Instant Access
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#5a6344] text-white">
                NO ACCOUNT NEEDED
              </span>
            </div>
            <h3 className="text-base font-serif font-bold text-[#2d3321] dark:text-[#e5eadc]">
              Admin Preview Mode
            </h3>
            <p className="text-xs text-[#5a6344]/80 dark:text-[#a3b088]/80 leading-snug">
              Bypass login & registration to immediately inspect teacher administrative tools, class rosters, and live attendance logs.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => handleAdminMode('teacher')}
            disabled={isAdminLoading}
            id="express-admin-teacher-btn"
            className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-[#5a6344] hover:bg-[#4a5238] text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            {isAdminLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Teacher Preview</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleAdminMode('student')}
            disabled={isAdminLoading}
            id="express-admin-student-btn"
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-full border border-[#d9e0cf] dark:border-[#313a26] bg-white dark:bg-[#202619] hover:bg-[#e9eee0] dark:hover:bg-[#2a3320] text-[#2d3321] dark:text-[#e5eadc] font-bold text-xs flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
          >
            <GraduationCap className="h-4 w-4 text-[#5a6344]" />
            <span>Student Preview</span>
          </button>
        </div>
      </div>

      {/* Role Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto">
        
        {/* Student Role Card */}
        <div 
          onClick={() => onSelectRole('student')}
          id="select-student-role-card"
          className="group relative soft-card p-6 sm:p-8 text-left cursor-pointer transition-all duration-300 hover:border-[#5a6344] dark:hover:border-[#b2c098] hover:-translate-y-1 flex flex-col justify-between"
        >
          <div>
            <div className="h-14 w-14 rounded-2xl bg-[#e9eee0] dark:bg-[#2a3320] text-[#5a6344] dark:text-[#b2c098] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <GraduationCap className="h-8 w-8" />
            </div>

            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#5a6344] dark:text-[#b2c098]">
                Portal 01
              </span>
              <span className="h-1 w-1 rounded-full bg-[#d9e0cf] dark:bg-[#313a26]"></span>
              <span className="text-xs font-semibold text-[#5a6344]/70 dark:text-[#a3b088]/70">Student Access</span>
            </div>

            <h2 className="text-2xl font-serif font-bold text-[#2d3321] dark:text-[#e5eadc] mb-3 group-hover:text-[#5a6344] dark:group-hover:text-[#b2c098] transition-colors">
              I am a Student
            </h2>

            <p className="text-sm text-[#2d3321]/80 dark:text-[#e5eadc]/80 mb-6 leading-relaxed">
              Check in for your daily classes, review your attendance, apply for subjects, and manage your profile.
            </p>
          </div>

          <div className="pt-4 border-t border-[#d9e0cf] dark:border-[#313a26] flex items-center justify-between text-xs font-bold text-[#5a6344] dark:text-[#b2c098] group-hover:translate-x-1 transition-transform">
            <span>Continue as Student</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>

        {/* Teacher Role Card */}
        <div 
          onClick={() => onSelectRole('teacher')}
          id="select-teacher-role-card"
          className="group relative soft-card p-6 sm:p-8 text-left cursor-pointer transition-all duration-300 hover:border-[#5a6344] dark:hover:border-[#b2c098] hover:-translate-y-1 flex flex-col justify-between"
        >
          <div>
            <div className="h-14 w-14 rounded-2xl bg-[#5a6344] text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-md shadow-[#5a6344]/20">
              <UserCheck className="h-8 w-8" />
            </div>

            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#5a6344] dark:text-[#b2c098]">
                Portal 02
              </span>
              <span className="h-1 w-1 rounded-full bg-[#d9e0cf] dark:bg-[#313a26]"></span>
              <span className="text-xs font-semibold text-[#5a6344]/70 dark:text-[#a3b088]/70">Teacher Access</span>
            </div>

            <h2 className="text-2xl font-serif font-bold text-[#2d3321] dark:text-[#e5eadc] mb-3 group-hover:text-[#5a6344] dark:group-hover:text-[#b2c098] transition-colors">
              I am a Teacher
            </h2>

            <p className="text-sm text-[#2d3321]/80 dark:text-[#e5eadc]/80 mb-6 leading-relaxed">
              Approve accounts, view class rosters, mark attendance, review logs, and manage subjects.
            </p>
          </div>

          <div className="pt-4 border-t border-[#d9e0cf] dark:border-[#313a26] flex items-center justify-between text-xs font-bold text-[#5a6344] dark:text-[#b2c098] group-hover:translate-x-1 transition-transform">
            <span>Continue as Teacher</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>

      </div>

      {/* Notice info */}
      <div className="pt-4 text-xs text-[#5a6344]/70 dark:text-[#a3b088]/70 flex items-center justify-center space-x-2">
        <Shield className="h-4 w-4 text-[#5a6344] shrink-0" />
        <span>New accounts require teacher approval.</span>
      </div>

    </div>
  );
};
