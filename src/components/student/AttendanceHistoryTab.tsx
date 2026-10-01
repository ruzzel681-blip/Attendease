import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AttendanceRecord, Subject, AttendanceStatus, AttendanceCorrectionRequest } from '../../types';
import { 
  subscribeStudentAttendance, 
  subscribeSubjects,
  submitAttendanceCorrectionRequest,
  subscribeAttendanceCorrectionRequests
} from '../../services/attendanceService';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  FileCheck2,
  HelpCircle,
  X,
  Send
} from 'lucide-react';

export const AttendanceHistoryTab: React.FC = () => {
  const { userProfile, showToast } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [disputes, setDisputes] = useState<AttendanceCorrectionRequest[]>([]);

  // Filters
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchDate, setSearchDate] = useState<string>('');

  // Dispute Request modal state
  const [disputeRecord, setDisputeRecord] = useState<AttendanceRecord | null>(null);
  const [requestedStatus, setRequestedStatus] = useState<AttendanceStatus>('present');
  const [disputeReason, setDisputeReason] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  useEffect(() => {
    if (!userProfile) return;

    const unSubAtt = subscribeStudentAttendance(userProfile.uid, setRecords);
    const unSubSub = subscribeSubjects(setSubjects);
    const unSubDisputes = subscribeAttendanceCorrectionRequests(
      { studentId: userProfile.uid },
      setDisputes
    );

    return () => {
      unSubAtt();
      unSubSub();
      unSubDisputes();
    };
  }, [userProfile]);

  // Sort descending by timestamp
  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Apply filters
  const filteredRecords = sortedRecords.filter((rec) => {
    if (selectedSubjectId !== 'all' && rec.subjectId !== selectedSubjectId) return false;
    if (statusFilter !== 'all' && rec.status !== statusFilter) return false;
    if (searchDate && !rec.date.includes(searchDate)) return false;
    return true;
  });

  const handleOpenDispute = (rec: AttendanceRecord) => {
    setDisputeRecord(rec);
    setRequestedStatus(rec.status === 'absent' ? 'present' : 'excused');
    setDisputeReason('');
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !disputeRecord) return;
    if (!disputeReason.trim()) {
      showToast('Please provide a reason for the correction request.', 'error');
      return;
    }

    setIsSubmittingDispute(true);
    try {
      const subjectObj = subjects.find(s => s.id === disputeRecord.subjectId);
      await submitAttendanceCorrectionRequest({
        attendanceRecordId: disputeRecord.id,
        studentId: userProfile.uid,
        studentName: userProfile.name,
        studentUserCode: userProfile.userCode,
        subjectId: disputeRecord.subjectId,
        subjectCode: disputeRecord.subjectCode,
        subjectName: disputeRecord.subjectName,
        teacherId: subjectObj?.teacherId || '',
        date: disputeRecord.date,
        currentStatus: disputeRecord.status,
        requestedStatus,
        reason: disputeReason.trim()
      });

      showToast('Attendance correction request submitted to instructor.', 'success');
      setDisputeRecord(null);
    } catch (err: any) {
      showToast(`Submission error: ${err.message}`, 'error');
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-7 shadow-2xs folio-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-900 text-stone-900 dark:text-stone-100 flex items-center justify-center shrink-0 border border-stone-200 dark:border-stone-800">
              <Calendar className="h-6 w-6 stroke-[1.75]" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold italic text-stone-900 dark:text-stone-100">
                Attendance History
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                Full class attendance ledger with dispute and correction options.
              </p>
            </div>
          </div>

          <div className="text-xs text-stone-500 font-mono bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 self-start md:self-auto">
            Records: <strong className="text-stone-900 dark:text-stone-100">{filteredRecords.length}</strong>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          
          {/* Subject Filter */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1">
              Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white text-xs font-heading font-bold focus:outline-none focus:border-stone-900 dark:focus:border-white"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white text-xs font-heading font-bold focus:outline-none focus:border-stone-900 dark:focus:border-white"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
              <option value="absent">Absent</option>
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1">
              Date
            </label>
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white text-xs font-mono focus:outline-none focus:border-stone-900 dark:focus:border-white"
            />
          </div>

        </div>
      </div>

      {/* Pending Correction Requests Tracker */}
      {disputes.length > 0 && (
        <div className="p-5 rounded-3xl bg-stone-100/70 dark:bg-stone-900/70 border border-stone-300 dark:border-stone-700 space-y-3">
          <div className="flex items-center space-x-2">
            <HelpCircle className="h-4 w-4 text-stone-700 dark:text-stone-300" />
            <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
              My Submitted Correction Requests ({disputes.length})
            </h4>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {disputes.map(d => (
              <div key={d.id} className="p-3 rounded-2xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 dark:text-stone-100 font-mono">{d.subjectCode} — {d.date}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                    d.status === 'pending'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : d.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}>
                    {d.status}
                  </span>
                </div>
                <div className="text-stone-500">
                  Requested: <span className="uppercase font-bold text-stone-700 dark:text-stone-300">{d.requestedStatus}</span> (Marked: {d.currentStatus})
                </div>
                <div className="text-[11px] text-stone-600 dark:text-stone-400 italic">
                  "{d.reason}"
                </div>
                {d.teacherNote && (
                  <div className="text-[11px] font-mono text-stone-700 dark:text-stone-300 pt-1">
                    Teacher Note: {d.teacherNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-2xs folio-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-900/80 text-stone-500 dark:text-stone-400 font-mono text-[10px] uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Marked By</th>
                <th className="px-6 py-4">Note</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-stone-500 font-sans">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition-colors">
                    
                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-stone-900 dark:text-white font-mono">
                        {rec.date}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono">
                        {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-heading font-bold text-stone-900 dark:text-white">
                        {rec.subjectName}
                      </div>
                      <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400">
                        {rec.subjectCode}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full font-heading font-bold text-[10px] uppercase inline-flex items-center space-x-1 ${
                        rec.status === 'present'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : rec.status === 'late'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                          : rec.status === 'excused'
                          ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                      }`}>
                        {rec.status === 'present' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {rec.status === 'late' && <Clock className="h-3 w-3 mr-1" />}
                        {rec.status === 'excused' && <FileCheck2 className="h-3 w-3 mr-1" />}
                        {rec.status === 'absent' && <XCircle className="h-3 w-3 mr-1" />}
                        <span>{rec.status}</span>
                      </span>
                    </td>

                    {/* Logged By */}
                    <td className="px-6 py-4 whitespace-nowrap text-stone-600 dark:text-stone-300">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                        {rec.markedBy === 'teacher' ? `Teacher (${rec.markedByName})` : 'Self Check-In'}
                        {rec.sessionCodeVerified && ' (PIN)'}
                      </span>
                    </td>

                    {/* Note */}
                    <td className="px-6 py-4 text-stone-600 dark:text-stone-300 max-w-xs truncate font-sans">
                      {rec.note || <span className="text-stone-400 text-[11px] italic">None</span>}
                    </td>

                    {/* Dispute Action */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleOpenDispute(rec)}
                        className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Dispute
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispute Modal */}
      {disputeRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16181e] rounded-3xl max-w-md w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-5 w-5 text-stone-700 dark:text-stone-300" />
                <h3 className="font-display font-bold italic text-base text-stone-900 dark:text-stone-100">
                  Request Attendance Correction
                </h3>
              </div>
              <button
                onClick={() => setDisputeRecord(null)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs space-y-1">
              <div>Subject: <strong>{disputeRecord.subjectName} ({disputeRecord.subjectCode})</strong></div>
              <div>Date: <strong className="font-mono">{disputeRecord.date}</strong></div>
              <div>Current Ledger Status: <span className="uppercase font-bold text-rose-600">{disputeRecord.status}</span></div>
            </div>

            <form onSubmit={handleSubmitDispute} className="space-y-3">
              <div>
                <label className="block text-xs font-heading font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Requested Correction Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRequestedStatus('present')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      requestedStatus === 'present'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestedStatus('late')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      requestedStatus === 'late'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    Late
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestedStatus('excused')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      requestedStatus === 'excused'
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    Excused
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Reason & Justification
                </label>
                <textarea
                  rows={3}
                  required
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Explain why this record should be corrected (e.g. submitted doctor excuse slip, wifi issue in lab)..."
                  className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisputeRecord(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer font-heading"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDispute}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 text-xs font-heading font-bold cursor-pointer transition-all flex items-center space-x-1.5 border border-stone-900 dark:border-white"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSubmittingDispute ? 'Submitting...' : 'Send to Instructor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
