import React, { useState } from 'react';
import { useYouth } from '../context/YouthContext';
import { CareerDayRegistration } from '../types';
import { 
  Briefcase, 
  ArrowLeft, 
  Plus, 
  Search, 
  Download, 
  UserCheck, 
  GraduationCap, 
  Trash2,
  X,
  LogIn,
  UserPlus,
  AlertCircle
} from 'lucide-react';

interface CareerDayProps {
  onBackToHome: () => void;
}

export const CareerDayModuleView: React.FC<CareerDayProps> = ({ onBackToHome }) => {
  const { careerRegistrations, addCareerRegistration, deleteCareerRegistration, parishes } = useYouth();

  const [searchTerm, setSearchTerm] = useState('');
  const [fieldFilter, setFieldFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'directory' | 'login'>('directory');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggedReg, setLoggedReg] = useState<CareerDayRegistration | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [phone, setPhone] = useState('+254 7');
  const [email, setEmail] = useState('');
  const [parishId, setParishId] = useState(parishes[0]?.id || '');
  const [careerField, setCareerField] = useState('Information Technology & Software');
  const [type, setType] = useState<'Mentor (Professional)' | 'Mentee (Student/Seeker)'>('Mentee (Student/Seeker)');
  const [currentOrganization, setCurrentOrganization] = useState('');
  const [skillsOrGoals, setSkillsOrGoals] = useState('');

  const careerFieldsList = [
    'Information Technology & Software',
    'Healthcare & Medicine',
    'Agribusiness & Horticulture',
    'Engineering & Technical Trades',
    'Business, Banking & Accounting',
    'Education & Teaching',
    'Law & Public Administration',
    'Creative Arts, Media & Design',
  ];

  const filteredRegistrations = careerRegistrations.filter((r) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      r.fullName.toLowerCase().includes(query) ||
      r.currentOrganization.toLowerCase().includes(query) ||
      r.skillsOrGoals.toLowerCase().includes(query) ||
      r.phone.includes(query);

    const matchesField = fieldFilter === 'ALL' || r.careerField === fieldFilter;
    const matchesType = typeFilter === 'ALL' || r.type === typeFilter;

    return matchesSearch && matchesField && matchesType;
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;

    addCareerRegistration({
      fullName: fullName.trim(),
      gender,
      phone: phone.trim(),
      email: email.trim() || `${fullName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      parishId,
      careerField,
      type,
      currentOrganization: currentOrganization.trim() || 'Archdiocese of Nyeri Youth',
      skillsOrGoals: skillsOrGoals.trim() || 'Networking and career advancement.',
    });

    setFullName('');
    setCurrentOrganization('');
    setSkillsOrGoals('');
    setShowRegisterModal(false);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Full Name', 'Type', 'Career Field', 'Organization / Campus', 'Phone', 'Email', 'Goals/Mentorship'];
    const rows = filteredRegistrations.map((r) => [
      r.id,
      `"${r.fullName}"`,
      r.type,
      `"${r.careerField}"`,
      `"${r.currentOrganization}"`,
      r.phone,
      r.email,
      `"${r.skillsOrGoals}"`,
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Career_Day_Registrations_${new Date().toISOString().split('T')[0]}.csv`;
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
            <span className="p-2 bg-blue-600 text-white rounded-lg shadow-xs">
              <Briefcase className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Archdiocese of Nyeri Youth CAREER DAY
              </h1>
              <p className="text-xs text-slate-500">
                Professional Mentorship, Skills Fair, Resume Clinic & Job Linkage
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
              <UserPlus className="w-3.5 h-3.5 text-blue-600" />
              <span>Register</span>
            </button>

            <button
              onClick={() => setActiveTab('login')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
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
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
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

      {/* LOGIN VIEW FOR CAREER DAY */}
      {activeTab === 'login' && (
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="text-center space-y-1">
            <span className="inline-block p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <LogIn className="w-5 h-5" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Career Day Participant Login
            </h3>
            <p className="text-xs text-slate-500">
              Enter registered phone number or Registration ID to look up your badge.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setLoginError(null);
              setLoggedReg(null);
              const clean = loginPhone.trim().toLowerCase();
              const found = careerRegistrations.find(
                (r) => r.phone.includes(clean) || r.id.toLowerCase() === clean
              );
              if (found) {
                setLoggedReg(found);
              } else {
                setLoginError('Participant not found with this phone number or ID. Please register first.');
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number or Registration ID *
              </label>
              <input
                type="text"
                required
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                placeholder="e.g. 0712345678 or CAR-2026-..."
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
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
            >
              Verify Career Day Pass
            </button>
          </form>

          {loggedReg && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-900">{loggedReg.fullName}</span>
                <span className="font-mono text-2xs text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded">
                  {loggedReg.id}
                </span>
              </div>
              <p className="text-slate-600"><strong>Type:</strong> {loggedReg.type}</p>
              <p className="text-slate-600"><strong>Field:</strong> {loggedReg.careerField}</p>
              <p className="text-slate-600"><strong>Organization / Goal:</strong> {loggedReg.currentOrganization || loggedReg.skillsOrGoals}</p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline"
            >
              Not registered yet? Register as a Mentor or Mentee
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, organization, skills..."
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
            >
              <option value="ALL">All Career Fields ({careerFieldsList.length} Industries)</option>
              {careerFieldsList.map((f, i) => (
                <option key={i} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
            >
              <option value="ALL">Mentors & Mentees</option>
              <option value="Mentor (Professional)">Mentors (Professionals)</option>
              <option value="Mentee (Student/Seeker)">Mentees (Students/Seekers)</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
          <span>Showing {filteredRegistrations.length} registered delegates</span>
          <span className="font-mono text-slate-400">Career & Mentorship Directorate</span>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Delegate Name</th>
                <th className="py-3 px-4">Role / Type</th>
                <th className="py-3 px-4">Career Field</th>
                <th className="py-3 px-4">Organization / Institution</th>
                <th className="py-3 px-4">Mentorship Goal / Bio</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRegistrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{reg.fullName}</div>
                    <div className="text-[11px] font-mono text-slate-500">{reg.phone}</div>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        reg.type.includes('Mentor')
                          ? 'bg-blue-50 text-blue-800 border border-blue-200/50'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200/50'
                      }`}
                    >
                      {reg.type}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-800">
                    {reg.careerField}
                  </td>

                  <td className="py-3 px-4 text-slate-600">
                    {reg.currentOrganization}
                  </td>

                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={reg.skillsOrGoals}>
                    {reg.skillsOrGoals}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Remove registration for ${reg.fullName}?`)) {
                          deleteCareerRegistration(reg.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      title="Remove Registration"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Career Day Registration</h3>
                <p className="text-xs text-slate-500">Archdiocese of Nyeri Youth</p>
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
                  placeholder="e.g. Timothy Wanjohi"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Participation Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden font-semibold text-blue-900"
                  >
                    <option value="Mentee (Student/Seeker)">Mentee (Student / Seeker)</option>
                    <option value="Mentor (Professional)">Mentor (Professional)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Career Field / Industry *</label>
                <select
                  value={careerField}
                  onChange={(e) => setCareerField(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                >
                  {careerFieldsList.map((f, i) => (
                    <option key={i} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Workplace / University Campus</label>
                <input
                  type="text"
                  value={currentOrganization}
                  onChange={(e) => setCurrentOrganization(e.target.value)}
                  placeholder="e.g. DeKUT Alum / Hospital / Self Employed"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mentorship Goal or Skills Offered</label>
                <textarea
                  rows={2}
                  value={skillsOrGoals}
                  onChange={(e) => setSkillsOrGoals(e.target.value)}
                  placeholder="What advice are you looking for or sharing?"
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
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Submit Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
