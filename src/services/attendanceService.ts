import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  UserProfile, 
  Subject, 
  Enrollment, 
  AttendanceRecord, 
  ActivityLog, 
  ActivityType,
  AttendanceStatus,
  UserRole,
  Announcement,
  AnnouncementComment,
  Assignment,
  AssignmentType,
  Submission,
  SubmissionStatus,
  DirectMessage,
  AttendanceCorrectionRequest
} from '../types';

export const DOMAIN = 'cedric.edu';

export function getSyntheticEmail(userCode: string, role: UserRole): string {
  const cleanCode = userCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return `${role}.${cleanCode}@${DOMAIN}`;
}

// Activity Logging helper
export async function logActivity(
  type: ActivityType,
  userCode: string,
  userName: string,
  role: UserRole | 'unknown',
  details: string,
  severity: 'info' | 'warning' | 'critical' = 'info'
) {
  try {
    const logsRef = collection(db, 'activityLogs');
    await addDoc(logsRef, {
      type,
      userCode,
      userName,
      role,
      details,
      severity,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

// Real-time listener for current user's profile
export function subscribeUserProfile(
  uid: string,
  callback: (profile: UserProfile | null) => void,
  onError?: (err: any) => void
) {
  const docRef = doc(db, 'users', uid);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as UserProfile);
    } else {
      callback(null);
    }
  }, (err) => {
    console.error('Error listening to user profile:', err);
    if (onError) onError(err);
    callback(null);
  });
}

// Subscribe to pending users (for Teachers to review)
export function subscribePendingUsers(callback: (users: UserProfile[]) => void) {
  const q = query(collection(db, 'users'), where('status', '==', 'pending'));
  return onSnapshot(q, (snapshot) => {
    const users: UserProfile[] = [];
    snapshot.forEach((doc) => {
      users.push(doc.data() as UserProfile);
    });
    callback(users);
  });
}

// Subscribe to all users
export function subscribeAllUsers(callback: (users: UserProfile[]) => void) {
  const q = query(collection(db, 'users'));
  return onSnapshot(q, (snapshot) => {
    const users: UserProfile[] = [];
    snapshot.forEach((doc) => {
      users.push(doc.data() as UserProfile);
    });
    callback(users);
  });
}

// Check if any approved teacher exists
export async function hasApprovedTeacher(): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'teacher'), 
      where('status', '==', 'approved')
    );
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (err) {
    console.error('Error checking approved teachers:', err);
    return false;
  }
}

// Subscribe to Subjects
export function subscribeSubjects(callback: (subjects: Subject[]) => void) {
  const q = query(collection(db, 'subjects'));
  return onSnapshot(q, (snapshot) => {
    const subjects: Subject[] = [];
    snapshot.forEach((doc) => {
      subjects.push({ id: doc.id, ...doc.data() } as Subject);
    });
    callback(subjects);
  });
}

// Subscribe to Enrollments (All or Subject/Student)
export function subscribeAllEnrollments(callback: (enrollments: Enrollment[]) => void) {
  const q = query(collection(db, 'enrollments'));
  return onSnapshot(q, (snapshot) => {
    const enrollments: Enrollment[] = [];
    snapshot.forEach((doc) => {
      enrollments.push({ id: doc.id, ...doc.data() } as Enrollment);
    });
    callback(enrollments);
  });
}

export function subscribeStudentEnrollments(studentId: string, callback: (enrollments: Enrollment[]) => void) {
  const q = query(collection(db, 'enrollments'), where('studentId', '==', studentId));
  return onSnapshot(q, (snapshot) => {
    const enrollments: Enrollment[] = [];
    snapshot.forEach((doc) => {
      enrollments.push({ id: doc.id, ...doc.data() } as Enrollment);
    });
    callback(enrollments);
  });
}

// Subscribe to Attendance Records
export function subscribeAllAttendance(callback: (records: AttendanceRecord[]) => void) {
  const q = query(collection(db, 'attendance'));
  return onSnapshot(q, (snapshot) => {
    const records: AttendanceRecord[] = [];
    snapshot.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
    });
    callback(records);
  });
}

