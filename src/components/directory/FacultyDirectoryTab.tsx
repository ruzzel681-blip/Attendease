import React, { useState, useEffect } from 'react';
import { UserProfile, Subject } from '../../types';
import { subscribeAllUsers, subscribeSubjects } from '../../services/attendanceService';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { 
  Users, 
  Search, 
  Mail, 
  Clock, 
  Phone, 
  BookOpen, 
  MessageSquare, 
  Globe, 
  Linkedin, 
  Twitter
} from 'lucide-react';

interface FacultyDirectoryTabProps {
  onStartConversation?: (teacher: UserProfile) => void;
  onStartDirectMessage?: (teacherId: string, teacherName: string) => void;
}

export const FacultyDirectoryTab: React.FC<FacultyDirectoryTabProps> = ({ 
  onStartConversation,
  onStartDirectMessage
}) => {
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  useEffect(() => {
    const unsubUsers = subscribeAllUsers((users) => {
      setTeachers(users.filter((u) => u.role === 'teacher' && u.status === 'approved'));
    });
    const unsubSubjects = subscribeSubjects(setSubjects);

    return () => {
      unsubUsers();
      unsubSubjects();
    };
  }, []);

  // Unique departments for filter
  const departments = Array.from(
    new Set(teachers.map((t) => t.departmentOrLocation).filter(Boolean))
  ) as string[];

  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.departmentOrLocation && t.departmentOrLocation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.bio && t.bio.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.email && t.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept = selectedDept === 'all' || t.departmentOrLocation === selectedDept;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-7 shadow-xs folio-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 flex items-center justify-center shrink-0 border border-stone-200 dark:border-stone-700">
              <Users className="h-6 w-6 stroke-[1.75]" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold italic text-stone-900 dark:text-stone-100">
                Faculty Directory
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                Faculty members, schedules, and contact details.
              </p>
            </div>
          </div>

          <div className="text-right shrink-0 bg-stone-50 dark:bg-stone-900 px-3.5 py-2 rounded-2xl border border-stone-200 dark:border-stone-800 self-start sm:self-auto">
            <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block">
              Faculty
            </span>
            <span className="text-2xl font-heading font-bold text-stone-900 dark:text-stone-100 font-mono">
              {teachers.length}
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              placeholder="Search faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans"
            />
          </div>

          {departments.length > 0 && (
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-mono font-bold text-stone-900 dark:text-white focus:outline-none focus:border-stone-900 dark:focus:border-white"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTeachers.length === 0 ? (
          <div className="col-span-full bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl p-10 text-center text-stone-500 text-xs folio-card font-sans">
            No faculty members found.
          </div>
        ) : (
          filteredTeachers.map((teacher) => {
            const facultySubjects = subjects.filter((s) => s.teacherId === teacher.uid);

            return (
              <div
                key={teacher.uid}
                className="bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-2xs hover:border-stone-400 dark:hover:border-stone-600 transition-all flex flex-col justify-between space-y-4 folio-card"
              >
                <div className="space-y-4">
                  {/* Top: Avatar & Basic Info */}
                  <div className="flex items-start space-x-3.5">
                    <AvatarDisplay avatarId={teacher.avatar} name={teacher.name} size="lg" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-bold text-stone-900 dark:text-white text-base truncate">
                        {teacher.name}
                      </h3>
                      <p className="text-[11px] font-mono text-stone-600 dark:text-stone-300 truncate">
                        {teacher.departmentOrLocation || 'Department'}
                      </p>
                      <span className="inline-block font-mono text-[10px] text-stone-400">
                        #{teacher.userCode}
                      </span>
                    </div>
                  </div>

                  {/* Bio */}
                  {teacher.bio && (
                    <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-3 leading-relaxed font-sans">
                      {teacher.bio}
                    </p>
                  )}

                  {/* Key Details Pill Box */}
                  <div className="bg-stone-50 dark:bg-stone-900 p-3 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-1.5 text-xs text-stone-600 dark:text-stone-300 font-sans">
                    <div className="flex items-center space-x-2 truncate">
                      <Mail className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{teacher.email}</span>
                    </div>
                    {teacher.officeHours && (
                      <div className="flex items-center space-x-2 truncate">
                        <Clock className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                        <span className="truncate font-mono text-[11px]">Hours: {teacher.officeHours}</span>
                      </div>
                    )}
                    {teacher.phone && (
                      <div className="flex items-center space-x-2 truncate">
                        <Phone className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                        <span className="truncate font-mono text-[11px]">{teacher.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Subjects Taught */}
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block mb-1.5 flex items-center space-x-1">
                      <BookOpen className="h-3 w-3" />
                      <span>Courses ({facultySubjects.length})</span>
                    </span>
                    {facultySubjects.length === 0 ? (
                      <p className="text-[11px] italic text-stone-400 font-sans">None assigned</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {facultySubjects.map((sub) => (
                          <span
                            key={sub.id}
                            className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-mono font-bold text-[10px] border border-stone-200 dark:border-stone-700"
                            title={`${sub.code}: ${sub.name}`}
                          >
                            {sub.code}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Social / Web Links */}
                  {teacher.socialLinks && (teacher.socialLinks.website || teacher.socialLinks.linkedin || teacher.socialLinks.twitter) && (
                    <div className="flex items-center space-x-2 pt-1">
                      {teacher.socialLinks.website && (
                        <a
                          href={teacher.socialLinks.website.startsWith('http') ? teacher.socialLinks.website : `https://${teacher.socialLinks.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors"
                          title="Website"
                        >
                          <Globe className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {teacher.socialLinks.linkedin && (
                        <a
                          href={teacher.socialLinks.linkedin.startsWith('http') ? teacher.socialLinks.linkedin : `https://${teacher.socialLinks.linkedin}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors"
                          title="LinkedIn"
                        >
                          <Linkedin className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {teacher.socialLinks.twitter && (
                        <a
                          href={teacher.socialLinks.twitter.startsWith('http') ? teacher.socialLinks.twitter : `https://x.com/${teacher.socialLinks.twitter.replace('@', '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors"
                          title="Twitter"
                        >
                          <Twitter className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Direct Message Button */}
                {(onStartDirectMessage || onStartConversation) && (
                  <button
                    onClick={() => {
                      if (onStartDirectMessage) {
                        onStartDirectMessage(teacher.uid, teacher.name);
                      } else if (onStartConversation) {
                        onStartConversation(teacher);
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-2xs border border-stone-900 dark:border-white"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Message</span>
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
