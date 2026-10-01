import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserProfile } from '../../services/attendanceService';
import { AVATAR_PRESETS, getAvatarPreset } from '../../utils/avatars';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { 
  User, 
  Mail, 
  MapPin, 
  Save, 
  Lock,
  ShieldCheck
} from 'lucide-react';

export const StudentProfileTab: React.FC = () => {
  const { userProfile, showToast } = useAuth();

  const [name, setName] = useState(userProfile?.name || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [departmentOrLocation, setDepartmentOrLocation] = useState(userProfile?.departmentOrLocation || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile?.avatar || 'grad');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setEmail(userProfile.email || '');
      setDepartmentOrLocation(userProfile.departmentOrLocation || '');
      setBio(userProfile.bio || '');
      setSelectedAvatar(userProfile.avatar || 'grad');
    }
  }, [userProfile]);

  if (!userProfile) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await updateUserProfile(userProfile.uid, {
        name: name.trim(),
        email: email.trim(),
        departmentOrLocation: departmentOrLocation.trim(),
        bio: bio.trim(),
        avatar: selectedAvatar
      });
      showToast('Profile and avatar updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      <div className="bg-white dark:bg-[#111318] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 folio-card">
        
        {/* Header with Live Avatar */}
        <div className="flex items-center space-x-4 border-b border-stone-100 dark:border-stone-800 pb-6">
          <AvatarDisplay avatarId={selectedAvatar} name={name} size="lg" />
          <div>
            <h3 className="text-xl font-display font-bold italic text-stone-900 dark:text-white">
              Student Profile Management
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
              Personalize your avatar, contact info, and academic presence
            </p>
          </div>
        </div>

        {/* Read-Only Identity Card */}
        <div className="bg-stone-50 dark:bg-stone-900/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
          <div className="flex items-center justify-between text-stone-500 font-bold border-b border-stone-200 dark:border-stone-800 pb-2">
            <span className="flex items-center font-heading">
              <Lock className="h-3.5 w-3.5 mr-1 text-stone-400" /> Immutable Student Credentials
            </span>
            <span className="text-[10px] uppercase text-stone-700 dark:text-stone-300 font-mono">
              Role: Student
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase text-stone-400 block">Student ID</span>
              <span className="font-mono font-bold text-stone-900 dark:text-white break-all">{userProfile.userCode}</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase text-stone-400 block">System Role</span>
              <span className="font-bold text-stone-900 dark:text-stone-100 capitalize">{userProfile.role}</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase text-stone-400 block">Account Status</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 capitalize inline-flex items-center">
                <ShieldCheck className="h-3 w-3 mr-1" />
                {userProfile.status}
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase text-stone-400 block">Approved By</span>
              <span className="text-stone-700 dark:text-stone-300 break-all">{userProfile.approvedBy || 'System'}</span>
            </div>
          </div>
        </div>

        {/* Editable Form */}
        <form onSubmit={handleSaveProfile} className="space-y-5">
          
          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-widest text-stone-400 mb-2.5 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <User className="h-3.5 w-3.5" />
                <span>Select Your Avatar</span>
              </span>
              <span className="text-[10px] font-mono text-stone-500">
                Preset: {getAvatarPreset(selectedAvatar).label}
              </span>
            </label>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-stone-50 dark:bg-stone-900/70 p-3 rounded-2xl border border-stone-200 dark:border-stone-800">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = selectedAvatar === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedAvatar(preset.id)}
                    className={`flex flex-col items-center p-2 rounded-xl transition-all relative cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-stone-900 dark:ring-white bg-stone-900/10 dark:bg-white/10'
                        : 'hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-xl shadow-xs border border-stone-300/50 dark:border-stone-700/50">
                      {preset.emoji}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-stone-700 dark:text-stone-300 mt-1 truncate max-w-full">
                      {preset.label}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-stone-900 dark:bg-white rounded-full flex items-center justify-center text-white dark:text-stone-950 text-[8px] font-bold">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1 flex items-center space-x-1">
              <User className="h-3 w-3 text-stone-400" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-xs font-heading font-bold text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1 flex items-center space-x-1">
              <Mail className="h-3 w-3 text-stone-400" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white"
            />
          </div>

          {/* Department / Program */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1 flex items-center space-x-1">
              <MapPin className="h-3 w-3 text-stone-400" />
              <span>Department / Major / Campus</span>
            </label>
            <input
              type="text"
              value={departmentOrLocation}
              onChange={(e) => setDepartmentOrLocation(e.target.value)}
              placeholder="e.g., Computer Science - Year 3"
              className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-xs font-sans text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1">
              About Me / Academic Interests
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell teachers and peers about yourself..."
              className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans leading-relaxed"
            />
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              id="save-student-profile-btn"
              className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-heading font-bold text-xs uppercase tracking-wider shadow-2xs transition-all flex items-center space-x-2 cursor-pointer border border-stone-900 dark:border-white disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-stone-950/30 dark:border-t-stone-950 rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
