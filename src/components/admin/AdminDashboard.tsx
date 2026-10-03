import React, { useEffect, useMemo, useState } from 'react';
import { UserProfile, UserStatus } from '../../types';
import { subscribeAllUsers, setTeacherStatusByAdmin } from '../../services/attendanceService';
import { useAuth } from '../../contexts/AuthContext';
import { AvatarDisplay } from '../common/AvatarDisplay';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  Search,
  Users,
  GraduationCap,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';

type Filter = UserStatus | 'all';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Revoked / Rejected' },
  { id: 'all', label: 'All' }
];

const STATUS_STYLES: Record<UserStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  approved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  rejected: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
};

export const AdminDashboard: React.FC = () => {
  const { userProfile, showToast } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filter, setFilter] = useState<Filter>('pending');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<UserProfile | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  useEffect(() => subscribeAllUsers(setUsers), []);

  const teachers = useMemo(() => users.filter(u => u.role === 'teacher'), [users]);
  const studentCount = useMemo(() => users.filter(u => u.role === 'student').length, [users]);
  const count = (s: UserStatus) => teachers.filter(t => t.status === s).length;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers
      .filter(t => filter === 'all' || t.status === filter)
      .filter(t =>
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.userCode.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.departmentOrLocation || '').toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [teachers, filter, search]);

  if (!userProfile) return null;

  const approve = async (t: UserProfile) => {
    setBusyId(t.uid);
    try {
      await setTeacherStatusByAdmin(t.uid, 'approved', { uid: userProfile.uid, name: userProfile.name });
      showToast(
        t.status === 'rejected' ? `Restored access for ${t.name}` : `Approved ${t.name} as a teacher`,
        'success'
      );
    } catch (err: any) {
      showToast(`Could not approve: ${err.message}`, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const confirmRevoke = async () => {
    if (!revokeTarget) return;
    const t = revokeTarget;
    setBusyId(t.uid);
    try {
      await setTeacherStatusByAdmin(
        t.uid,
        'rejected',
        { uid: userProfile.uid, name: userProfile.name },
        revokeReason
      );
      showToast(
        t.status === 'approved' ? `Revoked teacher access for ${t.name}` : `Rejected ${t.name}`,
        'info'
      );
      setRevokeTarget(null);
      setRevokeReason('');
    } catch (err: any) {
      showToast(`Could not update: ${err.message}`, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const cards = [
    { label: 'Pending review', value: count('pending'), icon: Clock },
    { label: 'Approved teachers', value: count('approved'), icon: GraduationCap },
    { label: 'Revoked / rejected', value: count('rejected'), icon: UserX },
    { label: 'Students', value: studentCount, icon: Users }
  ];

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 shadow-xs folio-card flex items-center space-x-3.5">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0 border border-stone-200 dark:border-stone-700">
          <ShieldCheck className="h-6 w-6 stroke-[1.75]" />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold italic text-stone-900 dark:text-stone-100">
            Administrator Console
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
            Approve new teachers and revoke teacher access. Revoked teachers are locked out immediately.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="p-4 rounded-2xl bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 folio-card"
          >
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">{label}</span>
              <Icon className="h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-display font-bold text-stone-900 dark:text-stone-100">{value}</div>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === f.id
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              {f.label}
              {f.id !== 'all' && (
                <span className="ml-1.5 font-mono opacity-70">{count(f.id as UserStatus)}</span>
              )}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search className="h-4 w-4 absolute left-3.5 top-3.5 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, ID, email, department..."
            className="w-full pl-10 pr-4 py-3 bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-2xl text-xs font-sans text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-stone-900 dark:focus:border-white shadow-xs"
          />
        </div>
      </div>

      {/* Teacher list */}
      <div className="space-y-3">
        {visible.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 space-y-2 folio-card">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto opacity-70" />
            <h3 className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100">
              No teachers here
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
              {filter === 'pending' ? 'No teacher registrations are waiting for approval.' : 'Nothing matches this filter.'}
            </p>
          </div>
        ) : (
          visible.map(t => (
            <div
              key={t.uid}
              className="p-5 rounded-3xl bg-white/95 dark:bg-[#111318]/95 border border-stone-200 dark:border-stone-800 shadow-xs hover:border-stone-300 dark:hover:border-stone-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 folio-card"
            >
              <div className="flex items-center space-x-3.5 min-w-0">
                <AvatarDisplay avatarId={t.avatar} name={t.name} size="md" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                      {t.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono font-bold text-[10px] border border-stone-200 dark:border-stone-700">
                      {t.userCode}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${STATUS_STYLES[t.status]}`}>
                      {t.status === 'rejected' ? 'revoked' : t.status}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans">
                    <span>{t.email}</span>
                    <span>•</span>
                    <span>{t.departmentOrLocation}</span>
                    <span>•</span>
                    <span className="font-mono text-[10px] text-stone-400">
                      Registered {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {t.subjectsTaught && t.subjectsTaught.length > 0 && (
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 font-mono">
                      Subjects: {t.subjectsTaught.join(', ')}
                    </div>
                  )}
                  {t.status === 'rejected' && t.rejectedReason && (
                    <div className="text-[11px] text-rose-700 dark:text-rose-400 mt-1 font-sans">
                      Reason: {t.rejectedReason}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                {t.status !== 'rejected' && (
                  <button
                    onClick={() => { setRevokeTarget(t); setRevokeReason(''); }}
                    disabled={busyId === t.uid}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 text-xs font-heading font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center space-x-1 disabled:opacity-50"
                  >
                    <UserX className="h-3.5 w-3.5" />
                    <span>{t.status === 'approved' ? 'Revoke' : 'Reject'}</span>
                  </button>
                )}
                {t.status !== 'approved' && (
                  <button
                    onClick={() => approve(t)}
                    disabled={busyId === t.uid}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heading font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {busyId === t.uid ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : t.status === 'rejected' ? (
                      <>
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Restore</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Approve</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Revoke / reject modal */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#111318] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-display font-bold italic text-stone-900 dark:text-stone-100">
                {revokeTarget.status === 'approved' ? 'Revoke teacher access?' : 'Reject registration?'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-sans">
                {revokeTarget.name} ({revokeTarget.userCode}) will lose access to the teacher tools
                {revokeTarget.status === 'approved' ? ' right away, even if signed in.' : '.'} You can restore them later.
              </p>
            </div>
            <textarea
              value={revokeReason}
              onChange={e => setRevokeReason(e.target.value)}
              rows={3}
              placeholder="Reason (optional, shown to the teacher)"
              className="w-full px-4 py-3 bg-stone-50 dark:bg-[#0A0B0E] border border-stone-200 dark:border-stone-800 rounded-2xl text-xs font-sans text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-stone-900 dark:focus:border-white resize-none"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => { setRevokeTarget(null); setRevokeReason(''); }}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-heading font-bold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmRevoke}
                disabled={busyId === revokeTarget.uid}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-heading font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                {revokeTarget.status === 'approved' ? 'Revoke access' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
