import React, { useState, useEffect, useRef } from 'react';
import { 
  Megaphone, 
  Plus, 
  Pin, 
  Trash2, 
  MessageSquare, 
  Send, 
  Search, 
  X, 
  Paperclip, 
  FileText, 
  Download, 
  Lock, 
  Users, 
  Video, 
  ExternalLink, 
  Copy, 
  Check 
} from 'lucide-react';
import { 
  UserProfile, 
  Subject, 
  Announcement, 
  AnnouncementComment, 
  AnnouncementAudience 
} from '../../types';
import { 
  subscribeAnnouncements, 
  createAnnouncement, 
  deleteAnnouncement, 
  subscribeAnnouncementComments, 
  addAnnouncementComment, 
  deleteAnnouncementComment, 
  updateSubject, 
  normalizeMeetUrl 
} from '../../services/attendanceService';
import { processFileUpload, FileUploadResult } from '../../utils/fileUpload';
import { AvatarDisplay } from '../common/AvatarDisplay';

interface AnnouncementsTabProps {
  userProfile: UserProfile;
  subjects: Subject[];
}

export const AnnouncementsTab: React.FC<AnnouncementsTabProps> = ({ userProfile, subjects }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('all');
  const [formAudience, setFormAudience] = useState<AnnouncementAudience>('all');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formAttachment, setFormAttachment] = useState<FileUploadResult | null>(null);
  const [formMeetUrl, setFormMeetUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manage / Save Meet Link Modal state
  const [isManagingMeetLink, setIsManagingMeetLink] = useState(false);
  const [targetMeetSubjectId, setTargetMeetSubjectId] = useState<string>('');
  const [targetMeetUrl, setTargetMeetUrl] = useState<string>('');
  const [isSavingMeetLink, setIsSavingMeetLink] = useState(false);
  const [meetLinkSaveSuccess, setMeetLinkSaveSuccess] = useState(false);

  // Expanded comment threads
  const [activeAnnouncementId, setActiveAnnouncementId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeAnnouncements((data) => {
      setAnnouncements(data);
    });
    return () => unsubscribe();
  }, []);

  const isTeacher = userProfile.role === 'teacher';

  const openSaveMeetLinkModal = (subId?: string) => {
    const defaultSubId = subId || (selectedSubjectId !== 'all' ? selectedSubjectId : (subjects[0]?.id || ''));
    setTargetMeetSubjectId(defaultSubId);
    const found = subjects.find(s => s.id === defaultSubId);
    setTargetMeetUrl(found?.meetUrl || '');
    setMeetLinkSaveSuccess(false);
    setIsManagingMeetLink(true);
  };

  const handleTargetSubjectChange = (newSubId: string) => {
    setTargetMeetSubjectId(newSubId);
    const found = subjects.find(s => s.id === newSubId);
    setTargetMeetUrl(found?.meetUrl || '');
    setMeetLinkSaveSuccess(false);
  };

  const handleSaveMeetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMeetSubjectId) return;
    setIsSavingMeetLink(true);
    try {
      const normalized = normalizeMeetUrl(targetMeetUrl) || '';
      await updateSubject(targetMeetSubjectId, { meetUrl: normalized }, userProfile.name);
      setMeetLinkSaveSuccess(true);
      setTimeout(() => {
        setIsManagingMeetLink(false);
        setMeetLinkSaveSuccess(false);
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Failed to save Google Meet link');
    } finally {
      setIsSavingMeetLink(false);
    }
  };

  const handleOneTapInsertMeetLink = () => {
    let subWithMeet: Subject | undefined;
    if (formSubjectId !== 'all') {
      subWithMeet = subjects.find(s => s.id === formSubjectId);
    } else {
      subWithMeet = subjects.find(s => !s.meetUrl);
    }

    if (subWithMeet?.meetUrl) {
      const normalized = normalizeMeetUrl(subWithMeet.meetUrl) || subWithMeet.meetUrl;
      setFormMeetUrl(normalized);
    } else {
      const chosenSubj = subjects.find(s => s.id === formSubjectId);
      alert(
        chosenSubj
          ? `No Google Meet link is configured for ${chosenSubj.code} yet. You can paste one directly below or click 'Save Meet Link' next to New Announcement to store it persistently for this subject!`
          : 'No subjects currently have a persistent Google Meet link saved. You can paste one below or use the "Save Meet Link" button.'
      );
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await processFileUpload(file);
      setFormAttachment(res);
    } catch (err: any) {
      alert(err.message || 'File upload error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    setIsSubmitting(true);
    try {
      let subCode = 'GENERAL';
      let subName = 'All Subjects';

      if (formSubjectId !== 'all') {
        const found = subjects.find((s) => s.id === formSubjectId);
        if (found) {
          subCode = found.code;
          subName = found.name;
        }
      }

      await createAnnouncement(
        formTitle.trim(),
        formContent.trim(),
        userProfile.uid,
        userProfile.name,
        formSubjectId,
        subCode,
        subName,
        formIsPinned,
        formAudience,
        formAttachment || undefined,
        formMeetUrl.trim() || undefined
      );

      setFormTitle('');
      setFormContent('');
      setFormSubjectId('all');
      setFormAudience('all');
      setFormIsPinned(false);
      setFormAttachment(null);
      setFormMeetUrl('');
      setIsCreating(false);
    } catch (err: any) {
      console.error('Error posting announcement:', err);
      alert(err.message || 'Failed to post announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      await deleteAnnouncement(id);
    }
  };

  // Filter announcements based on role, audience, and search
  const filteredAnnouncements = announcements.filter((item) => {
    // Audience filter for students
    if (!isTeacher) {
      if (item.targetAudience === 'teachers_only') return false;
    }

    const matchesSubject =
      selectedSubjectId === 'all' || item.subjectId === 'all' || item.subjectId === selectedSubjectId;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subjectName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSubject && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Stream Banner */}
      <div className="relative rounded-3xl bg-white dark:bg-[#111318] p-6 sm:p-8 text-stone-900 dark:text-white border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden folio-card">
        <div className="absolute -right-8 -bottom-8 opacity-5 dark:opacity-5 pointer-events-none text-stone-900 dark:text-white">
          <Megaphone className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-mono font-bold tracking-wider uppercase">
            <span>Institute Stream & Bulletins</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold italic tracking-tight text-stone-900 dark:text-white">
            Campus Notices & Circulars
          </h2>
          <p className="text-stone-600 dark:text-stone-400 text-xs sm:text-sm font-sans leading-relaxed">
            Stay informed with real-time academic announcements, course circulars, and departmental updates.
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-700 dark:text-stone-200 focus:outline-none focus:border-stone-900 dark:focus:border-white"
          >
            <option value="all">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.code} - {sub.name}
              </option>
            ))}
          </select>

          {/* Quick Join Meet Link if Filtered Subject has one */}
          {selectedSubjectId !== 'all' && (() => {
            const filteredSubjectObj = subjects.find(s => s.id === selectedSubjectId);
            if (!filteredSubjectObj?.meetUrl) return null;
            const meetLink = filteredSubjectObj.meetUrl.startsWith('http') ? filteredSubjectObj.meetUrl : `https://${filteredSubjectObj.meetUrl}`;
            return (
              <a
                href={meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white text-xs font-bold transition-colors shrink-0 shadow-2xs font-sans"
                title={`Join ${filteredSubjectObj.code} persistent Google Meet room`}
              >
                <Video className="h-3.5 w-3.5 text-stone-700 dark:text-stone-300" />
                <span className="hidden sm:inline">Join {filteredSubjectObj.code} Meet</span>
                <span className="sm:hidden">Meet</span>
                <ExternalLink className="h-3 w-3 opacity-75" />
              </a>
            );
          })()}
        </div>

        {/* Actions (Teachers only) */}
        {isTeacher && (
          <div className="flex items-center space-x-2 shrink-0">
            {/* Save Meet Link Button right next to New Announcement */}
            <button
              type="button"
              onClick={() => openSaveMeetLinkModal()}
              id="save-meet-link-btn"
              className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-white border border-stone-300 dark:border-stone-700 text-xs font-heading font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
              title="Save or edit course Google Meet link"
            >
              <Video className="h-4 w-4" />
              <span>Save Meet Link</span>
            </button>

            {/* New Announcement Button */}
            <button
              type="button"
              onClick={() => {
                if (selectedSubjectId !== 'all') {
                  setFormSubjectId(selectedSubjectId);
                  const matched = subjects.find(s => s.id === selectedSubjectId);
                  if (matched?.meetUrl) {
                    setFormMeetUrl(matched.meetUrl);
                  } else {
                    setFormMeetUrl('');
                  }
                } else {
                  setFormSubjectId('all');
                  setFormMeetUrl('');
                }
                setIsCreating(true);
              }}
              id="create-announcement-btn"
              className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 border border-stone-900 dark:border-white text-xs font-heading font-bold rounded-xl shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New Announcement</span>
            </button>
          </div>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl p-10 text-center text-stone-500 space-y-2 folio-card font-sans">
            <Megaphone className="h-8 w-8 mx-auto text-stone-300 dark:text-stone-600" />
            <p className="font-heading font-bold text-xs text-stone-700 dark:text-stone-300">
              No notices or bulletins found
            </p>
            <p className="text-[11px] text-stone-400">
              {isTeacher
                ? 'Click "New Announcement" to publish updates to your students.'
                : 'Your faculty will post announcements and course materials here.'}
            </p>
          </div>
        ) : (
          filteredAnnouncements.map((item) => (
            <AnnouncementCard
              key={item.id}
              announcement={item}
              subjects={subjects}
              userProfile={userProfile}
              onDelete={handleDelete}
              isOpenComments={activeAnnouncementId === item.id}
              toggleComments={() =>
                setActiveAnnouncementId(activeAnnouncementId === item.id ? null : item.id)
              }
            />
          ))
        )}
      </div>

      {/* Create Announcement Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#111318] border border-stone-200 dark:border-stone-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 my-6 folio-card">
            
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white">
                  <Megaphone className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold italic text-stone-900 dark:text-white text-base">
                  New Class Announcement
                </h3>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              
              {/* Target Subject & Audience */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-heading font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Course / Subject
                  </label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white"
                  >
                    <option value="all">Broadcast to All Courses</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code} - {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-heading font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center space-x-1">
                    <Users className="h-3 w-3 text-stone-400" />
                    <span>Target Audience</span>
                  </label>
                  <select
                    value={formAudience}
                    onChange={(e) => setFormAudience(e.target.value as AnnouncementAudience)}
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white"
                  >
                    <option value="all">All Members (Students & Staff)</option>
                    <option value="students_only">Students Only</option>
                    <option value="teachers_only">Faculty Teachers Only</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-heading font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Midterm Exam Schedule & Study Guide"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white font-sans focus:outline-none focus:border-stone-900 dark:focus:border-white"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-heading font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Message Content
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write full notice details, instructions, or requirements..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-3 text-xs text-stone-900 dark:text-white font-sans focus:outline-none focus:border-stone-900 dark:focus:border-white"
                />
              </div>

              {/* Google Meet Link with 1-Tap Button */}
              {(() => {
                const targetSubjForForm = subjects.find(s => s.id === formSubjectId);
                return (
                  <div className="rounded-2xl border border-stone-200 dark:border-stone-800 p-3.5 bg-stone-50/50 dark:bg-stone-900/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-heading font-bold text-stone-700 dark:text-stone-300 flex items-center space-x-1.5">
                        <Video className="h-4 w-4 text-stone-500" />
                        <span>Google Meet Link</span>
                        <span className="text-[10px] text-stone-400 font-normal font-sans">(Optional)</span>
                      </label>

                      {/* 1-Tap Button */}
                      <button
                        type="button"
                        id="one-tap-meet-btn"
                        onClick={handleOneTapInsertMeetLink}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-white text-[11px] font-mono font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                        title="1-Tap to insert saved persistent Google Meet link"
                      >
                        <Video className="h-3 w-3 text-stone-500" />
                        <span>
                          1-Tap: {targetSubjForForm?.code ? `${targetSubjForForm.code} Meet Link` : 'Subject Meet Link'}
                        </span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. https://meet.google.com/abc-defg-hij"
                        value={formMeetUrl}
                        onChange={(e) => setFormMeetUrl(e.target.value)}
                        className="w-full bg-white dark:bg-[#111318] border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-stone-900 dark:focus:border-white pr-8 font-mono"
                      />
                      {formMeetUrl && (
                        <button
                          type="button"
                          onClick={() => setFormMeetUrl('')}
                          className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                          title="Clear link"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* File Attachment Upload */}
              <div>
                <label className="block text-xs font-heading font-bold text-stone-700 dark:text-stone-300 mb-1">
                  File Attachment (Optional, &lt;800KB)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  className="hidden"
                />
                
                {formAttachment ? (
                  <div className="p-2.5 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 min-w-0">
                      <FileText className="h-4 w-4 text-stone-500 shrink-0" />
                      <span className="font-bold text-stone-800 dark:text-stone-200 truncate max-w-[200px]">
                        {formAttachment.fileName}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        ({Math.round(formAttachment.fileSize / 1024)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormAttachment(null)}
                      className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full py-2.5 px-3 border border-dashed border-stone-300 dark:border-stone-700 rounded-xl text-xs font-heading font-semibold text-stone-600 dark:text-stone-300 hover:border-stone-900 dark:hover:border-white hover:bg-stone-50 dark:hover:bg-stone-800/50 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                  >
                    <Paperclip className="h-4 w-4 text-stone-400" />
                    <span>{isUploading ? 'Processing File...' : 'Attach Image, Syllabus, or Document'}</span>
                  </button>
                )}
              </div>

              {/* Pin notice */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="pinToggle"
                  checked={formIsPinned}
                  onChange={(e) => setFormIsPinned(e.target.checked)}
                  className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                />
                <label
                  htmlFor="pinToggle"
                  className="text-xs font-heading font-semibold text-stone-700 dark:text-stone-300 flex items-center cursor-pointer"
                >
                  <Pin className="h-3.5 w-3.5 mr-1 text-stone-500" />
                  Pin notice to top of stream
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-heading font-bold text-xs shadow-2xs cursor-pointer border border-stone-900 dark:border-white"
                >
                  {isSubmitting ? 'Posting...' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Save Meet Link Modal */}
      {isManagingMeetLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#111318] border border-stone-200 dark:border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 my-6 folio-card">
            
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold italic text-stone-900 dark:text-white text-base">
                    Save Google Meet Link
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 font-sans">
                    Configure persistent video meeting rooms for courses
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsManagingMeetLink(false)}
                className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMeetLink} className="space-y-4">
              {/* Subject select */}
              <div>
                <label className="block text-xs font-heading font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Select Course / Subject
                </label>
                <select
                  value={targetMeetSubjectId}
                  onChange={(e) => handleTargetSubjectChange(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code} - {sub.name} {sub.meetUrl ? '✓ (Configured)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Link Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-heading font-bold text-stone-700 dark:text-stone-300">
                    Persistent Google Meet URL
                  </label>
                  {targetMeetUrl && (
                    <a
                      href={targetMeetUrl.startsWith('http') ? targetMeetUrl : `https://${targetMeetUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-stone-900 dark:text-stone-100 font-bold hover:underline flex items-center space-x-1"
                    >
                      <span>Test Link</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. meet.google.com/abc-defg-hij"
                  value={targetMeetUrl}
                  onChange={(e) => setTargetMeetUrl(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-stone-900 dark:focus:border-white font-mono"
                />
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 font-sans">
                  Will automatically be validated and normalized to start with <code className="text-stone-900 dark:text-stone-100 font-mono">https://</code>.
                </p>
              </div>

              {/* Success Banner */}
              {meetLinkSaveSuccess && (
                <div className="p-3 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl flex items-center space-x-2 text-xs font-bold text-stone-900 dark:text-white animate-in fade-in">
                  <Check className="h-4 w-4 text-stone-900 dark:text-white" />
                  <span>Google Meet link successfully saved and synced!</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsManagingMeetLink(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMeetLink}
                  id="confirm-save-meet-btn"
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-heading font-bold text-xs shadow-2xs flex items-center space-x-1.5 cursor-pointer border border-stone-900 dark:border-white"
                >
                  {isSavingMeetLink ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-stone-950/30 dark:border-t-stone-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Video className="h-3.5 w-3.5" />
                      <span>Save Link</span>
                    </>
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

// Sub-component for individual Announcement Card
interface AnnouncementCardProps {
  announcement: Announcement;
  subjects: Subject[];
  userProfile: UserProfile;
  onDelete: (id: string) => void;
  isOpenComments: boolean;
  toggleComments: () => void;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  subjects,
  userProfile,
  onDelete,
  isOpenComments,
  toggleComments
}) => {
  const [comments, setComments] = useState<AnnouncementComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPrivateComment, setIsPrivateComment] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copiedMeet, setCopiedMeet] = useState(false);

  // Determine effective Google Meet link
  const subjectMatch = subjects.find((s) => s.id === announcement.subjectId);
  const effectiveMeetUrl = announcement.meetUrl || subjectMatch?.meetUrl;

  const handleCopyMeet = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedMeet(true);
    setTimeout(() => setCopiedMeet(false), 2000);
  };

  useEffect(() => {
    let unsubscribe = () => {};
    if (isOpenComments) {
      unsubscribe = subscribeAnnouncementComments(announcement.id, (data) => {
        setComments(data);
      });
    }
    return () => unsubscribe();
  }, [isOpenComments, announcement.id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSending(true);
    try {
      await addAnnouncementComment(
        announcement.id,
        userProfile.uid,
        userProfile.name,
        userProfile.role,
        newComment.trim(),
        isPrivateComment,
        isPrivateComment ? announcement.teacherId : undefined,
        userProfile.avatar
      );
      setNewComment('');
      setIsPrivateComment(false);
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Delete this comment?')) {
      await deleteAnnouncementComment(commentId);
    }
  };

  const isTeacher = userProfile.role === 'teacher';
  const formattedDate = new Date(announcement.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const visibleComments = comments.filter((c) => {
    if (!c.isPrivate) return true;
    if (isTeacher) return true;
    return c.authorId === userProfile.uid;
  });

  return (
    <div
      className={`bg-white/95 dark:bg-[#111318]/95 border rounded-3xl p-5 sm:p-6 transition-all shadow-2xs folio-card ${
        announcement.isPinned
          ? 'border-stone-400 dark:border-stone-600 ring-1 ring-stone-400/20'
          : 'border-stone-200 dark:border-stone-800'
      }`}
    >
      {/* Header Info */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center space-x-3">
          <AvatarDisplay
            name={announcement.teacherName || 'Faculty'}
            size="md"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-heading font-bold text-stone-900 dark:text-white text-sm">
                {announcement.teacherName}
              </span>
              {announcement.isPinned && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-[10px] font-mono font-bold">
                  <Pin className="h-3 w-3 mr-1" />
                  Pinned
                </span>
              )}
              {/* Audience Pill */}
              {announcement.targetAudience && announcement.targetAudience !== 'all' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10px] font-mono font-bold border border-stone-300 dark:border-stone-700">
                  <Users className="h-3 w-3 mr-1" />
                  {announcement.targetAudience === 'students_only'
                    ? 'Students Only'
                    : 'Faculty Only'}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-stone-500 dark:text-stone-400 font-mono">
              <span className="font-bold text-stone-800 dark:text-stone-200">
                {announcement.subjectCode} • {announcement.subjectName}
              </span>
              <span>•</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {isTeacher && (
          <button
            onClick={() => onDelete(announcement.id)}
            className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
            title="Delete Announcement"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Title & Body Content */}
      <div className="space-y-2 mb-4">
        <h3 className="text-base sm:text-lg font-display font-bold text-stone-900 dark:text-white">
          {announcement.title}
        </h3>
        <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed font-sans">
          {announcement.content}
        </p>

        {/* Google Meet Live Session Banner */}
        {effectiveMeetUrl && (
          <div className="mt-3 p-3.5 sm:p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-950 flex items-center justify-center shrink-0">
                  <Video className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-heading font-bold text-xs sm:text-sm text-stone-900 dark:text-white truncate">
                      Google Meet Room
                    </h4>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      Live Link
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 font-mono truncate max-w-xs sm:max-w-md">
                    {effectiveMeetUrl}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleCopyMeet(effectiveMeetUrl)}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white text-xs font-semibold flex items-center space-x-1 shadow-2xs transition-colors cursor-pointer"
                  title="Copy Google Meet link"
                >
                  {copiedMeet ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-stone-900 dark:text-white" />
                      <span className="text-[11px] font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span className="text-[11px]">Copy Link</span>
                    </>
                  )}
                </button>

                <a
                  href={effectiveMeetUrl.startsWith('http') ? effectiveMeetUrl : `https://${effectiveMeetUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-heading font-bold text-xs shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer border border-stone-900 dark:border-white"
                  title="1-tap to join Google Meet room"
                >
                  <Video className="h-3.5 w-3.5" />
                  <span>Join Meet</span>
                  <ExternalLink className="h-3 w-3 opacity-80" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Attachment Card */}
        {announcement.attachmentUrl && (
          <div className="mt-3 p-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md">
            {announcement.attachmentType?.startsWith('image/') ? (
              <div className="space-y-2">
                <img
                  src={announcement.attachmentUrl}
                  alt={announcement.attachmentName || 'Attachment'}
                  className="max-h-60 rounded-xl object-contain bg-black/5 mx-auto"
                />
                <div className="flex items-center justify-between text-xs pt-1 font-sans">
                  <span className="font-medium text-stone-700 dark:text-stone-300 truncate max-w-[200px]">
                    {announcement.attachmentName || 'Image Attachment'}
                  </span>
                  <a
                    href={announcement.attachmentUrl}
                    download={announcement.attachmentName || 'image'}
                    className="inline-flex items-center space-x-1 text-stone-900 dark:text-white font-bold hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between space-x-3">
                <div className="flex items-center space-x-2 min-w-0">
                  <FileText className="h-5 w-5 text-stone-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-stone-900 dark:text-white text-xs truncate">
                      {announcement.attachmentName || 'Course Attachment'}
                    </p>
                    {announcement.attachmentSize && (
                      <p className="text-[10px] text-stone-400 font-mono">
                        {Math.round(announcement.attachmentSize / 1024)} KB
                      </p>
                    )}
                  </div>
                </div>
                <a
                  href={announcement.attachmentUrl}
                  download={announcement.attachmentName || 'attachment'}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 text-xs font-bold shrink-0 shadow-2xs border border-stone-900 dark:border-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer / Comments Toggle */}
      <div className="border-t border-stone-100 dark:border-stone-800 pt-3 flex items-center justify-between">
        <button
          onClick={toggleComments}
          className="inline-flex items-center space-x-2 text-xs font-heading font-bold text-stone-900 dark:text-white hover:underline cursor-pointer"
        >
          <MessageSquare className="h-4 w-4" />
          <span>
            {isOpenComments ? 'Hide Comments' : `Comments (${visibleComments.length})`}
          </span>
        </button>
      </div>

      {/* Comments Drawer */}
      {isOpenComments && (
        <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 space-y-3 animate-in fade-in duration-200">
          
          {/* Comment List */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {visibleComments.length === 0 ? (
              <p className="text-xs italic text-stone-400 py-1 font-sans">
                No comments yet. Start the conversation!
              </p>
            ) : (
              visibleComments.map((c) => (
                <div
                  key={c.id}
                  className={`p-3 rounded-2xl space-y-1 ${
                    c.isPrivate
                      ? 'bg-stone-100/80 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700'
                      : 'bg-stone-50 dark:bg-stone-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AvatarDisplay
                        avatarId={c.authorAvatar}
                        name={c.authorName}
                        size="xs"
                      />
                      <span className="font-heading font-bold text-stone-900 dark:text-white text-xs">
                        {c.authorName}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold uppercase ${
                          c.authorRole === 'teacher'
                            ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-950'
                            : 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {c.authorRole}
                      </span>
                      {c.isPrivate && (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-stone-100 text-[9px] font-mono font-bold">
                          <Lock className="h-2.5 w-2.5 mr-0.5" />
                          Private to Faculty
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-stone-400 font-mono">
                        {new Date(c.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {isTeacher && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-stone-400 hover:text-rose-500 p-0.5 cursor-pointer"
                          title="Delete comment"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-stone-700 dark:text-stone-300 pl-6 font-sans">
                    {c.content}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Input Form */}
          <form onSubmit={handleAddComment} className="space-y-2 pt-2">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder={
                  isPrivateComment
                    ? 'Write private comment (visible only to faculty)...'
                    : 'Add class comment...'
                }
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans"
              />
              <button
                type="submit"
                disabled={isSending || !newComment.trim()}
                className="p-2 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 rounded-xl disabled:opacity-50 transition-colors shrink-0 cursor-pointer border border-stone-900 dark:border-white"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            {/* Private Comment Toggle */}
            <div className="flex items-center space-x-2 text-xs">
              <input
                type="checkbox"
                id={`private-comment-${announcement.id}`}
                checked={isPrivateComment}
                onChange={(e) => setIsPrivateComment(e.target.checked)}
                className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
              />
              <label
                htmlFor={`private-comment-${announcement.id}`}
                className="text-[11px] font-medium text-stone-600 dark:text-stone-400 flex items-center cursor-pointer select-none font-sans"
              >
                <Lock className="h-3 w-3 mr-1 text-stone-500" />
                <span>Make comment private (Only Faculty & You can read it)</span>
              </label>
            </div>
          </form>

        </div>
      )}

    </div>
  );
};
