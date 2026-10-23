import React, { useState } from 'react';
import { useGrid } from '../context/GridContext';

export default function DashboardPage() {
  const {
    navigateToAsset,
    navigateToSimulation,
    assets,
    searchQuery,
    openDispatchModal,
    openInjectionModal,
    setActiveTab,
  } = useGrid();
  const [selectedVoltage, setSelectedVoltage] = useState('345kV Bulk');
  const [riskFilter, setRiskFilter] = useState('all');
  const [assetCategoryFilter, setAssetCategoryFilter] = useState('All Assets');
  const [tableSearch, setTableSearch] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);

  // Filtered Assets for Table
  const filteredAssets = assets.filter((asset) => {
    const matchesCategory =
      assetCategoryFilter === 'All Assets' || asset.category === assetCategoryFilter;
    const matchesSearch =
      asset.name.toLowerCase().includes((tableSearch || searchQuery).toLowerCase()) ||
      asset.substation.toLowerCase().includes((tableSearch || searchQuery).toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* 1. TOP EDITORIAL HEADER (Without Sys Time, Export Log, and Simulate Emergency Shed) */}
      <div className="flex flex-col items-start justify-between gap-space-md pb-space-md border-b border-surface-variant">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-space-sm">
            <span className="font-label-code text-label-code uppercase tracking-widest text-primary px-1.5 py-0.5 bg-primary/10">
              MISSION CRITICAL DISPATCH
            </span>
            <span className="font-label-meta text-label-meta uppercase tracking-wider text-tertiary">
              SECTOR-04 REGIONAL GRID
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Grid Operations Overview
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
            Real-time telemetry, AI failure probability analysis, and hypothetical mitigation pathways across 4 primary transmission substations.
          </p>
        </div>
      </div>

      {/* 2. MAIN KPI METRIC ROW (SCADA Industrial Instrument Instrumentation Panels) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* KPI 1: Asset Fleet */}
        <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest border border-outline-variant/80 rounded-lg hover:border-outline transition-colors">
          <div className="flex items-center justify-between pb-2 border-b border-surface-variant/40">
            <div className="flex items-center gap-1.5 font-label-code text-[0.6875rem] text-tertiary uppercase tracking-wider font-semibold">
              <span className="w-1.5 h-1.5 rounded-xs bg-secondary"></span>
              <span>CH-01 // FLEET INVENTORY</span>
            </div>
            <span className="font-label-code text-[0.625rem] px-2 py-0.5 rounded border border-secondary/30 bg-secondary/10 text-secondary font-bold tracking-wider">
              100% ONLINE
            </span>
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <div>
              <span className="font-telemetry-num text-3xl font-bold text-on-surface tracking-tight">
                128
              </span>
              <span className="font-label-meta text-xs text-tertiary ml-1.5 uppercase font-medium">Nodes</span>
            </div>
            <span className="font-label-code text-[0.6875rem] text-on-surface-variant">Active Polling</span>
          </div>
          <div className="font-label-code text-[0.6875rem] text-on-surface-variant pt-2 border-t border-surface-variant/60 flex items-center justify-between">
            <span>12 Subs</span>
            <span className="text-tertiary/40">|</span>
            <span>38 TXs</span>
            <span className="text-tertiary/40">|</span>
            <span>78 Feeders</span>
          </div>
        </div>

        {/* KPI 2: High Risk Assets */}
        <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest border border-outline-variant/80 rounded-lg hover:border-outline transition-colors">
          <div className="flex items-center justify-between pb-2 border-b border-surface-variant/40">
            <div className="flex items-center gap-1.5 font-label-code text-[0.6875rem] text-tertiary uppercase tracking-wider font-semibold">
              <span className="w-1.5 h-1.5 rounded-xs bg-primary"></span>
              <span>CH-02 // THERMAL MARGINS</span>
            </div>
            <span className="font-label-code text-[0.625rem] px-2 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary font-bold tracking-wider">
              +1 PAST 4H
            </span>
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <div>
              <span className="font-telemetry-num text-3xl font-bold text-primary tracking-tight">
                3
              </span>
              <span className="font-label-meta text-xs text-primary/80 ml-1.5 uppercase font-medium">Alert Units</span>
            </div>
            <span className="font-label-code text-[0.6875rem] text-primary font-semibold">Load Relief Req</span>
          </div>
          <div className="font-label-code text-[0.6875rem] text-on-surface-variant pt-2 border-t border-surface-variant/60 flex items-center justify-between truncate">
            <span className="truncate">TX-Oak-04 • TX-Pine-02 • F-14A</span>
          </div>
        </div>

        {/* KPI 3: Critical Breakers */}
        <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest border border-outline-variant/80 rounded-lg hover:border-outline transition-colors">
          <div className="flex items-center justify-between pb-2 border-b border-surface-variant/40">
            <div className="flex items-center gap-1.5 font-label-code text-[0.6875rem] text-tertiary uppercase tracking-wider font-semibold">
              <span className="w-1.5 h-1.5 rounded-xs bg-error animate-pulse"></span>
              <span>CH-03 // TRIP PROTECTION</span>
            </div>
            <span className="font-label-code text-[0.625rem] px-2 py-0.5 rounded border border-error/40 bg-error/10 text-error font-bold tracking-wider">
              P1 CRITICAL
            </span>
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <div>
              <span className="font-telemetry-num text-3xl font-bold text-error tracking-tight">
                1
              </span>
              <span className="font-label-meta text-xs text-error/80 ml-1.5 uppercase font-medium">Trip Trigger</span>
            </div>
            <span className="font-label-code text-[0.6875rem] text-error font-semibold">Pyrolysis Runaway</span>
          </div>
          <div className="font-label-code text-[0.6875rem] text-on-surface-variant pt-2 border-t border-surface-variant/60 flex items-center justify-between truncate">
            <span>Limit Breach: <strong className="text-error font-bold">TX-Oak-04 (94.2°C)</strong></span>
          </div>
        </div>

        {/* KPI 4: Stale Telemetry */}
        <div className="flex flex-col justify-between p-space-md bg-surface-container-lowest border border-outline-variant/80 rounded-lg hover:border-outline transition-colors">
          <div className="flex items-center justify-between pb-2 border-b border-surface-variant/40">
            <div className="flex items-center gap-1.5 font-label-code text-[0.6875rem] text-tertiary uppercase tracking-wider font-semibold">
              <span className="w-1.5 h-1.5 rounded-xs bg-tertiary"></span>
              <span>CH-04 // RTU / DNP3 SYNC</span>
            </div>
            <span className="font-label-code text-[0.625rem] px-2 py-0.5 rounded border border-outline-variant bg-surface-container-high text-tertiary font-bold tracking-wider">
              POLL LAG
            </span>
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <div>
              <span className="font-telemetry-num text-3xl font-bold text-on-surface tracking-tight">
                2
              </span>
              <span className="font-label-meta text-xs text-tertiary ml-1.5 uppercase font-medium">Stale Feeds</span>
            </div>
            <span className="font-label-code text-[0.6875rem] text-tertiary">&gt;120s Latency</span>
          </div>
          <div className="font-label-code text-[0.6875rem] text-on-surface-variant pt-2 border-t border-surface-variant/60 flex items-center justify-between truncate">
            <span>Feeder 14B • Sensor T-88 (-18dBm)</span>
          </div>
        </div>
      </div>


      {/* Multi-Transformer Predictive Maintenance & Cascading Alert Banner */}
      <div className="p-space-md bg-surface-container-low border border-primary/40 rounded flex flex-col md:flex-row md:items-center justify-between gap-space-md shadow-xs">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-[2rem] shrink-0 mt-0.5">
            pending_actions
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-headline-sm text-body-md font-bold text-on-surface uppercase tracking-wider">
                Multi-Transformer Predictive Maintenance Queue
              </h3>
              <span className="px-2 py-0.5 bg-primary text-on-primary font-label-code text-[0.6875rem] font-bold uppercase rounded">
                3 TRANSFORMERS PENDING
              </span>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant mt-1 max-w-2xl">
              Beyond TX-04, <strong>TX-09 (Feeder F-04)</strong> and <strong>TX-Pine-02 (West Sub)</strong> have overdue cooling and RTU maintenance. If TX-04 trips, redirected load will trigger cascading secondary failures within <strong>4.5 hours</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('assets');
              window.scrollTo({ top: 150, behavior: 'smooth' });
            }}
            className="py-2 px-space-md bg-primary hover:bg-primary/90 text-on-primary font-headline-sm text-xs uppercase font-bold tracking-wider rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[1rem]">tune</span>
            <span>View Maintenance Radar</span>
          </button>

          <button
            type="button"
            onClick={() => openInjectionModal('TX-09')}
            className="py-2 px-space-md bg-surface hover:bg-surface-container border border-outline-variant text-on-surface font-label-code text-xs uppercase font-bold rounded transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[1rem] text-primary">stream</span>
            <span>Inject Dataset Stream</span>
          </button>
        </div>
      </div>

      {/* 3. ASSET RISK REGISTRY (Shifted directly after KPI cards as per user instructions) */}
      <div className="flex flex-col bg-surface-container-lowest border border-surface-variant rounded overflow-hidden shadow-sm">
        {/* Table Controls & Header */}
        <div className="p-space-md bg-surface-container border-b border-surface-variant flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <span className="font-headline-sm text-headline-sm text-on-surface uppercase font-bold tracking-tight">
              ASSET RISK REGISTRY
            </span>
            <span className="font-label-code text-label-code px-2 py-0.5 rounded bg-surface border border-outline-variant text-tertiary font-semibold">
              {filteredAssets.length} OF 128 DISPLAYED
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-space-sm">
            {/* Category Filter Tabs */}
            <div className="inline-flex rounded border border-outline-variant bg-surface p-0.5 font-label-code text-label-code">
              {['All Assets', 'Transformers', 'Feeders'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setAssetCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    assetCategoryFilter === cat
                      ? 'bg-inverse-surface text-inverse-on-surface'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[1rem] text-tertiary">
                search
              </span>
              <input
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="pl-7 pr-space-sm py-1 bg-surface border border-outline-variant rounded font-body-sm text-body-sm text-on-surface placeholder:text-tertiary focus:outline-none focus:border-on-surface"
                placeholder="Filter asset ID..."
                type="text"
              />
            </div>

            <button className="flex items-center gap-1 px-space-sm py-1 bg-surface border border-outline-variant rounded font-label-code text-label-code text-on-surface hover:bg-surface-container cursor-pointer">
              <span className="material-symbols-outlined text-[0.875rem]">filter_list</span>
              <span>SORT: RISK (DESC)</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-surface-variant font-label-meta text-label-meta uppercase text-tertiary tracking-wider">
                <th className="py-2.5 px-space-md">ASSET IDENTIFIER</th>
                <th className="py-2.5 px-space-md">CLASS / TYPE</th>
                <th className="py-2.5 px-space-md">SUBSTATION NODE</th>
                <th className="py-2.5 px-space-md text-right">ACTIVE LOAD</th>
                <th className="py-2.5 px-space-md text-right">OIL / COND TEMP</th>
                <th className="py-2.5 px-space-md text-right">AI RISK SCORE</th>
                <th className="py-2.5 px-space-md">CLASSIFICATION</th>
                <th className="py-2.5 px-space-md">TELEMETRY STATE</th>
                <th className="py-2.5 px-space-md text-center">DIAGNOSTICS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant font-body-sm text-body-sm text-on-surface">
              {filteredAssets.map((asset) => {
                const isCrit = asset.riskClassification === 'CRITICAL';
                const isHigh = asset.riskClassification === 'HIGH RISK';
                const isMed = asset.riskClassification === 'MEDIUM';
                const isLow = asset.riskClassification === 'LOW';
                const isDegrad = asset.isStale || asset.riskClassification === 'INCOMPLETE';

                return (
                  <tr
                    key={asset.id}
                    className={`transition-colors ${
                      isCrit
                        ? 'bg-error-container/10 hover:bg-error-container/20'
                        : isDegrad
                        ? 'bg-surface-container-high/20 hover:bg-surface'
                        : 'hover:bg-surface'
                    }`}
                  >
                    {/* ASSET IDENTIFIER with Icon */}
                    <td className="py-2.5 px-space-md font-headline-sm font-semibold flex items-center gap-2">
                      <span
                        className={`material-symbols-outlined text-[1.125rem] ${
                          isCrit
                            ? 'text-error'
                            : isHigh
                            ? 'text-primary'
                            : isMed
                            ? 'text-primary'
                            : isLow
                            ? 'text-secondary'
                            : 'text-tertiary'
                        }`}
                      >
                        {isCrit
                          ? 'error'
                          : isHigh
                          ? 'warning'
                          : isMed
                          ? 'power'
                          : isLow
                          ? 'check_circle'
                          : 'cloud_off'}
                      </span>
                      <span
                        className={
                          isCrit
                            ? 'text-error font-bold'
                            : isHigh
                            ? 'text-primary font-bold'
                            : 'text-on-surface font-semibold'
                        }
                      >
                        {asset.name}
                      </span>
                    </td>

                    {/* CLASS / TYPE */}
                    <td className="py-2.5 px-space-md text-on-surface-variant font-label-code text-label-code">
                      {asset.classType}
                    </td>

                    {/* SUBSTATION NODE */}
                    <td className="py-2.5 px-space-md">{asset.substation}</td>

                    {/* ACTIVE LOAD */}
                    <td
                      className={`py-2.5 px-space-md text-right font-telemetry-num text-telemetry-num ${
                        isCrit
                          ? 'text-error font-bold'
                          : isHigh
                          ? 'text-primary font-semibold'
                          : 'text-on-surface'
                      }`}
                    >
                      {asset.activeLoadMva !== null
                        ? `${asset.activeLoadMva} MVA (${asset.loadPercentage}%)`
                        : '--'}
                    </td>

                    {/* OIL / COND TEMP */}
                    <td
                      className={`py-2.5 px-space-md text-right font-telemetry-num text-telemetry-num ${
                        isCrit ? 'text-error font-bold' : 'text-on-surface'
                      }`}
                    >
                      {asset.temperatureC !== null ? `${asset.temperatureC}°C` : '--'}
                    </td>

                    {/* AI RISK SCORE */}
                    <td
                      className={`py-2.5 px-space-md text-right font-headline-sm text-body-md font-bold ${
                        isCrit
                          ? 'text-error'
                          : isHigh
                          ? 'text-primary'
                          : isLow
                          ? 'text-secondary'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      {asset.riskScore !== null ? `${asset.riskScore}%` : '--'}
                    </td>

                    {/* CLASSIFICATION */}
                    <td className="py-2.5 px-space-md">
                      <span
                        className={`font-label-code text-label-code px-2 py-0.5 rounded font-bold uppercase ${
                          isCrit
                            ? 'bg-error text-on-error'
                            : isHigh
                            ? 'bg-primary-fixed text-on-primary-fixed-variant'
                            : isMed
                            ? 'bg-surface-container-high border border-outline-variant text-on-surface'
                            : isLow
                            ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                            : 'bg-surface-container-high border border-outline-variant text-tertiary'
                        }`}
                      >
                        {asset.riskClassification}
                      </span>
                    </td>

                    {/* TELEMETRY STATE */}
                    <td className="py-2.5 px-space-md">
                      <span
                        className={`font-label-code text-label-code flex items-center gap-1.5 ${
                          isDegrad ? 'text-primary' : 'text-secondary'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isDegrad ? 'bg-primary animate-pulse' : 'bg-secondary'
                          }`}
                        ></span>
                        {asset.telemetryStatus}
                      </span>
                    </td>

                    {/* DIAGNOSTICS */}
                    <td className="py-2.5 px-space-md text-center">
                      <button
                        onClick={() => navigateToAsset(asset.id)}
                        className={`px-2.5 py-1 rounded font-label-code text-label-code transition-colors font-bold cursor-pointer ${
                          isCrit
                            ? 'bg-surface border border-error text-error hover:bg-error hover:text-on-error'
                            : 'bg-surface border border-outline-variant hover:border-on-surface text-on-surface'
                        }`}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Pagination / Status Footer */}
        <div className="p-space-sm bg-surface-container border-t border-surface-variant flex items-center justify-between text-body-sm text-on-surface-variant">
          <span className="font-label-meta text-label-meta uppercase text-tertiary">
            SYSTEM MODEL: IEEE 118-BUS EXTENDED • STATE ESTIMATOR CONVERGED
          </span>
          <div className="flex items-center gap-space-xs font-label-code text-label-code">
            <button className="px-2 py-0.5 border border-outline-variant rounded bg-surface opacity-50 cursor-not-allowed">
              PREV
            </button>
            <span className="px-2">PAGE 1 OF 22</span>
            <button className="px-2 py-0.5 border border-outline-variant rounded bg-surface hover:bg-surface-container cursor-pointer">
              NEXT
            </button>
          </div>
        </div>
      </div>

      {/* 4. AI RISK INTELLIGENCE & DECISION SUPPORT (Shifted below Asset Risk Table) */}
      <div className="bg-surface-container-lowest border border-surface-variant rounded shadow-sm overflow-hidden">
        {/* Panel Header */}
        <div className="p-space-md bg-surface-container border-b border-surface-variant flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[1.25rem] text-primary">psychology</span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
              AI RISK INTELLIGENCE &amp; DECISION SUPPORT
            </span>
          </div>
          <span className="font-label-code text-label-code px-2 py-0.5 rounded bg-error-container text-on-error-container font-bold">
            ALERT LEVEL 4
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-surface-variant">
          {/* Focused Asset & Risk Gauge Block (Col 1: ~4 cols) */}
          <div className="lg:col-span-4 p-space-lg flex flex-col justify-between bg-surface">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="font-headline-md text-headline-md text-on-surface font-bold">TX-Oak-04</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    138kV / 13.8kV Step-Down Transformer • North Bus 2
                  </span>
                </div>
                <button
                  onClick={() => navigateToAsset('TX-Oak-04')}
                  className="p-1 text-tertiary hover:text-on-surface cursor-pointer"
                  title="Asset Diagnostics History"
                >
                  <span className="material-symbols-outlined text-[1.25rem]">history</span>
                </button>
              </div>

              {/* Risk Score Gauge Block */}
              <div className="mt-space-md p-space-md bg-error-container/30 border border-error/20 rounded flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-label-meta text-label-meta uppercase text-error font-bold">
                    FAILURE PROBABILITY SCORE
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-display text-display text-error leading-none tracking-tighter">
                      91.4
                    </span>
                    <span className="font-headline-sm text-headline-sm text-error/80">/ 100</span>
                  </div>
                  <span className="font-label-code text-label-code text-error font-semibold mt-1">
                    CONFIDENCE: 94.2% (Ensemble Thermal-Acoustic v4.1)
                  </span>
                </div>

                <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#dbc1b8" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#ba1a1a"
                      strokeWidth="3"
                      strokeDasharray="88, 100"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="material-symbols-outlined absolute text-error text-[1.25rem]">warning</span>
                </div>
              </div>
            </div>

            {/* Live Sensor Matrix */}
            <div className="mt-space-md pt-space-md border-t border-surface-variant flex flex-col gap-space-xs">
              <span className="font-label-meta text-label-meta uppercase text-tertiary tracking-wider mb-1">
                REAL-TIME SENSOR READINGS
              </span>
              <div className="grid grid-cols-2 gap-space-xs text-body-sm">
                <div className="p-2 bg-surface-container-lowest rounded border border-surface-variant flex flex-col">
                  <span className="font-label-meta text-label-meta text-tertiary">TOP-OIL TEMP</span>
                  <span className="font-headline-sm text-body-lg text-error font-bold mt-0.5">94.2°C</span>
                  <span className="font-label-code text-[0.625rem] text-error">CRITICAL (Limit: 85°C)</span>
                </div>
                <div className="p-2 bg-surface-container-lowest rounded border border-surface-variant flex flex-col">
                  <span className="font-label-meta text-label-meta text-tertiary">LOADING CAPACITY</span>
                  <span className="font-headline-sm text-body-lg text-primary font-bold mt-0.5">49.2 MVA</span>
                  <span className="font-label-code text-[0.625rem] text-primary">98.4% of 50 MVA</span>
                </div>
                <div className="p-2 bg-surface-container-lowest rounded border border-surface-variant flex flex-col">
                  <span className="font-label-meta text-label-meta text-tertiary">DISSOLVED GAS (H2)</span>
                  <span className="font-headline-sm text-body-lg text-error font-bold mt-0.5">185 ppm</span>
                  <span className="font-label-code text-[0.625rem] text-error">+45 ppm in last 6h</span>
                </div>
                <div className="p-2 bg-surface-container-lowest rounded border border-surface-variant flex flex-col">
                  <span className="font-label-meta text-label-meta text-tertiary">ACOUSTIC VIBRATION</span>
                  <span className="font-headline-sm text-body-lg text-primary font-bold mt-0.5">4.8 mm/s</span>
                  <span className="font-label-code text-[0.625rem] text-on-surface-variant">RMS (Normal: &lt;2.5)</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Contributing Factors (Col 2: ~4 cols) */}
          <div className="lg:col-span-4 p-space-lg flex flex-col justify-between bg-surface-container-lowest">
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-meta text-label-meta uppercase text-tertiary tracking-wider font-bold">
                AI CONTRIBUTING FACTORS (WEIGHTED INFERENCE)
              </span>
              <ul className="flex flex-col gap-3 mt-2">
                <li className="flex items-start gap-2.5 font-body-sm text-body-sm text-on-surface p-2 bg-surface-container-low rounded border border-surface-variant/40">
                  <span className="font-label-code text-label-code px-1.5 py-0.5 bg-primary/10 text-primary font-bold h-fit">
                    #1
                  </span>
                  <div>
                    <strong className="block text-on-surface font-semibold">Ambient Heat Surge + Peak Demand</strong>
                    <span>Sustained ambient heat wave (38°C) + concurrent industrial load spike (+34% vs baseline).</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 font-body-sm text-body-sm text-on-surface p-2 bg-error-container/20 rounded border border-error/20">
                  <span className="font-label-code text-label-code px-1.5 py-0.5 bg-error-container text-error font-bold h-fit">
                    #2
                  </span>
                  <div>
                    <strong className="block text-error font-semibold">Auxiliary Cooling Fan Bank #2 Failure</strong>
                    <span>Complete loss of Bank #2 detected at 11:20 UTC (Zero RPM feedback, 50% radiator capacity).</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 font-body-sm text-body-sm text-on-surface p-2 bg-surface-container-low rounded border border-surface-variant/40">
                  <span className="font-label-code text-label-code px-1.5 py-0.5 bg-primary/10 text-primary font-bold h-fit">
                    #3
                  </span>
                  <div>
                    <strong className="block text-on-surface font-semibold">Dissolved Hydrogen Generation Rate</strong>
                    <span>Elevated H₂ generation rate indicating localized dielectric breakdown on Coil B winding.</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="mt-space-md pt-space-xs text-tertiary font-label-meta text-label-meta uppercase tracking-wider border-t border-surface-variant">
              Model Inference: Ensemble Thermal-Acoustic v4.1.2-prod • State verified
            </div>
          </div>

          {/* Decision Support & Mitigation Action (Col 3: ~4 cols) */}
          <div className="lg:col-span-4 p-space-lg flex flex-col justify-between bg-surface-container-high/40">
            <div>
              <span className="font-label-meta text-label-meta uppercase text-secondary font-bold tracking-wider">
                DECISION SUPPORT — ACTION PLAN
              </span>
              <div className="mt-2 p-3 bg-surface border border-outline-variant rounded font-body-sm text-body-sm text-on-surface flex flex-col gap-2 shadow-xs">
                <div className="flex items-center gap-1.5 text-secondary font-headline-sm font-bold">
                  <span className="material-symbols-outlined text-[1.125rem]">alt_route</span>
                  <span>Recommended Path A: Dynamic Redistribution</span>
                </div>
                <p className="text-on-surface-variant text-[0.8125rem] leading-relaxed">
                  Evaluate hypothetical <strong>8.5 MVA load shift</strong> from TX-Oak-04 to TX-Pine-02 via Feeder Tie F-104. Reduces top-oil temp by an estimated 11.2°C within 35 minutes, eliminating thermal runaway risk.
                </p>
                <div className="flex items-center justify-between font-label-code text-label-code text-secondary pt-1 border-t border-surface-variant/60">
                  <span>PROJECTED DROP:</span>
                  <span className="font-bold">-11.2°C IN 35 MIN</span>
                </div>
              </div>
            </div>

            <div className="mt-space-md flex flex-col gap-2">
              <button
                onClick={() =>
                  openDispatchModal('TX-04', {
                    failureMode: 'Auxiliary Cooling Fan Bank #2 Failure (Thermal 94.2°C)',
                    recommendedAction: 'Immediate dispatch to replace fan bank #2 starter and assess coil B hotspot.',
                    priority: 'P1-EMERGENCY',
                  })
                }
                className="w-full flex items-center justify-center gap-2 py-2 px-space-md bg-primary text-on-primary hover:bg-primary/90 rounded font-headline-sm text-body-md transition-colors shadow cursor-pointer font-bold uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-[1.125rem]">engineering</span>
                <span>Dispatch Field Crew to TX-Oak-04</span>
              </button>

              <button
                onClick={() => navigateToSimulation('TX-Oak-04', 'TX-Pine-02', 8.5)}
                className="w-full flex items-center justify-center gap-2 py-2 px-space-md bg-secondary text-on-secondary hover:bg-on-secondary-container rounded font-headline-sm text-body-md transition-colors shadow cursor-pointer font-semibold"
              >
                <span>Test in Load Redistribution Simulator</span>
                <span className="material-symbols-outlined text-[1.125rem]">arrow_forward</span>
              </button>

              <div className="flex items-center justify-between font-label-meta text-label-meta text-tertiary pt-1">
                <span>SCADA INTERVAL: 4s</span>
                <span>PACKET INTEGRITY: 100% VALIDATED</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. ELECTRICAL GRID TOPOLOGY SCHEMATIC (Shifted to the very bottom / last as requested) */}
      <div className="flex flex-col bg-surface-container-lowest border border-surface-variant rounded overflow-hidden shadow-sm">
        {/* Schematic Toolbar Header */}
        <div className="p-space-md bg-surface-container border-b border-surface-variant flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
          <div className="flex flex-col">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[1.125rem] text-primary">account_tree</span>
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                ELECTRICAL GRID TOPOLOGY — REGIONAL INTERCONNECT
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Single-line bus schematic with real-time transformer and feeder load vectors
            </span>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-space-xs">
            <div className="inline-flex rounded border border-outline-variant bg-surface p-0.5 text-label-code font-label-code">
              {['345kV Bulk', '138kV Sub', '13.8kV Dist'].map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedVoltage(level)}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                    selectedVoltage === level
                      ? 'bg-inverse-surface text-inverse-on-surface'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            <div className="flex items-center border border-outline-variant rounded bg-surface px-1.5 py-1 text-label-code font-label-code gap-1">
              <span className="text-tertiary">RISK:</span>
              <span
                onClick={() => setRiskFilter('crit')}
                className={`cursor-pointer ${
                  riskFilter === 'crit' ? 'text-error font-bold underline' : 'text-error font-bold'
                }`}
              >
                CRIT (4)
              </span>
              <span className="text-tertiary">|</span>
              <span
                onClick={() => setRiskFilter('all')}
                className={`cursor-pointer ${
                  riskFilter === 'all' ? 'text-on-surface font-bold underline' : 'text-tertiary hover:text-on-surface'
                }`}
              >
                ALL (128)
              </span>
            </div>

            <div className="flex items-center border border-outline-variant rounded bg-surface">
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.6))}
                className="p-1 text-tertiary hover:text-on-surface cursor-pointer"
                title="Zoom In"
              >
                <span className="material-symbols-outlined text-[1rem]">add</span>
              </button>
              <div className="w-px h-4 bg-outline-variant"></div>
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.7))}
                className="p-1 text-tertiary hover:text-on-surface cursor-pointer"
                title="Zoom Out"
              >
                <span className="material-symbols-outlined text-[1rem]">remove</span>
              </button>
              <div className="w-px h-4 bg-outline-variant"></div>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1 text-tertiary hover:text-on-surface cursor-pointer"
                title="Reset View"
              >
                <span className="material-symbols-outlined text-[1rem]">restart_alt</span>
              </button>
            </div>
          </div>
        </div>

        {/* Schematic Canvas Simulation Area */}
        <div className="relative w-full h-[520px] bg-[#fbf9f3] overflow-hidden select-none flex items-center justify-center p-4">
          {/* Technical Grid Pattern */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#D9D3C7" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>

          {/* Dynamic Single-Line Vector Topology Diagram */}
          <svg
            className="w-full h-full relative z-10 transition-transform duration-300"
            style={{ transform: `scale(${zoomLevel})` }}
            viewBox="0 0 880 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Main Backbone: BUS-A (North) to BUS-B (West) */}
            <path d="M 180 120 L 440 120 L 700 120" stroke="#31312b" strokeWidth="4" strokeLinecap="square" />
            <text x="440" y="105" textAnchor="middle" fill="#6d776f" className="font-label-code text-[11px] font-bold">
              345kV TRANSMISSION TRUNK • T-LINE-3401 (940 MVA NOMINAL)
            </text>

            {/* Tie line down to West Substation (BUS-B) */}
            <path d="M 180 120 L 180 250" stroke="#446554" strokeWidth="2.5" strokeDasharray="6,4" />

            {/* Tie line down to Central North Substation (BUS-A) */}
            <path d="M 440 120 L 440 210" stroke="#944521" strokeWidth="3" />

            {/* Tie line down to East Substation (BUS-C) */}
            <path d="M 700 120 L 700 250" stroke="#446554" strokeWidth="2.5" />

            {/* SUBSTATION A - NORTH BUS (Critical Focal Node) */}
            <rect x="360" y="210" width="160" height="12" fill="#31312b" />
            <text x="440" y="202" textAnchor="middle" fill="#1c1c17" className="font-headline-sm text-[12px] font-bold">
              NORTH SUBSTATION • 138kV MAIN BUS
            </text>

            {/* Branch to TX-Oak-04 (CRITICAL TRANSFORMER) */}
            <path d="M 400 222 L 400 270" stroke="#ba1a1a" strokeWidth="2.5" />
            {/* Breaker CB-104 */}
            <rect x="393" y="240" width="14" height="14" fill="#ffffff" stroke="#ba1a1a" strokeWidth="2" />
            <text x="415" y="251" fill="#ba1a1a" className="font-label-code text-[9px] font-bold">
              CB-104 [CLOSED]
            </text>

            {/* Branch to TX-Maple-01 (HEALTHY TRANSFORMER) */}
            <path d="M 480 222 L 480 270" stroke="#446554" strokeWidth="2.5" />
            {/* Breaker CB-105 */}
            <rect x="473" y="240" width="14" height="14" fill="#ffffff" stroke="#446554" strokeWidth="2" />
            <text x="495" y="251" fill="#446554" className="font-label-code text-[9px]">
              CB-105 [OK]
            </text>

            {/* TX-Oak-04 Active Selected Critical Pod (Focal Point) */}
            <g
              transform="translate(320, 275)"
              className="cursor-pointer group"
              onClick={() => navigateToAsset('TX-Oak-04')}
            >
              <rect x="0" y="0" width="160" height="100" rx="4" fill="#ffffff" stroke="#ba1a1a" strokeWidth="2" strokeDasharray="4,2" />
              <rect x="0" y="0" width="160" height="24" rx="4" fill="#ffdad6" />
              <text x="8" y="16" fill="#93000a" className="font-label-code text-[11px] font-bold">
                TX-Oak-04 • CRITICAL
              </text>
              <circle cx="146" cy="12" r="5" fill="#ba1a1a" className="animate-pulse" />
              <text x="8" y="42" fill="#1c1c17" className="font-label-meta text-[11px] font-bold">
                Risk: 91.4% (Tier 4)
              </text>
              <text x="8" y="58" fill="#55433c" className="font-body-sm text-[10px]">
                Temp: 94.2°C (Limit: 85°)
              </text>
              <text x="8" y="74" fill="#55433c" className="font-body-sm text-[10px]">
                Load: 49.2 / 50.0 MVA (98%)
              </text>
              <text x="8" y="90" fill="#944521" className="font-label-code text-[9px] font-bold">
                ACOUSTIC TRIP IMMINENT →
              </text>
            </g>

            {/* TX-Maple-01 Healthy Transformer Pod */}
            <g
              transform="translate(460, 275)"
              className="cursor-pointer"
              onClick={() => navigateToAsset('TX-Maple-01')}
            >
              <rect x="0" y="0" width="140" height="76" rx="4" fill="#ffffff" stroke="#c6ebd5" strokeWidth="1.5" />
              <rect x="0" y="0" width="140" height="22" rx="4" fill="#f1eee6" />
              <text x="8" y="15" fill="#1c1c17" className="font-label-code text-[10px] font-bold">
                TX-Maple-01
              </text>
              <rect x="100" y="6" width="32" height="12" rx="2" fill="#c6ebd5" />
              <text x="116" y="15" textAnchor="middle" fill="#002114" className="font-label-meta text-[9px] font-bold">
                14.1%
              </text>
              <text x="8" y="38" fill="#555e57" className="font-body-sm text-[10px]">
                Temp: 42.1°C • NOMINAL
              </text>
              <text x="8" y="52" fill="#555e57" className="font-body-sm text-[10px]">
                Load: 30.6 MVA (61.2%)
              </text>
              <text x="8" y="66" fill="#446554" className="font-label-code text-[9px]">
                DGA H2: 12 ppm (OK)
              </text>
            </g>

            {/* Distribution Feeders exiting TX-Oak-04 */}
            <path d="M 370 375 L 370 410" stroke="#ba1a1a" strokeWidth="2" />
            <path d="M 430 375 L 430 410" stroke="#944521" strokeWidth="2" />

            {/* Feeder F-101 */}
            <g transform="translate(330, 410)">
              <rect x="0" y="0" width="80" height="34" rx="2" fill="#ffffff" stroke="#dbc1b8" strokeWidth="1" />
              <text x="6" y="14" fill="#1c1c17" className="font-label-code text-[9px] font-bold">
                F-101 (13.8kV)
              </text>
              <text x="6" y="27" fill="#446554" className="font-label-meta text-[9px]">
                12.4 MW • NOM
              </text>
            </g>

            {/* Feeder F-102 */}
            <g transform="translate(420, 410)">
              <rect x="0" y="0" width="90" height="34" rx="2" fill="#ffdbce" stroke="#944521" strokeWidth="1.5" />
              <text x="6" y="14" fill="#370e00" className="font-label-code text-[9px] font-bold">
                F-102 (13.8kV)
              </text>
              <text x="6" y="27" fill="#944521" className="font-label-meta text-[9px] font-bold">
                28.1 MW • HEAVY
              </text>
            </g>

            {/* Interconnect Feeder Tie F-104 towards West Substation */}
            <path d="M 440 444 L 440 465 L 240 465 L 240 360" stroke="#944521" strokeWidth="1.5" strokeDasharray="4,4" />
            <text x="340" y="460" textAnchor="middle" fill="#944521" className="font-label-code text-[9px] font-bold">
              HYPOTHETICAL MITIGATION TIE F-104 (-8.5 MVA CAPACITY)
            </text>

            {/* SUBSTATION B - WEST BUS */}
            <g transform="translate(110, 250)">
              <rect x="0" y="0" width="140" height="10" fill="#31312b" />
              <text x="70" y="-8" textAnchor="middle" fill="#1c1c17" className="font-headline-sm text-[11px] font-bold">
                WEST SUBSTATION (138kV)
              </text>
              <g className="cursor-pointer" onClick={() => navigateToAsset('TX-Pine-02')}>
                <rect x="10" y="30" width="120" height="74" rx="3" fill="#ffffff" stroke="#944521" strokeWidth="1.5" />
                <rect x="10" y="30" width="120" height="20" rx="3" fill="#ffdbce" />
                <text x="16" y="44" fill="#370e00" className="font-label-code text-[10px] font-bold">
                  TX-Pine-02 • HIGH
                </text>
                <text x="16" y="66" fill="#1c1c17" className="font-label-meta text-[10px]">
                  Risk: 76.2%
                </text>
                <text x="16" y="80" fill="#55433c" className="font-body-sm text-[9px]">
                  Harmonic distortion 2ndary
                </text>
                <text x="16" y="94" fill="#446554" className="font-label-code text-[9px]">
                  Reserve head: 11.4 MVA
                </text>
              </g>
            </g>

            {/* SUBSTATION C - EAST BUS */}
            <g transform="translate(630, 250)">
              <rect x="0" y="0" width="140" height="10" fill="#31312b" />
              <text x="70" y="-8" textAnchor="middle" fill="#1c1c17" className="font-headline-sm text-[11px] font-bold">
                EAST SUBSTATION (138kV)
              </text>
              <g className="cursor-pointer" onClick={() => navigateToAsset('TX-Elm-01')}>
                <rect x="10" y="30" width="120" height="74" rx="3" fill="#ffffff" stroke="#dbc1b8" strokeWidth="1" />
                <rect x="10" y="30" width="120" height="20" rx="3" fill="#f1eee6" />
                <text x="16" y="44" fill="#1c1c17" className="font-label-code text-[10px] font-bold">
                  TX-Elm-01
                </text>
                <text x="16" y="66" fill="#446554" className="font-label-meta text-[10px]">
                  Risk: 22.8% • NOMINAL
                </text>
                <text x="16" y="80" fill="#555e57" className="font-body-sm text-[9px]">
                  38.2°C • 54% Load
                </text>
                <text x="16" y="94" fill="#555e57" className="font-label-code text-[9px]">
                  Feeder tie active
                </text>
              </g>
            </g>
          </svg>

          {/* Dynamic Floating SCADA Telemetry Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-surface/90 border border-outline-variant px-2.5 py-1 rounded shadow-sm text-label-code font-label-code text-on-surface">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span>TOPOLOGY FEED: N-1 CONTINGENCY VERIFIED</span>
          </div>
        </div>

        {/* Schematic Footer & Engineering Legend */}
        <div className="p-space-sm bg-surface-container border-t border-surface-variant flex flex-wrap items-center justify-between text-body-sm gap-space-sm">
          <div className="flex items-center gap-space-md">
            <span className="font-label-meta text-label-meta uppercase text-tertiary">LEGEND:</span>
            <div className="flex items-center gap-1.5 font-label-code text-label-code text-on-surface">
              <span className="w-2.5 h-2.5 rounded bg-secondary-fixed border border-secondary"></span>
              <span>Low (&lt;30%)</span>
            </div>
            <div className="flex items-center gap-1.5 font-label-code text-label-code text-on-surface">
              <span className="w-2.5 h-2.5 rounded bg-surface-variant border border-outline"></span>
              <span>Medium (30-65%)</span>
            </div>
            <div className="flex items-center gap-1.5 font-label-code text-label-code text-primary">
              <span className="w-2.5 h-2.5 rounded bg-primary-fixed border border-primary"></span>
              <span>High (65-85%)</span>
            </div>
            <div className="flex items-center gap-1.5 font-label-code text-label-code text-error font-bold">
              <span className="w-2.5 h-2.5 rounded bg-error-container border border-error"></span>
              <span>Critical (&gt;85%)</span>
            </div>
          </div>
          <div className="font-label-meta text-label-meta text-tertiary">
            Schematic representation mapped to active SCADA telemetry models.
          </div>
        </div>
      </div>
    </div>
  );
}
