import React from 'react';
import { GridProvider, useGrid } from './context/GridContext';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import ToastContainer from './components/common/ToastContainer';
import DashboardPage from './pages/DashboardPage';
import AssetsPage from './pages/AssetsPage';
import AlertsPage from './pages/AlertsPage';
import SimulationPage from './pages/SimulationPage';
import StatusPage from './pages/StatusPage';
import DispatchCrewModal from './components/dispatch/DispatchCrewModal';

function AppContent() {
  const { activeTab } = useGrid();

  return (
    <div className="bg-background min-h-screen font-body-md text-on-surface antialiased flex">
      {/* Fixed Left Sidebar */}
      <Sidebar />

      {/* Main Content Area shifted right by 72 (18rem / 288px) */}
      <div className="pl-72 flex flex-col flex-1 min-h-screen w-full">
        <Header />

        {/* Dynamic Page Router */}
        <main className="relative pt-20 flex-1 w-full bg-surface-container-low p-gutter-desktop">
          {activeTab === 'dashboard' && <DashboardPage />}
          {activeTab === 'assets' && <AssetsPage />}
          {activeTab === 'alerts' && <AlertsPage />}
          {activeTab === 'load-simulation' && <SimulationPage />}
          {activeTab === 'system-status' && <StatusPage />}
        </main>
      </div>

      {/* Field Dispatch Crew Modal Dialog */}
      <DispatchCrewModal />

      {/* Real-Time Action Toast Stack */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <GridProvider>
      <AppContent />
    </GridProvider>
  );
}
