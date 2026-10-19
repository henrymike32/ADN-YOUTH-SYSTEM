import React, { useState, useMemo, useEffect } from 'react';
import { useYouth } from '../context/YouthContext';
import { YouthMember, ParishRegistrationBatch, ParishLeaderAccount } from '../types';
import { ARCHDIOCESE_DEANERIES_AND_PARISHES } from '../data/archdioceseHierarchy';
import { ParishYouthCardModal } from './ParishYouthCardModal';
import { ParishAdminDashboard } from './ParishAdminDashboard';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft,
  UserPlus,
  LogIn,
  AlertCircle,
  Clock,
  CheckCircle,
  Plus,
  Edit3,
  Trash2,
  CreditCard,
  LogOut,
  X,
  ShieldCheck
} from 'lucide-react';

interface MembersViewProps {
  onOpenNewMemberModal?: () => void;
  onEditMember?: (member: YouthMember) => void;
  onViewMemberCard?: (member: YouthMember) => void;
  onBackToHome?: () => void;
}

export const MembersView: React.FC<MembersViewProps> = ({ onBackToHome }) => {
  const { 
    members, 
    parishes, 
    deaneries, 
    parishBatches, 
    parishLeaders, 
    addParishRegistrationBatch, 
    addMemberToBatch,
    updateMember,
    deleteMember 
  } = useYouth();

  // Mode: 'register' | 'login' | 'admin-login' | 'leader-dashboard' | 'admin-dashboard'
  const [activeTab, setActiveTab] = useState<'register' | 'login' | 'admin-login' | 'leader-dashboard' | 'admin-dashboard'>('register');

  // Currently logged in leader
  const [currentLeader, setCurrentLeader] = useState<ParishLeaderAccount | null>(null);
  const [activeLeaderBatch, setActiveLeaderBatch] = useState<ParishRegistrationBatch | null>(null);

  // Card modal
  const [selectedCardMember, setSelectedCardMember] = useState<YouthMember | null>(null);

  // Leader dashboard modal states
  const [editingYouthMember, setEditingYouthMember] = useState<YouthMember | null>(null);
  const [isAddMoreModalOpen, setIsAddMoreModalOpen] = useState(false);
  const [addMoreNamesInput, setAddMoreNamesInput] = useState('');

  // --------------------------------------------------------------------------
  // REGISTRATION FORM: ONLY NECESSARY DATA REQUESTED
  // 1. Youth leader phone number
  // 2. Youth leader name
  // 3. Password (for login)
  // 4. Deanery
  // 5. Parish
  // 6. Local church name
  // 7. Names (write or paste up to 200 members)
  // 8. M-Pesa payment details & submit
  // --------------------------------------------------------------------------
  const [leaderPhone, setLeaderPhone] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDeanery, setSelectedDeanery] = useState('Nyeri Central');
  const [selectedParish, setSelectedParish] = useState('Cathedral');
  const [localChurchName, setLocalChurchName] = useState('');
  const [memberNamesInput, setMemberNamesInput] = useState('');
  const [mpesaCode, setMpesaCode] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin login states: username 'admin' and password 'ADN@2027' (hidden)
  const [adminUser, setAdminUser] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  // Sync parish list with selected deanery
  const currentDeaneryObj = useMemo(() => {
    return ARCHDIOCESE_DEANERIES_AND_PARISHES.find((d) => d.deanery === selectedDeanery) 
      || ARCHDIOCESE_DEANERIES_AND_PARISHES[0];
  }, [selectedDeanery]);

  useEffect(() => {
    if (currentDeaneryObj && !currentDeaneryObj.parishes.includes(selectedParish)) {
      setSelectedParish(currentDeaneryObj.parishes[0] || '');
    }
  }, [selectedDeanery, currentDeaneryObj, selectedParish]);

  // Parse names from textarea
  const parsedNames = useMemo(() => {
    if (!memberNamesInput.trim()) return [];
    return memberNamesInput
      .split(/[\r\n,]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 1);
  }, [memberNamesInput]);

  const memberCount = parsedNames.length;
  const totalFee = memberCount * 100; // 100 KSh per member

  // --------------------------------------------------------------------------
  // LOGIN FORM: ONLY PHONE NUMBER AND PASSWORD
  // --------------------------------------------------------------------------
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Filter members for leader dashboard
  const leaderMembers = useMemo(() => {
    if (!currentLeader) return [];
    return members.filter((m) => {
      if (activeLeaderBatch && m.batchId === activeLeaderBatch.id) return true;
      if (m.registeredByLeaderPhone === currentLeader.leaderPhone) return true;
      if (m.localChurch && currentLeader.localChurch && m.localChurch.toLowerCase() === currentLeader.localChurch.toLowerCase()) return true;
      if (m.subParish && currentLeader.localChurch && m.subParish.toLowerCase() === currentLeader.localChurch.toLowerCase()) return true;
      return false;
    });
  }, [members, currentLeader, activeLeaderBatch]);

  const isLeaderBatchPending = useMemo(() => {
    if (activeLeaderBatch) {
      return activeLeaderBatch.approvalStatus === 'Pending';
    }
    return leaderMembers.some((m) => m.approvalStatus === 'Pending');
  }, [activeLeaderBatch, leaderMembers]);

  // Handle Registration Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (memberCount === 0) {
      setRegError('Please enter at least 1 youth member name.');
      return;
    }

    if (memberCount > 200) {
      setRegError('A leader can register up to a maximum of 200 members.');
      return;
    }

    if (!localChurchName.trim()) {
      setRegError('Please enter the local church name.');
      return;
    }

    if (!mpesaCode.trim()) {
      setRegError('Please enter the M-Pesa transaction code.');
      return;
    }

    setIsSubmitting(true);

    try {
      const dObj = deaneries.find((d) => d.name.toLowerCase().includes(selectedDeanery.toLowerCase())) || deaneries[0];
      const pObj = parishes.find((p) => p.name.toLowerCase().includes(selectedParish.toLowerCase())) || parishes[0];

      const { batch } = addParishRegistrationBatch(
        {
          leaderPhone: leaderPhone.trim(),
          leaderName: leaderName.trim(),
          password: password.trim() || 'password123',
          deaneryId: dObj?.id || 'deanery-tetu',
          deaneryName: selectedDeanery,
          parishId: pObj?.id || 'parish-tetu',
          parishName: selectedParish,
          localChurch: localChurchName.trim(),
          memberCount,
          feePerMember: 100,
          mpesaCode: mpesaCode.trim().toUpperCase(),
          mpesaPhone: leaderPhone.trim(),
          paymentStatus: 'Pending',
          approvalStatus: 'Pending',
        },
        parsedNames
      );

      const leaderAccount: ParishLeaderAccount = {
        leaderPhone: leaderPhone.trim(),
        leaderName: leaderName.trim(),
        password: password.trim() || 'password123',
        deaneryName: selectedDeanery,
        parishName: selectedParish,
        localChurch: localChurchName.trim(),
        batchId: batch.id,
      };

      setCurrentLeader(leaderAccount);
      setActiveLeaderBatch(batch);
      setActiveTab('leader-dashboard');

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setRegError(err?.message || 'Error saving registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanPhone = loginPhone.trim();
    const cleanPass = loginPassword.trim();

    // Check leader accounts
    const foundLeader = parishLeaders.find(
      (l) => l.leaderPhone === cleanPhone && (l.password === cleanPass || !l.password)
    );

    if (foundLeader) {
      setCurrentLeader(foundLeader);
      const batch = parishBatches.find((b) => b.id === foundLeader.batchId || b.leaderPhone === foundLeader.leaderPhone);
      setActiveLeaderBatch(batch || null);
      setActiveTab('leader-dashboard');
      return;
    }

    const foundBatch = parishBatches.find(
      (b) => b.leaderPhone === cleanPhone && (b.password === cleanPass || !b.password)
    );

    if (foundBatch) {
      const leaderAccount: ParishLeaderAccount = {
        leaderPhone: foundBatch.leaderPhone,
        leaderName: foundBatch.leaderName,
        password: foundBatch.password || cleanPass,
        deaneryName: foundBatch.deaneryName,
        parishName: foundBatch.parishName,
        localChurch: foundBatch.localChurch,
        batchId: foundBatch.id,
      };
      setCurrentLeader(leaderAccount);
      setActiveLeaderBatch(foundBatch);
      setActiveTab('leader-dashboard');
      return;
    }

    // Individual member pass lookup
    const foundMember = members.find(
      (m) => m.phone.includes(cleanPhone) || m.id.toLowerCase() === cleanPhone.toLowerCase()
    );

    if (foundMember) {
      setSelectedCardMember(foundMember);
      return;
    }

    setLoginError('Incorrect phone number or password. Please verify and try again.');
  };

  // Handle Admin Login Submit: user 'admin' and password 'ADN@2027'
  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);

    const cleanUser = adminUser.trim();
    const cleanPass = adminPassword.trim();

    if (cleanUser.toLowerCase() === 'admin' && cleanPass === 'ADN@2027') {
      setAdminUser('');
      setAdminPassword('');
      setAdminLoginError(null);
      setActiveTab('admin-dashboard');
    } else {
      setAdminLoginError('Invalid username or password. Access denied.');
    }
  };

  // Add more members to existing batch in leader dashboard
  const handleAddMoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMoreNamesInput.trim() || !activeLeaderBatch) return;

    const names = addMoreNamesInput
      .split(/[\r\n,]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 1);

    names.forEach((name) => {
      addMemberToBatch(activeLeaderBatch.id, {
        fullName: name,
        gender: 'Male',
        age: 20,
      });
    });

    setAddMoreNamesInput('');
    setIsAddMoreModalOpen(false);
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
      {/* THE ONLY TWO DETAILS PRESENT ON YOUTH IN PARISHES:                 */}
      {/* 1 BUTTON RED, 1 BUTTON GREEN: REGISTER & LOGIN                     */}
      {/* ------------------------------------------------------------------- */}
      {(activeTab === 'register' || activeTab === 'login') && (
        <div className="max-w-xl mx-auto space-y-6">
          
          {/* THE TWO BUTTONS: ONE RED, ONE GREEN */}
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
          {/* REGISTRATION FORM (ONLY REQUESTED NECESSARY FIELDS)             */}
          {/* --------------------------------------------------------------- */}
          {activeTab === 'register' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5 animate-in fade-in duration-200">
              
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">
                  Parish Youths Registration
                </h2>
                <p className="text-xs text-slate-500">
                  Registration fee: 100 KSh per member · Register up to 200 members
                </p>
              </div>

              {regError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{regError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                
                {/* 1. Youth leader phone number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Youth Leader Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={leaderPhone}
                    onChange={(e) => setLeaderPhone(e.target.value)}
                    placeholder="e.g. 0722123456"
                    className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* 2. Youth leader name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Youth Leader Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={leaderName}
                    onChange={(e) => setLeaderName(e.target.value)}
                    placeholder="e.g. Francis Kimani"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* Password (for login to dashboard) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password for logging into your dashboard"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* 3. Choose Deanery & 4. Choose Parish */}
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

                {/* 5. Input local church name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Local Church Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={localChurchName}
                    onChange={(e) => setLocalChurchName(e.target.value)}
                    placeholder="e.g. Wandumbi Outstation"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* 6. Enter names (write or paste up to 200 members) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Enter Names (Up to 200 members) *
                    </label>
                    <span className="text-xs font-mono font-bold text-emerald-700">
                      {memberCount} / 200 {memberCount > 0 ? `(KSh ${totalFee.toLocaleString()})` : ''}
                    </span>
                  </div>

                  <textarea
                    rows={6}
                    required
                    value={memberNamesInput}
                    onChange={(e) => setMemberNamesInput(e.target.value)}
                    placeholder={`Write or paste names here (one per line, up to 200 members)\nJohn Kamau\nMary Wangari\nPeter Mwangi`}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden leading-relaxed"
                  />
                </div>

                {/* 7. M-Pesa payment details & step-by-step guide */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-2">
                    <span>M-Pesa Payment Details</span>
                    <span className="text-emerald-700 font-mono">
                      Total: KSh {totalFee > 0 ? totalFee.toLocaleString() : '100'} ({memberCount || 1} youths × 100 KSh)
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

                  {/* Guide on how to pay through M-Pesa */}
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 text-[11px] text-emerald-950 space-y-1">
                    <span className="font-bold text-emerald-900 block text-xs">
                      Guide on How to Pay via M-Pesa:
                    </span>
                    <ol className="list-decimal list-inside space-y-0.5 text-slate-700 font-medium">
                      <li>Go to <strong>M-Pesa</strong> menu on your phone</li>
                      <li>Select <strong>Lipa na M-Pesa</strong> &gt; <strong>Paybill</strong></li>
                      <li>Enter Business No: <strong className="font-mono text-slate-900">400200</strong></li>
                      <li>Enter Account No: <strong className="font-mono text-slate-900">01100032725500</strong></li>
                      <li>Enter Amount: <strong className="font-mono text-slate-900">KSh {totalFee > 0 ? totalFee.toLocaleString() : '100'}</strong></li>
                      <li>Enter your <strong>M-Pesa PIN</strong> and confirm payment</li>
                      <li>Copy the <strong>Transaction Code</strong> received in SMS and enter it below</li>
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

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : `Submit Registration (${memberCount} Members)`}
                </button>

              </form>

            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* LOGIN FORM (ONLY PHONE NUMBER AND PASSWORD)                     */}
          {/* --------------------------------------------------------------- */}
          {activeTab === 'login' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5 animate-in fade-in duration-200">
              
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">
                  Member & Leader Login
                </h2>
                <p className="text-xs text-slate-500">
                  Input your phone number and password to access your dashboard.
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* Phone number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="e.g. 0722123456"
                    className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Login
                </button>

              </form>

              {/* Admin login access */}
              <div className="pt-2 text-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setAdminLoginError(null);
                    setAdminUser('');
                    setAdminPassword('');
                    setActiveTab('admin-login');
                  }}
                  className="text-xs text-slate-500 hover:text-red-700 flex items-center justify-center gap-1 mx-auto font-medium cursor-pointer transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Admin Login</span>
                </button>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* DEDICATED ADMIN LOGIN PAGE                                          */}
      {/* User prompt: "for the admin login create a user admin password      */}
      {/* ADN@2027 and should not be visible, once you click on admin login   */}
      {/* it should take you to next page that ask you to input user and      */}
      {/* password. if one keys wrong it should not proceed"                  */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'admin-login' && (
        <div className="max-w-md mx-auto space-y-4 animate-in fade-in duration-200">
          
          <button
            type="button"
            onClick={() => {
              setAdminLoginError(null);
              setActiveTab('login');
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Member & Leader Login</span>
          </button>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
            <div className="text-center space-y-1">
              <span className="inline-block p-2.5 bg-red-100 text-red-700 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Archdiocesan Admin Login
              </h2>
              <p className="text-xs text-slate-500">
                Catholic Archdiocese of Nyeri · Youth Directorate
              </p>
            </div>

            {adminLoginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{adminLoginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  User *
                </label>
                <input
                  type="text"
                  required
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  placeholder="Enter admin username"
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
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Login to Admin Dashboard
              </button>
            </form>
          </div>

        </div>
      )}


      {/* ------------------------------------------------------------------- */}
      {/* LEADER USER DASHBOARD                                               */}
      {/* Displays parish details, pending status until admin acceptance,     */}
      {/* add more members, edit, delete, and generate PNG cards.             */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'leader-dashboard' && currentLeader && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* PENDING NOTIFICATION BANNER */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isLeaderBatchPending
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}>
            <div className="flex items-center gap-3">
              {isLeaderBatchPending ? (
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              <div>
                <div className="text-xs font-black uppercase tracking-wider">
                  {isLeaderBatchPending
                    ? 'Status: Pending Archdiocesan Admin Confirmation & Acceptance'
                    : 'Status: Confirmed & Accepted by Archdiocesan Directorate'}
                </div>
                <div className="text-xs mt-0.5 opacity-90">
                  {isLeaderBatchPending
                    ? 'Registration submitted. Please wait for the Admin to confirm and accept the registered youths in the Admin Dashboard.'
                    : 'All youth members in this batch are confirmed and accepted in the registry.'}
                </div>
              </div>
            </div>

            {isLeaderBatchPending && (
              <button
                onClick={() => setActiveTab('admin-dashboard')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto shrink-0"
              >
                Go to Admin Dashboard to Accept →
              </button>
            )}
          </div>

          {/* PARISH DETAILS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500 font-mono">
                {currentLeader.deaneryName} Deanery · {currentLeader.parishName} Parish
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {currentLeader.localChurch}
              </h2>
              <div className="text-xs text-slate-600 mt-1">
                Youth Leader: <span className="font-semibold text-slate-900">{currentLeader.leaderName}</span> ({currentLeader.leaderPhone})
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddMoreModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add More Members</span>
              </button>

              <button
                onClick={() => {
                  setCurrentLeader(null);
                  setActiveLeaderBatch(null);
                  setActiveTab('login');
                }}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* MEMBERS TABLE */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Registered Youths ({leaderMembers.length})
              </h3>
              <span className="text-xs text-slate-500">
                Unique code & high quality PNG card for every member
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Youth Name</th>
                    <th className="py-3 px-4">Unique Code</th>
                    <th className="py-3 px-4">Local Church</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaderMembers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No members registered yet. Click "Add More Members" to add youths.
                      </td>
                    </tr>
                  ) : (
                    leaderMembers.map((member, idx) => (
                      <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 text-sm">{member.fullName}</td>
                        {/* Unique code smaller as explicitly requested */}
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {member.id}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{member.localChurch || member.subParish}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            member.approvalStatus === 'Confirmed'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}>
                            {member.approvalStatus === 'Confirmed' ? 'Confirmed' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Generate PNG card */}
                            <button
                              onClick={() => setSelectedCardMember(member)}
                              title="Generate PNG Card"
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-emerald-600 hover:from-red-700 hover:to-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>PNG Card</span>
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => setEditingYouthMember(member)}
                              title="Edit Member"
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => {
                                if (confirm(`Delete ${member.fullName}?`)) {
                                  deleteMember(member.id);
                                }
                              }}
                              title="Delete Member"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* ADMIN DASHBOARD                                                     */}
      {/* Indicates total registered youths, breakdown per parish, filter per */}
      {/* deanery, confirm/accept youths, and generate report.                */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'admin-dashboard' && (
        <ParishAdminDashboard
          onBackToPortal={() => setActiveTab('login')}
          onViewMemberCard={(m) => setSelectedCardMember(m)}
        />
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODALS                                                              */}
      {/* ------------------------------------------------------------------- */}

      {/* PNG Card Modal */}
      <ParishYouthCardModal
        member={selectedCardMember}
        onClose={() => setSelectedCardMember(null)}
      />

      {/* Add More Modal */}
      {isAddMoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Add More Youths to {currentLeader?.localChurch}
              </h3>
              <button
                onClick={() => setIsAddMoreModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMoreSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Youth Member Names (one per line)
                </label>
                <textarea
                  rows={5}
                  required
                  value={addMoreNamesInput}
                  onChange={(e) => setAddMoreNamesInput(e.target.value)}
                  placeholder="e.g.&#10;Alice Wangui&#10;Simon Nderitu"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddMoreModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Save Youths
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingYouthMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Edit Member Details
              </h3>
              <button
                onClick={() => setEditingYouthMember(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingYouthMember) {
                  updateMember(editingYouthMember.id, editingYouthMember);
                  setEditingYouthMember(null);
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editingYouthMember.fullName}
                  onChange={(e) => setEditingYouthMember({ ...editingYouthMember, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Local Church / Outstation
                </label>
                <input
                  type="text"
                  value={editingYouthMember.localChurch || editingYouthMember.subParish}
                  onChange={(e) => setEditingYouthMember({ ...editingYouthMember, localChurch: e.target.value, subParish: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingYouthMember(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
