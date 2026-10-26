import { useState } from 'react';
import { useGrid } from '../../context/GridContext';

export default function TransformerMaintenanceQueue() {
  const {
    maintenanceQueue,
    openDispatchModal,
    openInjectionModal,
    navigateToAsset,
    pingRTU,
    addToast,
    currentTime,
  } = useGrid();

  const [filterMode, setFilterMode] = useState('ALL');
  const [showCascadingSimulation, setShowCascadingSimulation] = useState(false);

  const filteredQueue = maintenanceQueue.filter((item) => {
    if (filterMode === 'PENDING') return item.maintenanceStatus.includes('PENDING');
    if (filterMode === 'CRITICAL') return item.maintenanceStatus.includes('CRITICAL');
    if (filterMode === 'SCHEDULED') return item.maintenanceStatus.includes('SCHEDULED') || item.maintenanceStatus.includes('NOMINAL');
    return true;
  });

  const handleToggleCascading = () => {
    const nextState = !showCascadingSimulation;
    setShowCascadingSimulation(nextState);
    if (nextState) {
      addToast(
        'Cascading N-1 Contingency Active: Simulating immediate trip of TX-04. Transferred feeder loads applied to pending transformers.',
        'warn'
      );
    } else {
      addToast('Cascading simulation cleared. Displaying steady-state pending maintenance forecast.', 'info');
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-surface-variant rounded shadow-xs p-space-md flex flex-col gap-space-md select-none">
      {/* Header & Strategic Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-space-sm border-b border-surface-variant gap-space-sm">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[1.75rem]">
            pending_actions
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-headline-sm text-headline-sm uppercase font-bold tracking-wider text-on-surface">
                Multi-Transformer Predictive Maintenance &amp; Cascading Risk Radar
              </h3>
              <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/30 font-label-code text-label-code font-bold uppercase">
                FLEET DEGRADATION FORECAST
              </span>
            </div>
            <p className="font-label-meta text-label-meta text-on-surface-variant uppercase mt-0.5">
              PREVENTS SECONDARY TRIPS • HOURS-TO-CRITICAL PROJECTION • {currentTime}
            </p>
          </div>
        </div>

        {/* Action Toggle: Cascading Contingency Simulation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleCascading}
            className={`py-1.5 px-3 rounded font-label-code text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              showCascadingSimulation
                ? 'bg-error text-on-error animate-pulse shadow-md ring-2 ring-error'
                : 'bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[1.125rem]">
              {showCascadingSimulation ? 'warning' : 'alt_route'}
            </span>
            <span>
              {showCascadingSimulation
                ? 'Cascading Risk Active (TX-04 Tripped)'
                : 'Simulate TX-04 Loss Impact'}
            </span>
          </button>
        </div>
      </div>

      {/* Advisory Banner if Cascading Simulation Active */}
      {showCascadingSimulation && (
        <div className="p-space-sm bg-error-container/20 border-l-4 border-error text-on-surface flex items-start gap-2.5">
          <span className="material-symbols-outlined text-error text-[1.25rem] shrink-0 mt-0.5">
            emergency_home
          </span>
          <div className="font-body-sm text-xs leading-relaxed">
            <strong className="text-error uppercase block font-label-code">
              DOMINO TRIP RISK DETECTED ACROSS PENDING TRANSFORMERS:
            </strong>
            When TX-04 trips, <strong>+15.4 MVA</strong> redirects to <strong>TX-09 (Feeder F-04)</strong> and <strong>+8.5 MVA</strong> to <strong>TX-Pine-02 (West Sub)</strong>. Because their maintenance is overdue, TX-09 will trip in <strong>35 minutes</strong> (134% overload) and TX-Pine-02 will reach <strong>89.6°C</strong>, creating regional cascading blackouts.
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'ALL', label: 'All Transformers', count: maintenanceQueue.length },
            { id: 'CRITICAL', label: 'Critical Attention', count: maintenanceQueue.filter((m) => m.maintenanceStatus.includes('CRITICAL')).length },
            { id: 'PENDING', label: 'Pending Overdue', count: maintenanceQueue.filter((m) => m.maintenanceStatus.includes('PENDING')).length },
            { id: 'SCHEDULED', label: 'Precautionary / Standby', count: maintenanceQueue.filter((m) => !m.maintenanceStatus.includes('CRITICAL') && !m.maintenanceStatus.includes('PENDING')).length },
          ].map((tab) => {
            const isActive = filterMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`py-1 px-2.5 font-label-code text-xs font-bold uppercase transition-colors rounded cursor-pointer flex items-center gap-1 ${
                  isActive
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1 py-0.2 rounded text-[0.625rem] ${isActive ? 'bg-on-primary/20 text-on-primary' : 'bg-surface text-tertiary'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="font-label-meta text-[0.6875rem] text-tertiary uppercase">
          PREDICTIVE MAINTENANCE HORIZON: 48 HOURS
        </span>
      </div>

      {/* Multi-Transformer Cards Grid */}
      <div className="grid grid-cols-1 gap-space-sm">
        {filteredQueue.map((item) => {
          const isCritical = item.maintenanceStatus === 'CRITICAL_INTERVENTION';
          const isPending = item.maintenanceStatus === 'PENDING_OVERDUE';
          const isCascadingAffected = showCascadingSimulation && (item.assetId === 'TX-09' || item.assetId === 'TX-Pine-02');

          return (
            <div
              key={item.assetId}
              className={`p-space-md border transition-all ${
                isCascadingAffected
                  ? 'border-error bg-error-container/10 ring-2 ring-error'
                  : isCritical
                  ? 'border-error/80 bg-surface-container-lowest'
                  : isPending
                  ? 'border-primary/60 bg-surface-container-lowest'
                  : 'border-surface-variant bg-surface-container-lowest'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-space-md">
                {/* Left Section: Asset Info, Scope & Cascading Impact */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <button
                      type="button"
                      onClick={() => navigateToAsset(item.assetId)}
                      className="font-headline-sm text-body-md font-bold text-on-surface hover:text-primary transition-colors text-left uppercase flex items-center gap-1 cursor-pointer"
                    >
                      <span>{item.name}</span>
                      <span className="material-symbols-outlined text-[1rem]">open_in_new</span>
                    </button>

                    <span
                      className={`px-2 py-0.5 font-label-code text-[0.6875rem] font-bold uppercase rounded ${
                        isCritical || isCascadingAffected
                          ? 'bg-error text-on-error animate-pulse'
                          : isPending
                          ? 'bg-primary text-on-primary'
                          : 'bg-secondary text-on-secondary'
                      }`}
                    >
                      {isCascadingAffected
                        ? 'DOMINO TRIP RISK (+MVA)'
                        : item.statusLabel}
                    </span>

                    {item.daysOverdue > 0 && (
                      <span className="px-1.5 py-0.5 bg-surface-container-high text-tertiary font-label-code text-[0.625rem] font-bold uppercase border border-outline-variant">
                        OVERDUE: {item.daysOverdue} DAYS
                      </span>
                    )}

                    <span className="px-1.5 py-0.5 bg-surface-container text-tertiary font-label-code text-[0.625rem] uppercase">
                      {item.substation}
                    </span>
                  </div>

                  {/* Pending Maintenance Scope */}
                  <div className="p-2 bg-surface-container-low border border-surface-variant/60 my-2 text-xs">
                    <div className="flex items-center gap-1.5 text-on-surface font-semibold">
                      <span className="material-symbols-outlined text-primary text-[1rem]">build</span>
                      <span>Pending Task: {item.pendingTask}</span>
                    </div>
                    <div className="flex items-center justify-between text-tertiary font-label-meta text-[0.625rem] uppercase mt-1">
                      <span>RECOMMENDED SOP: <strong className="text-on-surface">{item.recommendedSop}</strong></span>
                      <span>MANDATORY PPE: CLASS-4 ARC FLASH</span>
                    </div>
                  </div>

                  {/* Cascading Risk Impact Summary */}
                  <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                    <strong className="text-on-surface">Cascading Impact:</strong> {item.cascadingImpactSummary}
                  </p>
                </div>

                {/* Center Section: Telemetry Degradation Forecast */}
                <div className="flex items-center gap-4 border-t lg:border-t-0 lg:border-l lg:border-r border-surface-variant/60 pt-2 lg:pt-0 lg:px-4 shrink-0 font-label-code text-center">
                  <div>
                    <span className="text-[0.625rem] text-tertiary uppercase block">HOURS TO CRITICAL</span>
                    <span
                      className={`text-body-lg font-bold block ${
                        item.hoursToCritical < 2.0 || isCascadingAffected
                          ? 'text-error animate-pulse'
                          : item.hoursToCritical < 12.0
                          ? 'text-primary'
                          : 'text-secondary'
                      }`}
                    >
                      {isCascadingAffected ? '< 0.5h' : `~${item.hoursToCritical}h`}
                    </span>
                    <span className="text-[0.5625rem] text-tertiary">IF NEGLECTED</span>
                  </div>

                  <div className="h-8 w-px bg-outline-variant/60"></div>

                  <div>
                    <span className="text-[0.625rem] text-tertiary uppercase block">TEMP NOW → +4H</span>
                    <span className="text-body-md font-bold text-on-surface block">
                      {item.currentTemperatureC}°C →{' '}
                      <strong className={isCascadingAffected || item.projectedTemperature4h > 90 ? 'text-error' : 'text-primary'}>
                        {isCascadingAffected ? '108.4°C' : `${item.projectedTemperature4h}°C`}
                      </strong>
                    </span>
                    <span className="text-[0.5625rem] text-tertiary">THERMAL CLIMB</span>
                  </div>

                  <div className="h-8 w-px bg-outline-variant/60"></div>

                  <div>
                    <span className="text-[0.625rem] text-tertiary uppercase block">CASCADING VULN</span>
                    <span
                      className={`text-body-md font-bold block ${
                        item.cascadingVulnerabilityScore > 80 ? 'text-error' : 'text-secondary'
                      }`}
                    >
                      {item.cascadingVulnerabilityScore}%
                    </span>
                    <span className="text-[0.5625rem] text-tertiary">N-1 RISK INDEX</span>
                  </div>
                </div>

                {/* Right Section: Direct Operational Action Buttons */}
                <div className="flex flex-row lg:flex-col gap-1.5 shrink-0 justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      openDispatchModal(item.assetId, {
                        failureMode: item.pendingTask,
                        sopReference: item.recommendedSop.split(' ')[0],
                        priority: isCritical ? 'P1-EMERGENCY' : 'P2-URGENT',
                        recommendedAction: `Inspect and execute ${item.pendingTask} for ${item.name}.`,
                      })
                    }
                    className="py-1.5 px-3 bg-primary hover:bg-primary/90 text-on-primary font-headline-sm text-xs uppercase font-bold tracking-wider rounded transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[1rem]">engineering</span>
                    <span>Authorize Dispatch</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openInjectionModal(item.assetId)}
                    className="py-1.5 px-3 bg-surface hover:bg-surface-container-high border border-outline-variant font-label-code text-xs uppercase text-on-surface rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[1rem] text-primary">stream</span>
                    <span>Inject Dataset Stream</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => pingRTU(item.assetId)}
                    className="py-1 px-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-label-code text-[0.6875rem] uppercase rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[0.875rem]">network_check</span>
                    <span>Ping RTU Handshake</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
