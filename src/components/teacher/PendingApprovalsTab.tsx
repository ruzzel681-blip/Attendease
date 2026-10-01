import React, { useState, useEffect } from 'react';
import { UserProfile, Enrollment } from '../../types';
import { 
  subscribePendingUsers, 
  approveUserAccount, 
  rejectUserAccount, 
  subscribeAllEnrollments, 
  processEnrollment 
} from '../../services/attendanceService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Clock, 
  BookOpen, 
  AlertCircle, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Users,
  CheckCheck
} from 'lucide-react';
import { AvatarDisplay } from '../common/AvatarDisplay';

export const PendingApprovalsTab: React.FC = () => {
  const { userProfile, showToast } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'enrollments'>('accounts');
  
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<Enrollment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Reject modal state
  const [rejectModalData, setRejectModalData] = useState<{
    type: 'user' | 'enrollment';
    id: string;
    name: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const unSubUsers = subscribePendingUsers(setPendingUsers);
    const unSubEnr = subscribeAllEnrollments((allEnrs) => {
      setPendingEnrollments(allEnrs.filter(e => e.status === 'pending'));
    });

    return () => {
      unSubUsers();
      unSubEnr();
    };
  }, []);

  const handleApproveUser = async (targetUser: UserProfile) => {
    if (!userProfile) return;
    setProcessingId(targetUser.uid);
    try {
      await approveUserAccount(targetUser.uid, userProfile.name, userProfile.uid);
      showToast(`Account approved for ${targetUser.name} (${targetUser.userCode})`, 'success');
    } catch (err: any) {
      showToast(`Failed to approve: ${err.message}`, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAllUsers = async () => {
    if (!userProfile || filteredUsers.length === 0) return;
    setIsBatchProcessing(true);
    try {
      for (const u of filteredUsers) {
        await approveUserAccount(u.uid, userProfile.name, userProfile.uid);
      }
      showToast(`Approved ${filteredUsers.length} account request(s) successfully.`, 'success');
    } catch (err: any) {
      showToast(`Batch approval encountered an issue: ${err.message}`, 'error');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleApproveAllEnrollments = async () => {
    if (!userProfile || filteredEnrollments.length === 0) return;
    setIsBatchProcessing(true);
    try {
      for (const enr of filteredEnrollments) {
        await processEnrollment(enr.id, 'approved', userProfile.name);
      }
      showToast(`Approved ${filteredEnrollments.length} enrollment request(s) successfully.`, 'success');
    } catch (err: any) {
      showToast(`Batch approval encountered an issue: ${err.message}`, 'error');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalData || !userProfile) return;
    setProcessingId(rejectModalData.id);

    try {
      if (rejectModalData.type === 'user') {
        await rejectUserAccount(rejectModalData.id, userProfile.name, rejectReason);
        showToast(`Rejected registration for ${rejectModalData.name}`, 'info');
      } else {
        await processEnrollment(rejectModalData.id, 'rejected', userProfile.name);
        showToast(`Declined course enrollment for ${rejectModalData.name}`, 'info');
      }
      setRejectModalData(null);
      setRejectReason('');
    } catch (err: any) {
      showToast(`Failed to process rejection: ${err.message}`, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveEnrollment = async (enrollment: Enrollment) => {
    if (!userProfile) return;
    setProcessingId(enrollment.id);
    try {
      await processEnrollment(enrollment.id, 'approved', userProfile.name);
      showToast(`Approved enrollment for ${enrollment.studentName} in ${enrollment.subjectCode}`, 'success');
    } catch (err: any) {
      showToast(`Failed to approve enrollment: ${err.message}`, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = pendingUsers.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.userCode.toLowerCase().includes(q) ||
      u.departmentOrLocation.toLowerCase().includes(q)
    );
  });

  const filteredEnrollments = pendingEnrollments.filter(e => {
    const q = searchQuery.toLowerCase();
    return (
      e.studentName.toLowerCase().includes(q) ||
      e.studentUserCode.toLowerCase().includes(q) ||
      e.subjectCode.toLowerCase().includes(q) ||
      e.subjectName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 shadow-xs folio-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0 border border-stone-200 dark:border-stone-700">
            <ShieldCheck className="h-6 w-6 stroke-[1.75]" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold italic text-stone-900 dark:text-stone-100">
              Pending Approvals
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
              Review and approve user accounts and course enrollments.
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center space-x-2 p-1.5 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <button
            onClick={() => setActiveSubTab('accounts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'accounts'
                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-xs border border-stone-900 dark:border-white'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Accounts</span>
            {pendingUsers.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeSubTab === 'accounts'
                  ? 'bg-stone-700 dark:bg-stone-200 text-white dark:text-stone-950'
                  : 'bg-stone-900 dark:bg-white text-white dark:text-stone-950'
              }`}>
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('enrollments')}
            className={`px-3.5 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'enrollments'
                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-xs border border-stone-900 dark:border-white'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Enrollments</span>
            {pendingEnrollments.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeSubTab === 'enrollments'
                  ? 'bg-stone-700 dark:bg-stone-200 text-white dark:text-stone-950'
                  : 'bg-stone-900 dark:bg-white text-white dark:text-stone-950'
              }`}>
                {pendingEnrollments.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Filter and Quick Batch Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3.5 top-3.5 text-stone-400" />
          <input
            type="text"
            placeholder={activeSubTab === 'accounts' ? "Search candidate name, ID code, or division..." : "Search student name, ID, or course code..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-2xl text-xs font-sans text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-stone-900 dark:focus:border-white shadow-xs"
          />
        </div>

        {activeSubTab === 'accounts' && filteredUsers.length > 1 && (
          <button
            onClick={handleApproveAllUsers}
            disabled={isBatchProcessing}
            className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            <span>Approve All ({filteredUsers.length})</span>
          </button>
        )}

        {activeSubTab === 'enrollments' && filteredEnrollments.length > 1 && (
          <button
            onClick={handleApproveAllEnrollments}
            disabled={isBatchProcessing}
            className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heading font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            <span>Approve All ({filteredEnrollments.length})</span>
          </button>
        )}
      </div>

      {/* Sub-Tab 1: Account Requests */}
      {activeSubTab === 'accounts' && (
        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 space-y-2 folio-card">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto opacity-70" />
              <h3 className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100">
                All account registration dossiers processed
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto font-sans">
                No new candidates are currently awaiting endorsement at this time.
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.uid}
                className="p-5 rounded-3xl bg-white/95 dark:bg-[#111318]/95 border border-stone-200 dark:border-stone-800 shadow-xs hover:border-stone-300 dark:hover:border-stone-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 folio-card"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <AvatarDisplay name={user.name} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                        {user.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono font-bold text-[10px] border border-stone-200 dark:border-stone-700">
                        {user.userCode}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                        {user.role}
                      </span>
                    </div>

                    <div className="text-xs text-stone-500 dark:text-stone-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans">
                      <span>{user.email}</span>
                      <span>•</span>
                      <span>{user.departmentOrLocation}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px] text-stone-400 flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Submitted {new Date(user.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => setRejectModalData({ type: 'user', id: user.uid, name: `${user.name} (${user.userCode})` })}
                    disabled={processingId === user.uid || isBatchProcessing}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 text-xs font-heading font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <UserX className="h-3.5 w-3.5" />
                    <span>Decline</span>
                  </button>

                  <button
                    onClick={() => handleApproveUser(user)}
                    disabled={processingId === user.uid || isBatchProcessing}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heading font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {processingId === user.uid ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Approve</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Sub-Tab 2: Course Enrollment Requests */}
      {activeSubTab === 'enrollments' && (
        <div className="space-y-3">
          {filteredEnrollments.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 space-y-2 folio-card">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto opacity-70" />
              <h3 className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100">
                All subject rosters verified
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto font-sans">
                No students are currently pending admission to academic subjects.
              </p>
            </div>
          ) : (
            filteredEnrollments.map((enr) => (
              <div
                key={enr.id}
                className="p-5 rounded-3xl bg-white/95 dark:bg-[#111318]/95 border border-stone-200 dark:border-stone-800 shadow-xs hover:border-stone-300 dark:hover:border-stone-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 folio-card"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center font-mono font-bold text-xs shrink-0 border border-stone-200 dark:border-stone-700">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                        {enr.studentName}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono font-bold text-[10px] border border-stone-200 dark:border-stone-700">
                        {enr.studentUserCode}
                      </span>
                    </div>

                    <div className="text-xs text-stone-500 dark:text-stone-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans">
                      <span className="font-semibold text-stone-700 dark:text-stone-300">
                        Target Course: {enr.subjectCode} - {enr.subjectName}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[10px] text-stone-400 flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Requested {new Date(enr.enrolledAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => setRejectModalData({ type: 'enrollment', id: enr.id, name: `${enr.studentName} for ${enr.subjectCode}` })}
                    disabled={processingId === enr.id || isBatchProcessing}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 text-xs font-heading font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Decline</span>
                  </button>

                  <button
                    onClick={() => handleApproveEnrollment(enr)}
                    disabled={processingId === enr.id || isBatchProcessing}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heading font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {processingId === enr.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Enroll</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#111318] border border-stone-200 dark:border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150 folio-card">
            
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <h3 className="font-display font-bold italic text-stone-900 dark:text-stone-100 text-lg">
                Decline {rejectModalData.type === 'user' ? 'Registration' : 'Enrollment'}
              </h3>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 font-sans">
              You are about to decline <strong className="text-stone-900 dark:text-white font-mono">{rejectModalData.name}</strong>. Provide an advisory rationale if necessary:
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Missing prerequisite course / Invalid institutional ID badge / Section capacity reached"
              className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans"
            />

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectModalData(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={processingId === rejectModalData.id}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold text-xs uppercase tracking-wider shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
              >
                {processingId === rejectModalData.id ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Confirm Decline</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
