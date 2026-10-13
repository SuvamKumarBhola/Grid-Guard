import React, { useState } from 'react';
import { useGrid } from '../context/GridContext';

export default function AlertsPage() {
  const {
    alerts,
    selectedAlert,
    selectedAlertId,
    setSelectedAlertId,
    navigateToAsset,
    navigateToSimulation,
    addToast,
    searchQuery
  } = useGrid();

  const [assetTypeFilter, setAssetTypeFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [localSearch, setLocalSearch] = useState('');

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.assetId.toLowerCase().includes((localSearch || searchQuery).toLowerCase()) ||
      alert.classNode.toLowerCase().includes((localSearch || searchQuery).toLowerCase()) ||
      alert.primaryTrigger.toLowerCase().includes((localSearch || searchQuery).toLowerCase());

    const matchesSeverity =
      severityFilter === 'All' ||
      (severityFilter === 'Critical' && alert.severity === 'CRIT') ||
      (severityFilter === 'High' && alert.severity === 'HIGH') ||
      (severityFilter === 'Medium' && alert.severity === 'MED') ||
      (severityFilter === 'Degraded' && alert.severity === 'DEGRAD');

    const matchesType =
      assetTypeFilter === 'All' ||
      (assetTypeFilter === 'Transformers' && alert.assetId.startsWith('TX')) ||
      (assetTypeFilter === 'Feeders' && alert.assetId.startsWith('Feeder'));

    return matchesSearch && matchesSeverity && matchesType;
  });

  const handleRefresh = () => {
    addToast('Synchronizing SCADA alarms across North, West, East, and South substations...', 'info');
    setTimeout(() => {
      addToast('Alarm queue refreshed: 7 active exceptions verified.', 'success');
    }, 900);
  };

  const handleExport = () => {
    addToast('Exporting active exception register to dispatch archive (CSV/JSON)...', 'info');
  };

  const handleSilenceAudio = () => {
    addToast(`Audio klaxon silenced for incident [${selectedAlert.id}]. Visual alarms remain active.`, 'warn');
  };

  return (
    <div className="flex flex-col w-full">
      {/* CONTROL ROOM HEADER & DISPATCH KPI METRICS */}
      <div className="flex flex-col gap-space-md mb-space-lg">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-md">
          <div className="flex flex-col">
            <div className="flex items-center gap-space-xs mb-1">
              <span className="w-2 h-2 bg-error"></span>
              <span className="font-label-code text-label-code text-error tracking-widest uppercase">
                DISPATCH INTERVENTION LEVEL 1 • ACTIVE EXCEPTION
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight">
              Alerts &amp; Risk Monitoring
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
              Review active grid anomalies, prioritize critical asset conditions, and inspect SCADA telemetry exceptions across high-voltage regional bus networks.
            </p>
          </div>

          <div className="flex items-center gap-space-sm flex-wrap">
            <div className="relative w-72">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[1.125rem]">
                search
              </span>
              <input
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm border border-outline-variant focus:outline-none"
                placeholder="Search by Asset ID, Feeder, Substation..."
                type="text"
              />
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-code text-label-code uppercase shadow-sm transition-colors border border-outline-variant cursor-pointer"
            >
              <span className="material-symbols-outlined text-[1rem] text-secondary">refresh</span>
              <span>Refresh Data</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-inverse-surface hover:bg-on-surface text-inverse-on-surface font-label-code text-label-code uppercase shadow-sm transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[1rem]">download</span>
              <span>Export Log</span>
            </button>
          </div>
        </div>

        {/* 4 TACTICAL STATUS METRIC PANELS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-sm">
          {/* Critical Panel */}
          <div className="bg-surface-container-lowest p-space-md shadow-sm relative overflow-hidden flex flex-col justify-between border border-surface-variant">
            <div className="absolute top-0 left-0 right-0 h-1 bg-error"></div>
            <div>
              <div className="flex items-center justify-between font-label-code text-label-code mb-1">
                <span className="text-error uppercase tracking-wider font-bold">CRITICAL ALERTS</span>
                <span className="px-1.5 py-0.5 bg-error text-on-error uppercase font-label-code text-label-code font-bold">
                  URGENT
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display text-display text-error leading-none">1</span>
                <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">ACTIVE TRIGGER</span>
              </div>
            </div>
            <div className="mt-space-md pt-space-xs bg-surface-container-low p-2 border border-surface-variant/40">
              <p className="font-label-meta text-label-meta text-error font-bold uppercase truncate">
                TX-Oak-04 • THERMAL RUNAWAY DANGER
              </p>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Top-oil exceeded 94.2°C design ceiling
              </span>
            </div>
          </div>

          {/* High-Risk Panel */}
          <div className="bg-surface-container-lowest p-space-md shadow-sm relative overflow-hidden flex flex-col justify-between border border-surface-variant">
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
            <div>
              <div className="flex items-center justify-between font-label-code text-label-code mb-1">
                <span className="text-primary uppercase tracking-wider font-bold">HIGH-RISK CONDITIONS</span>
                <span className="px-1.5 py-0.5 bg-primary-fixed text-on-primary-fixed uppercase font-label-code text-label-code font-bold">
                  INTERVENE
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display text-display text-primary leading-none">3</span>
                <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">ASSETS AT RISK</span>
              </div>
            </div>
            <div className="mt-space-md pt-space-xs bg-surface-container-low p-2 border border-surface-variant/40">
              <p className="font-label-meta text-label-meta text-primary font-bold uppercase truncate">
                TX-Pine-02, Feeder-14A, TX-Maple-01
              </p>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Harmonics &amp; conductor overhead loads
              </span>
            </div>
          </div>

          {/* Medium / Monitored */}
          <div className="bg-surface-container-lowest p-space-md shadow-sm relative overflow-hidden flex flex-col justify-between border border-surface-variant">
            <div className="absolute top-0 left-0 right-0 h-1 bg-tertiary"></div>
            <div>
              <div className="flex items-center justify-between font-label-code text-label-code mb-1">
                <span className="text-on-surface-variant uppercase tracking-wider font-bold">MEDIUM / MONITORED</span>
                <span className="px-1.5 py-0.5 bg-surface-container-high text-on-surface-variant uppercase font-label-code text-label-code">
                  OBSERVE
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display text-display text-on-surface leading-none">8</span>
                <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">UNDER SURVEILLANCE</span>
              </div>
            </div>
            <div className="mt-space-md pt-space-xs bg-surface-container-low p-2 border border-surface-variant/40">
              <p className="font-label-meta text-label-meta text-on-surface font-bold uppercase truncate">
                BASELINE TREND DRIFT
              </p>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                DGA Hydrogen + Phase-B balance checks
              </span>
            </div>
          </div>

          {/* Stale / Degraded */}
          <div className="bg-surface-container p-space-md shadow-sm relative overflow-hidden flex flex-col justify-between border border-surface-variant">
            <div className="absolute top-0 left-0 right-0 h-1 bg-outline"></div>
            <div>
              <div className="flex items-center justify-between font-label-code text-label-code mb-1">
                <span className="text-on-surface uppercase tracking-wider font-bold">STALE / DEGRADED TELEMETRY</span>
                <span className="px-1.5 py-0.5 bg-surface-variant text-on-surface-variant uppercase font-label-code text-label-code">
                  &gt;120s LATENCY
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display text-display text-on-surface-variant leading-none">2</span>
                <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">FEEDER SENSORS</span>
              </div>
            </div>
            <div className="mt-space-md pt-space-xs bg-surface-container-high p-2 border border-surface-variant/40">
              <p className="font-label-meta text-label-meta text-on-surface-variant font-bold uppercase truncate">
                POLLING LATENCY DROPS
              </p>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                North Sub feeder gateway timeout warnings
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MULTI-STAGE FILTER BAR PILLS */}
      <div className="bg-surface-container-lowest p-space-md shadow-sm mb-space-md flex flex-col xl:flex-row xl:items-center justify-between gap-space-md border border-surface-variant">
        <div className="flex flex-wrap items-center gap-space-lg">
          {/* Asset Type */}
          <div className="flex items-center gap-1.5">
            <span className="font-label-meta text-label-meta text-on-surface-variant uppercase mr-1">ASSET:</span>
            {['All', 'Transformers', 'Feeders'].map((type) => (
              <button
                key={type}
                onClick={() => setAssetTypeFilter(type)}
                className={`px-2.5 py-1 font-label-code text-label-code uppercase transition-colors cursor-pointer ${
                  assetTypeFilter === type
                    ? 'bg-inverse-surface text-inverse-on-surface'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-label-meta text-label-meta text-on-surface-variant uppercase mr-1">SEVERITY:</span>
            {[
              { id: 'All', label: 'All' },
              { id: 'Critical', label: 'Critical (1)', color: 'bg-error text-on-error' },
              { id: 'High', label: 'High (3)', color: 'bg-primary text-on-primary' },
              { id: 'Medium', label: 'Medium (8)', color: 'bg-surface-container text-on-surface-variant' },
              { id: 'Degraded', label: 'Degraded (2)', color: 'bg-surface-container text-on-surface-variant' }
            ].map((sev) => {
              const isSelected = severityFilter === sev.id;
              return (
                <button
                  key={sev.id}
                  onClick={() => setSeverityFilter(sev.id)}
                  className={`px-2.5 py-1 font-label-code text-label-code uppercase transition-colors cursor-pointer ${
                    isSelected ? 'bg-inverse-surface text-inverse-on-surface' : (sev.color || 'bg-surface-container')
                  }`}
                >
                  {sev.label}
                </button>
              );
            })}
          </div>

          {/* State Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-label-meta text-label-meta text-on-surface-variant uppercase mr-1">STATE:</span>
            {['All', 'Active Dispatch', 'Monitored'].map((state) => (
              <button
                key={state}
                onClick={() => setStateFilter(state)}
                className={`px-2.5 py-1 font-label-code text-label-code uppercase transition-colors cursor-pointer ${
                  stateFilter === state
                    ? 'bg-inverse-surface text-inverse-on-surface'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {state}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 font-label-code text-label-code text-tertiary">
          <span className="w-1.5 h-1.5 bg-secondary animate-pulse"></span>
          <span className="uppercase">AUTO-REFRESH: 5s CYCLE</span>
        </div>
      </div>

      {/* SPLIT SCREEN OPERATIONAL WORKSPACE (65% Table / 35% Dossier) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
        {/* LEFT SIDE: ALERT REGISTRY TABLE (8 cols ~ 66%) */}
        <div className="lg:col-span-8 flex flex-col bg-surface-container-lowest shadow-sm overflow-hidden border border-surface-variant">
          <div className="px-space-md py-space-sm bg-surface-container-high flex items-center justify-between border-b border-surface-variant">
            <div className="flex items-center gap-2">
              <span className="font-headline-sm text-headline-sm text-on-surface uppercase font-bold tracking-tight">
                Active SCADA Anomaly Queue
              </span>
              <span className="font-label-code text-label-code px-2 py-0.5 bg-surface text-on-surface-variant uppercase font-semibold">
                {filteredAlerts.length} Anomalies Logged
              </span>
            </div>
            <div className="font-label-meta text-label-meta text-on-surface-variant uppercase">
              SORT: AI RISK INDEX (DESC)
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container font-label-meta text-label-meta text-on-surface-variant uppercase tracking-wider border-b border-surface-variant">
                  <th className="py-2.5 px-3">Sev</th>
                  <th className="py-2.5 px-3">Asset ID</th>
                  <th className="py-2.5 px-3">Class / Node</th>
                  <th className="py-2.5 px-3">Sensor Exception / Primary Trigger</th>
                  <th className="py-2.5 px-3 text-right">Risk Index</th>
                  <th className="py-2.5 px-3 text-right">Lag</th>
                  <th className="py-2.5 px-3 text-right">Timestamp</th>
                  <th className="py-2.5 px-3 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm divide-y divide-surface-container">
                {filteredAlerts.map((alert) => {
                  const isSelected = selectedAlertId === alert.id;
                  const isCrit = alert.severity === 'CRIT';
                  const isHigh = alert.severity === 'HIGH';
                  const isDegrad = alert.severity === 'DEGRAD';

                  return (
                    <tr
                      key={alert.id}
                      onClick={() => setSelectedAlertId(alert.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary-fixed/35 border-l-4 border-primary font-medium'
                          : 'hover:bg-surface-container-low border-l-4 border-transparent'
                      }`}
                    >
                      <td className="py-2.5 px-3 align-middle">
                        <span
                          className={`px-1.5 py-0.5 font-label-code text-label-code uppercase font-bold ${
                            isCrit
                              ? 'bg-error text-on-error'
                              : isHigh
                              ? 'bg-primary text-on-primary'
                              : isDegrad
                              ? 'bg-surface-variant text-on-surface-variant'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 align-middle font-headline-sm text-body-md font-bold text-on-surface">
                        {alert.assetId}
                      </td>

                      <td className="py-2.5 px-3 align-middle text-on-surface-variant whitespace-nowrap">
                        <span className="font-semibold text-on-surface">{alert.classNode.split('•')[0]}</span>
                        <span className="block font-label-meta text-label-meta text-tertiary">
                          {alert.classNode.split('•').slice(1).join('•')}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 align-middle font-body-sm text-body-sm text-on-surface">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isCrit ? 'bg-error' : isHigh ? 'bg-primary' : isDegrad ? 'bg-tertiary' : 'bg-secondary'
                            }`}
                          ></span>
                          <span className={isCrit ? 'font-semibold text-error' : ''}>
                            {alert.primaryTrigger}
                          </span>
                        </div>
                        <span className="block text-on-surface-variant font-label-meta text-label-meta">
                          {alert.secondaryTrigger}
                        </span>
                      </td>

                      <td
                        className={`py-2.5 px-3 align-middle text-right font-telemetry-num text-telemetry-num font-bold ${
                          isCrit ? 'text-error' : isHigh ? 'text-primary' : 'text-on-surface'
                        }`}
                      >
                        {alert.riskIndex}
                      </td>

                      <td
                        className={`py-2.5 px-3 align-middle text-right font-telemetry-num text-telemetry-num ${
                          isDegrad ? 'text-error font-semibold' : 'text-secondary font-semibold'
                        }`}
                      >
                        {alert.lag}
                      </td>

                      <td className="py-2.5 px-3 align-middle text-right font-telemetry-num text-telemetry-num text-on-surface-variant whitespace-nowrap">
                        {alert.timestamp}
                      </td>

                      <td className="py-2.5 px-3 align-middle text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToAsset(alert.assetId);
                          }}
                          className="p-1 bg-surface-container hover:bg-surface-container-high text-on-surface inline-flex items-center justify-center cursor-pointer border border-outline-variant"
                          title="Inspect Asset"
                        >
                          <span className="material-symbols-outlined text-[1rem]">arrow_forward</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quick Substation Map Ticker Strip */}
          <div className="p-space-md bg-surface-container-low flex flex-col xl:flex-row items-center justify-between gap-space-sm mt-auto border-t border-surface-variant">
            <div className="flex items-center gap-3">
              <div
                className="w-20 h-12 bg-cover bg-center shrink-0 shadow-sm border border-outline-variant"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBxf1c1PRlBVQg5x445iK0UE_jgMZ8AGBCj55oPDsfe2A8EEUbFAH906ZxdwwFnNWyJ-QwahyFIHaJ5l1QPmjyWNU9_PIatmguPJCACyCP4bAAMzU9soX0nNi9p-DRpHiab-c2-h5IvrM-tOv0KdqdnsvgWe4kGYkChkbfJ9tBZMtEDVAfjOvNElmvzbCF6PakMdu-LEc_byYmKtQjOKBglr39Oszg_npeVOZLzQ8CKDOXk8i27FQg')",
                }}
              ></div>
              <div>
                <div className="font-label-code text-label-code text-on-surface font-bold uppercase">
                  NORTH SUBSTATION COMPOUND (FEEDER HUB)
                </div>
                <p className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                  3 active alerts co-located on Bus #2 step-down transformer array
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-label-code text-label-code px-2 py-1 bg-surface text-on-surface uppercase font-semibold border border-outline-variant">
                BUS 2 VOLTAGE: 137.8 kV
              </span>
              <span className="font-label-code text-label-code px-2 py-1 bg-surface text-secondary uppercase font-semibold border border-outline-variant">
                INTERLOCK: NORMAL
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: CONTEXTUAL SELECTED ALERT INSPECTOR (4 cols ~ 34%) */}
        <div className="lg:col-span-4 flex flex-col bg-surface-container-lowest shadow-md overflow-hidden relative border border-surface-variant">
          {/* Dossier Header */}
          <div className="bg-inverse-surface text-inverse-on-surface p-space-md flex flex-col gap-1 relative">
            <div className="flex items-center justify-between">
              <span className="font-label-code text-label-code text-secondary-fixed uppercase tracking-wider">
                ACTIVE INCIDENT DOSSIER
              </span>
              <span
                className={`font-label-code text-label-code px-2 py-0.5 font-bold uppercase tracking-widest ${
                  selectedAlert.severity === 'CRIT'
                    ? 'bg-error text-on-error'
                    : selectedAlert.severity === 'HIGH'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-variant text-on-surface'
                }`}
              >
                {selectedAlert.severityLabel} RISK
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <h2 className="font-headline-md text-headline-md text-inverse-on-surface font-bold">
                {selectedAlert.id}
              </h2>
              <span className="font-label-code text-label-code text-tertiary-fixed-dim">
                PRIORITY: {selectedAlert.priority}
              </span>
            </div>
          </div>

          {/* Equipment Specs Strip */}
          <div className="p-space-md bg-surface-container-low flex items-center justify-between border-b border-surface-variant">
            <div>
              <span className="font-label-meta text-label-meta text-on-surface-variant uppercase block">
                TARGET EQUIPMENT
              </span>
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                {selectedAlert.assetId}
              </span>
            </div>
            <div className="text-right">
              <span className="font-label-meta text-label-meta text-on-surface-variant uppercase block">
                LOCATION / TOPOLOGY
              </span>
              <span className="font-label-code text-label-code text-on-surface font-bold uppercase">
                {selectedAlert.classNode.split('•').slice(1).join('•') || 'North Sub • Bus 2'}
              </span>
            </div>
          </div>

          {/* Equipment Photo Context */}
          <div className="relative w-full h-36 bg-surface-container overflow-hidden">
            <img
              className="w-full h-full object-cover"
              alt="High Voltage Transformer"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxf1c1PRlBVQg5x445iK0UE_jgMZ8AGBCj55oPDsfe2A8EEUbFAH906ZxdwwFnNWyJ-QwahyFIHaJ5l1QPmjyWNU9_PIatmguPJCACyCP4bAAMzU9soX0nNi9p-DRpHiab-c2-h5IvrM-tOv0KdqdnsvgWe4kGYkChkbfJ9tBZMtEDVAfjOvNElmvzbCF6PakMdu-LEc_byYmKtQjOKBglr39Oszg_npeVOZLzQ8CKDOXk8i27FQg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent flex items-end p-2.5">
              <span className="font-label-code text-label-code text-inverse-on-surface px-1.5 py-0.5 bg-inverse-surface/90">
                SERIAL: {selectedAlert.serialNumber || 'WEC-138-50MVA-2018'}
              </span>
            </div>
          </div>

          {/* Anomaly Narrative */}
          <div className="p-space-md flex flex-col gap-space-xs">
            <span className="font-label-meta text-label-meta text-on-surface-variant uppercase font-bold tracking-wider">
              ANOMALY NARRATIVE &amp; ROOT DIAGNOSTIC
            </span>
            <p className="font-body-sm text-body-sm text-on-surface bg-surface-container-low p-2.5 leading-relaxed border border-surface-variant/40">
              {selectedAlert.narrative}
            </p>
          </div>

          {/* Telemetry Metric Quad */}
          <div className="px-space-md pb-space-md">
            <span className="font-label-meta text-label-meta text-on-surface-variant uppercase font-bold tracking-wider mb-2 block">
              CRITICAL SENSOR TELEMETRY
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-error-container/30 flex flex-col border border-error/20">
                <span className="font-label-meta text-label-meta text-on-surface-variant uppercase truncate">
                  TOP-OIL TEMP
                </span>
                <span className="font-display text-headline-lg font-bold text-error mt-0.5">
                  {selectedAlert.topOil !== null ? selectedAlert.topOil : '--'}
                  <span className="text-body-sm">°C</span>
                </span>
                <span className="font-label-meta text-label-meta text-error font-semibold mt-1">
                  CEIL: 85.0°C (+9.2)
                </span>
              </div>
              <div className="p-2 bg-surface-container flex flex-col border border-surface-variant">
                <span className="font-label-meta text-label-meta text-on-surface-variant uppercase truncate">
                  DISSOLVED H₂
                </span>
                <span className="font-display text-headline-lg font-bold text-primary mt-0.5">
                  {selectedAlert.h2Ppm}
                  <span className="text-body-sm">ppm</span>
                </span>
                <span className="font-label-meta text-label-meta text-on-surface-variant mt-1">
                  IEEE LIM: 200ppm
                </span>
              </div>
              <div className="p-2 bg-surface-container flex flex-col border border-surface-variant">
                <span className="font-label-meta text-label-meta text-on-surface-variant uppercase truncate">
                  ACTIVE LOAD
                </span>
                <span className="font-display text-headline-lg font-bold text-on-surface mt-0.5">
                  {selectedAlert.activeLoad}
                  <span className="text-body-sm">MVA</span>
                </span>
                <span className="font-label-meta text-label-meta text-error font-semibold mt-1">
                  {selectedAlert.loadPct}% OF 50 MVA
                </span>
              </div>
            </div>

            {/* Inline Temperature Trajectory SVG Chart */}
            <div className="mt-3 p-2 bg-surface-container-low border border-surface-variant">
              <div className="flex items-center justify-between font-label-meta text-label-meta text-on-surface-variant uppercase mb-1">
                <span>OIL TEMPERATURE TRAJECTORY (LAST 60 MIN)</span>
                <span className="text-error font-bold">+10.8°C ACCELERATION</span>
              </div>
              <svg className="w-full h-10 text-error overflow-visible" viewBox="0 0 300 45">
                <line x1="0" y1="20" x2="300" y2="20" stroke="currentColor" strokeDasharray="3,3" strokeOpacity="0.3" strokeWidth="1" />
                <path d="M 0,38 L 40,36 L 80,35 L 120,32 L 160,30 L 200,24 L 240,16 L 270,11 L 300,6" fill="none" stroke="currentColor" strokeWidth="2.5" />
                <circle cx="300" cy="6" r="3.5" fill="currentColor" />
              </svg>
              <div className="flex items-center justify-between font-label-meta text-label-meta text-tertiary mt-1">
                <span>13:30 (83.4°C)</span>
                <span>14:00 (Trip Bank #2)</span>
                <span className="text-error font-bold">14:31 (94.2°C)</span>
              </div>
            </div>
          </div>

          {/* Recommended Action Box */}
          <div className="px-space-md pb-space-md">
            <div className="p-space-sm bg-primary-fixed/20 border-l-4 border-primary">
              <div className="flex items-center gap-1.5 font-label-code text-label-code text-primary font-bold uppercase mb-1">
                <span className="material-symbols-outlined text-[1.125rem]">psychology</span>
                <span>RECOMMENDED OPERATIONAL ACTION</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface leading-snug">
                {selectedAlert.recommendedAction}
              </p>
            </div>
          </div>

          {/* Action Buttons Panel */}
          <div className="p-space-md bg-surface-container flex flex-col gap-2 mt-auto border-t border-surface-variant">
            <button
              onClick={() => navigateToSimulation(selectedAlert.assetId, 'TX-Pine-02', 8.5)}
              className="w-full py-2 px-3 bg-inverse-surface hover:bg-on-surface text-inverse-on-surface font-headline-sm text-body-md uppercase font-semibold flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Test in Load Redistribution Simulator</span>
              <span className="material-symbols-outlined text-[1.25rem]">tune</span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigateToAsset(selectedAlert.assetId)}
                className="py-1.5 px-3 bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-label-code text-label-code uppercase transition-colors text-center border border-outline-variant cursor-pointer"
              >
                Inspect Details →
              </button>
              <button
                onClick={handleSilenceAudio}
                className="py-1.5 px-3 bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant font-label-code text-label-code uppercase transition-colors text-center border border-outline-variant cursor-pointer"
              >
                Silence Alert (Audio)
              </button>
            </div>
            <div className="flex items-center gap-2 p-2 bg-surface-container-lowest mt-1 border border-surface-variant/40">
              <span className="material-symbols-outlined text-primary text-[1.125rem]">lock</span>
              <span className="font-label-meta text-label-meta text-on-surface-variant uppercase leading-tight">
                SCADA Interlock Active: Manual breaker actuation requires dual-operator authorization keys.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
