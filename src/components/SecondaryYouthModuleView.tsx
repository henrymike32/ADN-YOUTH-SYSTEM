import React, { useState } from 'react';
import { useYouth } from '../context/YouthContext';
import { SecondarySchoolStudent } from '../types';
import { 
  School, 
  ArrowLeft, 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  X,
  BookOpen,
  LogIn,
  UserPlus,
  AlertCircle
} from 'lucide-react';

interface SecondaryYouthProps {
  onBackToHome: () => void;
}

export const SecondaryYouthModuleView: React.FC<SecondaryYouthProps> = ({ onBackToHome }) => {
  const { secondaryYouth, addSecondaryYouth, deleteSecondaryYouth, parishes, deaneries } = useYouth();

  const [searchTerm, setSearchTerm] = useState('');
  const [formFilter, setFormFilter] = useState('ALL');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'directory' | 'login'>('directory');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggedStudent, setLoggedStudent] = useState<SecondarySchoolStudent | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Female');
  const [schoolName, setSchoolName] = useState('Bishop Gatimu Ngandu Girls High School');
  const [formLevel, setFormLevel] = useState<SecondarySchoolStudent['formLevel']>('Form 3');
  const [phoneOrParentPhone, setPhoneOrParentPhone] = useState('+254 7');
  const [parentName, setParentName] = useState('');
  const [homeParish, setHomeParish] = useState(parishes[0]?.name || 'Consolata Cathedral');
  const [homeDeanery, setHomeDeanery] = useState(deaneries[0]?.name || 'Nyeri Central Deanery');
  const [ycsRole, setYcsRole] = useState('YCS Member');

  const schoolsList = [
    'Bishop Gatimu Ngandu Girls High School',
    'Nyeri High School',
    'Kagumo High School',
    'St. Mary\'s Boys Secondary School, Nyeri',
    'Tumutumu Girls High School',
    'Othaya Boys High School',
    'Mukurwe-ini Boys High School',
    'Karatina Girls Secondary School',
    'Tetu Girls High School',
    'Endarasha Boys Secondary School',
  ];

  const filteredStudents = secondaryYouth.filter((s) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      s.fullName.toLowerCase().includes(query) ||
      s.schoolName.toLowerCase().includes(query) ||
      s.homeParish.toLowerCase().includes(query) ||
      s.phoneOrParentPhone.includes(query);

    const matchesForm = formFilter === 'ALL' || s.formLevel === formFilter;

    return matchesSearch && matchesForm;
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phoneOrParentPhone.trim()) return;

    addSecondaryYouth({
      fullName: fullName.trim(),
      gender,
      schoolName,
      formLevel,
      phoneOrParentPhone: phoneOrParentPhone.trim(),
      parentName: parentName.trim() || 'Parent/Guardian',
      homeParish,
      homeDeanery,
      ycsRole: ycsRole.trim() || 'YCS Member',
    });

    setFullName('');
    setParentName('');
    setShowRegisterModal(false);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Student Name', 'Gender', 'High School', 'Form Level', 'Parent Contact', 'Parent Name', 'Home Parish', 'YCS Role'];
    const rows = filteredStudents.map((s) => [
      s.id,
      `"${s.fullName}"`,
      s.gender,
      `"${s.schoolName}"`,
      s.formLevel,
      s.phoneOrParentPhone,
      `"${s.parentName}"`,
      `"${s.homeParish}"`,
      `"${s.ycsRole}"`,
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Secondary_School_Youth_Registry_${new Date().toISOString().split('T')[0]}.csv`;
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
            <span className="p-2 bg-indigo-600 text-white rounded-lg shadow-xs">
              <School className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Youth in Secondary School (YCS) Registry
              </h1>
              <p className="text-xs text-slate-500">
                Catholic High School Students across Archdiocese of Nyeri & Holiday Recollections
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
              <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Register</span>
            </button>

            <button
              onClick={() => setActiveTab('login')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
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
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>Students Roster</span>
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

      {/* LOGIN VIEW FOR SECONDARY SCHOOL YOUTH */}
      {activeTab === 'login' && (
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="text-center space-y-1">
            <span className="inline-block p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <LogIn className="w-5 h-5" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              High School Youth / Parent Login
            </h3>
            <p className="text-xs text-slate-500">
              Enter registered parent/student phone number or Student ID.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setLoginError(null);
              setLoggedStudent(null);
              const clean = loginPhone.trim().toLowerCase();
              const found = secondaryYouth.find(
                (s) => s.phoneOrParentPhone.includes(clean) || s.id.toLowerCase() === clean
              );
              if (found) {
                setLoggedStudent(found);
              } else {
                setLoginError('Student record not found with this phone number or ID. Please register first.');
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Parent/Student Phone Number or Student ID *
              </label>
              <input
                type="text"
                required
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                placeholder="e.g. 0712345678 or YCS-2026-..."
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
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
            >
              Verify Student Enrollment
            </button>
          </form>

          {loggedStudent && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-900">{loggedStudent.fullName}</span>
                <span className="font-mono text-2xs text-indigo-700 font-bold bg-indigo-100 px-2 py-0.5 rounded">
                  {loggedStudent.id}
                </span>
              </div>
              <p className="text-slate-600"><strong>School:</strong> {loggedStudent.schoolName} ({loggedStudent.formLevel})</p>
              <p className="text-slate-600"><strong>Parent:</strong> {loggedStudent.parentName} ({loggedStudent.phoneOrParentPhone})</p>
              <p className="text-slate-600"><strong>Home Parish:</strong> {loggedStudent.homeParish} ({loggedStudent.homeDeanery})</p>
              <p className="text-slate-600"><strong>YCS Guild:</strong> {loggedStudent.ycsRole}</p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline"
            >
              Not yet registered? Register a high school student
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
              placeholder="Search by student name, high school, home parish..."
              className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={formFilter}
              onChange={(e) => setFormFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
            >
              <option value="ALL">All High School Forms (Form 1 - 4)</option>
              <option value="Form 1">Form 1</option>
              <option value="Form 2">Form 2</option>
              <option value="Form 3">Form 3</option>
              <option value="Form 4">Form 4</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
          <span>Showing {filteredStudents.length} of {secondaryYouth.length} enrolled high school students</span>
          <span className="font-mono text-slate-400">YCS Archdiocese of Nyeri</span>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Student ID & Name</th>
                <th className="py-3 px-4">High School</th>
                <th className="py-3 px-4">Form</th>
                <th className="py-3 px-4">Home Parish & Deanery</th>
                <th className="py-3 px-4">Parent / Contact</th>
                <th className="py-3 px-4">YCS Role</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{student.fullName}</div>
                    <div className="text-[11px] font-mono text-slate-400">{student.id} ({student.gender})</div>
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-800">
                    {student.schoolName}
                  </td>

                  <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                    {student.formLevel}
                  </td>

                  <td className="py-3 px-4 text-slate-600">
                    <div>{student.homeParish}</div>
                    <div className="text-[11px] text-slate-400">{student.homeDeanery}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-mono tabular-nums text-slate-800">{student.phoneOrParentPhone}</div>
                    <div className="text-[11px] text-slate-400">{student.parentName}</div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-800 border border-indigo-200/50">
                      {student.ycsRole}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${student.fullName} from high school list?`)) {
                          deleteSecondaryYouth(student.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      title="Remove Student"
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
                <h3 className="text-base font-bold text-slate-900">Enroll High School Youth (YCS)</h3>
                <p className="text-xs text-slate-500">Catholic Archdiocese of Nyeri</p>
              </div>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Catherine Wangeci Theuri"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Form Level</label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden font-bold"
                  >
                    <option value="Form 1">Form 1</option>
                    <option value="Form 2">Form 2</option>
                    <option value="Form 3">Form 3</option>
                    <option value="Form 4">Form 4</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">High School Name *</label>
                <select
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                >
                  {schoolsList.map((s, i) => (
                    <option key={i} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="e.g. Anthony Theuri (Father)"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Parent Phone *</label>
                  <input
                    type="text"
                    required
                    value={phoneOrParentPhone}
                    onChange={(e) => setPhoneOrParentPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden font-mono"
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
                  <label className="block font-semibold text-slate-700 mb-1">YCS Role</label>
                  <input
                    type="text"
                    value={ycsRole}
                    onChange={(e) => setYcsRole(e.target.value)}
                    placeholder="e.g. YCS Liturgy, Altar Server, Member"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
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
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Save Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
