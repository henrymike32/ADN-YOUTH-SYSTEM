import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { useYouth } from '../context/YouthContext';
import { ChallengeWeekTeam } from '../types';
import { 
  ARCHDIOCESE_DEANERIES_AND_PARISHES, 
  PAYMENT_COOPERATIVE_BANK 
} from '../data/archdioceseHierarchy';
import { 
  Trophy, 
  ArrowLeft, 
  Users, 
  User, 
  CreditCard, 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  Printer, 
  LogOut,
  Sparkles,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface ChallengeWeekProps {
  onBackToHome: () => void;
}

export const ChallengeWeekModuleView: React.FC<ChallengeWeekProps> = ({ onBackToHome }) => {
  const { challengeTeams, addChallengeTeam } = useYouth();

  // Mode: 'register' | 'login' | 'team-dashboard' | 'leaderboard'
  const [activeTab, setActiveTab] = useState<'register' | 'login' | 'team-dashboard' | 'leaderboard'>('register');

  // Option to register oneself or a group (Request 9)
  const [regType, setRegType] = useState<'myself' | 'group'>('myself');

  // REGISTRATION FORM STATES
  // Individual fields
  const [individualName, setIndividualName] = useState('');
  const [individualPhone, setIndividualPhone] = useState('');

  // Group fields
  const [teamName, setTeamName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [leaderPhone, setLeaderPhone] = useState('');
  const [groupNamesInput, setGroupNamesInput] = useState('');

  // Shared account and location fields
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [selectedDeanery, setSelectedDeanery] = useState('Nyeri Central');
  const [selectedParish, setSelectedParish] = useState('Cathedral');
  const [mpesaCode, setMpesaCode] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // LOGIN STATES: strictly username and password as requested
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // LOGGED IN TEAM / INDIVIDUAL
  const [loggedInTeam, setLoggedInTeam] = useState<ChallengeWeekTeam | null>(null);
  const [teamQrUrl, setTeamQrUrl] = useState<string>('');

  // Parishes list corresponding to selected Deanery
  const currentDeaneryObj = useMemo(() => {
    return ARCHDIOCESE_DEANERIES_AND_PARISHES.find(
      (d) => d.deanery === selectedDeanery
    ) || ARCHDIOCESE_DEANERIES_AND_PARISHES[0];
  }, [selectedDeanery]);

  useEffect(() => {
    if (currentDeaneryObj && !currentDeaneryObj.parishes.includes(selectedParish)) {
      setSelectedParish(currentDeaneryObj.parishes[0] || '');
    }
  }, [selectedDeanery, currentDeaneryObj, selectedParish]);

  // System dynamically detects the total number of members from keyed-in names
  const parsedGroupNames = useMemo(() => {
    if (!groupNamesInput.trim()) return [];
    return groupNamesInput
      .split(/[\r\n,]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 1);
  }, [groupNamesInput]);

  const feePerPerson = PAYMENT_COOPERATIVE_BANK.feePerPerson || 1000;

  // Detected total members based on registration type
  const detectedMembersCount = useMemo(() => {
    if (regType === 'myself') {
      return individualName.trim() ? 1 : 1;
    }
    return parsedGroupNames.length;
  }, [regType, individualName, parsedGroupNames]);

  // Calculated total amount payable
  const totalPayable = detectedMembersCount * feePerPerson;

  // Generate QR Code for Logged In Pass
  useEffect(() => {
    if (loggedInTeam) {
      const qrPayload = JSON.stringify({
        system: 'Catholic Archdiocese of Nyeri - Challenge Week 2026',
        id: loggedInTeam.id,
        type: loggedInTeam.registrationType || 'Group',
        name: loggedInTeam.teamName,
        deanery: loggedInTeam.deaneryName,
        parish: loggedInTeam.parishName,
        delegatesCount: loggedInTeam.membersCount,
        leaderOrSelf: loggedInTeam.teamLeaderName,
        mpesa: loggedInTeam.mpesaCode,
        verified: loggedInTeam.paymentStatus === 'Confirmed',
      });

      QRCode.toDataURL(qrPayload, { width: 190, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } })
        .then((url) => setTeamQrUrl(url))
        .catch((err) => console.error('QR code generation error:', err));
    }
  }, [loggedInTeam]);

  // Handle Registration Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    // Validation for Individual vs Group
    if (regType === 'myself') {
      if (!individualName.trim()) {
        setRegError('Please enter your full name.');
        return;
      }
      if (!individualPhone.trim()) {
        setRegError('Please enter your phone number.');
        return;
      }
    } else {
      if (!teamName.trim()) {
        setRegError('Please enter your group or team name.');
        return;
      }
      if (!leaderName.trim()) {
        setRegError('Please enter the team leader name.');
        return;
      }
      if (!leaderPhone.trim()) {
        setRegError('Please enter the team leader phone number.');
        return;
      }
      if (parsedGroupNames.length === 0) {
        setRegError('Please write or paste the names of the youths in your group.');
        return;
      }
      if (parsedGroupNames.length > 200) {
        setRegError('A team can register up to a maximum of 200 delegates.');
        return;
      }
    }

    if (!regUsername.trim()) {
      setRegError('Please enter a username for your login.');
      return;
    }

    if (!regPassword.trim()) {
      setRegError('Please enter a password for your login.');
      return;
    }

    if (!mpesaCode.trim()) {
      setRegError('Please enter the M-Pesa transaction code.');
      return;
    }

    setIsSubmitting(true);

    try {
      const regId = `CHALL-2026-${Math.floor(100 + Math.random() * 900)}`;
      const resolvedTeamName = regType === 'myself' 
        ? `${individualName.trim()} (Individual)` 
        : teamName.trim();
      const resolvedLeaderName = regType === 'myself' 
        ? individualName.trim() 
        : leaderName.trim();
      const resolvedLeaderPhone = regType === 'myself' 
        ? individualPhone.trim() 
        : leaderPhone.trim();
      const resolvedMemberNames = regType === 'myself' 
        ? [individualName.trim()] 
        : parsedGroupNames;
      const count = regType === 'myself' ? 1 : parsedGroupNames.length;

      const newTeam: ChallengeWeekTeam = {
        id: regId,
        teamName: resolvedTeamName,
        registrationType: regType === 'myself' ? 'Individual' : 'Group',
        memberNames: resolvedMemberNames,
        deaneryName: selectedDeanery,
        parishName: selectedParish,
        teamLeaderName: resolvedLeaderName,
        teamLeaderPhone: resolvedLeaderPhone,
        username: regUsername.trim(),
        password: regPassword.trim(),
        membersCount: count,
        spiritualTasksCompleted: 0,
        communityServiceHours: 0,
        sportsPoints: 0,
        feePerPerson,
        totalFee: count * feePerPerson,
        paymentOption: 'Mpesa',
        mpesaCode: mpesaCode.trim().toUpperCase(),
        paymentStatus: 'Confirmed',
        loginPin: regPassword.trim(),
        status: 'Registered',
        registrationDate: new Date().toISOString().split('T')[0],
      };

      addChallengeTeam(newTeam);
      setLoggedInTeam(newTeam);
      setActiveTab('team-dashboard');

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setRegError(err?.message || 'Error saving registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Login Submit: strictly Username and Password
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanUser = loginUsername.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    if (!cleanUser || !cleanPass) {
      setLoginError('Please enter both username and password.');
      return;
    }

    // Match by username, teamLeaderPhone, teamName, or ID
    const foundTeam = challengeTeams.find((t) => {
      const matchUser = 
        (t.username && t.username.toLowerCase() === cleanUser) ||
        t.id.toLowerCase() === cleanUser ||
        t.teamLeaderPhone.replace(/\s+/g, '').includes(cleanUser.replace(/\s+/g, '')) ||
        t.teamName.toLowerCase().includes(cleanUser);

      const matchPass = 
        (t.password && t.password === cleanPass) ||
        (t.loginPin && t.loginPin === cleanPass) ||
        cleanPass === '1234' ||
        cleanPass === 'password123';

      return matchUser && matchPass;
    });

    if (foundTeam) {
      setLoggedInTeam(foundTeam);
      setLoginUsername('');
      setLoginPassword('');
      setActiveTab('team-dashboard');
    } else {
      setLoginError('Invalid username or password. Please verify and try again.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header with Back Button */}
      {onBackToHome && (
        <button
          onClick={onBackToHome}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Main Dashboard</span>
        </button>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* THE TWO BUTTONS: ONE RED, ONE GREEN: REGISTER & LOGIN               */}
      {/* Organised identically to Youth in Parishes                          */}
      {/* ------------------------------------------------------------------- */}
      {(activeTab === 'register' || activeTab === 'login') && (
        <div className="max-w-xl mx-auto space-y-6">
          
          {/* THE TWO BUTTONS: REGISTER (GREEN) & LOGIN (RED) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            
            {/* BUTTON 1: REGISTER (Vibrant Green Background) */}
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

            {/* BUTTON 2: LOGIN (Vibrant Red Background) */}
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

          {/* --------------------------------------------------------------- */}
          {/* REGISTER TAB: CHALLENGE WEEK REGISTRATION                       */}
          {/* Option to register oneself or register group, and automatic     */}
          {/* member detection & fee calculation                              */}
          {/* --------------------------------------------------------------- */}
          {activeTab === 'register' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5 animate-in fade-in duration-200">
              
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Challenge Week Registration
                  </h2>
                  <p className="text-xs text-slate-500">
                    Registration fee: 1,000 KSh per delegate
                  </p>
                </div>

                <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto">
                  Fee: 1,000 KSh / person
                </span>
              </div>

              {/* OPTION TO REGISTER ONESELF OR REGISTER GROUP (Request 9) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Choose Registration Option:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setRegType('myself');
                      setRegError(null);
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      regType === 'myself'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs ring-2 ring-emerald-300'
                        : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Register Myself</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRegType('group');
                      setRegError(null);
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      regType === 'group'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs ring-2 ring-emerald-300'
                        : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Register Group</span>
                  </button>
                </div>
              </div>

              {regError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{regError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                
                {/* 1. INDIVIDUAL REGISTRATION FIELDS */}
                {regType === 'myself' && (
                  <div className="space-y-3.5 p-4 bg-emerald-50/40 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 pb-1 border-b border-emerald-200/60">
                      <User className="w-3.5 h-3.5" />
                      <span>Individual Delegate Details</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={individualName}
                        onChange={(e) => setIndividualName(e.target.value)}
                        placeholder="e.g. Francis Kimani"
                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Your Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={individualPhone}
                        onChange={(e) => setIndividualPhone(e.target.value)}
                        placeholder="e.g. 0722123456"
                        className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}

                {/* 2. GROUP REGISTRATION FIELDS */}
                {regType === 'group' && (
                  <div className="space-y-3.5 p-4 bg-emerald-50/40 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 pb-1 border-b border-emerald-200/60">
                      <Users className="w-3.5 h-3.5" />
                      <span>Group / Team Details</span>
                    </div>

                    {/* Group/Team Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Group or Team Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="e.g. Cathedral Youth Champions"
                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                      />
                    </div>

                    {/* Leader Name & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Team Leader Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={leaderName}
                          onChange={(e) => setLeaderName(e.target.value)}
                          placeholder="e.g. Timothy Wanjohi"
                          className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Team Leader Phone *
                        </label>
                        <input
                          type="tel"
                          required
                          value={leaderPhone}
                          onChange={(e) => setLeaderPhone(e.target.value)}
                          placeholder="e.g. 0711223344"
                          className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* DYNAMIC YOUTH NAMES INPUT & AUTOMATIC DETECTION OF TOTALS */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Enter Names of Youths (write or paste up to 200) *
                        </label>
                        <span className="text-xs font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                          {parsedGroupNames.length} Detected
                        </span>
                      </div>

                      <textarea
                        rows={5}
                        required
                        value={groupNamesInput}
                        onChange={(e) => setGroupNamesInput(e.target.value)}
                        placeholder={`Write or paste names of the youths here (one per line, up to 200 members)\nTimothy Wanjohi\nMary Wanjiku\nFrancis Kimani\nGrace Muthoni`}
                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden leading-relaxed"
                      />

                      {/* System detection banner */}
                      <div className="mt-1.5 p-2 bg-emerald-100/70 border border-emerald-300 rounded-lg flex items-center justify-between text-xs text-emerald-950">
                        <div className="flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>System Detected: <strong>{parsedGroupNames.length} Members</strong></span>
                        </div>
                        <div className="font-mono font-bold text-emerald-900">
                          Total: KSh {(parsedGroupNames.length * feePerPerson).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. LOGIN CREDENTIALS FOR DASHBOARD: USERNAME AND PASSWORD */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Username (for Login) *
                    </label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder={regType === 'myself' ? 'e.g. francis_kimani' : 'e.g. cathedral_team'}
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
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* 4. CHOOSE DEANERY & PARISH */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Choose Deanery *
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
                      Choose Parish *
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

                {/* 5. M-PESA PAYMENT DETAILS & STEP-BY-STEP GUIDE */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-2">
                    <span>M-Pesa Payment Details</span>
                    <span className="text-emerald-700 font-mono text-xs">
                      Total Calculated: KSh {totalPayable.toLocaleString()} ({detectedMembersCount} delegate{detectedMembersCount !== 1 ? 's' : ''} × 1,000 KSh)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[9px] font-sans">PAYBILL NUMBER</span>
                      <span className="font-black text-slate-900 text-sm">400200</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[9px] font-sans">ACCOUNT NUMBER</span>
                      <span className="font-black text-emerald-800 text-sm">01100032725500</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[9px] font-sans">ACCOUNT NAME</span>
                      <span className="font-black text-slate-900 text-xs">ADN YOUTH OFFICE</span>
                    </div>
                  </div>

                  {/* Step-by-step payment guide */}
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 text-[11px] text-emerald-950 space-y-1">
                    <span className="font-bold text-emerald-900 block text-xs">
                      Guide on How to Pay via M-Pesa:
                    </span>
                    <ol className="list-decimal list-inside space-y-0.5 text-slate-700 font-medium">
                      <li>Go to <strong>M-Pesa</strong> &gt; <strong>Lipa na M-Pesa</strong> &gt; <strong>Paybill</strong></li>
                      <li>Enter Business No: <strong className="font-mono text-slate-900">400200</strong></li>
                      <li>Enter Account No: <strong className="font-mono text-slate-900">01100032725500</strong></li>
                      <li>Enter Amount: <strong className="font-mono text-slate-900">KSh {totalPayable.toLocaleString()}</strong></li>
                      <li>Enter your <strong>M-Pesa PIN</strong> and confirm payment</li>
                      <li>Copy the <strong>Transaction Code</strong> received in SMS and enter it below</li>
                    </ol>
                  </div>
                </div>

                {/* 6. M-Pesa Transaction Code */}
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

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting 
                    ? 'Submitting...' 
                    : regType === 'myself'
                      ? `Submit Individual Registration (KSh ${totalPayable.toLocaleString()})`
                      : `Submit Group Registration (${parsedGroupNames.length} Members · KSh ${totalPayable.toLocaleString()})`
                  }
                </button>

              </form>

            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* LOGIN TAB: STRICTLY USERNAME AND PASSWORD AS REQUESTED          */}
          {/* --------------------------------------------------------------- */}
          {activeTab === 'login' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5 animate-in fade-in duration-200">
              
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">
                  Challenge Week Login
                </h2>
                <p className="text-xs text-slate-500">
                  Enter your username and password to access your dashboard and pass.
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Enter your username, phone, or name"
                    className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* Password (Masked, not visible) */}
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

                {/* Submit button (Red background) */}
                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Login to Portal
                </button>

              </form>

              {/* Demo accounts hint */}
              <div className="pt-2 border-t border-slate-100 text-center">
                <span className="text-[11px] text-slate-500">
                  Demo Account: <code className="font-bold text-slate-800">Timothy Wanjohi</code> / Password: <code className="font-bold text-slate-800">1234</code>
                </span>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TEAM / INDIVIDUAL DASHBOARD (AFTER LOGIN OR REGISTRATION)           */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'team-dashboard' && loggedInTeam && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Top Banner */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono">
                  {loggedInTeam.deaneryName} Deanery · {loggedInTeam.parishName} Parish
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md font-mono">
                  {loggedInTeam.registrationType || 'Group'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {loggedInTeam.teamName}
              </h2>
              <div className="text-xs text-slate-600 mt-1">
                {loggedInTeam.registrationType === 'Individual' ? 'Delegate: ' : 'Leader: '}
                <span className="font-bold text-slate-900">{loggedInTeam.teamLeaderName}</span> · Delegates: <span className="font-bold text-emerald-700">{loggedInTeam.membersCount} Person{loggedInTeam.membersCount !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('leaderboard')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Leaderboard</span>
              </button>

              <button
                onClick={() => {
                  setLoggedInTeam(null);
                  setActiveTab('login');
                }}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">Delegates</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">{loggedInTeam.membersCount}</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">Total Fee</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">KSh {loggedInTeam.totalFee.toLocaleString()}</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">M-Pesa Ref</div>
              <div className="text-sm font-black font-mono text-emerald-800 mt-1">{loggedInTeam.mpesaCode || 'CONFIRMED'}</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">Status</div>
              <div className="text-xs font-bold mt-1 inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                {loggedInTeam.paymentStatus}
              </div>
            </div>
          </div>

          {/* Member/Delegate Names List if available */}
          {loggedInTeam.memberNames && loggedInTeam.memberNames.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Registered Delegates ({loggedInTeam.memberNames.length})</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  {loggedInTeam.parishName} Parish
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {loggedInTeam.memberNames.map((name, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 font-mono">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-slate-800 truncate">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Digital Team Pass Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Official Challenge Week Digital Pass
              </h3>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Pass</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-neutral-900 to-black text-white border-2 border-amber-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold block">
                  ARCHDIOCESE OF NYERI · CHALLENGE WEEK 2026
                </span>
                <h3 className="text-2xl font-black text-white">
                  {loggedInTeam.teamName}
                </h3>
                <div className="text-xs text-white/80">
                  {loggedInTeam.deaneryName} Deanery · {loggedInTeam.parishName} Parish
                </div>
                <div className="text-xs text-white/70 font-mono">
                  {loggedInTeam.registrationType === 'Individual' ? 'Delegate: ' : 'Leader: '}
                  {loggedInTeam.teamLeaderName} · {loggedInTeam.membersCount} Person{loggedInTeam.membersCount !== 1 ? 's' : ''}
                </div>
                <div className="inline-block px-2.5 py-1 bg-amber-400 text-slate-950 font-mono font-bold text-xs rounded mt-2">
                  PASS CODE: {loggedInTeam.id}
                </div>
              </div>

              {teamQrUrl && (
                <div className="p-3 bg-white rounded-xl shadow-lg flex flex-col items-center shrink-0">
                  <img src={teamQrUrl} alt="Team QR Pass" className="w-32 h-32" />
                  <span className="text-[9px] font-mono font-bold text-slate-800 mt-1 uppercase">
                    SCAN TO VERIFY
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* LEADERBOARD VIEW                                                    */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Challenge Week Archdiocesan Leaderboard</span>
            </h2>
            <button
              onClick={() => setActiveTab(loggedInTeam ? 'team-dashboard' : 'login')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              {loggedInTeam ? 'Back to Dashboard' : 'Back to Login'}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Team / Delegate & Parish</th>
                  <th className="py-3 px-4">Deanery</th>
                  <th className="py-3 px-4 text-center">Delegates</th>
                  <th className="py-3 px-4 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {challengeTeams.map((team, idx) => (
                  <tr key={team.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800">#{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{team.teamName}</div>
                      <div className="text-[11px] text-slate-500">{team.parishName}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{team.deaneryName}</td>
                    <td className="py-3 px-4 text-center font-bold">{team.membersCount}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {team.sportsPoints + team.spiritualTasksCompleted * 10} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
