import { createContext, useState, useEffect, useContext } from 'react';
import { INITIAL_ASSETS, INITIAL_ALERTS } from '../data/mockGridData';
import { INITIAL_CREWS, INITIAL_WORK_ORDERS } from '../data/mockCrews';
import { INITIAL_ACTION_HISTORY, INITIAL_MAINTENANCE_QUEUE } from '../data/mockOperationsHistory';

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

  // Operational Action History & Audit Trail State
  const [actionHistory, setActionHistory] = useState(INITIAL_ACTION_HISTORY);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Live Data Injection State
  const [isInjectionModalOpen, setIsInjectionModalOpen] = useState(false);
  const [injectionAssetId, setInjectionAssetId] = useState('TX-04');

  // Multi-Transformer Predictive Maintenance Queue State
  const [maintenanceQueue, setMaintenanceQueue] = useState(INITIAL_MAINTENANCE_QUEUE);

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

  // Operational History Management
  const openHistoryModal = () => setIsHistoryModalOpen(true);
  const closeHistoryModal = () => setIsHistoryModalOpen(false);

  const addHistoryAction = ({
    type = 'OPERATOR_ACTION',
    category = 'General',
    assetId = 'GRID-WIDE',
    title,
    description,
    ticketId,
    metadata = {},
  }) => {
    const newEntry = {
      id: `act-hist-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: getFormattedTime(),
      date: new Date().toISOString().split('T')[0],
      type,
      category,
      assetId,
      title,
      description,
      operator: 'S. Vance, P.E.',
      ticketId: ticketId || `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
      metadata,
    };
    setActionHistory((prev) => [newEntry, ...prev]);

    // Background sync to backend audit log
    fetch('/api/v1/audit/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'operator',
        'X-User-Id': 'operator-lead',
      },
      body: JSON.stringify({
        event_type: 'operational_action',
        action: title,
        asset_id: assetId,
        details: { description, ...metadata },
      }),
    }).catch(() => {});

    return newEntry;
  };

  // Live Data Injection Management
  const openInjectionModal = (assetId) => {
    setInjectionAssetId(assetId || selectedAssetId || 'TX-04');
    setIsInjectionModalOpen(true);
  };

  const closeInjectionModal = () => {
    setIsInjectionModalOpen(false);
  };

  const injectTelemetryScenario = async ({ assetId, scenarioName, features, notes }) => {
    const targetId = assetId || injectionAssetId || selectedAssetId;
    let scoreResult = null;
    let updatedVals = null;

    try {
      const res = await fetch('/api/v1/anomalies/v2/inject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'operator',
          'X-User-Id': 'operator-lead',
        },
        body: JSON.stringify({
          asset_id: targetId,
          scenario_name: scenarioName,
          features,
          notes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        scoreResult = data;
        updatedVals = data.updated_telemetry;
      }
    } catch (err) {
      console.warn('API injection sync notice:', err);
    }

    const oti = updatedVals?.temperatureC || (features?.OTI ? parseFloat(features.OTI) : (scenarioName.includes('thermal') ? 94.8 : 82.5));
    const isCritical = oti >= 90.0 || (scoreResult?.anomaly_score && scoreResult.anomaly_score > 0.05);

    // Update asset in live state
    setAssets((prev) =>
      prev.map((a) => {
        if (a.id === targetId || a.alias === targetId || (targetId === 'TX-Oak-04' && a.id === 'TX-04')) {
          return {
            ...a,
            temperatureC: oti,
            loadPercentage: Math.min(115, Math.max(35, Math.round(oti * 1.05))),
            riskScore: Math.min(99, Math.round(isCritical ? 92 : oti * 0.9)),
            riskClassification: isCritical ? 'CRITICAL' : oti > 70 ? 'HIGH' : 'MEDIUM',
            telemetryStatus: 'Live (Injected Stream)',
            telemetryLag: '0.1s',
            primaryFailureMode: `Live Telemetry Injection: ${scenarioName.replace(/_/g, ' ')}`,
          };
        }
        return a;
      })
    );

    // Update maintenance queue item
    setMaintenanceQueue((prev) =>
      prev.map((item) => {
        if (item.assetId === targetId) {
          return {
            ...item,
            currentTemperatureC: oti,
            projectedTemperature4h: parseFloat((oti + 12.4).toFixed(1)),
            currentRiskScore: Math.min(99, Math.round(oti * 0.95)),
            projectedRisk4h: Math.min(99, Math.round(oti * 1.1)),
            statusLabel: isCritical ? 'CRITICAL INJECTION ALARM' : 'Live Injected Stream',
          };
        }
        return item;
      })
    );

    // Log to audit history
    addHistoryAction({
      type: 'INJECTION',
      category: 'ML Dataset Streaming',
      assetId: targetId,
      title: `Dataset Telemetry Injected: ${scenarioName}`,
      description: `Injected telemetry stream evaluated by Isolation Forest v2.0.0. Temperature: ${oti}°C, Anomaly Score: ${scoreResult?.anomaly_score || 0.0482}.`,
      metadata: {
        scenario: scenarioName,
        temperatureC: oti,
        anomalyScore: scoreResult?.anomaly_score || 0.0482,
        severityTier: scoreResult?.severity_tier || (isCritical ? 'critical' : 'watch'),
      },
    });

    addToast(
      `Dataset Telemetry Injected on [${targetId}]: ${scenarioName} (Temp: ${oti}°C, IF Score: ${scoreResult?.anomaly_score || 0.0482})`,
      isCritical ? 'critical' : 'success'
    );

    return { oti, scoreResult };
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
    addHistoryAction({
      type: 'SIMULATION',
      category: 'Load Simulation',
      assetId: source,
      title: `Load Transfer Simulation: ${source} → ${target}`,
      description: `Initiated load shift simulation of ${shift} MVA to relieve feeder congestion.`,
      metadata: { source, target, shiftMva: shift },
    });
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
    addHistoryAction({
      type: 'DIAGNOSTIC',
      category: 'Grid Telemetry',
      assetId: 'ALL-ASSETS',
      title: 'IEC-61850 Substation Diagnostic Probe',
      description: 'Polled 128 active network nodes across 4 substations.',
    });
    setTimeout(() => {
      setIsProbing(false);
      addToast('Probe Complete: 128 assets polled. 126 responding (<18ms), 2 RTUs degraded in sector North/West.', 'success');
    }, 1200);
  };

  const pingRTU = (assetId) => {
    addToast(`Initiating cryptographic DNP3 ping handshake to RTU Gateway on [${assetId}]... Carrier ACK received with 1,240ms jitter.`, 'warn');
    addHistoryAction({
      type: 'DIAGNOSTIC',
      category: 'DNP3 Handshake',
      assetId,
      title: `DNP3 Ping Handshake to RTU [${assetId}]`,
      description: 'Cryptographic carrier ping returned with 1,240ms jitter. Stale packet flag recorded.',
    });
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

    // Record in operational action history
    addHistoryAction({
      type: 'DISPATCH',
      category: 'Field Dispatch',
      assetId,
      title: `Work Order Dispatched: ${ticketId}`,
      description: `${selectedCrew.name} assigned to [${assetId}] for ${failureMode || 'Inspection'} (ETA: ${finalEta} mins). Radio: ${selectedCrew.radioChannel}.`,
      ticketId,
      metadata: {
        crew: selectedCrew.name,
        lead: selectedCrew.leadTechnician,
        priority,
        sop: sopReference,
        eta: `${finalEta}m`,
      },
    });

    addToast(
      `Work Order ${ticketId} dispatched: ${selectedCrew.name} assigned to [${assetId}] (ETA: ${finalEta} mins). Radio: ${selectedCrew.radioChannel}.`,
      'success'
    );

    // Sync with FastAPI backend in background
    fetch('/api/v1/dispatch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'operator',
        'X-User-Id': 'operator-lead',
      },
      body: JSON.stringify({
        asset_id: assetId,
        crew_id: selectedCrew.crewId,
        priority,
        failure_mode: failureMode || 'Anomaly Alarm / Forced Inspection Protocol',
        sop_reference: sopReference,
        notes: notes || 'Operator authorized field intervention.',
      }),
    }).catch((err) => {
      console.warn('Backend dispatch sync notice:', err);
    });

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

    addHistoryAction({
      type: 'STATUS_UPDATE',
      category: 'Field Operations',
      assetId: ticketId,
      title: `Work Order ${ticketId} Status: ${newStatus}`,
      description: `Field ticket transitioned to ${newStatus}.${statusNotes ? ` (${statusNotes})` : ''}`,
      ticketId,
      metadata: { status: newStatus, notes: statusNotes },
    });
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
        // Action History & Audit
        actionHistory,
        setActionHistory,
        isHistoryModalOpen,
        openHistoryModal,
        closeHistoryModal,
        addHistoryAction,
        // Live Data Injection
        isInjectionModalOpen,
        injectionAssetId,
        openInjectionModal,
        closeInjectionModal,
        injectTelemetryScenario,
        // Predictive Maintenance Queue
        maintenanceQueue,
        setMaintenanceQueue,
      }}
    >
      {children}
    </GridContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGrid() {
  const context = useContext(GridContext);
  if (!context) {
    throw new Error('useGrid must be used within a GridProvider');
  }
  return context;
}
