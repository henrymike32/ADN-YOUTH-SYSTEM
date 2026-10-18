import React, { useState, useEffect } from 'react';
import { useYouth } from '../context/YouthContext';
import { YouthMember, YouthMovement, LeadershipRole } from '../types';
import { X, Save, AlertCircle } from 'lucide-react';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberToEdit?: YouthMember | null;
}

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
  memberToEdit,
}) => {
  const { deaneries, parishes, addMember, updateMember } = useYouth();

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [dob, setDob] = useState('2003-01-01');
  const [phone, setPhone] = useState('+254 ');
  const [email, setEmail] = useState('');
  const [deaneryId, setDeaneryId] = useState(deaneries[0]?.id || '');
  const [parishId, setParishId] = useState('');
  const [subParish, setSubParish] = useState('');
  const [movement, setMovement] = useState<YouthMovement>('CYO');
  const [occupation, setOccupation] = useState('');
  const [institution, setInstitution] = useState('');
  const [ministryGuild, setMinistryGuild] = useState('Youth Choir');
  const [leadershipRole, setLeadershipRole] = useState<LeadershipRole>('Member');
  
  // Sacraments
  const [baptism, setBaptism] = useState(true);
  const [baptismCertNo, setBaptismCertNo] = useState('');
  const [firstCommunion, setFirstCommunion] = useState(true);
  const [confirmation, setConfirmation] = useState(true);
  const [confirmationCardNo, setConfirmationCardNo] = useState('');
  const [matrimony, setMatrimony] = useState(false);

  // Emergency contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Parent');
  const [emergencyPhone, setEmergencyPhone] = useState('+254 ');

  // Skills
  const [skillsInput, setSkillsInput] = useState('');

  // Update form when memberToEdit changes or modal opens
  useEffect(() => {
    if (memberToEdit) {
      setFullName(memberToEdit.fullName);
      setGender(memberToEdit.gender);
      setDob(memberToEdit.dob);
      setPhone(memberToEdit.phone);
      setEmail(memberToEdit.email);
      setDeaneryId(memberToEdit.deaneryId);
      setParishId(memberToEdit.parishId);
      setSubParish(memberToEdit.subParish);
      setMovement(memberToEdit.movement);
      setOccupation(memberToEdit.occupation);
      setInstitution(memberToEdit.institution || '');
      setMinistryGuild(memberToEdit.ministryGuild);
      setLeadershipRole(memberToEdit.leadershipRole);

      setBaptism(memberToEdit.sacraments.baptism);
      setBaptismCertNo(memberToEdit.sacraments.baptismCertNo || '');
      setFirstCommunion(memberToEdit.sacraments.firstCommunion);
      setConfirmation(memberToEdit.sacraments.confirmation);
      setConfirmationCardNo(memberToEdit.sacraments.confirmationCardNo || '');
      setMatrimony(memberToEdit.sacraments.matrimony);

      setEmergencyName(memberToEdit.emergencyContact.name);
      setEmergencyRelation(memberToEdit.emergencyContact.relation);
      setEmergencyPhone(memberToEdit.emergencyContact.phone);
      setSkillsInput(memberToEdit.skills.join(', '));
    } else {
      // Defaults
      setFullName('');
      setGender('Male');
      setDob('2003-01-01');
      setPhone('+254 7');
      setEmail('');
      const defaultDeanery = deaneries[0]?.id || '';
      setDeaneryId(defaultDeanery);
      const defaultParish = parishes.find(p => p.deaneryId === defaultDeanery)?.id || parishes[0]?.id || '';
      setParishId(defaultParish);
      setSubParish('Central Outstation');
      setMovement('CYO');
      setOccupation('Undergraduate Student');
      setInstitution('Dedan Kimathi University of Technology (DeKUT)');
      setMinistryGuild('Youth Choir');
      setLeadershipRole('Member');
      setBaptism(true);
      setBaptismCertNo('');
      setFirstCommunion(true);
      setConfirmation(false);
      setConfirmationCardNo('');
      setMatrimony(false);
      setEmergencyName('');
      setEmergencyRelation('Parent');
      setEmergencyPhone('+254 7');
      setSkillsInput('Singing, Liturgical service');
    }
  }, [memberToEdit, isOpen, deaneries, parishes]);

  // When deanery changes, auto-select a valid parish from that deanery
  const handleDeaneryChange = (newDeaneryId: string) => {
    setDeaneryId(newDeaneryId);
    const validParish = parishes.find(p => p.deaneryId === newDeaneryId);
    if (validParish) {
      setParishId(validParish.id);
    }
  };

  const availableParishes = parishes.filter(p => p.deaneryId === deaneryId);

  // Compute age from DOB
  const calculateAge = (dobString: string): number => {
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return Math.max(12, age || 20);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !parishId) {
      alert('Please fill in Full Name, Phone, and Parish.');
      return;
    }

    const age = calculateAge(dob);
    const skills = skillsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      fullName: fullName.trim(),
      gender,
      dob,
      age,
      phone: phone.trim(),
      email: email.trim() || `${fullName.toLowerCase().replace(/\s+/g, '.')}@adnyouth.ke`,
      deaneryId,
      parishId,
      subParish: subParish.trim() || 'Central Parish',
      movement,
      occupation: occupation.trim() || 'Youth Member',
      institution: institution.trim(),
      ministryGuild,
      leadershipRole,
      sacraments: {
        baptism,
        baptismCertNo: baptismCertNo.trim(),
        firstCommunion,
        confirmation,
        confirmationCardNo: confirmationCardNo.trim(),
        matrimony,
      },
      emergencyContact: {
        name: emergencyName.trim() || 'Next of Kin',
        relation: emergencyRelation,
        phone: emergencyPhone.trim() || phone.trim(),
      },
      joinedDate: memberToEdit ? memberToEdit.joinedDate : new Date().toISOString().split('T')[0],
      status: memberToEdit ? memberToEdit.status : 'Active',
      skills: skills.length > 0 ? skills : ['Youth Ministry'],
    };

    if (memberToEdit) {
      updateMember(memberToEdit.id, payload);
    } else {
      addMember(payload);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {memberToEdit ? 'Edit Youth Member Profile' : 'Enroll New Catholic Youth Member'}
            </h3>
            <p className="text-xs text-slate-500">
              Catholic Archdiocese of Nyeri Youth Ministry Registry
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Section 1: Demographics */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              1. Personal & Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Benedict Kariuki Mwangi"
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone (M-Pesa / Call) *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 7XX XXX XXX"
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Diocesan Placement */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              2. Archdiocesan Placement & Parish
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deanery *
                </label>
                <select
                  value={deaneryId}
                  onChange={(e) => handleDeaneryChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                >
                  {deaneries.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parish *
                </label>
                <select
                  value={parishId}
                  onChange={(e) => setParishId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                >
                  {availableParishes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Outstation / Kigango
                </label>
                <input
                  type="text"
                  value={subParish}
                  onChange={(e) => setSubParish(e.target.value)}
                  placeholder="e.g. Ihururu Centre"
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Movement, Ministry & Leadership */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              3. Youth Wing, Ministry & Occupation
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Youth Movement *
                </label>
                <select
                  value={movement}
                  onChange={(e) => setMovement(e.target.value as YouthMovement)}
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                >
                  <option value="Junior Youth">Junior Youth (13-17)</option>
                  <option value="CYO">CYO Senior Youth (18-26)</option>
                  <option value="YCA">YCA Young Adults (27-35)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ministry / Guild
                </label>
                <select
                  value={ministryGuild}
                  onChange={(e) => setMinistryGuild(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                >
                  <option value="Youth Choir">Youth Choir</option>
                  <option value="Liturgical Dancers">Liturgical Dancers</option>
                  <option value="Altar Servers Guild">Altar Servers Guild</option>
                  <option value="St. Jude Youth Guild">St. Jude Youth Guild</option>
                  <option value="Youth Legion of Mary">Youth Legion of Mary</option>
                  <option value="Youth Media & Sound Team">Youth Media & Sound Team</option>
                  <option value="Scouts & Environmental Club">Scouts & Environmental Club</option>
                  <option value="General Fellowship">General Fellowship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Leadership Role
                </label>
                <select
                  value={leadershipRole}
                  onChange={(e) => setLeadershipRole(e.target.value as LeadershipRole)}
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                >
                  <option value="Member">Member</option>
                  <option value="Parish Chairperson">Parish Chairperson</option>
                  <option value="Parish Vice Chair">Parish Vice Chair</option>
                  <option value="Parish Secretary">Parish Secretary</option>
                  <option value="Parish Treasurer">Parish Treasurer</option>
                  <option value="Liturgical Coordinator">Liturgical Coordinator</option>
                  <option value="Sports & Talents Rep">Sports & Talents Rep</option>
                  <option value="Deanery Chairperson">Deanery Chairperson</option>
                  <option value="Archdiocesan Executive">Archdiocesan Executive</option>
                  <option value="Youth Animator / Patron">Youth Animator / Patron</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Occupation / Profession
                </label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. Student - DeKUT, Teacher, Electrician, Agri-trader"
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  School / College (if student)
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. Karatina University, DeKUT, KMTC"
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Sacraments */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              4. Sacramental Status
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={baptism}
                    onChange={(e) => setBaptism(e.target.checked)}
                    className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Sacrament of Baptism
                  </span>
                </label>
                {baptism && (
                  <input
                    type="text"
                    value={baptismCertNo}
                    onChange={(e) => setBaptismCertNo(e.target.value)}
                    placeholder="Baptism Certificate No. (optional)"
                    className="w-full px-2.5 py-1 text-xs text-slate-800 bg-white border border-slate-200 rounded focus:outline-hidden font-mono"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmation}
                    onChange={(e) => setConfirmation(e.target.checked)}
                    className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Sacrament of Confirmation
                  </span>
                </label>
                {confirmation && (
                  <input
                    type="text"
                    value={confirmationCardNo}
                    onChange={(e) => setConfirmationCardNo(e.target.value)}
                    placeholder="Confirmation Card No. (optional)"
                    className="w-full px-2.5 py-1 text-xs text-slate-800 bg-white border border-slate-200 rounded focus:outline-hidden font-mono"
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={firstCommunion}
                  onChange={(e) => setFirstCommunion(e.target.checked)}
                  id="communionCheck"
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                />
                <label htmlFor="communionCheck" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  First Holy Communion Received
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={matrimony}
                  onChange={(e) => setMatrimony(e.target.checked)}
                  id="matrimonyCheck"
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                />
                <label htmlFor="matrimonyCheck" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  Holy Matrimony (Church Wedding)
                </label>
              </div>
            </div>
          </div>

          {/* Section 5: Emergency & Talents */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              5. Emergency Contact & Talents
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="e.g. Jane Mwangi"
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relationship
                </label>
                <select
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                >
                  <option value="Parent">Parent</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Relative">Relative</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Phone
                </label>
                <input
                  type="text"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+254 7XX XXX XXX"
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Skills, Hobbies & Talents (Comma separated)
                </label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="e.g. Guitar, Public Speaking, Photography, First Aid, Football"
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>{memberToEdit ? 'Save Changes' : 'Register Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
