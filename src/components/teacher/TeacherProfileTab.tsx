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
  Clock, 
  Phone, 
  Globe, 
  Linkedin, 
  Twitter,
  Award,
  ShieldCheck
} from 'lucide-react';

export const TeacherProfileTab: React.FC = () => {
  const { userProfile, showToast } = useAuth();

  const [name, setName] = useState(userProfile?.name || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [departmentOrLocation, setDepartmentOrLocation] = useState(userProfile?.departmentOrLocation || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [officeHours, setOfficeHours] = useState(userProfile?.officeHours || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [website, setWebsite] = useState(userProfile?.socialLinks?.website || '');
  const [linkedin, setLinkedin] = useState(userProfile?.socialLinks?.linkedin || '');
  const [twitter, setTwitter] = useState(userProfile?.socialLinks?.twitter || '');
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile?.avatar || 'grad');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setEmail(userProfile.email || '');
      setDepartmentOrLocation(userProfile.departmentOrLocation || '');
      setBio(userProfile.bio || '');
      setOfficeHours(userProfile.officeHours || '');
      setPhone(userProfile.phone || '');
      setWebsite(userProfile.socialLinks?.website || '');
      setLinkedin(userProfile.socialLinks?.linkedin || '');
      setTwitter(userProfile.socialLinks?.twitter || '');
      setSelectedAvatar(userProfile.avatar || 'grad');
    }
  }, [userProfile]);

  if (!userProfile) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUserProfile(userProfile.uid, {
        name: name.trim(),
        departmentOrLocation: departmentOrLocation.trim(),
        bio: bio.trim(),
        officeHours: officeHours.trim(),
        phone: phone.trim(),
        avatar: selectedAvatar,
        socialLinks: {
          website: website.trim(),
          linkedin: linkedin.trim(),
          twitter: twitter.trim()
        }
      });
      showToast('Faculty profile and settings updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <div className="bg-white dark:bg-[#111318] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 folio-card">
        
        {/* Header with Live Avatar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-6">
          <div className="flex items-center space-x-4">
            <AvatarDisplay avatarId={selectedAvatar} name={name} size="lg" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-stone-900 dark:text-stone-100 font-bold bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-700 inline-flex items-center">
                  <Award className="h-3 w-3 mr-1 text-stone-500" />
                  Faculty Profile
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold italic text-stone-900 dark:text-white mt-1">
                Profile & Faculty Settings
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                Manage your public faculty profile, office hours, contact channels, and avatar.
              </p>
            </div>
          </div>
        </div>

        {/* Read-Only Identity Card */}
        <div className="bg-stone-50 dark:bg-stone-900/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
          <div className="flex items-center justify-between text-stone-500 font-bold border-b border-stone-200 dark:border-stone-800 pb-2">
            <span className="flex items-center font-heading">
              <Lock className="h-3.5 w-3.5 mr-1 text-stone-400" /> Immutable Faculty Credentials
            </span>
            <span className="text-[10px] uppercase text-stone-700 dark:text-stone-300 font-mono">
              Role: Teacher
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase text-stone-400 block">Teacher ID</span>
              <span className="font-mono font-bold text-stone-900 dark:text-white break-all">#{userProfile.userCode}</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase text-stone-400 block">Email Address</span>
              <span className="font-mono font-semibold text-stone-900 dark:text-white truncate block">{userProfile.email}</span>
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
        <form onSubmit={handleSaveProfile} className="space-y-6">
          
          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-widest text-stone-400 mb-2.5 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <User className="h-3.5 w-3.5" />
                <span>Select Faculty Avatar</span>
              </span>
              <span className="text-[10px] font-mono text-stone-500">
                Preset: {getAvatarPreset(selectedAvatar).label}
              </span>
            </label>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 bg-stone-50 dark:bg-stone-900/70 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800">
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

          {/* Name & Department */}
          <div className="grid sm:grid-cols-2 gap-4">
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

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1 flex items-center space-x-1">
                <MapPin className="h-3 w-3 text-stone-400" />
                <span>Department / Faculty</span>
              </label>
              <input
                type="text"
                value={departmentOrLocation}
                onChange={(e) => setDepartmentOrLocation(e.target.value)}
                placeholder="e.g. Computer Science, Room 402"
                className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-xs font-sans text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1">
              Faculty Biography & Research Interests
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief introduction visible to students and faculty colleagues..."
              className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans leading-relaxed"
            />
          </div>

          {/* Office Hours & Contact Phone */}
          <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1 flex items-center space-x-1">
                <Clock className="h-3 w-3 text-stone-400" />
                <span>Office Hours / Consultation</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Mon & Thu 2:00 - 4:30 PM"
                value={officeHours}
                onChange={(e) => setOfficeHours(e.target.value)}
                className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3.5 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1 flex items-center space-x-1">
                <Phone className="h-3 w-3 text-stone-400" />
                <span>Office Contact Phone</span>
              </label>
              <input
                type="text"
                placeholder="e.g., +1 (555) 234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3.5 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white font-mono"
              />
            </div>
          </div>

          {/* Social / Web Links */}
          <div className="space-y-2">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
              Academic Website & Social Links (Optional)
            </label>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="relative">
                <Globe className="h-3.5 w-3.5 absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="Website URL"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full pl-9 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans"
                />
              </div>
              <div className="relative">
                <Linkedin className="h-3.5 w-3.5 absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="LinkedIn / Scholar"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="w-full pl-9 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans"
                />
              </div>
              <div className="relative">
                <Twitter className="h-3.5 w-3.5 absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="Twitter / X"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="w-full pl-9 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              id="save-teacher-profile-btn"
              className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-heading font-bold text-xs uppercase tracking-wider shadow-2xs transition-all flex items-center space-x-2 cursor-pointer border border-stone-900 dark:border-white disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-stone-950/30 dark:border-t-stone-950 rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Faculty Changes</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
