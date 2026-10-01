import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { 
  Lock, 
  User, 
  UserPlus, 
  GraduationCap, 
  ShieldCheck, 
  AlertCircle,
  Mail,
  MapPin,
  CheckCircle2,
  Compass,
  ArrowRight
} from 'lucide-react';

interface RegisterFormProps {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  onSwitchToLogin: () => void;
}

const DEFAULT_SUBJECT_OPTIONS = [
  'Mathematics',
  'Science & Technology',
  'Computer Science',
  'English & Literature',
  'History & Civics',
  'Web Development',
  'Physics & Engineering'
];

export const RegisterForm: React.FC<RegisterFormProps> = ({ 
  role,
  onRoleChange,
  onSwitchToLogin
}) => {
  const { register } = useAuth();
  const [userCode, setUserCode] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [departmentOrLocation, setDepartmentOrLocation] = useState('Main Campus');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Mathematics']);
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTeacher = role === 'teacher';

  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [subjectOptions, setSubjectOptions] = useState<string[]>(DEFAULT_SUBJECT_OPTIONS);

  const handleAddCustomSubject = () => {
    const trimmed = customSubjectInput.trim();
    if (!trimmed) return;
    if (!subjectOptions.includes(trimmed)) {
      setSubjectOptions([...subjectOptions, trimmed]);
    }
    if (!selectedSubjects.includes(trimmed)) {
      setSelectedSubjects([...selectedSubjects, trimmed]);
    }
    setCustomSubjectInput('');
  };

  const toggleSubject = (sub: string) => {
    if (selectedSubjects.includes(sub)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register({
        userCode,
        name,
        password,
        role,
        departmentOrLocation,
        contactEmail,
        subjectsTaught: isTeacher ? selectedSubjects : []
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto my-4 sm:my-8 px-2 sm:px-4">
      
      {/* Editorial Header */}
      <div className="text-center mb-6 sm:mb-8 space-y-2">
        <h1 className="text-3xl sm:text-4xl font-display font-bold italic text-stone-900 dark:text-stone-100 tracking-tight">
          Create Account
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto font-sans">
          Register as a student or teacher to access the attendance system.
        </p>
      </div>

      {/* Main Form Plate */}
      <div className="relative bg-white/95 dark:bg-[#111318]/95 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-9 shadow-2xl shadow-stone-900/5 dark:shadow-black/50 backdrop-blur-md folio-card">
        
        {/* Subtle Corner Registration Marks */}
        <div className="absolute top-3 left-3 text-[9px] font-mono text-stone-400 dark:text-stone-600 select-none">+</div>
        <div className="absolute top-3 right-3 text-[9px] font-mono text-stone-400 dark:text-stone-600 select-none">+</div>
        <div className="absolute bottom-3 left-3 text-[9px] font-mono text-stone-400 dark:text-stone-600 select-none">+</div>
        <div className="absolute bottom-3 right-3 text-[9px] font-mono text-stone-400 dark:text-stone-600 select-none">+</div>

        {/* Role Switch */}
        <div className="mb-6 bg-stone-100 dark:bg-stone-900 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-800 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onRoleChange('student')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-heading font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              !isTeacher
                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <GraduationCap className="h-4 w-4 shrink-0" />
            <span className="tracking-wide">Student</span>
          </button>
          
          <button
            type="button"
            onClick={() => onRoleChange('teacher')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-heading font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              isTeacher
                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span className="tracking-wide">Teacher</span>
          </button>
        </div>

        {/* Notice Box */}
        <div className="mb-6 p-3.5 rounded-2xl bg-stone-100/90 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 text-xs flex items-start space-x-3">
          <Compass className="h-4 w-4 mt-0.5 shrink-0 text-stone-600 dark:text-stone-400" />
          <div className="leading-relaxed font-sans">
            <strong className="font-heading uppercase tracking-wider text-[10px] text-stone-900 dark:text-stone-100 block">Approval Notice:</strong>
            New {role} accounts require teacher approval before system entry.
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-start space-x-3">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
            <div className="leading-relaxed font-sans">{error}</div>
          </div>
        )}

        {/* Register Form with Underlined Rows */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* User ID Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {isTeacher ? 'Faculty ID' : 'Student ID'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative border-b border-stone-300 dark:border-stone-700 focus-within:border-stone-900 dark:focus-within:border-white transition-colors">
                <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-stone-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  id="register-user-code-input"
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  placeholder={isTeacher ? 'e.g. T-2001' : 'e.g. S-10045'}
                  className="w-full pl-8 pr-3 py-2 bg-transparent text-stone-900 dark:text-white text-sm focus:outline-none font-mono tracking-wide placeholder:text-stone-400 dark:placeholder:text-stone-600"
                />
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative border-b border-stone-300 dark:border-stone-700 focus-within:border-stone-900 dark:focus-within:border-white transition-colors">
                <input
                  type="text"
                  required
                  id="register-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full px-1 py-2 bg-transparent text-stone-900 dark:text-white text-sm focus:outline-none font-sans placeholder:text-stone-400 dark:placeholder:text-stone-600"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative border-b border-stone-300 dark:border-stone-700 focus-within:border-stone-900 dark:focus-within:border-white transition-colors">
                <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-stone-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  id="register-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-8 pr-3 py-2 bg-transparent text-stone-900 dark:text-white text-sm focus:outline-none font-mono tracking-widest placeholder:text-stone-400 dark:placeholder:text-stone-600"
                />
              </div>
            </div>

            {/* Contact Email (Optional) */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Contact Email <span className="text-stone-400 font-normal">(Optional)</span>
              </label>
              <div className="relative border-b border-stone-300 dark:border-stone-700 focus-within:border-stone-900 dark:focus-within:border-white transition-colors">
                <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-stone-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  id="register-contact-email-input"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="name@institute.edu"
                  className="w-full pl-8 pr-3 py-2 bg-transparent text-stone-900 dark:text-white text-sm focus:outline-none font-sans placeholder:text-stone-400 dark:placeholder:text-stone-600"
                />
              </div>
            </div>
          </div>

          {/* Department or Location */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {isTeacher ? 'Academic Department & Office' : 'Cohort / Grade Level & Section'}
            </label>
            <div className="relative border-b border-stone-300 dark:border-stone-700 focus-within:border-stone-900 dark:focus-within:border-white transition-colors">
              <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none text-stone-400">
                <MapPin className="h-4 w-4" />
              </div>
              <input
                type="text"
                id="register-dept-input"
                value={departmentOrLocation}
                onChange={(e) => setDepartmentOrLocation(e.target.value)}
                placeholder={isTeacher ? 'e.g. Science Building - Hall 302' : 'e.g. Class 10 - Section B'}
                className="w-full pl-8 pr-3 py-2 bg-transparent text-stone-900 dark:text-white text-sm focus:outline-none font-sans placeholder:text-stone-400 dark:placeholder:text-stone-600"
              />
            </div>
          </div>

          {/* If Teacher: Subjects Taught */}
          {isTeacher && (
            <div className="pt-3 space-y-2.5 border-t border-stone-200 dark:border-stone-800">
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Subjects Instructed <span className="text-rose-500">*</span>
              </label>

              {/* Type Custom Subject Input Box */}
              <div className="flex gap-2">
                <input
                  type="text"
                  id="register-custom-subject-input"
                  value={customSubjectInput}
                  onChange={(e) => setCustomSubjectInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSubject();
                    }
                  }}
                  placeholder="Add custom subject (e.g. Quantum Physics)..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-transparent text-stone-900 dark:text-white text-xs focus:outline-none focus:border-stone-900 dark:focus:border-white transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSubject}
                  id="add-custom-subject-btn"
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-heading font-bold text-xs shrink-0 transition-colors shadow-2xs cursor-pointer border border-stone-900 dark:border-white"
                >
                  + Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {subjectOptions.map((sub) => {
                  const isSel = selectedSubjects.includes(sub);
                  return (
                    <button
                      type="button"
                      key={sub}
                      onClick={() => toggleSubject(sub)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all flex items-center space-x-1 border cursor-pointer ${
                        isSel
                          ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950 border-stone-900 dark:border-white shadow-2xs'
                          : 'bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600'
                      }`}
                    >
                      {isSel && <CheckCircle2 className="h-3 w-3 mr-1 shrink-0" />}
                      <span>{sub}</span>
                    </button>
                  );
                })}
              </div>

              {selectedSubjects.length === 0 && (
                <p className="text-[11px] text-stone-500 font-mono">
                  * Select or register at least one instructional subject.
                </p>
              )}
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            id="register-submit-btn"
            className="w-full py-3.5 px-5 mt-4 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 font-heading font-bold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 border border-stone-900 dark:border-white"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white dark:border-stone-950/30 dark:border-t-stone-950 rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Create Account</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </button>

        </form>

        {/* Switch to Login */}
        <div className="mt-8 pt-5 border-t border-stone-200 dark:border-stone-800 text-center">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              id="switch-to-login-btn"
              className="font-bold text-stone-900 dark:text-white underline underline-offset-4 decoration-stone-300 dark:decoration-stone-700 hover:decoration-stone-900 dark:hover:decoration-white cursor-pointer transition-colors"
            >
              Sign in here →
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
