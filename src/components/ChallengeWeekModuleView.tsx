import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { useYouth } from '../context/YouthContext';
import { OfficialLogo } from './OfficialLogo';
import { 
  ARCHDIOCESE_DEANERIES_AND_PARISHES, 
  PAYMENT_COOPERATIVE_BANK 
} from '../data/archdioceseHierarchy';
import {
  ChallengeCardData,
  compressPhotoForCard,
  downloadChallengeCardPng,
  downloadAllChallengeCardsZip,
} from '../utils/generateChallengeCardPng';
import { 
  Trophy, 
  ArrowLeft, 
  Users, 
  User, 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  Printer, 
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Camera,
  Download,
  Clock,
  XCircle,
  Lock,
  Archive
} from 'lucide-react';

interface ChallengeWeekProps {
  onBackToHome: () => void;
}

const CONSENT_STATEMENT =
  'By registering to participate in Challenge Week 2027, you acknowledge and consent to Quo Vadis Youth Hub taking photographs and recording videos of you during the event. You also authorize the Hub to use and share these images and recordings on its official social media platforms and other communication channels for publicity, documentation, and promotional purposes.';

export const ChallengeWeekModuleView: React.FC<ChallengeWeekProps> = ({ onBackToHome }) => {
  const { challengeTeams, addChallengeTeam, updateChallengeMemberPhoto, loginModuleAccount } = useYouth();

  // Mode: 'register' | 'login' | 'team-dashboard' | 'leaderboard'
  const [activeTab, setActiveTab] = useState<'register' | 'login' | 'team-dashboard' | 'leaderboard'>('register');

  // Option to register oneself or a group
  const [regType, setRegType] = useState<'myself' | 'group'>('myself');

  // REGISTRATION FORM STATES
  const [individualName, setIndividualName] = useState('');
  const [individualPhone, setIndividualPhone] = useState('');
  const [individualPhotoPreview, setIndividualPhotoPreview] = useState<string>('');

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
  const [localChurch, setLocalChurch] = useState('');
  const [mpesaCode, setMpesaCode] = useState('');
  const [photographyConsent, setPhotographyConsent] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // LOGIN STATES: strictly username and password
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // LOGGED IN TEAM ID (resolved live from context so Admin approvals & photo uploads reflect immediately)
  const [loggedInTeamId, setLoggedInTeamId] = useState<string | null>(null);
  const loggedInTeam = useMemo(
    () => challengeTeams.find((t) => t.id === loggedInTeamId) || null,
    [challengeTeams, loggedInTeamId]
  );

  // Per-member QR DataURLs for preview cards
  const [memberQrUrls, setMemberQrUrls] = useState<Record<string, string>>({});
  const [photoUploadMsg, setPhotoUploadMsg] = useState<string | null>(null);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

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

  // Dynamically detect group members from keyed-in names
  const parsedGroupNames = useMemo(() => {
    if (!groupNamesInput.trim()) return [];
    return groupNamesInput
      .split(/[\r\n,]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 1);
  }, [groupNamesInput]);

  const feePerPerson = PAYMENT_COOPERATIVE_BANK.feePerPerson || 1000;

  const detectedMembersCount = useMemo(() => {
    if (regType === 'myself') {
      return 1;
    }
    return parsedGroupNames.length;
  }, [regType, parsedGroupNames]);

  const totalPayable = detectedMembersCount * feePerPerson;

  // Build normalized list of member cards for logged-in team/individual
  const memberCardsList: ChallengeCardData[] = useMemo(() => {
    if (!loggedInTeam) return [];
    const names =
      loggedInTeam.memberNames && loggedInTeam.memberNames.length > 0
        ? loggedInTeam.memberNames
        : [loggedInTeam.teamLeaderName];
    const resolvedLocalChurch = loggedInTeam.localChurch || loggedInTeam.parishName;

    return names.map((name, idx) => {
      const code =
        names.length === 1
          ? loggedInTeam.id
          : `${loggedInTeam.id}-${String(idx + 1).padStart(2, '0')}`;
      return {
        memberCode: code,
        memberName: name,
        deaneryName: loggedInTeam.deaneryName,
        parishName: loggedInTeam.parishName,
        localChurch: resolvedLocalChurch,
        teamName: loggedInTeam.teamName,
        photoDataUrl: loggedInTeam.memberPhotos?.[String(idx)],
      };
    });
  }, [loggedInTeam]);

  // Generate QR Codes for every member card in the logged-in profile
  useEffect(() => {
    if (!loggedInTeam || memberCardsList.length === 0) return;
    let cancelled = false;

    const generateAllQrs = async () => {
      const map: Record<string, string> = {};
      for (const card of memberCardsList) {
        const qrPayload = JSON.stringify({
          system: 'Catholic Archdiocese of Nyeri - Challenge Week 2027',
          domain: 'system.quovadisyouthhub.org',
          code: card.memberCode,
          name: card.memberName,
          deanery: card.deaneryName,
          parish: card.parishName,
          localChurch: card.localChurch,
          verified: loggedInTeam.paymentStatus === 'Confirmed',
        });
        try {
          map[card.memberCode] = await QRCode.toDataURL(qrPayload, {
            width: 160,
            margin: 1,
            color: { dark: '#0f172a', light: '#ffffff' },
          });
        } catch (err) {
          console.error('QR code generation error:', err);
        }
      }
      if (!cancelled) {
        setMemberQrUrls(map);
      }
    };

    generateAllQrs();
    return () => {
      cancelled = true;
    };
  }, [loggedInTeam, memberCardsList]);

  // Handle photo selection during individual registration
  const handleRegPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressPhotoForCard(file);
      setIndividualPhotoPreview(dataUrl);
    } catch (err: any) {
      setRegError(err?.message || 'Could not process image file.');
    }
  };

  // Handle photo upload/update from Profile Dashboard for any member
  const handleProfilePhotoUpload = async (
    memberIndex: number,
    memberName: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !loggedInTeam) return;
    try {
      const compressed = await compressPhotoForCard(file);
      await updateChallengeMemberPhoto(loggedInTeam.id, memberIndex, compressed);
      setPhotoUploadMsg(`Photo updated for ${memberName}!`);
      setTimeout(() => setPhotoUploadMsg(null), 3500);
    } catch (err: any) {
      setPhotoUploadMsg(err?.message || 'Could not upload photo.');
    }
  };

  // Handle Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

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

    if (!localChurch.trim()) {
      setRegError('Please enter your Local Church / Outstation.');
      return;
    }

    if (!mpesaCode.trim()) {
      setRegError('Please enter the M-Pesa transaction code.');
      return;
    }

    if (!photographyConsent) {
      setRegError('You must agree to the Photography and Video Consent statement before registering.');
      return;
    }

    setIsSubmitting(true);

    try {
      const resolvedTeamName =
        regType === 'myself'
          ? `${individualName.trim()} (Individual)`
          : teamName.trim();
      const resolvedLeaderName =
        regType === 'myself' ? individualName.trim() : leaderName.trim();
      const resolvedLeaderPhone =
        regType === 'myself' ? individualPhone.trim() : leaderPhone.trim();
      const resolvedMemberNames =
        regType === 'myself' ? [individualName.trim()] : parsedGroupNames;
      const count = regType === 'myself' ? 1 : parsedGroupNames.length;

      const createdTeam = await addChallengeTeam({
        teamName: resolvedTeamName,
        registrationType: regType === 'myself' ? 'Individual' : 'Group',
        memberNames: resolvedMemberNames,
        memberPhotos:
          regType === 'myself' && individualPhotoPreview
            ? { '0': individualPhotoPreview }
            : {},
        deaneryName: selectedDeanery,
        parishName: selectedParish,
        localChurch: localChurch.trim(),
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
        paymentStatus: 'Pending Verification',
        photographyConsent: true,
        loginPin: regPassword.trim(),
        status: 'Registered',
      });

      setLoggedInTeamId(createdTeam.id);
      setActiveTab('team-dashboard');

      // Reset registration form
      setIndividualName('');
      setIndividualPhone('');
      setIndividualPhotoPreview('');
      setTeamName('');
      setLeaderName('');
      setLeaderPhone('');
      setGroupNamesInput('');
      setRegUsername('');
      setRegPassword('');
      setLocalChurch('');
      setMpesaCode('');
      setPhotographyConsent(false);

      confetti({
        particleCount: 80,
        spread: 65,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setRegError(err?.message || 'Error saving registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Login Submit: verified by shared server database
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanUser = loginUsername.trim();
    const cleanPass = loginPassword.trim();

    if (!cleanUser || !cleanPass) {
      setLoginError('Please enter both username and password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await loginModuleAccount('challenge-week', cleanUser, cleanPass);
      setLoggedInTeamId(res.record.id);
      setLoginUsername('');
      setLoginPassword('');
      setActiveTab('team-dashboard');
    } catch (err: any) {
      setLoginError(err?.message || 'Invalid username or password. Please verify and try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDownloadSingleCard = async (card: ChallengeCardData, idx: number) => {
    try {
      setDownloadingIndex(idx);
      await downloadChallengeCardPng(card);
    } catch (err) {
      console.error('Error downloading card PNG:', err);
    } finally {
      setDownloadingIndex(null);
    }
  };

  const handleDownloadAllCards = async () => {
    if (!loggedInTeam || memberCardsList.length === 0) return;
    try {
      setIsDownloadingAll(true);
      await downloadAllChallengeCardsZip(memberCardsList, loggedInTeam.teamName);
    } catch (err) {
      console.error('Error downloading all cards ZIP:', err);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const isPaymentConfirmed = loggedInTeam?.paymentStatus === 'Confirmed';
  const isPaymentRejected = loggedInTeam?.paymentStatus === 'Rejected';

  return (
    <div className="space-y-6">
      {/* Top Header with Back Button */}
      {onBackToHome && (
        <button
          onClick={onBackToHome}
          className="no-print text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Main Dashboard</span>
        </button>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* REGISTER & LOGIN TABS                                               */}
      {/* ------------------------------------------------------------------- */}
      {(activeTab === 'register' || activeTab === 'login') && (
        <div className="max-w-xl mx-auto space-y-6">
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

          {/* --------------------------------------------------------------- */}
          {/* REGISTER TAB                                                    */}
          {/* --------------------------------------------------------------- */}
          {activeTab === 'register' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Challenge Week 2027 Registration
                  </h2>
                  <p className="text-xs text-slate-500">
                    Registration fee: 1,000 KSh per delegate
                  </p>
                </div>

                <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto">
                  Fee: 1,000 KSh / person
                </span>
              </div>

              {/* Individual vs Group toggle */}
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

                    {/* Optional photo upload right away (can also upload/update in profile) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Passport / Profile Photo (Optional — can also upload in your profile)
                      </label>
                      <div className="flex items-center gap-3">
                        {individualPhotoPreview ? (
                          <img
                            src={individualPhotoPreview}
                            alt="Preview"
                            className="w-12 h-14 object-cover rounded-lg border-2 border-red-600"
                          />
                        ) : (
                          <div className="w-12 h-14 rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center text-slate-400">
                            <Camera className="w-4 h-4" />
                          </div>
                        )}
                        <label className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{individualPhotoPreview ? 'Change Photo' : 'Upload Photo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleRegPhotoChange}
                            className="hidden"
                          />
                        </label>
                      </div>
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

                {/* 3. LOGIN CREDENTIALS */}
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

                {/* 4. CHOOSE DEANERY, PARISH & LOCAL CHURCH */}
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Local Church / Outstation *
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

                {/* 5. M-PESA PAYMENT DETAILS */}
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

                {/* 7. PHOTOGRAPHY AND VIDEO CONSENT (Directly below M-Pesa Code) */}
                <div className="p-4 rounded-xl bg-red-50/60 border border-red-200 space-y-2.5 text-xs">
                  <div className="font-extrabold text-slate-900 text-xs">
                    Photography and Video Consent
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    {CONSENT_STATEMENT}
                  </p>
                  <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      required
                      checked={photographyConsent}
                      onChange={(e) => setPhotographyConsent(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                    />
                    <span className="text-xs font-bold text-slate-900">
                      I have read and agree to the Photography and Video Consent statement above.
                    </span>
                  </label>
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
                      : `Submit Group Registration (${parsedGroupNames.length} Members · KSh ${totalPayable.toLocaleString()})`}
                </button>
              </form>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* LOGIN TAB                                                       */}
          {/* --------------------------------------------------------------- */}
          {activeTab === 'login' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900">
                  Challenge Week Login
                </h2>
                <p className="text-xs text-slate-500">
                  Enter your username and password to view your profile, upload photos, and download cards.
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

      {/* ------------------------------------------------------------------- */}
      {/* PROFILE & CARDS DASHBOARD (AFTER REGISTRATION OR LOGIN)             */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'team-dashboard' && loggedInTeam && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Payment & Card Approval Status Banner */}
          {!isPaymentConfirmed && !isPaymentRejected && (
            <div className="no-print p-4 rounded-2xl border border-amber-300 bg-amber-50 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-amber-900">
                    Card Status: Pending Admin Payment Confirmation
                  </div>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Your registration and M-Pesa code (<span className="font-mono font-bold">{loggedInTeam.mpesaCode}</span>) have been received. Your pass card{memberCardsList.length > 1 ? 's' : ''} will remain <strong>Pending</strong> until the Admin confirms payment. You can upload member photo(s) below right now.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isPaymentRejected && (
            <div className="no-print p-4 rounded-2xl border border-red-300 bg-red-50 text-red-950 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-red-900">
                  Registration Rejected — Payment Not Confirmed
                </div>
                <p className="text-xs text-red-800 mt-0.5">
                  {loggedInTeam.rejectedReason || 'The M-Pesa payment could not be confirmed by the Admin. Please contact the Archdiocesan Youth Office.'}
                </p>
              </div>
            </div>
          )}

          {isPaymentConfirmed && (
            <div className="no-print p-4 rounded-2xl border border-emerald-300 bg-emerald-50 text-emerald-950 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-emerald-900">
                  Payment Confirmed — Official Cards Active
                </div>
                <p className="text-xs text-emerald-800 mt-0.5">
                  All {memberCardsList.length} Challenge Week 2027 pass card{memberCardsList.length !== 1 ? 's are' : ' is'} verified and ready to download or print.
                </p>
              </div>
            </div>
          )}

          {/* Profile Header Banner */}
          <div className="no-print bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 font-mono">
                  {loggedInTeam.deaneryName} Deanery · {loggedInTeam.parishName} Parish · {loggedInTeam.localChurch || loggedInTeam.parishName}
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
                <span className="font-bold text-slate-900">{loggedInTeam.teamLeaderName}</span> ({loggedInTeam.teamLeaderPhone}) ·{' '}
                <span className="font-bold text-emerald-700">{loggedInTeam.membersCount} Member{loggedInTeam.membersCount !== 1 ? 's' : ''}</span>
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
                  setLoggedInTeamId(null);
                  setActiveTab('login');
                }}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Profile Metrics Row */}
          <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">Members</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">{loggedInTeam.membersCount}</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">Total Fee</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">KSh {loggedInTeam.totalFee.toLocaleString()}</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">M-Pesa Ref</div>
              <div className="text-sm font-black font-mono text-emerald-800 mt-1">{loggedInTeam.mpesaCode || 'N/A'}</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">Card Status</div>
              <div
                className={`text-xs font-bold mt-1 inline-block px-2 py-0.5 rounded ${
                  isPaymentConfirmed
                    ? 'bg-emerald-100 text-emerald-900'
                    : isPaymentRejected
                      ? 'bg-red-100 text-red-900'
                      : 'bg-amber-100 text-amber-900'
                }`}
              >
                {loggedInTeam.paymentStatus}
              </div>
            </div>
          </div>

          {photoUploadMsg && (
            <div className="no-print p-3 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{photoUploadMsg}</span>
            </div>
          )}

          {/* Member Cards Section (Red, White & Green) + Photo Uploads + Batch Download */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Member Profile & Official Pass Card{memberCardsList.length > 1 ? 's' : ''} ({memberCardsList.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Upload a passport photo for each member below. {isPaymentConfirmed ? 'Download individual cards or all cards together.' : 'Card downloads unlock automatically once Admin confirms payment.'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {isPaymentConfirmed ? (
                  <>
                    {memberCardsList.length > 1 && (
                      <button
                        onClick={handleDownloadAllCards}
                        disabled={isDownloadingAll}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-emerald-600 hover:from-red-700 hover:to-emerald-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>
                          {isDownloadingAll
                            ? 'Packaging ZIP...'
                            : `Download All ${memberCardsList.length} Cards (.zip)`}
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print {memberCardsList.length > 1 ? 'All Cards' : 'Card'}</span>
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-xl">
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isPaymentRejected ? 'Downloads Disabled (Rejected)' : 'Locked Pending Admin Approval'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cards Grid (1 column for clean large cards, 2 columns on very wide screens) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {memberCardsList.map((card, idx) => (
                <div key={card.memberCode} className="space-y-2.5 print-card">
                  {/* Action bar above each member card: Photo upload + Single PNG download */}
                  <div className="no-print flex items-center justify-between gap-2 px-1">
                    <span className="text-xs font-bold text-slate-700">
                      #{idx + 1} · {card.memberName}
                    </span>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
                        <Camera className="w-3.5 h-3.5 text-red-600" />
                        <span>{card.photoDataUrl ? 'Change Photo' : 'Upload Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleProfilePhotoUpload(idx, card.memberName, e)}
                          className="hidden"
                        />
                      </label>

                      {isPaymentConfirmed ? (
                        <button
                          onClick={() => handleDownloadSingleCard(card, idx)}
                          disabled={downloadingIndex === idx}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{downloadingIndex === idx ? 'Saving...' : 'Download PNG'}</span>
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-amber-800 bg-amber-100 rounded-lg">
                          <Clock className="w-3 h-3" />
                          <span>{isPaymentRejected ? 'Rejected' : 'Pending'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* RED, WHITE & GREEN CARD PREVIEW */}
                  <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-white shadow-md">
                    {/* Top Red Header */}
                    <div className="bg-gradient-to-r from-red-800 via-red-600 to-red-700 text-white px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="bg-white rounded-lg p-1 shrink-0 shadow-xs">
                          <OfficialLogo className="h-9 w-auto" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] sm:text-xs font-extrabold tracking-wide uppercase truncate">
                            Archdiocese of Nyeri
                          </div>
                          <div className="text-[10px] font-semibold text-red-100 truncate">
                            Quo Vadis Youth Hub · Challenge Week 2027
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg px-2.5 py-1 text-center shrink-0 shadow-xs">
                        <div className="text-[8px] font-mono font-bold text-emerald-700 leading-none">CHALLENGE WEEK</div>
                        <div className="text-xs font-mono font-black text-red-700 leading-tight">2027 PASS</div>
                      </div>
                    </div>

                    {/* Thin White + Green Tricolour Stripe */}
                    <div className="h-0.5 bg-white" />
                    <div className="h-1.5 bg-emerald-600" />

                    {/* Crisp White Body: Photo + Aligned Details + QR Code */}
                    <div className="p-4 sm:p-5 bg-white grid grid-cols-12 gap-3 sm:gap-4 items-center">
                      {/* Photo Column */}
                      <div className="col-span-4 sm:col-span-3 flex flex-col items-center gap-1.5">
                        <div className="w-full aspect-[4/4.6] rounded-xl border-2 border-red-600 bg-slate-100 overflow-hidden flex flex-col items-center justify-center shadow-xs">
                          {card.photoDataUrl ? (
                            <img
                              src={card.photoDataUrl}
                              alt={card.memberName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-2 text-center">
                              <div className="w-10 h-10 rounded-full bg-red-600 text-white font-black text-sm flex items-center justify-center">
                                {card.memberName
                                  .split(/\s+/)
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .map((w) => w[0].toUpperCase())
                                  .join('')}
                              </div>
                              <span className="text-[8px] font-mono font-bold text-slate-500 mt-1">
                                NO PHOTO
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="w-full text-center bg-emerald-700 text-white rounded-md py-1 px-1">
                          <div className="text-[8px] font-mono font-bold tracking-wider truncate">
                            {card.memberCode}
                          </div>
                        </div>
                      </div>

                      {/* Aligned Details Column: Name, Deanery, Parish, Local Church */}
                      <div className="col-span-8 sm:col-span-6 space-y-2 text-left">
                        <div className="border-b border-slate-200 pb-1.5">
                          <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-red-600 block">
                            Full Name
                          </span>
                          <span className="text-sm sm:text-base font-extrabold text-slate-900 uppercase leading-tight block truncate">
                            {card.memberName}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-1.5">
                          <div>
                            <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-emerald-700 block">
                              Deanery
                            </span>
                            <span className="text-xs font-bold text-slate-900 block truncate">
                              {card.deaneryName}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-emerald-700 block">
                              Parish
                            </span>
                            <span className="text-xs font-bold text-slate-900 block truncate">
                              {card.parishName}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-emerald-700 block">
                            Local Church
                          </span>
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {card.localChurch}
                          </span>
                        </div>
                      </div>

                      {/* QR Code Column */}
                      <div className="col-span-12 sm:col-span-3 flex sm:flex-col items-center justify-center gap-2 sm:gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        <div className="p-1.5 bg-white border-2 border-emerald-600 rounded-xl shadow-2xs">
                          {memberQrUrls[card.memberCode] ? (
                            <img
                              src={memberQrUrls[card.memberCode]}
                              alt="Pass QR"
                              className="w-20 h-20"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-[9px] text-slate-400">
                              QR...
                            </div>
                          )}
                        </div>
                        <span className="text-[8px] font-mono font-bold text-emerald-800 uppercase text-center">
                          SCAN TO VERIFY
                        </span>
                      </div>
                    </div>

                    {/* Thin Red + Green Footer */}
                    <div className="h-1 bg-red-600" />
                    <div className="bg-gradient-to-r from-emerald-800 via-emerald-600 to-emerald-700 text-white px-4 py-2 flex items-center justify-between text-[10px] font-semibold">
                      <span>Catholic Archdiocese of Nyeri · Challenge Week 2027</span>
                      <span className="font-mono text-emerald-100">system.quovadisyouthhub.org</span>
                    </div>

                    {/* Pending / Rejected Overlay on Card Preview */}
                    {!isPaymentConfirmed && (
                      <div className="no-print absolute inset-0 bg-slate-950/35 backdrop-blur-[1px] flex items-center justify-center p-4 pointer-events-none">
                        <div
                          className={`px-4 py-2 rounded-xl border-2 shadow-lg text-center ${
                            isPaymentRejected
                              ? 'bg-red-700/95 border-white text-white'
                              : 'bg-amber-400/95 border-amber-950 text-slate-950'
                          }`}
                        >
                          <div className="text-xs font-black uppercase tracking-wider">
                            {isPaymentRejected ? 'REJECTED BY ADMIN' : 'PENDING PAYMENT VERIFICATION'}
                          </div>
                          <div className="text-[10px] font-semibold">
                            {isPaymentRejected
                              ? 'Payment not confirmed'
                              : 'Card activates once Admin accepts registration'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
              {loggedInTeam ? 'Back to Profile' : 'Back to Login'}
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
