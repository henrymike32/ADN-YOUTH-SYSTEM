import React from 'react';
import { OfficialLogo } from './OfficialLogo';
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
        </div>
      </div>

      {/* Main Module Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        
        {/* 1. Youth in Parishes: White text, green gradient background (No description) */}
        <div
          onClick={() => onSelectModule('parish-youth')}
          className="group relative rounded-2xl p-6 sm:p-7 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-700 text-white shadow-md flex flex-col justify-between min-h-[150px]"
        >
          <div className="space-y-3">
            <span className="inline-block p-2.5 rounded-xl bg-white/20 backdrop-blur-xs">
              <Church className="w-6 h-6 text-white" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Youth in Parishes
            </h2>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs font-semibold text-white/95 border-t border-white/20">
            <span>Open Module</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 2. Junior Youth: White text, light blue background (No description) */}
        <div
          onClick={() => onSelectModule('junior-youth')}
          className="group relative rounded-2xl p-6 sm:p-7 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl overflow-hidden bg-gradient-to-br from-sky-400 via-sky-500 to-blue-500 text-white shadow-md flex flex-col justify-between min-h-[150px]"
        >
          <div className="space-y-3">
            <span className="inline-block p-2.5 rounded-xl bg-white/20 backdrop-blur-xs">
              <Sparkles className="w-6 h-6 text-white" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Junior Youth
            </h2>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs font-semibold text-white/95 border-t border-white/20">
            <span>Open Module</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 3. NICCA: White text, red background (Title + small description: nyeri inter-colleges and catholic association) */}
        <div
          onClick={() => onSelectModule('nicca')}
          className="group relative rounded-2xl p-6 sm:p-7 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl overflow-hidden bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white shadow-md flex flex-col justify-between min-h-[150px]"
        >
          <div className="space-y-2">
            <span className="inline-block p-2.5 rounded-xl bg-white/20 backdrop-blur-xs">
              <GraduationCap className="w-6 h-6 text-white" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              NICCA
            </h2>
            <p className="text-xs text-white/90 leading-relaxed font-medium">
              nyeri inter-colleges and catholic association
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs font-semibold text-white/95 border-t border-white/20">
            <span>Open Module</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 4. Challenge Week: White text, black background (No description) */}
        <div
          onClick={() => onSelectModule('challenge-week')}
          className="group relative rounded-2xl p-6 sm:p-7 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl overflow-hidden bg-gradient-to-br from-slate-900 via-neutral-900 to-black text-white shadow-md flex flex-col justify-between min-h-[150px]"
        >
          <div className="space-y-3">
            <span className="inline-block p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <Trophy className="w-6 h-6 text-amber-400" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Challenge Week
            </h2>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs font-semibold text-white/90 border-t border-white/15">
            <span>Open Module</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 5. CAREER DAY: White text, blue background (No description) */}
        <div
          onClick={() => onSelectModule('career-day')}
          className="group relative rounded-2xl p-6 sm:p-7 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-md flex flex-col justify-between min-h-[150px]"
        >
          <div className="space-y-3">
            <span className="inline-block p-2.5 rounded-xl bg-white/20 backdrop-blur-xs">
              <Briefcase className="w-6 h-6 text-white" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              CAREER DAY
            </h2>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs font-semibold text-white/95 border-t border-white/20">
            <span>Open Module</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 6. Matrons and Patrons: White text, red background (No description) */}
        <div
          onClick={() => onSelectModule('matrons-patrons')}
          className="group relative rounded-2xl p-6 sm:p-7 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl overflow-hidden bg-gradient-to-br from-red-600 via-rose-600 to-red-800 text-white shadow-md flex flex-col justify-between min-h-[150px]"
        >
          <div className="space-y-3">
            <span className="inline-block p-2.5 rounded-xl bg-white/20 backdrop-blur-xs">
              <ShieldCheck className="w-6 h-6 text-white" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Matrons and Patrons
            </h2>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs font-semibold text-white/95 border-t border-white/20">
            <span>Open Module</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 7. Youth in Secondary School: White text, rich indigo/violet background (No description) */}
        <div
          onClick={() => onSelectModule('secondary-youth')}
          className="group relative rounded-2xl p-6 sm:p-7 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-slate-900 text-white shadow-md flex flex-col justify-between min-h-[150px] md:col-span-2 lg:col-span-3"
        >
          <div className="space-y-3">
            <span className="inline-block p-2.5 rounded-xl bg-white/20 backdrop-blur-xs">
              <School className="w-6 h-6 text-white" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Youth in Secondary School
            </h2>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs font-semibold text-white/95 border-t border-white/20">
            <span>Open Module</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>
    </div>
  );
};
