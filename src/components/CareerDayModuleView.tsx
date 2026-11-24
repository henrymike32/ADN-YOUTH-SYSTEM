import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { useYouth } from '../context/YouthContext';
import {
  Briefcase,
  ArrowLeft,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  LogOut,
  GraduationCap,
  MapPin,
  Phone,
} from 'lucide-react';

interface CareerDayProps {
  onBackToHome: () => void;
}

export const CareerDayModuleView: React.FC<CareerDayProps> = ({ onBackToHome }) => {
  const { careerRegistrations, addCareerRegistration, loginModuleAccount } = useYouth();

  const [activeTab, setActiveTab] = useState<'register' | 'login' | 'dashboard'>('register');

  // Registration State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [school, setSchool] = useState('');
  const [gradeAttained, setGradeAttained] = useState('');
  const [desiredCourse, setDesiredCourse] = useState('');
  const [homeAreaParish, setHomeAreaParish] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loggedRegId, setLoggedRegId] = useState<string | null>(null);

  const loggedReg = useMemo(
    () => careerRegistrations.find((r) => r.id === loggedRegId) || null,
    [careerRegistrations, loggedRegId]
  );

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!fullName.trim()) {
      setRegError('Please enter your full name.');
      return;
    }
    if (!phone.trim()) {
      setRegError('Please enter your phone number.');
      return;
    }
    if (!username.trim()) {
      setRegError('Please enter a username.');
      return;
    }
    if (!password.trim()) {
      setRegError('Please create a password for login.');
      return;
    }
    if (!school.trim()) {
      setRegError('Please enter your school name.');
      return;
    }
    if (!gradeAttained.trim()) {
      setRegError('Please enter the grade attained.');
      return;
    }
    if (!desiredCourse.trim()) {
      setRegError('Please enter your desired course.');
      return;
    }
    if (!homeAreaParish.trim()) {
      setRegError('Please enter your home area / parish.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await addCareerRegistration({
        fullName: fullName.trim(),
        phone: phone.trim(),
        username: username.trim(),
        password: password.trim(),
        school: school.trim(),
        gradeAttained: gradeAttained.trim(),
        desiredCourse: desiredCourse.trim(),
        homeAreaParish: homeAreaParish.trim(),
        careerField: desiredCourse.trim(),
        type: 'Mentee (Student/Seeker)',
        currentOrganization: school.trim(),
        skillsOrGoals: `Grade: ${gradeAttained.trim()} · Desired Course: ${desiredCourse.trim()}`,
      });

      setLoggedRegId(created.id);
      setActiveTab('dashboard');
      setFullName('');
      setPhone('');
      setUsername('');
      setPassword('');
      setSchool('');
      setGradeAttained('');
      setDesiredCourse('');
      setHomeAreaParish('');

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setRegError(err?.message || 'Error saving registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanUser = loginUsername.trim();
    const cleanPass = loginPassword.trim();

    if (!cleanUser || !cleanPass) {
      setLoginError('Please enter both username / phone and password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await loginModuleAccount('career-day', cleanUser, cleanPass);
      setLoggedRegId(res.record.id);
      setLoginUsername('');
      setLoginPassword('');
      setActiveTab('dashboard');
    } catch (err: any) {
      setLoginError(err?.message || 'Invalid username / phone or password. Please verify and try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <button
        type="button"
        onClick={onBackToHome}
        className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Main Dashboard</span>
      </button>

      {(activeTab === 'register' || activeTab === 'login') && (
        <div className="max-w-xl mx-auto space-y-6">
          {/* Register & Login Buttons */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setRegError(null);
              }}
              className={`py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-blue-600 text-white ring-4 ring-blue-200 shadow-lg'
                  : 'bg-blue-700 hover:bg-blue-600 text-white opacity-90'
              }`}
            >
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>Register</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setLoginError(null);
              }}
              className={`py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-red-600 text-white ring-4 ring-red-200 shadow-lg'
                  : 'bg-red-700 hover:bg-red-600 text-white opacity-90'
              }`}
            >
              <LogIn className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>Login</span>
            </button>
          </div>

          {/* REGISTER TAB */}
          {activeTab === 'register' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <span>CAREER DAY Registration</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Catholic Archdiocese of Nyeri · Career Guidance & Course Placement
                </p>
              </div>

              {regError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{regError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Timothy Wanjohi"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0711223344"
                      className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. timothy_w"
                      className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password (for Login) *
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      School *
                    </label>
                    <input
                      type="text"
                      required
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="e.g. Kagumo High School"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Grade Attained *
                    </label>
                    <input
                      type="text"
                      required
                      value={gradeAttained}
                      onChange={(e) => setGradeAttained(e.target.value)}
                      placeholder="e.g. B+ (KCSE)"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Desired Course *
                  </label>
                  <input
                    type="text"
                    required
                    value={desiredCourse}
                    onChange={(e) => setDesiredCourse(e.target.value)}
                    placeholder="e.g. BSc. Nursing / Software Engineering"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Home Area / Parish *
                  </label>
                  <input
                    type="text"
                    required
                    value={homeAreaParish}
                    onChange={(e) => setHomeAreaParish(e.target.value)}
                    placeholder="e.g. Giakanja Parish, Nyeri"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Career Day Registration'}
                </button>
              </form>
            </div>
          )}

          {/* LOGIN TAB */}
          {activeTab === 'login' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">Career Day Login</h2>
                <p className="text-xs text-slate-500">
                  Enter your username (or phone number) and password to view your profile.
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username or Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="e.g. timothy_w or 0711223344"
                    className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isLoggingIn ? 'Signing in...' : 'Login to Career Day Profile'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* LOGGED IN CAREER DAY PROFILE */}
      {activeTab === 'dashboard' && loggedReg && (
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Career Day Registered
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1.5">{loggedReg.fullName}</h2>
              <div className="text-xs font-mono font-bold text-blue-700 mt-0.5">
                {loggedReg.id} {loggedReg.username ? `· @${loggedReg.username}` : ''}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setLoggedRegId(null);
                setActiveTab('login');
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-700 bg-slate-100 hover:bg-red-50 rounded-xl cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone Number
              </div>
              <div className="font-mono font-bold text-slate-900 mt-0.5">{loggedReg.phone}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Home Area / Parish
              </div>
              <div className="font-bold text-slate-900 mt-0.5">
                {loggedReg.homeAreaParish || loggedReg.parishId || 'Nyeri'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <GraduationCap className="w-3 h-3" /> School
              </div>
              <div className="font-bold text-slate-900 mt-0.5">
                {loggedReg.school || loggedReg.currentOrganization}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Grade Attained</div>
              <div className="font-bold text-emerald-800 mt-0.5">
                {loggedReg.gradeAttained || '—'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 sm:col-span-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Desired Course</div>
              <div className="font-bold text-slate-900 mt-0.5">
                {loggedReg.desiredCourse || loggedReg.careerField}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
