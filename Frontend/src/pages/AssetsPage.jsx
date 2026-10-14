import React, { useState, useMemo } from 'react';
import { useGrid } from '../context/GridContext';
import TransformerMaintenanceQueue from '../components/maintenance/TransformerMaintenanceQueue';

export default function AssetsPage() {
  const {
    selectedAsset,
    selectedAssetId,
    setSelectedAssetId,
    assets,
    navigateToSimulation,
    addToast,
    currentTime,
    openDispatchModal,
    openInjectionModal,
    openHistoryModal,
    activeWorkOrder,
    updateWorkOrderStatus,
  } = useGrid();

  // Search & Filter state
  const [searchFilter, setSearchFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [activeTimeRange, setActiveTimeRange] = useState('24H');

  // The 7 Priority Directory Nodes matching user's reference image
  const priorityNodeIds = ['TX-04', 'CB-12', 'TX-09', 'RECL-03', 'CAP-02', 'SW-18', 'TX-01'];

  // Priority directory nodes list with fallback to assets
  const directoryNodes = useMemo(() => {
    return priorityNodeIds.map((id) => {
      const match = assets.find((a) => a.id === id || a.displayCode === id || (id === 'TX-04' && a.id === 'TX-Oak-04'));
      return (
        match || {
          id,
          name: id,
          displayCode: id,
          classType: 'Substation Element',
          substation: 'Feeder F-01 • Substation Node',
          riskScore: 50,
          riskClassification: 'MEDIUM',
          activeLoadMva: 20.0,
          ratedMva: 30.0,
          temperatureC: 55.0,
          h2Ppm: 30,
          vibrationMmS: 1.5,
          contributingFactors: []
        }
      );
    });
  }, [assets]);

  // Filtered directory nodes based on search & filter controls
  const filteredNodes = useMemo(() => {
    return directoryNodes.filter((node) => {
      // Risk filter
      if (riskFilter !== 'ALL' && node.riskClassification !== riskFilter) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'ALL') {
        const cType = (node.classType || '').toLowerCase();
        const cat = (node.category || '').toLowerCase();
        const target = typeFilter.toLowerCase();
        if (!cType.includes(target) && !cat.includes(target)) {
          return false;
        }
      }
      // Search query
      if (searchFilter.trim() !== '') {
        const query = searchFilter.toLowerCase();
        const idMatch = (node.displayCode || node.name || node.id || '').toLowerCase().includes(query);
        const typeMatch = (node.classType || '').toLowerCase().includes(query);
        const subMatch = (node.substation || '').toLowerCase().includes(query);
        const riskMatch = (node.riskClassification || '').toLowerCase().includes(query);
        const noteMatch = (node.statusNote || node.staleNote || '').toLowerCase().includes(query);
        return idMatch || typeMatch || subMatch || riskMatch || noteMatch;
      }
      return true;
    });
  }, [directoryNodes, searchFilter, riskFilter, typeFilter]);

  const handleExportDossier = () => {
    addToast(`Exporting SCADA Dossier for [${selectedAsset.displayCode || selectedAsset.name}] (PDF/CSV)...`, 'info');
    setTimeout(() => {
      addToast(`Dossier exported successfully with digital SCADA signature.`, 'success');
    }, 1200);
  };

  const getRiskColor = (score) => {
    if (score >= 80) return '#ef4444'; // Red
    if (score >= 60) return '#f59e0b'; // Amber
    if (score >= 40) return '#eab308'; // Yellow
    return '#10b981'; // Green
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* =========================================================================
          1. HEADER UNDER NAVBAR: SEARCH & FILTER CONTROLS ONLY
         ========================================================================= */}
      <section className="bg-surface-container-lowest p-space-md border border-surface-variant shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
          {/* Search Input Box */}
          <div className="relative flex-1 min-w-[280px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-tertiary text-[1.25rem]">
              search
            </span>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search assets by ID (e.g. TX-04, CB-12), type, feeder, or status..."
              className="w-full pl-10 pr-10 py-2.5 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/60 font-body-md text-body-md border border-outline-variant focus:border-primary focus:outline-none transition-colors"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-on-surface text-[1.125rem] cursor-pointer"
              >
                close
              </button>
            )}
          </div>

          {/* Filter Controls Bar */}
          <div className="flex flex-wrap items-center gap-space-sm">
            {/* Risk Tier Filters */}
            <div className="flex items-center bg-surface-container-low p-1 border border-outline-variant/60">
              <span className="text-[0.6875rem] font-label-code text-tertiary uppercase px-2 font-bold hidden sm:inline">
                Risk:
              </span>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((risk) => {
                const isActive = riskFilter === risk;
                return (
                  <button
                    key={risk}
                    onClick={() => setRiskFilter(risk)}
                    className={`px-2.5 py-1 font-label-code text-[0.6875rem] uppercase tracking-wider transition-all cursor-pointer ${
                      isActive
                        ? risk === 'CRITICAL'
                          ? 'bg-error text-on-error font-bold shadow-xs'
                          : risk === 'HIGH'
                          ? 'bg-amber-600 text-white font-bold shadow-xs'
                          : risk === 'MEDIUM'
                          ? 'bg-yellow-600 text-white font-bold shadow-xs'
                          : risk === 'LOW'
                          ? 'bg-emerald-600 text-white font-bold shadow-xs'
                          : 'bg-primary text-on-primary font-bold shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {risk}
                  </button>
                );
              })}
            </div>

            {/* Equipment Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-space-md py-2 bg-surface-container-low text-on-surface font-label-code text-label-code uppercase tracking-wider border border-outline-variant/60 focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="ALL">ALL TYPES</option>
              <option value="Transformer">TRANSFORMERS</option>
              <option value="Breaker">CIRCUIT BREAKERS</option>
              <option value="Recloser">RECLOSERS</option>
              <option value="Capacitor">CAPACITOR BANKS</option>
              <option value="Switch">SWITCHES</option>
            </select>

            {/* Clear All Filters Button */}
            {(searchFilter || riskFilter !== 'ALL' || typeFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchFilter('');
                  setRiskFilter('ALL');
                  setTypeFilter('ALL');
                }}
                className="px-2.5 py-2 bg-surface-container hover:bg-surface-container-high text-tertiary hover:text-on-surface font-label-code text-[0.6875rem] uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer border border-outline-variant/40"
              >
                <span className="material-symbols-outlined text-[0.875rem]">restart_alt</span>
                <span>Reset</span>
              </button>
            )}

            {/* Match Counter Badge */}
            <div className="px-2.5 py-1.5 bg-surface-container font-label-code text-[0.6875rem] text-tertiary border border-outline-variant/40 uppercase">
              <strong className="text-on-surface">{filteredNodes.length}</strong> / {directoryNodes.length} Nodes
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Transformer Predictive Maintenance Queue & Cascading Risk */}
      <section>
        <TransformerMaintenanceQueue />
      </section>

      {/* =========================================================================
          2. ASSET DIRECTORY (7 PRIORITY NODES) LIST / TABLE
             MATCHING EXACT REFERENCE IMAGE
         ========================================================================= */}
      <section className="bg-[#121622] border border-[#232b3e] shadow-md rounded-xs overflow-hidden">
        {/* Directory Header Bar */}
        <div className="flex items-center justify-between px-space-lg py-3 bg-[#181f2f] border-b border-[#232b3e]">
          <div className="flex items-center gap-2.5 text-[#e2e8f0]">
            <span className="material-symbols-outlined text-primary text-[1.25rem]">
              format_list_bulleted
            </span>
            <h2 className="font-headline-sm text-headline-sm font-bold uppercase tracking-wider text-white">
              ASSET DIRECTORY ({filteredNodes.length} PRIORITY NODES)
            </h2>
          </div>
          <div className="flex items-center gap-2 font-label-code text-label-code text-[#94a3b8]">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span>Updated 14:02 UTC</span>
          </div>
        </div>

        {/* Directory Card Nodes List */}
        <div className="divide-y divide-[#1e2638]">
          {filteredNodes.length === 0 ? (
            <div className="p-space-xl text-center font-label-code text-label-code text-[#94a3b8]">
              NO ASSETS FOUND MATCHING SEARCH OR FILTER CRITERIA.
            </div>
          ) : (
            filteredNodes.map((node) => {
              const isSelected =
                selectedAsset.id === node.id ||
                selectedAsset.displayCode === node.displayCode ||
                selectedAsset.name === node.name ||
                (node.id === 'TX-04' && selectedAsset.id === 'TX-Oak-04');

              const isCritical = node.riskClassification === 'CRITICAL';
              const isHigh = node.riskClassification === 'HIGH';
              const isMedium = node.riskClassification === 'MEDIUM';
              const isLow = node.riskClassification === 'LOW';

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedAssetId(node.id)}
                  className={`p-space-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-space-md ${
                    isSelected
                      ? 'bg-[#1b2333] border-l-4 border-l-[#f59e0b]'
                      : 'bg-[#131722] hover:bg-[#181f2d] border-l-4 border-l-transparent'
                  }`}
                >
                  {/* Left Column: Asset Identifier, Status Badges & Details */}
                  <div className="flex items-start gap-space-md">
                    <div className="space-y-1">
                      {/* Line 1: Code Name + Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-headline-md text-headline-md font-bold tracking-tight ${
                            isSelected ? 'text-[#f59e0b]' : 'text-white'
                          }`}
                        >
                          {node.displayCode || node.name}
                        </span>

                        {/* Critical Badge */}
                        {isCritical && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6875rem] font-label-code font-bold uppercase tracking-wider bg-[#541517] text-[#ff8e8e] border border-[#7f1d1d]/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></span>
                            CRITICAL
                          </span>
                        )}

                        {/* High Badge */}
                        {isHigh && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[0.6875rem] font-label-code font-bold uppercase tracking-wider bg-[#52330a] text-[#fbbf24] border border-[#b45309]/50">
                            HIGH
                          </span>
                        )}

                        {/* Stale RTU Badge (for TX-09) */}
                        {(node.isStale || node.staleBadge) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[0.6875rem] font-label-code font-bold uppercase tracking-wider bg-[#262f40] text-[#94a3b8] border border-[#3e4c66]/60">
                            <span className="material-symbols-outlined text-[0.875rem]">wifi_off</span>
                            {node.staleBadge || 'Stale RTU'}
                          </span>
                        )}

                        {/* Medium Badge */}
                        {isMedium && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[0.6875rem] font-label-code font-bold uppercase tracking-wider bg-[#42380d] text-[#fef08a] border border-[#ca8a04]/50">
                            MEDIUM
                          </span>
                        )}

                        {/* Low Badge */}
                        {isLow && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[0.6875rem] font-label-code font-bold uppercase tracking-wider bg-[#0a3826] text-[#6ee7b7] border border-[#059669]/50">
                            LOW
                          </span>
                        )}
                      </div>

                      {/* Line 2: Equipment Class / Description */}
                      <div className="font-body-md text-body-md text-[#93c5fd] font-medium">
                        {node.classType}
                      </div>

                      {/* Line 3: Feeder & Substation Note */}
                      <div className="flex items-center gap-1.5 font-label-code text-[0.75rem] text-[#94a3b8] flex-wrap">
                        <span className="material-symbols-outlined text-[0.9375rem] text-[#64748b]">
                          hub
                        </span>
                        <span>{node.substation.split('•')[0].trim()}</span>
                        <span>•</span>
                        {node.staleNote ? (
                          <span className="text-[#ef4444] font-bold">{node.staleNote}</span>
                        ) : node.statusNote ? (
                          <span
                            className={
                              isCritical ? 'text-[#fca5a5] font-semibold' : 'text-[#cbd5e1]'
                            }
                          >
                            {node.statusNote}
                          </span>
                        ) : (
                          <span>{node.substation.split('•')[1]?.trim() || 'Substation Node'}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Risk Index Box matching reference image */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0">
                    <div className="px-4 py-2 bg-[#1b2333] border border-[#2b3548] rounded-xs text-center min-w-[95px] shadow-xs">
                      <div
                        className="font-headline-lg text-[1.75rem] leading-none font-bold tracking-tight"
                        style={{ color: getRiskColor(node.riskScore) }}
                      >
                        {node.riskScore}
                      </div>
                      <div className="font-label-meta text-[0.625rem] text-[#94a3b8] uppercase tracking-wider mt-1">
                        RISK INDEX
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* =========================================================================
          3. SIDE-BY-SIDE ROW:
             LEFT: Top-Oil Temperature vs Active Load Profile
             RIGHT: Work Orders & Dispatch
         ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">
        {/* LEFT COLUMN: Time-Series Dual Curve Telemetry Graph (8 cols) */}
        <div className="lg:col-span-8 bg-surface-container-lowest p-space-lg shadow-sm border border-surface-variant flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-sm mb-space-md gap-space-sm border-b border-surface-variant/40">
              <div>
                <span className="font-label-meta text-label-meta text-tertiary uppercase">
                  Time-Series Telemetry Analysis • [{selectedAsset.displayCode || selectedAsset.name}]
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface uppercase">
                  Top-Oil Temperature vs Active Load Profile
                </h3>
              </div>

              {/* Time Range Selector Buttons */}
              <div className="flex items-center bg-surface-container p-0.5 gap-0.5 font-label-code text-label-code self-start sm:self-auto border border-outline-variant/30">
                {['1H', '6H', '24H', '7D'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setActiveTimeRange(range)}
                    className={`px-2.5 py-1 transition-colors cursor-pointer ${
                      activeTimeRange === range
                        ? 'bg-surface-container-lowest text-on-surface font-bold shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend & Events */}
            <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-sm font-label-code text-label-code">
              <div className="flex items-center gap-space-md flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 bg-error"></span>
                  <span className="text-on-surface">TOP-OIL TEMP (°C)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 bg-primary"></span>
                  <span className="text-on-surface">ACTIVE LOAD (MVA)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-0.5 bg-outline" style={{ strokeDasharray: '2 2' }}></span>
                  <span className="text-tertiary">TRIP THRESHOLD (105°C)</span>
                </div>
              </div>
              <span className="text-error font-bold uppercase text-[0.6875rem]">
                Fan Bank #2 Trip Marker @ 11:20 UTC
              </span>
            </div>

            {/* SVG Dual-Axis Chart */}
            <div className="w-full h-64 bg-surface-container-low p-space-sm relative overflow-hidden border border-surface-variant">
              <svg className="w-full h-full" viewBox="0 0 800 240" preserveAspectRatio="none">
                {/* Horizontal Grid Lines */}
                <line x1="40" y1="20" x2="780" y2="20" stroke="#dddad2" strokeWidth="1" />
                <line x1="40" y1="65" x2="780" y2="65" stroke="#dddad2" strokeWidth="1" />
                <line x1="40" y1="110" x2="780" y2="110" stroke="#dddad2" strokeWidth="1" />
                <line x1="40" y1="155" x2="780" y2="155" stroke="#dddad2" strokeWidth="1" />
                <line x1="40" y1="200" x2="780" y2="200" stroke="#dddad2" strokeWidth="1" />

                {/* Vertical Time Lines */}
                <line x1="160" y1="10" x2="160" y2="200" stroke="#dddad2" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="310" y1="10" x2="310" y2="200" stroke="#dddad2" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="470" y1="10" x2="470" y2="200" stroke="#dddad2" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="630" y1="10" x2="630" y2="200" stroke="#dddad2" strokeDasharray="3 3" strokeWidth="1" />

                {/* 105°C Trip Threshold Line */}
                <line x1="40" y1="25" x2="780" y2="25" stroke="#ba1a1a" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.75" />
                <text x="725" y="21" fill="#ba1a1a" fontSize="9" className="font-label-code font-bold">
                  105°C TRIP
                </text>

                {/* Fan Failure Marker */}
                <line x1="460" y1="10" x2="460" y2="200" stroke="#ba1a1a" strokeWidth="1.5" />
                <polygon points="455,10 465,10 460,20" fill="#ba1a1a" />
                <rect x="420" y="24" width="80" height="16" fill="#ba1a1a" rx="1" />
                <text x="424" y="35" fill="#ffffff" fontSize="8" fontWeight="bold" className="font-label-code">
                  FAN #2 TRIP
                </text>

                {/* Active Load Curve (Primary) */}
                <path
                  d="M 40,150 C 100,155 140,140 180,130 C 220,120 280,125 320,110 C 380,90 420,80 460,65 C 520,55 580,52 640,48 C 700,45 740,44 780,42"
                  fill="none"
                  stroke="#944521"
                  strokeWidth="2.5"
                />

                {/* Oil Temperature Curve (Error/Red) */}
                <path
                  d="M 40,170 C 100,168 140,165 180,160 C 220,155 280,152 320,145 C 380,140 420,135 460,120 C 500,98 560,70 620,58 C 680,45 730,40 780,35"
                  fill="none"
                  stroke="#ba1a1a"
                  strokeWidth="3"
                />

                {/* End Point Markers */}
                <circle cx="780" cy="35" r="4.5" fill="#ba1a1a" stroke="#ffffff" strokeWidth="2" />
                <circle cx="780" cy="42" r="4.5" fill="#944521" stroke="#ffffff" strokeWidth="2" />

                {/* X-Axis Time Labels */}
                <text x="40" y="216" fill="#555e57" fontSize="9" className="font-label-code">17:00 (YEST)</text>
                <text x="160" y="216" fill="#555e57" fontSize="9" className="font-label-code">21:00</text>
                <text x="310" y="216" fill="#555e57" fontSize="9" className="font-label-code">03:00</text>
                <text x="470" y="216" fill="#555e57" fontSize="9" className="font-label-code">11:00 (TODAY)</text>
                <text x="630" y="216" fill="#555e57" fontSize="9" className="font-label-code">15:00</text>
                <text x="750" y="216" fill="#ba1a1a" fontSize="9" fontWeight="bold" className="font-label-code">NOW</text>

                {/* Y-Axis Temp Labels */}
                <text x="5" y="28" fill="#ba1a1a" fontSize="9" className="font-label-code font-bold">100°C</text>
                <text x="5" y="70" fill="#555e57" fontSize="9" className="font-label-code">85°C</text>
                <text x="5" y="115" fill="#555e57" fontSize="9" className="font-label-code">70°C</text>
                <text x="5" y="160" fill="#555e57" fontSize="9" className="font-label-code">55°C</text>
                <text x="5" y="202" fill="#555e57" fontSize="9" className="font-label-code">40°C</text>
              </svg>
            </div>
          </div>

          {/* Metric Telemetry Reading Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm mt-space-md pt-space-sm bg-surface-container-low p-space-sm font-label-code text-label-code border border-surface-variant/40">
            <div>
              <span className="text-tertiary">PEAK AMBIENT:</span>
              <span className="text-on-surface font-bold ml-1">38.6°C (14:10)</span>
            </div>
            <div>
              <span className="text-tertiary">THERMAL GRADIENT:</span>
              <span className="text-error font-bold ml-1">+0.48°C / min</span>
            </div>
            <div>
              <span className="text-tertiary">EST. TIME TO TRIP:</span>
              <span className="text-error font-bold ml-1">42 MIN @ CONST</span>
            </div>
            <div>
              <span className="text-tertiary">COOLING CAPACITY:</span>
              <span className="text-primary font-bold ml-1">50% (1 OF 2 STAGES)</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Work Orders & Dispatch (4 cols) */}
        <div className="lg:col-span-4 bg-surface-container-lowest p-space-lg shadow-sm border border-surface-variant flex flex-col justify-between">
          <div className="space-y-space-md">
            {/* Header */}
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[1.25rem]">
                  engineering
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface uppercase">
                  Work Orders &amp; Dispatch
                </h3>
              </div>
              <span
                className={`px-2 py-0.5 font-label-code text-label-code font-bold uppercase tracking-wider ${
                  activeWorkOrder?.priority === 'P1-EMERGENCY' || selectedAsset.riskClassification === 'CRITICAL'
                    ? 'bg-error text-on-error'
                    : 'bg-primary text-on-primary'
                }`}
              >
                {activeWorkOrder?.priority || (selectedAsset.dispatchPriority || 'PRIORITY-1')}
              </span>
            </div>

            {/* Ticket Summary or Empty State */}
            {activeWorkOrder || (selectedAsset.dispatchTicket && selectedAsset.dispatchTicket !== 'None') ? (
              <div className="p-space-md bg-surface-container-low border border-surface-variant/40 space-y-space-xs">
                <div className="flex items-center justify-between font-label-code text-label-code">
                  <span className="text-tertiary">FIELD TICKET:</span>
                  <span className="font-bold text-on-surface bg-surface-container px-2 py-0.5 border border-outline-variant">
                    {activeWorkOrder?.workOrderId || selectedAsset.dispatchTicket}
                  </span>
                </div>
                <div className="flex items-center justify-between font-label-code text-label-code">
                  <span className="text-tertiary">CREW ASSIGNED:</span>
                  <span className="font-semibold text-secondary">
                    {activeWorkOrder?.crewName || selectedAsset.fieldCrew}
                  </span>
                </div>
                {activeWorkOrder?.leadTechnician && (
                  <div className="flex items-center justify-between font-label-meta text-label-meta text-tertiary">
                    <span>LEAD TECH:</span>
                    <span className="font-semibold text-on-surface">{activeWorkOrder.leadTechnician}</span>
                  </div>
                )}
                <div className="flex items-center justify-between font-label-code text-label-code pt-1">
                  <span className="text-tertiary">STATUS:</span>
                  <span className="flex items-center gap-1.5 font-bold text-primary">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                    <span>{activeWorkOrder?.status || selectedAsset.dispatchStatus || 'EN ROUTE'}</span>
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed border-t border-surface-variant/40 pt-2">
                  {activeWorkOrder?.notes ||
                    'Relay and substation cooling technicians dispatched to site. Emergency thermal fan bank #2 replacement and RTU telemetry validation in progress (ETA: 24 mins).'}
                </p>

                {/* Inline Status Lifecycle Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-variant/30 mt-2">
                  {activeWorkOrder?.status === 'EN ROUTE' && (
                    <button
                      type="button"
                      onClick={() =>
                        updateWorkOrderStatus(
                          activeWorkOrder.workOrderId,
                          'ON SITE',
                          'Crew verified arrival at substation gate. Beginning perimeter thermography.'
                        )
                      }
                      className="py-1 px-2 bg-surface hover:bg-surface-container border border-primary text-primary font-label-code text-[0.6875rem] font-bold uppercase transition-colors cursor-pointer text-center"
                    >
                      ✓ Mark On-Site
                    </button>
                  )}
                  {activeWorkOrder?.status === 'ON SITE' && (
                    <button
                      type="button"
                      onClick={() =>
                        updateWorkOrderStatus(
                          activeWorkOrder.workOrderId,
                          'RESOLVED',
                          'Auxiliary fan motor starter replaced. RPM normalized to 1,200. Clear to close ticket.'
                        )
                      }
                      className="py-1 px-2 bg-surface hover:bg-surface-container border border-secondary text-secondary font-label-code text-[0.6875rem] font-bold uppercase transition-colors cursor-pointer text-center"
                    >
                      ✓ Resolve Order
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      openDispatchModal(selectedAsset.id, {
                        failureMode: activeWorkOrder?.failureMode || selectedAsset.primaryFailureMode,
                        priority: activeWorkOrder?.priority || 'P1-EMERGENCY',
                      })
                    }
                    className="py-1 px-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant font-label-code text-[0.6875rem] text-on-surface uppercase transition-colors cursor-pointer text-center"
                  >
                    Modify / Dispatch Unit
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-space-md bg-surface-container-low border border-dashed border-surface-variant text-center space-y-2">
                <span className="material-symbols-outlined text-tertiary text-[2rem]">
                  person_off
                </span>
                <div className="font-headline-sm text-body-sm font-bold text-on-surface uppercase">
                  No Active Crew Dispatched
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Unit is running under baseline SCADA monitoring. Authorize on-site crew if telemetry anomalies are identified.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    openDispatchModal(selectedAsset.id, {
                      failureMode: selectedAsset.primaryFailureMode || 'Routine Inspection & Thermal Verification',
                    })
                  }
                  className="mt-2 py-2 px-space-md bg-primary hover:bg-primary-container text-on-primary font-label-code text-label-code uppercase tracking-wider font-bold transition-colors w-full cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[1rem]">engineering</span>
                  <span>Authorize Field Dispatch</span>
                </button>
              </div>
            )}

            {/* Tactical Mitigation Recommendation */}
            <div className="p-space-md bg-surface-container-low border border-surface-variant/40 space-y-space-xs">
              <div className="flex items-center gap-1.5 text-primary font-label-code text-label-code font-bold uppercase">
                <span className="material-symbols-outlined text-[1rem]">alt_route</span>
                <span>Immediate Mitigation</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface leading-snug">
                Execute hypothetical <strong className="text-primary">8.5 MVA</strong> load shift from{' '}
                <strong className="text-on-surface">{selectedAsset.displayCode || selectedAsset.name}</strong> to standby unit{' '}
                <strong className="text-secondary">TX-Pine-02</strong> via Feeder Tie <strong className="text-on-surface">F-104</strong>.
              </p>
              <div className="pt-1 flex items-center justify-between font-label-code text-label-code text-secondary">
                <span>PROJECTED TEMP DROP:</span>
                <span className="font-bold">-11.2°C IN 35 MIN</span>
              </div>
            </div>
          </div>

          {/* Action Launcher Buttons */}
          <div className="flex flex-col gap-space-sm mt-space-md pt-space-sm border-t border-surface-variant/40">
            {/* Primary Dispatch Launcher Button */}
            <button
              onClick={() =>
                openDispatchModal(selectedAsset.id, {
                  failureMode: selectedAsset.primaryFailureMode || 'Thermal Runaway & Cooling Fan Lockout',
                  recommendedAction: `Inspect radiator fan bank and calibrate telemetry for ${selectedAsset.displayCode || selectedAsset.name}.`,
                })
              }
              className="w-full py-2.5 px-space-md bg-primary hover:bg-primary/90 text-on-primary font-headline-sm text-headline-sm uppercase transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer font-bold"
            >
              <span className="material-symbols-outlined text-[1.25rem]">engineering</span>
              <span>
                {activeWorkOrder || (selectedAsset.dispatchTicket && selectedAsset.dispatchTicket !== 'None')
                  ? 'Manage Field Dispatch Ticket'
                  : 'Dispatch Field Crew'}
              </span>
            </button>

            {/* Live Data Injection Studio Launcher */}
            <button
              onClick={() => openInjectionModal(selectedAsset.id)}
              className="w-full py-2 px-space-md bg-surface-container hover:bg-surface-container-high text-primary border border-primary/40 font-headline-sm text-headline-sm uppercase transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer font-bold"
              title="Inject historical telemetry stream and evaluate with Isolation Forest model"
            >
              <span className="material-symbols-outlined text-[1.125rem]">stream</span>
              <span>Inject Dataset Telemetry</span>
            </button>

            <button
              onClick={() => navigateToSimulation(selectedAsset.id, 'TX-Pine-02', 8.5)}
              className="w-full py-2 px-space-md bg-inverse-surface hover:bg-on-surface text-inverse-on-surface font-headline-sm text-headline-sm uppercase transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <span>Launch in Simulator</span>
              <span className="material-symbols-outlined text-[1.25rem]">arrow_forward</span>
            </button>
            <button
              onClick={handleExportDossier}
              className="w-full py-2 px-space-md bg-surface-container hover:bg-surface-container-high text-on-surface font-label-code text-label-code uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer border border-outline-variant"
            >
              <span className="material-symbols-outlined text-[1.125rem]">download</span>
              <span>Export SCADA Dossier (PDF/CSV)</span>
            </button>
            <div className="flex items-center justify-between font-label-meta text-label-meta text-tertiary uppercase mt-1">
              <span>CONTACT: DISPATCH REGION 4</span>
              <span className="text-on-surface font-bold">
                {activeWorkOrder?.radioChannel || 'CH-9 DIRECT'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. REAL-TIME SENSOR TELEMETRY MATRIX
         ========================================================================= */}
      <section className="bg-surface-container-lowest p-space-lg shadow-sm border border-surface-variant">
        <div className="flex items-center justify-between pb-space-xs mb-space-md border-b border-surface-variant">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[1.25rem] text-primary">sensors</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface uppercase">
              Real-Time Sensor Telemetry Matrix
            </h2>
          </div>
          <span className="font-label-code text-label-code text-tertiary">
            4 / 4 CHANNELS MONITORED • SCADA POLLING: 0.4s
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-sm">
          {/* Card 1: Top-Oil Temp */}
          <div className="bg-surface-container-low p-space-md border border-surface-variant/40 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-label-meta text-label-meta text-tertiary uppercase">Top-Oil Temp</span>
              <span
                className={`px-1.5 py-0.5 font-label-code text-[0.625rem] font-bold ${
                  (selectedAsset.temperatureC || 94.2) >= 85
                    ? 'bg-error text-on-error'
                    : 'bg-secondary text-on-secondary'
                }`}
              >
                {(selectedAsset.temperatureC || 94.2) >= 85 ? 'ALARM' : 'NORMAL'}
              </span>
            </div>
            <div className="mt-space-xs flex items-baseline justify-between">
              <span
                className={`font-display text-[2.25rem] leading-none font-bold ${
                  (selectedAsset.temperatureC || 94.2) >= 85 ? 'text-error' : 'text-on-surface'
                }`}
              >
                {selectedAsset.temperatureC || 94.2}
              </span>
              <span
                className={`font-headline-sm text-headline-sm ${
                  (selectedAsset.temperatureC || 94.2) >= 85 ? 'text-error' : 'text-tertiary'
                }`}
              >
                °C
              </span>
            </div>
            <div className="w-full bg-surface-container h-1.5 mt-space-sm relative">
              <div
                className={`h-1.5 ${
                  (selectedAsset.temperatureC || 94.2) >= 85 ? 'bg-error' : 'bg-secondary'
                }`}
                style={{
                  width: `${Math.min(100, ((selectedAsset.temperatureC || 94.2) / 105) * 100)}%`
                }}
              ></div>
            </div>
            <div className="flex justify-between font-label-code text-[0.625rem] text-tertiary mt-1">
              <span>WARN: 85°C</span>
              <span className="text-error font-bold">TRIP: 105°C</span>
            </div>
          </div>

          {/* Card 2: Load Demand */}
          <div className="bg-surface-container-low p-space-md border border-surface-variant/40 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-label-meta text-label-meta text-tertiary uppercase">Load Demand</span>
              <span className="px-1.5 py-0.5 bg-primary text-on-primary font-label-code text-[0.625rem] font-bold">
                {selectedAsset.loadPercentage || 98.4}%
              </span>
            </div>
            <div className="mt-space-xs flex items-baseline justify-between">
              <span className="font-display text-[2.25rem] leading-none text-primary font-bold">
                {selectedAsset.activeLoadMva || 44.2}
              </span>
              <span className="font-headline-sm text-headline-sm text-primary">MVA</span>
            </div>
            <div className="w-full bg-surface-container h-1.5 mt-space-sm relative">
              <div
                className="bg-primary h-1.5"
                style={{ width: `${Math.min(100, selectedAsset.loadPercentage || 98.4)}%` }}
              ></div>
            </div>
            <div className="flex justify-between font-label-code text-[0.625rem] text-tertiary mt-1">
              <span>RATED: {selectedAsset.ratedMva || 45.0} MVA</span>
              <span className="text-primary font-bold">
                MARGIN: {((selectedAsset.ratedMva || 45.0) - (selectedAsset.activeLoadMva || 44.2)).toFixed(1)} MVA
              </span>
            </div>
          </div>

          {/* Card 3: Dissolved Hydrogen H2 */}
          <div className="bg-surface-container-low p-space-md border border-surface-variant/40 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-label-meta text-label-meta text-tertiary uppercase">Dissolved H₂</span>
              <span className="px-1.5 py-0.5 bg-primary-fixed text-on-primary-fixed font-label-code text-[0.625rem] font-bold">
                +45 ppm/6h
              </span>
            </div>
            <div className="mt-space-xs flex items-baseline justify-between">
              <span className="font-display text-[2.25rem] leading-none text-on-surface font-bold">
                {selectedAsset.h2Ppm || 185}
              </span>
              <span className="font-headline-sm text-headline-sm text-tertiary">ppm</span>
            </div>
            <div className="w-full bg-surface-container h-1.5 mt-space-sm relative">
              <div className="bg-primary h-1.5" style={{ width: '74%' }}></div>
            </div>
            <div className="flex justify-between font-label-code text-[0.625rem] text-tertiary mt-1">
              <span>BASELINE: 40 ppm</span>
              <span className="text-primary font-bold">IEEE C57.104 T2</span>
            </div>
          </div>

          {/* Card 4: Tank Vibration */}
          <div className="bg-surface-container-low p-space-md border border-surface-variant/40 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-label-meta text-label-meta text-tertiary uppercase">Tank Vibration</span>
              <span
                className={`px-1.5 py-0.5 font-label-code text-[0.625rem] font-bold ${
                  (selectedAsset.vibrationMmS || 4.8) >= 3.0
                    ? 'bg-error text-on-error'
                    : 'bg-secondary text-on-secondary'
                }`}
              >
                {(selectedAsset.vibrationMmS || 4.8) >= 3.0 ? 'ANOMALY' : 'NORMAL'}
              </span>
            </div>
            <div className="mt-space-xs flex items-baseline justify-between">
              <span
                className={`font-display text-[2.25rem] leading-none font-bold ${
                  (selectedAsset.vibrationMmS || 4.8) >= 3.0 ? 'text-error' : 'text-on-surface'
                }`}
              >
                {selectedAsset.vibrationMmS || 4.8}
              </span>
              <span className="font-headline-sm text-headline-sm text-tertiary">mm/s</span>
            </div>
            <div className="w-full bg-surface-container h-1.5 mt-space-sm relative">
              <div
                className={`h-1.5 ${
                  (selectedAsset.vibrationMmS || 4.8) >= 3.0 ? 'bg-error' : 'bg-secondary'
                }`}
                style={{ width: '82%' }}
              ></div>
            </div>
            <div className="flex justify-between font-label-code text-[0.625rem] text-tertiary mt-1">
              <span>NORMAL: &lt;2.5</span>
              <span className="text-error font-bold">COIL RESONANCE</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. AI DIAGNOSTIC ATTRIBUTION & ROOT CONTRIBUTING FACTORS
         ========================================================================= */}
      <section className="bg-surface-container-lowest p-space-lg shadow-sm border border-surface-variant">
        <div className="flex items-center justify-between pb-space-xs mb-space-md border-b border-surface-variant">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[1.25rem]">fact_check</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface uppercase">
              AI Diagnostic Attribution &amp; Root Contributing Factors
            </h3>
          </div>
          <span className="font-label-code text-label-code text-tertiary">
            WEIGHTED INFERENCE BREAKDOWN • ENGINE v4.1
          </span>
        </div>

        <div className="space-y-space-sm">
          {(selectedAsset.contributingFactors && selectedAsset.contributingFactors.length > 0
            ? selectedAsset.contributingFactors
            : [
                {
                  id: 1,
                  title: 'Ambient Heat Surge & Industrial Demand Peak',
                  tag: '+34% vs 30-Day Avg',
                  tagType: 'primary',
                  description:
                    'Active loading increased from nominal 36.7 MVA to 44.2 MVA concurrent with 38.6°C heat wave across regional industrial corridor feeder line.',
                  weight: '38.4%'
                },
                {
                  id: 2,
                  title: 'Auxiliary Cooling Fan Bank #2 Complete Trip',
                  tag: 'CRITICAL LOSS',
                  tagType: 'error',
                  description:
                    'Telemetry registers RPM: 0 on cooling motor starter #2 following overcurrent lockout at 11:20:18 UTC. Unit operating at restricted 50% radiator air-displacement.',
                  weight: '31.2%'
                },
                {
                  id: 3,
                  title: 'Dissolved Hydrogen (H₂) Generation Velocity',
                  tag: 'DGA ROGERS RATIO: ALERT',
                  tagType: 'surface',
                  description:
                    'Sensor probe detects rapid spike (+45 ppm in 6 hours). Gas composition implies low-energy electrical discharge / localized thermal decomposition in Coil B winding.',
                  weight: '18.6%'
                },
                {
                  id: 4,
                  title: 'Phase-C Harmonic Distortion Elevation',
                  tag: 'THD: 4.2%',
                  tagType: 'surface',
                  description:
                    '2nd and 5th harmonic presence creating secondary eddy-current heating on upper tank periphery and bushing terminal clamps.',
                  weight: '11.8%'
                }
              ]
          ).map((factor) => {
            const isError = factor.tagType === 'error';
            return (
              <div
                key={factor.id}
                className={`p-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border border-surface-variant/40 ${
                  isError ? 'bg-error-container/20' : 'bg-surface-container-low'
                }`}
              >
                <div className="flex items-start gap-space-md">
                  <span
                    className={`font-label-code text-label-code font-bold px-2 py-1 h-fit ${
                      isError ? 'bg-error text-on-error' : 'bg-primary text-on-primary'
                    }`}
                  >
                    #{factor.id}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-headline-sm text-body-lg font-bold text-on-surface">
                        {factor.title}
                      </h4>
                      <span
                        className={`px-1.5 py-0.5 font-label-code text-label-code font-bold ${
                          isError
                            ? 'bg-error text-on-error'
                            : 'bg-primary/20 text-on-primary-fixed-variant'
                        }`}
                      >
                        {factor.tag}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                      {factor.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:items-end min-w-[130px] shrink-0">
                  <span className="font-label-meta text-label-meta text-tertiary uppercase">
                    Risk Contribution
                  </span>
                  <span
                    className={`font-headline-sm text-headline-sm font-bold ${
                      isError ? 'text-error' : 'text-primary'
                    }`}
                  >
                    {factor.weight}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
