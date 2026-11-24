import type {
  YouthMember,
  Parish,
  Deanery,
  ArchdiocesanEvent,
  FinancialRemittance,
  VocationAspirant,
  WelfareCase,
  NiccaStudent,
  ChallengeWeekTeam,
  CareerDayRegistration,
  MatronPatron,
  SecondarySchoolStudent,
  ParishRegistrationBatch,
  ParishLeaderAccount,
} from '../types';

export interface ServerStatePayload {
  dbConfigured?: boolean;
  engine?: 'sqlite' | 'mysql';
  adminConfigured?: boolean;
  members: YouthMember[];
  parishes: Parish[];
  deaneries: Deanery[];
  events: ArchdiocesanEvent[];
  remittances: FinancialRemittance[];
  vocations: VocationAspirant[];
  welfare: WelfareCase[];
  niccaStudents: NiccaStudent[];
  challengeTeams: ChallengeWeekTeam[];
  careerRegistrations: CareerDayRegistration[];
  matronsPatrons: MatronPatron[];
  secondaryYouth: SecondarySchoolStudent[];
  parishBatches: ParishRegistrationBatch[];
}

export type LoginScope =
  | 'parish-leader'
  | 'junior-youth'
  | 'nicca'
  | 'challenge-week'
  | 'career-day'
  | 'matrons-patrons';

async function apiRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
    token?: string | null;
  } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(`/api/${path.replace(/^\/+/, '')}`, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let parsed: any = {};
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(res.ok ? 'Invalid server JSON response.' : `Server error (${res.status})`);
    }
  }

  if (!res.ok) {
    throw new Error(parsed?.error || `Request failed (${res.status})`);
  }

  return parsed as T;
}

