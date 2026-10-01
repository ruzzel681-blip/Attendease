import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Subject, 
  Enrollment, 
  AttendanceRecord 
} from '../../types';
import { 
  subscribeStudentAttendance, 
  subscribeStudentEnrollments, 
  subscribeSubjects 
} from '../../services/attendanceService';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  TrendingUp, 
  Award,
  AlertTriangle,
  FileCheck2
} from 'lucide-react';

export const StudentStatsTab: React.FC = () => {
  const { userProfile } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (!userProfile) return;

    const unSubEnr = subscribeStudentEnrollments(userProfile.uid, (enrs) => {
      setEnrollments(enrs.filter(e => e.status === 'approved'));
    });
    const unSubSub = subscribeSubjects(setSubjects);
    const unSubAtt = subscribeStudentAttendance(userProfile.uid, setRecords);

    return () => {
      unSubEnr();
      unSubSub();
      unSubAtt();
    };
  }, [userProfile]);

  const approvedSubjectIds = enrollments.map(e => e.subjectId);
  const mySubjects = subjects.filter(s => approvedSubjectIds.includes(s.id));

  // Calculate Overall Stats with Excused handling
  const totalClasses = records.length;
  const presentCount = records.filter(r => r.status === 'present').length;
  const lateCount = records.filter(r => r.status === 'late').length;
  const absentCount = records.filter(r => r.status === 'absent').length;
  const excusedCount = records.filter(r => r.status === 'excused').length;

  // Excused absences do not penalize the student's attendance percentage
  const countableClasses = totalClasses - excusedCount;
  const overallPercentage = countableClasses > 0 
    ? Math.round(((presentCount + lateCount) / countableClasses) * 100) 
    : 100;

  const isAtRisk = totalClasses > 0 && overallPercentage < 85;

  // Calculate Per-Subject Stats
  const getSubjectStats = (subjectId: string) => {
    const subRecords = records.filter(r => r.subjectId === subjectId);
    const total = subRecords.length;
    const p = subRecords.filter(r => r.status === 'present').length;
    const l = subRecords.filter(r => r.status === 'late').length;
    const a = subRecords.filter(r => r.status === 'absent').length;
    const e = subRecords.filter(r => r.status === 'excused').length;
    const countable = total - e;
    const pct = countable > 0 ? Math.round(((p + l) / countable) * 100) : 100;
    return { total, p, l, a, e, pct, isSubjectAtRisk: total > 0 && pct < 85 };
  };

  return (
    <div className="space-y-6">

      {/* Low Attendance Warning Alert Banner */}
      {isAtRisk && (
        <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3.5 folio-card">
          <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-sm text-rose-800 dark:text-rose-300">
              Institutional Attendance Warning (Under 85%)
            </h3>
            <p className="text-xs text-rose-700/90 dark:text-rose-400 font-sans leading-relaxed">
              Your aggregate attendance rate is currently <strong>{overallPercentage}%</strong>, which falls below the mandatory 85% school threshold. Please consult your instructors immediately or submit documentation for any unexcused absences.
            </p>
          </div>
        </div>
      )}
      
      {/* Overall Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Attendance % Badge */}
        <div className={`rounded-3xl p-5 shadow-xs flex flex-col justify-between folio-card border ${
          isAtRisk
            ? 'bg-rose-950 text-white border-rose-700'
            : 'bg-stone-900 text-stone-100 dark:bg-white dark:text-stone-950 border-stone-800 dark:border-white'
        }`}>
          <div className="flex items-center justify-between opacity-80">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Attendance Rate</span>
            <Award className="h-4 w-4" />
          </div>
          <div className="my-3">
            <span className="text-4xl sm:text-5xl font-heading font-black">{overallPercentage}%</span>
            <p className="text-[11px] opacity-70 mt-1 font-sans">
              {overallPercentage >= 85 ? 'Target met (≥85%)' : 'At Risk (<85%)'}
            </p>
          </div>
          <div className="w-full bg-white/20 dark:bg-black/20 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white dark:bg-stone-950 transition-all duration-500"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
        </div>

        {/* Present Count */}
        <div className="bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-2xs flex flex-col justify-between folio-card">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Present</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-heading font-black text-stone-900 dark:text-white">{presentCount}</span>
            <span className="text-xs text-stone-400 ml-1 font-mono">sessions</span>
          </div>
          <span className="text-[11px] text-stone-500 font-sans">On time</span>
        </div>

        {/* Late Count */}
        <div className="bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-2xs flex flex-col justify-between folio-card">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Late</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-heading font-black text-stone-900 dark:text-white">{lateCount}</span>
            <span className="text-xs text-stone-400 ml-1 font-mono">sessions</span>
          </div>
          <span className="text-[11px] text-stone-500 font-sans">Tardy arrival</span>
        </div>

        {/* Excused Count */}
        <div className="bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-2xs flex flex-col justify-between folio-card">
          <div className="flex items-center justify-between text-sky-600 dark:text-sky-400">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Excused</span>
            <FileCheck2 className="h-4 w-4" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-heading font-black text-stone-900 dark:text-white">{excusedCount}</span>
            <span className="text-xs text-stone-400 ml-1 font-mono">sessions</span>
          </div>
          <span className="text-[11px] text-stone-500 font-sans">Authorized leave</span>
        </div>

        {/* Absent Count */}
        <div className="bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-2xs flex flex-col justify-between folio-card">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Absent</span>
            <XCircle className="h-4 w-4" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-heading font-black text-stone-900 dark:text-white">{absentCount}</span>
            <span className="text-xs text-stone-400 ml-1 font-mono">sessions</span>
          </div>
          <span className="text-[11px] text-stone-500 font-sans">Unexcused</span>
        </div>

      </div>

      {/* Subject Breakdown */}
      <div className="bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-7 shadow-2xs space-y-5 folio-card">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
          <div>
            <h3 className="text-lg font-display font-bold italic text-stone-900 dark:text-white flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-stone-700 dark:text-stone-300" />
              <span>Subject Breakdown</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
              Individual course attendance rates and standing.
            </p>
          </div>
        </div>

        {mySubjects.length === 0 ? (
          <div className="py-12 text-center text-stone-500 text-xs font-sans">
            No enrolled courses found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mySubjects.map((subj) => {
              const stats = getSubjectStats(subj.id);

              return (
                <div 
                  key={subj.id}
                  className={`border rounded-2xl p-5 space-y-4 transition-all ${
                    stats.isSubjectAtRisk
                      ? 'bg-rose-500/5 border-rose-300 dark:border-rose-900/60'
                      : 'bg-stone-50/70 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-stone-500 dark:text-stone-400">
                        {subj.code}
                      </span>
                      <h4 className="font-heading font-bold text-stone-900 dark:text-white text-base">
                        {subj.name}
                      </h4>
                      <p className="text-xs text-stone-500 font-sans">
                        Faculty: {subj.teacherName}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className={`text-2xl font-black font-heading ${
                        stats.pct >= 85 
                          ? 'text-emerald-700 dark:text-emerald-400' 
                          : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {stats.pct}%
                      </div>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                        stats.pct >= 85
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {stats.pct >= 85 ? 'Good Standing' : 'At Risk'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        stats.pct >= 85 ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                      style={{ width: `${stats.pct}%` }}
                    />
                  </div>

                  {/* Mini Counters */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono pt-1">
                    <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                      <span className="text-stone-400 text-[10px] block">Present</span>
                      <strong className="text-emerald-600 font-bold">{stats.p}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                      <span className="text-stone-400 text-[10px] block">Late</span>
                      <strong className="text-amber-600 font-bold">{stats.l}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                      <span className="text-stone-400 text-[10px] block">Excused</span>
                      <strong className="text-sky-600 font-bold">{stats.e}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                      <span className="text-stone-400 text-[10px] block">Absent</span>
                      <strong className="text-rose-600 font-bold">{stats.a}</strong>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
