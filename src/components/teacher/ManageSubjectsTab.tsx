import React, { useState, useEffect } from 'react';
import { Subject } from '../../types';
import { 
  subscribeSubjects, 
  createSubject, 
  updateSubject, 
  deleteSubject 
} from '../../services/attendanceService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BookOpen, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  UserCheck, 
  Video 
} from 'lucide-react';

export const ManageSubjectsTab: React.FC = () => {
  const { userProfile, showToast } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState('');
  const [room, setRoom] = useState('');
  const [meetUrl, setMeetUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick subject input state
  const [quickSubjectName, setQuickSubjectName] = useState('');

  // Filter mode: 'my' = teacher's own subjects, 'all' = all subjects in the system
  const [filterMode, setFilterMode] = useState<'my' | 'all'>('my');

  useEffect(() => {
    const unsubscribe = subscribeSubjects(setSubjects);
    return () => unsubscribe();
  }, []);

  const openCreateModal = () => {
    setEditingSubject(null);
    setCode('');
    setName('');
    setSchedule('Mon/Wed/Fri 09:00 AM - 10:30 AM');
    setRoom('Room 101');
    setMeetUrl('');
    setShowModal(true);
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setCode(subject.code);
    setName(subject.name);
    setSchedule(subject.schedule || '');
    setRoom(subject.room || '');
    setMeetUrl(subject.meetUrl || '');
    setShowModal(true);
  };

  const handleQuickAddSubject = async (subjectName: string) => {
    if (!userProfile) return;
    const trimmed = subjectName.trim();
    if (!trimmed) return;

    // Check if already in my subjects
    const existing = subjects.find(s => s.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (existing.teacherId === userProfile.uid) {
        showToast(`You already teach ${trimmed}.`, 'info');
        return;
      }
      // If subject exists but taught by someone else or unassigned, claim it
      await handleClaimSubject(existing);
      setQuickSubjectName('');
      return;
    }

    // Auto-generate code from initials
    const words = trimmed.split(' ').filter(Boolean);
    const codePrefix = words.map(w => w[0].toUpperCase()).join('').slice(0, 4);
    const randomNum = Math.floor(100 + Math.random() * 900);
    const generatedCode = `${codePrefix || 'SUB'}${randomNum}`;

    try {
      await createSubject(
        generatedCode,
        trimmed,
        userProfile.uid,
        userProfile.name,
        'Mon/Wed/Fri 09:00 AM - 10:30 AM',
        'Room 101'
      );
      showToast(`Subject '${trimmed}' added.`, 'success');
      setQuickSubjectName('');
    } catch (err: any) {
      showToast(err.message || 'Failed to add subject.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    if (!code.trim() || !name.trim()) {
      showToast('Code and Name are required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSubject) {
        await updateSubject(
          editingSubject.id,
          {
            code: code.trim().toUpperCase(),
            name: name.trim(),
            schedule: schedule.trim() || 'TBD',
            room: room.trim() || 'TBD',
            meetUrl: meetUrl.trim() || undefined
          },
          userProfile.name
        );
        showToast('Subject updated.', 'success');
      } else {
        await createSubject(
          code.trim().toUpperCase(),
          name.trim(),
          userProfile.uid,
          userProfile.name,
          schedule,
          room,
          meetUrl.trim() || undefined
        );
        showToast('Subject created.', 'success');
      }

      setShowModal(false);
      setCode('');
      setName('');
      setMeetUrl('');
      setEditingSubject(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to save subject.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimSubject = async (subject: Subject) => {
    if (!userProfile) return;
    try {
      await updateSubject(
        subject.id,
        {
          teacherId: userProfile.uid,
          teacherName: userProfile.name
        },
        userProfile.name
      );
      showToast(`Assigned as teacher for ${subject.code}.`, 'success');
    } catch (err: any) {
      showToast('Failed to assign subject.', 'error');
    }
  };

  const handleDelete = async (subject: Subject) => {
    if (!userProfile) return;
    if (window.confirm(`Delete subject "${subject.name}" (${subject.code})?`)) {
      try {
        await deleteSubject(subject.id, subject.code, userProfile.name);
        showToast(`Subject ${subject.code} deleted.`, 'info');
      } catch (err: any) {
        showToast('Failed to delete subject.', 'error');
      }
    }
  };

  const mySubjects = subjects.filter(s => s.teacherId === userProfile?.uid);
  const displayedSubjects = filterMode === 'my' ? mySubjects : subjects;

  const DEFAULT_SUBJECT_OPTIONS = [
    'Mathematics',
    'Science & Technology',
    'Computer Science',
    'English & Literature',
    'History & Civics',
    'Web Development',
    'Physics & Engineering'
  ];

  return (
    <div className="space-y-6">
      
      {/* Quick Add Widget */}
      <div className="bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-7 shadow-xs folio-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-stone-500" />
            <span>Quick Add Subject</span>
          </h4>
          <span className="text-[11px] text-stone-500 font-sans">Type or click a preset to add</span>
        </div>

        {/* Input Field */}
        <div className="flex gap-2">
          <input
            type="text"
            id="manage-quick-subject-input"
            value={quickSubjectName}
            onChange={(e) => setQuickSubjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleQuickAddSubject(quickSubjectName);
              }
            }}
            placeholder="Type subject name..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white text-xs font-sans focus:outline-none focus:border-stone-900 dark:focus:border-white transition-all"
          />
          <button
            type="button"
            onClick={() => handleQuickAddSubject(quickSubjectName)}
            id="manage-quick-add-subject-btn"
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-heading font-bold text-xs uppercase tracking-wider shrink-0 transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer border border-stone-900 dark:border-white"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {DEFAULT_SUBJECT_OPTIONS.map((sub) => {
            const isAssigned = mySubjects.some(s => s.name.toLowerCase() === sub.toLowerCase());
            return (
              <button
                key={sub}
                type="button"
                onClick={() => {
                  if (!isAssigned) {
                    handleQuickAddSubject(sub);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all border flex items-center space-x-1.5 cursor-pointer ${
                  isAssigned
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-950 border-stone-900 dark:border-white shadow-2xs'
                    : 'bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600'
                }`}
              >
                {isAssigned && <CheckCircle2 className="h-3.5 w-3.5" />}
                <span>{sub}</span>
                {!isAssigned && <span className="text-[10px] text-stone-400 font-mono ml-1">+</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Header & Add Button */}
      <div className="bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-7 shadow-xs folio-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0 border border-stone-200 dark:border-stone-700">
              <BookOpen className="h-6 w-6 stroke-[1.75]" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold italic text-stone-900 dark:text-stone-100">
                Subjects
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                Manage course schedules and assignments.
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            id="open-add-subject-modal-btn"
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-heading font-bold text-xs uppercase tracking-wider shadow-2xs flex items-center space-x-1.5 self-start sm:self-auto transition-all cursor-pointer border border-stone-900 dark:border-white"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>New Subject</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center space-x-2 border-t border-stone-100 dark:border-stone-800 pt-4">
          <button
            onClick={() => setFilterMode('my')}
            className={`px-3.5 py-1.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer border ${
              filterMode === 'my'
                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950 border-stone-900 dark:border-white shadow-2xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 border-transparent'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>My Subjects ({mySubjects.length})</span>
          </button>

          <button
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-1.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer border ${
              filterMode === 'all'
                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950 border-stone-900 dark:border-white shadow-2xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 border-transparent'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>All Subjects ({subjects.length})</span>
          </button>
        </div>
      </div>

      {/* Grid of Subjects */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedSubjects.length === 0 ? (
          <div className="col-span-full bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl p-10 text-center space-y-2 folio-card">
            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 mx-auto border border-stone-200 dark:border-stone-700">
              <BookOpen className="h-5 w-5" />
            </div>
            <h4 className="font-heading font-bold text-stone-900 dark:text-white text-sm">
              {filterMode === 'my' ? 'No subjects assigned yet' : 'No subjects registered'}
            </h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto font-sans">
              {filterMode === 'my' 
                ? 'Switch to All Subjects to assign yourself or create a new one.'
                : 'Click New Subject to create one.'}
            </p>
          </div>
        ) : (
          displayedSubjects.map((subj) => {
            const isMySubject = subj.teacherId === userProfile?.uid;

            return (
              <div 
                key={subj.id}
                className={`bg-white/95 dark:bg-[#111318]/95 border rounded-3xl p-5 shadow-xs space-y-3 flex flex-col justify-between transition-all folio-card ${
                  isMySubject
                    ? 'border-stone-400 dark:border-stone-600'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 font-mono font-bold text-xs text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700">
                      {subj.code}
                    </span>

                    {isMySubject ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-heading font-bold uppercase">
                        <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                        Teaching
                      </span>
                    ) : (
                      <button
                        onClick={() => handleClaimSubject(subj)}
                        className="text-[10px] font-heading font-bold uppercase tracking-wider text-stone-900 dark:text-white hover:underline flex items-center cursor-pointer"
                      >
                        <UserCheck className="h-3 w-3 mr-1" />
                        Assign to Me
                      </button>
                    )}
                  </div>

                  <h4 className="text-base font-display font-bold italic text-stone-900 dark:text-white">
                    {subj.name}
                  </h4>

                  <div className="text-xs text-stone-500 space-y-1.5 bg-stone-50 dark:bg-stone-900 p-3 rounded-2xl border border-stone-200 dark:border-stone-800 font-sans">
                    <div className="flex items-center space-x-1.5">
                      <User className="h-3.5 w-3.5 text-stone-400" />
                      <span>Instructor: <strong className="text-stone-800 dark:text-stone-200">{subj.teacherName || 'Unassigned'}</strong></span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Clock className="h-3.5 w-3.5 text-stone-400" />
                      <span>{subj.schedule}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="h-3.5 w-3.5 text-stone-400" />
                      <span>{subj.room}</span>
                    </div>

                    {subj.meetUrl && (
                      <div className="pt-1">
                        <a
                          href={subj.meetUrl.startsWith('http') ? subj.meetUrl : `https://${subj.meetUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 font-heading font-bold text-[11px] transition-colors border border-stone-200 dark:border-stone-700"
                        >
                          <Video className="h-3.5 w-3.5 text-stone-500" />
                          <span>Join Meeting</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <span className="text-[10px] text-stone-400 font-mono">
                    #{subj.id.slice(0, 6)}
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(subj)}
                      className="px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-heading font-bold text-[11px] uppercase tracking-wider flex items-center space-x-1 transition-colors cursor-pointer border border-stone-200 dark:border-stone-700"
                      title="Edit Subject"
                    >
                      <Edit3 className="h-3 w-3 text-stone-500" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDelete(subj)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete Subject"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Subject Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#111318] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 folio-card">
            
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
              <h3 className="text-lg font-display font-bold italic text-stone-900 dark:text-white flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-stone-500" />
                <span>{editingSubject ? 'Edit Subject' : 'New Subject'}</span>
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. MATH101"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white text-xs font-mono uppercase focus:outline-none focus:border-stone-900 dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mathematics I"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white text-xs font-sans focus:outline-none focus:border-stone-900 dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                  Schedule
                </label>
                <input
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="e.g. Mon/Wed 09:00 AM - 10:30 AM"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white text-xs font-sans focus:outline-none focus:border-stone-900 dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                  Room
                </label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. Room 101"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white text-xs font-sans focus:outline-none focus:border-stone-900 dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1 flex items-center space-x-1.5">
                  <Video className="h-3.5 w-3.5 text-stone-500" />
                  <span>Meeting Link (Optional)</span>
                </label>
                <input
                  type="url"
                  value={meetUrl}
                  onChange={(e) => setMeetUrl(e.target.value)}
                  placeholder="e.g. https://meet.google.com/xyz"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white text-xs font-sans focus:outline-none focus:border-stone-900 dark:focus:border-white"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-heading font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  id="confirm-create-subject-btn"
                  className="flex-1 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 text-xs font-heading font-bold uppercase tracking-wider shadow-2xs flex items-center justify-center space-x-1 cursor-pointer border border-stone-900 dark:border-white"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-stone-950/30 dark:border-t-stone-950 rounded-full animate-spin" />
                  ) : (
                    <span>{editingSubject ? 'Save' : 'Create'}</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
