import React from 'react';
import { OfficialLogo } from './OfficialLogo';
import { Home, Database } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenNewMemberModal?: () => void;
  onOpenBackupModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  onOpenBackupModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-red-600 via-rose-600 to-emerald-600 text-white shadow-md border-b border-black/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand Area with the official "Archdiocese of Nyeri Youth - Faith on Fire" logo */}
        <div 
          onClick={() => setCurrentTab('main-portal')}
          className="flex items-center gap-3 cursor-pointer select-none py-1"
        >
          <div className="bg-white p-1 rounded-lg shadow-sm border border-white/40 flex items-center justify-center">
            <OfficialLogo className="h-12 sm:h-13 w-auto" />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-tight drop-shadow-xs">
              Archdiocese of Nyeri Youth
            </span>
            <span className="text-xs text-amber-200 font-bold tracking-wide drop-shadow-2xs">
              Faith on Fire · Youth Management System
            </span>
          </div>
        </div>

        {/* Right Side: Clean controls */}
        <div className="flex items-center gap-3">
          {/* If inside any sub-module, allow easy 1-click return to Main Dashboard */}
          {currentTab !== 'main-portal' && (
            <button
              onClick={() => setCurrentTab('main-portal')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 rounded-lg transition-colors border border-white/25 backdrop-blur-xs shadow-xs cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-white" />
              <span>Main Dashboard</span>
            </button>
          )}

          {/* Database Backup & Restore */}
          <button
            onClick={onOpenBackupModal}
            title="System Data & Backups"
            className="p-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20 backdrop-blur-xs shadow-xs cursor-pointer"
            aria-label="Backup and Data Management"
          >
            <Database className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
