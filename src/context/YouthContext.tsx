import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  YouthMember,
  Parish,
  Deanery,
  ArchdiocesanEvent,
  FinancialRemittance,
  VocationAspirant,
  WelfareCase,
  UserRole,
  NiccaStudent,
  ChallengeWeekTeam,
  CareerDayRegistration,
  MatronPatron,
  SecondarySchoolStudent,
  ParishRegistrationBatch,
  ParishLeaderAccount,
} from '../types';
import { SEED_DEANERIES, SEED_PARISHES } from '../data/seedData';
import { apiClient, LoginScope, ServerStatePayload } from '../services/apiClient';

export interface DatabaseStatus {
  loading: boolean;
  connected: boolean;
  dbConfigured: boolean;
  engine: 'sqlite' | 'mysql' | 'offline';
  adminConfigured: boolean;
  error: string | null;
}

interface YouthContextType {
  members: YouthMember[];
  parishes: Parish[];
  deaneries: Deanery[];
  events: ArchdiocesanEvent[];
  remittances: FinancialRemittance[];
  vocations: VocationAspirant[];
  welfare: WelfareCase[];
  currentRole: UserRole;
  selectedDeaneryId: string;
  selectedParishId: string;
  currentMemberId: string;
  setCurrentRole: (role: UserRole) => void;
  setSelectedDeaneryId: (id: string) => void;
  setSelectedParishId: (id: string) => void;
  setCurrentMemberId: (id: string) => void;

  // Database & Auth state
  dbStatus: DatabaseStatus;
  adminToken: string | null;
  leaderToken: string | null;
  refreshState: () => Promise<void>;
  setupAdminPassword: (password: string, username?: string) => Promise<void>;
  loginAdmin: (username: string, password: string) => Promise<void>;
  logoutAdmin: () => void;
  loginModuleAccount: (scope: LoginScope, identifier: string, password: string) => Promise<any>;

  // New Modules State
  niccaStudents: NiccaStudent[];
  challengeTeams: ChallengeWeekTeam[];
  careerRegistrations: CareerDayRegistration[];
  matronsPatrons: MatronPatron[];
  secondaryYouth: SecondarySchoolStudent[];

  // Parish Youth Batches & Leaders
  parishBatches: ParishRegistrationBatch[];
  parishLeaders: ParishLeaderAccount[];
  addParishRegistrationBatch: (
    batchData: Omit<ParishRegistrationBatch, 'id' | 'submittedAt' | 'memberIds' | 'totalFee'>,
    names: string[]
  ) => Promise<{ batch: ParishRegistrationBatch; newMembers: YouthMember[] }>;
  confirmParishBatch: (batchId: string, adminName?: string) => Promise<void>;
  confirmIndividualMember: (memberId: string, adminName?: string) => Promise<void>;
  addMemberToBatch: (
    batchId: string,
    member: { fullName: string; phone?: string; age?: number; gender?: 'Male' | 'Female' }
  ) => Promise<YouthMember>;