export function subscribeStudentAttendance(studentId: string, callback: (records: AttendanceRecord[]) => void) {
  const q = query(collection(db, 'attendance'), where('studentId', '==', studentId));
  return onSnapshot(q, (snapshot) => {
    const records: AttendanceRecord[] = [];
    snapshot.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
    });
    callback(records);
  });
}

// Subscribe to Activity Logs
export function subscribeActivityLogs(callback: (logs: ActivityLog[]) => void) {
  const q = query(collection(db, 'activityLogs'));
  return onSnapshot(q, (snapshot) => {
    const logs: ActivityLog[] = [];
    snapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() } as ActivityLog);
    });
    // Sort descending by timestamp
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    callback(logs);
  });
}

// Actions
export async function approveUserAccount(targetUid: string, approverName: string, approverUid: string) {
  const userRef = doc(db, 'users', targetUid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;
  const targetUser = snap.data() as UserProfile;

  await updateDoc(userRef, {
    status: 'approved',
    approvedBy: `${approverName} (${approverUid})`,
    approvedAt: new Date().toISOString()
  });

  await logActivity(
    'account_approval',
    targetUser.userCode,
    targetUser.name,
    targetUser.role,
    `Account approved by Teacher ${approverName}`,
    'info'
  );
}

export async function rejectUserAccount(targetUid: string, rejecterName: string, reason?: string) {
  const userRef = doc(db, 'users', targetUid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;
  const targetUser = snap.data() as UserProfile;

  await updateDoc(userRef, {
    status: 'rejected',
    rejectedReason: reason || 'Not approved by school administration.'
  });

  await logActivity(
    'account_rejection',
    targetUser.userCode,
    targetUser.name,
    targetUser.role,
    `Account rejected by Teacher ${rejecterName}. Reason: ${reason || 'None specified'}`,
    'warning'
  );
}

export function normalizeMeetUrl(url?: string): string | undefined {
  if (!url) return undefined;
  let trimmed = url.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('http://')) {
    trimmed = 'https://' + trimmed.slice(7);
  } else if (!trimmed.startsWith('https://')) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}

export async function createSubject(
  code: string, 
  name: string, 
  teacherId: string, 
  teacherName: string, 
  schedule: string, 
  room: string,
  meetUrl?: string,
  term?: string
) {
  const subjectsRef = collection(db, 'subjects');
  const normalizedMeet = normalizeMeetUrl(meetUrl);

  const newSubject: any = {
    code: code.trim().toUpperCase(),
    name: name.trim(),
    teacherId,
    teacherName,
    schedule: schedule.trim() || 'Mon-Fri 09:00 AM',
    room: room.trim() || 'Room 101',
    term: term?.trim() || 'Fall 2026',
    blockedStudentIds: [],
    isSessionOpen: false,
    activeSessionCode: '',
    createdAt: new Date().toISOString()
  };

  if (normalizedMeet) {
    newSubject.meetUrl = normalizedMeet;
  }

  const docRef = await addDoc(subjectsRef, newSubject);
  return docRef.id;
}

export async function updateSubject(
  subjectId: string,
  data: Partial<Subject>,
  teacherName: string
) {
  const subjectRef = doc(db, 'subjects', subjectId);
  const updatedData: any = { ...data };
  if ('meetUrl' in updatedData) {
    updatedData.meetUrl = normalizeMeetUrl(updatedData.meetUrl) || '';
  }

  await updateDoc(subjectRef, updatedData);

  await logActivity(
    'subject_created',
    data.code || 'SUBJECT',
    teacherName,
    'teacher',
    `Updated subject details for '${data.name || subjectId}'`,
    'info'
  );
}

export async function deleteSubject(subjectId: string, subjectCode: string, teacherName: string) {
  await deleteDoc(doc(db, 'subjects', subjectId));

  await logActivity(
    'subject_created',
    subjectCode || 'SUBJECT',
    teacherName,
    'teacher',
    `Deleted subject (${subjectCode})`,
    'warning'
  );
}

export async function removeStudentFromSubject(
  subjectId: string,
  enrollmentId: string,
  studentId: string,
  blockStudent: boolean,
  teacherName: string
) {
  // 1. Mark or remove enrollment
  const enrollmentRef = doc(db, 'enrollments', enrollmentId);
  await updateDoc(enrollmentRef, {
    status: 'rejected',
    updatedAt: new Date().toISOString()
  });

  // 2. If blocking, append studentId to subject's blockedStudentIds
  if (blockStudent) {
    const subjectRef = doc(db, 'subjects', subjectId);
    await updateDoc(subjectRef, {
      blockedStudentIds: arrayUnion(studentId)
    });
  }

  await logActivity(
    'enrollment_action',
    studentId,
    'Student',
    'teacher',
    `Teacher ${teacherName} removed student from subject (Blocked from re-enrolling: ${blockStudent ? 'YES' : 'NO'})`,
    blockStudent ? 'warning' : 'info'
  );
}

export async function blockStudentFromSubject(
  subjectId: string,
  studentId: string,
  teacherName: string = 'Faculty'
) {
  const subjectRef = doc(db, 'subjects', subjectId);
  await updateDoc(subjectRef, {
    blockedStudentIds: arrayUnion(studentId)
  });
  await logActivity(
    'enrollment_action',
    studentId,
    'Student',
    'teacher',
    `Teacher ${teacherName} blocked student from enrolling in subject`,
    'warning'
  );
}

export async function unblockStudentFromSubject(
  subjectId: string,
  studentId: string,
  teacherName: string = 'Faculty'
) {
  const subjectRef = doc(db, 'subjects', subjectId);
  await updateDoc(subjectRef, {
    blockedStudentIds: arrayRemove(studentId)
  });
  await logActivity(
    'enrollment_action',
    studentId,
    'Student',
    'teacher',
    `Teacher ${teacherName} unblocked student from enrolling in subject`,
    'info'
  );
}

export async function requestEnrollment(student: UserProfile, subject: Subject) {
  // Check if student is blocked
  if (subject.blockedStudentIds && subject.blockedStudentIds.includes(student.uid)) {
    throw new Error('You have been blocked from enrolling in this subject by the course instructor.');
  }

  const enrollmentsRef = collection(db, 'enrollments');
  const newEnrollment = {
    studentId: student.uid,
    studentName: student.name,
    studentUserCode: student.userCode,
    subjectId: subject.id,
    subjectCode: subject.code,
    subjectName: subject.name,
    teacherId: subject.teacherId,
    status: 'pending',
    requestedAt: new Date().toISOString()
  };
  await addDoc(enrollmentsRef, newEnrollment);

  await logActivity(
    'enrollment_request',
    student.userCode,
    student.name,
    'student',
    `Applied to enroll in subject ${subject.name} (${subject.code})`,
    'info'
  );
}

export async function processEnrollment(enrollmentId: string, status: 'approved' | 'rejected', teacherName: string) {
  const enrollmentRef = doc(db, 'enrollments', enrollmentId);
  const snap = await getDoc(enrollmentRef);
  if (!snap.exists()) return;
  const enr = snap.data() as Enrollment;

  await updateDoc(enrollmentRef, {
    status,
    updatedAt: new Date().toISOString()
  });

  await logActivity(
    'enrollment_action',
    enr.studentUserCode,
    enr.studentName,
    'student',
    `Enrollment for ${enr.subjectName} set to ${status} by Teacher ${teacherName}`,
    status === 'approved' ? 'info' : 'warning'
  );
}

export async function recordAttendance(
  student: { uid: string; name: string; userCode: string },
  subject: { id: string; code: string; name: string },
  date: string, // YYYY-MM-DD
  status: AttendanceStatus,
  note: string = '',
  markedBy: 'student' | 'teacher',
  markerInfo: { uid: string; name: string },
  sessionCodeVerified: boolean = false
) {
  // Check if attendance record exists for this student + subject + date
  const q = query(
    collection(db, 'attendance'),
    where('studentId', '==', student.uid),
    where('subjectId', '==', subject.id),
    where('date', '==', date)
  );
  const snap = await getDocs(q);

  const isStudentSelf = markedBy === 'student';

  if (!snap.empty) {
    // Override existing
    const existingDoc = snap.docs[0];
    await updateDoc(doc(db, 'attendance', existingDoc.id), {
      status,
      note,
      timestamp: new Date().toISOString(),
      markedBy,
      markedByName: markerInfo.name,
      markedById: markerInfo.uid,
      sessionCodeVerified
    });

    await logActivity(
      isStudentSelf ? 'self_check_in' : 'attendance_override',
      student.userCode,
      student.name,
      markedBy === 'teacher' ? 'teacher' : 'student',
      `${isStudentSelf ? 'Student self-check-in updated' : 'Teacher ' + markerInfo.name + ' updated'} check-in status to '${status.toUpperCase()}' for ${subject.name} on ${date}${sessionCodeVerified ? ' (Live PIN Verified)' : ''}${note ? ' (Note: ' + note + ')' : ''}`,
      'info'
    );
  } else {
    // Create new record
    const attendanceRef = collection(db, 'attendance');
    await addDoc(attendanceRef, {
      studentId: student.uid,
      studentName: student.name,
      studentUserCode: student.userCode,
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectName: subject.name,
      date,
      status,
      note,
      timestamp: new Date().toISOString(),
      markedBy,
      markedByName: markerInfo.name,
      markedById: markerInfo.uid,
      sessionCodeVerified
    });

    await logActivity(
      isStudentSelf ? 'self_check_in' : 'attendance_checkin',
      student.userCode,
      student.name,
      markedBy === 'teacher' ? 'teacher' : 'student',
      `${isStudentSelf ? 'Student self-check-in' : 'Teacher marked attendance'}: '${status.toUpperCase()}' for ${subject.name} on ${date}${sessionCodeVerified ? ' (Live PIN Verified)' : ''}${note ? ' (Note: ' + note + ')' : ''}`,
      'info'
    );
  }
}

// Start a live in-person attendance session with rolling 4-digit PIN
export async function startSubjectAttendanceSession(
  subjectId: string, 
  durationMinutes: number = 30,
  teacherName: string = 'Teacher'
): Promise<string> {
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
  
  const subjectRef = doc(db, 'subjects', subjectId);
  await updateDoc(subjectRef, {
    activeSessionCode: pin,
    isSessionOpen: true,
    activeSessionExpiresAt: expiresAt
  });

  await logActivity(
    'session_code_generated',
    pin,
    teacherName,
    'teacher',
    `Teacher ${teacherName} opened live check-in session with PIN #${pin} (expires in ${durationMinutes} mins)`,
    'info'
  );

  return pin;
}

// Close a live attendance session
export async function closeSubjectAttendanceSession(
  subjectId: string,
  teacherName: string = 'Teacher'
) {
  const subjectRef = doc(db, 'subjects', subjectId);
  await updateDoc(subjectRef, {
    isSessionOpen: false,
    activeSessionCode: '',
    activeSessionExpiresAt: ''
  });

  await logActivity(
    'session_code_generated',
    'CLOSED',
    teacherName,
    'teacher',
    `Teacher ${teacherName} closed live attendance session`,
    'info'
  );
}

// Submit an attendance correction/dispute request (Student)
export async function submitAttendanceCorrectionRequest(
  data: Omit<AttendanceCorrectionRequest, 'id' | 'createdAt' | 'status'>
) {
  const ref = collection(db, 'attendanceDisputes');
  await addDoc(ref, {
    ...data,
    status: 'pending',
    createdAt: new Date().toISOString()
  });

  await logActivity(
    'attendance_correction_requested',
    data.studentUserCode,
    data.studentName,
    'student',
    `Student requested attendance correction for ${data.subjectName} on ${data.date} (From ${data.currentStatus.toUpperCase()} to ${data.requestedStatus.toUpperCase()}): "${data.reason}"`,
    'info'
  );
}

// Subscribe to attendance correction requests
export function subscribeAttendanceCorrectionRequests(
  filter: { studentId?: string; teacherId?: string },
  callback: (requests: AttendanceCorrectionRequest[]) => void
) {
  const q = query(collection(db, 'attendanceDisputes'));
  return onSnapshot(q, (snapshot) => {
    const list: AttendanceCorrectionRequest[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as AttendanceCorrectionRequest);
    });

    // Apply filtering
    let filtered = list;
    if (filter.studentId) {
      filtered = filtered.filter(r => r.studentId === filter.studentId);
    }
    if (filter.teacherId) {
      filtered = filtered.filter(r => r.teacherId === filter.teacherId || !r.teacherId);
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(filtered);
  });
}

