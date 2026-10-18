/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { YouthProvider } from './context/YouthContext';
import { Header } from './components/Header';
import { MainPortalDashboard } from './components/MainPortalDashboard';
import { MembersView } from './components/MembersView';
import { JuniorYouthModuleView } from './components/JuniorYouthModuleView';
import { NiccaModuleView } from './components/NiccaModuleView';
import { ChallengeWeekModuleView } from './components/ChallengeWeekModuleView';
import { CareerDayModuleView } from './components/CareerDayModuleView';
import { MatronsPatronsModuleView } from './components/MatronsPatronsModuleView';
import { SecondaryYouthModuleView } from './components/SecondaryYouthModuleView';
import { DashboardView } from './components/DashboardView';
import { DeaneriesView } from './components/DeaneriesView';
import { EventsView } from './components/EventsView';
import { FinanceView } from './components/FinanceView';
import { VocationsWelfareView } from './components/VocationsWelfareView';
import { MemberPortalView } from './components/MemberPortalView';
import { MemberCardModal } from './components/MemberCardModal';
import { MemberModal } from './components/MemberModal';
import { RemittanceModal } from './components/RemittanceModal';
import { DataBackupModal } from './components/DataBackupModal';
import { YouthMember } from './types';

function MainAppContent() {
  // Starts directly on the main landing dashboard requested for system.quovadisyouthhub.org
  const [currentTab, setCurrentTab] = useState('main-portal');

  // Modal states
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<YouthMember | null>(null);
  const [cardModalMember, setCardModalMember] = useState<YouthMember | null>(null);
  const [isRemittanceModalOpen, setIsRemittanceModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const handleOpenNewMember = () => {
    setEditingMember(null);
    setIsMemberModalOpen(true);
  };

  const handleEditMember = (member: YouthMember) => {
    setEditingMember(member);
    setIsMemberModalOpen(true);
  };

  const handleViewCard = (member: YouthMember) => {
    setCardModalMember(member);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* 3-Zone Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenNewMemberModal={handleOpenNewMember}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* 1. Main Landing Portal Dashboard: system.quovadisyouthhub.org */}
        {currentTab === 'main-portal' && (
          <MainPortalDashboard onSelectModule={setCurrentTab} />
        )}

        {/* 2. Youth in Parishes Module */}
        {currentTab === 'parish-youth' && (
          <div className="space-y-4">
            <MembersView
              onOpenNewMemberModal={handleOpenNewMember}
              onEditMember={handleEditMember}
              onViewMemberCard={handleViewCard}
              onBackToHome={() => setCurrentTab('main-portal')}
            />
          </div>
        )}

        {/* 3. Junior Youth Module */}
        {currentTab === 'junior-youth' && (
          <JuniorYouthModuleView
            onBackToHome={() => setCurrentTab('main-portal')}
            onOpenNewMemberModal={handleOpenNewMember}
            onEditMember={handleEditMember}
            onViewMemberCard={handleViewCard}
          />
        )}

        {/* 4. NICCA Module */}
        {currentTab === 'nicca' && (
          <NiccaModuleView onBackToHome={() => setCurrentTab('main-portal')} />
        )}

        {/* 5. Challenge Week Module */}
        {currentTab === 'challenge-week' && (
          <ChallengeWeekModuleView onBackToHome={() => setCurrentTab('main-portal')} />
        )}

        {/* 6. CAREER DAY Module */}
        {currentTab === 'career-day' && (
          <CareerDayModuleView onBackToHome={() => setCurrentTab('main-portal')} />
        )}

        {/* 7. Matrons and Patrons Module */}
        {currentTab === 'matrons-patrons' && (
          <MatronsPatronsModuleView onBackToHome={() => setCurrentTab('main-portal')} />
        )}

        {/* 8. Youth in Secondary School Module */}
        {currentTab === 'secondary-youth' && (
          <SecondaryYouthModuleView onBackToHome={() => setCurrentTab('main-portal')} />
        )}

        {/* 9. Overall Archdiocesan Analytics & Gatherings */}
        {currentTab === 'overview' && (
          <DashboardView
            onNavigateTab={setCurrentTab}
            onOpenNewMemberModal={handleOpenNewMember}
            onOpenRemittanceModal={() => setIsRemittanceModalOpen(true)}
          />
        )}

        {currentTab === 'events' && <EventsView />}
        {currentTab === 'finance' && (
          <FinanceView onOpenRemittanceModal={() => setIsRemittanceModalOpen(true)} />
        )}
        {currentTab === 'vocations' && <VocationsWelfareView />}
        {currentTab === 'portal' && (
          <MemberPortalView onOpenCardModal={handleViewCard} />
        )}
      </main>

      {/* Footer: powered by quovadis @2024 only */}
      <footer className="no-print border-t border-slate-200 bg-white py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 font-medium">
          powered by quovadis @2024
        </div>
      </footer>

      {/* Modals */}
      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => {
          setIsMemberModalOpen(false);
          setEditingMember(null);
        }}
        memberToEdit={editingMember}
      />

      <MemberCardModal
        member={cardModalMember}
        onClose={() => setCardModalMember(null)}
      />

      <RemittanceModal
        isOpen={isRemittanceModalOpen}
        onClose={() => setIsRemittanceModalOpen(false)}
      />

      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <YouthProvider>
      <MainAppContent />
    </YouthProvider>
  );
}
