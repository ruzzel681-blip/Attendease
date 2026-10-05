import React, { useState, useEffect } from 'react';
import { AttendanceRecord, Subject } from '../../types';
import { subscribeAllAttendance, subscribeSubjects } from '../../services/attendanceService';
import { 
  FileText, 
  Search, 
  Download, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  FileCheck2, 
  Table 
} from 'lucide-react';

export const AttendanceLogsTab: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Filters
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const unSubAtt = subscribeAllAttendance(setRecords);
    const unSubSub = subscribeSubjects(setSubjects);

    return () => {
      unSubAtt();
      unSubSub();
    };
  }, []);

  // Filter records
  const filteredRecords = records.filter((rec) => {
    if (selectedSubjectId !== 'all' && rec.subjectId !== selectedSubjectId) return false;
    if (statusFilter !== 'all' && rec.status !== statusFilter) return false;
    if (dateFilter && rec.date !== dateFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = rec.studentName.toLowerCase().includes(q);
      const matchCode = rec.studentUserCode.toLowerCase().includes(q);
      const matchSubj = rec.subjectName.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchSubj) return false;
    }
    return true;
  });

  // Sort descending by timestamp
  filteredRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Export Detailed CSV helper
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;

    const headers = ['Date', 'Student ID', 'Student Name', 'Subject Code', 'Subject Name', 'Status', 'PIN Verified', 'Logged By', 'Note'];
    const rows = filteredRecords.map(r => [
      r.date,
      `"${r.studentUserCode}"`,
      `"${r.studentName}"`,
      `"${r.subjectCode}"`,
      `"${r.subjectName}"`,
      r.status.toUpperCase(),
      r.sessionCodeVerified ? 'YES' : 'NO',
      `"${r.markedByName}"`,
      `"${r.note || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Detailed_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Summary Aggregate CSV
  const handleExportSummaryCSV = () => {
    if (records.length === 0) return;

    // Aggregate by student & subject
    const studentMap = new Map<string, {
      studentId: string;
      studentName: string;
      studentCode: string;
      subjectCode: string;
      subjectName: string;
      present: number;
      late: number;
      excused: number;
      absent: number;
      total: number;
    }>();

    const targetRecords = selectedSubjectId === 'all' 
      ? records 
      : records.filter(r => r.subjectId === selectedSubjectId);

    targetRecords.forEach(r => {
      const key = `${r.studentId}_${r.subjectId}`;
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          studentId: r.studentId,
          studentName: r.studentName,
          studentCode: r.studentUserCode,
          subjectCode: r.subjectCode,
          subjectName: r.subjectName,
          present: 0,
          late: 0,
          excused: 0,
          absent: 0,
          total: 0
        });
      }
      const item = studentMap.get(key)!;
      item.total += 1;
      if (r.status === 'present') item.present += 1;
      else if (r.status === 'late') item.late += 1;
      else if (r.status === 'excused') item.excused += 1;
      else if (r.status === 'absent') item.absent += 1;
    });

    const headers = ['Student ID', 'Student Name', 'Subject Code', 'Subject Name', 'Present', 'Late', 'Excused', 'Absent', 'Total Classes', 'Attendance %'];
    const rows = Array.from(studentMap.values()).map(item => {
      const countable = item.total - item.excused;
      const pct = countable > 0 ? Math.round(((item.present + item.late) / countable) * 100) : 100;
      return [
        `"${item.studentCode}"`,
        `"${item.studentName}"`,
        `"${item.subjectCode}"`,
        `"${item.subjectName}"`,
        item.present,
        item.late,
        item.excused,
        item.absent,
        item.total,
        `${pct}%`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Aggregate_Summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Controls */}
      <div className="bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-7 shadow-xs folio-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0 border border-stone-200 dark:border-stone-700">
              <FileText className="h-6 w-6 stroke-[1.75]" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold italic text-stone-900 dark:text-stone-100">
                Attendance Logs & Export
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                Real-time records ledger with institutional CSV & audit export.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportSummaryCSV}
              id="export-summary-csv-btn"
              disabled={records.length === 0}
              className="px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-stone-900 dark:hover:border-white bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 font-heading font-bold text-xs transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <Table className="h-3.5 w-3.5 text-stone-500" />
              <span>Summary CSV</span>
            </button>

            <button
              onClick={handleExportCSV}
              id="export-attendance-csv-btn"
              disabled={filteredRecords.length === 0}
              className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer disabled:opacity-50 border border-stone-900 dark:border-white"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Raw CSV</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          
          {/* Search Input */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1">
              Search Student
            </label>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name or ID..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white text-xs focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans"
              />
            </div>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1">
              Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white text-xs focus:outline-none focus:border-stone-900 dark:focus:border-white font-heading font-bold"
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
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white text-xs focus:outline-none focus:border-stone-900 dark:focus:border-white font-heading font-bold"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
              <option value="absent">Absent</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1">
              Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white text-xs font-mono focus:outline-none focus:border-stone-900 dark:focus:border-white"
            />
          </div>

        </div>
      </div>

      {/* Log Table / Cards */}
      <div className="bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xs folio-card">
        
        {/* Mobile & Tablet Card Layout (< 768px) */}
        <div className="block md:hidden divide-y divide-stone-100 dark:divide-stone-800">
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500 font-sans">
              No attendance records found.
            </div>
          ) : (
            filteredRecords.map((rec) => (
              <div key={rec.id} className="p-4 space-y-2 hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-heading font-bold text-stone-900 dark:text-white text-sm">
                      {rec.studentName}
                    </span>
                    <span className="ml-2 font-mono text-[10px] text-stone-500 dark:text-stone-400">
                      #{rec.studentUserCode}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-heading font-bold text-[10px] uppercase inline-flex items-center ${
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
                </div>

                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span className="font-medium text-stone-700 dark:text-stone-300">
                    {rec.subjectName} ({rec.subjectCode})
                  </span>
                  <span className="font-mono text-[10px]">
                    {rec.date}
                  </span>
                </div>

                <div className="text-[11px] text-stone-400 flex items-center justify-between font-sans">
                  <span>By: {rec.markedByName} {rec.sessionCodeVerified && ' (PIN)'}</span>
                  {rec.note && <span className="italic text-stone-500">Note: {rec.note}</span>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-900/80 text-stone-500 dark:text-stone-400 font-mono text-[10px] uppercase tracking-wider border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Recorded By</th>
                <th className="px-6 py-4">Note</th>
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

                    {/* Student */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-heading font-bold text-stone-900 dark:text-white">
                        {rec.studentName}
                      </div>
                      <div className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                        #{rec.studentUserCode}
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
                      <span className="font-medium text-stone-900 dark:text-white">{rec.markedByName}</span>
                      <span className="text-[10px] text-stone-400 block font-mono">
                        ({rec.markedBy === 'teacher' ? 'Instructor' : 'Self Check-In'})
                        {rec.sessionCodeVerified && ' [PIN]'}
                      </span>
                    </td>

                    {/* Note */}
                    <td className="px-6 py-4 text-stone-600 dark:text-stone-300 max-w-xs truncate font-sans">
                      {rec.note || <span className="text-stone-400 italic">None</span>}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