// Resolve attendance correction request (Teacher)
export async function resolveAttendanceCorrectionRequest(
  request: AttendanceCorrectionRequest,
  resolution: 'approved' | 'rejected',
  teacherNote: string,
  teacherUser: { uid: string; name: string }
) {
  const reqRef = doc(db, 'attendanceDisputes', request.id);
  await updateDoc(reqRef, {
    status: resolution,
    teacherNote: teacherNote.trim() || undefined,
    resolvedAt: new Date().toISOString()
  });

  // If approved, automatically update the actual attendance record!
  if (resolution === 'approved') {
    await recordAttendance(
      { uid: request.studentId, name: request.studentName, userCode: request.studentUserCode },
      { id: request.subjectId, code: request.subjectCode, name: request.subjectName },
      request.date,
      request.requestedStatus,
      `Correction Approved by ${teacherUser.name}${teacherNote ? ': ' + teacherNote : ''}`,
      'teacher',
      teacherUser
    );
  }

  await logActivity(
    'attendance_correction_resolved',
    request.studentUserCode,
    request.studentName,
    'teacher',
    `Teacher ${teacherUser.name} ${resolution.toUpperCase()} attendance correction for ${request.subjectName} on ${request.date}`,
    resolution === 'approved' ? 'info' : 'warning'
  );
}

