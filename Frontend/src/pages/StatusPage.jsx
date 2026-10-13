import React from 'react';
import { useGrid } from '../context/GridContext';

export default function StatusPage() {
  const {
    isProbing,
    runForceProbe,
    pingRTU,
    flagMaintenance,
    viewEventLog,
    currentTime
  } = useGrid();

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* TOP BAR: TELEMETRY PULSE & ACTIONS */}
      <div className="w-full bg-surface-container-lowest p-space-lg shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-space-md border border-surface-variant">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-sm">
            <span className="w-2.5 h-2.5 bg-secondary rounded-full animate-pulse"></span>
            <span className="font-label-code text-label-code text-on-surface-variant uppercase tracking-widest">
              DIAGNOSTIC WORKSPACE // CLUSTER 04-A
            </span>
            <span className="px-1.5 py-0.5 bg-secondary-container text-on-secondary-container font-label-code text-label-code font-bold">
              GRID INTERFACE ACTIVE
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            System Status &amp; Telemetry Ingestion
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Monitor SCADA backend availability, AI risk model health, telemetry ingestion queues, and sensor data freshness.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm bg-surface-container-low p-space-sm border border-surface-variant">
          <div className="flex items-center gap-2 px-space-sm py-1 bg-surface-container-lowest shadow-sm border border-outline-variant">
            <span className="material-symbols-outlined text-primary text-[1rem]">satellite_alt</span>
            <div className="flex flex-col">
              <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                TELEMETRY PROBE
              </span>
              <span className="font-telemetry-num text-telemetry-num text-on-surface">
                {currentTime} <span className="text-secondary">(REST v1 / 18ms)</span>
              </span>
            </div>
          </div>
          <button
            onClick={runForceProbe}
            disabled={isProbing}
            className="flex items-center gap-2 px-space-md py-2 bg-inverse-surface text-inverse-on-surface font-label-code text-label-code uppercase tracking-wider hover:bg-primary transition-colors cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[1rem] ${isProbing ? 'animate-spin' : ''}`}>
              restart_alt
            </span>
            <span>{isProbing ? 'Probing SCADA Nodes...' : 'Force Health Probe'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: SERVICE HEALTH & BACKEND ARCHITECTURE */}
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between px-space-xs">
          <div className="flex items-center gap-2">
            <span className="font-label-code text-label-code text-on-surface uppercase font-bold tracking-wider">
              01 // SERVICE HEALTH &amp; BACKEND ARCHITECTURE
            </span>
            <span className="w-2 h-2 bg-secondary rounded-full"></span>
          </div>
          <span className="font-label-meta text-label-meta text-on-surface-variant uppercase tracking-widest">
            N-1 CONTINGENCY TOLERANCE: ENFORCED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
          {/* Card 1: Core SCADA REST API */}
          <div className="bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between h-full border border-surface-variant">
            <div className="flex flex-col gap-space-sm">
              <div className="flex items-center justify-between bg-surface-container-high px-space-sm py-1 border border-surface-variant">
                <span className="font-label-code text-label-code text-on-surface font-semibold">
                  SRV-01 // REST API
                </span>
                <span className="px-1.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-label-code text-label-code font-bold">
                  OPERATIONAL
                </span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Core SCADA REST API</h3>
                <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                  Build release-v1.8.2 (DNP3 Translation)
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-space-xs">
                <div className="flex flex-col">
                  <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                    Round-Trip Latency
                  </span>
                  <span className="font-display text-headline-lg text-secondary font-bold">
                    18<span className="text-body-md font-body-md text-on-surface-variant ml-1 font-normal">ms</span>
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                    30-Day Availability
                  </span>
                  <span className="font-telemetry-num text-telemetry-num text-on-surface font-bold">99.98%</span>
                </div>
              </div>
            </div>
            <div className="mt-space-md pt-space-xs bg-surface-container-low p-space-sm flex flex-col gap-1 border border-surface-variant/40">
              <div className="flex justify-between items-center font-label-code text-label-code text-on-surface-variant">
                <span>IEC-61850 SUBSTATION TRANSLATOR</span>
                <span className="text-secondary font-bold">NOMINAL</span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5">
                <div className="bg-secondary h-1.5 w-[96%]"></div>
              </div>
            </div>
          </div>

          {/* Card 2: AI Risk Assessment Inference Engine */}
          <div className="bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between h-full border border-surface-variant">
            <div className="flex flex-col gap-space-sm">
              <div className="flex items-center justify-between bg-surface-container-high px-space-sm py-1 border border-surface-variant">
                <span className="font-label-code text-label-code text-on-surface font-semibold">
                  INF-04 // GPU ENSEMBLE
                </span>
                <span className="px-1.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-label-code text-label-code font-bold">
                  OPERATIONAL
                </span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">AI Risk Assessment Engine</h3>
                <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                  Ensemble Model Architecture v4.1
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-space-xs">
                <div className="flex flex-col">
                  <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                    Inference Cycle
                  </span>
                  <span className="font-display text-headline-lg text-secondary font-bold">
                    142<span className="text-body-md font-body-md text-on-surface-variant ml-1 font-normal">ms</span>
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                    Batch Processing
                  </span>
                  <span className="font-telemetry-num text-telemetry-num text-on-surface font-bold">
                    128 Assets / 60s
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-space-md pt-space-xs bg-surface-container-low p-space-sm flex flex-col gap-1 border border-surface-variant/40">
              <div className="flex justify-between items-center font-label-code text-label-code text-on-surface-variant">
                <span>CUDA TENSOR CORE UTILIZATION</span>
                <span className="text-on-surface font-bold">24% VRAM</span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5">
                <div className="bg-secondary h-1.5 w-[24%]"></div>
              </div>
            </div>
          </div>

          {/* Card 3: Power Flow Simulation Engine */}
          <div className="bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between h-full border border-surface-variant">
            <div className="flex flex-col gap-space-sm">
              <div className="flex items-center justify-between bg-surface-container-high px-space-sm py-1 border border-surface-variant">
                <span className="font-label-code text-label-code text-on-surface font-semibold">
                  SIM-02 // NEWTON-RAPHSON
                </span>
                <span className="px-1.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-label-code text-label-code font-bold">
                  OPERATIONAL
                </span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Power Flow Simulation</h3>
                <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                  Grid Contingency Solver v2.3
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-space-xs">
                <div className="flex flex-col">
                  <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                    Convergence Rate
                  </span>
                  <span className="font-display text-headline-lg text-secondary font-bold">
                    99.4<span className="text-body-md font-body-md text-on-surface-variant ml-0.5 font-normal">%</span>
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                    Average Solve Time
                  </span>
                  <span className="font-telemetry-num text-telemetry-num text-on-surface font-bold">
                    310ms / bus
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-space-md pt-space-xs bg-surface-container-low p-space-sm flex flex-col gap-1 border border-surface-variant/40">
              <div className="flex justify-between items-center font-label-code text-label-code text-on-surface-variant">
                <span>JACOBIAN MATRIX RE-FACTORING</span>
                <span className="text-secondary font-bold">STABLE</span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5">
                <div className="bg-secondary h-1.5 w-[99%]"></div>
              </div>
            </div>
          </div>

          {/* Card 4: SCADA Ingestion Queue */}
          <div className="bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between h-full border border-surface-variant">
            <div className="flex flex-col gap-space-sm">
              <div className="flex items-center justify-between bg-error-container px-space-sm py-1 border border-error/30">
                <span className="font-label-code text-label-code text-on-error-container font-semibold">
                  KFK-TS // PIPELINE
                </span>
                <span className="px-1.5 py-0.5 bg-primary text-on-primary font-label-code text-label-code font-bold">
                  DEGRADED OBS
                </span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Telemetry Ingestion Queue</h3>
                <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                  TimescaleDB + Kafka Stream Broker
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-space-xs">
                <div className="flex flex-col">
                  <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                    Ingestion Stream
                  </span>
                  <span className="font-display text-headline-lg text-primary font-bold">
                    4,820<span className="text-body-md font-body-md text-on-surface-variant ml-1 font-normal">evt/s</span>
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="font-label-meta text-label-meta text-primary font-bold">STALE CHANNELS</span>
                  <span className="font-telemetry-num text-telemetry-num text-primary font-bold">
                    2 RTU TIMEOUTS
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-space-md pt-space-xs bg-surface-container-low p-space-sm flex flex-col gap-1 border border-surface-variant/40">
              <div className="flex justify-between items-center font-label-code text-label-code text-primary font-semibold">
                <span>POLL DELAY: &gt;120s THRESHOLD EXCEEDED</span>
                <span>2 OF 128 ASSETS</span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5">
                <div className="bg-primary h-1.5 w-[85%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: AI MODEL STATUS & INFERENCE INTEGRITY */}
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between px-space-xs">
          <div className="flex items-center gap-2">
            <span className="font-label-code text-label-code text-on-surface uppercase font-bold tracking-wider">
              02 // AI MODEL STATUS &amp; INFERENCE INTEGRITY
            </span>
            <span className="w-2 h-2 bg-secondary rounded-full"></span>
          </div>
          <span className="font-label-meta text-label-meta text-on-surface-variant uppercase tracking-widest">
            VALIDATION SUITE: SYNCHRONIZED
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
          {/* Primary Model Sheet */}
          <div className="lg:col-span-8 bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between border border-surface-variant">
            <div className="flex flex-col gap-space-md">
              <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-sm border-b border-surface-variant">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary text-[1.5rem]">neurology</span>
                  <div>
                    <span className="font-label-meta text-label-meta text-on-surface-variant uppercase tracking-wider">
                      DEPLOYMENT SPECIFICATION
                    </span>
                    <h2 className="font-headline-md text-headline-md text-on-surface">
                      Multi-Modal Risk Ensemble (release/v4.1.2-prod)
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container font-label-code text-label-code uppercase font-bold">
                    SHA-256: d8f3a8b2
                  </span>
                  <span className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant font-label-code text-label-code border border-outline-variant">
                    PROD-GRID-WEST
                  </span>
                </div>
              </div>

              {/* Technical Grid Specs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md pt-space-xs">
                <div className="p-space-md bg-surface-container-low flex flex-col gap-space-xs border border-surface-variant/40">
                  <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                    ACTIVE ARCHITECTURE
                  </span>
                  <span className="font-headline-sm text-body-md text-on-surface font-semibold">
                    Dual-Path Physics Ensemble
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Physics-Informed Thermal Degradation Differential Equations + Acoustic FFT Wavelet Classifier for partial discharge signature isolation.
                  </p>
                </div>
                <div className="p-space-md bg-surface-container-low flex flex-col gap-space-xs border border-surface-variant/40">
                  <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                    TRAINING CORPUS &amp; GENERALIZATION
                  </span>
                  <span className="font-headline-sm text-body-md text-on-surface font-semibold">
                    14-Yr Regional SCADA + IEEE-118
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    IEEE 118-Bus Synthetic Contingency Matrix combined with 42,000 real-world extreme climate stress transients (freeze, heat dome, line sag).
                  </p>
                </div>
              </div>

              {/* Micro Telemetry Chart: Inference Latency Stream */}
              <div className="p-space-md bg-surface-container-low flex flex-col gap-space-xs border border-surface-variant/40">
                <div className="flex items-center justify-between">
                  <span className="font-label-code text-label-code text-on-surface uppercase font-bold">
                    INFERENCE CYCLE LATENCY LOG (LAST 24 EPOCHS)
                  </span>
                  <span className="font-label-meta text-label-meta text-secondary font-bold">
                    ALL SAMPLES &lt;200ms
                  </span>
                </div>
                <div className="w-full h-16 pt-2">
                  <svg className="w-full h-full text-secondary" viewBox="0 0 400 40" preserveAspectRatio="none">
                    <path
                      d="M 0,22 L 18,24 L 35,20 L 52,23 L 70,18 L 88,28 L 105,19 L 123,21 L 140,24 L 158,16 L 175,22 L 193,20 L 210,25 L 228,19 L 245,21 L 263,26 L 280,18 L 298,22 L 315,19 L 333,23 L 350,17 L 368,24 L 385,20 L 400,21"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    />
                    <line x1="0" y1="6" x2="400" y2="6" stroke="#b35c36" strokeDasharray="3 3" strokeWidth="1" />
                  </svg>
                </div>
                <div className="flex justify-between items-center font-label-meta text-label-meta text-on-surface-variant">
                  <span>T-24m</span>
                  <span className="text-primary font-bold">--- SAFE INFERENCE BOUNDARY (500ms FAILOVER CEILING)</span>
                  <span>T-0s (142ms)</span>
                </div>
              </div>
            </div>

            <div className="pt-space-md flex flex-wrap items-center justify-between gap-space-sm border-t border-surface-variant mt-2">
              <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                COMMIT REGISTRATION: 2024-10-14 03:19:22 UTC // AUTHOR: GRID-ML-TEAM
              </span>
              <div className="flex items-center gap-space-xs">
                <span className="w-2 h-2 bg-secondary rounded-full"></span>
                <span className="font-label-code text-label-code text-secondary font-bold">
                  MODEL STATUS: HIGH CONFIDENCE
                </span>
              </div>
            </div>
          </div>

          {/* Fallback Engine Inspector */}
          <div className="lg:col-span-4 bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between border border-surface-variant">
            <div className="flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-space-sm border-b border-surface-variant">
                <span className="font-label-code text-label-code text-on-surface uppercase font-bold">
                  FAILOVER SUBSYSTEM
                </span>
                <span className="px-2 py-0.5 bg-surface-container text-on-surface font-label-code text-label-code font-bold border border-outline-variant">
                  STANDBY
                </span>
              </div>
              <div className="p-space-md bg-surface-container-low flex flex-col gap-space-xs border border-surface-variant/40">
                <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                  MECHANISM DESIGNATION
                </span>
                <h3 className="font-headline-sm text-body-md text-on-surface font-semibold">
                  Automated Heuristic Thermal Baseline Rule Engine
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Direct algorithmic computation based on IEEE 738 ambient load curves. Triggers immediately if primary ML Ensemble inference latency exceeds 500ms timeout window.
                </p>
              </div>
              <div className="flex flex-col gap-space-sm pt-space-xs">
                <div className="flex items-center justify-between p-space-sm bg-surface-container-low border border-surface-variant/40">
                  <span className="font-label-code text-label-code text-on-surface-variant">ACTIVE FALLBACK STATE</span>
                  <span className="font-label-code text-label-code text-secondary font-bold">INACTIVE (NOMINAL PRIMARY)</span>
                </div>
                <div className="flex items-center justify-between p-space-sm bg-surface-container-low border border-surface-variant/40">
                  <span className="font-label-code text-label-code text-on-surface-variant">TIMEOUT TRIP THRESHOLD</span>
                  <span className="font-telemetry-num text-telemetry-num text-on-surface font-bold">500 ms</span>
                </div>
                <div className="flex items-center justify-between p-space-sm bg-surface-container-low border border-surface-variant/40">
                  <span className="font-label-code text-label-code text-on-surface-variant">LAST FAILOVER DRILL</span>
                  <span className="font-telemetry-num text-telemetry-num text-on-surface font-medium">36h AGO (PASSED 0.04ms TRIP)</span>
                </div>
              </div>
            </div>
            <div className="mt-space-md pt-space-md bg-surface-container-high p-space-sm flex items-center gap-space-sm border border-surface-variant">
              <span className="material-symbols-outlined text-primary text-[1.25rem]">security</span>
              <span className="font-label-meta text-label-meta text-on-surface uppercase leading-tight">
                Failover interlock disengages instantly on primary ML telemetry recovery. Zero blackouts permitted.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: TELEMETRY FRESHNESS & DATA QUALITY REGISTRY */}
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between px-space-xs">
          <div className="flex items-center gap-2">
            <span className="font-label-code text-label-code text-on-surface uppercase font-bold tracking-wider">
              03 // TELEMETRY FRESHNESS &amp; DATA QUALITY REGISTRY
            </span>
            <span className="w-2 h-2 bg-primary rounded-full"></span>
          </div>
          <span className="font-label-meta text-label-meta text-primary font-bold uppercase tracking-widest">
            2 ASSETS REQUIRE ATTENTION
          </span>
        </div>

        {/* Telemetry Metric Strips */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
          <div className="bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between border border-surface-variant">
            <div className="flex items-center justify-between">
              <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                FRESH TELEMETRY (&lt;5s)
              </span>
              <span className="w-2 h-2 bg-secondary rounded-full"></span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-display text-display text-secondary font-bold">126</span>
              <span className="font-label-code text-label-code text-on-surface-variant">ASSETS</span>
            </div>
            <span className="font-label-meta text-label-meta text-secondary uppercase font-semibold">
              98.4% SUBSTATION FLEET
            </span>
          </div>

          <div className="bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between border border-surface-variant">
            <div className="flex items-center justify-between">
              <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                WARNING / DELAYED (5-60s)
              </span>
              <span className="w-2 h-2 bg-surface-container-highest rounded-full"></span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-display text-display text-on-surface font-bold">00</span>
              <span className="font-label-code text-label-code text-on-surface-variant">ASSETS</span>
            </div>
            <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
              WITHIN RETRY TOLERANCE
            </span>
          </div>

          <div className="bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between border border-surface-variant">
            <div className="flex items-center justify-between">
              <span className="font-label-meta text-label-meta text-primary uppercase font-bold">
                STALE / DEGRADED (&gt;120s)
              </span>
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-display text-display text-primary font-bold">02</span>
              <span className="font-label-code text-label-code text-primary font-bold">ASSETS</span>
            </div>
            <span className="font-label-meta text-label-meta text-primary uppercase font-bold">
              REQUIRES RTU INTERVENTION
            </span>
          </div>

          <div className="bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between border border-surface-variant">
            <div className="flex items-center justify-between">
              <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                TOTAL DISCONNECTED
              </span>
              <span className="w-2 h-2 bg-secondary rounded-full"></span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-display text-display text-on-surface font-bold">00</span>
              <span className="font-label-code text-label-code text-on-surface-variant">ASSETS</span>
            </div>
            <span className="font-label-meta text-label-meta text-secondary uppercase font-semibold">
              ZERO COMPLETE OUTAGES
            </span>
          </div>
        </div>

        {/* Degraded Telemetry Watchlist */}
        <div className="bg-surface-container-lowest shadow-sm overflow-hidden border border-surface-variant">
          <div className="p-space-md bg-surface-container-high flex flex-col md:flex-row md:items-center justify-between gap-space-sm border-b border-surface-variant">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-primary text-[1.25rem]">warning</span>
              <span className="font-headline-sm text-body-md text-on-surface font-semibold uppercase">
                DEGRADED TELEMETRY WATCHLIST // ACTIVE ATTENTION REQUIRED
              </span>
            </div>
            <span className="font-label-code text-label-code text-on-surface-variant uppercase">
              POLLING EXPIRATION WINDOW: 60 SECONDS MAX
            </span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead className="bg-surface-container font-label-meta text-label-meta text-on-surface-variant uppercase tracking-wider border-b border-surface-variant">
                <tr>
                  <th className="p-space-md">ASSET IDENTIFIER / LOCATION</th>
                  <th className="p-space-md">LAST PING</th>
                  <th className="p-space-md">ROOT CAUSE / SCADA DIAGNOSTIC</th>
                  <th className="p-space-md text-right">LAST RECORDED VALUE</th>
                  <th className="p-space-md">QUALITY STATE</th>
                  <th className="p-space-md text-right">REMEDIATION ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container text-on-surface">
                {/* Feeder-14B */}
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="p-space-md">
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-body-md text-on-surface font-bold">Feeder-14B</span>
                      <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                        North Substation Outfeed (Bus 4)
                      </span>
                    </div>
                  </td>
                  <td className="p-space-md">
                    <div className="flex flex-col">
                      <span className="font-telemetry-num text-telemetry-num text-primary font-bold">142s ago</span>
                      <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                        Threshold: 60s
                      </span>
                    </div>
                  </td>
                  <td className="p-space-md">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span className="font-body-sm text-body-sm text-on-surface font-medium">
                        Cellular RTU Gateway Packet Drop (Carrier APN Timeout)
                      </span>
                    </div>
                  </td>
                  <td className="p-space-md text-right">
                    <span className="font-telemetry-num text-body-md text-on-surface font-bold">14.2 MW</span>
                    <div className="font-label-meta text-label-meta text-primary uppercase font-bold">
                      FROZEN TELEMETRY
                    </div>
                  </td>
                  <td className="p-space-md">
                    <span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant font-label-code text-label-code font-bold border border-outline-variant">
                      STALE (HELD)
                    </span>
                  </td>
                  <td className="p-space-md text-right">
                    <div className="flex items-center justify-end gap-space-xs">
                      <button
                        onClick={() => pingRTU('Feeder-14B')}
                        className="px-2.5 py-1 bg-inverse-surface text-inverse-on-surface hover:bg-primary font-label-code text-label-code uppercase transition-colors cursor-pointer"
                      >
                        Ping RTU
                      </button>
                      <button
                        onClick={() => flagMaintenance('Feeder-14B')}
                        className="px-2.5 py-1 bg-surface-container-high text-on-surface hover:bg-primary hover:text-on-primary font-label-code text-label-code uppercase transition-colors cursor-pointer border border-outline-variant"
                      >
                        Flag Maintenance
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Sensor T-88 */}
                <tr className="hover:bg-surface-container-low transition-colors bg-surface-container-low/50">
                  <td className="p-space-md">
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-body-md text-on-surface font-bold">Sensor T-88</span>
                      <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                        West Substation Ambient Probe
                      </span>
                    </div>
                  </td>
                  <td className="p-space-md">
                    <div className="flex flex-col">
                      <span className="font-telemetry-num text-telemetry-num text-primary font-bold">185s ago</span>
                      <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                        Threshold: 60s
                      </span>
                    </div>
                  </td>
                  <td className="p-space-md">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span className="font-body-sm text-body-sm text-on-surface font-medium">
                        Power fluctuation on RTU aux battery circuit (Float Voltage 10.8V)
                      </span>
                    </div>
                  </td>
                  <td className="p-space-md text-right">
                    <span className="font-telemetry-num text-body-md text-on-surface font-bold">36.4°C</span>
                    <div className="font-label-meta text-label-meta text-primary uppercase font-bold">
                      FROZEN TELEMETRY
                    </div>
                  </td>
                  <td className="p-space-md">
                    <span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant font-label-code text-label-code font-bold border border-outline-variant">
                      STALE (HELD)
                    </span>
                  </td>
                  <td className="p-space-md text-right">
                    <div className="flex items-center justify-end gap-space-xs">
                      <button
                        onClick={() => viewEventLog('Sensor T-88')}
                        className="px-2.5 py-1 bg-surface-container-high text-on-surface hover:bg-inverse-surface hover:text-inverse-on-surface font-label-code text-label-code uppercase transition-colors cursor-pointer border border-outline-variant"
                      >
                        View Event Log
                      </button>
                      <button
                        onClick={() => pingRTU('Sensor T-88')}
                        className="px-2.5 py-1 bg-inverse-surface text-inverse-on-surface hover:bg-primary font-label-code text-label-code uppercase transition-colors cursor-pointer"
                      >
                        Ping RTU
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Compliance Disclaimer Callout */}
          <div className="p-space-md bg-surface-container-high flex items-center gap-space-md border-t border-surface-variant">
            <span className="material-symbols-outlined text-primary text-[1.75rem] shrink-0">gavel</span>
            <div className="flex flex-col">
              <span className="font-label-code text-label-code text-on-surface font-bold uppercase tracking-wider">
                NERC-CIP &amp; IEEE RELIABILITY INTEGRITY STANDARD
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Degraded telemetry assets maintain their last known values with visual stale warnings. GridGuard never substitutes missing telemetry with zero readings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: SCADA PROTOCOL & NETWORK DIAGNOSTICS */}
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between px-space-xs">
          <div className="flex items-center gap-2">
            <span className="font-label-code text-label-code text-on-surface uppercase font-bold tracking-wider">
              04 // SCADA PROTOCOL &amp; NETWORK DIAGNOSTICS
            </span>
            <span className="w-2 h-2 bg-secondary rounded-full"></span>
          </div>
          <span className="font-label-meta text-label-meta text-on-surface-variant uppercase tracking-widest">
            TLS 1.3 // SECURE AUTHENTICATION v5
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
          {/* Diagnostic 1: Protocol Transport */}
          <div className="bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between border border-surface-variant">
            <div className="flex flex-col gap-space-sm">
              <div className="flex items-center justify-between border-b border-surface-variant pb-space-xs">
                <span className="font-label-code text-label-code text-on-surface-variant uppercase">
                  SECURITY LAYER
                </span>
                <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-label-code text-label-code font-bold">
                  AES-256-GCM
                </span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Protocol Transport</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                DNP3 Secure Authentication (SAv5) operating over mutual TLS 1.3 tunneling. Cryptographic HMAC validation active on all trip commands.
              </p>
            </div>
            <div className="mt-space-md pt-space-sm bg-surface-container-low p-space-sm flex flex-col gap-1 border border-surface-variant/40">
              <div className="flex items-center justify-between font-label-meta text-label-meta text-on-surface-variant uppercase">
                <span>KEY REFRESH CADENCE</span>
                <span className="font-telemetry-num text-telemetry-num text-on-surface font-bold">1,800s (ACTIVE)</span>
              </div>
              <div className="flex items-center justify-between font-label-meta text-label-meta text-on-surface-variant uppercase">
                <span>HMAC INTEGRITY SUITE</span>
                <span className="font-label-code text-label-code text-secondary font-bold">SHA-256-128</span>
              </div>
            </div>
          </div>

          {/* Diagnostic 2: Packet Integrity */}
          <div className="bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between border border-surface-variant">
            <div className="flex flex-col gap-space-sm">
              <div className="flex items-center justify-between border-b border-surface-variant pb-space-xs">
                <span className="font-label-code text-label-code text-on-surface-variant uppercase">
                  LINK LAYER CRC
                </span>
                <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-label-code text-label-code font-bold">
                  1.2M CHECKED
                </span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Packet Integrity Ratio</h3>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-display text-secondary font-bold">
                  99.994<span className="text-headline-md font-headline-md text-on-surface-variant ml-0.5 font-normal">%</span>
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Cumulative CRC-16 check pass rate across 1,248,930 SCADA communication frame packets ingested during the current dispatch cycle.
              </p>
            </div>
            <div className="mt-space-md pt-space-sm bg-surface-container-low p-space-sm flex flex-col gap-1 border border-surface-variant/40">
              <div className="flex items-center justify-between font-label-meta text-label-meta text-on-surface-variant uppercase">
                <span>FRAMES DROPPED TODAY</span>
                <span className="font-telemetry-num text-telemetry-num text-on-surface font-bold">78 FRAMES</span>
              </div>
              <div className="flex items-center justify-between font-label-meta text-label-meta text-on-surface-variant uppercase">
                <span>BURST CORRUPTION RATE</span>
                <span className="font-label-code text-label-code text-secondary font-bold">&lt; 0.0001%</span>
              </div>
            </div>
          </div>

          {/* Diagnostic 3: Active Dispatch Client Sessions */}
          <div className="bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between border border-surface-variant">
            <div className="flex flex-col gap-space-sm">
              <div className="flex items-center justify-between border-b border-surface-variant pb-space-xs">
                <span className="font-label-code text-label-code text-on-surface-variant uppercase">
                  DISPATCH ROSTER
                </span>
                <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container font-label-code text-label-code font-bold">
                  3 CONCURRENT
                </span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Active Client Sessions</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Authorized control room operators with active command relay authorization and bus topology override rights.
              </p>
            </div>
            <div className="mt-space-md flex flex-col gap-space-xs">
              {/* Session 1: S. Vance (Lead) */}
              <div className="p-space-xs bg-surface-container-low flex items-center justify-between border border-surface-variant/40">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-secondary rounded-full"></span>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-body-sm text-on-surface font-bold">S. Vance, P.E.</span>
                    <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                      LEAD DISPATCHER (STATION 01)
                    </span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 bg-primary text-on-primary font-label-code text-label-code font-bold">
                  ACTIVE TX
                </span>
              </div>
              {/* Session 2: K. Tanaka */}
              <div className="p-space-xs bg-surface-container-low flex items-center justify-between border border-surface-variant/40">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-secondary rounded-full"></span>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-body-sm text-on-surface">K. Tanaka, Relay Eng.</span>
                    <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                      PROTECTION COORD (STATION 04)
                    </span>
                  </div>
                </div>
                <span className="font-label-code text-label-code text-on-surface-variant">READ ONLY</span>
              </div>
              {/* Session 3: M. Sterling */}
              <div className="p-space-xs bg-surface-container-low flex items-center justify-between border border-surface-variant/40">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-secondary rounded-full"></span>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-body-sm text-on-surface">M. Sterling, Analyst</span>
                    <span className="font-label-meta text-label-meta text-on-surface-variant uppercase">
                      ANALYTICS DESK (STATION 09)
                    </span>
                  </div>
                </div>
                <span className="font-label-code text-label-code text-on-surface-variant">READ ONLY</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
