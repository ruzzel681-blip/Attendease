import React, { useState, useEffect } from 'react';
import { Subject, Enrollment, AttendanceRecord, AttendanceStatus, AttendanceCorrectionRequest } from '../../types';
import { 
  subscribeSubjects, 
  subscribeAllEnrollments, 
  subscribeAllAttendance, 
  recordAttendance,
  startSubjectAttendanceSession,
  closeSubjectAttendanceSession,
  subscribeAttendanceCorrectionRequests,
  resolveAttendanceCorrectionRequest
} from '../../services/attendanceService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CheckSquare, 
  Users, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Search,
  ShieldCheck,
  KeyRound,
  FileCheck2,
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { AvatarDisplay } from '../common/AvatarDisplay';

export const MarkAttendanceTab: React.FC = () => {
  const { userProfile, showToast } = useAuth();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  
  // Date selection (default today YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [disputes, setDisputes] = useState<AttendanceCorrectionRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Live PIN modal / drawer
  const [showLivePinModal, setShowLivePinModal] = useState(false);
  const [isGeneratingPin, setIsGeneratingPin] = useState(false);

  // Disputes modal
  const [showDisputesModal, setShowDisputesModal] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [teacherResolutionNote, setTeacherResolutionNote] = useState('');

  // Excused note modal
  const [excusedTargetStudent, setExcusedTargetStudent] = useState<{ id: string; name: string; userCode: string } | null>(null);
  const [excusedReason, setExcusedReason] = useState('Medical Certificate / Sick Leave');

  useEffect(() => {
    const unSubSub = subscribeSubjects((subs) => {
      setSubjects(subs);
      if (subs.length > 0 && (!selectedSubjectId || !subs.some(s => s.id === selectedSubjectId))) {
        setSelectedSubjectId(subs[0].id);
      }
    });

    const unSubEnr = subscribeAllEnrollments(setAllEnrollments);
    const unSubAtt = subscribeAllAttendance(setAttendanceRecords);

    let unSubDisputes = () => {};
    if (userProfile?.uid) {
      unSubDisputes = subscribeAttendanceCorrectionRequests(
        { teacherId: userProfile.uid },
        setDisputes
      );
    }

    return () => {
      unSubSub();
      unSubEnr();
      unSubAtt();
      unSubDisputes();
    };
  }, [userProfile]);

  // Current Subject
  const currentSubject = subjects.find(s => s.id === selectedSubjectId);

  // Available Terms
  const availableTerms = Array.from(new Set(subjects.map(s => s.term || 'Fall 2026')));

  // Filter subjects by Term if selected
  const filteredSubjects = selectedTerm === 'all' 
    ? subjects 
    : subjects.filter(s => (s.term || 'Fall 2026') === selectedTerm);

  // Enrolled students for selected subject
  const enrolledStudents = allEnrollments.filter(
    e => e.subjectId === selectedSubjectId && e.status === 'approved'
  );

  // Existing records for selected subject & date
  const recordsForDateAndSubject = attendanceRecords.filter(
    r => r.subjectId === selectedSubjectId && r.date === selectedDate
  );

  // Map of studentId -> AttendanceRecord
  const recordMap = new Map<string, AttendanceRecord>();
  recordsForDateAndSubject.forEach(r => recordMap.set(r.studentId, r));

  // Counts
  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let excusedCount = 0;
  let unrecordedCount = 0;

  enrolledStudents.forEach(e => {
    const rec = recordMap.get(e.studentId);
    if (!rec) {
      unrecordedCount++;
    } else if (rec.status === 'present') {
      presentCount++;
    } else if (rec.status === 'late') {
      lateCount++;
    } else if (rec.status === 'absent') {
      absentCount++;
    } else if (rec.status === 'excused') {
      excusedCount++;
    }
  });

  const pendingDisputes = disputes.filter(d => d.status === 'pending');

  const handleSetStudentStatus = async (
    studentId: string, 
    studentName: string, 
    studentUserCode: string, 
    status: AttendanceStatus,
    note: string = ''
  ) => {
    if (!userProfile || !currentSubject) return;
    
    const existingNote = recordMap.get(studentId)?.note || '';
    const finalNote = note || existingNote;

    try {
      await recordAttendance(
        { uid: studentId, name: studentName, userCode: studentUserCode },
        { id: currentSubject.id, code: currentSubject.code, name: currentSubject.name },
        selectedDate,
        status,
        finalNote,
        'teacher',
        { uid: userProfile.uid, name: userProfile.name }
      );
      showToast(`Logged ${studentName} as ${status.toUpperCase()}`, 'success');
    } catch (err: any) {
      showToast(`Failed to record attendance: ${err.message}`, 'error');
    }
  };

  const handleMarkAll = async (status: AttendanceStatus) => {
    if (!userProfile || !currentSubject || enrolledStudents.length === 0) return;
    
    setIsSaving(true);
    try {
      for (const student of enrolledStudents) {
        const note = recordMap.get(student.studentId)?.note || '';
        await recordAttendance(
          { uid: student.studentId, name: student.studentName, userCode: student.studentUserCode },
          { id: currentSubject.id, code: currentSubject.code, name: currentSubject.name },
          selectedDate,
          status,
          note,
          'teacher',
          { uid: userProfile.uid, name: userProfile.name }
        );
      }
      showToast(`Marked all ${enrolledStudents.length} students as ${status.toUpperCase()}`, 'success');
    } catch (err: any) {
      showToast(`Batch update error: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Sweep unmarked students as absent
  const handleSweepUnmarked = async () => {
    if (!userProfile || !currentSubject) return;
    const unmarked = enrolledStudents.filter(s => !recordMap.has(s.studentId));
    if (unmarked.length === 0) {
      showToast('All students already have an attendance record for this date.', 'info');
      return;
    }

    setIsSaving(true);
    try {
      for (const student of unmarked) {
        await recordAttendance(
          { uid: student.studentId, name: student.studentName, userCode: student.studentUserCode },
          { id: currentSubject.id, code: currentSubject.code, name: currentSubject.name },
          selectedDate,
          'absent',
          'Unmarked session sweep',
          'teacher',
          { uid: userProfile.uid, name: userProfile.name }
        );
      }
      showToast(`Logged ${unmarked.length} unmarked student(s) as Absent.`, 'success');
    } catch (err: any) {
      showToast(`Failed to sweep unmarked: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Start live PIN session
  const handleToggleLiveSession = async () => {
    if (!currentSubject || !userProfile) return;
    setIsGeneratingPin(true);
    try {
      if (currentSubject.isSessionOpen) {
        await closeSubjectAttendanceSession(currentSubject.id, userProfile.name);
        showToast('Live attendance session closed.', 'info');
      } else {
        const pin = await startSubjectAttendanceSession(currentSubject.id, 30, userProfile.name);
        showToast(`Live session opened with PIN #${pin}`, 'success');
      }
    } catch (err: any) {
      showToast(`Session error: ${err.message}`, 'error');
    } finally {
      setIsGeneratingPin(false);
    }
  };

  // Resolve a dispute
  const handleResolveDispute = async (req: AttendanceCorrectionRequest, resolution: 'approved' | 'rejected') => {
    if (!userProfile) return;
    setResolvingId(req.id);
    try {
      await resolveAttendanceCorrectionRequest(
        req, 
        resolution, 
        teacherResolutionNote, 
        { uid: userProfile.uid, name: userProfile.name }
      );
      showToast(`Correction request ${resolution}.`, 'success');
      setTeacherResolutionNote('');
    } catch (err: any) {
      showToast(`Resolution error: ${err.message}`, 'error');
    } finally {
      setResolvingId(null);
    }
  };

  const filteredStudents = enrolledStudents.filter(s => {
    const q = searchQuery.toLowerCase();
    return s.studentName.toLowerCase().includes(q) || s.studentUserCode.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 shadow-xs folio-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0 border border-stone-200 dark:border-stone-700">
            <CheckSquare className="h-6 w-6 stroke-[1.75]" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold italic text-stone-900 dark:text-stone-100">
              Mark Attendance
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
              Daily ledger with classroom PIN and excused absence tracking.
            </p>
          </div>
        </div>

        {/* Live PIN Session & Dispute Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dispute Badge Button */}
          <button
            onClick={() => setShowDisputesModal(true)}
            className="relative px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-stone-900 dark:hover:border-white font-heading font-bold text-xs tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <HelpCircle className="h-3.5 w-3.5 text-stone-500" />
            <span>Disputes</span>
            {pendingDisputes.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-stone-900 dark:bg-white text-white dark:text-stone-950 text-[10px] font-mono font-bold">
                {pendingDisputes.length}
              </span>
            )}
          </button>

          {/* Live Session PIN trigger */}
          <button
            onClick={() => setShowLivePinModal(true)}
            className={`px-3.5 py-2 rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs border ${
              currentSubject?.isSessionOpen
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 animate-pulse'
                : 'bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 border-stone-900 dark:border-white'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>{currentSubject?.isSessionOpen ? `PIN: #${currentSubject.activeSessionCode}` : 'Live PIN Session'}</span>
          </button>
        </div>
      </div>

      {/* Active PIN Banner (If Session Open) */}
      {currentSubject?.isSessionOpen && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-sm">
              PIN
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 font-heading">
                Live Classroom Session Open for {currentSubject.name}
              </div>
              <div className="text-xs text-stone-600 dark:text-stone-400 font-sans">
                Active Code: <strong className="font-mono text-base text-emerald-700 dark:text-emerald-400">#{currentSubject.activeSessionCode}</strong>. Students must enter this PIN to check in from class.
              </div>
            </div>
          </div>
          <button
            onClick={handleToggleLiveSession}
            disabled={isGeneratingPin}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-colors"
          >
            End PIN Session
          </button>
        </div>
      )}

      {/* Filter and Date Selection Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 shadow-xs folio-card grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Term select */}
        <div>
          <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest mb-1.5">
            Academic Term
          </label>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="w-full bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs font-heading font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-900 dark:focus:border-white"
          >
            <option value="all">All Terms</option>
            {availableTerms.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Subject select */}
        <div>
          <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest mb-1.5">
            Subject
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs font-heading font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-900 dark:focus:border-white"
          >
            {filteredSubjects.length === 0 ? (
              <option value="">No subjects found</option>
            ) : (
              filteredSubjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code} — {sub.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Date input */}
        <div>
          <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest mb-1.5">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-900 dark:focus:border-white"
          />
        </div>

        {/* Search student */}
        <div>
          <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest mb-1.5">
            Search Students
          </label>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search by student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans"
            />
          </div>
        </div>
      </div>

      {/* Quick Batch Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-stone-100/70 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800">
        <div className="text-xs font-heading font-bold text-stone-700 dark:text-stone-300">
          Batch Ledger Operations:
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleMarkAll('present')}
            disabled={isSaving || enrolledStudents.length === 0}
            className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs border border-stone-900 dark:border-white"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Mark All Present</span>
          </button>

          <button
            onClick={() => handleMarkAll('absent')}
            disabled={isSaving || enrolledStudents.length === 0}
            className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>Mark All Absent</span>
          </button>

          {unrecordedCount > 0 && (
            <button
              onClick={handleSweepUnmarked}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Sweep Unmarked ({unrecordedCount}) as Absent</span>
            </button>
          )}
        </div>
      </div>

      {/* Roster Roll Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111318] border border-stone-200 dark:border-stone-800 shadow-2xs">
          <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block">Enrolled</span>
          <span className="text-2xl font-display font-bold text-stone-900 dark:text-stone-100">{enrolledStudents.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-2xs">
          <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">Present</span>
          <span className="text-2xl font-display font-bold text-emerald-700 dark:text-emerald-300">{presentCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-2xs">
          <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">Late</span>
          <span className="text-2xl font-display font-bold text-amber-700 dark:text-amber-300">{lateCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 shadow-2xs">
          <span className="text-[10px] font-mono font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider block">Excused</span>
          <span className="text-2xl font-display font-bold text-sky-700 dark:text-sky-300">{excusedCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-2xs">
          <span className="text-[10px] font-mono font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">Absent</span>
          <span className="text-2xl font-display font-bold text-rose-700 dark:text-rose-300">{absentCount}</span>
        </div>
      </div>

      {/* Roll List */}
      <div className="space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#111318] border border-stone-200 dark:border-stone-800 space-y-2">
            <Users className="h-10 w-10 text-stone-300 dark:text-stone-600 mx-auto" />
            <h3 className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100">
              No students found in current ledger
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto font-sans">
              {enrolledStudents.length === 0
                ? 'No students are presently enrolled in this course.'
                : 'No student matches your current filter criteria.'}
            </p>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const record = recordMap.get(student.studentId);
            const currentStatus = record?.status;

            return (
              <div
                key={student.studentId}
                className={`p-4 sm:p-5 rounded-3xl bg-white/95 dark:bg-[#111318]/95 border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 folio-card ${
                  currentStatus === 'present'
                    ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-500/5'
                    : currentStatus === 'late'
                    ? 'border-amber-300 dark:border-amber-800/80 bg-amber-500/5'
                    : currentStatus === 'excused'
                    ? 'border-sky-300 dark:border-sky-800/80 bg-sky-500/5'
                    : currentStatus === 'absent'
                    ? 'border-rose-300 dark:border-rose-800/80 bg-rose-500/5'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                {/* Student Info */}
                <div className="flex items-center space-x-3.5 min-w-0">
                  <AvatarDisplay name={student.studentName} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                        {student.studentName}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono font-bold text-[10px] border border-stone-200 dark:border-stone-700">
                        {student.studentUserCode}
                      </span>
                      {record?.sessionCodeVerified && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30 flex items-center space-x-1">
                          <ShieldCheck className="h-3 w-3" />
                          <span>PIN Verified</span>
                        </span>
                      )}
                    </div>
                    {record && (
                      <div className="text-[11px] font-mono text-stone-400 mt-0.5">
                        Logged by {record.markedByName} ({record.markedBy}) at {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {record.note && ` — Note: ${record.note}`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleSetStudentStatus(student.studentId, student.studentName, student.studentUserCode, 'present')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                      currentStatus === 'present'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Present</span>
                  </button>

                  <button
                    onClick={() => handleSetStudentStatus(student.studentId, student.studentName, student.studentUserCode, 'late')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                      currentStatus === 'late'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-amber-100 dark:hover:bg-amber-950/60'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Late</span>
                  </button>

                  <button
                    onClick={() => setExcusedTargetStudent({ id: student.studentId, name: student.studentName, userCode: student.studentUserCode })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                      currentStatus === 'excused'
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-sky-100 dark:hover:bg-sky-950/60'
                    }`}
                  >
                    <FileCheck2 className="h-3.5 w-3.5" />
                    <span>Excused</span>
                  </button>

                  <button
                    onClick={() => handleSetStudentStatus(student.studentId, student.studentName, student.studentUserCode, 'absent')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                      currentStatus === 'absent'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-rose-100 dark:hover:bg-rose-950/60'
                    }`}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Absent</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Live PIN Session Modal */}
      {showLivePinModal && currentSubject && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111318] rounded-3xl max-w-md w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-5 folio-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center border border-stone-200 dark:border-stone-700">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold italic text-lg text-stone-900 dark:text-stone-100">
                    Classroom Live PIN
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                    Generate temporary session code for verification.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLivePinModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center space-y-3">
              <span className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest block">
                {currentSubject.name} ({currentSubject.code})
              </span>
              {currentSubject.isSessionOpen ? (
                <>
                  <div className="text-4xl font-mono font-black text-stone-900 dark:text-white tracking-wider">
                    #{currentSubject.activeSessionCode}
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 max-w-xs mx-auto font-sans">
                    Project this code on the board. Students must submit this 4-digit code to complete self check-in.
                  </p>
                </>
              ) : (
                <div className="py-4 text-xs text-stone-500 font-sans">
                  Live session is currently closed. Click below to generate a new PIN and open check-in.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowLivePinModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                Done
              </button>
              <button
                onClick={handleToggleLiveSession}
                disabled={isGeneratingPin}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                  currentSubject.isSessionOpen
                    ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600'
                    : 'bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 border-stone-900 dark:border-white'
                }`}
              >
                {currentSubject.isSessionOpen ? 'Close Live Session' : 'Start 30-min PIN Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excused Note Modal */}
      {excusedTargetStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111318] rounded-3xl max-w-md w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 folio-card">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold italic text-base text-stone-900 dark:text-stone-100">
                Log Excused Absence
              </h3>
              <button
                onClick={() => setExcusedTargetStudent(null)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
              Marking <strong>{excusedTargetStudent.name}</strong> as Excused for {selectedDate}.
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 font-heading">
                Reason / Justification
              </label>
              <select
                value={excusedReason}
                onChange={(e) => setExcusedReason(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-heading text-stone-900 dark:text-stone-100 mb-2 focus:outline-none focus:border-stone-900 dark:focus:border-white"
              >
                <option value="Medical Certificate / Sick Leave">Medical Certificate / Sick Leave</option>
                <option value="Authorized School Representation">Authorized School Representation</option>
                <option value="Family Bereavement / Emergency">Family Bereavement / Emergency</option>
                <option value="Approved Dean's Leave">Approved Dean's Leave</option>
                <option value="Official Department Duty">Official Department Duty</option>
              </select>
              <input
                type="text"
                placeholder="Or specify custom reason / ref ID..."
                value={excusedReason}
                onChange={(e) => setExcusedReason(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setExcusedTargetStudent(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleSetStudentStatus(
                    excusedTargetStudent.id,
                    excusedTargetStudent.name,
                    excusedTargetStudent.userCode,
                    'excused',
                    excusedReason
                  );
                  setExcusedTargetStudent(null);
                }}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer"
              >
                Confirm Excused Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Dispute Resolution Modal */}
      {showDisputesModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111318] rounded-3xl max-w-2xl w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 max-h-[85vh] flex flex-col folio-card">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <HelpCircle className="h-5 w-5 text-stone-500" />
                <h3 className="font-display font-bold italic text-lg text-stone-900 dark:text-stone-100">
                  Student Attendance Disputes & Correction Requests
                </h3>
              </div>
              <button
                onClick={() => setShowDisputesModal(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {disputes.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-500 font-sans">
                  No attendance correction requests submitted.
                </div>
              ) : (
                disputes.map((d) => (
                  <div 
                    key={d.id}
                    className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-heading font-bold text-stone-900 dark:text-stone-100">
                        {d.studentName} ({d.studentUserCode}) — {d.subjectName}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                        d.status === 'pending'
                          ? 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700'
                          : d.status === 'approved'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                      }`}>
                        {d.status}
                      </span>
                    </div>

                    <div className="text-stone-600 dark:text-stone-300 font-sans">
                      Date: <strong className="font-mono">{d.date}</strong> | Marked: <span className="uppercase font-bold text-rose-600">{d.currentStatus}</span> → Requested: <span className="uppercase font-bold text-emerald-600">{d.requestedStatus}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 italic border border-stone-200 dark:border-stone-700 font-sans">
                      "{d.reason}"
                    </div>

                    {d.status === 'pending' && (
                      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-stone-200 dark:border-stone-800">
                        <input
                          type="text"
                          placeholder="Resolution note / comment..."
                          value={teacherResolutionNote}
                          onChange={(e) => setTeacherResolutionNote(e.target.value)}
                          className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1 text-xs text-stone-900 dark:text-stone-100 flex-1 font-sans focus:outline-none focus:border-stone-900 dark:focus:border-white"
                        />
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <button
                            onClick={() => handleResolveDispute(d, 'approved')}
                            disabled={resolvingId === d.id}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                          >
                            Approve Correction
                          </button>
                          <button
                            onClick={() => handleResolveDispute(d, 'rejected')}
                            disabled={resolvingId === d.id}
                            className="px-3 py-1 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