// Bulk Import Roster: Takes an array of students and enrolls them into a subject
export async function bulkImportRosterToSubject(
  subject: Subject,
  studentRows: Array<{ name: string; userCode: string; email?: string }>,
  teacherUser: { uid: string; name: string }
): Promise<{ added: number; existing: number }> {
  let added = 0;
  let existing = 0;

  for (const row of studentRows) {
    const cleanName = row.name.trim();
    const cleanCode = row.userCode.trim().toUpperCase();
    if (!cleanName || !cleanCode) continue;

    // Check if user already exists
    const usersRef = collection(db, 'users');
    const qUser = query(usersRef, where('userCode', '==', cleanCode));
    const userSnap = await getDocs(qUser);
    
    let studentUid = '';
    if (!userSnap.empty) {
      studentUid = userSnap.docs[0].id;
    } else {
      // Create user record
      const syntheticEmail = getSyntheticEmail(cleanCode, 'student');
      const newUserDoc = doc(usersRef);
      studentUid = newUserDoc.id;
      await setDoc(newUserDoc, {
        uid: studentUid,
        userCode: cleanCode,
        name: cleanName,
        email: row.email?.trim() || syntheticEmail,
        syntheticEmail,
        role: 'student',
        status: 'approved',
        departmentOrLocation: 'Enrolled via Roster Import',
        createdAt: new Date().toISOString(),
        approvedBy: teacherUser.name,
        approvedAt: new Date().toISOString()
      });
    }

    // Check if enrollment already exists
    const enrRef = collection(db, 'enrollments');
    const qEnr = query(
      enrRef,
      where('studentId', '==', studentUid),
      where('subjectId', '==', subject.id)
    );
    const enrSnap = await getDocs(qEnr);

    if (enrSnap.empty) {
      await addDoc(enrRef, {
        studentId: studentUid,
        studentName: cleanName,
        studentUserCode: cleanCode,
        subjectId: subject.id,
        subjectCode: subject.code,
        subjectName: subject.name,
        teacherId: subject.teacherId,
        status: 'approved',
        requestedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      added++;
    } else {
      existing++;
    }
  }

  await logActivity(
    'bulk_roster_imported',
    subject.code,
    teacherUser.name,
    'teacher',
    `Teacher ${teacherUser.name} bulk imported roster for ${subject.name} (${added} enrolled, ${existing} already in course)`,
    'info'
  );

  return { added, existing };
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, data);
}

// ==========================================
// CLASSROOM: ANNOUNCEMENTS & STREAM
// ==========================================

export function subscribeAnnouncements(callback: (announcements: Announcement[]) => void) {
  const q = query(collection(db, 'announcements'));
  return onSnapshot(q, (snapshot) => {
    const list: Announcement[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Announcement);
    });
    // Sort pinned top, then descending by createdAt
    list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    callback(list);
  });
}

