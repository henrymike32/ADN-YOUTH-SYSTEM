import React from 'react';
import { useYouth } from '../context/YouthContext';
import youthRallyHero from '../assets/images/nyeri_youth_rally_hero_1792312414784.jpg';
import { 
  Users, 
  MapPin, 
  Calendar, 
  Receipt, 
  Award, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Flame,
  FileSpreadsheet
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenNewMemberModal: () => void;
  onOpenRemittanceModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenNewMemberModal,
  onOpenRemittanceModal,
}) => {
  const { members, deaneries, parishes, events, remittances, currentRole } = useYouth();

  // Metrics computation
  const totalYouth = members.length;
  const activeParishesCount = parishes.length;
  const activeDeaneriesCount = deaneries.length;
  
  const totalRemittancesKES = remittances.reduce((sum, r) => sum + r.amount, 0);
  const totalTargetKES = deaneries.reduce((sum, d) => sum + d.annualTarget, 0);
  const targetPercentage = Math.min(100, Math.round((totalRemittancesKES / totalTargetKES) * 100));

  const confirmedCount = members.filter(m => m.sacraments.confirmation).length;
  const confirmationPct = totalYouth > 0 ? Math.round((confirmedCount / totalYouth) * 100) : 0;

  const juniorYouthCount = members.filter(m => m.movement === 'Junior Youth').length;
  const cyoCount = members.filter(m => m.movement === 'CYO').length;
  const ycaCount = members.filter(m => m.movement === 'YCA').length;

  const upcomingEvents = events.filter(e => e.status === 'Upcoming');

  return (
    <div className="space-y-8">
      {/* Hero Banner Section: 2-column balanced layout with photography & Diocesan vision */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          
          {/* Left Column: Pastoral Greeting & Vision */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 tracking-wide uppercase">
                <span>Catholic Archdiocese of Nyeri</span>
                <span aria-hidden="true">·</span>
                <span>Youth Chaplaincy & Ministry</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
                "Stand Firm in the Faith, Be Courageous, Be Strong"
              </h1>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Welcome to the official youth management and pastoral coordination portal for the Catholic Archdiocese of Nyeri. Uniting youth across 7 Deaneries from the slopes of Mount Kenya, Karatina, Mukurwe-ini, Tetu, Othaya to Kieni plains.
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenNewMemberModal}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
              >
                Register New Member
              </button>
              <button
                onClick={() => onNavigateTab('events')}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                View Archdiocesan Rallies
              </button>
              <button
                onClick={onOpenRemittanceModal}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Record Parish Levy
              </button>
            </div>
          </div>

          {/* Right Column: Hero Image of Nyeri Catholic Youth */}
          <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-full">
            <img
              src={youthRallyHero}
              alt="Archdiocese of Nyeri Youth Fellowship near Mount Kenya"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent flex flex-col justify-end p-4 text-white">
              <span className="text-xs font-medium tracking-wide text-amber-300">
                Archdiocese of Nyeri Youth Rally
              </span>
              <span className="text-sm font-semibold">
                Blessed Sister Irene Stefani Mathari Grounds
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Numerical Grid (Tabular numerals, zero-pill metadata) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Enrolled Youth</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {totalYouth.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span>Across 7 Deaneries</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-medium">100% Active</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Parishes & Vigango</span>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {activeParishesCount}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span>7 Deanery Headqtrs</span>
            <span aria-hidden="true">·</span>
            <span>82+ Outstations</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Levies & Remittances</span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums">
            KES {totalRemittancesKES.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="font-medium text-amber-700">{targetPercentage}%</span>
            <span>of KES {totalTargetKES.toLocaleString()}</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Sacrament of Confirmation</span>
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {confirmationPct}%
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span>{confirmedCount} of {totalYouth} Confirmed</span>
            <span aria-hidden="true">·</span>
            <span>Full Communion</span>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Deanery Breakdown & Movement Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Deaneries & Parish Targets Progress */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Deanery Remittance & Quota Progress</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Archdiocesan annual youth levies performance across the 7 pastoral deaneries
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('finance')}
              className="text-xs font-semibold text-slate-900 hover:text-amber-700 flex items-center gap-1 transition-colors"
            >
              <span>View Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {deaneries.map((d) => {
              // Calculate total paid by parishes in this deanery
              const deaneryParishes = parishes.filter(p => p.deaneryId === d.id);
              const totalPaid = deaneryParishes.reduce((sum, p) => sum + p.annualLevyPaid, 0);
              const pct = d.annualTarget > 0 ? Math.min(100, Math.round((totalPaid / d.annualTarget) * 100)) : 0;
              const youthInDeanery = members.filter(m => m.deaneryId === d.id).length;

              return (
                <div key={d.id} className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <span>{d.name}</span>
                      <span className="text-slate-400 font-normal">·</span>
                      <span className="text-slate-500 font-normal">{youthInDeanery} youth enrolled</span>
                    </div>
                    <div className="font-mono tabular-nums text-slate-700">
                      KES {totalPaid.toLocaleString()} / {d.annualTarget.toLocaleString()} ({pct}%)
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        pct >= 90
                          ? 'bg-emerald-600'
                          : pct >= 60
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Chaplain: {d.deaneryYouthChaplain}</span>
                    <span>Chair: {d.deaneryChairperson}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Youth Movement Cohorts & Upcoming Diocesan Gatherings */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Movement Cohorts Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1">Youth Movement Distribution</h2>
            <p className="text-xs text-slate-500 mb-4">
              Registered members by Archdiocesan age wing
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                <span className="text-xs text-slate-500 block font-medium">Junior Youth</span>
                <span className="text-xl font-bold font-mono tabular-nums text-slate-900 block my-1">
                  {juniorYouthCount}
                </span>
                <span className="text-[11px] text-slate-400">Ages 13-17</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                <span className="text-xs text-slate-500 block font-medium">CYO (Senior)</span>
                <span className="text-xl font-bold font-mono tabular-nums text-slate-900 block my-1">
                  {cyoCount}
                </span>
                <span className="text-[11px] text-slate-400">Ages 18-26</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                <span className="text-xs text-slate-500 block font-medium">YCA (Adults)</span>
                <span className="text-xl font-bold font-mono tabular-nums text-slate-900 block my-1">
                  {ycaCount}
                </span>
                <span className="text-[11px] text-slate-400">Ages 27-35</span>
              </div>
            </div>
          </div>

          {/* Upcoming Archdiocesan Gatherings */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Upcoming Events & Rallies</h2>
              <button
                onClick={() => onNavigateTab('events')}
                className="text-xs font-semibold text-slate-900 hover:text-amber-700 transition-colors"
              >
                All Events
              </button>
            </div>

            <div className="space-y-3">
              {upcomingEvents.slice(0, 3).map((event) => {
                const dateStr = new Date(event.startDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div
                    key={event.id}
                    onClick={() => onNavigateTab('events')}
                    className="p-3 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs font-bold text-slate-900">{event.title}</h3>
                      <span className="text-[11px] font-mono tabular-nums text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {dateStr}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span>{event.venue}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{event.registeredMemberIds.length} Registered</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
