import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useYouth } from '../context/YouthContext';
import { MatronPatron } from '../types';
import { ARCHDIOCESE_DEANERIES_AND_PARISHES, PAYMENT_COOPERATIVE_BANK } from '../data/archdioceseHierarchy';
import {
  ShieldCheck,
  ArrowLeft,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Church,
  Phone,
} from 'lucide-react';

interface MatronsPatronsProps {
  onBackToHome: () => void;
}

export const MatronsPatronsModuleView: React.FC<MatronsPatronsProps> = ({ onBackToHome }) => {
  const { matronsPatrons, addMatronPatron, loginModuleAccount, parishes, deaneries } = useYouth();

  const [activeTab, setActiveTab] = useState<'register' | 'login' | 'dashboard'>('register');

  // Registration State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<MatronPatron['role']>('Patron');
  const [selectedDeanery, setSelectedDeanery] = useState('Nyeri Central');
  const [selectedParish, setSelectedParish] = useState('Cathedral');
  const [localChurch, setLocalChurch] = useState('');
  const [mpesaCode, setMpesaCode] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loggedAnimatorId, setLoggedAnimatorId] = useState<string | null>(null);

  const loggedAnimator = useMemo(
    () => matronsPatrons.find((a) => a.id === loggedAnimatorId) || null,
    [matronsPatrons, loggedAnimatorId]
  );

  // Sync parish list with selected deanery
  const currentDeaneryObj = useMemo(() => {
    return (
      ARCHDIOCESE_DEANERIES_AND_PARISHES.find((d) => d.deanery === selectedDeanery) ||
      ARCHDIOCESE_DEANERIES_AND_PARISHES[0]
    );
  }, [selectedDeanery]);

  useEffect(() => {
    if (currentDeaneryObj && !currentDeaneryObj.parishes.includes(selectedParish)) {
      setSelectedParish(currentDeaneryObj.parishes[0] || '');
    }
  }, [selectedDeanery, currentDeaneryObj, selectedParish]);

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
    if (!password.trim()) {
      setRegError('Please create a password for login.');
      return;
    }
    if (!localChurch.trim()) {
      setRegError('Please enter your local church name.');
      return;
    }
    if (!mpesaCode.trim()) {
      setRegError('Please enter the M-Pesa transaction code for KSh 100.');
      return;
    }

    setIsSubmitting(true);
    try {
      const dObj = deaneries.find((d) =>
        d.name.toLowerCase().includes(selectedDeanery.toLowerCase())
      );
      const pObj = parishes.find(
        (p) =>
          p.name.toLowerCase() === selectedParish.toLowerCase() ||
          p.name.toLowerCase().includes(selectedParish.toLowerCase())
      );
      const deanerySlug = `deanery-${selectedDeanery.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const parishSlug = `parish-${selectedParish.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

      const created = await addMatronPatron({
        fullName: fullName.trim(),
        role,
        parishId: pObj?.id || parishSlug,
        deaneryId: dObj?.id || deanerySlug,
        deaneryName: selectedDeanery,
        parishName: selectedParish,
        localChurch: localChurch.trim(),
        phone: phone.trim(),
        password: password.trim(),
        amountPaid: 100,
        mpesaCode: mpesaCode.trim().toUpperCase(),
        commissionedDate: new Date().toISOString().split('T')[0],
        safeguardingCertified: true,
      });

      setLoggedAnimatorId(created.id);
      setActiveTab('dashboard');
      setFullName('');
      setPhone('');
      setPassword('');
      setLocalChurch('');
      setMpesaCode('');

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

    const cleanId = loginIdentifier.trim();
    const cleanPass = loginPassword.trim();

    if (!cleanId || !cleanPass) {
      setLoginError('Please enter both phone number / Animator ID and password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await loginModuleAccount('matrons-patrons', cleanId, cleanPass);
      setLoggedAnimatorId(res.record.id);
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
                    <ShieldCheck className="w-5 h-5 text-red-600" />
                    <span>Matrons & Patrons Registration</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Catholic Archdiocese of Nyeri · Registration Amount: KSh 100
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
                      placeholder="e.g. Mwalimu Patrick Kiboi"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Role *
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as MatronPatron['role'])}
                      className="w-full px-3 py-2 text-xs font-bold text-red-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden cursor-pointer"
                    >
                      <option value="Patron">Patron</option>
                      <option value="Matron">Matron</option>
                      <option value="Youth Animator">Youth Animator</option>
                      <option value="Spiritual Director">Spiritual Director</option>
                    </select>
                  </div>
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
                      placeholder="e.g. 0722554332"
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
                      Deanery *
                    </label>
                    <select
                      value={selectedDeanery}
                      onChange={(e) => setSelectedDeanery(e.target.value)}
                      className="w-full px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden cursor-pointer"
                    >
                      {ARCHDIOCESE_DEANERIES_AND_PARISHES.map((d) => (
                        <option key={d.deanery} value={d.deanery}>
                          {d.deanery} Deanery
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Parish *
                    </label>
                    <select
                      value={selectedParish}
                      onChange={(e) => setSelectedParish(e.target.value)}
                      className="w-full px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden cursor-pointer"
                    >
                      {currentDeaneryObj.parishes.map((p) => (
                        <option key={p} value={p}>
                          {p} Parish
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Local Church *
                  </label>
                  <input
                    type="text"
                    required
                    value={localChurch}
                    onChange={(e) => setLocalChurch(e.target.value)}
                    placeholder="e.g. St. Jude Outstation / Parish Main"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* Amount 100 via M-Pesa */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-2">
                    <span>M-Pesa Payment Details</span>
                    <span className="text-emerald-700 font-mono">Amount: KSh 100</span>
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
                    M-Pesa Transaction Code (Amount: KSh 100) *
                  </label>
                  <input
                    type="text"
                    required
                    value={mpesaCode}
                    onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SHK8921KL2"
                    className="w-full px-3.5 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Matron / Patron Registration (KSh 100)'}
                </button>
              </form>
            </div>
          )}

          {/* LOGIN TAB */}
          {activeTab === 'login' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">Matrons & Patrons Login</h2>
                <p className="text-xs text-slate-500">
                  Enter your registered phone number (or Animator ID) and password.
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
                    Phone Number or Animator ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. 0722554332 or ANIM-2027-..."
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
                  {isLoggingIn ? 'Signing in...' : 'Login to Animator Profile'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* LOGGED IN ANIMATOR PROFILE */}
      {activeTab === 'dashboard' && loggedAnimator && (
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {loggedAnimator.role} Accredited
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1.5">{loggedAnimator.fullName}</h2>
              <div className="text-xs font-mono font-bold text-red-700 mt-0.5">{loggedAnimator.id}</div>
            </div>

            <button
              type="button"
              onClick={() => {
                setLoggedAnimatorId(null);
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
              <div className="text-[10px] font-bold text-slate-400 uppercase">Deanery</div>
              <div className="font-bold text-slate-900 mt-0.5">
                {loggedAnimator.deaneryName ||
                  deaneries.find((d) => d.id === loggedAnimator.deaneryId)?.name ||
                  'Nyeri Central'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Parish</div>
              <div className="font-bold text-slate-900 mt-0.5">
                {loggedAnimator.parishName ||
                  parishes.find((p) => p.id === loggedAnimator.parishId)?.name ||
                  loggedAnimator.parishId ||
                  'Parish'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Church className="w-3 h-3" /> Local Church
              </div>
              <div className="font-bold text-emerald-800 mt-0.5">
                {loggedAnimator.localChurch || 'Parish Center'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone & Amount
              </div>
              <div className="font-mono font-bold text-slate-900 mt-0.5">
                {loggedAnimator.phone} · KSh {loggedAnimator.amountPaid ?? 100}
                {loggedAnimator.mpesaCode ? ` (${loggedAnimator.mpesaCode})` : ''}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
