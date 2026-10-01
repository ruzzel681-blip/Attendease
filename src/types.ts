export type UserRole = 'student' | 'teacher';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

export interface UserProfile {
  uid: string;
  userCode: string; // Student ID (e.g., S-10023) or Teacher ID (e.g., T-2001)
  name: string;
  email: string;
  syntheticEmail: string;
  role: UserRole;
  status: UserStatus;
  departmentOrLocation: string;
  subjectsTaught?: string[]; // Subject names or IDs taught by Teacher
  createdAt: string;
  approvedBy?: string; // Teacher UID/Name who approved this user
  approvedAt?: string;
  rejectedReason?: string;
  avatar?: string; // Preset emoji/icon identifier
  bio?: string;
  officeHours?: string;
  phone?: string;
  socialLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export interface Subject {
  id: string;
  code: string; // e.g. CS101, MATH201
  name: string; // e.g. Mathematics, Computer Science
  teacherId: string;
  teacherName: string;
  schedule: string; // e.g. Mon/Wed 09:00 AM - 10:30 AM
  room: string; // e.g. Lab 3, Hall B
  term?: string; // e.g. "Fall 2026", "Spring 2027", "Summer 2026"
  meetUrl?: string; // Persistent Google Meet link
  activeSessionCode?: string; // Classroom PIN (e.g. "4920") for live in-person verification
  activeSessionExpiresAt?: string; // ISO String when the PIN expires
  isSessionOpen?: boolean; // When true, students can check in using the PIN
  blockedStudentIds?: string[]; // Students blocked from re-enrolling
  createdAt: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  studentUserCode: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  teacherId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentUserCode: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note?: string;
  timestamp: string; // ISO String
  markedBy: 'student' | 'teacher';
  markedByName: string;
  markedById: string;
  sessionCodeVerified?: boolean;
}

export interface AttendanceCorrectionRequest {
  id: string;
  attendanceRecordId?: string;
  studentId: string;
  studentName: string;
  studentUserCode: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  teacherId: string;
  date: string;
  currentStatus: AttendanceStatus;
  requestedStatus: AttendanceStatus;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  teacherNote?: string;
  createdAt: string;
  resolvedAt?: string;
}

export type ActivityType = 
  | 'login_success'
  | 'login_failed'
  | 'registration'
  | 'account_approval'
  | 'account_rejection'
  | 'attendance_checkin'
  | 'self_check_in'
  | 'attendance_override'
  | 'enrollment_request'
  | 'enrollment_action'
  | 'subject_created'
  | 'student_created_by_teacher'
  | 'suspicious_activity'
  | 'session_code_generated'
  | 'attendance_correction_requested'
  | 'attendance_correction_resolved'
  | 'bulk_roster_imported';

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: ActivityType;
  userCode: string;
  userName: string;
  role: UserRole | 'unknown';
  details: string;
  ipOrAgent?: string;
  severity?: 'info' | 'warning' | 'critical';
}

export interface AttendanceStats {
  total: number;
  present: number;
  late: number;
  absent: number;
  percentage: number;
}

export type AnnouncementAudience = 'all' | 'students_only' | 'teachers_only';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  teacherId: string;
  teacherName: string;
  subjectId: string; // 'all' or specific subject ID
  subjectCode: string;
  subjectName: string;
  isPinned?: boolean;
  targetAudience?: AnnouncementAudience;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
  meetUrl?: string;
  createdAt: string;
}

export interface AnnouncementComment {
  id: string;
  announcementId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatar?: string;
  content: string;
  commentType?: 'public' | 'private';
  recipientStudentId?: string;
  createdAt: string;
}

export type AssignmentType = 'assignment' | 'quiz' | 'activity' | 'project';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  type: AssignmentType;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  dueDate: string; // e.g. "2026-08-01" or ISO
  points: number;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
  createdAt: string;
}

export type SubmissionStatus = 'assigned' | 'submitted' | 'graded' | 'late';

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentUserCode: string;
  subjectId: string;
  content: string; // Submitted text, link, or notes
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
  submittedAt: string;
  status: SubmissionStatus;
  grade?: number; // e.g. 95
  feedback?: string;
  gradedAt?: string;
  gradedByName?: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: UserRole;
  recipientId: string;
  recipientName: string;
  message: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
  read: boolean;
  readAt?: string;
  timestamp: string;
  // Aliases for compatibility
  receiverId?: string;
  content?: string;
  isRead?: boolean;
  createdAt?: string;
}
