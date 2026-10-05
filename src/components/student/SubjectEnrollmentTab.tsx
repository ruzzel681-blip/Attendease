import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Subject, Enrollment } from '../../types';
import { 
  subscribeSubjects, 
  subscribeStudentEnrollments, 
  requestEnrollment 
} from '../../services/attendanceService';
import { 
  BookOpen, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  Clock3, 
  User, 
  MapPin,
  Video,
  ShieldAlert
} from 'lucide-react';

export const SubjectEnrollmentTab: React.FC = () => {
  const { userProfile, showToast } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [submittingSubjectId, setSubmittingSubjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile) return;

    const unSubSubjects = subscribeSubjects(setSubjects);
    const unSubEnrollments = subscribeStudentEnrollments(userProfile.uid, setEnrollments);

    return () => {
      unSubSubjects();
      unSubEnrollments();
    };
  }, [userProfile]);

  const handleApply = async (subject: Subject) => {
    if (!userProfile) return;

    if (subject.blockedStudentIds?.includes(userProfile.uid)) {
      showToast('You are blocked from enrolling in this subject by the instructor.', 'error');
      return;
    }

    setSubmittingSubjectId(subject.id);

    try {
      await requestEnrollment(userProfile, subject);
      showToast(`Enrollment request for '${subject.name}' sent to Teacher!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to apply for subject.', 'error');
    } finally {
      setSubmittingSubjectId(null);
    }
  };

  const getEnrollmentStatus = (subjectId: string): Enrollment | undefined => {
    return enrollments.find(e => e.subjectId === subjectId);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-2xs folio-card space-y-2">
        <h3 className="text-xl font-display font-bold italic text-stone-900 dark:text-white flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-stone-700 dark:text-stone-300" />
          <span>Available Subjects</span>
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
          Apply for subjects to start attending classes. Teacher approval required.
        </p>
      </div>

      {/* Grid of Subjects */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-[#111318] border border-stone-200 dark:border-stone-800 rounded-3xl p-8 text-center text-xs text-stone-500 font-sans folio-card">
            No subjects available yet.
          </div>
        ) : (
          subjects.map((subj) => {
            const enrollment = getEnrollmentStatus(subj.id);

            return (
              <div 
                key={subj.id}
                className="bg-white/95 dark:bg-[#111318]/95 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-2xs hover:border-stone-400 dark:hover:border-stone-600 transition-all flex flex-col justify-between space-y-4 folio-card"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-mono font-bold text-xs border border-stone-200 dark:border-stone-700">
                      {subj.code}
                    </span>

                    {/* Enrollment Status Pill */}
                    {userProfile?.uid && subj.blockedStudentIds?.includes(userProfile.uid) ? (
                      <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center space-x-1">
                        <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                        <span>Blocked</span>
                      </span>
                    ) : enrollment ? (
                      enrollment.status === 'approved' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center space-x-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Enrolled</span>
                        </span>
                      ) : enrollment.status === 'pending' ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center space-x-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          <span>Pending Approval</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-xs font-bold">
                          Rejected
                        </span>
                      )
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs font-semibold">
                        Not Enrolled
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-lg font-display font-bold text-stone-900 dark:text-white">
                      {subj.name}
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 flex items-center space-x-1 font-sans">
                      <User className="h-3.5 w-3.5 text-stone-400" />
                      <span>Faculty: {subj.teacherName}</span>
                    </p>
                  </div>

                  <div className="text-xs text-stone-500 dark:text-stone-400 space-y-1.5 bg-stone-50 dark:bg-stone-900/60 p-3 rounded-2xl border border-stone-100 dark:border-stone-800 font-sans">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="h-3.5 w-3.5 text-stone-400" />
                      <span>{subj.schedule}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="h-3.5 w-3.5 text-stone-400" />
                      <span>{subj.room}</span>
                    </div>

                    {/* Google Meet Link if enrolled */}
                    {enrollment?.status === 'approved' && subj.meetUrl && (
                      <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800">
                        <a
                          href={subj.meetUrl.startsWith('http') ? subj.meetUrl : `https://${subj.meetUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white font-bold text-xs transition-colors"
                        >
                          <Video className="h-3.5 w-3.5 text-stone-300" />
                          <span>Join Video Call</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Apply Button or Blocked Notice */}
                {userProfile?.uid && subj.blockedStudentIds?.includes(userProfile.uid) ? (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold text-center font-sans">
                    Enrollment suspended by instructor
                  </div>
                ) : !enrollment && (
                  <button
                    onClick={() => handleApply(subj)}
                    disabled={submittingSubjectId === subj.id}
                    id={`apply-enrollment-btn-${subj.code}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-heading font-bold text-xs shadow-2xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer border border-stone-900 dark:border-white"
                  >
                    {submittingSubjectId === subj.id ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-stone-950/30 dark:border-t-stone-950 rounded-full animate-spin" />
                    ) : (
                      <>
                        <PlusCircle className="h-4 w-4" />
                        <span>Apply for Enrollment</span>
                      </>
                    )}
                  </button>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