export const apiClient = {
  getState: () => apiRequest<ServerStatePayload>('state'),

  getAuthStatus: () =>
    apiRequest<{ dbConfigured: boolean; engine: 'sqlite' | 'mysql'; adminConfigured: boolean }>('auth/status'),

  setupAdmin: (username: string, password: string) =>
    apiRequest<{ ok: boolean; token: string; username: string }>('auth/admin-setup', {
      method: 'POST',
      body: { username, password },
    }),

  loginAdmin: (username: string, password: string) =>
    apiRequest<{ ok: boolean; token: string; username: string }>('auth/admin-login', {
      method: 'POST',
      body: { username, password },
    }),

  loginModule: (scope: LoginScope, identifier: string, password: string) =>
    apiRequest<{
      ok: boolean;
      token: string;
      record?: any;
      leader?: ParishLeaderAccount;
      batch?: ParishRegistrationBatch | null;
    }>('auth/login', {
      method: 'POST',
      body: { scope, identifier, password },
    }),

  createParishBatch: (
    batchData: Omit<ParishRegistrationBatch, 'id' | 'submittedAt' | 'memberIds' | 'totalFee'>,
    names: string[]
  ) =>
    apiRequest<{ batch: ParishRegistrationBatch; newMembers: YouthMember[]; leaderToken: string }>('parish-batches', {
      method: 'POST',
      body: { batchData, names },
    }),

  addMemberToBatch: (
    batchId: string,
    member: { fullName: string; phone?: string; age?: number; gender?: 'Male' | 'Female' },
    token: string | null
  ) =>
    apiRequest<{ member: YouthMember; batch: ParishRegistrationBatch }>(`leader/batches/${encodeURIComponent(batchId)}/members`, {
      method: 'POST',
      body: member,
      token,
    }),

  createMember: (member: Omit<YouthMember, 'id'>) =>
    apiRequest<{ member: YouthMember; token: string }>('members', {
      method: 'POST',
      body: member,
    }),

  updateMember: (id: string, updates: Partial<YouthMember>, token: string | null) =>
    apiRequest<{ member: YouthMember }>(`members/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: updates,
      token,
    }),

  deleteMember: (id: string, token: string | null) =>
    apiRequest<{ ok: boolean }>(`members/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      token,
    }),

  confirmParishBatch: (batchId: string, adminName: string, adminToken: string | null) =>
    apiRequest<{ ok: boolean; batch: ParishRegistrationBatch }>(
      `admin/parish-batches/${encodeURIComponent(batchId)}/confirm`,
      {
        method: 'POST',
        body: { adminName },
        token: adminToken,
      }
    ),

  confirmIndividualMember: (memberId: string, adminName: string, adminToken: string | null) =>
    apiRequest<{ ok: boolean; member: YouthMember }>(
      `admin/members/${encodeURIComponent(memberId)}/confirm`,
      {
        method: 'POST',
        body: { adminName },
        token: adminToken,
      }
    ),

  createNiccaStudent: (student: Omit<NiccaStudent, 'id' | 'registrationDate'>) =>
    apiRequest<{ student: NiccaStudent; token: string }>('nicca', {
      method: 'POST',
      body: student,
    }),

  deleteNiccaStudent: (id: string, adminToken: string | null) =>
    apiRequest<{ ok: boolean }>(`admin/nicca/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      token: adminToken,
    }),

  createChallengeTeam: (team: Omit<ChallengeWeekTeam, 'id' | 'registrationDate'>) =>
    apiRequest<{ team: ChallengeWeekTeam; token: string }>('challenge-teams', {
      method: 'POST',
      body: team,
    }),

  uploadChallengePhoto: (teamId: string, memberIndex: number, photoDataUrl: string, token: string | null) =>
    apiRequest<{ ok: boolean; team: ChallengeWeekTeam }>(`challenge-teams/${encodeURIComponent(teamId)}/photo`, {
      method: 'POST',
      body: { memberIndex, photoDataUrl },
      token,
    }),

  confirmChallengeTeam: (id: string, adminName: string, adminToken: string | null) =>
    apiRequest<{ ok: boolean; team: ChallengeWeekTeam }>(`admin/challenge-teams/${encodeURIComponent(id)}/confirm`, {
      method: 'POST',
      body: { adminName },
      token: adminToken,
    }),

  rejectChallengeTeam: (id: string, reason: string, adminToken: string | null) =>
    apiRequest<{ ok: boolean; team: ChallengeWeekTeam }>(`admin/challenge-teams/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      body: { reason },
      token: adminToken,
    }),

  updateChallengeTeam: (id: string, updates: Partial<ChallengeWeekTeam>, adminToken: string | null) =>
    apiRequest<{ ok: boolean; team: ChallengeWeekTeam }>(`admin/challenge-teams/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: updates,
      token: adminToken,
    }),

  createCareerRegistration: (reg: Omit<CareerDayRegistration, 'id' | 'registeredDate'>) =>
    apiRequest<{ registration: CareerDayRegistration; token: string }>('career-day', {
      method: 'POST',
      body: reg,
    }),

  deleteCareerRegistration: (id: string, adminToken: string | null) =>
    apiRequest<{ ok: boolean }>(`admin/career-day/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      token: adminToken,
    }),

  createMatronPatron: (animator: Omit<MatronPatron, 'id'>) =>
    apiRequest<{ animator: MatronPatron; token: string }>('matrons-patrons', {
      method: 'POST',
      body: animator,
    }),

  deleteMatronPatron: (id: string, adminToken: string | null) =>
    apiRequest<{ ok: boolean }>(`admin/matrons-patrons/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      token: adminToken,
    }),

  createSecondaryYouth: (student: Omit<SecondarySchoolStudent, 'id' | 'registrationDate'>) =>
    apiRequest<{ student: SecondarySchoolStudent }>('secondary-youth', {
      method: 'POST',
      body: student,
    }),

  deleteSecondaryYouth: (id: string, adminToken: string | null) =>
    apiRequest<{ ok: boolean }>(`admin/secondary-youth/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      token: adminToken,
    }),

  toggleEventRegistration: (eventId: string, memberId: string) =>
    apiRequest<{ event: ArchdiocesanEvent }>(`events/${encodeURIComponent(eventId)}/toggle`, {
      method: 'POST',
      body: { memberId },
    }),

  markEventAttendance: (eventId: string, memberId: string) =>
    apiRequest<{ marked: boolean; event: ArchdiocesanEvent }>(`events/${encodeURIComponent(eventId)}/attend`, {
      method: 'POST',
      body: { memberId },
    }),

  createEvent: (event: Omit<ArchdiocesanEvent, 'id' | 'registeredMemberIds' | 'attendedMemberIds'>, adminToken: string | null) =>
    apiRequest<{ event: ArchdiocesanEvent }>('admin/events', {
      method: 'POST',
      body: event,
      token: adminToken,
    }),

  updateEvent: (id: string, updates: Partial<ArchdiocesanEvent>, adminToken: string | null) =>
    apiRequest<{ event: ArchdiocesanEvent }>(`admin/events/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: updates,
      token: adminToken,
    }),

  createRemittance: (remittance: Omit<FinancialRemittance, 'id' | 'receiptNo'>) =>
    apiRequest<{ remittance: FinancialRemittance }>('remittances', {
      method: 'POST',
      body: remittance,
    }),

  verifyRemittance: (id: string, verifiedBy: string, adminToken: string | null) =>
    apiRequest<{ ok: boolean; remittance: FinancialRemittance }>(`admin/remittances/${encodeURIComponent(id)}/verify`, {
      method: 'POST',
      body: { verifiedBy },
      token: adminToken,
    }),

  createVocation: (vocation: Omit<VocationAspirant, 'id' | 'dateRecorded'>) =>
    apiRequest<{ vocation: VocationAspirant }>('vocations', {
      method: 'POST',
      body: vocation,
    }),

  updateVocationStage: (id: string, stage: VocationAspirant['stage'], adminToken: string | null) =>
    apiRequest<{ ok: boolean; vocation: VocationAspirant }>(`admin/vocations/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { stage },
      token: adminToken,
    }),

  createWelfareCase: (welfareCase: Omit<WelfareCase, 'id' | 'dateFiled'>) =>
    apiRequest<{ welfareCase: WelfareCase }>('welfare', {
      method: 'POST',
      body: welfareCase,
    }),

  updateWelfareStatus: (
    id: string,
    status: WelfareCase['status'],
    amountDisbursed: number | undefined,
    adminToken: string | null
  ) =>
    apiRequest<{ ok: boolean; welfareCase: WelfareCase }>(`admin/welfare/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { status, amountDisbursed },
      token: adminToken,
    }),

  createParish: (parish: Omit<Parish, 'id'>, adminToken: string | null) =>
    apiRequest<{ parish: Parish }>('admin/parishes', {
      method: 'POST',
      body: parish,
      token: adminToken,
    }),

  updateParish: (id: string, updates: Partial<Parish>, adminToken: string | null) =>
    apiRequest<{ parish: Parish }>(`admin/parishes/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: updates,
      token: adminToken,
    }),

  importData: (data: unknown, adminToken: string | null) =>
    apiRequest<{ ok: boolean; state: ServerStatePayload }>('admin/import', {
      method: 'POST',
      body: data,
      token: adminToken,
    }),

  resetDatabase: (adminToken: string | null) =>
    apiRequest<{ ok: boolean; state: ServerStatePayload }>('admin/reset', {
      method: 'POST',
      token: adminToken,
    }),
};