export async function createAnnouncement(
  title: string,
  content: string,
  teacherId: string,
  teacherName: string,
  subjectId: string,
  subjectCode: string,
  subjectName: string,
  isPinned: boolean = false,
  targetAudience: 'all' | 'students_only' | 'teachers_only' = 'all',
  attachment?: {
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentSize?: number;
    attachmentType?: string;
  },
  meetUrl?: string
) {
  const ref = collection(db, 'announcements');
  const data: any = {
    title: title.trim(),
    content: content.trim(),
    teacherId,
    teacherName,
    subjectId,
    subjectCode,
    subjectName,
    isPinned,
    targetAudience,
    createdAt: new Date().toISOString()
  };

  const normalizedMeet = normalizeMeetUrl(meetUrl);
  if (normalizedMeet) {
    data.meetUrl = normalizedMeet;
  }

  if (attachment && attachment.attachmentUrl) {
    data.attachmentUrl = attachment.attachmentUrl;
    data.attachmentName = attachment.attachmentName || 'Attachment';
    data.attachmentSize = attachment.attachmentSize || 0;
    data.attachmentType = attachment.attachmentType || '';
  }

  const docRef = await addDoc(ref, data);

  await logActivity(
    'subject_created',
    subjectCode || 'STREAM',
    teacherName,
    'teacher',
    `Posted announcement: "${title.trim()}" for ${subjectName} [Audience: ${targetAudience.replace('_', ' ').toUpperCase()}]`,
    'info'
  );

  return docRef.id;
}

