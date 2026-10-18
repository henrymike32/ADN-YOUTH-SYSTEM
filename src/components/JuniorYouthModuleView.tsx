import React, { useState } from 'react';
import { useYouth } from '../context/YouthContext';
import { YouthMember } from '../types';
import { 
  Sparkles, 
  ArrowLeft, 
  Plus, 
  Search, 
  Download, 
  CheckCircle, 
  CreditCard,
  Edit3,
  Trash2,
  LogIn,
  UserPlus,
  AlertCircle
} from 'lucide-react';

interface JuniorYouthProps {
  onBackToHome: () => void;
  onOpenNewMemberModal: () => void;
  onEditMember: (member: YouthMember) => void;
  onViewMemberCard: (member: YouthMember) => void;
}

export const JuniorYouthModuleView: React.FC<JuniorYouthProps> = ({
  onBackToHome,
  onOpenNewMemberModal,
  onEditMember,
  onViewMemberCard,
}) => {
  const { members, parishes, deaneries, deleteMember } = useYouth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeanery, setSelectedDeanery] = useState('ALL');
  const [confirmationFilter, setConfirmationFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'directory' | 'login'>('directory');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Filter only Junior Youth members
  const juniorMembers = members.filter((m) => m.movement === 'Junior Youth');

  const filteredMembers = juniorMembers.filter((m) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      m.fullName.toLowerCase().includes(query) ||
      m.id.toLowerCase().includes(query) ||
      m.phone.includes(query) ||
      (m.institution && m.institution.toLowerCase().includes(query));

    const matchesDeanery =
      selectedDeanery === 'ALL' || m.deaneryId === selectedDeanery;

    const matchesConfirmation =
      confirmationFilter === 'ALL' ||
      (confirmationFilter === 'CONFIRMED' && m.sacraments.confirmation) ||
      (confirmationFilter === 'UNCONFIRMED' && !m.sacraments.confirmation);

    return matchesSearch && matchesDeanery && matchesConfirmation;
  });

  const handleExportCSV = () => {
    const headers = ['ID', 'Full Name', 'Age', 'Gender', 'Deanery', 'Parish', 'School / Institution', 'Parent Contact', 'Confirmation Status'];
    const rows = filteredMembers.map((m) => {
      const p = parishes.find((parish) => parish.id === m.parishId);
      const d = deaneries.find((deanery) => deanery.id === m.deaneryId);
      return [
        m.id,
        `"${m.fullName}"`,
        m.age,
        m.gender,
        `"${d?.name || ''}"`,
        `"${p?.name || ''}"`,
        `"${m.institution || ''}"`,
        `"${m.emergencyContact.name} (${m.emergencyContact.phone})"`,
        m.sacraments.confirmation ? 'Confirmed' : 'Pending Confirmation',
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Junior_Youth_Registry_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Breadcrumb */}
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
            <span className="p-2 bg-sky-500 text-white rounded-lg shadow-xs">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Junior Youth Registration Module
              </h1>
              <p className="text-xs text-slate-500">
                Teens Ages 13 to 17 · Post-PMC Transition, Confirmation Catechesis & Teen Camps
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={onOpenNewMemberModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-700 hover:bg-white hover:shadow-xs transition-all"
            >
              <UserPlus className="w-3.5 h-3.5 text-sky-600" />
              <span>Enroll / Register</span>
            </button>

            <button
              onClick={() => setActiveTab('login')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login / Pass</span>
            </button>

            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'directory'
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Directory</span>
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

      {/* LOGIN TAB FOR JUNIOR YOUTH */}
      {activeTab === 'login' && (
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="text-center space-y-1">
            <span className="inline-block p-2.5 bg-sky-100 text-sky-700 rounded-xl">
              <LogIn className="w-5 h-5" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Junior Youth Portal Login
            </h3>
            <p className="text-xs text-slate-500">
              Enter registered phone number or Junior Youth ID to retrieve your pass.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setLoginError(null);
              const clean = loginPhone.trim().toLowerCase();
              const found = juniorMembers.find(
                (m) => m.phone.includes(clean) || m.id.toLowerCase() === clean
              );
              if (found) {
                onViewMemberCard(found);
              } else {
                setLoginError('Junior youth member not found with this phone or ID. Please enroll first.');
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Parent/Teen Phone Number or ID *
              </label>
              <input
                type="text"
                required
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                placeholder="e.g. 0722334455 or ADN-YTH-..."
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
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
            >
              Access Junior Youth Card
            </button>
          </form>

          <div className="pt-2 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={onOpenNewMemberModal}
              className="text-xs font-semibold text-sky-700 hover:text-sky-900 underline"
            >
              Not yet registered? Enroll a new Junior Youth teen
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by teen name, ID, school, or phone..."
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedDeanery}
              onChange={(e) => setSelectedDeanery(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
            >
              <option value="ALL">All Deaneries</option>
              {deaneries.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={confirmationFilter}
              onChange={(e) => setConfirmationFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
            >
              <option value="ALL">All Confirmation Status</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="UNCONFIRMED">Awaiting Confirmation</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
          <span>Showing {filteredMembers.length} of {juniorMembers.length} enrolled Junior Youth</span>
          <span className="font-mono text-slate-400">Archdiocese of Nyeri Junior Ministry</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Member ID & Name</th>
                <th className="py-3 px-4">Parish & Deanery</th>
                <th className="py-3 px-4">School / Form</th>
                <th className="py-3 px-4">Parent / Guardian Contact</th>
                <th className="py-3 px-4 text-center">Confirmation</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => {
                const parish = parishes.find((p) => p.id === member.parishId);
                const deanery = deaneries.find((d) => d.id === member.deaneryId);

                return (
                  <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{member.fullName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{member.id} · {member.age} yrs ({member.gender})</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{parish?.name}</div>
                      <div className="text-[11px] text-slate-400">{deanery?.name}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      <div>{member.institution || member.occupation}</div>
                      <div className="text-[11px] text-slate-400">{member.ministryGuild}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700">
                      <div>{member.emergencyContact.phone}</div>
                      <div className="text-[11px] text-slate-400 font-sans">{member.emergencyContact.name}</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {member.sacraments.confirmation ? (
                        <span className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Confirmed
                        </span>
                      ) : (
                        <span className="text-amber-700 font-medium">
                          Awaiting Prep
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewMemberCard(member)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="View Digital Pass"
                        >
                          <CreditCard className="w-4 h-4 text-sky-600" />
                        </button>
                        <button
                          onClick={() => onEditMember(member)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Edit Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${member.fullName}?`)) deleteMember(member.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
