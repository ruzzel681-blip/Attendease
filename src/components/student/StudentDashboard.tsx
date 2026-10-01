import React, { useState, useEffect } from 'react';
import { DailyCheckInTab } from './DailyCheckInTab';
import { StudentStatsTab } from './StudentStatsTab';
import { SubjectEnrollmentTab } from './SubjectEnrollmentTab';
import { AttendanceHistoryTab } from './AttendanceHistoryTab';
import { StudentProfileTab } from './StudentProfileTab';
import { AnnouncementsTab } from '../classroom/AnnouncementsTab';
import { AssignmentsTab } from '../classroom/AssignmentsTab';
import { DirectMessagesTab } from '../messages/DirectMessagesTab';
import { FacultyDirectoryTab } from '../directory/FacultyDirectoryTab';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeSubjects } from '../../services/attendanceService';
import { Subject } from '../../types';
import { 
  CalendarCheck, 
  BarChart2, 
  BookOpen, 
  Clock, 
  User,
  PanelLeft,
  PanelLeftClose,
  Menu,
  X,
  Megaphone,
  ClipboardList,
  MessageSquare,
  Contact2,
  Compass
} from 'lucide-react';

interface DashboardTabItem {
  id: 'stream' | 'classwork' | 'checkin' | 'messages' | 'faculty' | 'stats' | 'enroll' | 'history' | 'profile';
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavCategory {
  group: string;
  tabs: DashboardTabItem[];
}

export const StudentDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'stream' | 'classwork' | 'checkin' | 'messages' | 'faculty' | 'stats' | 'enroll' | 'history' | 'profile'
  >('stream');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [preselectedRecipient, setPreselectedRecipient] = useState<{ uid: string; name: string } | null>(null);

