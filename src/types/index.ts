export type YouthMovement = 'Junior Youth' | 'CYO' | 'YCA';

export type Sacraments = {
  baptism: boolean;
  baptismCertNo?: string;
  firstCommunion: boolean;
  confirmation: boolean;
  confirmationCardNo?: string;
  matrimony: boolean;
};

export type LeadershipRole = 
  | 'Member' 
  | 'Parish Chairperson' 
  | 'Parish Vice Chair'
  | 'Parish Secretary' 
  | 'Parish Treasurer' 
  | 'Liturgical Coordinator'
  | 'Sports & Talents Rep'
  | 'Deanery Chairperson' 
  | 'Archdiocesan Executive' 
  | 'Youth Animator / Patron';

export type YouthStatus = 'Active' | 'Relocated' | 'Alumni/Graduated' | 'Inactive';
export type RegistrationApprovalStatus = 'Pending' | 'Confirmed' | 'Rejected';

export interface YouthMember {
  id: string; // unique code e.g. ADN-YTH-2026-0101
  fullName: string;
  gender: 'Male' | 'Female';
  dob: string;
  age: number;
  phone: string;
  email: string;
  deaneryId: string;
  parishId: string;
  subParish: string; // Outstation / Local church
  movement: YouthMovement;
  occupation: string;
  institution?: string;
  sacraments: Sacraments;
  ministryGuild: string;
  leadershipRole: LeadershipRole;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  joinedDate: string;
  status: YouthStatus;
  bloodGroup?: string;
  skills: string[];
  avatarUrl?: string;

  // Fields for Parish Registration Workflow
  approvalStatus?: RegistrationApprovalStatus; // 'Pending' until admin confirms & accepts
  registeredByLeaderPhone?: string;
  registeredByLeaderName?: string;
  localChurch?: string;
  mpesaRef?: string;
  registrationFee?: number; // 100 KES
  batchId?: string;
}

export interface ParishRegistrationBatch {
  id: string;
  leaderPhone: string;
  leaderName: string;
  password?: string;
  deaneryId: string;
  deaneryName: string;
  parishId: string;
  parishName: string;
  localChurch: string;
  memberCount: number; // up to 200 members
  feePerMember: number; // 100 KES
  totalFee: number;
  mpesaCode: string;
  mpesaPhone: string;
  paymentStatus: 'Pending' | 'Verified';
  approvalStatus: RegistrationApprovalStatus; // 'Pending' until admin accepts
  approvedBy?: string;
  approvedAt?: string;
  submittedAt: string;
  memberIds: string[];
}

export interface ParishLeaderAccount {
  leaderPhone: string;
  leaderName: string;
  password: string;
  deaneryName: string;
  parishName: string;
  localChurch: string;
  batchId?: string;
}


export interface Parish {
  id: string;
  name: string;
  deaneryId: string;
  patronSaint: string;
  priestInCharge: string;
  youthChaplain: string;
  chairpersonName: string;
  chairpersonPhone: string;
  outstationsCount: number;
  outstations: string[];
  registeredYouthCount?: number;
  annualLevyTarget: number;
  annualLevyPaid: number;
}

export interface Deanery {
  id: string;
  name: string;
  deanName: string;
  deaneryYouthChaplain: string;
  deaneryChairperson: string;
  deaneryChairpersonPhone: string;
  headquarters: string;
  parishIds: string[];
  annualTarget: number;
}

export type EventScope = 'Archdiocesan' | 'Deanery' | 'Parish';
export type EventStatus = 'Upcoming' | 'Ongoing' | 'Completed' | 'Draft';

export interface ArchdiocesanEvent {
  id: string;
  title: string;
  theme: string;
  scriptureReference: string;
  scope: EventScope;
  deaneryId?: string;
  parishId?: string;
  venue: string;
  startDate: string;
  endDate: string;
  fee: number;
  capacity: number;
  coordinator: string;
  coordinatorPhone: string;
  targetMovements: YouthMovement[];
  registeredMemberIds: string[];
  attendedMemberIds: string[];
  status: EventStatus;
  bannerDescription: string;
}

