import React, { useEffect, useState } from 'react';
import { BookOpen, Copy, Check, LogIn, Clock, CheckCircle2 } from 'lucide-react';
import { Announcement, Enrollment, Subject, UserProfile } from '../../types';
import {
  subscribeSubjects,
  subscribeStudentEnrollments,
  requestEnrollment
} from '../../services/attendanceService';
import { useAuth } from '../../contexts/AuthContext';

interface ClassInviteBoxProps {
  announcement: Announcement;
  userProfile: UserProfile;
}

/**
 * Shown on a broadcast that shares a class code. Students (even with no class yet)
 * can copy the code or request to join straight from here; the class's teacher
 * still approves each request.
 */
export const ClassInviteBox: React.FC<ClassInviteBoxProps> = ({ announcement, userProfile }) => {
  const { showToast } = useAuth();
  const isStudent = userProfile.role === 'student';
  const [subject, setSubject] = useState<Subject | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);

  const subjectId = announcement.inviteSubjectId;

  useEffect(() => {
    if (!subjectId || !isStudent) return;
    const unSubSubjects = subscribeSubjects((all) => setSubject(all.find((s) => s.id === subjectId) || null));
    const unSubEnr = subscribeStudentEnrollments(userProfile.uid, setEnrollments);
    return () => {
      unSubSubjects();
      unSubEnr();
    };
  }, [subjectId, isStudent, userProfile.uid]);

  if (!subjectId) return null;

  const code = announcement.inviteSubjectCode || '';
  const name = announcement.inviteSubjectName || '';
  const mine = enrollments.find((e) => e.subjectId === subjectId);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleJoin = async () => {
    if (!subject) {
      showToast('That class is no longer available.', 'error');
      return;
    }
    setJoining(true);
    try {
      await requestEnrollment(userProfile, subject);
      showToast(`Request to join ${subject.name} sent to the teacher!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not send the request.', 'error');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/60 p-3 text-xs font-mono">
      <BookOpen className="h-4 w-4 text-stone-500 dark:text-stone-400 shrink-0" />
      <span className="text-stone-500 dark:text-stone-400">Join class:</span>
      <span className="font-bold text-stone-900 dark:text-white">{name}</span>
      <span className="px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-white font-bold tracking-wider border border-stone-300 dark:border-stone-700">
        {code}
      </span>
      <button
        onClick={handleCopy}
        className="px-2 py-1 rounded-lg border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1 cursor-pointer"
      >
        {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>

      {isStudent && (
        <div className="sm:ml-auto">
          {mine?.status === 'approved' ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Enrolled
            </span>
          ) : mine?.status === 'pending' ? (
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
              <Clock className="h-3.5 w-3.5" /> Request sent
            </span>
          ) : mine?.status === 'rejected' ? (
            <span className="text-rose-600 dark:text-rose-400 font-bold">Not accepted</span>
          ) : (
            <button
              onClick={handleJoin}
              disabled={joining || !subject}
              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <LogIn className="h-3.5 w-3.5" />
              {joining ? 'Sending...' : 'Request to join'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
