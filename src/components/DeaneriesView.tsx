import React, { useState } from 'react';
import { useYouth } from '../context/YouthContext';
import { Deanery, Parish } from '../types';
import { 
  Church, 
  MapPin, 
  Phone, 
  Users, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Receipt,
  UserCheck,
  CheckCircle2
} from 'lucide-react';

export const DeaneriesView: React.FC = () => {
  const { deaneries, parishes, members, addParish } = useYouth();

  const [selectedDeaneryId, setSelectedDeaneryId] = useState<string>(deaneries[0]?.id || '');
  const [expandedParishId, setExpandedParishId] = useState<string | null>(null);
  const [showAddParishModal, setShowAddParishModal] = useState(false);

  // New parish form state
  const [newParishName, setNewParishName] = useState('');
  const [newParishPatron, setNewParishPatron] = useState('');
  const [newParishPriest, setNewParishPriest] = useState('');
  const [newParishChaplain, setNewParishChaplain] = useState('');
  const [newParishChair, setNewParishChair] = useState('');
  const [newParishChairPhone, setNewParishChairPhone] = useState('+254 7');
  const [newParishLevy, setNewParishLevy] = useState(35000);
  const [newParishOutstations, setNewParishOutstations] = useState('Central, St. Jude Outstation');

  const selectedDeanery = deaneries.find((d) => d.id === selectedDeaneryId) || deaneries[0];
  const deaneryParishes = parishes.filter((p) => p.deaneryId === selectedDeanery?.id);

  const handleCreateParish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParishName.trim() || !selectedDeanery) return;

    const outstationsList = newParishOutstations
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    addParish({
      name: newParishName.trim(),
      deaneryId: selectedDeanery.id,
      patronSaint: newParishPatron.trim() || 'St. Peter',
      priestInCharge: newParishPriest.trim() || 'Rev. Fr. In Charge',
      youthChaplain: newParishChaplain.trim() || 'Rev. Fr. Youth Chaplain',
      chairpersonName: newParishChair.trim() || 'Youth Chairperson',
      chairpersonPhone: newParishChairPhone.trim(),
      outstationsCount: outstationsList.length || 3,
      outstations: outstationsList.length > 0 ? outstationsList : ['Central Main', 'Sub-station A'],
      annualLevyTarget: Number(newParishLevy) || 35000,
      annualLevyPaid: 0,
    });

    setNewParishName('');
    setNewParishPatron('');
    setNewParishPriest('');
    setNewParishChaplain('');
    setNewParishChair('');
    setShowAddParishModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Deaneries & Parishes Hierarchy
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ecclesiastical governance of the Catholic Archdiocese of Nyeri Youth Ministry
          </p>
        </div>

        <button
          onClick={() => setShowAddParishModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span>Add Parish to {selectedDeanery?.name}</span>
        </button>
      </div>

      {/* Deanery Selector Strip (Horizontal clickable segmented cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {deaneries.map((d) => {
          const isSelected = d.id === selectedDeaneryId;
          const parishCount = parishes.filter((p) => p.deaneryId === d.id).length;
          const youthCount = members.filter((m) => m.deaneryId === d.id).length;

          return (
            <button
              key={d.id}
              onClick={() => {
                setSelectedDeaneryId(d.id);
                setExpandedParishId(null);
              }}
              className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className={`text-xs font-bold block truncate ${isSelected ? 'text-amber-300' : 'text-slate-900'}`}>
                {d.name.replace(' Deanery', '')}
              </span>
              <div className={`mt-1 text-[11px] font-mono tabular-nums ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                {parishCount} Parishes
              </div>
              <div className={`text-[10px] ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                {youthCount} Youth
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Deanery Overview Card */}
      {selectedDeanery && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wide">
                <span>Deanery Profile</span>
                <span aria-hidden="true">·</span>
                <span>Archdiocese of Nyeri</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                {selectedDeanery.name}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Headquarters: {selectedDeanery.headquarters}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">DEAN</span>
                <span className="font-semibold text-slate-800">{selectedDeanery.deanName}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">YOUTH CHAPLAIN</span>
                <span className="font-semibold text-slate-800">{selectedDeanery.deaneryYouthChaplain}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">DEANERY CHAIRPERSON</span>
                <span className="font-semibold text-slate-800">{selectedDeanery.deaneryChairperson}</span>
                <span className="block text-[11px] text-slate-500 font-mono">{selectedDeanery.deaneryChairpersonPhone}</span>
              </div>
            </div>
          </div>

          {/* List of Parishes under this Deanery */}
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Affiliated Parishes in {selectedDeanery.name} ({deaneryParishes.length})
            </h3>

            <div className="space-y-3">
              {deaneryParishes.map((parish) => {
                const isExpanded = expandedParishId === parish.id;
                const parishYouth = members.filter((m) => m.parishId === parish.id);
                const levyPct = parish.annualLevyTarget > 0 
                  ? Math.min(100, Math.round((parish.annualLevyPaid / parish.annualLevyTarget) * 100))
                  : 0;

                return (
                  <div
                    key={parish.id}
                    className="border border-slate-200 rounded-xl overflow-hidden transition-all"
                  >
                    {/* Parish Header Row */}
                    <div
                      onClick={() => setExpandedParishId(isExpanded ? null : parish.id)}
                      className="p-4 bg-slate-50/70 hover:bg-slate-100/80 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Church className="w-5 h-5 text-amber-600 shrink-0" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{parish.name}</h4>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>Patron: {parish.patronSaint}</span>
                            <span aria-hidden="true">·</span>
                            <span>{parish.outstationsCount} Outstations</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Youth Count */}
                        <div className="text-right hidden sm:block">
                          <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                            {parishYouth.length} Enrolled
                          </span>
                          <span className="text-[11px] text-slate-500 block">Youth Registry</span>
                        </div>

                        {/* Levy Clearance Badge */}
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-slate-800 tabular-nums">
                            KES {parish.annualLevyPaid.toLocaleString()} / {parish.annualLevyTarget.toLocaleString()}
                          </span>
                          <span className="text-[11px] block font-medium">
                            {levyPct >= 100 ? (
                              <span className="text-emerald-700">Quota Cleared (100%)</span>
                            ) : (
                              <span className="text-amber-700">{levyPct}% Paid</span>
                            )}
                          </span>
                        </div>

                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Parish Expanded Details */}
                    {isExpanded && (
                      <div className="p-5 bg-white border-t border-slate-100 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                              PARISH PRIEST
                            </span>
                            <span className="font-semibold text-slate-900">{parish.priestInCharge}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                              PARISH YOUTH CHAPLAIN
                            </span>
                            <span className="font-semibold text-slate-900">{parish.youthChaplain}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                              PARISH YOUTH CHAIRPERSON
                            </span>
                            <span className="font-semibold text-slate-900">{parish.chairpersonName}</span>
                            <span className="text-slate-500 font-mono block text-[11px]">{parish.chairpersonPhone}</span>
                          </div>
                        </div>

                        {/* Outstations list */}
                        <div>
                          <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">
                            SUB-PARISHES & OUTSTATIONS (VIGANGO)
                          </span>
                          <div className="flex flex-wrap gap-1.5 text-xs">
                            {parish.outstations.map((outstation, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium"
                              >
                                {outstation}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Enrolled youth preview */}
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-2">
                            ENROLLED PARISH YOUTH LEADERS & MEMBERS ({parishYouth.length})
                          </span>
                          {parishYouth.length === 0 ? (
                            <p className="text-xs text-slate-500 italic">
                              No members registered under this parish yet.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {parishYouth.map((member) => (
                                <div
                                  key={member.id}
                                  className="p-2 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <div className="font-semibold text-slate-900">{member.fullName}</div>
                                    <div className="text-[11px] text-slate-500">
                                      {member.movement} · {member.leadershipRole}
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {member.phone.slice(-6)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Parish Modal */}
      {showAddParishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Add Parish to {selectedDeanery?.name}
                </h3>
                <p className="text-xs text-slate-500">Archdiocese of Nyeri Youth Ministry Database</p>
              </div>
              <button
                onClick={() => setShowAddParishModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateParish} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parish Official Name *
                </label>
                <input
                  type="text"
                  required
                  value={newParishName}
                  onChange={(e) => setNewParishName(e.target.value)}
                  placeholder="e.g. St. Jude Thaddeus Parish, Nyeri"
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Patron Saint
                  </label>
                  <input
                    type="text"
                    value={newParishPatron}
                    onChange={(e) => setNewParishPatron(e.target.value)}
                    placeholder="e.g. St. Jude Thaddeus"
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Annual Levy Target (KES)
                  </label>
                  <input
                    type="number"
                    value={newParishLevy}
                    onChange={(e) => setNewParishLevy(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priest-in-Charge
                  </label>
                  <input
                    type="text"
                    value={newParishPriest}
                    onChange={(e) => setNewParishPriest(e.target.value)}
                    placeholder="Rev. Fr. Name"
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parish Youth Chaplain
                  </label>
                  <input
                    type="text"
                    value={newParishChaplain}
                    onChange={(e) => setNewParishChaplain(e.target.value)}
                    placeholder="Rev. Fr. Youth Chaplain"
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parish Youth Chairperson
                  </label>
                  <input
                    type="text"
                    value={newParishChair}
                    onChange={(e) => setNewParishChair(e.target.value)}
                    placeholder="Youth Leader Name"
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chairperson Phone
                  </label>
                  <input
                    type="text"
                    value={newParishChairPhone}
                    onChange={(e) => setNewParishChairPhone(e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Outstations / Vigango (comma separated)
                </label>
                <input
                  type="text"
                  value={newParishOutstations}
                  onChange={(e) => setNewParishOutstations(e.target.value)}
                  placeholder="e.g. Central Parish, St. Teresa Outstation, Gatitu"
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddParishModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Save Parish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
