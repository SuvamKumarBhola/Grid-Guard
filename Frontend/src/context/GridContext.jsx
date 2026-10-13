import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_ASSETS, INITIAL_ALERTS } from '../data/mockGridData';
import { INITIAL_CREWS, INITIAL_WORK_ORDERS } from '../data/mockCrews';

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

  // Dynamic assets & work orders state
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [workOrders, setWorkOrders] = useState(INITIAL_WORK_ORDERS);
  const [crews, setCrews] = useState(INITIAL_CREWS);

  // Dispatch Crew Modal state
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchAssetId, setDispatchAssetId] = useState('TX-04');
  const [dispatchPrefill, setDispatchPrefill] = useState({});

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
    openDispatchModal(assetId, {
      failureMode: 'Antenna & RTU Telemetry Degradation',
      sopReference: 'SOP-TX-10',
      priority: 'P2-URGENT',
    });
  };

  const viewEventLog = (assetId) => {
    addToast(`Event log extracted for [${assetId}]: Auxiliary DC battery fluctuated between 10.4V and 12.1V at 14:28:10 UTC.`, 'info');
  };

  // ---------------------------------------------------------------------------
  // Dispatch Crew Work Order Operations
  // ---------------------------------------------------------------------------
  const openDispatchModal = (assetId, prefill = {}) => {
    const targetId = assetId || selectedAssetId;
    setDispatchAssetId(targetId);
    setDispatchPrefill(prefill);
    setIsDispatchModalOpen(true);
  };

  const closeDispatchModal = () => {
    setIsDispatchModalOpen(false);
  };

  const dispatchFieldCrew = ({
    assetId,
    crewId,
    priority = 'P1-EMERGENCY',
    failureMode,
    sopReference = 'SOP-TX-10',
    notes = '',
    etaMinutes,
  }) => {
    const selectedCrew = crews.find((c) => c.crewId === crewId) || crews[0];
    const finalEta = etaMinutes || selectedCrew.etaMinutes;
    const ticketId = `#WO-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = {
      workOrderId: ticketId,
      assetId,
      crewId: selectedCrew.crewId,
      crewName: selectedCrew.name,
      leadTechnician: selectedCrew.leadTechnician,
      priority,
      status: 'EN ROUTE',
      failureMode: failureMode || 'Anomaly Alarm / Forced Inspection Protocol',
      sopReference,
      notes: notes || 'Operator authorized field intervention.',
      etaMinutes: finalEta,
      radioChannel: selectedCrew.radioChannel,
      dispatchedBy: 'S. Vance, P.E. (Lead Dispatcher)',
      createdAt: getFormattedTime(),
    };

    // Update work orders list
    setWorkOrders((prev) => [newOrder, ...prev]);

    // Update crew status to dispatched
    setCrews((prev) =>
      prev.map((c) => (c.crewId === selectedCrew.crewId ? { ...c, status: 'Dispatched' } : c))
    );

    // Update asset in state
    setAssets((prev) =>
      prev.map((a) => {
        if (a.id === assetId || a.alias === assetId || (assetId === 'TX-Oak-04' && a.id === 'TX-04')) {
          return {
            ...a,
            dispatchTicket: ticketId,
            fieldCrew: `${selectedCrew.name} (ETA: ${finalEta} mins)`,
            dispatchPriority: priority,
            dispatchStatus: 'EN ROUTE',
            dispatchEta: finalEta,
          };
        }
        return a;
      })
    );

    addToast(
      `Work Order ${ticketId} dispatched: ${selectedCrew.name} assigned to [${assetId}] (ETA: ${finalEta} mins). Radio: ${selectedCrew.radioChannel}.`,
      'success'
    );

    setIsDispatchModalOpen(false);
    return newOrder;
  };

  const updateWorkOrderStatus = (ticketId, newStatus, statusNotes = '') => {
    setWorkOrders((prev) =>
      prev.map((wo) => {
        if (wo.workOrderId === ticketId) {
          return {
            ...wo,
            status: newStatus,
            notes: statusNotes ? `${wo.notes} | ${statusNotes}` : wo.notes,
          };
        }
        return wo;
      })
    );

    // If resolved or cancelled, release crew and update asset
    if (newStatus === 'RESOLVED' || newStatus === 'CANCELLED') {
      const order = workOrders.find((w) => w.workOrderId === ticketId);
      if (order) {
        setCrews((prev) =>
          prev.map((c) => (c.crewId === order.crewId ? { ...c, status: 'Available' } : c))
        );
        setAssets((prev) =>
          prev.map((a) => {
            if (a.dispatchTicket === ticketId) {
              return {
                ...a,
                dispatchTicket: 'None',
                fieldCrew: 'Unassigned',
                dispatchStatus: newStatus,
              };
            }
            return a;
          })
        );
      }
      addToast(`Work Order ${ticketId} updated to status: ${newStatus}`, 'info');
    } else {
      addToast(`Work Order ${ticketId} updated: Status is now ${newStatus}`, 'success');
    }
  };

  // Selected asset & alert lookups (using dynamic assets state)
  const selectedAsset =
    assets.find(
      (a) =>
        a.id === selectedAssetId ||
        a.name === selectedAssetId ||
        a.alias === selectedAssetId ||
        (selectedAssetId === 'TX-Oak-04' && (a.id === 'TX-04' || a.alias === 'TX-Oak-04'))
    ) || assets[0];

  const selectedAlert = INITIAL_ALERTS.find((a) => a.id === selectedAlertId) || INITIAL_ALERTS[0];

  // Active work order for selected asset
  const activeWorkOrder = workOrders.find(
    (w) =>
      (w.assetId === selectedAsset.id ||
        w.assetId === selectedAsset.alias ||
        w.workOrderId === selectedAsset.dispatchTicket) &&
      w.status !== 'RESOLVED' &&
      w.status !== 'CANCELLED'
  );

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
        assets,
        alerts: INITIAL_ALERTS,
        workOrders,
        crews,
        activeWorkOrder,
        isDispatchModalOpen,
        dispatchAssetId,
        dispatchPrefill,
        openDispatchModal,
        closeDispatchModal,
        dispatchFieldCrew,
        updateWorkOrderStatus,
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
