import React, { useState, useMemo } from 'react';
import { useYouth } from '../context/YouthContext';
import { ARCHDIOCESE_DEANERIES_AND_PARISHES } from '../data/archdioceseHierarchy';
import { OfficialLogo } from './OfficialLogo';
import { YouthMember } from '../types';
import confetti from 'canvas-confetti';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Building2, 
  CreditCard, 
  FileText, 
  Download, 
  Printer, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  ArrowLeft, 
  Phone, 
  AlertCircle, 
  X, 
  Layers, 
  ChevronRight,
  Church,
  GraduationCap,
  Trophy,
  Briefcase,
  School,
  LogOut,
  Mail,
  UserCheck,
  Award,
  Edit3,
  Trash2,
  QrCode
} from 'lucide-react';

interface ParishAdminDashboardProps {
  onBackToPortal: () => void;
  onViewMemberCard?: (member: any) => void;
}

export type AdminModuleTab = 
  | 'parish-youth' 
  | 'junior-youth' 
  | 'nicca' 
  | 'challenge-week' 
  | 'career-day' 
  | 'matrons-patrons' 
  | 'secondary-youth';

export const ParishAdminDashboard: React.FC<ParishAdminDashboardProps> = ({
  onBackToPortal,
  onViewMemberCard,
}) => {
  const { 
    members, 
    parishes, 
    deaneries, 
    parishBatches, 
    niccaStudents,
    challengeTeams,
    careerRegistrations,
    matronsPatrons,
    secondaryYouth,
    confirmParishBatch, 
    confirmIndividualMember,
    updateMember,
    deleteMember
  } = useYouth();

  // Active module selected in sidebar
  const [activeModule, setActiveModule] = useState<AdminModuleTab>('parish-youth');

  // Common filters
  const [selectedDeaneryFilter, setSelectedDeaneryFilter] = useState('ALL');
  const [parishSearchTerm, setParishSearchTerm] = useState('');
  const [moduleSearchTerm, setModuleSearchTerm] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTab, setReportTab] = useState<'total-details' | 'per-parish' | 'summary'>('total-details');
  const [reportParishFilter, setReportParishFilter] = useState('ALL');
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // PARISH DRILLDOWN STATE (Requested by User)
  // "ONCE YOU CLICK ON THE PARTICULER PARISH IT SHOULD DISPLAY THE LIST OF THE 
  // REGISTERED PERSONS , WITH DEANERY, PARISH , LOCAL CHURCH , PHONE NUMBER USED,
  // ADMIN CAN ALSO EDIT, DELETE A YOUTH"
  // --------------------------------------------------------------------------
  const [selectedParishDetail, setSelectedParishDetail] = useState<{
    parishName: string;
    deaneryName: string;
  } | null>(null);

  const [parishMemberSearch, setParishMemberSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Confirmed' | 'Pending'>('ALL');

  // Modals for Edit & Delete Youth
  const [editingMember, setEditingMember] = useState<YouthMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<YouthMember | null>(null);

  // --------------------------------------------------------------------------
  // COUNTS & METRICS PER MODULE
  // --------------------------------------------------------------------------
  const parishYouthList = useMemo(() => members.filter(m => m.movement !== 'Junior Youth'), [members]);
  const juniorYouthList = useMemo(() => members.filter(m => m.movement === 'Junior Youth'), [members]);

  const totalRegisteredYouths = members.length;
  const totalPendingYouths = members.filter(m => m.approvalStatus === 'Pending').length;
  const totalConfirmedYouths = members.filter(m => m.approvalStatus !== 'Pending').length;
  const totalRevenue = totalRegisteredYouths * 100;

  // Pending batches list
  const pendingBatches = useMemo(() => {
    return parishBatches.filter(b => b.approvalStatus === 'Pending');
  }, [parishBatches]);

  // Sidebar Groups Configuration
  const groupsSidebar = [
    {
      id: 'parish-youth' as AdminModuleTab,
      title: 'Youth in Parishes',
      sub: 'Registry, Approvals & Cards',
      icon: Church,
      count: parishYouthList.length,
      pendingCount: pendingBatches.length,
      accent: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      activeBg: 'bg-emerald-600 text-white',
    },
    {
      id: 'junior-youth' as AdminModuleTab,
      title: 'Junior Youth',
      sub: 'Altar Servers & Candidates',
      icon: Sparkles,
      count: juniorYouthList.length || 120,
      accent: 'text-sky-700 bg-sky-50 border-sky-200',
      activeBg: 'bg-sky-600 text-white',
    },
    {
      id: 'nicca' as AdminModuleTab,
      title: 'NICCA',
      sub: 'Colleges & Universities',
      icon: GraduationCap,
      count: niccaStudents.length,
      accent: 'text-red-700 bg-red-50 border-red-200',
      activeBg: 'bg-red-600 text-white',
    },
    {
      id: 'challenge-week' as AdminModuleTab,
      title: 'Challenge Week',
      sub: 'Teams, Passes & Scores',
      icon: Trophy,
      count: challengeTeams.length,
      accent: 'text-amber-700 bg-amber-50 border-amber-200',
      activeBg: 'bg-slate-900 text-amber-400',
    },
    {
      id: 'career-day' as AdminModuleTab,
      title: 'CAREER DAY',
      sub: 'Mentors & Professional Network',
      icon: Briefcase,
      count: careerRegistrations.length,
      accent: 'text-blue-700 bg-blue-50 border-blue-200',
      activeBg: 'bg-blue-600 text-white',
    },
    {
      id: 'matrons-patrons' as AdminModuleTab,
      title: 'Matrons and Patrons',
      sub: 'Parish Youth Animators',
      icon: ShieldCheck,
      count: matronsPatrons.length,
      accent: 'text-rose-700 bg-rose-50 border-rose-200',
      activeBg: 'bg-rose-600 text-white',
    },
    {
      id: 'secondary-youth' as AdminModuleTab,
      title: 'Youth in Secondary School',
      sub: 'YCS Secondary Students',
      icon: School,
      count: secondaryYouth.length,
      accent: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      activeBg: 'bg-indigo-600 text-white',
    },
  ];

  // Filtered deanery list
  const activeDeaneryParishes = useMemo(() => {
    return ARCHDIOCESE_DEANERIES_AND_PARISHES.filter(d => 
      selectedDeaneryFilter === 'ALL' || d.deanery.toLowerCase() === selectedDeaneryFilter.toLowerCase()
    );
  }, [selectedDeaneryFilter]);

  // Aggregate statistics per parish for Youth in Parishes
  const parishStats = useMemo(() => {
    const list: Array<{
      deaneryName: string;
      parishName: string;
      totalCount: number;
      pendingCount: number;
      confirmedCount: number;
      totalFees: number;
    }> = [];

    activeDeaneryParishes.forEach(d => {
      d.parishes.forEach(pName => {
        const pMembers = members.filter(m => {
          const mParish = parishes.find(p => p.id === m.parishId);
          const matchParish = (mParish?.name || '').toLowerCase() === pName.toLowerCase() ||
                              (m.parishId || '').toLowerCase().includes(pName.toLowerCase()) ||
                              (m.localChurch || '').toLowerCase().includes(pName.toLowerCase());
          
          const mDeanery = deaneries.find(dean => dean.id === m.deaneryId);
          const matchDeanery = selectedDeaneryFilter === 'ALL' ||
                               (mDeanery?.name || '').toLowerCase().includes(d.deanery.toLowerCase());

          return matchParish && matchDeanery;
        });

        const total = pMembers.length;
        const pending = pMembers.filter(m => m.approvalStatus === 'Pending').length;
        const confirmed = total - pending;

        if (!parishSearchTerm || pName.toLowerCase().includes(parishSearchTerm.toLowerCase()) || d.deanery.toLowerCase().includes(parishSearchTerm.toLowerCase())) {
          list.push({
            deaneryName: d.deanery,
            parishName: pName,
            totalCount: total,
            pendingCount: pending,
            confirmedCount: confirmed,
            totalFees: total * 100,
          });
        }
      });
    });

    return list;
  }, [activeDeaneryParishes, members, parishes, deaneries, selectedDeaneryFilter, parishSearchTerm]);

  // Members belonging to the selected parish
  const selectedParishYouths = useMemo(() => {
    if (!selectedParishDetail) return [];
    const pName = selectedParishDetail.parishName.toLowerCase();
    const dName = selectedParishDetail.deaneryName.toLowerCase();

    return members.filter((m) => {
      if (m.movement === 'Junior Youth') return false;

      const mParish = parishes.find((p) => p.id === m.parishId);
      const mDeanery = deaneries.find((d) => d.id === m.deaneryId);
      const batch = parishBatches.find((b) => b.id === m.batchId);

      const matchParish =
        (mParish?.name || '').toLowerCase() === pName ||
        (m.parishId || '').toLowerCase().includes(pName) ||
        (m.localChurch || '').toLowerCase().includes(pName) ||
        (m.subParish || '').toLowerCase().includes(pName) ||
        (batch && batch.parishName.toLowerCase() === pName);

      const matchDeanery =
        !m.deaneryId ||
        (mDeanery?.name || '').toLowerCase().includes(dName) ||
        (m.deaneryId || '').toLowerCase().includes(dName) ||
        (batch && batch.deaneryName.toLowerCase() === dName);

      return matchParish && matchDeanery;
    });
  }, [members, parishes, deaneries, parishBatches, selectedParishDetail]);

  // Filtered members by search and status in drilldown
  const filteredParishYouths = useMemo(() => {
    return selectedParishYouths.filter((m) => {
      const q = parishMemberSearch.toLowerCase();
      const matchesSearch = 
        !q ||
        m.fullName.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q)) ||
        (m.registeredByLeaderPhone && m.registeredByLeaderPhone.includes(q)) ||
        (m.localChurch && m.localChurch.toLowerCase().includes(q)) ||
        (m.subParish && m.subParish.toLowerCase().includes(q));

      const isPending = m.approvalStatus === 'Pending';
      const matchesStatus = 
        statusFilter === 'ALL' ||
        (statusFilter === 'Pending' && isPending) ||
        (statusFilter === 'Confirmed' && !isPending);

      return matchesSearch && matchesStatus;
    });
  }, [selectedParishYouths, parishMemberSearch, statusFilter]);

  // Batch Approval Handlers
  const handleConfirmBatch = (batchId: string, parishName: string, count: number) => {
    confirmParishBatch(batchId, 'Archdiocesan Youth Chaplaincy');
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });
    setSuccessToast(`Successfully approved and accepted ${count} youth members from ${parishName}!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleConfirmAllPending = () => {
    pendingBatches.forEach(b => {
      confirmParishBatch(b.id, 'Archdiocesan Youth Chaplaincy');
    });
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
    setSuccessToast(`All pending youth registrations across the Archdiocese have been confirmed and accepted!`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  // Save edited youth member
  const handleSaveEditMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    updateMember(editingMember.id, {
      fullName: editingMember.fullName.trim(),
      phone: editingMember.phone.trim(),
      registeredByLeaderPhone: editingMember.registeredByLeaderPhone?.trim() || editingMember.phone.trim(),
      localChurch: editingMember.localChurch?.trim(),
      subParish: editingMember.localChurch?.trim(),
      age: Number(editingMember.age) || 20,
      gender: editingMember.gender,
      approvalStatus: editingMember.approvalStatus,
    });

    setSuccessToast(`Updated details for ${editingMember.fullName} successfully!`);
    setEditingMember(null);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Delete youth member
  const handleConfirmDelete = () => {
    if (!memberToDelete) return;
    deleteMember(memberToDelete.id);
    setSuccessToast(`Youth member ${memberToDelete.fullName} (${memberToDelete.id}) was deleted from the registry.`);
    setMemberToDelete(null);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // --------------------------------------------------------------------------
  // REPORT DATA COMPUTATIONS (Requirement: Total Registered Youths with details 
  // & List of registered youths per parish with details)
  // --------------------------------------------------------------------------
  const allRegisteredYouthsWithDetails = useMemo(() => {
    return members.map(m => {
      const mParish = parishes.find((p) => p.id === m.parishId);
      const mDeanery = deaneries.find((d) => d.id === m.deaneryId);
      const batch = parishBatches.find((b) => b.id === m.batchId);

      const parishName = mParish?.name || batch?.parishName || m.parishId || 'Parish Center';
      const deaneryName = mDeanery?.name || batch?.deaneryName || 'Nyeri Central';
      const localChurch = m.localChurch || m.subParish || 'Parish Center';
      const phoneUsed = m.phone || m.registeredByLeaderPhone || 'N/A';

      return {
        ...m,
        parishName,
        deaneryName,
        localChurch,
        phoneUsed
      };
    });
  }, [members, parishes, deaneries, parishBatches]);

  // Grouped per parish with full youth details
  const youthsGroupedByParish = useMemo(() => {
    const map: Record<string, {
      parishName: string;
      deaneryName: string;
      youths: typeof allRegisteredYouthsWithDetails;
    }> = {};

    allRegisteredYouthsWithDetails.forEach(member => {
      if (!map[member.parishName]) {
        map[member.parishName] = {
          parishName: member.parishName,
          deaneryName: member.deaneryName,
          youths: []
        };
      }
      map[member.parishName].youths.push(member);
    });

    return Object.values(map).sort((a, b) => a.parishName.localeCompare(b.parishName));
  }, [allRegisteredYouthsWithDetails]);

  // Export Total Registered Youths with Details (CSV)
  const handleExportAllYouthsDetailsCsv = () => {
    const headers = [
      'Unique Code',
      'Youth Full Name',
      'Deanery',
      'Parish',
      'Local Church',
      'Phone Number Used',
      'Age',
      'Gender',
      'Approval Status'
    ];

    const rows = allRegisteredYouthsWithDetails.map(m => [
      `"${m.id}"`,
      `"${m.fullName.replace(/"/g, '""')}"`,
      `"${m.deaneryName.replace(/"/g, '""')}"`,
      `"${m.parishName.replace(/"/g, '""')}"`,
      `"${m.localChurch.replace(/"/g, '""')}"`,
      `"${m.phoneUsed}"`,
      m.age || 20,
      `"${m.gender || 'N/A'}"`,
      `"${m.approvalStatus || 'Confirmed'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Archdiocese_Nyeri_Total_Registered_Youths_Details_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Registered Youths Per Parish with Details (CSV)
  const handleExportPerParishYouthsCsv = () => {
    const headers = [
      'Parish',
      'Deanery',
      'Unique Code',
      'Youth Full Name',
      'Local Church',
      'Phone Number Used',
      'Status'
    ];

    const rows: string[][] = [];
    youthsGroupedByParish.forEach(group => {
      group.youths.forEach(m => {
        rows.push([
          `"${group.parishName.replace(/"/g, '""')}"`,
          `"${group.deaneryName.replace(/"/g, '""')}"`,
          `"${m.id}"`,
          `"${m.fullName.replace(/"/g, '""')}"`,
          `"${m.localChurch.replace(/"/g, '""')}"`,
          `"${m.phoneUsed}"`,
          `"${m.approvalStatus || 'Confirmed'}"`
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Archdiocese_Nyeri_Youths_Per_Parish_Details_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Parish Summary Metrics (CSV)
  const handleExportSummaryCsv = () => {
    const headers = [
      'Deanery',
      'Parish',
      'Total Registered Youths',
      'Pending Confirmation',
      'Confirmed Youths',
      'Registration Fees (KES 100/youth)',
    ];

    const rows = parishStats.map(stat => [
      `"${stat.deaneryName}"`,
      `"${stat.parishName}"`,
      stat.totalCount,
      stat.pendingCount,
      stat.confirmedCount,
      stat.totalFees,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Archdiocese_Nyeri_Parish_Summary_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button 
            onClick={() => setSuccessToast(null)} 
            className="text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBackToPortal}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit Admin & Back to Portal</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-red-600 to-rose-700 text-white rounded-xl shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Archdiocesan Admin Dashboard
                </h1>
                <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-mono font-bold rounded">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Central Archdiocese of Nyeri Youth Directorate · Command & Management Portal
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Generate Official Report</span>
          </button>

          {pendingBatches.length > 0 && activeModule === 'parish-youth' && (
            <button
              onClick={handleConfirmAllPending}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Accept All ({pendingBatches.length} Batches)</span>
            </button>
          )}

          <button
            onClick={onBackToPortal}
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-700 bg-slate-100 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* PROFESSIONAL ADMIN SPLIT LAYOUT                                     */}
      {/* One side: List of groups                                            */}
      {/* Other side: Specific module data, registries, statistics, controls  */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================================================================= */}
        {/* ONE SIDE: LIST OF OUR GROUPS (ADMIN NAVIGATION SIDEBAR)           */}
        {/* ================================================================= */}
        <aside className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  Select Ministry Group
                </h2>
                <p className="text-xs text-slate-800 font-semibold mt-0.5">
                  Click to inspect module data
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                7 Groups
              </span>
            </div>

            {/* List of Groups */}
            <div className="space-y-2">
              {groupsSidebar.map((group) => {
                const Icon = group.icon;
                const isSelected = activeModule === group.id;

                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      setActiveModule(group.id);
                      setModuleSearchTerm('');
                      setSelectedParishDetail(null); // Reset drilldown when switching group
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected 
                        ? `${group.activeBg} border-transparent shadow-md ring-2 ring-slate-900/10` 
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {group.title}
                          </span>
                        </div>
                        <p className={`text-[11px] truncate ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                          {group.sub}
                        </p>
                      </div>
                    </div>

                    {/* Counts & Alerts */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {group.pendingCount !== undefined && group.pendingCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950">
                          {group.pendingCount} pending
                        </span>
                      )}
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        {group.count}
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Summary Footnote */}
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-mono space-y-1">
              <div>Total Diocesan Registry: <strong className="text-slate-800">{totalRegisteredYouths} Youths</strong></div>
              <div>Deaneries Covered: <strong className="text-slate-800">8 Deaneries</strong></div>
              <div>Official Rate: <strong className="text-slate-800">KSh 100/member</strong></div>
            </div>

          </div>
        </aside>

        {/* ================================================================= */}
        {/* OTHER SIDE: DATA OF THE SPECIFIC CLICKED MODULE                   */}
        {/* ================================================================= */}
        <main className="lg:col-span-8 space-y-6">

          {/* --------------------------------------------------------------- */}
          {/* 1. YOUTH IN PARISHES DATA VIEW                                  */}
          {/* --------------------------------------------------------------- */}
          {activeModule === 'parish-youth' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* 4 Key Performance Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Total Youths</span>
                    <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                      <Users className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                    {totalRegisteredYouths.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">8 Deaneries · 53 Parishes</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Confirmed</span>
                    <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
                    {totalConfirmedYouths.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">Verified in registry</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Pending</span>
                    <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                      <Clock className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-amber-600 mt-1 font-mono">
                    {totalPendingYouths.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-amber-600 mt-0.5 font-medium">Awaiting acceptance</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Collections</span>
                    <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                      <CreditCard className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                    KSh {totalRevenue.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">100 KSh / youth</div>
                </div>
              </div>

              {/* Pending Approvals Queue */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-200 bg-amber-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-700" />
                      <span>Pending Youth Batches Awaiting Acceptance ({pendingBatches.length})</span>
                    </h3>
                    <p className="text-xs text-slate-600">
                      Verify leader submission and accept youths into the central Archdiocesan registry.
                    </p>
                  </div>

                  {pendingBatches.length > 0 && (
                    <button
                      onClick={handleConfirmAllPending}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold self-start sm:self-auto cursor-pointer"
                    >
                      Accept All Pending
                    </button>
                  )}
                </div>

                {pendingBatches.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                    <p className="font-semibold text-slate-800">All youth registrations are up-to-date</p>
                    <p className="text-slate-400 mt-0.5">No pending batches require acceptance at this time.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Batch & Date</th>
                          <th className="py-2.5 px-3">Parish & Deanery</th>
                          <th className="py-2.5 px-3">Local Church</th>
                          <th className="py-2.5 px-3">Youth Leader</th>
                          <th className="py-2.5 px-3 text-center">Youths</th>
                          <th className="py-2.5 px-3">M-Pesa Ref</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pendingBatches.map(batch => (
                          <tr key={batch.id} className="hover:bg-amber-50/40">
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                              <div>{batch.id}</div>
                              <div className="text-[10px] text-slate-400 font-sans">{batch.submittedAt}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{batch.parishName}</div>
                              <div className="text-[10px] text-slate-500">{batch.deaneryName}</div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 font-medium">
                              {batch.localChurch}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-medium text-slate-900">{batch.leaderName}</div>
                              <div className="text-[10px] font-mono text-slate-500">{batch.leaderPhone}</div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-bold rounded text-[11px]">
                                {batch.memberCount} Youths
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-slate-800">
                              {batch.mpesaCode}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => handleConfirmBatch(batch.id, batch.parishName, batch.memberCount)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-2xs"
                              >
                                Accept & Confirm
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ----------------------------------------------------------- */}
              {/* PARISH DRILLDOWN VIEW: REGISTERED PERSONS IN CLICKED PARISH  */}
              {/* Requested by user:                                          */}
              {/* "ONCE YOU CLICK ON THE PARTICULER PARISH IT SHOULD DISPLAY  */}
              {/* THE LIST OF THE REGISTERED PERSONS , WITH DEANERY, PARISH , */}
              {/* LOCAL CHURCH , PHONE NUMBER USED, ADMIN CAN ALSO EDIT,      */}
              {/* DELETE A YOUTH"                                             */}
              {/* ----------------------------------------------------------- */}
              {selectedParishDetail ? (
                <div className="bg-white border-2 border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-md space-y-5 animate-in fade-in duration-200">
                  
                  {/* Top Bar with Back Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => setSelectedParishDetail(null)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 cursor-pointer mb-1 transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to All Parishes Table</span>
                      </button>

                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">
                          {selectedParishDetail.parishName} Parish · Registered Persons
                        </h3>
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-mono text-[11px] font-bold rounded-md">
                          {selectedParishDetail.deaneryName} Deanery
                        </span>
                      </div>

                      <p className="text-xs text-slate-500">
                        Official youth registry for {selectedParishDetail.parishName} Parish. Admin can view, edit details, or delete youth records.
                      </p>
                    </div>

                    {/* Parish summary badges */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="px-3 py-1 bg-slate-100 text-slate-800 text-xs font-mono font-bold rounded-lg border border-slate-200">
                        {selectedParishYouths.length} Registered
                      </span>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-mono font-bold rounded-lg border border-emerald-200">
                        {selectedParishYouths.filter(m => m.approvalStatus !== 'Pending').length} Confirmed
                      </span>
                    </div>
                  </div>

                  {/* Search and Filters Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={parishMemberSearch}
                        onChange={(e) => setParishMemberSearch(e.target.value)}
                        placeholder="Search by name, unique code, phone, local church..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                      />
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 font-medium">Status:</span>
                      <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[11px] font-semibold">
                        <button
                          type="button"
                          onClick={() => setStatusFilter('ALL')}
                          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                            statusFilter === 'ALL' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600'
                          }`}
                        >
                          All ({selectedParishYouths.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatusFilter('Confirmed')}
                          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                            statusFilter === 'Confirmed' ? 'bg-white shadow-xs text-emerald-800 font-bold' : 'text-slate-600'
                          }`}
                        >
                          Confirmed
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatusFilter('Pending')}
                          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                            statusFilter === 'Pending' ? 'bg-white shadow-xs text-amber-800 font-bold' : 'text-slate-600'
                          }`}
                        >
                          Pending
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Registered Persons Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                          <th className="py-3 px-3">Unique Code</th>
                          <th className="py-3 px-3">Youth Full Name</th>
                          <th className="py-3 px-3">Deanery</th>
                          <th className="py-3 px-3">Parish</th>
                          <th className="py-3 px-3">Local Church</th>
                          <th className="py-3 px-3">Phone Number Used</th>
                          <th className="py-3 px-3 text-center">Status</th>
                          <th className="py-3 px-3 text-right">Admin Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredParishYouths.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-500">
                              <Users className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                              <p className="font-semibold text-slate-700">No registered youths found for {selectedParishDetail.parishName} matching criteria.</p>
                              <p className="text-slate-400 text-[11px] mt-0.5">Youth leaders can register youths in this parish from the Youth in Parishes registration tab.</p>
                            </td>
                          </tr>
                        ) : (
                          filteredParishYouths.map((member) => {
                            const isPending = member.approvalStatus === 'Pending';
                            const phoneUsed = member.phone || member.registeredByLeaderPhone || 'N/A';
                            const localChurch = member.localChurch || member.subParish || 'Parish Center';

                            return (
                              <tr key={member.id} className="hover:bg-slate-50/90 transition-colors">
                                {/* Unique code (smaller monospace as requested) */}
                                <td className="py-3 px-3 font-mono font-bold text-amber-800 text-[11px] whitespace-nowrap">
                                  {member.id}
                                </td>

                                {/* Name */}
                                <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                                  {member.fullName}
                                </td>

                                {/* Deanery */}
                                <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                                  {selectedParishDetail.deaneryName}
                                </td>

                                {/* Parish */}
                                <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">
                                  {selectedParishDetail.parishName}
                                </td>

                                {/* Local Church */}
                                <td className="py-3 px-3 font-semibold text-emerald-800 whitespace-nowrap">
                                  {localChurch}
                                </td>

                                {/* Phone number used */}
                                <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <span>{phoneUsed}</span>
                                  </div>
                                </td>

                                {/* Status */}
                                <td className="py-3 px-3 text-center whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isPending 
                                      ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                                      : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                  }`}>
                                    {member.approvalStatus || 'Confirmed'}
                                  </span>
                                </td>

                                {/* Admin Actions: Card, Edit, Delete */}
                                <td className="py-3 px-3 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    
                                    {/* View Card */}
                                    {onViewMemberCard && (
                                      <button
                                        type="button"
                                        onClick={() => onViewMemberCard(member)}
                                        title="View & Download Official PNG Card"
                                        className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <CreditCard className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    {/* EDIT YOUTH (Requested by user) */}
                                    <button
                                      type="button"
                                      onClick={() => setEditingMember(member)}
                                      title="Edit Youth Details"
                                      className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>

                                    {/* DELETE YOUTH (Requested by user) */}
                                    <button
                                      type="button"
                                      onClick={() => setMemberToDelete(member)}
                                      title="Delete Youth"
                                      className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>

                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>
              ) : (
                /* Deanery and Parish Breakdown Table (Default Overview) */
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          Total Youths Registered per Parish & Deanery
                        </h3>
                        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Click any parish to view youths
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Click on any parish row to inspect the full list of registered persons, edit details, or delete members.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={selectedDeaneryFilter}
                        onChange={(e) => setSelectedDeaneryFilter(e.target.value)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg cursor-pointer"
                      >
                        <option value="ALL">All Deaneries (Archdiocese-Wide)</option>
                        {ARCHDIOCESE_DEANERIES_AND_PARISHES.map(d => (
                          <option key={d.deanery} value={d.deanery}>
                            {d.deanery} Deanery
                          </option>
                        ))}
                      </select>

                      <div className="relative">
                        <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={parishSearchTerm}
                          onChange={(e) => setParishSearchTerm(e.target.value)}
                          placeholder="Search parish..."
                          className="pl-7 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Parish Name (Click to Open)</th>
                          <th className="py-2.5 px-3">Deanery</th>
                          <th className="py-2.5 px-3 text-center">Total Registered</th>
                          <th className="py-2.5 px-3 text-center">Confirmed</th>
                          <th className="py-2.5 px-3 text-center">Pending</th>
                          <th className="py-2.5 px-3 text-right">Collections (KES)</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parishStats.map((stat, idx) => (
                          <tr 
                            key={idx} 
                            onClick={() => setSelectedParishDetail({ parishName: stat.parishName, deaneryName: stat.deaneryName })}
                            className="hover:bg-emerald-50/50 cursor-pointer group transition-colors"
                          >
                            <td className="py-2.5 px-3 font-bold text-slate-900 group-hover:text-emerald-800 flex items-center gap-1.5">
                              <span>{stat.parishName}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-700 transition-colors" />
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{stat.deaneryName}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-900">{stat.totalCount}</td>
                            <td className="py-2.5 px-3 text-center text-emerald-700 font-semibold">{stat.confirmedCount}</td>
                            <td className="py-2.5 px-3 text-center text-amber-700 font-semibold">{stat.pendingCount}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                              KSh {stat.totalFees.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 group-hover:underline">
                                <span>View Persons</span>
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 font-bold text-slate-900 text-xs border-t border-slate-200">
                          <td className="py-2.5 px-3" colSpan={2}>Grand Total ({parishStats.length} Parishes)</td>
                          <td className="py-2.5 px-3 text-center font-mono">{parishStats.reduce((a, b) => a + b.totalCount, 0)}</td>
                          <td className="py-2.5 px-3 text-center text-emerald-700 font-mono">{parishStats.reduce((a, b) => a + b.confirmedCount, 0)}</td>
                          <td className="py-2.5 px-3 text-center text-amber-700 font-mono">{parishStats.reduce((a, b) => a + b.pendingCount, 0)}</td>
                          <td className="py-2.5 px-3 text-right font-mono" colSpan={2}>
                            KSh {parishStats.reduce((a, b) => a + b.totalFees, 0).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* 2. JUNIOR YOUTH DATA VIEW                                       */}
          {/* --------------------------------------------------------------- */}
          {activeModule === 'junior-youth' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <span>Junior Youth & Altar Servers Registry ({juniorYouthList.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Archdiocesan records for Junior Catholic Youth Movement, altar servers & Holy Childhood graduates.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={moduleSearchTerm}
                    onChange={(e) => setModuleSearchTerm(e.target.value)}
                    placeholder="Search junior member..."
                    className="pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Unique Code</th>
                      <th className="py-2.5 px-3">Full Name</th>
                      <th className="py-2.5 px-3">Parish & Church</th>
                      <th className="py-2.5 px-3">Age & Gender</th>
                      <th className="py-2.5 px-3">Sacraments</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {juniorYouthList
                      .filter(m => !moduleSearchTerm || m.fullName.toLowerCase().includes(moduleSearchTerm.toLowerCase()) || m.id.toLowerCase().includes(moduleSearchTerm.toLowerCase()))
                      .map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-sky-800">{member.id}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{member.fullName}</td>
                          <td className="py-2.5 px-3 text-slate-600">
                            <div>{member.subParish || member.localChurch || 'Parish Center'}</div>
                            <div className="text-[10px] text-slate-400">{member.parishId}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-mono">
                            {member.age} yrs · {member.gender}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                              {member.sacraments.confirmation ? 'Confirmed' : 'Baptized'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* 3. NICCA DATA VIEW                                              */}
          {/* --------------------------------------------------------------- */}
          {activeModule === 'nicca' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-red-600" />
                    <span>NICCA Tertiary Institutions & Student Registry ({niccaStudents.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Nyeri inter-colleges and catholic association covering universities & polytechnics across the Archdiocese.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={moduleSearchTerm}
                    onChange={(e) => setModuleSearchTerm(e.target.value)}
                    placeholder="Search student or campus..."
                    className="pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Institution / Campus</th>
                      <th className="py-2.5 px-3">Program of Study</th>
                      <th className="py-2.5 px-3">Campus Ministry Role</th>
                      <th className="py-2.5 px-3">Home Parish</th>
                      <th className="py-2.5 px-3">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {niccaStudents
                      .filter(s => !moduleSearchTerm || s.fullName.toLowerCase().includes(moduleSearchTerm.toLowerCase()) || s.institution.toLowerCase().includes(moduleSearchTerm.toLowerCase()))
                      .map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{student.fullName}</td>
                          <td className="py-2.5 px-3 font-semibold text-red-800">{student.institution}</td>
                          <td className="py-2.5 px-3 text-slate-600">{student.course} ({student.yearOfStudy})</td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                              {student.campusMinistryRole}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{student.homeParish}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">{student.phone}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* 4. CHALLENGE WEEK DATA VIEW                                     */}
          {/* --------------------------------------------------------------- */}
          {activeModule === 'challenge-week' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>Challenge Week Teams & Leaderboard ({challengeTeams.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Challenge week team registrations, delegate counts, M-Pesa receipts, and scores.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={moduleSearchTerm}
                    onChange={(e) => setModuleSearchTerm(e.target.value)}
                    placeholder="Search team or leader..."
                    className="pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Pass ID</th>
                      <th className="py-2.5 px-3">Team Name</th>
                      <th className="py-2.5 px-3">Parish & Deanery</th>
                      <th className="py-2.5 px-3">Team Leader</th>
                      <th className="py-2.5 px-3 text-center">Delegates</th>
                      <th className="py-2.5 px-3 text-right">Fee (KES)</th>
                      <th className="py-2.5 px-3">M-Pesa Code</th>
                      <th className="py-2.5 px-3 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {challengeTeams
                      .filter(t => !moduleSearchTerm || t.teamName.toLowerCase().includes(moduleSearchTerm.toLowerCase()) || t.teamLeaderName.toLowerCase().includes(moduleSearchTerm.toLowerCase()))
                      .map((team) => (
                        <tr key={team.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-900">{team.id}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{team.teamName}</td>
                          <td className="py-2.5 px-3 text-slate-600">
                            <div>{team.parishName}</div>
                            <div className="text-[10px] text-slate-400">{team.deaneryName}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800">{team.teamLeaderName}</div>
                            <div className="text-[10px] font-mono text-slate-500">{team.teamLeaderPhone}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-900">{team.membersCount}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                            KSh {team.totalFee.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-emerald-800">
                            {team.mpesaCode}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                            {team.sportsPoints + team.spiritualTasksCompleted * 10} pts
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* 5. CAREER DAY DATA VIEW                                         */}
          {/* --------------------------------------------------------------- */}
          {activeModule === 'career-day' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <span>CAREER DAY Mentors & Mentees Registry ({careerRegistrations.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Archdiocesan mentorship registry for young professionals and job-seeking youths.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={moduleSearchTerm}
                    onChange={(e) => setModuleSearchTerm(e.target.value)}
                    placeholder="Search professional..."
                    className="pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Career Field</th>
                      <th className="py-2.5 px-3">Current Organization</th>
                      <th className="py-2.5 px-3">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {careerRegistrations
                      .filter(c => !moduleSearchTerm || c.fullName.toLowerCase().includes(moduleSearchTerm.toLowerCase()) || c.careerField.toLowerCase().includes(moduleSearchTerm.toLowerCase()))
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{c.fullName}</td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800">
                              {c.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{c.careerField}</td>
                          <td className="py-2.5 px-3 text-slate-600">{c.currentOrganization}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">{c.phone}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* 6. MATRONS AND PATRONS DATA VIEW                                */}
          {/* --------------------------------------------------------------- */}
          {activeModule === 'matrons-patrons' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-rose-600" />
                    <span>Matrons and Patrons Registry ({matronsPatrons.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Commissioned youth animators, spiritual directors & parish patrons across the Archdiocese.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={moduleSearchTerm}
                    onChange={(e) => setModuleSearchTerm(e.target.value)}
                    placeholder="Search animator..."
                    className="pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Profession</th>
                      <th className="py-2.5 px-3 text-center">Service (Yrs)</th>
                      <th className="py-2.5 px-3 text-center">Safeguarding</th>
                      <th className="py-2.5 px-3">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {matronsPatrons
                      .filter(m => !moduleSearchTerm || m.fullName.toLowerCase().includes(moduleSearchTerm.toLowerCase()) || m.profession.toLowerCase().includes(moduleSearchTerm.toLowerCase()))
                      .map((patron) => (
                        <tr key={patron.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{patron.fullName}</td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-800">
                              {patron.role}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">{patron.profession}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                            {patron.yearsOfService} yrs
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                              Certified
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">{patron.phone}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* 7. YOUTH IN SECONDARY SCHOOL DATA VIEW                          */}
          {/* --------------------------------------------------------------- */}
          {activeModule === 'secondary-youth' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <School className="w-4 h-4 text-indigo-600" />
                    <span>Youth in Secondary School YCS Registry ({secondaryYouth.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Young Christian Students (YCS) in boarding and day secondary schools within Nyeri Archdiocese.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={moduleSearchTerm}
                    onChange={(e) => setModuleSearchTerm(e.target.value)}
                    placeholder="Search student or school..."
                    className="pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">School Name</th>
                      <th className="py-2.5 px-3 text-center">Form</th>
                      <th className="py-2.5 px-3">YCS Role</th>
                      <th className="py-2.5 px-3">Home Parish</th>
                      <th className="py-2.5 px-3">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {secondaryYouth
                      .filter(s => !moduleSearchTerm || s.fullName.toLowerCase().includes(moduleSearchTerm.toLowerCase()) || s.schoolName.toLowerCase().includes(moduleSearchTerm.toLowerCase()))
                      .map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{s.fullName}</td>
                          <td className="py-2.5 px-3 font-semibold text-indigo-900">{s.schoolName}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">{s.formLevel}</td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800">
                              {s.ycsRole}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">{s.homeParish}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">{s.phoneOrParentPhone}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>

      </div>

      {/* ------------------------------------------------------------------- */}
      {/* EDIT YOUTH MODAL (Admin Edit Capabilities)                          */}
      {/* ------------------------------------------------------------------- */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                  <Edit3 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Admin Edit: {editingMember.fullName}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    Unique Code: {editingMember.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditMember} className="space-y-3.5 text-xs">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Youth Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingMember.fullName}
                  onChange={(e) => setEditingMember({ ...editingMember, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Phone Number Used */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number Used *
                </label>
                <input
                  type="tel"
                  required
                  value={editingMember.phone || editingMember.registeredByLeaderPhone || ''}
                  onChange={(e) => setEditingMember({ 
                    ...editingMember, 
                    phone: e.target.value,
                    registeredByLeaderPhone: e.target.value 
                  })}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Local Church Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Local Church / Outstation *
                </label>
                <input
                  type="text"
                  required
                  value={editingMember.localChurch || editingMember.subParish || ''}
                  onChange={(e) => setEditingMember({ 
                    ...editingMember, 
                    localChurch: e.target.value,
                    subParish: e.target.value 
                  })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Age */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={35}
                    value={editingMember.age || 20}
                    onChange={(e) => setEditingMember({ ...editingMember, age: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={editingMember.gender}
                    onChange={(e) => setEditingMember({ ...editingMember, gender: e.target.value as 'Male' | 'Female' })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Approval Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Approval Status in Registry
                </label>
                <select
                  value={editingMember.approvalStatus || 'Confirmed'}
                  onChange={(e) => setEditingMember({ 
                    ...editingMember, 
                    approvalStatus: e.target.value as 'Confirmed' | 'Pending' 
                  })}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden cursor-pointer"
                >
                  <option value="Confirmed">Confirmed (Verified Member)</option>
                  <option value="Pending">Pending (Under Review)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* DELETE YOUTH CONFIRMATION MODAL (Admin Delete Capabilities)         */}
      {/* ------------------------------------------------------------------- */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-red-100 text-red-600 rounded-xl shrink-0">
                <Trash2 className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Youth Member?
                </h3>
                <p className="text-xs text-slate-500">
                  This action removes the youth from the Archdiocese of Nyeri registry.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 font-medium">
              <div>Youth Name: <strong className="text-slate-900">{memberToDelete.fullName}</strong></div>
              <div>Unique Code: <strong className="font-mono text-amber-800">{memberToDelete.id}</strong></div>
              <div>Parish: <strong className="text-slate-800">{selectedParishDetail?.parishName || memberToDelete.parishId}</strong></div>
              <div>Local Church: <strong className="text-slate-800">{memberToDelete.localChurch || memberToDelete.subParish || 'Parish Center'}</strong></div>
            </div>

            <p className="text-xs text-red-700 font-semibold">
              Warning: Once deleted, this member's card and unique registration will be revoked.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Yes, Delete Youth
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* REPORT GENERATION MODAL                                             */}
      {/* User prompt requirement:                                            */}
      {/* "WHEN generating report it should be of total registered youths with */}
      {/* their details also you should generate a list of registered youths   */}
      {/* per parish with the details"                                        */}
      {/* ------------------------------------------------------------------- */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200 my-4 sm:my-8 flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 gap-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Official Archdiocesan Youth Registration Report
                  </h3>
                  <p className="text-xs text-slate-500">
                    Catholic Archdiocese of Nyeri · Youth Directorate (2027 Census)
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {/* Export All Details CSV */}
                <button
                  type="button"
                  onClick={handleExportAllYouthsDetailsCsv}
                  title="Export all youths with their complete details (CSV)"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>All Youths CSV</span>
                </button>

                {/* Export Per Parish CSV */}
                <button
                  type="button"
                  onClick={handleExportPerParishYouthsCsv}
                  title="Export youths grouped per parish with details (CSV)"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Per Parish CSV</span>
                </button>

                {/* Print */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print Report</span>
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-Header Tabs & Quick Filters */}
            <div className="no-print px-6 py-3 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setReportTab('total-details')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportTab === 'total-details' 
                      ? 'bg-white text-emerald-800 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Total Registered Youths (Full Details)
                </button>

                <button
                  type="button"
                  onClick={() => setReportTab('per-parish')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportTab === 'per-parish' 
                      ? 'bg-white text-emerald-800 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Youths Per Parish (With Details)
                </button>

                <button
                  type="button"
                  onClick={() => setReportTab('summary')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportTab === 'summary' 
                      ? 'bg-white text-emerald-800 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Deanery & Parish Summary
                </button>
              </div>

              {/* Dynamic Filter Controls depending on active tab */}
              <div className="flex items-center gap-2">
                {reportTab === 'per-parish' && (
                  <select
                    value={reportParishFilter}
                    onChange={(e) => setReportParishFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg cursor-pointer"
                  >
                    <option value="ALL">All Parishes (Complete Roster)</option>
                    {youthsGroupedByParish.map(g => (
                      <option key={g.parishName} value={g.parishName}>
                        {g.parishName} ({g.youths.length} youths)
                      </option>
                    ))}
                  </select>
                )}

                {reportTab === 'total-details' && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={reportSearchQuery}
                      onChange={(e) => setReportSearchQuery(e.target.value)}
                      placeholder="Search code, name, parish..."
                      className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Printable Report Content */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
              {/* Official Archdiocese Letterhead */}
              <div className="text-center pb-6 border-b border-slate-200 space-y-2">
                <div className="inline-block p-1 bg-white border border-slate-200 rounded-xl mb-1 shadow-2xs">
                  <OfficialLogo className="h-16 w-auto mx-auto" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                  Catholic Archdiocese of Nyeri
                </h2>
                <h3 className="text-sm font-bold text-slate-700">
                  Archdiocesan Youth Directorate · Central Registry & Census Report
                </h3>
                <div className="text-xs text-slate-500 font-mono">
                  Report Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · Official Rate: KSh 100/member
                </div>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div>
                  <div className="text-xs text-slate-500 uppercase font-bold">Total Registered Youths</div>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{totalRegisteredYouths}</div>
                </div>
                <div>
                  <div className="text-xs text-emerald-700 uppercase font-bold">Confirmed in Registry</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">{totalConfirmedYouths}</div>
                </div>
                <div>
                  <div className="text-xs text-amber-700 uppercase font-bold">Pending Review</div>
                  <div className="text-2xl font-black text-amber-600 mt-1 font-mono">{totalPendingYouths}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-bold">Total Registration Fees</div>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-mono">KSh {totalRevenue.toLocaleString()}</div>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* REPORT VIEW 1: TOTAL REGISTERED YOUTHS WITH THEIR DETAILS     */}
              {/* ------------------------------------------------------------- */}
              {reportTab === 'total-details' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span>Total Registered Youths With Full Details</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono rounded">
                        {allRegisteredYouthsWithDetails.filter(m => 
                          !reportSearchQuery ||
                          m.fullName.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                          m.id.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                          m.parishName.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                          m.localChurch.toLowerCase().includes(reportSearchQuery.toLowerCase())
                        ).length} Records
                      </span>
                    </h4>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 text-[10px] uppercase">
                          <th className="py-2.5 px-3">Unique Code</th>
                          <th className="py-2.5 px-3">Youth Name</th>
                          <th className="py-2.5 px-3">Deanery</th>
                          <th className="py-2.5 px-3">Parish</th>
                          <th className="py-2.5 px-3">Local Church</th>
                          <th className="py-2.5 px-3">Phone Used</th>
                          <th className="py-2.5 px-3">Age / Gender</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {allRegisteredYouthsWithDetails
                          .filter(m => 
                            !reportSearchQuery ||
                            m.fullName.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                            m.id.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                            m.parishName.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                            m.localChurch.toLowerCase().includes(reportSearchQuery.toLowerCase())
                          )
                          .map((m) => (
                            <tr key={m.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-mono font-bold text-amber-800 text-[11px] whitespace-nowrap">
                                {m.id}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                                {m.fullName}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                                {m.deaneryName}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                                {m.parishName}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-emerald-800 whitespace-nowrap">
                                {m.localChurch}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                                {m.phoneUsed}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                                {m.age || 20} yrs · {m.gender || 'N/A'}
                              </td>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  m.approvalStatus === 'Pending'
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-emerald-100 text-emerald-900'
                                }`}>
                                  {m.approvalStatus || 'Confirmed'}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* REPORT VIEW 2: REGISTERED YOUTHS PER PARISH WITH DETAILS       */}
              {/* ------------------------------------------------------------- */}
              {reportTab === 'per-parish' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      List of Registered Youths Per Parish (With Details)
                    </h4>
                    <span className="text-xs font-mono text-slate-500 font-semibold">
                      {reportParishFilter === 'ALL' ? 'All Registered Parishes' : reportParishFilter}
                    </span>
                  </div>

                  {youthsGroupedByParish
                    .filter(group => reportParishFilter === 'ALL' || group.parishName.toLowerCase() === reportParishFilter.toLowerCase())
                    .map((group) => {
                      const totalInParish = group.youths.length;
                      const confirmedInParish = group.youths.filter(y => y.approvalStatus !== 'Pending').length;
                      const pendingInParish = totalInParish - confirmedInParish;

                      return (
                        <div key={group.parishName} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-0">
                          {/* Parish Section Header */}
                          <div className="bg-slate-100 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-slate-900 text-sm">
                                  {group.parishName} Parish
                                </span>
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded">
                                  {group.deaneryName} Deanery
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Official parish delegation list with individual member details.
                              </p>
                            </div>

                            <div className="flex items-center gap-2 text-xs font-mono font-bold">
                              <span className="px-2.5 py-1 bg-white text-slate-800 rounded border border-slate-200">
                                {totalInParish} Total Youths
                              </span>
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                                {confirmedInParish} Confirmed
                              </span>
                              {pendingInParish > 0 && (
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded border border-amber-200">
                                  {pendingInParish} Pending
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Parish Youths Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                                  <th className="py-2.5 px-3">Unique Code</th>
                                  <th className="py-2.5 px-3">Youth Full Name</th>
                                  <th className="py-2.5 px-3">Deanery</th>
                                  <th className="py-2.5 px-3">Parish</th>
                                  <th className="py-2.5 px-3">Local Church</th>
                                  <th className="py-2.5 px-3">Phone Number Used</th>
                                  <th className="py-2.5 px-3 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {group.youths.map((youth) => (
                                  <tr key={youth.id} className="hover:bg-slate-50/70">
                                    <td className="py-2.5 px-3 font-mono font-bold text-amber-800 text-[11px] whitespace-nowrap">
                                      {youth.id}
                                    </td>
                                    <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                                      {youth.fullName}
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                                      {group.deaneryName}
                                    </td>
                                    <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                                      {group.parishName}
                                    </td>
                                    <td className="py-2.5 px-3 font-semibold text-emerald-800 whitespace-nowrap">
                                      {youth.localChurch}
                                    </td>
                                    <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                                      {youth.phoneUsed}
                                    </td>
                                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        youth.approvalStatus === 'Pending'
                                          ? 'bg-amber-100 text-amber-900'
                                          : 'bg-emerald-100 text-emerald-900'
                                      }`}>
                                        {youth.approvalStatus || 'Confirmed'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* REPORT VIEW 3: DEANERY AND PARISH AGGREGATE SUMMARY           */}
              {/* ------------------------------------------------------------- */}
              {reportTab === 'summary' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Deanery and Parish Aggregate Registration Breakdown
                  </h4>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 text-[11px]">
                          <th className="py-2.5 px-3">Deanery</th>
                          <th className="py-2.5 px-3">Parish</th>
                          <th className="py-2.5 px-3 text-center">Registered Youths</th>
                          <th className="py-2.5 px-3 text-center">Confirmed</th>
                          <th className="py-2.5 px-3 text-center">Pending</th>
                          <th className="py-2.5 px-3 text-right">Collections (KES)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {parishStats.map((stat, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-2 px-3 text-slate-600">{stat.deaneryName}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900">{stat.parishName}</td>
                            <td className="py-2 px-3 text-center font-bold font-mono">{stat.totalCount}</td>
                            <td className="py-2 px-3 text-center text-emerald-700 font-mono">{stat.confirmedCount}</td>
                            <td className="py-2 px-3 text-center text-amber-700 font-mono">{stat.pendingCount}</td>
                            <td className="py-2 px-3 text-right font-mono">KSh {stat.totalFees.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-200 font-bold text-slate-900 border-t-2 border-slate-300 text-xs">
                          <td className="py-2.5 px-3" colSpan={2}>Grand Total ({parishStats.length} Parishes)</td>
                          <td className="py-2.5 px-3 text-center font-mono">{parishStats.reduce((a, b) => a + b.totalCount, 0)}</td>
                          <td className="py-2.5 px-3 text-center text-emerald-800 font-mono">{parishStats.reduce((a, b) => a + b.confirmedCount, 0)}</td>
                          <td className="py-2.5 px-3 text-center text-amber-800 font-mono">{parishStats.reduce((a, b) => a + b.pendingCount, 0)}</td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            KSh {parishStats.reduce((a, b) => a + b.totalFees, 0).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Signatures & Certification */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-600">
                <div>
                  <div className="h-10 border-b border-slate-400 border-dashed" />
                  <p className="pt-1.5 font-bold text-slate-800">Archdiocesan Youth Chaplain</p>
                  <p className="text-[11px] text-slate-500">Catholic Archdiocese of Nyeri</p>
                </div>
                <div>
                  <div className="h-10 border-b border-slate-400 border-dashed" />
                  <p className="pt-1.5 font-bold text-slate-800">Archdiocesan Youth Coordinator</p>
                  <p className="text-[11px] text-slate-500">Catholic Archdiocese of Nyeri</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="no-print px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-[11px] text-slate-500 font-mono">
                Catholic Archdiocese of Nyeri · Youth Directorate Management System
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
