import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Subject, 
  Enrollment, 
  AttendanceRecord, 
  AttendanceStatus 
} from '../../types';
import { 
  recordAttendance, 
  subscribeStudentAttendance, 
  subscribeStudentEnrollments, 
  subscribeSubjects 
} from '../../services/attendanceService';
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  BookOpen, 
  MapPin, 
  Send, 
  Info, 
  Video, 
  KeyRound, 
  Lock, 
  FileCheck2, 
  X,
  Sparkles
} from 'lucide-react';

export const DailyCheckInTab: React.FC = () => {
  const { userProfile, showToast } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  
  // Modal state for checking in
  const [selectedSubjectForCheckIn, setSelectedSubjectForCheckIn] = useState<Subject | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<AttendanceStatus>('present');
  const [enteredPin, setEnteredPin] = useState('');
  const [checkInNote, setCheckInNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  useEffect(() => {
    if (!userProfile) return;

    const unSubEnr = subscribeStudentEnrollments(userProfile.uid, (enrs) => {
      setEnrollments(enrs.filter(e => e.status === 'approved'));
    });

    const unSubSub = subscribeSubjects(setSubjects);
    const unSubAtt = subscribeStudentAttendance(userProfile.uid, setAttendanceRecords);

    return () => {
      unSubEnr();
      unSubSub();
      unSubAtt();
    };
  }, [userProfile]);

  // Enrolled Subject Objects
  const enrolledSubjectIds = enrollments.map(e => e.subjectId);
  const myEnrolledSubjects = subjects.filter(s => enrolledSubjectIds.includes(s.id));

  // Get Today's attendance record for a subject
  const getTodayRecordForSubject = (subjectId: string): AttendanceRecord | undefined => {
    return attendanceRecords.find(r => r.subjectId === subjectId && r.date === todayStr);
  };

  const handleOpenCheckIn = (subj: Subject) => {
    setSelectedSubjectForCheckIn(subj);
    setCheckInStatus('present');
    setEnteredPin('');
    setCheckInNote('');
  };

  const handleConfirmCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !selectedSubjectForCheckIn) return;

    // PIN Verification enforcement: If teacher opened a live session, student MUST match PIN
    if (selectedSubjectForCheckIn.isSessionOpen) {
      const activePin = selectedSubjectForCheckIn.activeSessionCode?.trim();
      const cleanEntered = enteredPin.trim();

      if (!cleanEntered) {
        showToast('Please enter the 4-digit class PIN displayed by your instructor.', 'error');
        return;
      }

      if (activePin && cleanEntered !== activePin) {
        showToast('Invalid PIN. Please check the code projected on the classroom board.', 'error');
        return;
      }
    } else {
      // If instructor requires in-person PIN and session is NOT open
      showToast('Attendance is locked by instructor. Please ask your instructor to open the live session PIN.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordAttendance(
        { uid: userProfile.uid, name: userProfile.name, userCode: userProfile.userCode },
        { id: selectedSubjectForCheckIn.id, code: selectedSubjectForCheckIn.code, name: selectedSubjectForCheckIn.name },
        todayStr,
        checkInStatus,
        checkInNote,
        'student',
        { uid: userProfile.uid, name: userProfile.name },
        true // Live PIN verified
      );

      // Trigger Confetti Celebration!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // ignore if canvas confetti restricted
      }

      showToast(`Verified check-in as '${checkInStatus.toUpperCase()}' for ${selectedSubjectForCheckIn.name}!`, 'success');
      setSelectedSubjectForCheckIn(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to check in.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkInModalContent = selectedSubjectForCheckIn && typeof document !== 'undefined' ? (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) setSelectedSubjectForCheckIn(null);
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#16181e] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 my-auto folio-card animate-in fade-in zoom-in-95 duration-150"
      >
        
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div>
            <span className="text-xs font-mono font-bold text-stone-500 dark:text-stone-400">
              {selectedSubjectForCheckIn.code}
            </span>
            <h3 className="text-lg font-display font-bold italic text-stone-900 dark:text-stone-100">
              {selectedSubjectForCheckIn.name}
            </h3>
          </div>
          <button 
            onClick={() => setSelectedSubjectForCheckIn(null)}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleConfirmCheckIn} className="space-y-4">
          
          {/* Classroom PIN Input */}
          <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
            <label className="block text-xs font-heading font-bold text-stone-900 dark:text-stone-100">
              4-Digit Classroom PIN
            </label>
            <p className="text-[11px] text-stone-600 dark:text-stone-400 font-sans">
              Enter the code displayed on the board by your teacher:
            </p>
            <input
              type="text"
              maxLength={6}
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value)}
              placeholder="e.g. 4829"
              autoFocus
              required
              className="w-full text-center tracking-widest text-2xl font-mono font-black py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-900 dark:focus:border-white uppercase"
            />
          </div>

          {/* Status selection */}
          <div>
            <label className="block text-xs font-heading font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2">
              My Attendance Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCheckInStatus('present')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-heading font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  checkInStatus === 'present'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Present (On-Time)</span>
              </button>

              <button
                type="button"
                onClick={() => setCheckInStatus('late')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-heading font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  checkInStatus === 'late'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                    : 'bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>Late</span>
              </button>
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-heading font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
              Optional Note
            </label>
            <input
              type="text"
              value={checkInNote}
              onChange={(e) => setCheckInNote(e.target.value)}
              placeholder="e.g. In 2nd row, left side"
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans"
            />
          </div>

          <div className="pt-2 flex gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedSubjectForCheckIn(null)}
              className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer font-heading"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              id="confirm-checkin-btn"
              className="flex-1 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 text-xs font-heading font-bold shadow-2xs flex items-center justify-center space-x-1.5 cursor-pointer transition-all border border-stone-900 dark:border-white"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-stone-950/30 dark:border-t-stone-950 rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Verify & Check In</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 shadow-2xs folio-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-mono font-bold border border-stone-200 dark:border-stone-700 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Verified Attendance Session</span>
          </div>
          <h2 className="text-2xl font-display font-bold italic text-stone-900 dark:text-stone-100 tracking-tight">
            Class Attendance Check-In
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5 font-sans">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="px-4 py-2.5 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 shrink-0 flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-stone-700 dark:text-stone-300" />
          <span className="font-mono font-bold">{todayStr}</span>
        </div>
      </div>

      {/* Enrolled Subjects Check-in Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-heading font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-stone-700 dark:text-stone-300" />
            <span>My Enrolled Classes ({myEnrolledSubjects.length})</span>
          </h3>
          <span className="text-xs text-stone-500 font-mono">
            Requires live classroom PIN verification
          </span>
        </div>

        {myEnrolledSubjects.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white/80 dark:bg-[#111318]/80 border border-stone-200 dark:border-stone-800 space-y-3 folio-card">
            <BookOpen className="h-10 w-10 text-stone-400 mx-auto" />
            <h4 className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100">
              No Approved Enrollments
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto font-sans">
              You haven't enrolled in any subjects yet or your enrollment request is pending faculty approval.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myEnrolledSubjects.map((subj) => {
              const todayRecord = getTodayRecordForSubject(subj.id);
              const isSessionOpen = subj.isSessionOpen;

              return (
                <div
                  key={subj.id}
                  className="bg-white/95 dark:bg-[#111318]/95 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4 folio-card flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top Row: Code & Live Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono font-bold text-xs border border-stone-200 dark:border-stone-700">
                        {subj.code}
                      </span>
                      
                      {isSessionOpen ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                          Live PIN Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
                          <Lock className="h-3 w-3 mr-1" />
                          Session Locked
                        </span>
                      )}
                    </div>

                    {/* Subject Name & Schedule Details */}
                    <div>
                      <h4 className="font-heading font-bold text-base text-stone-900 dark:text-stone-100">
                        {subj.name}
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-sans">
                        Instructor: {subj.teacherName}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-600 dark:text-stone-400 font-mono">
                      {subj.schedule && (
                        <span className="flex items-center space-x-1 bg-stone-50 dark:bg-stone-900 px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-800">
                          <Clock className="h-3 w-3 text-stone-400" />
                          <span>{subj.schedule}</span>
                        </span>
                      )}
                      {subj.room && (
                        <span className="flex items-center space-x-1 bg-stone-50 dark:bg-stone-900 px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-800">
                          <MapPin className="h-3 w-3 text-stone-400" />
                          <span>{subj.room}</span>
                        </span>
                      )}
                      {subj.meetingLink && (
                        <a 
                          href={subj.meetingLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center space-x-1 bg-stone-50 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-800 transition-colors"
                        >
                          <Video className="h-3.5 w-3.5 text-stone-400" />
                          <span>Join Video Call</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Attendance Check-in Action / Status */}
                  {todayRecord ? (
                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <CheckCircle2 className={`h-5 w-5 ${
                          todayRecord.status === 'present' ? 'text-emerald-600 dark:text-emerald-400' :
                          todayRecord.status === 'late' ? 'text-amber-600 dark:text-amber-400' :
                          todayRecord.status === 'excused' ? 'text-blue-600 dark:text-blue-400' :
                          'text-rose-600 dark:text-rose-400'
                        }`} />
                        <div>
                          <p className="text-xs font-heading font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                            Checked In as {todayRecord.status}
                          </p>
                          <p className="text-[10px] text-stone-500 font-mono">
                            {todayRecord.sessionCodeVerified ? '✓ Live PIN Verified' : 'Logged'} • {new Date(todayRecord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        Completed
                      </span>
                    </div>
                  ) : isSessionOpen ? (
                    <button
                      onClick={() => handleOpenCheckIn(subj)}
                      id={`checkin-btn-${subj.code}`}
                      className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-2xs cursor-pointer border border-stone-900 dark:border-white"
                    >
                      <KeyRound className="h-4 w-4" />
                      <span>Enter Class PIN to Check In</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 text-center">
                      <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                        Check-in locked. Instructor has not yet opened a live classroom session PIN.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Render Check-In Modal via Portal */}
      {checkInModalContent && createPortal(checkInModalContent, document.body)}

    </div>
  );
};
