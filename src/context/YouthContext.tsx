import React, { createContext, useContext, useState, useEffect } from 'react';
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
  ParishLeaderAccount
} from '../types';
import { 
  SEED_DEANERIES, 
  SEED_PARISHES, 
  SEED_MEMBERS, 
  SEED_EVENTS, 
  SEED_REMITTANCES, 
  SEED_VOCATIONS, 
  SEED_WELFARE 
} from '../data/seedData';
import {
  SEED_NICCA_STUDENTS,
  SEED_CHALLENGE_WEEK_TEAMS,
  SEED_CAREER_DAY,
  SEED_MATRONS_PATRONS,
  SEED_SECONDARY_SCHOOL_YOUTH,
  SEED_PARISH_BATCHES,
  SEED_PARISH_LEADERS
} from '../data/seedModules';

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
  ) => { batch: ParishRegistrationBatch; newMembers: YouthMember[] };
  confirmParishBatch: (batchId: string, adminName?: string) => void;
  confirmIndividualMember: (memberId: string, adminName?: string) => void;
  addMemberToBatch: (
    batchId: string,
    member: { fullName: string; phone?: string; age?: number; gender?: 'Male' | 'Female' }
  ) => YouthMember;

  
  // Member actions
  addMember: (member: Omit<YouthMember, 'id'>) => YouthMember;
  updateMember: (id: string, updates: Partial<YouthMember>) => void;
  deleteMember: (id: string) => void;

  // Event actions
  addEvent: (event: Omit<ArchdiocesanEvent, 'id' | 'registeredMemberIds' | 'attendedMemberIds'>) => void;
  updateEvent: (id: string, updates: Partial<ArchdiocesanEvent>) => void;
  toggleEventRegistration: (eventId: string, memberId: string) => void;
  markEventAttendance: (eventId: string, memberId: string) => boolean;

  // Finance actions
  addRemittance: (remittance: Omit<FinancialRemittance, 'id' | 'receiptNo'>) => void;
  verifyRemittance: (id: string, verifiedBy: string) => void;

  // Vocation & Welfare actions
  addVocation: (vocation: Omit<VocationAspirant, 'id' | 'dateRecorded'>) => void;
  updateVocationStage: (id: string, stage: VocationAspirant['stage']) => void;
  addWelfareCase: (welfare: Omit<WelfareCase, 'id' | 'dateFiled'>) => void;
  updateWelfareStatus: (id: string, status: WelfareCase['status'], amountDisbursed?: number) => void;

  // Parishes
  addParish: (parish: Omit<Parish, 'id'>) => void;
  updateParish: (id: string, updates: Partial<Parish>) => void;

  // NICCA
  addNiccaStudent: (student: Omit<NiccaStudent, 'id' | 'registrationDate'>) => NiccaStudent;
  deleteNiccaStudent: (id: string) => void;

  // Challenge Week
  addChallengeTeam: (team: Omit<ChallengeWeekTeam, 'id' | 'registrationDate'>) => void;
  updateChallengeScore: (id: string, updates: Partial<ChallengeWeekTeam>) => void;

  // Career Day
  addCareerRegistration: (reg: Omit<CareerDayRegistration, 'id' | 'registeredDate'>) => void;
  deleteCareerRegistration: (id: string) => void;

  // Matrons and Patrons
  addMatronPatron: (animator: Omit<MatronPatron, 'id'>) => void;
  deleteMatronPatron: (id: string) => void;

  // Secondary School Youth
  addSecondaryYouth: (student: Omit<SecondarySchoolStudent, 'id' | 'registrationDate'>) => void;
  deleteSecondaryYouth: (id: string) => void;

  // System
  exportDataJson: () => string;
  importDataJson: (jsonString: string) => boolean;
  resetToSeedData: () => void;
}

const STORAGE_KEY = 'ADN_YOUTH_MANAGEMENT_DATA_V3';

const YouthContext = createContext<YouthContextType | undefined>(undefined);

