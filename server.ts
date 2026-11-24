import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { SEED_DEANERIES, SEED_PARISHES } from './src/data/seedData.ts';
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
} from './src/types/index.ts';

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_PATH = path.join(DATA_DIR, 'adn_youth.db');
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS admin_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    username TEXT NOT NULL DEFAULT 'admin',
    password_hash TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS deaneries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    payload_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS parishes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    deanery_id TEXT NOT NULL,
    annual_levy_paid REAL NOT NULL DEFAULT 0,
    payload_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS youth_members (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    movement TEXT NOT NULL,
    deanery_id TEXT NOT NULL,
    parish_id TEXT NOT NULL,
    deanery_name TEXT,
    parish_name TEXT,
    local_church TEXT,
    approval_status TEXT NOT NULL DEFAULT 'Pending',
    batch_id TEXT,
    mpesa_ref TEXT,
    password_hash TEXT,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS parish_batches (
    id TEXT PRIMARY KEY,
    leader_phone TEXT NOT NULL,
    leader_name TEXT NOT NULL,
    deanery_name TEXT NOT NULL,
    parish_name TEXT NOT NULL,
    local_church TEXT NOT NULL,
    member_count INTEGER NOT NULL,
    total_fee REAL NOT NULL,
    mpesa_code TEXT NOT NULL,
    approval_status TEXT NOT NULL DEFAULT 'Pending',
    password_hash TEXT,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS parish_leaders (
    leader_phone TEXT PRIMARY KEY,
    leader_name TEXT NOT NULL,
    deanery_name TEXT NOT NULL,
    parish_name TEXT NOT NULL,
    local_church TEXT NOT NULL,
    batch_id TEXT,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS nicca_students (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    institution TEXT NOT NULL,
    phone TEXT NOT NULL,
    mpesa_code TEXT,
    amount_paid REAL NOT NULL DEFAULT 100,
    payment_status TEXT NOT NULL DEFAULT 'Paid',
    password_hash TEXT,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS challenge_teams (
    id TEXT PRIMARY KEY,
    team_name TEXT NOT NULL,
    registration_type TEXT,
    deanery_name TEXT NOT NULL,
    parish_name TEXT NOT NULL,
    local_church TEXT,
    team_leader_name TEXT NOT NULL,
    team_leader_phone TEXT NOT NULL,
    members_count INTEGER NOT NULL DEFAULT 1,
    total_fee REAL NOT NULL DEFAULT 1000,
    mpesa_code TEXT,
    payment_status TEXT NOT NULL DEFAULT 'Pending Verification',
    username TEXT,
    password_hash TEXT,
    login_pin_hash TEXT,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS career_registrations (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    username TEXT,
    school TEXT,
    grade_attained TEXT,
    desired_course TEXT,
    home_area_parish TEXT,
    password_hash TEXT,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS matrons_patrons (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    deanery_name TEXT,
    parish_name TEXT,
    local_church TEXT,
    phone TEXT NOT NULL,
    amount_paid REAL NOT NULL DEFAULT 100,
    mpesa_code TEXT,
    password_hash TEXT,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS secondary_youth (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    school_name TEXT NOT NULL,
    form_level TEXT NOT NULL,
    phone_or_parent_phone TEXT NOT NULL,
    home_parish TEXT NOT NULL,
    home_deanery TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    scope TEXT NOT NULL,
    start_date TEXT NOT NULL,
    status TEXT NOT NULL,
    payload_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS remittances (
    id TEXT PRIMARY KEY,
    receipt_no TEXT NOT NULL,
    parish_id TEXT NOT NULL,
    deanery_id TEXT NOT NULL,
    amount REAL NOT NULL,
    mpesa_ref TEXT NOT NULL,
    status TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vocations (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    aspirant_name TEXT NOT NULL,
    vocation_type TEXT NOT NULL,
    stage TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS welfare (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    member_name TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

function seedHierarchyIfEmpty() {
  const deaneryCountRow = db.prepare('SELECT COUNT(*) AS cnt FROM deaneries').get() as { cnt: number };
  if (deaneryCountRow.cnt === 0) {
    const insertDeanery = db.prepare('INSERT OR IGNORE INTO deaneries (id, name, payload_json) VALUES (?, ?, ?)');
    for (const d of SEED_DEANERIES) {
      insertDeanery.run(d.id, d.name, JSON.stringify(d));
    }
  }

  const parishCountRow = db.prepare('SELECT COUNT(*) AS cnt FROM parishes').get() as { cnt: number };
  if (parishCountRow.cnt === 0) {
    const insertParish = db.prepare(
      'INSERT OR IGNORE INTO parishes (id, name, deanery_id, annual_levy_paid, payload_json) VALUES (?, ?, ?, ?, ?)'
    );
    for (const p of SEED_PARISHES) {
      const cleanParish: Parish = { ...p, annualLevyPaid: 0 };
      insertParish.run(cleanParish.id, cleanParish.name, cleanParish.deaneryId, 0, JSON.stringify(cleanParish));
    }
  }
}

seedHierarchyIfEmpty();

// ---------------------------------------------------------------------------
// Security Helpers (Password Hashing + Signed Bearer Session Tokens)
// ---------------------------------------------------------------------------
function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(plain: string, storedHash: string | null | undefined): boolean {
  if (!plain || !storedHash || !storedHash.includes(':')) return false;
  const [salt, hex] = storedHash.split(':');
  if (!salt || !hex) return false;
  const derived = crypto.scryptSync(plain, salt, 64);
  const expected = Buffer.from(hex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

function timingSafeTextEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

type SessionPayloadInput =
  | { role: 'admin'; username: string }
  | { role: 'leader'; leaderPhone: string; batchId?: string }
  | { role: 'member'; scope: string; id: string };

type SessionPayload = SessionPayloadInput & { exp: number };

function signToken(payload: SessionPayloadInput): string {
  const fullPayload: SessionPayload = { ...payload, exp: Date.now() + TOKEN_TTL_MS };
  const body = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token: string | undefined): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  if (!timingSafeTextEqual(sig, expectedSig)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function extractBearer(req: Request): SessionPayload | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return verifyToken(header.slice(7).trim());
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const session = extractBearer(req);
  if (!session || session.role !== 'admin') {
    return res.status(401).json({ error: 'Admin authentication required.' });
  }
  next();
}

function isAdminConfigured(): boolean {
  if ((process.env.ADMIN_PASSCODE || '').trim().length > 0) return true;
  const row = db.prepare('SELECT id FROM admin_config WHERE id = 1').get();
  return Boolean(row);
}

function stripMemberSecrets<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = { ...obj };
  delete clone.password;
  delete clone.passwordHash;
  delete clone.loginPin;
  return clone;
}

function normalizePhone(val: string): string {
  return String(val || '').replace(/\s+/g, '').trim();
}

function nextSequentialId(table: string, prefix: string, padLength: number): string {
  const rows = db.prepare(`SELECT id FROM ${table}`).all() as { id: string }[];
  let maxNum = rows.length;
  for (const r of rows) {
    const match = String(r.id).match(/(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (!Number.isNaN(n) && n > maxNum) maxNum = n;
    }
  }
  return `${prefix}${String(maxNum + 1).padStart(padLength, '0')}`;
}

function isValidImageDataUrl(val: string): boolean {
  return /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(val);
}

function getAllState() {
  const parseRows = <T>(sql: string): T[] => {
    const rows = db.prepare(sql).all() as { payload_json: string }[];
    return rows.map((r) => stripMemberSecrets(JSON.parse(r.payload_json) as Record<string, any>) as T);
  };

  return {
    dbConfigured: true,
    engine: 'sqlite',
    adminConfigured: isAdminConfigured(),
    members: parseRows<YouthMember>('SELECT payload_json FROM youth_members ORDER BY created_at DESC, rowid DESC'),
    parishes: parseRows<Parish>('SELECT payload_json FROM parishes ORDER BY name ASC'),
    deaneries: parseRows<Deanery>('SELECT payload_json FROM deaneries ORDER BY rowid ASC'),
    events: parseRows<ArchdiocesanEvent>('SELECT payload_json FROM events ORDER BY start_date DESC'),
    remittances: parseRows<FinancialRemittance>('SELECT payload_json FROM remittances ORDER BY created_at DESC, rowid DESC'),
    vocations: parseRows<VocationAspirant>('SELECT payload_json FROM vocations ORDER BY created_at DESC, rowid DESC'),
    welfare: parseRows<WelfareCase>('SELECT payload_json FROM welfare ORDER BY created_at DESC, rowid DESC'),
    niccaStudents: parseRows<NiccaStudent>('SELECT payload_json FROM nicca_students ORDER BY created_at DESC, rowid DESC'),
    challengeTeams: parseRows<ChallengeWeekTeam>('SELECT payload_json FROM challenge_teams ORDER BY created_at DESC, rowid DESC'),
    careerRegistrations: parseRows<CareerDayRegistration>('SELECT payload_json FROM career_registrations ORDER BY created_at DESC, rowid DESC'),
    matronsPatrons: parseRows<MatronPatron>('SELECT payload_json FROM matrons_patrons ORDER BY created_at DESC, rowid DESC'),
    secondaryYouth: parseRows<SecondarySchoolStudent>('SELECT payload_json FROM secondary_youth ORDER BY created_at DESC, rowid DESC'),
    parishBatches: parseRows<ParishRegistrationBatch>('SELECT payload_json FROM parish_batches ORDER BY created_at DESC, rowid DESC'),
  };
}

// ---------------------------------------------------------------------------
// Express App & API Routes
// ---------------------------------------------------------------------------
const app = express();
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    dbConfigured: true,
    engine: 'sqlite',
    adminConfigured: isAdminConfigured(),
  });
});

app.get('/api/auth/status', (_req, res) => {
  res.json({
    dbConfigured: true,
    engine: 'sqlite',
    adminConfigured: isAdminConfigured(),
  });
});

app.post('/api/auth/admin-setup', (req, res) => {
  if (isAdminConfigured()) {
    return res.status(409).json({ error: 'Admin password is already configured.' });
  }
  const username = String(req.body?.username || 'admin').trim() || 'admin';
  const password = String(req.body?.password || '').trim();
  if (password.length < 4) {
    return res.status(400).json({ error: 'Admin password must be at least 4 characters.' });
  }

  const hash = hashPassword(password);
  const now = new Date().toISOString();
  db.prepare(
    'INSERT OR REPLACE INTO admin_config (id, username, password_hash, updated_at) VALUES (1, ?, ?, ?)'
  ).run(username, hash, now);

  const token = signToken({ role: 'admin', username });
  res.json({ ok: true, token, username });
});

app.post('/api/auth/admin-login', (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '').trim();

  if (!isAdminConfigured()) {
    return res.status(400).json({ error: 'Admin password is not configured yet. Set it up first.' });
  }

  const envPass = (process.env.ADMIN_PASSCODE || '').trim();
  if (envPass.length > 0) {
    if (username.toLowerCase() === 'admin' && timingSafeTextEqual(password, envPass)) {
      const token = signToken({ role: 'admin', username: 'admin' });
      return res.json({ ok: true, token, username: 'admin' });
    }
    return res.status(401).json({ error: 'Invalid username or password. Access denied.' });
  }

  const row = db.prepare('SELECT username, password_hash FROM admin_config WHERE id = 1').get() as
    | { username: string; password_hash: string }
    | undefined;
  if (!row || username.toLowerCase() !== row.username.toLowerCase() || !verifyPassword(password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password. Access denied.' });
  }

  const token = signToken({ role: 'admin', username: row.username });
  res.json({ ok: true, token, username: row.username });
});

app.post('/api/auth/login', (req, res) => {
  const scope = String(req.body?.scope || '').trim();
  const identifier = String(req.body?.identifier || '').trim();
  const password = String(req.body?.password || '').trim();

  if (!scope || !identifier || !password) {
    return res.status(400).json({ error: 'Please enter both your login identifier and password.' });
  }

  const cleanPhone = normalizePhone(identifier);
  const cleanLower = identifier.toLowerCase();

  if (scope === 'parish-leader') {
    const leaders = db.prepare('SELECT * FROM parish_leaders').all() as {
      leader_phone: string;
      leader_name: string;
      deanery_name: string;
      parish_name: string;
      local_church: string;
      batch_id: string | null;
      password_hash: string;
    }[];
    const leader = leaders.find((l) => normalizePhone(l.leader_phone) === cleanPhone || l.leader_phone === identifier);
    if (leader && verifyPassword(password, leader.password_hash)) {
      const batchRow = leader.batch_id
        ? (db.prepare('SELECT payload_json FROM parish_batches WHERE id = ?').get(leader.batch_id) as { payload_json: string } | undefined)
        : (db.prepare('SELECT payload_json FROM parish_batches WHERE leader_phone = ?').get(leader.leader_phone) as { payload_json: string } | undefined);
      const batch = batchRow ? stripMemberSecrets(JSON.parse(batchRow.payload_json)) : null;
      const token = signToken({ role: 'leader', leaderPhone: leader.leader_phone, batchId: batch?.id || leader.batch_id || undefined });
      return res.json({
        ok: true,
        token,
        leader: {
          leaderPhone: leader.leader_phone,
          leaderName: leader.leader_name,
          deaneryName: leader.deanery_name,
          parishName: leader.parish_name,
          localChurch: leader.local_church,
          batchId: leader.batch_id || batch?.id,
        },
        batch,
      });
    }
    return res.status(401).json({ error: 'Incorrect phone number or password. Please verify and try again.' });
  }

  if (scope === 'junior-youth') {
    const rows = db.prepare("SELECT payload_json, password_hash FROM youth_members WHERE movement = 'Junior Youth'").all() as {
      payload_json: string;
      password_hash: string | null;
    }[];
    for (const r of rows) {
      const m = JSON.parse(r.payload_json) as YouthMember;
      const matchesId = m.id.toLowerCase() === cleanLower || normalizePhone(m.phone) === cleanPhone;
      if (matchesId && verifyPassword(password, r.password_hash)) {
        const clean = stripMemberSecrets(m);
        const token = signToken({ role: 'member', scope: 'junior-youth', id: m.id });
        return res.json({ ok: true, token, record: clean });
      }
    }
    return res.status(401).json({ error: 'Invalid phone number/ID or password.' });
  }

  if (scope === 'nicca') {
    const rows = db.prepare('SELECT payload_json, password_hash FROM nicca_students').all() as {
      payload_json: string;
      password_hash: string | null;
    }[];
    for (const r of rows) {
      const s = JSON.parse(r.payload_json) as NiccaStudent;
      const matchesId = s.id.toLowerCase() === cleanLower || normalizePhone(s.phone) === cleanPhone;
      if (matchesId && verifyPassword(password, r.password_hash)) {
        const clean = stripMemberSecrets(s);
        const token = signToken({ role: 'member', scope: 'nicca', id: s.id });
        return res.json({ ok: true, token, record: clean });
      }
    }
    return res.status(401).json({ error: 'Invalid phone number/student ID or password.' });
  }

  if (scope === 'challenge-week') {
    const rows = db.prepare('SELECT payload_json, password_hash, login_pin_hash FROM challenge_teams').all() as {
      payload_json: string;
      password_hash: string | null;
      login_pin_hash: string | null;
    }[];
    for (const r of rows) {
      const t = JSON.parse(r.payload_json) as ChallengeWeekTeam;
      const matchesId =
        t.id.toLowerCase() === cleanLower ||
        normalizePhone(t.teamLeaderPhone) === cleanPhone ||
        (t.username || '').toLowerCase() === cleanLower;
      if (matchesId && (verifyPassword(password, r.password_hash) || verifyPassword(password, r.login_pin_hash))) {
        const clean = stripMemberSecrets(t);
        const token = signToken({ role: 'member', scope: 'challenge-week', id: t.id });
        return res.json({ ok: true, token, record: clean });
      }
    }
    return res.status(401).json({ error: 'Invalid username/phone/code or password.' });
  }

  if (scope === 'career-day') {
    const rows = db.prepare('SELECT payload_json, password_hash FROM career_registrations').all() as {
      payload_json: string;
      password_hash: string | null;
    }[];
    for (const r of rows) {
      const c = JSON.parse(r.payload_json) as CareerDayRegistration;
      const matchesId =
        c.id.toLowerCase() === cleanLower ||
        normalizePhone(c.phone) === cleanPhone ||
        (c.username || '').toLowerCase() === cleanLower;
      if (matchesId && verifyPassword(password, r.password_hash)) {
        const clean = stripMemberSecrets(c);
        const token = signToken({ role: 'member', scope: 'career-day', id: c.id });
        return res.json({ ok: true, token, record: clean });
      }
    }
    return res.status(401).json({ error: 'Invalid username/phone or password.' });
  }

  if (scope === 'matrons-patrons') {
    const rows = db.prepare('SELECT payload_json, password_hash FROM matrons_patrons').all() as {
      payload_json: string;
      password_hash: string | null;
    }[];
    for (const r of rows) {
      const a = JSON.parse(r.payload_json) as MatronPatron;
      const matchesId = a.id.toLowerCase() === cleanLower || normalizePhone(a.phone) === cleanPhone;
      if (matchesId && verifyPassword(password, r.password_hash)) {
        const clean = stripMemberSecrets(a);
        const token = signToken({ role: 'member', scope: 'matrons-patrons', id: a.id });
        return res.json({ ok: true, token, record: clean });
      }
    }
    return res.status(401).json({ error: 'Invalid phone number/ID or password.' });
  }

  return res.status(400).json({ error: 'Unsupported login scope.' });
});

app.get('/api/state', (_req, res) => {
  res.json(getAllState());
});

// ---------------------------------------------------------------------------
// Public Registration Routes
// ---------------------------------------------------------------------------
app.post('/api/parish-batches', (req, res) => {
  const batchData = req.body?.batchData;
  const names = req.body?.names;
  if (!batchData || !Array.isArray(names) || names.length === 0 || names.length > 200) {
    return res.status(400).json({ error: 'Provide batch details and 1–200 member names.' });
  }
  const leaderPhone = String(batchData.leaderPhone || '').trim();
  const leaderName = String(batchData.leaderName || '').trim();
  const localChurch = String(batchData.localChurch || '').trim();
  const mpesaCode = String(batchData.mpesaCode || '').trim().toUpperCase();
  const rawPass = String(batchData.password || '').trim();
  if (!leaderPhone || !leaderName || !localChurch || !mpesaCode || rawPass.length < 3) {
    return res.status(400).json({ error: 'Leader phone, name, password, local church, and M-Pesa code are required.' });
  }

  const batchId = `BATCH-${Date.now()}`;
  const now = new Date().toISOString().split('T')[0];
  const count = names.length;
  const totalFee = count * 100;
  const passwordHash = hashPassword(rawPass);

  const existingMemberRows = db.prepare('SELECT id FROM youth_members').all() as { id: string }[];
  let maxMemberNum = existingMemberRows.length;
  for (const r of existingMemberRows) {
    const match = String(r.id).match(/(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (!Number.isNaN(n) && n > maxMemberNum) maxMemberNum = n;
    }
  }

  const createdMembers: YouthMember[] = [];
  const insertMemberStmt = db.prepare(
    `INSERT INTO youth_members (id, full_name, phone, movement, deanery_id, parish_id, deanery_name, parish_name, local_church, approval_status, batch_id, mpesa_ref, password_hash, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  db.exec('BEGIN');
  try {
    for (let idx = 0; idx < names.length; idx++) {
      const name = String(names[idx]).trim();
      if (!name) continue;
      maxMemberNum += 1;
      const formattedId = `ADN-PRSH-2026-${String(maxMemberNum).padStart(4, '0')}`;
      const member: YouthMember = {
        id: formattedId,
        fullName: name,
        gender: idx % 2 === 0 ? 'Male' : 'Female',
        dob: '2004-01-01',
        age: 21,
        phone: leaderPhone,
        email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@adn-youth.org`,
        deaneryId: String(batchData.deaneryId || ''),
        parishId: String(batchData.parishId || ''),
        subParish: localChurch,
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
          name: leaderName,
          relation: 'Youth Leader',
          phone: leaderPhone,
        },
        joinedDate: now,
        status: 'Active',
        skills: ['Parish Youth'],
        approvalStatus: 'Pending',
        registeredByLeaderPhone: leaderPhone,
        registeredByLeaderName: leaderName,
        localChurch,
        mpesaRef: mpesaCode,
        registrationFee: 100,
        batchId,
        deaneryName: String(batchData.deaneryName || ''),
        parishName: String(batchData.parishName || ''),
      };
      insertMemberStmt.run(
        member.id,
        member.fullName,
        member.phone,
        member.movement,
        member.deaneryId,
        member.parishId,
        member.deaneryName || '',
        member.parishName || '',
        member.localChurch || '',
        'Pending',
        batchId,
        mpesaCode,
        null,
        JSON.stringify(member),
        now
      );
      createdMembers.push(member);
    }

    const newBatch: ParishRegistrationBatch = {
      id: batchId,
      leaderPhone,
      leaderName,
      deaneryId: String(batchData.deaneryId || ''),
      deaneryName: String(batchData.deaneryName || ''),
      parishId: String(batchData.parishId || ''),
      parishName: String(batchData.parishName || ''),
      localChurch,
      memberCount: createdMembers.length,
      feePerMember: 100,
      totalFee: createdMembers.length * 100,
      mpesaCode,
      mpesaPhone: String(batchData.mpesaPhone || leaderPhone),
      paymentStatus: 'Pending',
      approvalStatus: 'Pending',
      submittedAt: now,
      memberIds: createdMembers.map((m) => m.id),
    };

    db.prepare(
      `INSERT INTO parish_batches (id, leader_phone, leader_name, deanery_name, parish_name, local_church, member_count, total_fee, mpesa_code, approval_status, password_hash, payload_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      newBatch.id,
      leaderPhone,
      leaderName,
      newBatch.deaneryName,
      newBatch.parishName,
      localChurch,
      newBatch.memberCount,
      totalFee,
      mpesaCode,
      'Pending',
      passwordHash,
      JSON.stringify(newBatch),
      now
    );

    db.prepare(
      `INSERT OR REPLACE INTO parish_leaders (leader_phone, leader_name, deanery_name, parish_name, local_church, batch_id, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      leaderPhone,
      leaderName,
      newBatch.deaneryName,
      newBatch.parishName,
      localChurch,
      batchId,
      passwordHash,
      now
    );

    db.exec('COMMIT');

    const leaderToken = signToken({ role: 'leader', leaderPhone, batchId });
    res.status(201).json({ batch: newBatch, newMembers: createdMembers, leaderToken });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Error creating parish batch:', err);
    res.status(500).json({ error: 'Failed to save parish batch registration.' });
  }
});

app.post('/api/members', (req, res) => {
  const memberData = req.body;
  if (!memberData || !String(memberData.fullName || '').trim()) {
    return res.status(400).json({ error: 'Member full name is required.' });
  }

  const newId = nextSequentialId('youth_members', 'ADN-YTH-2026-', 4);
  const rawPass = String(memberData.password || '').trim();
  const passwordHash = rawPass ? hashPassword(rawPass) : null;
  const createdAt = String(memberData.joinedDate || new Date().toISOString().split('T')[0]);
  const cleanMember: YouthMember = stripMemberSecrets({
    ...memberData,
    id: newId,
    approvalStatus: memberData.approvalStatus || 'Confirmed',
  });

  db.prepare(
    `INSERT INTO youth_members (id, full_name, phone, movement, deanery_id, parish_id, deanery_name, parish_name, local_church, approval_status, batch_id, mpesa_ref, password_hash, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    cleanMember.id,
    cleanMember.fullName,
    cleanMember.phone || '',
    cleanMember.movement || 'CYO',
    cleanMember.deaneryId || '',
    cleanMember.parishId || '',
    cleanMember.deaneryName || '',
    cleanMember.parishName || '',
    cleanMember.localChurch || cleanMember.subParish || '',
    cleanMember.approvalStatus || 'Confirmed',
    cleanMember.batchId || null,
    cleanMember.mpesaRef || null,
    passwordHash,
    JSON.stringify(cleanMember),
    createdAt
  );

  const token = signToken({ role: 'member', scope: 'junior-youth', id: cleanMember.id });
  res.status(201).json({ member: cleanMember, token });
});

app.post('/api/nicca', (req, res) => {
  const data = req.body;
  if (!data || !String(data.fullName || '').trim() || !String(data.institution || '').trim() || !String(data.phone || '').trim()) {
    return res.status(400).json({ error: 'Full name, institution, and phone are required.' });
  }
  const newId = nextSequentialId('nicca_students', 'NICCA-2027-', 3);
  const rawPass = String(data.password || '').trim();
  const passwordHash = rawPass ? hashPassword(rawPass) : null;
  const registrationDate = new Date().toISOString().split('T')[0];

  const cleanStudent: NiccaStudent = stripMemberSecrets({
    ...data,
    id: newId,
    registrationDate,
    amountPaid: data.amountPaid !== undefined ? Number(data.amountPaid) : 100,
    paymentStatus: data.paymentStatus || 'Paid',
  });

  db.prepare(
    `INSERT INTO nicca_students (id, full_name, institution, phone, mpesa_code, amount_paid, payment_status, password_hash, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    cleanStudent.id,
    cleanStudent.fullName,
    cleanStudent.institution,
    cleanStudent.phone,
    cleanStudent.mpesaCode || null,
    cleanStudent.amountPaid ?? 100,
    cleanStudent.paymentStatus || 'Paid',
    passwordHash,
    JSON.stringify(cleanStudent),
    registrationDate
  );

  const token = signToken({ role: 'member', scope: 'nicca', id: cleanStudent.id });
  res.status(201).json({ student: cleanStudent, token });
});

app.post('/api/challenge-teams', (req, res) => {
  const data = req.body;
  if (!data || !String(data.teamName || '').trim() || !String(data.teamLeaderPhone || '').trim()) {
    return res.status(400).json({ error: 'Name and phone number are required.' });
  }

  const newId = nextSequentialId('challenge_teams', 'CHALL-2027-', 2);
  const rawPass = String(data.password || '').trim();
  const rawPin = String(data.loginPin || '').trim();
  const passwordHash = rawPass ? hashPassword(rawPass) : null;
  const pinHash = rawPin ? hashPassword(rawPin) : null;
  const registrationDate = new Date().toISOString().split('T')[0];

  const cleanPhotos: Record<string, string> = {};
  if (data.memberPhotos && typeof data.memberPhotos === 'object') {
    for (const [k, v] of Object.entries(data.memberPhotos)) {
      if (typeof v === 'string' && isValidImageDataUrl(v)) {
        cleanPhotos[k] = v;
      }
    }
  }

  const cleanTeam: ChallengeWeekTeam = stripMemberSecrets({
    ...data,
    memberPhotos: Object.keys(cleanPhotos).length > 0 ? cleanPhotos : data.memberPhotos,
    id: newId,
    registrationDate,
    paymentStatus: data.paymentStatus || 'Pending Verification',
  });

  db.prepare(
    `INSERT INTO challenge_teams (id, team_name, registration_type, deanery_name, parish_name, local_church, team_leader_name, team_leader_phone, members_count, total_fee, mpesa_code, payment_status, username, password_hash, login_pin_hash, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    cleanTeam.id,
    cleanTeam.teamName,
    cleanTeam.registrationType || 'Individual',
    cleanTeam.deaneryName || '',
    cleanTeam.parishName || '',
    cleanTeam.localChurch || '',
    cleanTeam.teamLeaderName || '',
    cleanTeam.teamLeaderPhone || '',
    Number(cleanTeam.membersCount) || 1,
    Number(cleanTeam.totalFee) || 1000,
    cleanTeam.mpesaCode || null,
    cleanTeam.paymentStatus || 'Pending Verification',
    cleanTeam.username || null,
    passwordHash,
    pinHash,
    JSON.stringify(cleanTeam),
    registrationDate
  );

  const token = signToken({ role: 'member', scope: 'challenge-week', id: cleanTeam.id });
  res.status(201).json({ team: cleanTeam, token });
});

app.post('/api/challenge-teams/:id/photo', (req, res) => {
  const session = extractBearer(req);
  const teamId = req.params.id;
  if (!session || (session.role !== 'admin' && !(session.role === 'member' && session.scope === 'challenge-week' && session.id === teamId))) {
    return res.status(401).json({ error: 'Authentication required to upload photo.' });
  }

  const memberIndex = Number(req.body?.memberIndex);
  const photoDataUrl = String(req.body?.photoDataUrl || '');
  if (!Number.isInteger(memberIndex) || memberIndex < 0 || !isValidImageDataUrl(photoDataUrl)) {
    return res.status(400).json({ error: 'Valid JPEG, PNG, or WEBP image data URL is required.' });
  }

  const row = db.prepare('SELECT payload_json FROM challenge_teams WHERE id = ?').get(teamId) as { payload_json: string } | undefined;
  if (!row) {
    return res.status(404).json({ error: 'Challenge Week record not found.' });
  }

  const team = JSON.parse(row.payload_json) as ChallengeWeekTeam;
  team.memberPhotos = { ...(team.memberPhotos || {}), [String(memberIndex)]: photoDataUrl };
  db.prepare('UPDATE challenge_teams SET payload_json = ? WHERE id = ?').run(JSON.stringify(team), teamId);

  res.json({ ok: true, team: stripMemberSecrets(team) });
});

app.post('/api/career-day', (req, res) => {
  const data = req.body;
  if (!data || !String(data.fullName || '').trim() || !String(data.phone || '').trim()) {
    return res.status(400).json({ error: 'Full name and phone number are required.' });
  }
  const newId = nextSequentialId('career_registrations', 'CAR-2027-', 3);
  const rawPass = String(data.password || '').trim();
  const passwordHash = rawPass ? hashPassword(rawPass) : null;
  const registeredDate = new Date().toISOString().split('T')[0];

  const cleanReg: CareerDayRegistration = stripMemberSecrets({
    ...data,
    id: newId,
    registeredDate,
  });

  db.prepare(
    `INSERT INTO career_registrations (id, full_name, phone, username, school, grade_attained, desired_course, home_area_parish, password_hash, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    cleanReg.id,
    cleanReg.fullName,
    cleanReg.phone,
    cleanReg.username || null,
    cleanReg.school || null,
    cleanReg.gradeAttained || null,
    cleanReg.desiredCourse || null,
    cleanReg.homeAreaParish || null,
    passwordHash,
    JSON.stringify(cleanReg),
    registeredDate
  );

  const token = signToken({ role: 'member', scope: 'career-day', id: cleanReg.id });
  res.status(201).json({ registration: cleanReg, token });
});

app.post('/api/matrons-patrons', (req, res) => {
  const data = req.body;
  if (!data || !String(data.fullName || '').trim() || !String(data.phone || '').trim()) {
    return res.status(400).json({ error: 'Full name and phone number are required.' });
  }
  const newId = nextSequentialId('matrons_patrons', 'ANIM-2027-', 3);
  const rawPass = String(data.password || '').trim();
  const passwordHash = rawPass ? hashPassword(rawPass) : null;
  const createdAt = String(data.commissionedDate || new Date().toISOString().split('T')[0]);

  const cleanAnimator: MatronPatron = stripMemberSecrets({
    ...data,
    id: newId,
    amountPaid: data.amountPaid !== undefined ? Number(data.amountPaid) : 100,
  });

  db.prepare(
    `INSERT INTO matrons_patrons (id, full_name, role, deanery_name, parish_name, local_church, phone, amount_paid, mpesa_code, password_hash, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    cleanAnimator.id,
    cleanAnimator.fullName,
    cleanAnimator.role || 'Patron',
    cleanAnimator.deaneryName || null,
    cleanAnimator.parishName || null,
    cleanAnimator.localChurch || null,
    cleanAnimator.phone,
    cleanAnimator.amountPaid ?? 100,
    cleanAnimator.mpesaCode || null,
    passwordHash,
    JSON.stringify(cleanAnimator),
    createdAt
  );

  const token = signToken({ role: 'member', scope: 'matrons-patrons', id: cleanAnimator.id });
  res.status(201).json({ animator: cleanAnimator, token });
});

app.post('/api/secondary-youth', (req, res) => {
  const data = req.body;
  if (!data || !String(data.fullName || '').trim() || !String(data.phoneOrParentPhone || '').trim()) {
    return res.status(400).json({ error: 'Student name and phone are required.' });
  }
  const newId = nextSequentialId('secondary_youth', 'SEC-2026-', 3);
  const registrationDate = new Date().toISOString().split('T')[0];

  const cleanSec: SecondarySchoolStudent = {
    ...data,
    id: newId,
    registrationDate,
  };

  db.prepare(
    `INSERT INTO secondary_youth (id, full_name, school_name, form_level, phone_or_parent_phone, home_parish, home_deanery, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    cleanSec.id,
    cleanSec.fullName,
    cleanSec.schoolName || '',
    cleanSec.formLevel || 'Form 1',
    cleanSec.phoneOrParentPhone,
    cleanSec.homeParish || '',
    cleanSec.homeDeanery || '',
    JSON.stringify(cleanSec),
    registrationDate
  );

  res.status(201).json({ student: cleanSec });
});

// ---------------------------------------------------------------------------
// Authenticated Leader & Member Management Routes
// ---------------------------------------------------------------------------
app.post('/api/leader/batches/:id/members', (req, res) => {
  const session = extractBearer(req);
  const batchId = req.params.id;
  if (!session || (session.role !== 'admin' && !(session.role === 'leader' && session.batchId === batchId))) {
    return res.status(401).json({ error: 'Leader or admin authorization required.' });
  }

  const batchRow = db.prepare('SELECT payload_json FROM parish_batches WHERE id = ?').get(batchId) as { payload_json: string } | undefined;
  if (!batchRow) {
    return res.status(404).json({ error: 'Parish batch not found.' });
  }
  const batch = JSON.parse(batchRow.payload_json) as ParishRegistrationBatch;
  const fullName = String(req.body?.fullName || '').trim();
  if (!fullName) {
    return res.status(400).json({ error: 'Member full name is required.' });
  }

  const formattedId = nextSequentialId('youth_members', 'ADN-PRSH-2026-', 4);
  const now = new Date().toISOString().split('T')[0];

  const newMember: YouthMember = {
    id: formattedId,
    fullName,
    gender: req.body?.gender === 'Female' ? 'Female' : 'Male',
    dob: '2004-01-01',
    age: Number(req.body?.age) || 20,
    phone: String(req.body?.phone || batch.leaderPhone || ''),
    email: `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '')}@adn-youth.org`,
    deaneryId: batch.deaneryId,
    parishId: batch.parishId,
    subParish: batch.localChurch,
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
      name: batch.leaderName,
      relation: 'Youth Leader',
      phone: batch.leaderPhone,
    },
    joinedDate: now,
    status: 'Active',
    skills: ['Parish Youth'],
    approvalStatus: 'Pending',
    registeredByLeaderPhone: batch.leaderPhone,
    registeredByLeaderName: batch.leaderName,
    localChurch: batch.localChurch,
    mpesaRef: batch.mpesaCode || 'ADDON',
    registrationFee: 100,
    batchId,
    deaneryName: batch.deaneryName,
    parishName: batch.parishName,
  };

  batch.memberCount += 1;
  batch.totalFee = batch.memberCount * 100;
  batch.memberIds = [...batch.memberIds, formattedId];

  db.exec('BEGIN');
  try {
    db.prepare(
      `INSERT INTO youth_members (id, full_name, phone, movement, deanery_id, parish_id, deanery_name, parish_name, local_church, approval_status, batch_id, mpesa_ref, password_hash, payload_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      newMember.id,
      newMember.fullName,
      newMember.phone,
      newMember.movement,
      newMember.deaneryId,
      newMember.parishId,
      newMember.deaneryName || '',
      newMember.parishName || '',
      newMember.localChurch || '',
      'Pending',
      batchId,
      newMember.mpesaRef || null,
      null,
      JSON.stringify(newMember),
      now
    );

    db.prepare(
      'UPDATE parish_batches SET member_count = ?, total_fee = ?, payload_json = ? WHERE id = ?'
    ).run(batch.memberCount, batch.totalFee, JSON.stringify(batch), batchId);

    db.exec('COMMIT');
    res.status(201).json({ member: newMember, batch: stripMemberSecrets(batch) });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Error adding member to batch:', err);
    res.status(500).json({ error: 'Failed to add member to batch.' });
  }
});

app.patch('/api/members/:id', (req, res) => {
  const session = extractBearer(req);
  const memberId = req.params.id;
  const row = db.prepare('SELECT payload_json, batch_id, phone FROM youth_members WHERE id = ?').get(memberId) as
    | { payload_json: string; batch_id: string | null; phone: string }
    | undefined;
  if (!row) {
    return res.status(404).json({ error: 'Member not found.' });
  }
  const existing = JSON.parse(row.payload_json) as YouthMember;
  const leaderOwns =
    session?.role === 'leader' &&
    ((session.batchId && existing.batchId === session.batchId) ||
      normalizePhone(existing.registeredByLeaderPhone || '') === normalizePhone(session.leaderPhone));

  if (!session || (session.role !== 'admin' && !leaderOwns)) {
    return res.status(401).json({ error: 'Authorization required to update member.' });
  }

  const updates = stripMemberSecrets(req.body || {});
  // Only admins may change approvalStatus
  if (session.role !== 'admin') {
    delete updates.approvalStatus;
  }

  const updated: YouthMember = { ...existing, ...updates, id: memberId };
  db.prepare(
    `UPDATE youth_members
     SET full_name = ?, phone = ?, movement = ?, deanery_id = ?, parish_id = ?, deanery_name = ?, parish_name = ?, local_church = ?, approval_status = ?, payload_json = ?
     WHERE id = ?`
  ).run(
    updated.fullName,
    updated.phone || '',
    updated.movement || 'CYO',
    updated.deaneryId || '',
    updated.parishId || '',
    updated.deaneryName || '',
    updated.parishName || '',
    updated.localChurch || updated.subParish || '',
    updated.approvalStatus || 'Confirmed',
    JSON.stringify(updated),
    memberId
  );

  res.json({ member: stripMemberSecrets(updated) });
});

app.delete('/api/members/:id', (req, res) => {
  const session = extractBearer(req);
  const memberId = req.params.id;
  const row = db.prepare('SELECT payload_json FROM youth_members WHERE id = ?').get(memberId) as
    | { payload_json: string }
    | undefined;
  if (!row) {
    return res.status(404).json({ error: 'Member not found.' });
  }
  const existing = JSON.parse(row.payload_json) as YouthMember;
  const leaderOwns =
    session?.role === 'leader' &&
    ((session.batchId && existing.batchId === session.batchId) ||
      normalizePhone(existing.registeredByLeaderPhone || '') === normalizePhone(session.leaderPhone));

  if (!session || (session.role !== 'admin' && !leaderOwns)) {
    return res.status(401).json({ error: 'Authorization required to delete member.' });
  }

  db.prepare('DELETE FROM youth_members WHERE id = ?').run(memberId);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Events, Remittances, Vocations, Welfare Routes
// ---------------------------------------------------------------------------
app.post('/api/events/:id/toggle', (req, res) => {
  const eventId = req.params.id;
  const memberId = String(req.body?.memberId || '').trim();
  if (!memberId) return res.status(400).json({ error: 'Member ID required.' });

  const row = db.prepare('SELECT payload_json FROM events WHERE id = ?').get(eventId) as { payload_json: string } | undefined;
  if (!row) return res.status(404).json({ error: 'Event not found.' });

  const evt = JSON.parse(row.payload_json) as ArchdiocesanEvent;
  const exists = evt.registeredMemberIds.includes(memberId);
  evt.registeredMemberIds = exists
    ? evt.registeredMemberIds.filter((id) => id !== memberId)
    : [...evt.registeredMemberIds, memberId];

  db.prepare('UPDATE events SET payload_json = ? WHERE id = ?').run(JSON.stringify(evt), eventId);
  res.json({ event: evt });
});

app.post('/api/events/:id/attend', (req, res) => {
  const eventId = req.params.id;
  const memberId = String(req.body?.memberId || '').trim();
  if (!memberId) return res.status(400).json({ error: 'Member ID required.' });

  const row = db.prepare('SELECT payload_json FROM events WHERE id = ?').get(eventId) as { payload_json: string } | undefined;
  if (!row) return res.status(404).json({ error: 'Event not found.' });

  const evt = JSON.parse(row.payload_json) as ArchdiocesanEvent;
  let marked = false;
  if (!evt.attendedMemberIds.includes(memberId)) {
    marked = true;
    evt.attendedMemberIds = [...evt.attendedMemberIds, memberId];
    if (!evt.registeredMemberIds.includes(memberId)) {
      evt.registeredMemberIds = [...evt.registeredMemberIds, memberId];
    }
    db.prepare('UPDATE events SET payload_json = ? WHERE id = ?').run(JSON.stringify(evt), eventId);
  }
  res.json({ marked, event: evt });
});

app.post('/api/remittances', (req, res) => {
  const data = req.body;
  if (!data || !data.parishId || !data.amount) {
    return res.status(400).json({ error: 'Parish and amount are required.' });
  }
  const id = `rem-${Date.now()}`;
  const receiptNo = `REC-ADN-2026-${Math.floor(100 + Math.random() * 900)}`;
  const newRem: FinancialRemittance = { ...data, id, receiptNo };

  db.exec('BEGIN');
  try {
    db.prepare(
      `INSERT INTO remittances (id, receipt_no, parish_id, deanery_id, amount, mpesa_ref, status, payload_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      receiptNo,
      newRem.parishId,
      newRem.deaneryId,
      Number(newRem.amount) || 0,
      newRem.mpesaRef || '',
      newRem.status || 'Pending Verification',
      JSON.stringify(newRem),
      newRem.date || new Date().toISOString().split('T')[0]
    );

    if (newRem.remittanceType === 'Annual Archdiocesan Youth Levy') {
      const pRow = db.prepare('SELECT payload_json FROM parishes WHERE id = ?').get(newRem.parishId) as { payload_json: string } | undefined;
      if (pRow) {
        const parish = JSON.parse(pRow.payload_json) as Parish;
        parish.annualLevyPaid = (parish.annualLevyPaid || 0) + (Number(newRem.amount) || 0);
        db.prepare('UPDATE parishes SET annual_levy_paid = ?, payload_json = ? WHERE id = ?').run(
          parish.annualLevyPaid,
          JSON.stringify(parish),
          parish.id
        );
      }
    }
    db.exec('COMMIT');
    res.status(201).json({ remittance: newRem });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: 'Failed to record remittance.' });
  }
});

app.post('/api/vocations', (req, res) => {
  const data = req.body;
  if (!data || !data.aspirantName) return res.status(400).json({ error: 'Aspirant name required.' });
  const id = `voc-${Date.now()}`;
  const dateRecorded = new Date().toISOString().split('T')[0];
  const newVoc: VocationAspirant = { ...data, id, dateRecorded };
  db.prepare(
    `INSERT INTO vocations (id, member_id, aspirant_name, vocation_type, stage, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, newVoc.memberId || '', newVoc.aspirantName, newVoc.vocationType, newVoc.stage, JSON.stringify(newVoc), dateRecorded);
  res.status(201).json({ vocation: newVoc });
});

app.post('/api/welfare', (req, res) => {
  const data = req.body;
  if (!data || !data.memberName) return res.status(400).json({ error: 'Member name required.' });
  const id = `welf-${Date.now()}`;
  const dateFiled = new Date().toISOString().split('T')[0];
  const newWelf: WelfareCase = { ...data, id, dateFiled };
  db.prepare(
    `INSERT INTO welfare (id, member_id, member_name, category, status, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, newWelf.memberId || '', newWelf.memberName, newWelf.category, newWelf.status, JSON.stringify(newWelf), dateFiled);
  res.status(201).json({ welfareCase: newWelf });
});

// ---------------------------------------------------------------------------
// Admin-Only Protected Routes
// ---------------------------------------------------------------------------
app.post('/api/admin/parish-batches/:id/confirm', requireAdmin, (req, res) => {
  const batchId = req.params.id;
  const adminName = String(req.body?.adminName || 'Archdiocesan Youth Chaplaincy');
  const now = new Date().toISOString().split('T')[0];

  const batchRow = db.prepare('SELECT payload_json FROM parish_batches WHERE id = ?').get(batchId) as { payload_json: string } | undefined;
  if (!batchRow) return res.status(404).json({ error: 'Batch not found.' });

  const batch = JSON.parse(batchRow.payload_json) as ParishRegistrationBatch;
  batch.approvalStatus = 'Confirmed';
  batch.paymentStatus = 'Verified';
  batch.approvedBy = adminName;
  batch.approvedAt = now;

  db.exec('BEGIN');
  try {
    db.prepare('UPDATE parish_batches SET approval_status = ?, payload_json = ? WHERE id = ?').run(
      'Confirmed',
      JSON.stringify(batch),
      batchId
    );
    const membersInBatch = db.prepare('SELECT id, payload_json FROM youth_members WHERE batch_id = ?').all(batchId) as {
      id: string;
      payload_json: string;
    }[];
    const updateMemberStmt = db.prepare('UPDATE youth_members SET approval_status = ?, payload_json = ? WHERE id = ?');
    for (const mRow of membersInBatch) {
      const m = JSON.parse(mRow.payload_json) as YouthMember;
      m.approvalStatus = 'Confirmed';
      updateMemberStmt.run('Confirmed', JSON.stringify(m), m.id);
    }
    db.exec('COMMIT');
    res.json({ ok: true, batch });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: 'Failed to confirm parish batch.' });
  }
});

app.post('/api/admin/members/:id/confirm', requireAdmin, (req, res) => {
  const memberId = req.params.id;
  const row = db.prepare('SELECT payload_json FROM youth_members WHERE id = ?').get(memberId) as { payload_json: string } | undefined;
  if (!row) return res.status(404).json({ error: 'Member not found.' });
  const m = JSON.parse(row.payload_json) as YouthMember;
  m.approvalStatus = 'Confirmed';
  db.prepare('UPDATE youth_members SET approval_status = ?, payload_json = ? WHERE id = ?').run(
    'Confirmed',
    JSON.stringify(m),
    memberId
  );
  res.json({ ok: true, member: stripMemberSecrets(m) });
});

app.post('/api/admin/challenge-teams/:id/confirm', requireAdmin, (req, res) => {
  const teamId = req.params.id;
  const adminName = String(req.body?.adminName || 'Archdiocesan Youth Chaplaincy');
  const now = new Date().toISOString().split('T')[0];

  const row = db.prepare('SELECT payload_json FROM challenge_teams WHERE id = ?').get(teamId) as { payload_json: string } | undefined;
  if (!row) return res.status(404).json({ error: 'Challenge team not found.' });

  const team = JSON.parse(row.payload_json) as ChallengeWeekTeam;
  team.paymentStatus = 'Confirmed';
  team.approvedBy = adminName;
  team.approvedAt = now;
  delete team.rejectedReason;

  db.prepare('UPDATE challenge_teams SET payment_status = ?, payload_json = ? WHERE id = ?').run(
    'Confirmed',
    JSON.stringify(team),
    teamId
  );
  res.json({ ok: true, team: stripMemberSecrets(team) });
});

app.post('/api/admin/challenge-teams/:id/reject', requireAdmin, (req, res) => {
  const teamId = req.params.id;
  const reason = String(req.body?.reason || 'M-Pesa payment could not be verified.');

  const row = db.prepare('SELECT payload_json FROM challenge_teams WHERE id = ?').get(teamId) as { payload_json: string } | undefined;
  if (!row) return res.status(404).json({ error: 'Challenge team not found.' });

  const team = JSON.parse(row.payload_json) as ChallengeWeekTeam;
  team.paymentStatus = 'Rejected';
  team.rejectedReason = reason;

  db.prepare('UPDATE challenge_teams SET payment_status = ?, payload_json = ? WHERE id = ?').run(
    'Rejected',
    JSON.stringify(team),
    teamId
  );
  res.json({ ok: true, team: stripMemberSecrets(team) });
});

app.patch('/api/admin/challenge-teams/:id', requireAdmin, (req, res) => {
  const teamId = req.params.id;
  const row = db.prepare('SELECT payload_json FROM challenge_teams WHERE id = ?').get(teamId) as { payload_json: string } | undefined;
  if (!row) return res.status(404).json({ error: 'Challenge team not found.' });

  const existing = JSON.parse(row.payload_json) as ChallengeWeekTeam;
  const updates = stripMemberSecrets(req.body || {});
  const updated: ChallengeWeekTeam = { ...existing, ...updates, id: teamId };

  db.prepare('UPDATE challenge_teams SET payment_status = ?, payload_json = ? WHERE id = ?').run(
    updated.paymentStatus || 'Pending Verification',
    JSON.stringify(updated),
    teamId
  );
  res.json({ ok: true, team: stripMemberSecrets(updated) });
});

app.delete('/api/admin/nicca/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM nicca_students WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.delete('/api/admin/career-day/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM career_registrations WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.delete('/api/admin/matrons-patrons/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM matrons_patrons WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.delete('/api/admin/secondary-youth/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM secondary_youth WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.post('/api/admin/remittances/:id/verify', requireAdmin, (req, res) => {
  const id = req.params.id;
  const verifiedBy = String(req.body?.verifiedBy || 'Archdiocesan Finance Office');
  const row = db.prepare('SELECT payload_json FROM remittances WHERE id = ?').get(id) as { payload_json: string } | undefined;
  if (!row) return res.status(404).json({ error: 'Remittance not found.' });
  const r = JSON.parse(row.payload_json) as FinancialRemittance;
  r.status = 'Verified';
  r.verifiedBy = verifiedBy;
  db.prepare('UPDATE remittances SET status = ?, payload_json = ? WHERE id = ?').run('Verified', JSON.stringify(r), id);
  res.json({ ok: true, remittance: r });
});

app.patch('/api/admin/vocations/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const row = db.prepare('SELECT payload_json FROM vocations WHERE id = ?').get(id) as { payload_json: string } | undefined;
  if (!row) return res.status(404).json({ error: 'Vocation record not found.' });
  const v = JSON.parse(row.payload_json) as VocationAspirant;
  if (req.body?.stage) v.stage = req.body.stage;
  db.prepare('UPDATE vocations SET stage = ?, payload_json = ? WHERE id = ?').run(v.stage, JSON.stringify(v), id);
  res.json({ ok: true, vocation: v });
});

app.patch('/api/admin/welfare/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const row = db.prepare('SELECT payload_json FROM welfare WHERE id = ?').get(id) as { payload_json: string } | undefined;
  if (!row) return res.status(404).json({ error: 'Welfare case not found.' });
  const w = JSON.parse(row.payload_json) as WelfareCase;
  if (req.body?.status) w.status = req.body.status;
  if (req.body?.amountDisbursed !== undefined) w.amountDisbursed = Number(req.body.amountDisbursed);
  db.prepare('UPDATE welfare SET status = ?, payload_json = ? WHERE id = ?').run(w.status, JSON.stringify(w), id);
  res.json({ ok: true, welfareCase: w });
});

app.post('/api/admin/parishes', requireAdmin, (req, res) => {
  const data = req.body;
  if (!data || !data.name || !data.deaneryId) return res.status(400).json({ error: 'Parish name and deanery required.' });
  const id = `parish-${Date.now()}`;
  const parish: Parish = { ...data, id };
  db.prepare('INSERT INTO parishes (id, name, deanery_id, annual_levy_paid, payload_json) VALUES (?, ?, ?, ?, ?)').run(
    id,
    parish.name,
    parish.deaneryId,
    parish.annualLevyPaid || 0,
    JSON.stringify(parish)
  );
  res.status(201).json({ parish });
});

app.patch('/api/admin/parishes/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const row = db.prepare('SELECT payload_json FROM parishes WHERE id = ?').get(id) as { payload_json: string } | undefined;
  if (!row) return res.status(404).json({ error: 'Parish not found.' });
  const existing = JSON.parse(row.payload_json) as Parish;
  const updated: Parish = { ...existing, ...(req.body || {}), id };
  db.prepare('UPDATE parishes SET name = ?, deanery_id = ?, annual_levy_paid = ?, payload_json = ? WHERE id = ?').run(
    updated.name,
    updated.deaneryId,
    updated.annualLevyPaid || 0,
    JSON.stringify(updated),
    id
  );
  res.json({ parish: updated });
});

app.post('/api/admin/events', requireAdmin, (req, res) => {
  const data = req.body;
  if (!data || !data.title) return res.status(400).json({ error: 'Event title required.' });
  const id = `evt-${Date.now()}`;
  const evt: ArchdiocesanEvent = {
    ...data,
    id,
    registeredMemberIds: [],
    attendedMemberIds: [],
  };
  db.prepare('INSERT INTO events (id, title, scope, start_date, status, payload_json) VALUES (?, ?, ?, ?, ?, ?)').run(
    id,
    evt.title,
    evt.scope || 'Archdiocesan',
    evt.startDate || '',
    evt.status || 'Upcoming',
    JSON.stringify(evt)
  );
  res.status(201).json({ event: evt });
});

app.patch('/api/admin/events/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const row = db.prepare('SELECT payload_json FROM events WHERE id = ?').get(id) as { payload_json: string } | undefined;
  if (!row) return res.status(404).json({ error: 'Event not found.' });
  const existing = JSON.parse(row.payload_json) as ArchdiocesanEvent;
  const updated: ArchdiocesanEvent = { ...existing, ...(req.body || {}), id };
  db.prepare('UPDATE events SET title = ?, scope = ?, start_date = ?, status = ?, payload_json = ? WHERE id = ?').run(
    updated.title,
    updated.scope,
    updated.startDate,
    updated.status,
    JSON.stringify(updated),
    id
  );
  res.json({ event: updated });
});

app.post('/api/admin/reset', requireAdmin, (_req, res) => {
  db.exec(`
    DELETE FROM youth_members;
    DELETE FROM parish_batches;
    DELETE FROM parish_leaders;
    DELETE FROM nicca_students;
    DELETE FROM challenge_teams;
    DELETE FROM career_registrations;
    DELETE FROM matrons_patrons;
    DELETE FROM secondary_youth;
    DELETE FROM events;
    DELETE FROM remittances;
    DELETE FROM vocations;
    DELETE FROM welfare;
    DELETE FROM deaneries;
    DELETE FROM parishes;
  `);
  seedHierarchyIfEmpty();
  res.json({ ok: true, state: getAllState() });
});

app.post('/api/admin/import', requireAdmin, (req, res) => {
  const parsed = req.body;
  if (!parsed || typeof parsed !== 'object') {
    return res.status(400).json({ error: 'Invalid backup JSON payload.' });
  }
  db.exec('BEGIN');
  try {
    if (Array.isArray(parsed.members)) {
      db.exec('DELETE FROM youth_members');
      const stmt = db.prepare(
        `INSERT INTO youth_members (id, full_name, phone, movement, deanery_id, parish_id, deanery_name, parish_name, local_church, approval_status, batch_id, mpesa_ref, password_hash, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const m of parsed.members as YouthMember[]) {
        const clean = stripMemberSecrets(m);
        const passHash = m.password ? hashPassword(m.password) : null;
        stmt.run(
          clean.id,
          clean.fullName,
          clean.phone || '',
          clean.movement || 'CYO',
          clean.deaneryId || '',
          clean.parishId || '',
          clean.deaneryName || '',
          clean.parishName || '',
          clean.localChurch || clean.subParish || '',
          clean.approvalStatus || 'Confirmed',
          clean.batchId || null,
          clean.mpesaRef || null,
          passHash,
          JSON.stringify(clean),
          clean.joinedDate || new Date().toISOString().split('T')[0]
        );
      }
    }
    if (Array.isArray(parsed.niccaStudents)) {
      db.exec('DELETE FROM nicca_students');
      const stmt = db.prepare(
        `INSERT INTO nicca_students (id, full_name, institution, phone, mpesa_code, amount_paid, payment_status, password_hash, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const s of parsed.niccaStudents as NiccaStudent[]) {
        const clean = stripMemberSecrets(s);
        const passHash = s.password ? hashPassword(s.password) : null;
        stmt.run(
          clean.id,
          clean.fullName,
          clean.institution,
          clean.phone,
          clean.mpesaCode || null,
          clean.amountPaid ?? 100,
          clean.paymentStatus || 'Paid',
          passHash,
          JSON.stringify(clean),
          clean.registrationDate || new Date().toISOString().split('T')[0]
        );
      }
    }
    if (Array.isArray(parsed.challengeTeams)) {
      db.exec('DELETE FROM challenge_teams');
      const stmt = db.prepare(
        `INSERT INTO challenge_teams (id, team_name, registration_type, deanery_name, parish_name, local_church, team_leader_name, team_leader_phone, members_count, total_fee, mpesa_code, payment_status, username, password_hash, login_pin_hash, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const t of parsed.challengeTeams as ChallengeWeekTeam[]) {
        const clean = stripMemberSecrets(t);
        const passHash = t.password ? hashPassword(t.password) : null;
        const pinHash = t.loginPin ? hashPassword(t.loginPin) : null;
        stmt.run(
          clean.id,
          clean.teamName,
          clean.registrationType || 'Individual',
          clean.deaneryName,
          clean.parishName,
          clean.localChurch || '',
          clean.teamLeaderName,
          clean.teamLeaderPhone,
          clean.membersCount || 1,
          clean.totalFee || 1000,
          clean.mpesaCode || null,
          clean.paymentStatus || 'Pending Verification',
          clean.username || null,
          passHash,
          pinHash,
          JSON.stringify(clean),
          clean.registrationDate || new Date().toISOString().split('T')[0]
        );
      }
    }
    if (Array.isArray(parsed.careerRegistrations)) {
      db.exec('DELETE FROM career_registrations');
      const stmt = db.prepare(
        `INSERT INTO career_registrations (id, full_name, phone, username, school, grade_attained, desired_course, home_area_parish, password_hash, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const c of parsed.careerRegistrations as CareerDayRegistration[]) {
        const clean = stripMemberSecrets(c);
        const passHash = c.password ? hashPassword(c.password) : null;
        stmt.run(
          clean.id,
          clean.fullName,
          clean.phone,
          clean.username || null,
          clean.school || null,
          clean.gradeAttained || null,
          clean.desiredCourse || null,
          clean.homeAreaParish || null,
          passHash,
          JSON.stringify(clean),
          clean.registeredDate || new Date().toISOString().split('T')[0]
        );
      }
    }
    if (Array.isArray(parsed.matronsPatrons)) {
      db.exec('DELETE FROM matrons_patrons');
      const stmt = db.prepare(
        `INSERT INTO matrons_patrons (id, full_name, role, deanery_name, parish_name, local_church, phone, amount_paid, mpesa_code, password_hash, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const a of parsed.matronsPatrons as MatronPatron[]) {
        const clean = stripMemberSecrets(a);
        const passHash = a.password ? hashPassword(a.password) : null;
        stmt.run(
          clean.id,
          clean.fullName,
          clean.role,
          clean.deaneryName || null,
          clean.parishName || null,
          clean.localChurch || null,
          clean.phone,
          clean.amountPaid ?? 100,
          clean.mpesaCode || null,
          passHash,
          JSON.stringify(clean),
          clean.commissionedDate || new Date().toISOString().split('T')[0]
        );
      }
    }
    if (Array.isArray(parsed.secondaryYouth)) {
      db.exec('DELETE FROM secondary_youth');
      const stmt = db.prepare(
        `INSERT INTO secondary_youth (id, full_name, school_name, form_level, phone_or_parent_phone, home_parish, home_deanery, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const s of parsed.secondaryYouth as SecondarySchoolStudent[]) {
        stmt.run(
          s.id,
          s.fullName,
          s.schoolName,
          s.formLevel,
          s.phoneOrParentPhone,
          s.homeParish,
          s.homeDeanery,
          JSON.stringify(s),
          s.registrationDate || new Date().toISOString().split('T')[0]
        );
      }
    }
    if (Array.isArray(parsed.parishBatches)) {
      db.exec('DELETE FROM parish_batches');
      const stmt = db.prepare(
        `INSERT INTO parish_batches (id, leader_phone, leader_name, deanery_name, parish_name, local_church, member_count, total_fee, mpesa_code, approval_status, password_hash, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const b of parsed.parishBatches as ParishRegistrationBatch[]) {
        const clean = stripMemberSecrets(b);
        const passHash = b.password ? hashPassword(b.password) : null;
        stmt.run(
          clean.id,
          clean.leaderPhone,
          clean.leaderName,
          clean.deaneryName,
          clean.parishName,
          clean.localChurch,
          clean.memberCount,
          clean.totalFee,
          clean.mpesaCode,
          clean.approvalStatus || 'Pending',
          passHash,
          JSON.stringify(clean),
          clean.submittedAt || new Date().toISOString().split('T')[0]
        );
      }
    }
    db.exec('COMMIT');
    res.json({ ok: true, state: getAllState() });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Import failed:', err);
    res.status(500).json({ error: 'Database import failed.' });
  }
});

// Return JSON 404 for unknown API paths before SPA fallback
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ADN Youth Portal server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
