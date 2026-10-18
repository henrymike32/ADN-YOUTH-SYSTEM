import React, { useState, useMemo } from 'react';
import { useYouth } from '../context/YouthContext';
import { YouthMember, YouthMovement } from '../types';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  MoreHorizontal, 
  Trash2, 
  Edit3,
  Phone,
  Mail,
  Church,
  ArrowLeft,
  LogIn,
  UserPlus,
  AlertCircle
} from 'lucide-react';

interface MembersViewProps {
  onOpenNewMemberModal: () => void;
  onEditMember: (member: YouthMember) => void;
  onViewMemberCard: (member: YouthMember) => void;
  onBackToHome?: () => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  onOpenNewMemberModal,
  onEditMember,
  onViewMemberCard,
  onBackToHome,
}) => {
  const { members, parishes, deaneries, deleteMember } = useYouth();

  const [activeTab, setActiveTab] = useState<'registry' | 'login'>('registry');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeanery, setSelectedDeanery] = useState('ALL');
  const [selectedMovement, setSelectedMovement] = useState<string>('ALL');
  const [confirmationFilter, setConfirmationFilter] = useState<string>('ALL');

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Search query
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        member.fullName.toLowerCase().includes(query) ||
        member.id.toLowerCase().includes(query) ||
        member.phone.toLowerCase().includes(query) ||
        member.occupation.toLowerCase().includes(query);

      // Deanery filter
      const matchesDeanery =
        selectedDeanery === 'ALL' || member.deaneryId === selectedDeanery;

      // Movement filter
      const matchesMovement =
        selectedMovement === 'ALL' || member.movement === selectedMovement;

      // Sacramental filter
      const matchesConfirmation =
        confirmationFilter === 'ALL' ||
        (confirmationFilter === 'CONFIRMED' && member.sacraments.confirmation) ||
        (confirmationFilter === 'UNCONFIRMED' && !member.sacraments.confirmation);

      return matchesSearch && matchesDeanery && matchesMovement && matchesConfirmation;
    });
  }, [members, searchTerm, selectedDeanery, selectedMovement, confirmationFilter]);

  // Export filtered members to CSV
  const handleExportCSV = () => {
    const headers = [
      'Member ID',
      'Full Name',
      'Gender',
      'Age',
      'Phone',
      'Email',
      'Deanery',
      'Parish',
      'Outstation',
      'Movement',
      'Role',
      'Guild',
      'Occupation',
      'Baptism',
      'Confirmation',
      'Emergency Contact',
    ];

    const rows = filteredMembers.map((m) => {
      const p = parishes.find((parish) => parish.id === m.parishId);
      const d = deaneries.find((deanery) => deanery.id === m.deaneryId);
      return [
        m.id,
        `"${m.fullName}"`,
        m.gender,
        m.age,
        m.phone,
        m.email,
        `"${d?.name || ''}"`,
        `"${p?.name || ''}"`,
        `"${m.subParish}"`,
        m.movement,
        `"${m.leadershipRole}"`,
        `"${m.ministryGuild}"`,
        `"${m.occupation}"`,
        m.sacraments.baptism ? 'Yes' : 'No',
        m.sacraments.confirmation ? 'Yes' : 'No',
        `"${m.emergencyContact.name} (${m.emergencyContact.phone})"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Archdiocese_Nyeri_Youth_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Main Dashboard</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Youth in Parishes
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              CYO & YCA
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Archdiocesan Youth Registry & Membership Roster across all Parishes & Deaneries
          </p>
        </div>

        {/* Tab Controls: Register vs Login vs Roster */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={onOpenNewMemberModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-700 hover:bg-white hover:shadow-xs transition-all"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Register Youth</span>
            </button>

            <button
              onClick={() => setActiveTab('login')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login / ID Pass</span>
            </button>

            <button
              onClick={() => setActiveTab('registry')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'registry'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Church className="w-3.5 h-3.5" />
              <span>Parish Roster</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* LOGIN TAB FOR PARISH YOUTH */}
      {activeTab === 'login' && (
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="text-center space-y-1">
            <span className="inline-block p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <LogIn className="w-5 h-5" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Youth Member Portal Login
            </h3>
            <p className="text-xs text-slate-500">
              Enter your phone number or Member ID to view your digital Archdiocesan Pass.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setLoginError(null);
              const clean = loginPhone.trim().toLowerCase();
              const found = members.find(
                (m) => m.phone.includes(clean) || m.id.toLowerCase() === clean
              );
              if (found) {
                onViewMemberCard(found);
              } else {
                setLoginError('Member not found with this phone number or ID. Please register first.');
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number or Member ID *
              </label>
              <input
                type="text"
                required
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                placeholder="e.g. 0711223344 or ADN-YTH-..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:outline-hidden"
              />
            </div>

            {loginError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
            >
              Look Up Member Pass
            </button>
          </form>

          <div className="pt-2 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={onOpenNewMemberModal}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline"
            >
              Don't have an ID? Register as a new youth member
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar Controls (Functional Buttons & Selects) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, phone, or occupation..."
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:bg-white transition-colors"
            />
          </div>

          {/* Deanery Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedDeanery}
              onChange={(e) => setSelectedDeanery(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              <option value="ALL">All Deaneries (7 Deaneries)</option>
              {deaneries.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Movement Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedMovement}
              onChange={(e) => setSelectedMovement(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              <option value="ALL">All Movements</option>
              <option value="Junior Youth">Junior Youth (13-17)</option>
              <option value="CYO">CYO Senior (18-26)</option>
              <option value="YCA">YCA Adults (27-35)</option>
            </select>
          </div>

          {/* Confirmation Status */}
          <div className="md:col-span-2">
            <select
              value={confirmationFilter}
              onChange={(e) => setConfirmationFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              <option value="ALL">All Sacramental Status</option>
              <option value="CONFIRMED">Confirmed Only</option>
              <option value="UNCONFIRMED">Awaiting Confirmation</option>
            </select>
          </div>
        </div>

        {/* Quiet Unboxed Metadata Count */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span>Showing {filteredMembers.length} of {members.length} youth members</span>
            <span aria-hidden="true">·</span>
            <span>Catholic Archdiocese of Nyeri</span>
          </div>

          {(searchTerm || selectedDeanery !== 'ALL' || selectedMovement !== 'ALL' || confirmationFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDeanery('ALL');
                setSelectedMovement('ALL');
                setConfirmationFilter('ALL');
              }}
              className="text-amber-700 hover:text-amber-900 font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Member ID & Name</th>
                <th className="py-3 px-4">Parish & Deanery</th>
                <th className="py-3 px-4">Movement & Role</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-center">Sacraments</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <p className="font-medium text-slate-700">No youth members found</p>
                    <p className="text-xs mt-1">Try adjusting your filters or search keywords.</p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const parish = parishes.find((p) => p.id === member.parishId);
                  const deanery = deaneries.find((d) => d.id === member.deaneryId);

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Name & ID */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {member.fullName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{member.id}</span>
                          <span aria-hidden="true">·</span>
                          <span>{member.age} yrs ({member.gender})</span>
                        </div>
                      </td>

                      {/* Parish & Deanery */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {parish?.name || 'Parish'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {deanery?.name || 'Deanery'} · {member.subParish}
                        </div>
                      </td>

                      {/* Movement & Role */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {member.movement}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {member.leadershipRole} · {member.ministryGuild}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                        <div>{member.phone}</div>
                        <div className="text-[11px] text-slate-400 font-sans truncate max-w-[150px]">
                          {member.email}
                        </div>
                      </td>

                      {/* Sacraments */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-2 text-[11px]">
                          <span
                            title={member.sacraments.baptism ? 'Baptized' : 'Unbaptized'}
                            className={`font-semibold ${
                              member.sacraments.baptism ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            Bap {member.sacraments.baptism ? '✓' : '✗'}
                          </span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span
                            title={member.sacraments.confirmation ? 'Confirmed' : 'Pending Confirmation'}
                            className={`font-semibold ${
                              member.sacraments.confirmation ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            Conf {member.sacraments.confirmation ? '✓' : 'Pending'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Digital Pass Button */}
                          <button
                            onClick={() => onViewMemberCard(member)}
                            title="Generate Digital Youth Pass"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
                          >
                            <CreditCard className="w-4 h-4 text-amber-600" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => onEditMember(member)}
                            title="Edit Member Details"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
                          >
                            <Edit3 className="w-4 h-4 text-slate-600" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              if (confirm(`Remove ${member.fullName} from youth registry?`)) {
                                deleteMember(member.id);
                              }
                            }}
                            title="Delete Member"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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
    </div>
  );
};