export const YouthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<YouthMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.members) {
          return parsed.members.map((m: YouthMember) => ({
            ...m,
            approvalStatus: m.approvalStatus || 'Confirmed',
          }));
        }
      }
    } catch {}
    return SEED_MEMBERS.map(m => ({ ...m, approvalStatus: m.approvalStatus || 'Confirmed' }));
  });

  const [parishes, setParishes] = useState<Parish[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.parishes) return parsed.parishes;
      }
    } catch {}
    return SEED_PARISHES;
  });

  const [deaneries, setDeaneries] = useState<Deanery[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.deaneries) return parsed.deaneries;
      }
    } catch {}
    return SEED_DEANERIES;
  });

  const [events, setEvents] = useState<ArchdiocesanEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.events) return parsed.events;
      }
    } catch {}
    return SEED_EVENTS;
  });

  const [remittances, setRemittances] = useState<FinancialRemittance[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.remittances) return parsed.remittances;
      }
    } catch {}
    return SEED_REMITTANCES;
  });

  const [vocations, setVocations] = useState<VocationAspirant[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.vocations) return parsed.vocations;
      }
    } catch {}
    return SEED_VOCATIONS;
  });

  const [welfare, setWelfare] = useState<WelfareCase[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.welfare) return parsed.welfare;
      }
    } catch {}
    return SEED_WELFARE;
  });

  // New modules states
  const [niccaStudents, setNiccaStudents] = useState<NiccaStudent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.niccaStudents) return parsed.niccaStudents;
      }
    } catch {}
    return SEED_NICCA_STUDENTS;
  });

  const [challengeTeams, setChallengeTeams] = useState<ChallengeWeekTeam[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.challengeTeams) return parsed.challengeTeams;
      }
    } catch {}
    return SEED_CHALLENGE_WEEK_TEAMS;
  });

  const [careerRegistrations, setCareerRegistrations] = useState<CareerDayRegistration[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.careerRegistrations) return parsed.careerRegistrations;
      }
    } catch {}
    return SEED_CAREER_DAY;
  });

  const [matronsPatrons, setMatronsPatrons] = useState<MatronPatron[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.matronsPatrons) return parsed.matronsPatrons;
      }
    } catch {}
    return SEED_MATRONS_PATRONS;
  });

  const [secondaryYouth, setSecondaryYouth] = useState<SecondarySchoolStudent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.secondaryYouth) return parsed.secondaryYouth;
      }
    } catch {}
    return SEED_SECONDARY_SCHOOL_YOUTH;
  });

  const [parishBatches, setParishBatches] = useState<ParishRegistrationBatch[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.parishBatches) return parsed.parishBatches;
      }
    } catch {}
    return SEED_PARISH_BATCHES;
  });

  const [parishLeaders, setParishLeaders] = useState<ParishLeaderAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.parishLeaders) return parsed.parishLeaders;
      }
    } catch {}
    return SEED_PARISH_LEADERS;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>('Archdiocesan Chaplaincy');
  const [selectedDeaneryId, setSelectedDeaneryId] = useState<string>('ALL');
  const [selectedParishId, setSelectedParishId] = useState<string>('ALL');
  const [currentMemberId, setCurrentMemberId] = useState<string>('ADN-YTH-2026-0001');

  // Sync to localStorage
  useEffect(() => {
    try {
      const stateToPersist = {
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
        parishLeaders,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }, [
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
    parishLeaders,
  ]);

  const addMember = (memberData: Omit<YouthMember, 'id'>): YouthMember => {
    const nextNumber = members.length + 1;
    const formattedNum = String(nextNumber).padStart(4, '0');
    const newId = `ADN-YTH-2026-${formattedNum}`;
    const newMember: YouthMember = { ...memberData, id: newId };
    setMembers(prev => [newMember, ...prev]);
    return newMember;
  };

  const updateMember = (id: string, updates: Partial<YouthMember>) => {
    setMembers(prev => prev.map(m => (m.id === id ? { ...m, ...updates } : m)));
  };

  const deleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const addEvent = (eventData: Omit<ArchdiocesanEvent, 'id' | 'registeredMemberIds' | 'attendedMemberIds'>) => {
    const newId = `evt-${Date.now()}`;
    const newEvent: ArchdiocesanEvent = {
      ...eventData,
      id: newId,
      registeredMemberIds: [],
      attendedMemberIds: [],
    };
    setEvents(prev => [newEvent, ...prev]);
  };

  const updateEvent = (id: string, updates: Partial<ArchdiocesanEvent>) => {
    setEvents(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)));
  };

  const toggleEventRegistration = (eventId: string, memberId: string) => {
    setEvents(prev =>
      prev.map(evt => {
        if (evt.id !== eventId) return evt;
        const exists = evt.registeredMemberIds.includes(memberId);
        return {
          ...evt,
          registeredMemberIds: exists
            ? evt.registeredMemberIds.filter(id => id !== memberId)
            : [...evt.registeredMemberIds, memberId],
        };
      })
    );
  };

  const markEventAttendance = (eventId: string, memberId: string): boolean => {
    let marked = false;
    setEvents(prev =>
      prev.map(evt => {
        if (evt.id !== eventId) return evt;
        if (!evt.attendedMemberIds.includes(memberId)) {
          marked = true;
          return {
            ...evt,
            attendedMemberIds: [...evt.attendedMemberIds, memberId],
            registeredMemberIds: evt.registeredMemberIds.includes(memberId)
              ? evt.registeredMemberIds
              : [...evt.registeredMemberIds, memberId],
          };
        }
        return evt;
      })
    );
    return marked;
  };

  const addRemittance = (remData: Omit<FinancialRemittance, 'id' | 'receiptNo'>) => {
    const receiptNo = `REC-ADN-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newRem: FinancialRemittance = {
      ...remData,
      id: `rem-${Date.now()}`,
      receiptNo,
    };
    setRemittances(prev => [newRem, ...prev]);

    if (remData.remittanceType === 'Annual Archdiocesan Youth Levy') {
      setParishes(prev =>
        prev.map(p =>
          p.id === remData.parishId
            ? { ...p, annualLevyPaid: p.annualLevyPaid + remData.amount }
            : p
        )
      );
    }
  };

  const verifyRemittance = (id: string, verifiedBy: string) => {
    setRemittances(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'Verified', verifiedBy } : r))
    );
  };

  const addVocation = (vocData: Omit<VocationAspirant, 'id' | 'dateRecorded'>) => {
    const newVoc: VocationAspirant = {
      ...vocData,
      id: `voc-${Date.now()}`,
      dateRecorded: new Date().toISOString().split('T')[0],
    };
    setVocations(prev => [newVoc, ...prev]);
  };

  const updateVocationStage = (id: string, stage: VocationAspirant['stage']) => {
    setVocations(prev => prev.map(v => (v.id === id ? { ...v, stage } : v)));
  };

  const addWelfareCase = (welfData: Omit<WelfareCase, 'id' | 'dateFiled'>) => {
    const newWelf: WelfareCase = {
      ...welfData,
      id: `welf-${Date.now()}`,
      dateFiled: new Date().toISOString().split('T')[0],
    };
    setWelfare(prev => [newWelf, ...prev]);
  };

  const updateWelfareStatus = (id: string, status: WelfareCase['status'], amountDisbursed?: number) => {
    setWelfare(prev =>
      prev.map(w =>
        w.id === id
          ? {
              ...w,
              status,
              amountDisbursed: amountDisbursed !== undefined ? amountDisbursed : w.amountDisbursed,
            }
          : w
      )
    );
  };

  const addParish = (parishData: Omit<Parish, 'id'>) => {
    const id = `parish-${Date.now()}`;
    const newParish: Parish = { ...parishData, id };
    setParishes(prev => [...prev, newParish]);
  };

  const updateParish = (id: string, updates: Partial<Parish>) => {
    setParishes(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  // NICCA
  const addNiccaStudent = (studentData: Omit<NiccaStudent, 'id' | 'registrationDate'>): NiccaStudent => {
    const nextNum = niccaStudents.length + 1;
    const newStudent: NiccaStudent = {
      ...studentData,
      id: `NICCA-2027-${String(nextNum).padStart(3, '0')}`,
      registrationDate: new Date().toISOString().split('T')[0],
      amountPaid: studentData.amountPaid !== undefined ? studentData.amountPaid : 100,
      paymentStatus: studentData.paymentStatus || 'Paid',
    };
    setNiccaStudents(prev => [newStudent, ...prev]);
    return newStudent;
  };

  const deleteNiccaStudent = (id: string) => {
    setNiccaStudents(prev => prev.filter(s => s.id !== id));
  };

  // Challenge Week
  const addChallengeTeam = (teamData: Omit<ChallengeWeekTeam, 'id' | 'registrationDate'>) => {
    const nextNum = challengeTeams.length + 1;
    const newTeam: ChallengeWeekTeam = {
      ...teamData,
      id: `CHALL-2026-${String(nextNum).padStart(2, '0')}`,
      registrationDate: new Date().toISOString().split('T')[0],
    };
    setChallengeTeams(prev => [newTeam, ...prev]);
  };

  const updateChallengeScore = (id: string, updates: Partial<ChallengeWeekTeam>) => {
    setChallengeTeams(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  };

  // Career Day
  const addCareerRegistration = (regData: Omit<CareerDayRegistration, 'id' | 'registeredDate'>) => {
    const nextNum = careerRegistrations.length + 1;
    const newReg: CareerDayRegistration = {
      ...regData,
      id: `CAR-2026-${String(nextNum).padStart(3, '0')}`,
      registeredDate: new Date().toISOString().split('T')[0],
    };
    setCareerRegistrations(prev => [newReg, ...prev]);
  };

  const deleteCareerRegistration = (id: string) => {
    setCareerRegistrations(prev => prev.filter(r => r.id !== id));
  };

  // Matrons and Patrons
  const addMatronPatron = (animatorData: Omit<MatronPatron, 'id'>) => {
    const nextNum = matronsPatrons.length + 1;
    const newAnimator: MatronPatron = {
      ...animatorData,
      id: `ANIM-2026-${String(nextNum).padStart(3, '0')}`,
    };
    setMatronsPatrons(prev => [newAnimator, ...prev]);
  };

  const deleteMatronPatron = (id: string) => {
    setMatronsPatrons(prev => prev.filter(a => a.id !== id));
  };

  // Secondary School Youth
  const addSecondaryYouth = (secData: Omit<SecondarySchoolStudent, 'id' | 'registrationDate'>) => {
    const nextNum = secondaryYouth.length + 1;
    const newSec: SecondarySchoolStudent = {
      ...secData,
      id: `SEC-2026-${String(nextNum).padStart(3, '0')}`,
      registrationDate: new Date().toISOString().split('T')[0],
    };
    setSecondaryYouth(prev => [newSec, ...prev]);
  };

  const deleteSecondaryYouth = (id: string) => {
    setSecondaryYouth(prev => prev.filter(s => s.id !== id));
  };

  // Parish Youth Batches
  const addParishRegistrationBatch = (
    batchData: Omit<ParishRegistrationBatch, 'id' | 'submittedAt' | 'memberIds' | 'totalFee'>,
    names: string[]
  ): { batch: ParishRegistrationBatch; newMembers: YouthMember[] } => {
    const batchId = `BATCH-${Date.now()}`;
    const now = new Date().toISOString().split('T')[0];
    const count = names.length;
    const totalFee = count * 100;

    const createdMembers: YouthMember[] = names.map((name, idx) => {
      const nextNum = members.length + idx + 1;
      const formattedId = `ADN-PRSH-2026-${String(nextNum).padStart(4, '0')}`;
      return {
        id: formattedId,
        fullName: name.trim(),
        gender: idx % 2 === 0 ? 'Male' : 'Female',
        dob: '2004-01-01',
        age: 21,
        phone: batchData.leaderPhone,
        email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@adn-youth.org`,
        deaneryId: batchData.deaneryId,
        parishId: batchData.parishId,
        subParish: batchData.localChurch,
        movement: 'CYO',
        occupation: 'Parish Youth Member',
        sacraments: {
          baptism: true,
          firstCommunion: true,
          confirmation: false,
          matrimony: false,
        },
        ministryGuild: 'Parish Youth Group',
        leadershipRole: 'Member',
        emergencyContact: {
          name: batchData.leaderName,
          relation: 'Youth Leader',
          phone: batchData.leaderPhone,
        },
        joinedDate: now,
        status: 'Active',
        skills: ['Parish Youth'],
        approvalStatus: 'Pending',
        registeredByLeaderPhone: batchData.leaderPhone,
        registeredByLeaderName: batchData.leaderName,
        localChurch: batchData.localChurch,
        mpesaRef: batchData.mpesaCode,
        registrationFee: 100,
        batchId: batchId,
      };
    });

    const newBatch: ParishRegistrationBatch = {
      ...batchData,
      id: batchId,
      memberCount: count,
      feePerMember: 100,
      totalFee,
      approvalStatus: 'Pending',
      submittedAt: now,
      memberIds: createdMembers.map((m) => m.id),
    };

    const newLeader: ParishLeaderAccount = {
      leaderPhone: batchData.leaderPhone,
      leaderName: batchData.leaderName,
      password: batchData.password || 'password123',
      deaneryName: batchData.deaneryName,
      parishName: batchData.parishName,
      localChurch: batchData.localChurch,
      batchId: batchId,
    };

    setMembers((prev) => [...createdMembers, ...prev]);
    setParishBatches((prev) => [newBatch, ...prev]);
    setParishLeaders((prev) => {
      const filtered = prev.filter((l) => l.leaderPhone !== batchData.leaderPhone);
      return [newLeader, ...filtered];
    });

    return { batch: newBatch, newMembers: createdMembers };
  };

  const confirmParishBatch = (batchId: string, adminName: string = 'Archdiocesan Youth Chaplaincy') => {
    const now = new Date().toISOString().split('T')[0];
    setParishBatches((prev) =>
      prev.map((b) =>
        b.id === batchId
          ? {
              ...b,
              approvalStatus: 'Confirmed',
              paymentStatus: 'Verified',
              approvedBy: adminName,
              approvedAt: now,
            }
          : b
      )
    );

    setMembers((prev) =>
      prev.map((m) =>
        m.batchId === batchId
          ? { ...m, approvalStatus: 'Confirmed' }
          : m
      )
    );
  };

  const confirmIndividualMember = (memberId: string, adminName: string = 'Archdiocesan Youth Chaplaincy') => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, approvalStatus: 'Confirmed' }
          : m
      )
    );
  };

  const addMemberToBatch = (
    batchId: string,
    memberData: { fullName: string; phone?: string; age?: number; gender?: 'Male' | 'Female' }
  ): YouthMember => {
    const batch = parishBatches.find((b) => b.id === batchId);
    const nextNum = members.length + 1;
    const formattedId = `ADN-PRSH-2026-${String(nextNum).padStart(4, '0')}`;
    const now = new Date().toISOString().split('T')[0];

    const newMember: YouthMember = {
      id: formattedId,
      fullName: memberData.fullName,
      gender: memberData.gender || 'Male',
      dob: '2004-01-01',
      age: memberData.age || 20,
      phone: memberData.phone || batch?.leaderPhone || '+254 700 000 000',
      email: `${memberData.fullName.toLowerCase().replace(/[^a-z0-9]/g, '')}@adn-youth.org`,
      deaneryId: batch?.deaneryId || 'deanery-tetu',
      parishId: batch?.parishId || 'parish-tetu',
      subParish: batch?.localChurch || 'Parish Main',
      movement: 'CYO',
      occupation: 'Parish Youth Member',
      sacraments: {
        baptism: true,
        firstCommunion: true,
        confirmation: false,
        matrimony: false,
      },
      ministryGuild: 'Youth Guild',
      leadershipRole: 'Member',
      emergencyContact: {
        name: batch?.leaderName || 'Youth Leader',
        relation: 'Youth Leader',
        phone: batch?.leaderPhone || '+254 700 000 000',
      },
      joinedDate: now,
      status: 'Active',
      skills: ['Parish Youth'],
      approvalStatus: 'Pending',
      registeredByLeaderPhone: batch?.leaderPhone,
      registeredByLeaderName: batch?.leaderName,
      localChurch: batch?.localChurch,
      mpesaRef: batch?.mpesaCode || 'ADDON',
      registrationFee: 100,
      batchId: batchId,
    };

    setMembers((prev) => [newMember, ...prev]);

    if (batch) {
      setParishBatches((prev) =>
        prev.map((b) =>
          b.id === batchId
            ? {
                ...b,
                memberCount: b.memberCount + 1,
                totalFee: (b.memberCount + 1) * 100,
                memberIds: [...b.memberIds, formattedId],
              }
            : b
        )
      );
    }

    return newMember;
  };

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
      parishLeaders,
    };
    return JSON.stringify(data, null, 2);
  };

  const importDataJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.members && Array.isArray(parsed.members)) setMembers(parsed.members);
      if (parsed.parishes && Array.isArray(parsed.parishes)) setParishes(parsed.parishes);
      if (parsed.deaneries && Array.isArray(parsed.deaneries)) setDeaneries(parsed.deaneries);
      if (parsed.events && Array.isArray(parsed.events)) setEvents(parsed.events);
      if (parsed.remittances && Array.isArray(parsed.remittances)) setRemittances(parsed.remittances);
      if (parsed.vocations && Array.isArray(parsed.vocations)) setVocations(parsed.vocations);
      if (parsed.welfare && Array.isArray(parsed.welfare)) setWelfare(parsed.welfare);
      if (parsed.niccaStudents && Array.isArray(parsed.niccaStudents)) setNiccaStudents(parsed.niccaStudents);
      if (parsed.challengeTeams && Array.isArray(parsed.challengeTeams)) setChallengeTeams(parsed.challengeTeams);
      if (parsed.careerRegistrations && Array.isArray(parsed.careerRegistrations)) setCareerRegistrations(parsed.careerRegistrations);
      if (parsed.matronsPatrons && Array.isArray(parsed.matronsPatrons)) setMatronsPatrons(parsed.matronsPatrons);
      if (parsed.secondaryYouth && Array.isArray(parsed.secondaryYouth)) setSecondaryYouth(parsed.secondaryYouth);
      if (parsed.parishBatches && Array.isArray(parsed.parishBatches)) setParishBatches(parsed.parishBatches);
      if (parsed.parishLeaders && Array.isArray(parsed.parishLeaders)) setParishLeaders(parsed.parishLeaders);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  };

  const resetToSeedData = () => {
    setMembers(SEED_MEMBERS.map(m => ({ ...m, approvalStatus: m.approvalStatus || 'Confirmed' })));
    setParishes(SEED_PARISHES);
    setDeaneries(SEED_DEANERIES);
    setEvents(SEED_EVENTS);
    setRemittances(SEED_REMITTANCES);
    setVocations(SEED_VOCATIONS);
    setWelfare(SEED_WELFARE);
    setNiccaStudents(SEED_NICCA_STUDENTS);
    setChallengeTeams(SEED_CHALLENGE_WEEK_TEAMS);
    setCareerRegistrations(SEED_CAREER_DAY);
    setMatronsPatrons(SEED_MATRONS_PATRONS);
    setSecondaryYouth(SEED_SECONDARY_SCHOOL_YOUTH);
    setParishBatches(SEED_PARISH_BATCHES);
    setParishLeaders(SEED_PARISH_LEADERS);
    localStorage.removeItem(STORAGE_KEY);
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
