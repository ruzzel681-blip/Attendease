import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserProfile } from '../../types';
import { AVATAR_PRESETS, getAvatarPreset } from '../../utils/avatars';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { updateUserProfile } from '../../services/attendanceService';
import { useAuth } from '../../contexts/AuthContext';
import { X, Save, Clock, Phone, Globe, Linkedin, Twitter } from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, showToast } = useAuth();

  const [selectedAvatar, setSelectedAvatar] = useState(userProfile?.avatar || 'grad');
  const [name, setName] = useState(userProfile?.name || '');
  const [departmentOrLocation, setDepartmentOrLocation] = useState(userProfile?.departmentOrLocation || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [officeHours, setOfficeHours] = useState(userProfile?.officeHours || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [website, setWebsite] = useState(userProfile?.socialLinks?.website || '');
  const [linkedin, setLinkedin] = useState(userProfile?.socialLinks?.linkedin || '');
  const [twitter, setTwitter] = useState(userProfile?.socialLinks?.twitter || '');

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setSelectedAvatar(userProfile.avatar || 'grad');
      setName(userProfile.name || '');
      setDepartmentOrLocation(userProfile.departmentOrLocation || '');
      setBio(userProfile.bio || '');
      setOfficeHours(userProfile.officeHours || '');
      setPhone(userProfile.phone || '');
      setWebsite(userProfile.socialLinks?.website || '');
      setLinkedin(userProfile.socialLinks?.linkedin || '');
      setTwitter(userProfile.socialLinks?.twitter || '');
    }
  }, [userProfile, isOpen]);

  if (!isOpen || !userProfile || typeof document === 'undefined') return null;

  const isTeacher = userProfile.role === 'teacher';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const updates: Partial<UserProfile> = {
        name: name.trim(),
        avatar: selectedAvatar,
        departmentOrLocation: departmentOrLocation.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        socialLinks: {
          website: website.trim(),
          linkedin: linkedin.trim(),
          twitter: twitter.trim()
        }
      };

      if (isTeacher) {
        updates.officeHours = officeHours.trim();
      }

      await updateUserProfile(userProfile.uid, updates);
      showToast('Profile updated successfully.', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#111318] border border-stone-200 dark:border-stone-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-auto animate-in fade-in zoom-in-95 duration-150 folio-card"
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
          <div className="flex items-center space-x-3">
            <AvatarDisplay avatarId={selectedAvatar} name={name} size="md" />
            <div>
              <h3 className="font-display font-bold italic text-stone-900 dark:text-stone-100 text-lg">
                Edit Profile
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                Update your profile information and credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          
          {/* Avatar Presets Picker */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-widest text-stone-400 mb-2.5 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <span>Choose Avatar</span>
              </span>
              <span className="text-[10px] font-mono text-stone-500">
                {getAvatarPreset(selectedAvatar).label}
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
                    <div className="w-9 h-9 rounded-xl bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-lg shadow-xs border border-stone-300/50 dark:border-stone-700/50">
                      {preset.emoji}
                    </div>
                    <span className="text-[9px] font-mono font-bold text-stone-700 dark:text-stone-300 mt-1 truncate max-w-full">
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

          {/* Basic Fields */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs font-heading font-bold text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1">
                Department / Branch
              </label>
              <input
                type="text"
                value={departmentOrLocation}
                onChange={(e) => setDepartmentOrLocation(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs font-sans text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1">
              Bio & Specialization
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief summary..."
              className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans"
            />
          </div>

          {/* Teacher Specific: Office hours & Phone */}
          {isTeacher && (
            <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1 flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-stone-400" />
                  <span>Office Hours</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Mon/Wed 2-4 PM, Rm 304"
                  value={officeHours}
                  onChange={(e) => setOfficeHours(e.target.value)}
                  className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1 flex items-center space-x-1">
                  <Phone className="h-3 w-3 text-stone-400" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., +1 (555) 019-2831"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white font-mono"
                />
              </div>
            </div>
          )}

          {/* Social / Contact Links */}
          <div className="space-y-2">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
              Web & Social Links (Optional)
            </label>
            <div className="grid sm:grid-cols-3 gap-2.5">
              <div className="relative">
                <Globe className="h-3.5 w-3.5 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Website URL"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full pl-8 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans"
                />
              </div>
              <div className="relative">
                <Linkedin className="h-3.5 w-3.5 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="LinkedIn / Portfolio"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="w-full pl-8 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans"
                />
              </div>
              <div className="relative">
                <Twitter className="h-3.5 w-3.5 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Twitter / X"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="w-full pl-8 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-heading font-bold text-xs uppercase tracking-wider shadow-2xs transition-all flex items-center space-x-2 cursor-pointer border border-stone-900 dark:border-white"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-stone-950/30 dark:border-t-stone-950 rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