  // Desktop sidebar collapse toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Mobile/Tablet slide-over drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeSubjects((data) => setSubjects(data));
    return () => unsub();
  }, []);

  const handleStartDirectMessage = (recipientId: string, recipientName: string) => {
    setPreselectedRecipient({ uid: recipientId, name: recipientName });
    setActiveTab('messages');
  };

  const navCategories: NavCategory[] = [
    {
      group: "Classroom",
      tabs: [
        { id: 'stream', label: "Announcements", shortLabel: "Announcements", icon: Megaphone },
        { id: 'classwork', label: "Assignments", shortLabel: "Assignments", icon: ClipboardList },
        { id: 'messages', label: "Messages", shortLabel: "Messages", icon: MessageSquare },
        { id: 'faculty', label: "Directory", shortLabel: "Directory", icon: Contact2 },
      ]
    },
    {
      group: "Attendance",
      tabs: [
        { id: 'checkin', label: "Check-In", shortLabel: "Check-In", icon: CalendarCheck, badge: "Live" },
        { id: 'stats', label: "Attendance Stats", shortLabel: "Stats", icon: BarChart2 },
        { id: 'history', label: "History", shortLabel: "History", icon: Clock },
      ]
    },
    {
      group: "Account",
      tabs: [
        { id: 'enroll', label: "Enrollment", shortLabel: "Enroll", icon: BookOpen },
        { id: 'profile', label: "Profile", shortLabel: "Profile", icon: User },
      ]
    }
  ];

  const allTabs: DashboardTabItem[] = navCategories.flatMap(c => c.tabs);
  const activeTabObj = allTabs.find(t => t.id === activeTab);

  if (!userProfile) return null;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6">
      
      {/* Welcome Header */}
      <div className="relative bg-white/90 dark:bg-[#111318]/90 border border-stone-200/90 dark:border-stone-800 rounded-3xl p-5 sm:p-7 backdrop-blur-md shadow-xs folio-card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-700 dark:text-stone-300 font-bold bg-stone-100 dark:bg-stone-800 px-2.5 py-0.5 rounded-full border border-stone-200 dark:border-stone-700">
                STUDENT
              </span>
              <span className="text-stone-300 dark:text-stone-700 font-mono text-xs">•</span>
              <span className="text-stone-500 dark:text-stone-400 font-mono text-xs">
                {userProfile.departmentOrLocation || 'Main Campus'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold italic text-stone-900 dark:text-stone-100 tracking-tight">
              {userProfile.name}
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
              Student ID: <span className="font-mono text-stone-700 dark:text-stone-300 font-bold">#{userProfile.userCode}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start md:self-auto">
            <div className="px-3.5 py-2 rounded-2xl bg-stone-100/90 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-left font-mono">
              <div className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">Courses</div>
              <div className="text-sm font-bold text-stone-900 dark:text-white">
                {subjects.length} Enrolled
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left font-mono">
              <div className="text-[9px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">Status</div>
              <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-bar with Navigation Trigger & Breadcrumb */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-200/90 dark:border-stone-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setIsMobileDrawerOpen(!isMobileDrawerOpen);
              } else {
                setIsSidebarOpen(!isSidebarOpen);
              }
            }}
            id="toggle-student-sidebar-btn"
            title="Toggle Menu"
            className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-heading font-bold text-xs transition-all shadow-2xs flex items-center space-x-2 cursor-pointer"
          >
            <Menu className="h-4 w-4 lg:hidden text-stone-700 dark:text-stone-300" />
            <span className="hidden lg:inline-block text-stone-700 dark:text-stone-300">
              {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </span>
            <span>Menu</span>
          </button>

          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="text-stone-300 dark:text-stone-700 font-bold">/</span>
            <span className="font-heading font-bold text-stone-900 dark:text-stone-100">
              {activeTabObj?.label}
            </span>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start relative">
        
        {/* Desktop Navigation Sidebar */}
        {isSidebarOpen && (
          <aside className="hidden lg:block w-72 shrink-0 sticky top-22">
            <div className="bg-white/95 dark:bg-[#111318]/95 p-4 space-y-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs folio-card">
              
              <div className="px-2 pb-2 border-b border-stone-100 dark:border-stone-800/80 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400">
                  Navigation
                </span>
                <span className="flex items-center space-x-1 font-mono text-[9px] text-stone-500 dark:text-stone-400">
                  <Compass className="h-3 w-3" />
                </span>
              </div>

              <div className="space-y-4">
                {navCategories.map((category) => (
                  <div key={category.group} className="space-y-1">
                    <div className="px-2.5 py-1 text-[9px] font-mono uppercase tracking-widest text-stone-400 font-bold">
                      {category.group}
                    </div>
                    
                    <div className="space-y-0.5">
                      {category.tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            id={`student-tab-${tab.id}`}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-heading font-semibold transition-all text-left cursor-pointer border ${
                              isActive
                                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950 border-stone-900 dark:border-white shadow-2xs'
                                : 'bg-transparent text-stone-600 dark:text-stone-400 border-transparent hover:bg-stone-100 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-200'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 truncate">
                              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white dark:text-stone-950' : 'text-stone-400'}`} />
                              <span className="truncate">{tab.label}</span>
                            </div>

                            {'badge' in tab && tab.badge && (
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                                isActive 
                                  ? 'bg-white/20 text-white dark:bg-stone-950/20 dark:text-stone-950' 
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {tab.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Student Identification Footer */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 font-mono text-[10px] text-stone-400 text-center">
                ID: {userProfile.userCode}
              </div>

            </div>
          </aside>
        )}

        {/* Mobile & Tablet Slide-Over Drawer Navigation */}
        {isMobileDrawerOpen && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsMobileDrawerOpen(false);
            }}
            className="lg:hidden fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex justify-start"
          >
            <div className="bg-white dark:bg-[#111318] w-80 max-w-[85vw] h-full p-5 space-y-4 shadow-2xl border-r border-stone-200 dark:border-stone-800 animate-in slide-in-from-left duration-200 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
                  <span className="font-display font-bold italic text-sm text-stone-900 dark:text-white flex items-center space-x-2">
                    <Compass className="h-4 w-4 text-stone-700 dark:text-stone-300" />
                    <span>Navigation</span>
                  </span>
                  <button
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4 mt-4">
                  {navCategories.map((category) => (
                    <div key={category.group} className="space-y-1">
                      <div className="px-2 text-[9px] font-mono uppercase tracking-widest text-stone-400 font-bold">
                        {category.group}
                      </div>
                      <div className="space-y-1">
                        {category.tabs.map((tab) => {
                          const Icon = tab.icon;
                          const isActive = activeTab === tab.id;

                          return (
                            <button
                              key={tab.id}
                              onClick={() => {
                                setActiveTab(tab.id as any);
                                setIsMobileDrawerOpen(false);
                              }}
                              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-heading font-bold text-xs transition-all text-left border cursor-pointer ${
                                isActive
                                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950 border-stone-900 dark:border-white shadow-xs'
                                  : 'bg-transparent text-stone-600 dark:text-stone-400 border-transparent hover:bg-stone-100 dark:hover:bg-stone-800'
                              }`}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-400 text-center font-mono">
                AttendEase
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 w-full space-y-6">
          {activeTab === 'stream' && <AnnouncementsTab userProfile={userProfile} subjects={subjects} />}
          {activeTab === 'classwork' && <AssignmentsTab userProfile={userProfile} subjects={subjects} />}
          {activeTab === 'checkin' && <DailyCheckInTab />}
          {activeTab === 'messages' && (
            <DirectMessagesTab
              currentUser={userProfile}
              preselectedRecipientId={preselectedRecipient?.uid}
              preselectedRecipientName={preselectedRecipient?.name}
            />
          )}
          {activeTab === 'faculty' && (
            <FacultyDirectoryTab
              onStartDirectMessage={handleStartDirectMessage}
            />
          )}
          {activeTab === 'stats' && <StudentStatsTab />}
          {activeTab === 'enroll' && <SubjectEnrollmentTab />}
          {activeTab === 'history' && <AttendanceHistoryTab />}
          {activeTab === 'profile' && <StudentProfileTab />}
        </main>

      </div>
    </div>
  );
};
