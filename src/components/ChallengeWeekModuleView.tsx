import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Users, 
  CheckCircle2, 
  Download, 
  CreditCard, 
  Smartphone, 
  Copy, 
  Check, 
  Sparkles, 
  LogIn, 
  UserPlus, 
  Calendar, 
  AlertCircle, 
  Printer,
  Search,
  Building2,
  Phone,
  Shield,
  Layers
} from 'lucide-react';

interface ChallengeWeekProps {
  onBackToHome: () => void;
}

export const ChallengeWeekModuleView: React.FC<ChallengeWeekProps> = ({ onBackToHome }) => {
  const { challengeTeams, addChallengeTeam, updateChallengeScore } = useYouth();

  // Top Tabs: 'auth' (Login & Register Hub) | 'register' (Registration Details Form) | 'roster' (Leaderboard)
  const [activeTab, setActiveTab] = useState<'auth' | 'register' | 'roster'>('auth');

  // REGISTRATION FORM STATES
  const [delegatesCount, setDelegatesCount] = useState<number | string>(1);
  const [teamName, setTeamName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [selectedDeanery, setSelectedDeanery] = useState('Nyeri Central');
  const [selectedParish, setSelectedParish] = useState('Cathedral');
  const [delegateNamesInput, setDelegateNamesInput] = useState('');
  const [paymentOption, setPaymentOption] = useState<'Mpesa' | 'Cash'>('Mpesa');
  const [mpesaCode, setMpesaCode] = useState('');
  const [cashReceiptRef, setCashReceiptRef] = useState('');

  // Post-Registration Confirmation state
  const [registeredResult, setRegisteredResult] = useState<ChallengeWeekTeam | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // LOGIN STATES
  const [loginPhone, setLoginPhone] = useState('');
  const [loginResult, setLoginResult] = useState<ChallengeWeekTeam | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginQrUrl, setLoginQrUrl] = useState<string>('');

  // LEADERBOARD / ROSTER FILTERS
  const [searchTerm, setSearchTerm] = useState('');
  const [rosterDeaneryFilter, setRosterDeaneryFilter] = useState('ALL');

  // Parishes list corresponding to the selected Deanery
  const currentDeaneryObj = ARCHDIOCESE_DEANERIES_AND_PARISHES.find(
    (d) => d.deanery === selectedDeanery
  ) || ARCHDIOCESE_DEANERIES_AND_PARISHES[0];

  // Keep parish selection in sync when deanery changes
  useEffect(() => {
    if (currentDeaneryObj && !currentDeaneryObj.parishes.includes(selectedParish)) {
      setSelectedParish(currentDeaneryObj.parishes[0] || '');
    }
  }, [selectedDeanery, currentDeaneryObj, selectedParish]);

  // Generate QR Code whenever registeredResult is set
  useEffect(() => {
    if (registeredResult) {
      const qrPayload = JSON.stringify({
        system: 'Archdiocese of Nyeri Youth - Challenge Week',
        id: registeredResult.id,
        team: registeredResult.teamName,
        deanery: registeredResult.deaneryName,
        parish: registeredResult.parishName,
        count: registeredResult.membersCount,
        phone: registeredResult.teamLeaderPhone,
        paid: registeredResult.totalFee,
        status: registeredResult.paymentStatus,
      });

      QRCode.toDataURL(qrPayload, { width: 220, margin: 1 })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('QR code generation error:', err));
    }
  }, [registeredResult]);

  // Generate QR Code for login result
  useEffect(() => {
    if (loginResult) {
      const qrPayload = JSON.stringify({
        system: 'Archdiocese of Nyeri Youth - Challenge Week',
        id: loginResult.id,
        team: loginResult.teamName,
        deanery: loginResult.deaneryName,
        parish: loginResult.parishName,
        count: loginResult.membersCount,
        phone: loginResult.teamLeaderPhone,
        status: loginResult.paymentStatus,
      });

      QRCode.toDataURL(qrPayload, { width: 200, margin: 1 })
        .then((url) => setLoginQrUrl(url))
        .catch((err) => console.error('QR login error:', err));
    }
  }, [loginResult]);

  // Calculations
  const numericCount = Math.max(1, Math.min(200, Number(delegatesCount) || 1));
  const totalPayable = numericCount * PAYMENT_COOPERATIVE_BANK.feePerPerson;

  // Copy helper
  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Submit Handler for Registration
  const handleSubmitRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      alert('Please provide a valid phone number for registration.');
      return;
    }

    const regId = `ADN-CW-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const effectiveTeamName = teamName.trim() || `${selectedParish} Parish Youth Team`;
    const effectiveLeader = leaderName.trim() || 'Youth Representative';

    const newTeam: ChallengeWeekTeam = {
      id: regId,
      teamName: effectiveTeamName,
      deaneryName: selectedDeanery,
      parishName: selectedParish,
      teamLeaderName: effectiveLeader,
      teamLeaderPhone: phoneNumber.trim(),
      membersCount: numericCount,
      spiritualTasksCompleted: 0,
      communityServiceHours: 0,
      sportsPoints: 0,
      feePerPerson: PAYMENT_COOPERATIVE_BANK.feePerPerson,
      totalFee: totalPayable,
      paymentOption,
      mpesaCode: paymentOption === 'Mpesa' ? (mpesaCode.trim() || 'PENDING') : undefined,
      paymentStatus: paymentOption === 'Mpesa' && mpesaCode.trim().length >= 8 ? 'Confirmed' : 'Pending Verification',
      loginPin: phoneNumber.trim().slice(-4) || '2026',
      status: 'Registered',
      registrationDate: new Date().toISOString().split('T')[0],
    };

    addChallengeTeam(newTeam);
    setRegisteredResult(newTeam);

    // Fire celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // safe fallback
    }
  };

  // Login Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginResult(null);

    const cleanInput = loginPhone.trim().toLowerCase();
    if (!cleanInput) {
      setLoginError('Please enter your registered phone number or registration ID.');
      return;
    }

    // Match by phone number or ID
    const found = challengeTeams.find((t) => {
      const matchPhone = t.teamLeaderPhone.replace(/\s+/g, '').includes(cleanInput.replace(/\s+/g, ''));
      const matchId = t.id.toLowerCase() === cleanInput;
      return matchPhone || matchId;
    });

    if (found) {
      setLoginResult(found);
    } else {
      setLoginError(`No registration found matching "${loginPhone}". Check the phone number or proceed to register below.`);
    }
  };

  // Leaderboard sorting
  const sortedTeams = [...challengeTeams].sort((a, b) => {
    const scoreA = a.spiritualTasksCompleted * 10 + a.communityServiceHours * 2 + a.sportsPoints;
    const scoreB = b.spiritualTasksCompleted * 10 + b.communityServiceHours * 2 + b.sportsPoints;
    return scoreB - scoreA;
  });

  const filteredTeams = sortedTeams.filter((team) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      team.teamName.toLowerCase().includes(q) ||
      team.parishName.toLowerCase().includes(q) ||
      team.deaneryName.toLowerCase().includes(q) ||
      team.teamLeaderName.toLowerCase().includes(q) ||
      team.teamLeaderPhone.includes(q);

    const matchesDeanery = rosterDeaneryFilter === 'ALL' || team.deaneryName === rosterDeaneryFilter;
    return matchesSearch && matchesDeanery;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Module Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={onBackToHome}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Main Dashboard</span>
          </button>
          
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-neutral-900 text-amber-400 rounded-xl shadow-xs border border-neutral-800">
              <Trophy className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                  Challenge Week
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  1,000 Ksh / Person
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Archdiocese of Nyeri Youth · Faith on Fire Spiritual & Physical Pilgrimage
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher: Register vs Login vs Leaderboard */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-neutral-900 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>

          <button
            onClick={() => setActiveTab('login')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-neutral-900 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login</span>
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'roster'
                ? 'bg-neutral-900 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Leaderboard & Teams</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: REGISTER VIEW
         ========================================================================= */}
      {activeTab === 'register' && (
        <div className="space-y-6">
          
          {/* Success Overlay / Modal if just registered */}
          {registeredResult && (
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 sm:p-8 space-y-6 shadow-lg animate-in zoom-in-95">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-md">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      Registration Confirmed
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-900">
                      Welcome to Challenge Week 2026!
                    </h2>
                    <p className="text-xs text-slate-600">
                      Your Archdiocesan registration has been received and logged into the central roster.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Pass</span>
                  </button>
                  <button
                    onClick={() => {
                      setRegisteredResult(null);
                      setActiveTab('login');
                      setLoginPhone(registeredResult.teamLeaderPhone);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-xs"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Go to Login</span>
                  </button>
                </div>
              </div>

              {/* Pass Card Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white rounded-xl p-5 border border-emerald-200 shadow-xs">
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                        Registration ID
                      </span>
                      <p className="text-lg font-mono font-extrabold text-slate-900">
                        {registeredResult.id}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {registeredResult.paymentStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                    <div>
                      <span className="text-slate-500">Team / Delegate:</span>
                      <p className="font-bold text-slate-800">{registeredResult.teamName}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Deanery & Parish:</span>
                      <p className="font-bold text-slate-800">
                        {registeredResult.parishName} ({registeredResult.deaneryName})
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Leader / Phone:</span>
                      <p className="font-bold text-slate-800 font-mono">
                        {registeredResult.teamLeaderName} · {registeredResult.teamLeaderPhone}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Delegates Enrolled:</span>
                      <p className="font-bold text-slate-800 font-mono">
                        {registeredResult.membersCount} Person(s)
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Total Fee Paid:</span>
                      <p className="font-bold text-emerald-700 font-mono text-sm">
                        Ksh {registeredResult.totalFee.toLocaleString()} ({registeredResult.paymentOption})
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Login Key / PIN:</span>
                      <p className="font-bold text-slate-800 font-mono">
                        Phone: {registeredResult.teamLeaderPhone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-4 text-center">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="Challenge Week Pass QR" className="w-36 h-36 rounded-lg border border-slate-200 shadow-xs" />
                  ) : (
                    <div className="w-36 h-36 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                      QR Code
                    </div>
                  )}
                  <p className="text-2xs text-slate-500 mt-2 font-mono">
                    Scan for gate pass verification
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setRegisteredResult(null)}
                  className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                >
                  Register another team or participant
                </button>
              </div>
            </div>
          )}

          {/* Registration Header Banner with exact Fee highlight */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-950 via-slate-900 to-neutral-900 text-white p-6 sm:p-8 shadow-md">
            <div className="relative z-10 max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Official Archdiocesan Registration Form</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Youth Challenge Week 2026 Registration
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Register as an individual youth or register your parish team (1 up to 200 persons). Experience spiritual renewal, community service works of mercy, and deanery sports competitions.
              </p>

              {/* Big Fee Badge */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-4 py-2 rounded-xl border border-white/20">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  <div>
                    <span className="text-2xs uppercase tracking-wider text-slate-300 block">Registration Fee</span>
                    <span className="text-lg font-black text-amber-300 font-mono">
                      1,000 Ksh <span className="text-xs text-white font-normal">/ person</span>
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Co-op Paybill & Cash Accepted</span>
                </div>
              </div>
            </div>

            {/* Subtle background crest accent */}
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
              <Trophy className="w-64 h-64 text-white" />
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmitRegistration} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
            
            {/* STEP 1: DELEGATES COUNT (1 up to 200) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold">
                  1
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Number of People Being Registered (1 to 200)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    How many persons are you registering? *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={200}
                      required
                      value={delegatesCount}
                      onChange={(e) => setDelegatesCount(e.target.value)}
                      placeholder="Enter number of persons (1 - 200)"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                    />
                    <div className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">
                      Person(s)
                    </div>
                  </div>
                  <p className="text-2xs text-slate-500">
                    You can register 1 individual or a parish delegation up to 200 youth members.
                  </p>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[1, 5, 10, 20, 50, 100, 200].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setDelegatesCount(num)}
                        className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-colors border ${
                          numericCount === num 
                            ? 'bg-slate-900 text-white border-slate-900 font-bold' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {num === 1 ? '1 (Individual)' : `${num} Pax`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total Cost Calculation Card */}
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-amber-900">
                    <span className="font-semibold">Calculated Registration Fee</span>
                    <span className="font-mono">{numericCount} × Ksh 1,000</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-950 font-mono tracking-tight">
                    Ksh {totalPayable.toLocaleString()}
                  </div>
                  <p className="text-2xs text-amber-800 leading-relaxed">
                    Includes Challenge Week materials, delegate credentials, certificate of participation, and pastoral retreat facilities.
                  </p>
                </div>
              </div>
            </div>

            {/* STEP 2: PRIMARY CONTACT & PHONE NUMBER */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold">
                  2
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Contact Information & Phone Number
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 0712345678 or +254 7..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                  <p className="text-2xs text-slate-500 mt-1">
                    Used for SMS confirmation and logging in to view your pass.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {numericCount > 1 ? 'Team / Delegation Name' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder={numericCount > 1 ? 'e.g. Karatina Holy Family Crusaders' : 'e.g. Dennis Kamau Mwangi'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {numericCount > 1 ? 'Team Captain / Contact Leader Name *' : 'Contact Person'}
                  </label>
                  <input
                    type="text"
                    required
                    value={leaderName}
                    onChange={(e) => setLeaderName(e.target.value)}
                    placeholder="e.g. Grace Wambui"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Optional delegates list for large groups */}
              {numericCount > 1 && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Delegates Names (Optional - list names or notes for the {numericCount} participants)
                  </label>
                  <textarea
                    rows={2}
                    value={delegateNamesInput}
                    onChange={(e) => setDelegateNamesInput(e.target.value)}
                    placeholder="e.g. 1. John Mwangi, 2. Clara Muthoni, 3. Peter Ndegwa, 4. Faith Nyambura..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* STEP 3: CHOOSE DEANERY & PARISH */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold">
                  3
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Archdiocesan Deanery & Parish Selection
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Choose Deanery */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Choose Deanery *</span>
                  </label>
                  <select
                    value={selectedDeanery}
                    onChange={(e) => setSelectedDeanery(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  >
                    {ARCHDIOCESE_DEANERIES_AND_PARISHES.map((d) => (
                      <option key={d.deanery} value={d.deanery}>
                        {d.deanery} Deanery
                      </option>
                    ))}
                  </select>
                  <p className="text-2xs text-slate-500 mt-1">
                    Select among the 8 Archdiocesan Deaneries.
                  </p>
                </div>

                {/* Choose Parish */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>Next Choose Parish *</span>
                  </label>
                  <select
                    value={selectedParish}
                    onChange={(e) => setSelectedParish(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  >
                    {currentDeaneryObj.parishes.map((parishName) => (
                      <option key={parishName} value={parishName}>
                        {parishName} Parish
                      </option>
                    ))}
                  </select>
                  <p className="text-2xs text-slate-500 mt-1">
                    Showing parishes under <span className="font-semibold text-slate-700">{selectedDeanery} Deanery</span>.
                  </p>
                </div>
              </div>

              {/* Deanery Parishes Overview Badge */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-2xs text-slate-600 flex flex-wrap gap-1.5 items-center">
                <span className="font-bold text-slate-800">Parishes in {selectedDeanery}:</span>
                {currentDeaneryObj.parishes.map((p) => (
                  <span
                    key={p}
                    onClick={() => setSelectedParish(p)}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      selectedParish === p 
                        ? 'bg-slate-900 text-white font-semibold' 
                        : 'bg-white hover:bg-slate-200 border border-slate-200 text-slate-700'
                    }`}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* STEP 4: PAYMENT OPTIONS (MPESA OR CASH) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold">
                  4
                </span>
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <h3 className="text-base font-bold text-slate-900">
                    Payment Method
                  </h3>
                  <span className="text-xs font-bold text-emerald-700 font-mono">
                    Total Amount: Ksh {totalPayable.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Radio Selection: Mpesa or Cash */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  onClick={() => setPaymentOption('Mpesa')}
                  className={`p-4 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                    paymentOption === 'Mpesa'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentOption"
                    value="Mpesa"
                    checked={paymentOption === 'Mpesa'}
                    onChange={() => setPaymentOption('Mpesa')}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-900 text-sm">M-PESA (Co-operative Bank Paybill)</span>
                    </div>
                    <p className="text-2xs text-slate-600 leading-relaxed">
                      Instant mobile payment to Archdiocese of Nyeri Youth Office account.
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setPaymentOption('Cash')}
                  className={`p-4 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                    paymentOption === 'Cash'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentOption"
                    value="Cash"
                    checked={paymentOption === 'Cash'}
                    onChange={() => setPaymentOption('Cash')}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-700" />
                      <span className="font-bold text-slate-900 text-sm">Cash Payment</span>
                    </div>
                    <p className="text-2xs text-slate-600 leading-relaxed">
                      Pay via Parish Youth Treasurer, Deanery Office, or on arrival at Challenge Week gate.
                    </p>
                  </div>
                </label>
              </div>

              {/* M-PESA PROCEDURE DETAILS */}
              {paymentOption === 'Mpesa' && (
                <div className="bg-emerald-950 text-white rounded-2xl p-5 sm:p-6 space-y-4 shadow-md">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-800">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-emerald-400" />
                      <h4 className="font-bold text-sm tracking-tight text-emerald-100">
                        M-PESA Payment Procedure
                      </h4>
                    </div>
                    <span className="text-2xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700">
                      Co-operative Bank Paybill
                    </span>
                  </div>

                  {/* Account credentials box */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-emerald-900/50 p-3 rounded-xl border border-emerald-800">
                      <div className="flex items-center justify-between text-2xs text-emerald-300 mb-1">
                        <span>Paybill Business No:</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(PAYMENT_COOPERATIVE_BANK.paybill, 'paybill')}
                          className="hover:text-white"
                          title="Copy Paybill"
                        >
                          {copiedField === 'paybill' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="text-lg font-mono font-black text-white">
                        {PAYMENT_COOPERATIVE_BANK.paybill}
                      </div>
                    </div>

                    <div className="bg-emerald-900/50 p-3 rounded-xl border border-emerald-800">
                      <div className="flex items-center justify-between text-2xs text-emerald-300 mb-1">
                        <span>Account Number:</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(PAYMENT_COOPERATIVE_BANK.accountNumber, 'account')}
                          className="hover:text-white"
                          title="Copy Account Number"
                        >
                          {copiedField === 'account' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="text-sm font-mono font-black text-emerald-200 truncate">
                        {PAYMENT_COOPERATIVE_BANK.accountNumber}
                      </div>
                    </div>

                    <div className="bg-emerald-900/50 p-3 rounded-xl border border-emerald-800">
                      <div className="text-2xs text-emerald-300 mb-1">
                        Account Name:
                      </div>
                      <div className="text-sm font-mono font-black text-amber-300">
                        {PAYMENT_COOPERATIVE_BANK.accountName}
                      </div>
                    </div>
                  </div>

                  {/* Step-by-step instructions */}
                  <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-800/80 text-xs space-y-2 text-emerald-100">
                    <p className="font-semibold text-white">Follow these steps on your phone:</p>
                    <ol className="list-decimal list-inside space-y-1 text-2xs sm:text-xs text-emerald-200 leading-relaxed">
                      <li>Open the <strong>M-PESA menu</strong> on your phone (or Sim Toolkit).</li>
                      <li>Select <strong>Lipa na M-PESA</strong> and choose <strong>Paybill</strong>.</li>
                      <li>Enter Business No: <strong className="text-white font-mono">{PAYMENT_COOPERATIVE_BANK.paybill}</strong> (Co-operative Bank).</li>
                      <li>Enter Account No: <strong className="text-white font-mono">{PAYMENT_COOPERATIVE_BANK.accountNumber}</strong>.</li>
                      <li>Enter Amount: <strong className="text-amber-300 font-mono">Ksh {totalPayable.toLocaleString()}</strong> ({numericCount} × Ksh 1,000).</li>
                      <li>Enter your M-PESA PIN and press <strong>Send</strong>.</li>
                      <li>Verify the account name displays: <strong className="text-amber-300 font-mono">{PAYMENT_COOPERATIVE_BANK.accountName}</strong>.</li>
                      <li>Enter the M-PESA confirmation code below:</li>
                    </ol>
                  </div>

                  {/* Input for M-Pesa Code */}
                  <div className="pt-1">
                    <label className="block text-xs font-semibold text-emerald-200 mb-1">
                      M-PESA Transaction Code (from Safaricom SMS) *
                    </label>
                    <input
                      type="text"
                      required={paymentOption === 'Mpesa'}
                      value={mpesaCode}
                      onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                      placeholder="e.g. QKH89X24TR"
                      className="w-full sm:w-80 px-3.5 py-2.5 bg-emerald-900/70 border border-emerald-700 rounded-xl font-mono text-sm text-white placeholder-emerald-400/60 focus:bg-emerald-900 focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* CASH PROCEDURE DETAILS */}
              {paymentOption === 'Cash' && (
                <div className="bg-slate-50 border border-slate-300 rounded-2xl p-5 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <CreditCard className="w-4 h-4 text-slate-700" />
                    <span>Cash Payment Guidelines</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-2xs sm:text-xs">
                    Please remit the sum of <strong className="text-slate-900 font-mono">Ksh {totalPayable.toLocaleString()}</strong> directly to your Parish Youth Treasurer or the Deanery Youth Office. You may also present cash at the Mathari Pastoral Centre entrance desk upon arrival. An official Archdiocesan printed receipt will be issued.
                  </p>
                  <div>
                    <label className="block text-2xs font-semibold text-slate-700 mb-1">
                      Cash Collector Name / Temporary Receipt Ref (Optional):
                    </label>
                    <input
                      type="text"
                      value={cashReceiptRef}
                      onChange={(e) => setCashReceiptRef(e.target.value)}
                      placeholder="e.g. Paid to Parish Treasurer John / At Gate"
                      className="w-full sm:w-80 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                Registering for <span className="font-bold text-slate-800">{selectedParish} Parish</span> ({selectedDeanery} Deanery)
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Complete Registration (Ksh {totalPayable.toLocaleString()})</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          TAB 2: LOGIN VIEW (Login to View Registration Pass & Status)
         ========================================================================= */}
      {activeTab === 'login' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <span className="inline-block p-3 bg-neutral-900 text-amber-400 rounded-xl shadow-xs">
                <LogIn className="w-6 h-6" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Challenge Week Participant Login
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Enter your registered phone number or Registration ID to access your delegate digital badge, team details, and payment verification.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Registered Phone Number or Registration ID *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="e.g. 0711223344 or +254 7... or ADN-CW-2026-..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {loginError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{loginError}</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="mt-1 font-bold text-red-800 underline hover:text-red-950 cursor-pointer block"
                    >
                      Click here to Register for Challenge Week
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
              >
                Access My Registration
              </button>
            </form>

            {/* Demonstration Quick-Fill accounts */}
            <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-2">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block">
                Quick Demo Registrations:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Cathedral Champions', phone: '+254 711 223 344' },
                  { label: 'Mathari Warriors', phone: '+254 722 334 455' },
                  { label: 'Karatina Crusaders', phone: '+254 756 789 005' },
                  { label: 'Othaya Trailblazers', phone: '+254 745 678 904' },
                ].map((demo) => (
                  <button
                    key={demo.phone}
                    type="button"
                    onClick={() => {
                      setLoginPhone(demo.phone);
                      const f = challengeTeams.find((t) => t.teamLeaderPhone === demo.phone);
                      if (f) setLoginResult(f);
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-2xs text-slate-700 font-mono border border-slate-200"
                  >
                    {demo.label} ({demo.phone})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Logged in result card */}
          {loginResult && (
            <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-md p-6 space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-2xs font-mono font-bold uppercase tracking-wider text-slate-400">
                    Challenge Week Digital Pass
                  </span>
                  <h3 className="text-xl font-black text-slate-900">
                    {loginResult.teamName}
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {loginResult.paymentStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500">Registration Code:</span>
                      <p className="font-mono font-bold text-slate-900">{loginResult.id}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Delegates:</span>
                      <p className="font-mono font-bold text-slate-900">{loginResult.membersCount} Persons</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Deanery:</span>
                      <p className="font-bold text-slate-900">{loginResult.deaneryName} Deanery</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Parish:</span>
                      <p className="font-bold text-slate-900">{loginResult.parishName} Parish</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Contact Leader:</span>
                      <p className="font-bold text-slate-900">{loginResult.teamLeaderName}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Phone:</span>
                      <p className="font-mono font-bold text-slate-900">{loginResult.teamLeaderPhone}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Fee Paid:</span>
                      <p className="font-mono font-bold text-emerald-700">
                        Ksh {loginResult.totalFee.toLocaleString()} ({loginResult.paymentOption})
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Status:</span>
                      <p className="font-bold text-slate-900">{loginResult.status}</p>
                    </div>
                  </div>

                  {loginResult.mpesaCode && (
                    <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-2xs font-mono text-emerald-900">
                      M-PESA Ref: <strong>{loginResult.mpesaCode}</strong>
                    </div>
                  )}
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  {loginQrUrl ? (
                    <img src={loginQrUrl} alt="Pass QR" className="w-28 h-28" />
                  ) : (
                    <div className="w-28 h-28 bg-slate-200 rounded flex items-center justify-center text-2xs text-slate-500">
                      Generating QR...
                    </div>
                  )}
                  <span className="text-2xs font-mono text-slate-500 mt-1">Official Gate Pass</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors border border-slate-300"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Gate Credential</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLoginResult(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: LEADERBOARD & REGISTERED TEAMS
         ========================================================================= */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search team, leader, parish..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={rosterDeaneryFilter}
                onChange={(e) => setRosterDeaneryFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
              >
                <option value="ALL">All 8 Deaneries</option>
                {ARCHDIOCESE_DEANERIES_AND_PARISHES.map((d) => (
                  <option key={d.deanery} value={d.deanery}>
                    {d.deanery} Deanery
                  </option>
                ))}
              </select>

              <button
                onClick={() => setActiveTab('register')}
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New Registration</span>
              </button>
            </div>
          </div>

          {/* Teams Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                    <th className="py-3 px-4">Rank & Team</th>
                    <th className="py-3 px-4">Deanery & Parish</th>
                    <th className="py-3 px-4">Leader / Phone</th>
                    <th className="py-3 px-4 text-center">Delegates</th>
                    <th className="py-3 px-4 text-center">Spiritual Tasks</th>
                    <th className="py-3 px-4 text-center">Service Hrs</th>
                    <th className="py-3 px-4 text-center">Sports Pts</th>
                    <th className="py-3 px-4 text-right">Total Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeams.map((team, idx) => {
                    const totalScore = team.spiritualTasksCompleted * 10 + team.communityServiceHours * 2 + team.sportsPoints;
                    return (
                      <tr key={team.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-2xs ${
                              idx === 0 ? 'bg-amber-400 text-slate-900' :
                              idx === 1 ? 'bg-slate-300 text-slate-800' :
                              idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-slate-900 block">{team.teamName}</span>
                              <span className="text-2xs text-slate-400 font-mono">{team.id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 block">{team.parishName}</span>
                          <span className="text-2xs text-slate-500">{team.deaneryName} Deanery</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-800 block">{team.teamLeaderName}</span>
                          <span className="text-2xs text-slate-500 font-mono">{team.teamLeaderPhone}</span>
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                          {team.membersCount}
                        </td>

                        <td className="py-3 px-4 text-center font-mono">
                          <button
                            onClick={() => updateChallengeScore(team.id, { spiritualTasksCompleted: team.spiritualTasksCompleted + 1 })}
                            title="Add 1 task"
                            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 cursor-pointer"
                          >
                            {team.spiritualTasksCompleted} (+)
                          </button>
                        </td>

                        <td className="py-3 px-4 text-center font-mono">
                          <button
                            onClick={() => updateChallengeScore(team.id, { communityServiceHours: team.communityServiceHours + 5 })}
                            title="Add 5 hrs"
                            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 cursor-pointer"
                          >
                            {team.communityServiceHours}h (+5)
                          </button>
                        </td>

                        <td className="py-3 px-4 text-center font-mono">
                          <button
                            onClick={() => updateChallengeScore(team.id, { sportsPoints: team.sportsPoints + 5 })}
                            title="Add 5 pts"
                            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 cursor-pointer"
                          >
                            {team.sportsPoints} (+5)
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                          {totalScore}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
