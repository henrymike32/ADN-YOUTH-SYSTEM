import React, { useState } from 'react';
import { useYouth } from '../context/YouthContext';
import { NiccaStudent } from '../types';
import { 
  GraduationCap, 
  Search, 
  Plus, 
  Download, 
  Trash2, 
  Building, 
  Phone, 
  Mail, 
  BookOpen,
  ArrowLeft,
  X,
  CheckCircle2,
  LogIn,
  UserPlus,
  AlertCircle
} from 'lucide-react';

interface NiccaModuleViewProps {
  onBackToHome: () => void;
}

export const NiccaModuleView: React.FC<NiccaModuleViewProps> = ({ onBackToHome }) => {
  const { niccaStudents, addNiccaStudent, deleteNiccaStudent, parishes, deaneries } = useYouth();

  const [searchTerm, setSearchTerm] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('ALL');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'directory' | 'login'>('directory');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggedStudent, setLoggedStudent] = useState<NiccaStudent | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [institution, setInstitution] = useState('Dedan Kimathi University of Technology (DeKUT)');
  const [course, setCourse] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('Year 1');
  const [phone, setPhone] = useState('+254 7');
  const [email, setEmail] = useState('');
  const [homeParish, setHomeParish] = useState(parishes[0]?.name || 'Consolata Cathedral');
  const [homeDeanery, setHomeDeanery] = useState(deaneries[0]?.name || 'Nyeri Central Deanery');
  const [campusMinistryRole, setCampusMinistryRole] = useState('Member');

  const institutionsList = [
    'Dedan Kimathi University of Technology (DeKUT)',
    'Karatina University (Main Campus, Kagochi)',
    'Kenya Medical Training College (KMTC) Nyeri',
    'Consolata Hospital Mathari Nursing College',
    'The Nyeri National Polytechnic',
    'Kagumo Teachers Training College',
  ];

  const filteredStudents = niccaStudents.filter((s) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      s.fullName.toLowerCase().includes(query) ||
      s.course.toLowerCase().includes(query) ||
      s.id.toLowerCase().includes(query) ||
      s.phone.includes(query);

    const matchesInstitution =
      institutionFilter === 'ALL' || s.institution === institutionFilter;

    return matchesSearch && matchesInstitution;
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !course.trim()) return;

    addNiccaStudent({
      fullName: fullName.trim(),
      gender,
      institution,
      course: course.trim(),
      yearOfStudy,
      phone: phone.trim(),
      email: email.trim() || `${fullName.toLowerCase().replace(/\s+/g, '.')}@student.ac.ke`,
      homeParish,
      homeDeanery,
      campusMinistryRole,
    });

    setFullName('');
    setCourse('');
    setShowRegisterModal(false);
  };

  const handleExportCSV = () => {
    const headers = ['NICCA ID', 'Full Name', 'Gender', 'Campus / College', 'Course', 'Year', 'Phone', 'Email', 'Home Parish', 'Role'];
    const rows = filteredStudents.map(s => [
      s.id,
      `"${s.fullName}"`,
      s.gender,
      `"${s.institution}"`,
      `"${s.course}"`,
      s.yearOfStudy,
      s.phone,
      s.email,
      `"${s.homeParish}"`,
      `"${s.campusMinistryRole}"`
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `NICCA_Catholic_Students_Registry_${new Date().toISOString().split('T')[0]}.csv`;
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
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                NICCA — Nyeri Inter-Colleges and Catholic Association
              </h1>
              <p className="text-xs text-slate-500">
                Catholic Students & College Chapters Registration in Archdiocese of Nyeri
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
              <span>Register</span>
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
              <span>Login / Pass</span>
            </button>

            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'directory'
                  ? 'bg-red-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Campus Directory</span>
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

      {/* LOGIN VIEW FOR NICCA */}
      {activeTab === 'login' && (
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="text-center space-y-1">
            <span className="inline-block p-2.5 bg-red-100 text-red-700 rounded-xl">
              <LogIn className="w-5 h-5" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              NICCA Student Login
            </h3>
            <p className="text-xs text-slate-500">
              Enter registered phone number or NICCA Student ID to look up your details.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setLoginError(null);
              setLoggedStudent(null);
              const clean = loginPhone.trim().toLowerCase();
              const found = niccaStudents.find(
                (s) => s.phone.includes(clean) || s.id.toLowerCase() === clean
              );
              if (found) {
                setLoggedStudent(found);
              } else {
                setLoginError('Student not found with this phone number or ID. Please register below.');
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number or Student ID *
              </label>
              <input
                type="text"
                required
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                placeholder="e.g. 0744556677 or NICCA-2026-..."
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
              Verify Student Accreditation
            </button>
          </form>

          {loggedStudent && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-900">{loggedStudent.fullName}</span>
                <span className="font-mono text-2xs text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded">
                  {loggedStudent.id}
                </span>
              </div>
              <p className="text-slate-600"><strong>Institution:</strong> {loggedStudent.institution}</p>
              <p className="text-slate-600"><strong>Course:</strong> {loggedStudent.course} ({loggedStudent.yearOfStudy})</p>
              <p className="text-slate-600"><strong>Parish / Deanery:</strong> {loggedStudent.homeParish} ({loggedStudent.homeDeanery})</p>
              <p className="text-slate-600"><strong>Campus Role:</strong> {loggedStudent.campusMinistryRole}</p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="text-xs font-semibold text-red-700 hover:text-red-900 underline"
            >
              Not registered yet? Register as a Catholic college student
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, course, ID, or phone..."
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
            />
          </div>

          <div className="md:col-span-6">
            <select
              value={institutionFilter}
              onChange={(e) => setInstitutionFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
            >
              <option value="ALL">All Colleges & Universities ({institutionsList.length} Institutions)</option>
              {institutionsList.map((inst, i) => (
                <option key={i} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
          <span>Showing {filteredStudents.length} of {niccaStudents.length} enrolled college students</span>
          <span className="font-mono text-slate-400">NICCA Archdiocesan Chapter</span>
        </div>
      </div>

      {/* Students Data Grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Student ID & Name</th>
                <th className="py-3 px-4">Institution & Campus</th>
                <th className="py-3 px-4">Course & Year</th>
                <th className="py-3 px-4">Home Parish</th>
                <th className="py-3 px-4">Campus Role</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No students registered under this filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{student.fullName}</div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {student.id} · {student.phone}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{student.institution}</div>
                      <div className="text-[11px] text-slate-400">{student.email}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{student.course}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{student.yearOfStudy}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <div>{student.homeParish}</div>
                      <div className="text-[11px] text-slate-400">{student.homeDeanery}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-800 border border-red-200/50">
                        {student.campusMinistryRole}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${student.fullName} from NICCA registry?`)) {
                            deleteNiccaStudent(student.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Student Registration */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Register NICCA Campus Student</h3>
                <p className="text-xs text-slate-500">Catholic Inter-Colleges Association Nyeri</p>
              </div>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Student Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Francis Kimani Wachira"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Year of Study</label>
                  <select
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  >
                    <option value="Year 1">Year 1</option>
                    <option value="Year 2">Year 2</option>
                    <option value="Year 3">Year 3</option>
                    <option value="Year 4">Year 4</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">College / University Institution *</label>
                <select
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                >
                  {institutionsList.map((inst, i) => (
                    <option key={i} value={inst}>{inst}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Degree / Diploma Course *</label>
                <input
                  type="text"
                  required
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. BSc. Computer Science"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Campus Ministry Role</label>
                  <input
                    type="text"
                    value={campusMinistryRole}
                    onChange={(e) => setCampusMinistryRole(e.target.value)}
                    placeholder="e.g. Choir, Liturgy, Member"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Home Parish</label>
                  <select
                    value={homeParish}
                    onChange={(e) => setHomeParish(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  >
                    {parishes.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Home Deanery</label>
                  <select
                    value={homeDeanery}
                    onChange={(e) => setHomeDeanery(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  >
                    {deaneries.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
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
                  Complete Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
