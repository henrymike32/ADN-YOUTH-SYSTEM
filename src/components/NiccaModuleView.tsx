import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { useYouth } from '../context/YouthContext';
import { PAYMENT_COOPERATIVE_BANK } from '../data/archdioceseHierarchy';
import {
  GraduationCap,
  ArrowLeft,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Building,
  Phone,
} from 'lucide-react';

interface NiccaModuleViewProps {
  onBackToHome: () => void;
}

const INSTITUTIONS_LIST = [
  'Dedan Kimathi University of Technology (DeKUT)',
  'Karatina University (Main Campus, Kagochi)',
  'Kenya Medical Training College (KMTC) Nyeri',
  'Consolata Hospital Mathari Nursing College',
  'The Nyeri National Polytechnic',
  'Kagumo Teachers Training College',
  'Other',
];

export const NiccaModuleView: React.FC<NiccaModuleViewProps> = ({ onBackToHome }) => {
  const { niccaStudents, addNiccaStudent, loginModuleAccount } = useYouth();

  const [activeTab, setActiveTab] = useState<'register' | 'login' | 'dashboard'>('register');

  // Registration state
  const [fullName, setFullName] = useState('');
  const [institutionChoice, setInstitutionChoice] = useState(INSTITUTIONS_LIST[0]);
  const [customInstitution, setCustomInstitution] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [mpesaCode, setMpesaCode] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loggedStudentId, setLoggedStudentId] = useState<string | null>(null);

  const loggedStudent = useMemo(
    () => niccaStudents.find((s) => s.id === loggedStudentId) || null,
    [niccaStudents, loggedStudentId]
  );

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const resolvedInstitution =
      institutionChoice === 'Other' ? customInstitution.trim() : institutionChoice;

    if (!fullName.trim()) {
      setRegError('Please enter your full name.');
      return;
    }
    if (!resolvedInstitution) {
      setRegError('Please enter or select your institution.');
      return;
    }
    if (!phone.trim()) {
      setRegError('Please enter your phone number.');
      return;
    }
    if (!password.trim()) {
      setRegError('Please enter a password for login.');
      return;
    }
    if (!mpesaCode.trim()) {
      setRegError('Please enter the M-Pesa transaction code for the KSh 100 registration.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await addNiccaStudent({
        fullName: fullName.trim(),
        institution: resolvedInstitution,
        phone: phone.trim(),
        password: password.trim(),
        course: 'NICCA Student Member',
        mpesaCode: mpesaCode.trim().toUpperCase(),
        amountPaid: 100,
        paymentStatus: 'Paid',
      });

      setLoggedStudentId(created.id);
      setActiveTab('dashboard');
      setFullName('');
      setCustomInstitution('');
      setPhone('');
      setPassword('');
      setMpesaCode('');

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setRegError(err?.message || 'Error completing registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanId = loginIdentifier.trim();
    const cleanPass = loginPassword.trim();

    if (!cleanId || !cleanPass) {
      setLoginError('Please enter both phone number / Student ID and password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await loginModuleAccount('nicca', cleanId, cleanPass);
      setLoggedStudentId(res.record.id);
      setLoginIdentifier('');
      setLoginPassword('');
      setActiveTab('dashboard');
    } catch (err: any) {
      setLoginError(err?.message || 'Invalid phone number / ID or password. Please verify and try again.');
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
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-200 shadow-lg'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white opacity-90'
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
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-red-600" />
                    <span>NICCA Registration</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Nyeri Inter-Colleges and Catholic Association · Registration Fee: KSh 100
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold text-red-800 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                  KSh 100
                </span>
              </div>

              {regError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{regError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Clara Muthoni Ndegwa"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Institution (College / University) *
                  </label>
                  <select
                    value={institutionChoice}
                    onChange={(e) => setInstitutionChoice(e.target.value)}
                    className="w-full px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden cursor-pointer"
                  >
                    {INSTITUTIONS_LIST.map((inst) => (
                      <option key={inst} value={inst}>
                        {inst}
                      </option>
                    ))}
                  </select>

                  {institutionChoice === 'Other' && (
                    <input
                      type="text"
                      required
                      value={customInstitution}
                      onChange={(e) => setCustomInstitution(e.target.value)}
                      placeholder="Enter your college or university name"
                      className="mt-2 w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0744556677"
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

                {/* Registration Fee 100 KES via M-Pesa */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-2">
                    <span>M-Pesa Registration Payment</span>
                    <span className="text-emerald-700 font-mono">Registration: KSh 100</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[9px] font-sans">PAYBILL NUMBER</span>
                      <span className="font-black text-slate-900 text-sm">{PAYMENT_COOPERATIVE_BANK.paybill}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[9px] font-sans">ACCOUNT NUMBER</span>
                      <span className="font-black text-emerald-800 text-sm">{PAYMENT_COOPERATIVE_BANK.accountNumber}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[9px] font-sans">ACCOUNT NAME</span>
                      <span className="font-black text-slate-900 text-xs">{PAYMENT_COOPERATIVE_BANK.accountName}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    M-Pesa Transaction Code (KSh 100) *
                  </label>
                  <input
                    type="text"
                    required
                    value={mpesaCode}
                    onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                    placeholder="e.g. QDF4455667"
                    className="w-full px-3.5 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit NICCA Registration (KSh 100)'}
                </button>
              </form>
            </div>
          )}

          {/* LOGIN TAB */}
          {activeTab === 'login' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">NICCA Student Login</h2>
                <p className="text-xs text-slate-500">
                  Enter your registered phone number (or NICCA Student ID) and password.
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
                    Phone Number or NICCA ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. 0744556677 or NICCA-2027-001"
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
                  {isLoggingIn ? 'Signing in...' : 'Login to NICCA Portal'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* LOGGED IN NICCA STUDENT DASHBOARD */}
      {activeTab === 'dashboard' && loggedStudent && (
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                NICCA Accreditation Active
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1.5">{loggedStudent.fullName}</h2>
              <div className="text-xs font-mono font-bold text-red-700 mt-0.5">{loggedStudent.id}</div>
            </div>

            <button
              type="button"
              onClick={() => {
                setLoggedStudentId(null);
                setActiveTab('login');
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-700 bg-slate-100 hover:bg-red-50 rounded-xl cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 sm:col-span-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Building className="w-3 h-3" /> Institution
              </div>
              <div className="font-bold text-slate-900 mt-0.5">{loggedStudent.institution}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone Number
              </div>
              <div className="font-mono font-bold text-slate-900 mt-0.5">{loggedStudent.phone}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Registration Payment</div>
              <div className="font-mono font-bold text-emerald-800 mt-0.5">
                KSh {loggedStudent.amountPaid ?? 100} · {loggedStudent.mpesaCode || 'Paid'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