  // Member actions
  addMember: (member: Omit<YouthMember, 'id'>) => Promise<YouthMember>;
  updateMember: (id: string, updates: Partial<YouthMember>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;

  // Event actions
  addEvent: (event: Omit<ArchdiocesanEvent, 'id' | 'registeredMemberIds' | 'attendedMemberIds'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<ArchdiocesanEvent>) => Promise<void>;
  toggleEventRegistration: (eventId: string, memberId: string) => Promise<void>;
  markEventAttendance: (eventId: string, memberId: string) => Promise<boolean>;

  // Finance actions
  addRemittance: (remittance: Omit<FinancialRemittance, 'id' | 'receiptNo'>) => Promise<void>;
  verifyRemittance: (id: string, verifiedBy: string) => Promise<void>;

  // Vocation & Welfare actions
  addVocation: (vocation: Omit<VocationAspirant, 'id' | 'dateRecorded'>) => Promise<void>;
  updateVocationStage: (id: string, stage: VocationAspirant['stage']) => Promise<void>;
  addWelfareCase: (welfare: Omit<WelfareCase, 'id' | 'dateFiled'>) => Promise<void>;
  updateWelfareStatus: (id: string, status: WelfareCase['status'], amountDisbursed?: number) => Promise<void>;

  // Parishes
  addParish: (parish: Omit<Parish, 'id'>) => Promise<void>;
  updateParish: (id: string, updates: Partial<Parish>) => Promise<void>;

  // NICCA
  addNiccaStudent: (student: Omit<NiccaStudent, 'id' | 'registrationDate'>) => Promise<NiccaStudent>;
  deleteNiccaStudent: (id: string) => Promise<void>;

  // Challenge Week
  addChallengeTeam: (team: Omit<ChallengeWeekTeam, 'id' | 'registrationDate'>) => Promise<ChallengeWeekTeam>;
  updateChallengeScore: (id: string, updates: Partial<ChallengeWeekTeam>) => Promise<void>;
  confirmChallengeTeam: (id: string, adminName?: string) => Promise<void>;
  rejectChallengeTeam: (id: string, reason?: string) => Promise<void>;
  updateChallengeMemberPhoto: (teamId: string, memberIndex: number, photoDataUrl: string) => Promise<void>;

  // Career Day
  addCareerRegistration: (reg: Omit<CareerDayRegistration, 'id' | 'registeredDate'>) => Promise<CareerDayRegistration>;
  deleteCareerRegistration: (id: string) => Promise<void>;

  // Matrons and Patrons
  addMatronPatron: (animator: Omit<MatronPatron, 'id'>) => Promise<MatronPatron>;
  deleteMatronPatron: (id: string) => Promise<void>;

  // Secondary School Youth
  addSecondaryYouth: (student: Omit<SecondarySchoolStudent, 'id' | 'registrationDate'>) => Promise<void>;
  deleteSecondaryYouth: (id: string) => Promise<void>;

  // System
  exportDataJson: () => string;
  importDataJson: (jsonString: string) => Promise<boolean>;
  resetToSeedData: () => Promise<void>;
}

const LEGACY_STORAGE_KEYS = [
  'ADN_YOUTH_MANAGEMENT_DATA_V4',
  'ADN_YOUTH_MANAGEMENT_DATA_V3',
  'ADN_YOUTH_MANAGEMENT_DATA_V2',
  'ADN_YOUTH_MANAGEMENT_DATA_V1',
];

const YouthContext = createContext<YouthContextType | undefined>(undefined);

export const YouthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<YouthMember[]>([]);
  const [parishes, setParishes] = useState<Parish[]>(SEED_PARISHES);
  const [deaneries, setDeaneries] = useState<Deanery[]>(SEED_DEANERIES);
  const [events, setEvents] = useState<ArchdiocesanEvent[]>([]);
  const [remittances, setRemittances] = useState<FinancialRemittance[]>([]);
  const [vocations, setVocations] = useState<VocationAspirant[]>([]);
  const [welfare, setWelfare] = useState<WelfareCase[]>([]);

  const [niccaStudents, setNiccaStudents] = useState<NiccaStudent[]>([]);
  const [challengeTeams, setChallengeTeams] = useState<ChallengeWeekTeam[]>([]);
  const [careerRegistrations, setCareerRegistrations] = useState<CareerDayRegistration[]>([]);
  const [matronsPatrons, setMatronsPatrons] = useState<MatronPatron[]>([]);
  const [secondaryYouth, setSecondaryYouth] = useState<SecondarySchoolStudent[]>([]);
  const [parishBatches, setParishBatches] = useState<ParishRegistrationBatch[]>([]);
  const [parishLeaders, setParishLeaders] = useState<ParishLeaderAccount[]>([]);

  const [currentRole, setCurrentRole] = useState<UserRole>('Archdiocesan Chaplaincy');
  const [selectedDeaneryId, setSelectedDeaneryId] = useState<string>('ALL');
  const [selectedParishId, setSelectedParishId] = useState<string>('ALL');
  const [currentMemberId, setCurrentMemberId] = useState<string>('');

