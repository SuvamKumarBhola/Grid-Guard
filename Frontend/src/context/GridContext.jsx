import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_ASSETS, INITIAL_ALERTS } from '../data/mockGridData';

const GridContext = createContext(null);

export function GridProvider({ children }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAssetId, setSelectedAssetId] = useState('TX-04');
  const [selectedAlertId, setSelectedAlertId] = useState('ALT-2024-0894');
  const [simulationShift, setSimulationShift] = useState(8.5);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProbing, setIsProbing] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [currentTime, setCurrentTime] = useState(() => getFormattedTime());

  // Real-time ticking UTC clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getFormattedTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function getFormattedTime() {
    const now = new Date();
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds} UTC`;
  }

  // Toast notification manager
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Interactive Helpers
  const navigateToAsset = (assetId) => {
    setSelectedAssetId(assetId);
    setActiveTab('assets');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToSimulation = (source = 'TX-Oak-04', target = 'TX-Pine-02', shift = 8.5) => {
    setSimulationShift(shift);
    setActiveTab('load-simulation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const adjustSimulationShift = (delta) => {
    setSimulationShift((prev) => {
      const next = parseFloat((prev + delta).toFixed(1));
      if (next < 1.0) return 1.0;
      if (next > 15.0) return 15.0;
      return next;
    });
  };

  const resetSimulation = () => {
    setSimulationShift(8.5);
    addToast('Simulation parameters reset to SCADA default (8.5 MVA)', 'info');
  };

  const runForceProbe = () => {
    if (isProbing) return;
    setIsProbing(true);
    setTimeout(() => {
      setIsProbing(false);
      addToast('Probe Complete: 128 assets polled. 126 responding (<18ms), 2 RTUs degraded in sector North/West.', 'success');
    }, 1200);
  };

  const pingRTU = (assetId) => {
    addToast(`Initiating cryptographic DNP3 ping handshake to RTU Gateway on [${assetId}]... Carrier ACK received with 1,240ms jitter.`, 'warn');
  };

  const flagMaintenance = (assetId) => {
    addToast(`Work order dispatch generated for field crew: [${assetId}] flagged for antenna & RTU inspection.`, 'success');
  };

  const viewEventLog = (assetId) => {
    addToast(`Event log extracted for [${assetId}]: Auxiliary DC battery fluctuated between 10.4V and 12.1V at 14:28:10 UTC.`, 'info');
  };

  // Selected asset & alert lookups
  const selectedAsset = INITIAL_ASSETS.find((a) => a.id === selectedAssetId || a.name === selectedAssetId || a.alias === selectedAssetId || (selectedAssetId === 'TX-Oak-04' && (a.id === 'TX-04' || a.alias === 'TX-Oak-04'))) || INITIAL_ASSETS[0];
  const selectedAlert = INITIAL_ALERTS.find((a) => a.id === selectedAlertId) || INITIAL_ALERTS[0];

  return (
    <GridContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedAssetId,
        setSelectedAssetId,
        selectedAsset,
        selectedAlertId,
        setSelectedAlertId,
        selectedAlert,
        simulationShift,
        setSimulationShift,
        adjustSimulationShift,
        resetSimulation,
        searchQuery,
        setSearchQuery,
        currentTime,
        toasts,
        addToast,
        removeToast,
        isProbing,
        runForceProbe,
        pingRTU,
        flagMaintenance,
        viewEventLog,
        navigateToAsset,
        navigateToSimulation,
        assets: INITIAL_ASSETS,
        alerts: INITIAL_ALERTS,
      }}
    >
      {children}
    </GridContext.Provider>
  );
}

export function useGrid() {
  const context = useContext(GridContext);
  if (!context) {
    throw new Error('useGrid must be used within a GridProvider');
  }
  return context;
}