export async function deleteAnnouncement(announcementId: string) {
  await deleteDoc(doc(db, 'announcements', announcementId));
}

export function subscribeAnnouncementComments(announcementId: string, callback: (comments: AnnouncementComment[]) => void) {
  const q = query(
    collection(db, 'announcementComments'),
    where('announcementId', '==', announcementId)
  );
  return onSnapshot(q, (snapshot) => {
    const comments: AnnouncementComment[] = [];
    snapshot.forEach((docSnap) => {
      comments.push({ id: docSnap.id, ...docSnap.data() } as AnnouncementComment);
    });
    comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    callback(comments);
  });
}

export async function addAnnouncementComment(
  announcementId: string,
  authorId: string,
  authorName: string,
  authorRole: UserRole,
  content: string,
  commentType: 'public' | 'private' = 'public',
  recipientStudentId?: string,
  authorAvatar?: string
) {
  const ref = collection(db, 'announcementComments');
  const data: any = {
    announcementId,
    authorId,
    authorName,
    authorRole,
    content: content.trim(),
    commentType,
    createdAt: new Date().toISOString()
  };

  if (recipientStudentId) {
    data.recipientStudentId = recipientStudentId;
  }

  if (authorAvatar) {
    data.authorAvatar = authorAvatar;
  }

  await addDoc(ref, data);
}

export async function deleteAnnouncementComment(commentId: string) {
  await deleteDoc(doc(db, 'announcementComments', commentId));
}

// ==========================================
// CLASSROOM: ASSIGNMENTS & SUBMISSIONS
// ==========================================

export function subscribeAssignments(callback: (assignments: Assignment[]) => void) {
  const q = query(collection(db, 'assignments'));
  return onSnapshot(q, (snapshot) => {
    const list: Assignment[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Assignment);
    });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  });
}

