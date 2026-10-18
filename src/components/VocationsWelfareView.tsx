import React, { useState } from 'react';
import { useYouth } from '../context/YouthContext';
import { VocationAspirant, WelfareCase } from '../types';
import { 
  HeartHandshake, 
  Flame, 
  Sparkles, 
  Plus, 
  UserCheck, 
  Award, 
  GraduationCap, 
  Phone, 
  CheckCircle2, 
  Clock,
  X
} from 'lucide-react';

export const VocationsWelfareView: React.FC = () => {
  const { 
    vocations, 
    welfare, 
    members, 
    parishes, 
    deaneries, 
    addVocation, 
    updateVocationStage, 
    addWelfareCase, 
    updateWelfareStatus 
  } = useYouth();

  const [activeSubTab, setActiveSubTab] = useState<'vocations' | 'welfare' | 'talents'>('vocations');
  const [showVocationModal, setShowVocationModal] = useState(false);
  const [showWelfareModal, setShowWelfareModal] = useState(false);

  // New Vocation Form
  const [aspirantMemberId, setAspirantMemberId] = useState(members[0]?.id || '');
  const [vocationType, setVocationType] = useState<VocationAspirant['vocationType']>('Diocesan Priesthood');
  const [targetOrder, setTargetOrder] = useState('St. Paul\'s Senior Seminary, Nyeri');
  const [stage, setStage] = useState<VocationAspirant['stage']>('Initial Inquiry');
  const [spiritualDirector, setSpiritualDirector] = useState('Rev. Fr. Anthony Mwangi');
  const [vocationNotes, setVocationNotes] = useState('');

  // New Welfare Form
  const [welfareMemberId, setWelfareMemberId] = useState(members[0]?.id || '');
  const [welfareCategory, setWelfareCategory] = useState<WelfareCase['category']>('Education Bursary');
  const [welfareDescription, setWelfareDescription] = useState('');
  const [welfareUrgency, setWelfareUrgency] = useState<WelfareCase['urgency']>('Medium');
  const [welfareAmount, setWelfareAmount] = useState(15000);

  // Talent filter
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('ALL');

  // Compute all unique skills across all enrolled members
  const allSkills = Array.from(
    new Set(members.flatMap((m) => m.skills.map((s) => s.trim())))
  ).filter(Boolean);

  const handleCreateVocation = (e: React.FormEvent) => {
    e.preventDefault();
    const mem = members.find((m) => m.id === aspirantMemberId);
    if (!mem) return;

    addVocation({
      memberId: mem.id,
      aspirantName: mem.fullName,
      gender: mem.gender,
      parishId: mem.parishId,
      deaneryId: mem.deaneryId,
      vocationType,
      targetOrder,
      stage,
      spiritualDirector: spiritualDirector.trim() || 'Parish Youth Chaplain',
      contactPhone: mem.phone,
      notes: vocationNotes.trim() || 'Aspirant seeking vocational discernment in Nyeri Archdiocese.',
    });

    setShowVocationModal(false);
  };

  const handleCreateWelfare = (e: React.FormEvent) => {
    e.preventDefault();
    const mem = members.find((m) => m.id === welfareMemberId);
    if (!mem) return;

    addWelfareCase({
      memberId: mem.id,
      memberName: mem.fullName,
      parishId: mem.parishId,
      category: welfareCategory,
      description: welfareDescription.trim(),
      urgency: welfareUrgency,
      status: 'Open',
      amountRequired: Number(welfareAmount) || 0,
      amountDisbursed: 0,
    });

    setShowWelfareModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Vocations, Welfare & Talents Desk
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pastoral accompaniment: Priesthood & Religious discernment, Youth benevolence kitty, and skills bank
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('vocations')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'vocations'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vocations ({vocations.length})
          </button>
          <button
            onClick={() => setActiveSubTab('welfare')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'welfare'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Welfare ({welfare.length})
          </button>
          <button
            onClick={() => setActiveSubTab('talents')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'talents'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Talents & Skills
          </button>
        </div>
      </div>

      {/* 1. VOCATIONS DESK */}
      {activeSubTab === 'vocations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Discerning Aspirants to Priesthood & Religious Life
            </span>
            <button
              onClick={() => setShowVocationModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Enroll Vocation Aspirant</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vocations.map((v) => {
              const parish = parishes.find((p) => p.id === v.parishId);
              const deanery = deaneries.find((d) => d.id === v.deaneryId);

              return (
                <div
                  key={v.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{v.aspirantName}</h3>
                        <p className="text-xs text-slate-500">
                          {parish?.name} · {deanery?.name.replace(' Deanery', '')}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200/50">
                        {v.vocationType}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-1">
                      <div className="text-slate-600">
                        <span className="font-semibold text-slate-700">Formation Order:</span> {v.targetOrder}
                      </div>
                      <div className="text-slate-600">
                        <span className="font-semibold text-slate-700">Director:</span> {v.spiritualDirector}
                      </div>
                      <div className="text-slate-600 font-mono text-[11px]">
                        <span className="font-semibold text-slate-700">Phone:</span> {v.contactPhone}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 italic">
                      "{v.notes}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        STAGE
                      </span>
                      <select
                        value={v.stage}
                        onChange={(e) =>
                          updateVocationStage(v.id, e.target.value as VocationAspirant['stage'])
                        }
                        className="text-xs font-semibold text-slate-800 bg-transparent border-b border-slate-300 focus:outline-hidden py-0.5"
                      >
                        <option value="Initial Inquiry">Initial Inquiry</option>
                        <option value="Spiritual Direction">Spiritual Direction</option>
                        <option value="Seminary/Aspirancy Interview">Seminary Interview</option>
                        <option value="Accepted to Formation">Accepted to Formation</option>
                      </select>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">
                      Filed: {v.dateRecorded}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. WELFARE DESK */}
      {activeSubTab === 'welfare' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Youth Welfare, Bursary & Emergency Solidarity Cases
            </span>
            <button
              onClick={() => setShowWelfareModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>File Welfare Request</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Beneficiary & Parish</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Case Description</th>
                    <th className="py-3 px-4 text-right">Required (KES)</th>
                    <th className="py-3 px-4 text-right">Disbursed (KES)</th>
                    <th className="py-3 px-4 text-center">Urgency</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {welfare.map((caseItem) => {
                    const parish = parishes.find((p) => p.id === caseItem.parishId);

                    return (
                      <tr key={caseItem.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{caseItem.memberName}</div>
                          <div className="text-[11px] text-slate-400">{parish?.name}</div>
                        </td>

                        <td className="py-3 px-4 font-medium text-slate-700">
                          {caseItem.category}
                        </td>

                        <td className="py-3 px-4 text-slate-600 max-w-xs">
                          {caseItem.description}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-slate-900">
                          KES {caseItem.amountRequired?.toLocaleString() || '—'}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-emerald-700">
                          KES {caseItem.amountDisbursed?.toLocaleString() || '0'}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${
                              caseItem.urgency === 'High'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {caseItem.urgency}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                              caseItem.status === 'Resolved' || caseItem.status === 'Disbursed'
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {caseItem.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          {caseItem.status === 'Open' ? (
                            <button
                              onClick={() =>
                                updateWelfareStatus(
                                  caseItem.id,
                                  'Disbursed',
                                  caseItem.amountRequired
                                )
                              }
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                            >
                              Disburse Aid
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-semibold">
                              Completed ✓
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. TALENTS & SKILLS DIRECTORY */}
      {activeSubTab === 'talents' && (
        <div className="space-y-4">
          {/* Skill Filter Tags (Functional Buttons) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Filter Youth by Talents & Skills:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedSkillFilter('ALL')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  selectedSkillFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Talents ({members.length})
              </button>
              {allSkills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => setSelectedSkillFilter(skill)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                    selectedSkillFilter === skill
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Members matching talent */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {members
              .filter((m) =>
                selectedSkillFilter === 'ALL'
                  ? true
                  : m.skills.some((s) => s.toLowerCase() === selectedSkillFilter.toLowerCase())
              )
              .map((member) => {
                const parish = parishes.find((p) => p.id === member.parishId);

                return (
                  <div
                    key={member.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2 hover:border-slate-300 transition-colors"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{member.fullName}</h4>
                      <p className="text-xs text-slate-500">
                        {parish?.name} · {member.movement}
                      </p>
                    </div>

                    <div className="text-xs font-medium text-slate-700">
                      {member.occupation}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                      {member.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-800 rounded"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="pt-1 text-[11px] text-slate-400 font-mono">
                      Phone: {member.phone}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Vocation Modal */}
      {showVocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Enroll Vocation Aspirant</h3>
                <p className="text-xs text-slate-500">Catholic Archdiocese of Nyeri Vocations Directorate</p>
              </div>
              <button onClick={() => setShowVocationModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVocation} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Enrolled Youth Member *
                </label>
                <select
                  value={aspirantMemberId}
                  onChange={(e) => setAspirantMemberId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.movement} - {m.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vocation Calling *
                </label>
                <select
                  value={vocationType}
                  onChange={(e) =>
                    setVocationType(e.target.value as VocationAspirant['vocationType'])
                  }
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                >
                  <option value="Diocesan Priesthood">Diocesan Priesthood (Nyeri Archdiocese)</option>
                  <option value="Consolata Missionaries">Consolata Missionaries (IMC / MC)</option>
                  <option value="Religious Sisterhood">Religious Sisterhood (Little Sisters of St. Therese, Consolata)</option>
                  <option value="Religious Brotherhood">Religious Brotherhood</option>
                  <option value="Holy Matrimony Discerning">Holy Matrimony Discernment & Family Life</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Formation Seminary / Congregation
                </label>
                <input
                  type="text"
                  value={targetOrder}
                  onChange={(e) => setTargetOrder(e.target.value)}
                  placeholder="e.g. St. Paul's Senior Seminary Nyeri"
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Spiritual Director / Priest Assigned
                </label>
                <input
                  type="text"
                  value={spiritualDirector}
                  onChange={(e) => setSpiritualDirector(e.target.value)}
                  placeholder="Rev. Fr. Name"
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discernment Stage
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as VocationAspirant['stage'])}
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                >
                  <option value="Initial Inquiry">Initial Inquiry</option>
                  <option value="Spiritual Direction">Spiritual Direction</option>
                  <option value="Seminary/Aspirancy Interview">Seminary/Aspirancy Interview</option>
                  <option value="Accepted to Formation">Accepted to Formation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Spiritual Notes & Background
                </label>
                <textarea
                  rows={2}
                  value={vocationNotes}
                  onChange={(e) => setVocationNotes(e.target.value)}
                  placeholder="Aspirant spiritual background, ministries served in parish..."
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVocationModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Enroll Aspirant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Welfare Modal */}
      {showWelfareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">File Welfare Case</h3>
                <p className="text-xs text-slate-500">Youth Emergency & Solidarity Fund</p>
              </div>
              <button onClick={() => setShowWelfareModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWelfare} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Youth Member *
                </label>
                <select
                  value={welfareMemberId}
                  onChange={(e) => setWelfareMemberId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Welfare Category *
                </label>
                <select
                  value={welfareCategory}
                  onChange={(e) =>
                    setWelfareCategory(e.target.value as WelfareCase['category'])
                  }
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                >
                  <option value="Education Bursary">Education Bursary / School Fees</option>
                  <option value="Medical Emergency">Medical Emergency Assistance</option>
                  <option value="Bereavement Support">Bereavement Support</option>
                  <option value="Agri-Business Startup">Youth Agribusiness Seed Support</option>
                  <option value="Job Placement">Internship / Job Mentorship</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount Required (KES)
                  </label>
                  <input
                    type="number"
                    value={welfareAmount}
                    onChange={(e) => setWelfareAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Urgency Level
                  </label>
                  <select
                    value={welfareUrgency}
                    onChange={(e) =>
                      setWelfareUrgency(e.target.value as WelfareCase['urgency'])
                    }
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  >
                    <option value="High">High (Immediate)</option>
                    <option value="Medium">Medium</option>
                    <option value="Routine">Routine</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Case Description & Justification *
                </label>
                <textarea
                  rows={3}
                  required
                  value={welfareDescription}
                  onChange={(e) => setWelfareDescription(e.target.value)}
                  placeholder="Provide background, school fee balance, hospital admission details..."
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWelfareModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