  // In-memory session tokens only (never persisted to localStorage/sessionStorage)
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [leaderToken, setLeaderToken] = useState<string | null>(null);
  const [memberTokens, setMemberTokens] = useState<Record<string, string>>({});

  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    loading: true,
    connected: false,
    dbConfigured: false,
    engine: 'offline',
    adminConfigured: false,
    error: null,
  });

  const applyServerState = useCallback((data: ServerStatePayload) => {
    setMembers(
      (data.members || []).map((m) => ({
        ...m,
        approvalStatus: m.approvalStatus || 'Confirmed',
      }))
    );
    setParishes(data.parishes && data.parishes.length > 0 ? data.parishes : SEED_PARISHES);
    setDeaneries(data.deaneries && data.deaneries.length > 0 ? data.deaneries : SEED_DEANERIES);
    setEvents(data.events || []);
    setRemittances(data.remittances || []);
    setVocations(data.vocations || []);
    setWelfare(data.welfare || []);
    setNiccaStudents(data.niccaStudents || []);
    setChallengeTeams(data.challengeTeams || []);
    setCareerRegistrations(data.careerRegistrations || []);
    setMatronsPatrons(data.matronsPatrons || []);
    setSecondaryYouth(data.secondaryYouth || []);
    setParishBatches(data.parishBatches || []);

    setDbStatus({
      loading: false,
      connected: data.dbConfigured !== false,
      dbConfigured: data.dbConfigured !== false,
      engine: data.engine || 'sqlite',
      adminConfigured: Boolean(data.adminConfigured),
      error: data.dbConfigured === false ? 'MySQL database is not configured yet in api/config.php.' : null,
    });
  }, []);

  const refreshState = useCallback(async () => {
    try {
      const data = await apiClient.getState();
      applyServerState(data);
    } catch (err: any) {
      setDbStatus((prev) => ({
        ...prev,
        loading: false,
        connected: false,
        error: err?.message || 'Unable to reach shared database server.',
      }));
    }
  }, [applyServerState]);

  useEffect(() => {
    try {
      LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch {
      // ignore storage errors
    }
    void refreshState();
  }, [refreshState]);

  // ---------------------------------------------------------------------------
  // Authentication Actions
  // ---------------------------------------------------------------------------
  const setupAdminPassword = async (password: string, username: string = 'admin') => {
    const res = await apiClient.setupAdmin(username, password);
    setAdminToken(res.token);
    setDbStatus((prev) => ({ ...prev, adminConfigured: true }));
    await refreshState();
  };

  const loginAdmin = async (username: string, password: string) => {
    const res = await apiClient.loginAdmin(username, password);
    setAdminToken(res.token);
    await refreshState();
  };

  const logoutAdmin = () => {
    setAdminToken(null);
  };

  const loginModuleAccount = async (scope: LoginScope, identifier: string, password: string) => {
    const res = await apiClient.loginModule(scope, identifier, password);
    if (scope === 'parish-leader') {
      setLeaderToken(res.token);
      if (res.leader) {
        setParishLeaders((prev) => [
          res.leader!,
          ...prev.filter((l) => l.leaderPhone !== res.leader!.leaderPhone),
        ]);
      }
      if (res.batch) {
        setParishBatches((prev) => [
          res.batch!,
          ...prev.filter((b) => b.id !== res.batch!.id),
        ]);
      }
    } else if (res.record?.id) {
      setMemberTokens((prev) => ({ ...prev, [res.record.id]: res.token }));
      if (scope === 'challenge-week') {
        setChallengeTeams((prev) => [
          res.record,
          ...prev.filter((t) => t.id !== res.record.id),
        ]);
      } else if (scope === 'junior-youth') {
        setMembers((prev) => [
          res.record,
          ...prev.filter((m) => m.id !== res.record.id),
        ]);
      } else if (scope === 'nicca') {
        setNiccaStudents((prev) => [
          res.record,
          ...prev.filter((s) => s.id !== res.record.id),
        ]);
      } else if (scope === 'career-day') {
        setCareerRegistrations((prev) => [
          res.record,
          ...prev.filter((c) => c.id !== res.record.id),
        ]);
      } else if (scope === 'matrons-patrons') {
        setMatronsPatrons((prev) => [
          res.record,
          ...prev.filter((a) => a.id !== res.record.id),
        ]);
      }
    }
    return res;
  };

  // ---------------------------------------------------------------------------
  // Member & Parish Batch Actions
  // ---------------------------------------------------------------------------
  const addParishRegistrationBatch = async (
    batchData: Omit<ParishRegistrationBatch, 'id' | 'submittedAt' | 'memberIds' | 'totalFee'>,
    names: string[]
  ): Promise<{ batch: ParishRegistrationBatch; newMembers: YouthMember[] }> => {
    const res = await apiClient.createParishBatch(batchData, names);
    setLeaderToken(res.leaderToken);
    setMembers((prev) => [...res.newMembers, ...prev]);
    setParishBatches((prev) => [res.batch, ...prev]);
    const leaderAccount: ParishLeaderAccount = {
      leaderPhone: res.batch.leaderPhone,
      leaderName: res.batch.leaderName,
      password: '',
      deaneryName: res.batch.deaneryName,
      parishName: res.batch.parishName,
      localChurch: res.batch.localChurch,
      batchId: res.batch.id,
    };
    setParishLeaders((prev) => [leaderAccount, ...prev.filter((l) => l.leaderPhone !== leaderAccount.leaderPhone)]);
    return { batch: res.batch, newMembers: res.newMembers };
  };

  const confirmParishBatch = async (batchId: string, adminName: string = 'Archdiocesan Youth Chaplaincy') => {
    const res = await apiClient.confirmParishBatch(batchId, adminName, adminToken);
    setParishBatches((prev) => prev.map((b) => (b.id === batchId ? res.batch : b)));
    setMembers((prev) =>
      prev.map((m) => (m.batchId === batchId ? { ...m, approvalStatus: 'Confirmed' } : m))
    );
  };

  const confirmIndividualMember = async (memberId: string, adminName: string = 'Archdiocesan Youth Chaplaincy') => {
    const res = await apiClient.confirmIndividualMember(memberId, adminName, adminToken);
    setMembers((prev) => prev.map((m) => (m.id === memberId ? res.member : m)));
  };

  const addMemberToBatch = async (
    batchId: string,
    memberData: { fullName: string; phone?: string; age?: number; gender?: 'Male' | 'Female' }
  ): Promise<YouthMember> => {
    const res = await apiClient.addMemberToBatch(batchId, memberData, adminToken || leaderToken);
    setMembers((prev) => [res.member, ...prev]);
    setParishBatches((prev) => prev.map((b) => (b.id === batchId ? res.batch : b)));
    return res.member;
  };

  const addMember = async (memberData: Omit<YouthMember, 'id'>): Promise<YouthMember> => {
    const res = await apiClient.createMember(memberData);
    setMemberTokens((prev) => ({ ...prev, [res.member.id]: res.token }));
    setMembers((prev) => [res.member, ...prev]);
    return res.member;
  };

  const updateMember = async (id: string, updates: Partial<YouthMember>) => {
    const res = await apiClient.updateMember(id, updates, adminToken || leaderToken);
    setMembers((prev) => prev.map((m) => (m.id === id ? res.member : m)));
  };

  const deleteMember = async (id: string) => {
    await apiClient.deleteMember(id, adminToken || leaderToken);
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  // ---------------------------------------------------------------------------
  // Events, Finance, Vocations, Welfare, Parishes
  // ---------------------------------------------------------------------------
  const addEvent = async (eventData: Omit<ArchdiocesanEvent, 'id' | 'registeredMemberIds' | 'attendedMemberIds'>) => {
    const res = await apiClient.createEvent(eventData, adminToken);
    setEvents((prev) => [res.event, ...prev]);
  };

  const updateEvent = async (id: string, updates: Partial<ArchdiocesanEvent>) => {
    const res = await apiClient.updateEvent(id, updates, adminToken);
    setEvents((prev) => prev.map((e) => (e.id === id ? res.event : e)));
  };

  const toggleEventRegistration = async (eventId: string, memberId: string) => {
    const res = await apiClient.toggleEventRegistration(eventId, memberId);
    setEvents((prev) => prev.map((evt) => (evt.id === eventId ? res.event : evt)));
  };

  const markEventAttendance = async (eventId: string, memberId: string): Promise<boolean> => {
    const res = await apiClient.markEventAttendance(eventId, memberId);
    setEvents((prev) => prev.map((evt) => (evt.id === eventId ? res.event : evt)));
    return res.marked;
  };

  const addRemittance = async (remData: Omit<FinancialRemittance, 'id' | 'receiptNo'>) => {
    const res = await apiClient.createRemittance(remData);
    setRemittances((prev) => [res.remittance, ...prev]);
    if (remData.remittanceType === 'Annual Archdiocesan Youth Levy') {
      setParishes((prev) =>
        prev.map((p) =>
          p.id === remData.parishId ? { ...p, annualLevyPaid: p.annualLevyPaid + remData.amount } : p
        )
      );
    }
  };

  const verifyRemittance = async (id: string, verifiedBy: string) => {
    const res = await apiClient.verifyRemittance(id, verifiedBy, adminToken);
    setRemittances((prev) => prev.map((r) => (r.id === id ? res.remittance : r)));
  };

  const addVocation = async (vocData: Omit<VocationAspirant, 'id' | 'dateRecorded'>) => {
    const res = await apiClient.createVocation(vocData);
    setVocations((prev) => [res.vocation, ...prev]);
  };

  const updateVocationStage = async (id: string, stage: VocationAspirant['stage']) => {
    const res = await apiClient.updateVocationStage(id, stage, adminToken);
    setVocations((prev) => prev.map((v) => (v.id === id ? res.vocation : v)));
  };

  const addWelfareCase = async (welfData: Omit<WelfareCase, 'id' | 'dateFiled'>) => {
    const res = await apiClient.createWelfareCase(welfData);
    setWelfare((prev) => [res.welfareCase, ...prev]);
  };

  const updateWelfareStatus = async (id: string, status: WelfareCase['status'], amountDisbursed?: number) => {
    const res = await apiClient.updateWelfareStatus(id, status, amountDisbursed, adminToken);
    setWelfare((prev) => prev.map((w) => (w.id === id ? res.welfareCase : w)));
  };

  const addParish = async (parishData: Omit<Parish, 'id'>) => {
    const res = await apiClient.createParish(parishData, adminToken);
    setParishes((prev) => [...prev, res.parish]);
  };

  const updateParish = async (id: string, updates: Partial<Parish>) => {
    const res = await apiClient.updateParish(id, updates, adminToken);
    setParishes((prev) => prev.map((p) => (p.id === id ? res.parish : p)));
  };

  // ---------------------------------------------------------------------------
  // NICCA, Challenge Week, Career Day, Matrons/Patrons, Secondary Youth
  // ---------------------------------------------------------------------------
  const addNiccaStudent = async (studentData: Omit<NiccaStudent, 'id' | 'registrationDate'>): Promise<NiccaStudent> => {
    const res = await apiClient.createNiccaStudent(studentData);
    setMemberTokens((prev) => ({ ...prev, [res.student.id]: res.token }));
    setNiccaStudents((prev) => [res.student, ...prev]);
    return res.student;
  };

  const deleteNiccaStudent = async (id: string) => {
    await apiClient.deleteNiccaStudent(id, adminToken);
    setNiccaStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const addChallengeTeam = async (teamData: Omit<ChallengeWeekTeam, 'id' | 'registrationDate'>): Promise<ChallengeWeekTeam> => {
    const res = await apiClient.createChallengeTeam(teamData);
    setMemberTokens((prev) => ({ ...prev, [res.team.id]: res.token }));
    setChallengeTeams((prev) => [res.team, ...prev]);
    return res.team;
  };

  const updateChallengeScore = async (id: string, updates: Partial<ChallengeWeekTeam>) => {
    const res = await apiClient.updateChallengeTeam(id, updates, adminToken);
    setChallengeTeams((prev) => prev.map((t) => (t.id === id ? res.team : t)));
  };

  const confirmChallengeTeam = async (id: string, adminName: string = 'Archdiocesan Youth Chaplaincy') => {
    const res = await apiClient.confirmChallengeTeam(id, adminName, adminToken);
    setChallengeTeams((prev) => prev.map((t) => (t.id === id ? res.team : t)));
  };

  const rejectChallengeTeam = async (id: string, reason: string = 'M-Pesa payment could not be verified.') => {
    const res = await apiClient.rejectChallengeTeam(id, reason, adminToken);
    setChallengeTeams((prev) => prev.map((t) => (t.id === id ? res.team : t)));
  };

  const updateChallengeMemberPhoto = async (teamId: string, memberIndex: number, photoDataUrl: string) => {
    const token = adminToken || memberTokens[teamId] || null;
    const res = await apiClient.uploadChallengePhoto(teamId, memberIndex, photoDataUrl, token);
    setChallengeTeams((prev) => prev.map((t) => (t.id === teamId ? res.team : t)));
  };

  const addCareerRegistration = async (regData: Omit<CareerDayRegistration, 'id' | 'registeredDate'>): Promise<CareerDayRegistration> => {
    const res = await apiClient.createCareerRegistration(regData);
    setMemberTokens((prev) => ({ ...prev, [res.registration.id]: res.token }));
    setCareerRegistrations((prev) => [res.registration, ...prev]);
    return res.registration;
  };

  const deleteCareerRegistration = async (id: string) => {
    await apiClient.deleteCareerRegistration(id, adminToken);
    setCareerRegistrations((prev) => prev.filter((r) => r.id !== id));
  };

  const addMatronPatron = async (animatorData: Omit<MatronPatron, 'id'>): Promise<MatronPatron> => {
    const res = await apiClient.createMatronPatron(animatorData);
    setMemberTokens((prev) => ({ ...prev, [res.animator.id]: res.token }));
    setMatronsPatrons((prev) => [res.animator, ...prev]);
    return res.animator;
  };

  const deleteMatronPatron = async (id: string) => {
    await apiClient.deleteMatronPatron(id, adminToken);
    setMatronsPatrons((prev) => prev.filter((a) => a.id !== id));
  };

  const addSecondaryYouth = async (secData: Omit<SecondarySchoolStudent, 'id' | 'registrationDate'>) => {
    const res = await apiClient.createSecondaryYouth(secData);
    setSecondaryYouth((prev) => [res.student, ...prev]);
  };

  const deleteSecondaryYouth = async (id: string) => {
    await apiClient.deleteSecondaryYouth(id, adminToken);
    setSecondaryYouth((prev) => prev.filter((s) => s.id !== id));
  };

  // ---------------------------------------------------------------------------
  // System Backup / Import / Reset
  // ---------------------------------------------------------------------------
  const exportDataJson = (): string => {
    const data = {
      exportedAt: new Date().toISOString(),
      archdiocese: 'Catholic Archdiocese of Nyeri',
      ministry: 'Youth Management System - system.quovadisyouthhub.org',
      members,
      parishes,
      deaneries,
      events,
      remittances,
      vocations,
      welfare,
      niccaStudents,
      challengeTeams,
      careerRegistrations,
      matronsPatrons,
      secondaryYouth,
      parishBatches,
    };
    return JSON.stringify(data, null, 2);
  };

  const importDataJson = async (jsonString: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonString);
      const res = await apiClient.importData(parsed, adminToken);
      applyServerState(res.state);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  };

  const resetToSeedData = async () => {
    const res = await apiClient.resetDatabase(adminToken);
    applyServerState(res.state);
  };

  return (
    <YouthContext.Provider
      value={{
        members,
        parishes,
        deaneries,
        events,
        remittances,
        vocations,
        welfare,
        currentRole,
        selectedDeaneryId,
        selectedParishId,
        currentMemberId,
        setCurrentRole,
        setSelectedDeaneryId,
        setSelectedParishId,
        setCurrentMemberId,
        dbStatus,
        adminToken,
        leaderToken,
        refreshState,
        setupAdminPassword,
        loginAdmin,
        logoutAdmin,
        loginModuleAccount,
        niccaStudents,
        challengeTeams,
        careerRegistrations,
        matronsPatrons,
        secondaryYouth,
        parishBatches,
        parishLeaders,
        addParishRegistrationBatch,
        confirmParishBatch,
        confirmIndividualMember,
        addMemberToBatch,
        addMember,
        updateMember,
        deleteMember,
        addEvent,
        updateEvent,
        toggleEventRegistration,
        markEventAttendance,
        addRemittance,
        verifyRemittance,
        addVocation,
        updateVocationStage,
        addWelfareCase,
        updateWelfareStatus,
        addParish,
        updateParish,
        addNiccaStudent,
        deleteNiccaStudent,
        addChallengeTeam,
        updateChallengeScore,
        confirmChallengeTeam,
        rejectChallengeTeam,
        updateChallengeMemberPhoto,
        addCareerRegistration,
        deleteCareerRegistration,
        addMatronPatron,
        deleteMatronPatron,
        addSecondaryYouth,
        deleteSecondaryYouth,
        exportDataJson,
        importDataJson,
        resetToSeedData,
      }}
    >
      {children}
    </YouthContext.Provider>
  );
};

export const useYouth = () => {
  const context = useContext(YouthContext);
  if (!context) {
    throw new Error('useYouth must be used within a YouthProvider');
  }
  return context;
};