export async function createAssignment(
  title: string,
  description: string,
  type: AssignmentType,
  subjectId: string,
  subjectCode: string,
  subjectName: string,
  teacherId: string,
  teacherName: string,
  dueDate: string,
  points: number = 100,
  attachment?: {
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentSize?: number;
    attachmentType?: string;
  }
) {
  const ref = collection(db, 'assignments');
  const data: any = {
    title: title.trim(),
    description: description.trim(),
    type,
    subjectId,
    subjectCode,
    subjectName,
    teacherId,
    teacherName,
    dueDate,
    points,
    createdAt: new Date().toISOString()
  };

  if (attachment && attachment.attachmentUrl) {
    data.attachmentUrl = attachment.attachmentUrl;
    data.attachmentName = attachment.attachmentName || 'Materials';
    data.attachmentSize = attachment.attachmentSize || 0;
    data.attachmentType = attachment.attachmentType || '';
  }

  const docRef = await addDoc(ref, data);

  await logActivity(
    'subject_created',
    subjectCode,
    teacherName,
    'teacher',
    `Created ${type.toUpperCase()}: "${title.trim()}" due ${dueDate}`,
    'info'
  );

  return docRef.id;
}

export async function deleteAssignment(assignmentId: string) {
  await deleteDoc(doc(db, 'assignments', assignmentId));
}

export function subscribeSubmissions(callback: (submissions: Submission[]) => void) {
  const q = query(collection(db, 'submissions'));
  return onSnapshot(q, (snapshot) => {
    const list: Submission[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Submission);
    });
    callback(list);
  });
}

export function subscribeStudentSubmissions(studentId: string, callback: (submissions: Submission[]) => void) {
  const q = query(
    collection(db, 'submissions'),
    where('studentId', '==', studentId)
  );
  return onSnapshot(q, (snapshot) => {
    const list: Submission[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Submission);
    });
    callback(list);
  });
}

export async function submitAssignmentWork(
  assignmentId: string,
  student: { uid: string; name: string; userCode: string },
  subjectId: string,
  content: string,
  dueDate?: string,
  attachment?: {
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentSize?: number;
    attachmentType?: string;
  }
) {
  // Late submission detection: compare current time with dueDate
  let isLate = false;
  if (dueDate) {
    try {
      const dueTimestamp = new Date(dueDate).getTime();
      if (!isNaN(dueTimestamp) && Date.now() > dueTimestamp) {
        isLate = true;
      }
    } catch (err) {
      // ignore
    }
  }

  const submissionStatus: SubmissionStatus = isLate ? 'late' : 'submitted';

  // Check if existing submission doc
  const q = query(
    collection(db, 'submissions'),
    where('assignmentId', '==', assignmentId),
    where('studentId', '==', student.uid)
  );
  const snap = await getDocs(q);

  const payload: any = {
    assignmentId,
    studentId: student.uid,
    studentName: student.name,
    studentUserCode: student.userCode,
    subjectId,
    content,
    submittedAt: new Date().toISOString(),
    status: submissionStatus
  };

  if (attachment && attachment.attachmentUrl) {
    payload.attachmentUrl = attachment.attachmentUrl;
    payload.attachmentName = attachment.attachmentName || 'Submitted Work';
    payload.attachmentSize = attachment.attachmentSize || 0;
    payload.attachmentType = attachment.attachmentType || '';
  }

  if (!snap.empty) {
    const existingDoc = snap.docs[0];
    await updateDoc(doc(db, 'submissions', existingDoc.id), payload);
  } else {
    await addDoc(collection(db, 'submissions'), payload);
  }

  await logActivity(
    'self_check_in',
    student.userCode,
    student.name,
    'student',
    `Submitted work for assignment ID: ${assignmentId} (${isLate ? 'TURNED IN LATE' : 'ON TIME'})`,
    isLate ? 'warning' : 'info'
  );
}

export async function gradeSubmission(
  submissionId: string,
  grade: number,
  feedback: string,
  teacherName: string
) {
  const ref = doc(db, 'submissions', submissionId);
  await updateDoc(ref, {
    grade,
    feedback: feedback.trim(),
    status: 'graded',
    gradedAt: new Date().toISOString(),
    gradedByName: teacherName
  });
}

// ==========================================
// DIRECT MESSAGING
// ==========================================

