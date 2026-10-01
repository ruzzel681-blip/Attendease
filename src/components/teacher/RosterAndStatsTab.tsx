import React, { useState, useEffect } from 'react';
import { Subject, AttendanceRecord, Enrollment, UserProfile } from '../../types';
import { 
  subscribeSubjects, 
  subscribeStudentEnrollments, 
  subscribeAllAttendance, 
  blockStudentFromSubject, 
  unblockStudentFromSubject, 
  subscribeAllUsers, 
  bulkImportRosterToSubject 
} from '../../services/attendanceService';
import { useAuth } from '../../contexts/AuthContext';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { 
  Users, 
  MessageSquare, 
  UserX, 
  Unlock, 
  ShieldAlert, 
  Video, 
  UserPlus, 
  Upload, 
  Download, 
  Search, 
  CheckCircle2, 
  X 
} from 'lucide-react';

interface RosterAndStatsTabProps {
  onStartDirectMessage?: (studentId: string, studentName: string) => void;
}

export const RosterAndStatsTab: React.FC<RosterAndStatsTabProps> = ({ onStartDirectMessage }) => {
  const { userProfile, showToast } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isProcessingBlock, setIsProcessingBlock] = useState<boolean>(false);
  const [rosterSearch, setRosterSearch] = useState<string>('');

  // Bulk Import Modal State
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [rawImportText, setRawImportText] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribeSubjects = subscribeSubjects((subs) => {
      setSubjects(subs);
      if (subs.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(subs[0].id);
      }
    });

    return () => unsubscribeSubjects();
  }, [selectedSubjectId]);

  useEffect(() => {
    if (!selectedSubjectId) return;

    const unSubSub = subscribeSubjects(setSubjects);
    const unSubEnr = subscribeStudentEnrollments('', (enrs) => {
      setEnrollments(enrs.filter(e => e.status === 'approved'));
    });

    const unSubAtt = subscribeAllAttendance(setAttendanceRecords);
    const unSubUsers = subscribeAllUsers(setAllUsers);

    return () => {
      unSubSub();
      unSubEnr();
      unSubAtt();
      unSubUsers();
    };
  }, [selectedSubjectId]);

  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];

  // Get enrolled students for current selected subject
  const enrolledStudentsForSubject = enrollments
    .filter(e => e.subjectId === currentSubject?.id)
    .map(e => {
      const profile = allUsers.find(u => u.uid === e.studentId);
      return {
        studentId: e.studentId,
        studentName: e.studentName,
        studentUserCode: e.studentUserCode,
        avatar: profile?.avatar,
        location: profile?.departmentOrLocation || 'Main Campus',
        email: profile?.email || ''
      };
    });

  // Filtered by search
  const filteredRoster = enrolledStudentsForSubject.filter(st => {
    if (!rosterSearch) return true;
    const q = rosterSearch.toLowerCase();
    return st.studentName.toLowerCase().includes(q) || 
           st.studentUserCode.toLowerCase().includes(q) ||
           st.location.toLowerCase().includes(q);
  });

  // Helper to calculate student stats in subject
  const getStudentSubjectStats = (studentId: string, subjectId: string) => {
    const recs = attendanceRecords.filter(r => r.studentId === studentId && r.subjectId === subjectId);
    const total = recs.length;
    const present = recs.filter(r => r.status === 'present').length;
    const late = recs.filter(r => r.status === 'late').length;
    const excused = recs.filter(r => r.status === 'excused').length;
    const absent = recs.filter(r => r.status === 'absent').length;
    
    const countable = total - excused;
    const percentage = countable > 0 ? Math.round(((present + late) / countable) * 100) : 100;

    return { total, present, late, excused, absent, percentage };
  };

  const handleBlockStudent = async (studentId: string, studentName: string) => {
    if (!currentSubject) return;
    if (window.confirm(`Remove and block ${studentName} from ${currentSubject.code}?`)) {
      setIsProcessingBlock(true);
      try {
        await blockStudentFromSubject(currentSubject.id, studentId);
        showToast(`Blocked ${studentName} from ${currentSubject.code}`, 'info');
      } catch (err: any) {
        showToast(err.message || 'Failed to block student', 'error');
      } finally {
        setIsProcessingBlock(false);
      }
    }
  };

  const handleUnblockStudent = async (studentId: string) => {
    if (!currentSubject) return;
    setIsProcessingBlock(true);
    try {
      await unblockStudentFromSubject(currentSubject.id, studentId);
      showToast('Student unblocked successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to unblock student', 'error');
    } finally {
      setIsProcessingBlock(false);
    }
  };

  // Bulk Roster Import Handler
  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSubject || !rawImportText.trim() || !userProfile) return;

    setIsImporting(true);
    try {
      const lines = rawImportText.split('\n').map(l => l.trim()).filter(Boolean);
      const studentRows: Array<{ name: string; userCode: string; email?: string }> = [];

      for (const line of lines) {
        if (line.toLowerCase().startsWith('id') || line.toLowerCase().startsWith('student')) continue;

        const parts = line.split(/[,\t;|]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 2) {
          studentRows.push({
            userCode: parts[0],
            name: parts[1]
          });
        } else if (parts.length === 1 && parts[0]) {
          studentRows.push({
            userCode: parts[0],
            name: `Student ${parts[0]}`
          });
        }
      }

      if (studentRows.length === 0) {
        showToast('No valid student entries found in input.', 'error');
        return;
      }

      const result = await bulkImportRosterToSubject(
        currentSubject,
        studentRows,
        { uid: userProfile.uid, name: userProfile.name }
      );

      showToast(`Roster updated: ${result.added} enrolled, ${result.existing} already existed in ${currentSubject.code}.`, 'success');
      setShowImportModal(false);
      setRawImportText('');
    } catch (err: any) {
      showToast(err.message || 'Failed to import roster.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawImportText(text);
      }
    };
    reader.readAsText(file);
  };

  // Export Roster CSV
  const handleExportRosterCSV = () => {
    if (!currentSubject || enrolledStudentsForSubject.length === 0) return;

    const headers = ['Student ID', 'Student Name', 'Section / Campus', 'Attendance Rate', 'Present', 'Late', 'Excused', 'Absent', 'Total Records'];
    const rows = enrolledStudentsForSubject.map(st => {
      const s = getStudentSubjectStats(st.studentId, currentSubject.id);
      return [
        `"${st.studentUserCode}"`,
        `"${st.studentName}"`,
        `"${st.location}"`,
        `"${s.percentage}%"`,
        s.present,
        s.late,
        s.excused,
        s.absent,
        s.total
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentSubject.code}_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalRosterCount = enrolledStudentsForSubject.length;
  const avgAttendancePct = totalRosterCount > 0
    ? Math.round(
        enrolledStudentsForSubject.reduce((acc, st) => {
          return acc + getStudentSubjectStats(st.studentId, currentSubject?.id || '').percentage;
        }, 0) / totalRosterCount
      )
    : 100;

  // Blocked students in current subject
  const blockedStudentProfiles = (currentSubject?.blockedStudentIds || [])
    .filter(Boolean)
    .map(uid => {
      const user = allUsers.find(u => u.uid === uid);
      return {
        uid,
        name: user?.name || `Student (${String(uid).slice(0, 6)})`,
        userCode: user?.userCode || 'N/A',
        avatar: user?.avatar
      };
    });

  return (
    <div className="space-y-6">
      
      {/* Header & Subject Selector */}
      <div className="bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-7 shadow-xs folio-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0 border border-stone-200 dark:border-stone-700">
              <Users className="h-6 w-6 stroke-[1.75]" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold italic text-stone-900 dark:text-stone-100">
                Class Roster & Analytics
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                Manage enrolled students, bulk CSV rosters, and individual performance.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowImportModal(true)}
              id="bulk-import-roster-btn"
              className="px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-stone-900 dark:hover:border-white bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-heading font-bold text-xs transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Bulk Import Roster</span>
            </button>

            <button
              onClick={handleExportRosterCSV}
              id="export-roster-csv-btn"
              disabled={enrolledStudentsForSubject.length === 0}
              className="px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer disabled:opacity-50 border border-stone-900 dark:border-white"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Roster CSV</span>
            </button>
          </div>
        </div>

        {/* Current Subject Info Card */}
        {currentSubject && (
          <div className="bg-stone-50 dark:bg-stone-900/80 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4 text-xs font-sans">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-heading font-bold text-stone-900 dark:text-white text-sm">
                  {currentSubject.code} • {currentSubject.name}
                </span>
                {currentSubject.meetUrl && (
                  <a
                    href={currentSubject.meetUrl.startsWith('http') ? currentSubject.meetUrl : `https://${currentSubject.meetUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 font-heading font-bold text-xs transition-colors border border-stone-200 dark:border-stone-700"
                  >
                    <Video className="h-3.5 w-3.5 text-stone-500" />
                    <span>Join Meeting</span>
                  </a>
                )}
              </div>
              <p className="text-stone-500 text-[11px]">
                {currentSubject.schedule} | {currentSubject.room} | {currentSubject.teacherName}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-48">
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-900 dark:text-white text-xs font-heading font-bold focus:outline-none focus:border-stone-900 dark:focus:border-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block">Enrolled</span>
                <span className="text-xl font-heading font-bold text-stone-900 dark:text-white">{totalRosterCount}</span>
              </div>

              <div className="text-right pl-4 border-l border-stone-200 dark:border-stone-800">
                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block">Average Rate</span>
                <span className="text-xl font-heading font-bold text-stone-900 dark:text-white">{avgAttendancePct}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="pt-2">
          <div className="relative max-w-sm">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
              placeholder="Search enrolled students by name or ID..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white text-xs focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans"
            />
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xs folio-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-900/80 text-stone-500 dark:text-stone-400 font-mono text-[10px] uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Campus / Section</th>
                <th className="px-6 py-4">Attendance Rate</th>
                <th className="px-6 py-4">Present</th>
                <th className="px-6 py-4">Late</th>
                <th className="px-6 py-4">Excused</th>
                <th className="px-6 py-4">Absent</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-stone-500 font-sans">
                    No students currently found for this subject roster.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((st) => {
                  const stats = getStudentSubjectStats(st.studentId, currentSubject?.id || '');

                  return (
                    <tr key={st.studentId} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition-colors">
                      
                      {/* Name & ID with Avatar */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2.5">
                          <AvatarDisplay avatarId={st.avatar} name={st.studentName} size="sm" />
                          <div>
                            <div className="font-heading font-bold text-stone-900 dark:text-white">
                              {st.studentName}
                            </div>
                            <div className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                              #{st.studentUserCode}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4 whitespace-nowrap text-stone-600 dark:text-stone-300 font-sans">
                        {st.location}
                      </td>

                      {/* Attendance % */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`font-mono font-bold text-xs ${
                            stats.percentage >= 85 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-stone-700 dark:text-stone-300'
                          }`}>
                            {stats.percentage}%
                          </span>
                          <div className="w-16 bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${stats.percentage >= 85 ? 'bg-emerald-500' : 'bg-stone-500'}`} 
                              style={{ width: `${stats.percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Counts */}
                      <td className="px-6 py-4 whitespace-nowrap text-emerald-600 font-mono font-bold">
                        {stats.present}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-amber-600 font-mono font-bold">
                        {stats.late}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sky-600 font-mono font-bold">
                        {stats.excused}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-rose-600 font-mono font-bold">
                        {stats.absent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-stone-500">
                        {stats.total}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {onStartDirectMessage && (
                            <button
                              onClick={() => onStartDirectMessage(st.studentId, st.studentName)}
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer border border-stone-200 dark:border-stone-700"
                              title="Message"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleBlockStudent(st.studentId, st.studentName)}
                            disabled={isProcessingBlock}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer border border-rose-200 dark:border-rose-900/50"
                            title="Block student"
                          >
                            <UserX className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blocked Students Section if any */}
      {blockedStudentProfiles.length > 0 && (
        <div className="bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-6 space-y-3 folio-card">
          <div className="flex items-center space-x-2 text-rose-800 dark:text-rose-300">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider">
              Blocked Students ({blockedStudentProfiles.length})
            </h4>
          </div>
          <p className="text-xs text-rose-700/80 dark:text-rose-400 font-sans">
            These students cannot enroll or mark attendance in {currentSubject?.name}.
          </p>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {blockedStudentProfiles.map((b) => (
              <div
                key={b.uid}
                className="bg-white dark:bg-stone-900 p-3 rounded-2xl border border-rose-200 dark:border-rose-900/50 flex items-center justify-between"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <AvatarDisplay avatarId={b.avatar} name={b.name} size="xs" />
                  <div className="min-w-0">
                    <p className="font-heading font-bold text-stone-900 dark:text-white text-xs truncate">
                      {b.name}
                    </p>
                    <p className="text-[10px] text-stone-400 font-mono">
                      #{b.userCode}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnblockStudent(b.uid)}
                  disabled={isProcessingBlock}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-heading font-bold transition-colors shrink-0 cursor-pointer border border-stone-200 dark:border-stone-700"
                >
                  <Unlock className="h-3 w-3 text-emerald-500" />
                  <span>Unblock</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && currentSubject && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111318] rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-5 folio-card">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div>
                <h3 className="font-display font-bold italic text-lg text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-stone-500" />
                  <span>Bulk Import Student Roster</span>
                </h3>
                <p className="text-xs text-stone-500 font-sans">
                  Target Course: <strong>{currentSubject.code} — {currentSubject.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBulkImport} className="space-y-4 font-sans">
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Upload CSV File or Paste Roster Lines
                </label>
                
                {/* File picker */}
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-stone-200 dark:file:border-stone-800 file:text-xs file:font-heading file:font-bold file:bg-stone-100 dark:file:bg-stone-800 file:text-stone-900 dark:file:text-stone-100 hover:file:bg-stone-200 dark:hover:file:bg-stone-700 cursor-pointer"
                />

                {/* Text Area */}
                <textarea
                  rows={6}
                  value={rawImportText}
                  onChange={(e) => setRawImportText(e.target.value)}
                  placeholder={`Paste student lines, e.g.:\n1001, John Doe\n1002, Alice Smith\n1003, Bob Johnson`}
                  required
                  className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3 text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-900 dark:focus:border-white"
                />
                <p className="text-[11px] text-stone-500">
                  Format accepted: <code>StudentCode, Student Name</code> or just <code>StudentCode</code> per line.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isImporting || !rawImportText.trim()}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 text-xs font-heading font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center space-x-1.5 disabled:opacity-50 border border-stone-900 dark:border-white shadow-2xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{isImporting ? 'Enrolling Students...' : 'Enroll Students in Batch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