// NICCA (Nyeri Inter-Colleges and Catholic Association) Model
export interface NiccaStudent {
  id: string;
  fullName: string;
  institution: string; // e.g. DeKUT, Karatina University, KMTC Nyeri, Kagumo TTC, Nyeri Poly
  phone: string;
  course: string;
  password?: string;
  mpesaCode?: string;
  amountPaid?: number; // 100 bob
  paymentStatus?: 'Paid' | 'Pending';
  gender?: 'Male' | 'Female';
  yearOfStudy?: string; // Year 1, Year 2, Year 3, Year 4, Postgraduate
  email?: string;
  homeParish?: string;
  homeDeanery?: string;
  campusMinistryRole?: string; // e.g. Chairperson, Choir, Liturgy, Member
  registrationDate: string;
}

// Challenge Week Model
export interface ChallengeWeekTeam {
  id: string;
  teamName: string;
  registrationType?: 'Individual' | 'Group';
  memberNames?: string[];
  parishId?: string;
  deaneryId?: string;
  deaneryName: string;
  parishName: string;
  teamLeaderName: string;
  teamLeaderPhone: string;
  membersCount: number; // 1 upto 200 persons
  spiritualTasksCompleted: number;
  communityServiceHours: number;
  sportsPoints: number;
  feePerPerson: number; // 1000 KES
  totalFee: number;
  paymentOption: 'Mpesa' | 'Cash';
  mpesaCode?: string;
  paymentStatus: 'Confirmed' | 'Pending Verification';
  loginPin: string;
  username?: string;
  password?: string;
  status: 'Registered' | 'Active' | 'Finalist';
  registrationDate: string;
}

// Career Day Model
export interface CareerDayRegistration {
  id: string;
  fullName: string;
  gender: 'Male' | 'Female';
  phone: string;
  email: string;
  parishId: string;
  careerField: string; // IT, Healthcare, Agribusiness, Law, Education, Finance, Engineering
  type: 'Mentor (Professional)' | 'Mentee (Student/Seeker)';
  currentOrganization: string;
  skillsOrGoals: string;
  registeredDate: string;
}

// Matrons and Patrons (Animators) Model
export interface MatronPatron {
  id: string;
  fullName: string;
  gender: 'Male' | 'Female';
  role: 'Patron' | 'Matron' | 'Youth Animator' | 'Spiritual Director';
  parishId: string;
  deaneryId: string;
  phone: string;
  email: string;
  profession: string;
  yearsOfService: number;
  commissionedDate: string;
  safeguardingCertified: boolean;
  notes?: string;
}

// Youth in Secondary School Model
export interface SecondarySchoolStudent {
  id: string;
  fullName: string;
  gender: 'Male' | 'Female';
  schoolName: string; // Bishop Gatimu Ngandu, Nyeri High, Kagumo High, St. Mary's Boys
  formLevel: 'Form 1' | 'Form 2' | 'Form 3' | 'Form 4';
  phoneOrParentPhone: string;
  parentName: string;
  homeParish: string;
  homeDeanery: string;
  ycsRole: string;
  registrationDate: string;
}

export type RemittanceType = 
  | 'Annual Archdiocesan Youth Levy' 
  | 'Archdiocesan Youth Day (AYD) Rally' 
  | 'Deanery Sports & Talents Tournament' 
  | 'Lenten Youth Charity Kitty'
  | 'Vocations Drive Offering';

export interface FinancialRemittance {
  id: string;
  receiptNo: string;
  parishId: string;
  deaneryId: string;
  remittanceType: RemittanceType;
  amount: number;
  mpesaRef: string;
  paidBy: string;
  paidByPhone: string;
  date: string;
  status: 'Verified' | 'Pending Verification';
  verifiedBy?: string;
  notes?: string;
}

export interface VocationAspirant {
  id: string;
  memberId: string;
  aspirantName: string;
  gender: 'Male' | 'Female';
  parishId: string;
  deaneryId: string;
  vocationType: string;
  targetOrder?: string;
  stage: string;
  spiritualDirector: string;
  contactPhone: string;
  dateRecorded: string;
  notes: string;
}

export interface WelfareCase {
  id: string;
  memberId: string;
  memberName: string;
  parishId: string;
  category: string;
  description: string;
  urgency: 'High' | 'Medium' | 'Routine';
  status: 'Open' | 'Disbursed' | 'Resolved';
  amountRequired?: number;
  amountDisbursed?: number;
  dateFiled: string;
}

export type UserRole = 
  | 'Archdiocesan Chaplaincy' 
  | 'Deanery Youth Leader' 
  | 'Parish Youth Leader' 
  | 'Youth Member';
