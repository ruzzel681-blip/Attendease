import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { NotificationToast } from './components/common/NotificationToast';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { PendingApprovalState } from './components/auth/PendingApprovalState';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { StudentDashboard } from './components/student/StudentDashboard';
import { Compass, AlertOctagon, LogOut, Loader2 } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { firebaseUser, userProfile, loading, profileLoadTimedOut, profileLoadErrorDetail, retryProfileLoad, selectedRole, setSelectedRole, logout } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-editorial-hero text-stone-900 dark:text-stone-100 transition-colors">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-white dark:bg-stone-900 text-stone-900 dark:text-white flex items-center justify-center shadow-xl border border-stone-200 dark:border-stone-800 animate-pulse">
            <Compass className="h-8 w-8 stroke-[1.75]" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-display font-bold italic tracking-tight">AttendEase</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center justify-center space-x-2 font-mono">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-700 dark:text-stone-300" />
              <span>Loading attendance system...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!firebaseUser && !userProfile) {
    const activeRole = selectedRole || 'student';

    return (
      <div className="min-h-screen flex flex-col bg-editorial-hero text-stone-900 dark:text-stone-100 transition-colors overflow-x-hidden">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-start sm:justify-center px-3 sm:px-6 py-4 sm:py-8 w-full max-w-7xl mx-auto my-auto">
          {isRegistering ? (
            <RegisterForm 
              role={activeRole}
              onRoleChange={(r) => setSelectedRole(r)}
              onSwitchToLogin={() => setIsRegistering(false)}
            />
          ) : (
            <LoginForm 
              role={activeRole}
              onRoleChange={(r) => setSelectedRole(r)}
              onSwitchToRegister={() => setIsRegistering(true)}
            />
          )}
        </main>
        <Footer />
        <NotificationToast />
      </div>
    );
  }

  // 3. Authenticated - Check User Status & Profile
  if (!userProfile) {
    return (
      <div className="min-h-screen flex flex-col bg-editorial-hero text-stone-900 dark:text-stone-100 transition-colors">
        <Header />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-sm">
            {profileLoadTimedOut ? (
              <>
                <AlertOctagon className="h-8 w-8 mx-auto text-stone-600 dark:text-stone-300" />
                <div className="space-y-1">
                  <p className="text-sm font-heading font-semibold">Connection Timeout</p>
                  <p className="text-xs text-stone-500">
                    Could not connect to user profile. Please check your network and try again.
                  </p>
                  {profileLoadErrorDetail && (
                    <p className="text-[10px] font-mono text-rose-500 dark:text-rose-400 break-all bg-rose-500/10 rounded px-2 py-1 mt-2">
                      {profileLoadErrorDetail}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-center gap-2 pt-2">
                  <button
                    onClick={retryProfileLoad}
                    className="px-5 py-2.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-950 text-xs font-heading font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer border border-stone-900 dark:border-white"
                  >
                    Retry
                  </button>
                  <button
                    onClick={logout}
                    className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="h-3 w-3" />
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-stone-600 dark:text-stone-300" />
                <p className="text-xs text-stone-500 font-mono">Loading profile...</p>
              </>
            )}
          </div>
        </main>
        <Footer />
        <NotificationToast />
      </div>
    );
  }

  // Pending Status Screen
  if (userProfile.status === 'pending') {
    return (
      <div className="min-h-screen flex flex-col bg-editorial-hero text-stone-900 dark:text-stone-100 transition-colors">
        <Header />
        <main className="flex-grow flex items-center justify-center p-4">
          <PendingApprovalState />
        </main>
        <Footer />
        <NotificationToast />
      </div>
    );
  }

  // Rejected Status Screen
  if (userProfile.status === 'rejected') {
    return (
      <div className="min-h-screen flex flex-col bg-editorial-hero text-stone-900 dark:text-stone-100 transition-colors">
        <Header />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#111318] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-xl folio-card">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20">
              <AlertOctagon className="h-8 w-8" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-rose-500 tracking-widest font-bold block mb-1">REGISTRATION NOT APPROVED</span>
              <h2 className="text-xl font-display font-bold text-stone-900 dark:text-white italic">Account Not Approved</h2>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 font-sans">
                Your registration was not approved by a teacher.
              </p>
              {userProfile.rejectedReason && (
                <p className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-900 font-mono text-left">
                  Note: "{userProfile.rejectedReason}"
                </p>
              )}
            </div>
            <button
              onClick={logout}
              className="w-full py-3 px-4 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-950 font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer hover:opacity-90 border border-stone-900 dark:border-white"
            >
              <LogOut className="h-4 w-4" />
              <span>Back to Login</span>
            </button>
          </div>
        </main>
        <Footer />
        <NotificationToast />
      </div>
    );
  }

  // Approved Status -> Render Role Dashboard
  return (
    <div className="min-h-screen w-full flex flex-col bg-data-canvas text-stone-900 dark:text-stone-100 transition-colors overflow-x-hidden">
      <Header />
      <main className="flex-grow w-full">
        {userProfile.role === 'teacher' ? (
          <TeacherDashboard />
        ) : (
          <StudentDashboard />
        )}
      </main>
      <Footer />
      <NotificationToast />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
