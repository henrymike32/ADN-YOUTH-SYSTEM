import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useYouth } from '../context/YouthContext';
import { YouthMember } from '../types';
import { ARCHDIOCESE_DEANERIES_AND_PARISHES, PAYMENT_COOPERATIVE_BANK } from '../data/archdioceseHierarchy';
import {
  Sparkles,
  ArrowLeft,
  LogIn,
  UserPlus,
  AlertCircle,
  CreditCard,
  LogOut,
  CheckCircle2,
  Phone,
  Church,
} from 'lucide-react';

interface JuniorYouthProps {
  onBackToHome: () => void;
  onOpenNewMemberModal?: () => void;
  onEditMember?: (member: YouthMember) => void;
  onViewMemberCard: (member: YouthMember) => void;
}

export const JuniorYouthModuleView: React.FC<JuniorYouthProps> = ({
  onBackToHome,
  onViewMemberCard,
}) => {
  const { members, parishes, deaneries, addMember, loginModuleAccount } = useYouth();

  const [activeTab, setActiveTab] = useState<'register' | 'login' | 'dashboard'>('register');

  // Registration Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
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
  const [loggedMemberId, setLoggedMemberId] = useState<string | null>(null);

  const juniorMembers = useMemo(
    () => members.filter((m) => m.movement === 'Junior Youth'),
    [members]
  );

  const loggedMember = useMemo(
    () => juniorMembers.find((m) => m.id === loggedMemberId) || null,
    [juniorMembers, loggedMemberId]
  );

  // Sync parish options with selected deanery
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
      setRegError('Please enter a phone number.');
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
      setRegError('Please enter the M-Pesa transaction code.');
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

      const created = await addMember({
        fullName: fullName.trim(),
        gender: 'Male',
        dob: '2011-01-01',
        age: 15,
        phone: phone.trim(),
        email: `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '')}@adn-youth.org`,
        deaneryId: dObj?.id || deanerySlug,
        parishId: pObj?.id || parishSlug,
        deaneryName: selectedDeanery,
        parishName: selectedParish,
        subParish: localChurch.trim(),
        localChurch: localChurch.trim(),
        movement: 'Junior Youth',
        occupation: 'Junior Youth Member',
        sacraments: {
          baptism: true,
          firstCommunion: true,
          confirmation: false,
          matrimony: false,
        },
        ministryGuild: 'Junior Youth Guild',
        leadershipRole: 'Member',
        emergencyContact: {
          name: 'Parent / Guardian',
          relation: 'Parent',
          phone: phone.trim(),
        },
        joinedDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        skills: ['Junior Youth'],
        approvalStatus: 'Confirmed',
        mpesaRef: mpesaCode.trim().toUpperCase(),
        registrationFee: 100,
        password: password.trim(),
      });

      setLoggedMemberId(created.id);
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
      setLoginError('Please enter both phone number / ID and password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await loginModuleAccount('junior-youth', cleanId, cleanPass);
      setLoggedMemberId(res.record.id);
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
                  ? 'bg-sky-600 text-white ring-4 ring-sky-200 shadow-lg'
                  : 'bg-sky-700 hover:bg-sky-600 text-white opacity-90'
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
                    <Sparkles className="w-5 h-5 text-sky-600" />
                    <span>Junior Youth Registration</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Catholic Archdiocese of Nyeri · Registration Fee: KSh 100
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
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
                    placeholder="e.g. Brian Mwangi"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
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
                      placeholder="e.g. 0722123456"
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

                {/* M-Pesa Payment Details */}
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

                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 text-[11px] text-emerald-950 space-y-1">
                    <span className="font-bold text-emerald-900 block text-xs">
                      How to Pay via M-Pesa:
                    </span>
                    <ol className="list-decimal list-inside space-y-0.5 text-slate-700 font-medium">
                      <li>Go to <strong>M-Pesa</strong> &gt; <strong>Lipa na M-Pesa</strong> &gt; <strong>Paybill</strong></li>
                      <li>Business No: <strong className="font-mono text-slate-900">{PAYMENT_COOPERATIVE_BANK.paybill}</strong></li>
                      <li>Account No: <strong className="font-mono text-slate-900">{PAYMENT_COOPERATIVE_BANK.accountNumber}</strong></li>
                      <li>Amount: <strong className="font-mono text-slate-900">KSh 100</strong></li>
                      <li>Enter your M-Pesa PIN and copy the transaction code below</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    M-Pesa Transaction Code *
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
                  className="w-full py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Junior Youth Registration'}
                </button>
              </form>
            </div>
          )}

          {/* LOGIN TAB */}
          {activeTab === 'login' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">Junior Youth Login</h2>
                <p className="text-xs text-slate-500">
                  Enter your registered phone number (or Member ID) and password to access your pass.
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
                    Phone Number or Junior Youth ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. 0722123456 or ADN-YTH-..."
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
                  {isLoggingIn ? 'Signing in...' : 'Login to Profile'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* LOGGED IN JUNIOR YOUTH PROFILE */}
      {activeTab === 'dashboard' && loggedMember && (
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Registered Junior Youth
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1.5">{loggedMember.fullName}</h2>
              <div className="text-xs font-mono font-bold text-sky-700 mt-0.5">{loggedMember.id}</div>
            </div>

            <button
              type="button"
              onClick={() => {
                setLoggedMemberId(null);
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
                {loggedMember.deaneryName ||
                  deaneries.find((d) => d.id === loggedMember.deaneryId)?.name ||
                  'Nyeri Central'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Parish</div>
              <div className="font-bold text-slate-900 mt-0.5">
                {loggedMember.parishName ||
                  parishes.find((p) => p.id === loggedMember.parishId)?.name ||
                  loggedMember.parishId}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Church className="w-3 h-3" /> Local Church
              </div>
              <div className="font-bold text-emerald-800 mt-0.5">
                {loggedMember.localChurch || loggedMember.subParish || 'Parish Center'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone & M-Pesa
              </div>
              <div className="font-mono font-bold text-slate-900 mt-0.5">
                {loggedMember.phone}
                {loggedMember.mpesaRef ? ` · ${loggedMember.mpesaRef}` : ''}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onViewMemberCard(loggedMember)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-emerald-600 hover:from-red-700 hover:to-emerald-700 rounded-xl shadow-xs cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>View & Download Junior Youth Card</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
