import React from 'react';
import { OfficialLogo } from './OfficialLogo';
import { useYouth } from '../context/YouthContext';
import { 
  Church, 
  Sparkles, 
  GraduationCap, 
  Trophy, 
  Briefcase, 
  ShieldCheck, 
  ArrowRight,
  School
} from 'lucide-react';

interface MainPortalDashboardProps {
  onSelectModule: (moduleId: string) => void;
}

export const MainPortalDashboard: React.FC<MainPortalDashboardProps> = ({ onSelectModule }) => {
  const { parishes, deaneries } = useYouth();

  return (
    <div className="space-y-10 py-2 sm:py-6 animate-in fade-in duration-300">
      
      {/* Hero Portal Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center justify-center p-2 bg-white rounded-2xl shadow-md border border-slate-200">
          <OfficialLogo className="h-28 sm:h-36 w-auto max-w-full" />
        </div>

        <div className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500 font-mono">
            system.quovadisyouthhub.org
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Archdiocese of Nyeri
          </h1>
          <p className="text-xl sm:text-2xl font-semibold text-slate-700 tracking-tight">
            Youth Management System
          </p>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto pt-1">
            Central Archdiocesan Registration Portal & Pastoral Directory across all 7 Deaneries
          </p>
        </div>
      </div>

      {/* Main Module Grid with exact color specifications from the user request */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        
        {/* 1. Youth in Parishes: White text, light green gradient background */}
        <div
          onClick={() => onSelectModule('parish-youth')}
          className="group relative rounded-2xl p-6 sm:p-7 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl overflow-hidden bg-gradient-to-br from-emerald-400 via-emerald-500 to-green-600 text-white shadow-md flex flex-col justify-between min-h-[180px]"
        >
          <div className="space-y-2">
            <span className="inline-block p-2.5 rounded-xl bg-white/20 backdrop-blur-xs">
              <Church className="w-6 h-6 text-white" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white pt-2">
              Youth in Parishes
            </h2>
            <p className="text-xs text-white/90 leading-relaxed font-medium">
              CYO, Senior Youth, and Young Christian Adults enrolled across all {parishes.length} parishes and {deaneries.length} deaneries.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs font-semibold text-white/95 border-t border-white/20">
            <span>Enter Registration Module</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 2. Junior Youth: White text, light blue background */}
        <div
          onClick={() => onSelectModule('junior-youth')}
          className="group relative rounded-2xl p-6 sm:p-7 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl overflow-hidden bg-gradient-to-br from-sky-400 via-sky-500 to-blue-500 text-white shadow-md flex flex-col justify-between min-h-[180px]"
        >
          <div className="space-y-2">
            <span className="inline-block p-2.5 rounded-xl bg-white/20 backdrop-blur-xs">
              <Sparkles className="w-6 h-6 text-white" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white pt-2">
              Junior Youth
            </h2>
            <p className="text-xs text-white/90 leading-relaxed font-medium">
              Ages 13 to 17 post-PMC transition, confirmation readiness, teen camps, and parish animators assignment.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs font-semibold text-white/95 border-t border-white/20">
            <span>Enter Registration Module</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 3. NICCA: White text, red as background */}
        <div
          onClick={() => onSelectModule('nicca')}
          className="group relative rounded-2xl p-6 sm:p-7 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl overflow-hidden bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white shadow-md flex flex-col justify-between min-h-[180px]"
        >
          <div className="space-y-2">
            <span className="inline-block p-2.5 rounded-xl bg-white/20 backdrop-blur-xs">
              <GraduationCap className="w-6 h-6 text-white" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white pt-2">
              NICCA
            </h2>
            <p className="text-xs text-white/90 leading-relaxed font-medium">
              Nyeri Inter-Colleges and Catholic Association. DeKUT, Karatina University, KMTC, Kagumo TTC, and Nyeri Poly.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs font-semibold text-white/95 border-t border-white/20">
            <span>Enter Registration Module</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 4. Challenge Week: White text, black as background */}
        <div
          onClick={() => onSelectModule('challenge-week')}
          className="group relative rounded-2xl p-6 sm:p-7 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl overflow-hidden bg-gradient-to-br from-slate-900 via-neutral-900 to-black text-white shadow-md flex flex-col justify-between min-h-[180px]"
        >
          <div className="space-y-2">
            <span className="inline-block p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <Trophy className="w-6 h-6 text-amber-400" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white pt-2">
              Challenge Week
            </h2>
            <p className="text-xs text-white/80 leading-relaxed font-medium">
              Annual Archdiocesan Youth spiritual exercises, community charity missions, deanery sports rallies, and points leaderboard.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs font-semibold text-white/90 border-t border-white/15">
            <span>Enter Team Registration</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 5. CAREER DAY: White text, blue background */}
        <div
          onClick={() => onSelectModule('career-day')}
          className="group relative rounded-2xl p-6 sm:p-7 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-md flex flex-col justify-between min-h-[180px]"
        >
          <div className="space-y-2">
            <span className="inline-block p-2.5 rounded-xl bg-white/20 backdrop-blur-xs">
              <Briefcase className="w-6 h-6 text-white" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white pt-2">
              CAREER DAY
            </h2>
            <p className="text-xs text-white/90 leading-relaxed font-medium">
              Archdiocesan Youth Mentorship Forum. Professionals, varsity graduates, CV clinic, IT & Agribusiness masterclasses.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs font-semibold text-white/95 border-t border-white/20">
            <span>Enter Registration Module</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 6. Matrons and Patrons: White text, red as background */}
        <div
          onClick={() => onSelectModule('matrons-patrons')}
          className="group relative rounded-2xl p-6 sm:p-7 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl overflow-hidden bg-gradient-to-br from-red-600 via-rose-600 to-red-800 text-white shadow-md flex flex-col justify-between min-h-[180px]"
        >
          <div className="space-y-2">
            <span className="inline-block p-2.5 rounded-xl bg-white/20 backdrop-blur-xs">
              <ShieldCheck className="w-6 h-6 text-white" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white pt-2">
              Matrons and Patrons
            </h2>
            <p className="text-xs text-white/90 leading-relaxed font-medium">
              Registry of commissioned adult parish youth animators, chaplains, patrons, matrons, and safeguarding officers.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs font-semibold text-white/95 border-t border-white/20">
            <span>Enter Animators Roster</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 7. Youth in Secondary School: White text, rich indigo/violet background */}
        <div
          onClick={() => onSelectModule('secondary-youth')}
          className="group relative rounded-2xl p-6 sm:p-7 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-slate-900 text-white shadow-md flex flex-col justify-between min-h-[180px] md:col-span-2 lg:col-span-3"
        >
          <div className="space-y-2">
            <span className="inline-block p-2.5 rounded-xl bg-white/20 backdrop-blur-xs">
              <School className="w-6 h-6 text-white" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white pt-2">
              Youth in Secondary School
            </h2>
            <p className="text-xs text-white/90 leading-relaxed font-medium max-w-2xl">
              Young Christian Students (YCS) in Nyeri Archdiocesan high schools including Bishop Gatimu Ngandu, Nyeri High, Kagumo High, St. Mary's Boys, and parish holiday recollections.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs font-semibold text-white/95 border-t border-white/20">
            <span>Enter High School Youth Registry</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>
    </div>
  );
};