export async function sendDirectMessage(
  senderOrSenderId: { uid: string; name: string; role?: UserRole } | string,
  recipientOrSenderName: { uid: string; name: string } | string,
  messageOrSenderRole?: string | UserRole,
  attachmentOrRecipientId?: any,
  recipientName?: string,
  messageText?: string,
  attachmentObj?: any
) {
  let sId = '';
  let sName = '';
  let sRole: UserRole = 'student';
  let rId = '';
  let rName = '';
  let msg = '';
  let att: any = undefined;

  if (typeof senderOrSenderId === 'object') {
    // 4-arg signature: (senderObj, recipientObj, message, attachment)
    sId = senderOrSenderId.uid;
    sName = senderOrSenderId.name;
    sRole = senderOrSenderId.role || 'student';

    const rObj = recipientOrSenderName as { uid: string; name: string };
    rId = rObj.uid;
    rName = rObj.name;
    msg = (messageOrSenderRole as string) || '';
    att = attachmentOrRecipientId;
  } else {
    // 7-arg signature: (senderId, senderName, senderRole, recipientId, recipientName, message, attachment)
    sId = senderOrSenderId;
    sName = recipientOrSenderName as string;
    sRole = (messageOrSenderRole as UserRole) || 'student';
    rId = attachmentOrRecipientId as string;
    rName = recipientName || '';
    msg = messageText || '';
    att = attachmentObj;
  }

  const payload: any = {
    senderId: sId,
    senderName: sName,
    senderRole: sRole,
    recipientId: rId,
    recipientName: rName,
    message: msg.trim(),
    read: false,
    timestamp: new Date().toISOString()
  };

  if (att && (att.attachmentUrl || att.dataUrl)) {
    payload.attachmentUrl = att.attachmentUrl || att.dataUrl;
    payload.attachmentName = att.attachmentName || att.fileName || 'Attachment';
    payload.attachmentSize = att.attachmentSize || att.fileSize || 0;
    payload.attachmentType = att.attachmentType || att.fileType || '';
  }

  const docRef = await addDoc(collection(db, 'direct_messages'), payload);
  return docRef.id;
}

export function subscribeUserDirectMessages(
  userId: string,
  callback: (messages: DirectMessage[]) => void
) {
  if (!userId) {
    callback([]);
    return () => {};
  }

  let sentMessages: DirectMessage[] = [];
  let receivedMessages: DirectMessage[] = [];

  const mapDocToDirectMessage = (d: any): DirectMessage => {
    const data = d.data();
    const recipientId = data.recipientId || data.receiverId || '';
    const message = data.message || data.content || '';
    const read = data.read ?? data.isRead ?? false;
    const timestamp = data.timestamp || data.createdAt || new Date().toISOString();

    return {
      id: d.id,
      ...data,
      recipientId,
      receiverId: recipientId,
      message,
      content: message,
      read,
      isRead: read,
      timestamp,
      createdAt: timestamp
    } as DirectMessage;
  };

  const notify = () => {
    const mergedMap = new Map<string, DirectMessage>();
    sentMessages.forEach((m) => mergedMap.set(m.id, m));
    receivedMessages.forEach((m) => mergedMap.set(m.id, m));
    const all = Array.from(mergedMap.values());
    all.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    callback(all);
  };

  const qSent = query(
    collection(db, 'direct_messages'),
    where('senderId', '==', userId)
  );
  const unsubSent = onSnapshot(
    qSent,
    (snap) => {
      sentMessages = snap.docs.map(mapDocToDirectMessage);
      notify();
    },
    (err) => console.error('Sent DM listener error:', err)
  );

  const qRecv = query(
    collection(db, 'direct_messages'),
    where('recipientId', '==', userId)
  );
  const unsubRecv = onSnapshot(
    qRecv,
    (snap) => {
      receivedMessages = snap.docs.map(mapDocToDirectMessage);
      notify();
    },
    (err) => console.error('Recv DM listener error:', err)
  );

  return () => {
    unsubSent();
    unsubRecv();
  };
}

export async function markDirectMessagesAsRead(messageIds: string[]) {
  if (!messageIds || messageIds.length === 0) return;
  const promises = messageIds.map((id) =>
    updateDoc(doc(db, 'direct_messages', id), {
      read: true,
      readAt: new Date().toISOString()
    }).catch((err) => console.error('Error marking DM read:', err))
  );
  await Promise.all(promises);
}

export const markMessagesAsRead = markDirectMessagesAsRead;
