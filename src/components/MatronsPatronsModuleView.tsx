import React, { useState } from 'react';
import { useYouth } from '../context/YouthContext';
import { MatronPatron } from '../types';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  Phone, 
  Mail, 
  Award,
  X,
  CheckCircle2,
  LogIn,
  UserPlus,
  AlertCircle
} from 'lucide-react';

interface MatronsPatronsProps {
  onBackToHome: () => void;
}

export const MatronsPatronsModuleView: React.FC<MatronsPatronsProps> = ({ onBackToHome }) => {
  const { matronsPatrons, addMatronPatron, deleteMatronPatron, parishes, deaneries } = useYouth();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'directory' | 'login'>('directory');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggedAnimator, setLoggedAnimator] = useState<MatronPatron | null>(null);

  // Form
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [role, setRole] = useState<MatronPatron['role']>('Patron');
  const [parishId, setParishId] = useState(parishes[0]?.id || '');
  const [phone, setPhone] = useState('+254 7');
  const [email, setEmail] = useState('');
  const [profession, setProfession] = useState('');
  const [yearsOfService, setYearsOfService] = useState(5);
  const [safeguardingCertified, setSafeguardingCertified] = useState(true);
  const [notes, setNotes] = useState('');

  const selectedParish = parishes.find((p) => p.id === parishId) || parishes[0];

  const filteredAnimators = matronsPatrons.filter((a) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      a.fullName.toLowerCase().includes(query) ||
      a.profession.toLowerCase().includes(query) ||
      a.phone.includes(query);

    const matchesRole = roleFilter === 'ALL' || a.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;

    addMatronPatron({
      fullName: fullName.trim(),
      gender,
      role,
      parishId,
      deaneryId: selectedParish.deaneryId,
      phone: phone.trim(),
      email: email.trim() || `${fullName.toLowerCase().replace(/\s+/g, '.')}@animators.ke`,
      profession: profession.trim() || 'Church Leader / Professional',
      yearsOfService: Number(yearsOfService) || 1,
      commissionedDate: new Date().toISOString().split('T')[0],
      safeguardingCertified,
      notes: notes.trim() || 'Parish commissioned youth animator.',
    });

    setFullName('');
    setProfession('');
    setNotes('');
    setShowRegisterModal(false);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Full Name', 'Role', 'Parish', 'Deanery', 'Profession', 'Years of Service', 'Phone', 'Safeguarding'];
    const rows = filteredAnimators.map((a) => {
      const p = parishes.find((parish) => parish.id === a.parishId);
      const d = deaneries.find((deanery) => deanery.id === a.deaneryId);
      return [
        a.id,
        `"${a.fullName}"`,
        a.role,
        `"${p?.name || ''}"`,
        `"${d?.name || ''}"`,
        `"${a.profession}"`,
        a.yearsOfService,
        a.phone,
        a.safeguardingCertified ? 'Certified' : 'Pending',
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Matrons_and_Patrons_Registry_${new Date().toISOString().split('T')[0]}.csv`;
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
            <span className="p-2 bg-red-600 text-white rounded-lg shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Matrons & Patrons (Youth Animators) Directory
              </h1>
              <p className="text-xs text-slate-500">
                Commissioned Adult Mentors, Matrons, Patrons & Parish Youth Chaplains
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setShowRegisterModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-700 hover:bg-white hover:shadow-xs transition-all"
            >
              <UserPlus className="w-3.5 h-3.5 text-red-600" />
              <span>Register / Commission</span>
            </button>

            <button
              onClick={() => setActiveTab('login')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-red-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login / Accreditation</span>
            </button>

            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'directory'
                  ? 'bg-red-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Animators Roster</span>
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

      {/* LOGIN VIEW FOR MATRONS & PATRONS */}
      {activeTab === 'login' && (
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="text-center space-y-1">
            <span className="inline-block p-2.5 bg-red-100 text-red-700 rounded-xl">
              <LogIn className="w-5 h-5" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Youth Animator Accreditation Login
            </h3>
            <p className="text-xs text-slate-500">
              Enter registered phone number or Animator ID to view your Archdiocesan mandate.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setLoginError(null);
              setLoggedAnimator(null);
              const clean = loginPhone.trim().toLowerCase();
              const found = matronsPatrons.find(
                (a) => a.phone.includes(clean) || a.id.toLowerCase() === clean
              );
              if (found) {
                setLoggedAnimator(found);
              } else {
                setLoginError('Animator record not found with this phone number or ID. Please register first.');
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number or Animator ID *
              </label>
              <input
                type="text"
                required
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                placeholder="e.g. 0712345601 or ANIM-2026-..."
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
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
            >
              Verify Animator Credentials
            </button>
          </form>

          {loggedAnimator && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-900">{loggedAnimator.fullName}</span>
                <span className="font-mono text-2xs text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded">
                  {loggedAnimator.id}
                </span>
              </div>
              <p className="text-slate-600"><strong>Role:</strong> {loggedAnimator.role}</p>
              <p className="text-slate-600"><strong>Profession:</strong> {loggedAnimator.profession}</p>
              <p className="text-slate-600"><strong>Years of Service:</strong> {loggedAnimator.yearsOfService} years</p>
              <p className="text-slate-600"><strong>Safeguarding Certified:</strong> {loggedAnimator.safeguardingCertified ? 'Yes, Certified' : 'Pending'}</p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="text-xs font-semibold text-red-700 hover:text-red-900 underline"
            >
              Not yet registered? Commission a new animator
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by animator name, profession, phone..."
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
            >
              <option value="ALL">All Roles (Matrons, Patrons, Animators)</option>
              <option value="Patron">Patrons Only</option>
              <option value="Matron">Matrons Only</option>
              <option value="Youth Animator">Youth Animators Only</option>
              <option value="Spiritual Director">Spiritual Directors</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
          <span>Showing {filteredAnimators.length} of {matronsPatrons.length} commissioned animators</span>
          <span className="font-mono text-slate-400">Archdiocese of Nyeri Youth Animators Board</span>
        </div>
      </div>

      {/* Animators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAnimators.map((animator) => {
          const parish = parishes.find((p) => p.id === animator.parishId);
          const deanery = deaneries.find((d) => d.id === animator.deaneryId);

          return (
            <div
              key={animator.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{animator.fullName}</h3>
                    <p className="text-xs text-slate-500">{parish?.name} · {deanery?.name.replace(' Deanery', '')}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-800 border border-red-200/50">
                    {animator.role}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-1">
                  <div className="text-slate-700">
                    <span className="font-semibold">Profession:</span> {animator.profession}
                  </div>
                  <div className="text-slate-700 font-mono text-[11px]">
                    <span className="font-semibold">Phone:</span> {animator.phone}
                  </div>
                  <div className="text-slate-700">
                    <span className="font-semibold">Service:</span> {animator.yearsOfService} years
                  </div>
                </div>

                {animator.notes && (
                  <p className="text-xs text-slate-600 italic">"{animator.notes}"</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Safeguarding Certified
                </span>
                <button
                  onClick={() => {
                    if (confirm(`Remove ${animator.fullName} from animators list?`)) {
                      deleteMatronPatron(animator.id);
                    }
                  }}
                  className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                  title="Remove Animator"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Commission Youth Animator / Patron</h3>
                <p className="text-xs text-slate-500">Catholic Archdiocese of Nyeri</p>
              </div>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Mwalimu Patrick Kiboi"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden font-bold text-red-900"
                  >
                    <option value="Patron">Patron</option>
                    <option value="Matron">Matron</option>
                    <option value="Youth Animator">Youth Animator</option>
                    <option value="Spiritual Director">Spiritual Director</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Parish Assigned *</label>
                <select
                  value={parishId}
                  onChange={(e) => setParishId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                >
                  {parishes.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Profession</label>
                  <input
                    type="text"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    placeholder="e.g. Teacher, Engineer"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="safeguardCheck"
                  checked={safeguardingCertified}
                  onChange={(e) => setSafeguardingCertified(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-600"
                />
                <label htmlFor="safeguardCheck" className="font-semibold text-slate-700 cursor-pointer">
                  Child Safeguarding & Protection Certified
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pastoral Duties / Remarks</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Youth leadership mentor, retreat coordinator..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Save Animator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
