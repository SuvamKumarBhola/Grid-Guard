import React, { useState, useEffect, useRef } from 'react';
import { useGrid } from '../../context/GridContext';

export default function LiveDataInjectionModal() {
  const {
    isInjectionModalOpen,
    closeInjectionModal,
    injectionAssetId,
    assets,
    injectTelemetryScenario,
    addToast,
    currentTime,
  } = useGrid();

  const [targetAssetId, setTargetAssetId] = useState(injectionAssetId || 'TX-04');
  const [selectedScenario, setSelectedScenario] = useState('march_1_imbalance');
  const [streamRecords, setStreamRecords] = useState([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingFrames, setIsLoadingFrames] = useState(false);
  const [lastScoredResult, setLastScoredResult] = useState(null);
  const [operatorNotes, setOperatorNotes] = useState('Live telemetry injection from trained Isolation Forest dataset.');
  const playTimerRef = useRef(null);

  // Sync targetAssetId when modal opens with new injectionAssetId
  useEffect(() => {
    if (isInjectionModalOpen && injectionAssetId) {
      setTargetAssetId(injectionAssetId);
    }
  }, [isInjectionModalOpen, injectionAssetId]);

  // Fetch sequence frames for selected scenario
  useEffect(() => {
    if (!isInjectionModalOpen) return;

    let isMounted = true;
    setIsLoadingFrames(true);

    fetch(`/api/v1/anomalies/v2/stream-records?scenario=${selectedScenario}&limit=12`, {
      headers: {
        'X-User-Role': 'operator',
        'X-User-Id': 'operator-lead',
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load stream');
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.records && data.records.length > 0) {
          setStreamRecords(data.records);
          setCurrentFrameIndex(0);
          setLastScoredResult(data.records[0]);
        }
      })
      .catch((err) => {
        console.warn('Fallback stream loading:', err);
        // Fallback local records if backend call interrupted
        const fallbackFrames = [
          {
            timestamp: '2020-03-01 04:00:00',
            voltage_avg: 252.5,
            current_avg: 36.7,
            temperature_oti: 78.4,
            power_kw: 34.8,
            anomaly_score: 0.0482,
            is_alert: true,
            severity_tier: 'critical',
            features: { VL1: 252.5, VL2: 251.8, VL3: 252.9, IL1: 56.4, IL2: 30.8, IL3: 64.2, OTI: 78.4, KW: 34.8 },
          },
          {
            timestamp: '2020-03-01 04:15:00',
            voltage_avg: 252.8,
            current_avg: 39.5,
            temperature_oti: 84.6,
            power_kw: 38.2,
            anomaly_score: 0.0614,
            is_alert: true,
            severity_tier: 'critical',
            features: { VL1: 252.8, VL2: 252.1, VL3: 253.0, IL1: 62.0, IL2: 32.5, IL3: 68.4, OTI: 84.6, KW: 38.2 },
          },
          {
            timestamp: '2020-03-01 04:30:00',
            voltage_avg: 252.6,
            current_avg: 44.1,
            temperature_oti: 94.2,
            power_kw: 42.0,
            anomaly_score: 0.0812,
            is_alert: true,
            severity_tier: 'critical',
            features: { VL1: 252.6, VL2: 252.3, VL3: 252.8, IL1: 71.2, IL2: 35.0, IL3: 74.5, OTI: 94.2, KW: 42.0 },
          },
        ];
        if (isMounted) {
          setStreamRecords(fallbackFrames);
          setCurrentFrameIndex(0);
          setLastScoredResult(fallbackFrames[0]);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingFrames(false);
      });

    return () => {
      isMounted = false;
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isInjectionModalOpen, selectedScenario]);

  // Continuous Playback Loop
  useEffect(() => {
    if (isPlaying && streamRecords.length > 0) {
      playTimerRef.current = setInterval(() => {
        setCurrentFrameIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % streamRecords.length;
          const frame = streamRecords[nextIndex];
          if (frame) {
            setLastScoredResult(frame);
            injectTelemetryScenario({
              assetId: targetAssetId,
              scenarioName: `${selectedScenario} [Frame #${nextIndex + 1}]`,
              features: frame.features,
              notes: `Live continuous stream: ${frame.timestamp}`,
            });
          }
          return nextIndex;
        });
      }, 2000);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, streamRecords, targetAssetId, selectedScenario, injectTelemetryScenario]);

  if (!isInjectionModalOpen) return null;

  const currentFrame = streamRecords[currentFrameIndex] || null;
  const currentAsset = assets.find((a) => a.id === targetAssetId) || assets[0];

  const handleInjectCurrentFrame = async () => {
    if (!currentFrame) return;
    const res = await injectTelemetryScenario({
      assetId: targetAssetId,
      scenarioName: `${selectedScenario} [Frame #${currentFrameIndex + 1}]`,
      features: currentFrame.features,
      notes: operatorNotes,
    });
    setLastScoredResult({
      ...currentFrame,
      anomaly_score: res.scoreResult?.anomaly_score || currentFrame.anomaly_score,
      temperature_oti: res.oti || currentFrame.temperature_oti,
    });
  };

  const handleStepNext = () => {
    if (streamRecords.length === 0) return;
    const nextIdx = (currentFrameIndex + 1) % streamRecords.length;
    setCurrentFrameIndex(nextIdx);
    const nextFrame = streamRecords[nextIdx];
    if (nextFrame) {
      setLastScoredResult(nextFrame);
      injectTelemetryScenario({
        assetId: targetAssetId,
        scenarioName: `${selectedScenario} [Frame #${nextIdx + 1}]`,
        features: nextFrame.features,
        notes: `Step advance: ${nextFrame.timestamp}`,
      });
    }
  };

  const handleResetToBaseline = async () => {
    setIsPlaying(false);
    await injectTelemetryScenario({
      assetId: targetAssetId,
      scenarioName: 'nominal_baseline',
      features: {
        VL1: 247.5,
        VL2: 246.8,
        VL3: 245.2,
        IL1: 42.0,
        IL2: 41.5,
        IL3: 42.2,
        OTI: targetAssetId === 'TX-04' ? 68.0 : 45.0,
        KW: 36.0,
      },
      notes: 'Operator restored baseline telemetry parameters.',
    });
    addToast(`Restored baseline telemetry on [${targetAssetId}].`, 'info');
  };

  const scenarios = [
    {
      id: 'march_1_imbalance',
      name: 'March 1 Episode (Current Imbalance 56A/31A/64A)',
      desc: 'Real historical event from dataset. High anomaly score (~0.081), active neutral current surge.',
      badge: 'HISTORICAL EPISODE',
      severity: 'CRITICAL',
    },
    {
      id: 'feb_1_overvoltage',
      name: 'February 1 Episode (High Voltage ~252V / Low Load)',
      desc: 'Observed 2020-02-01. Sustained ~252V phase voltages causing dielectric and insulation stress.',
      badge: 'HISTORICAL EPISODE',
      severity: 'HIGH',
    },
    {
      id: 'march_2_load_surge',
      name: 'March 2 Episode (Active Load Surge 74kW / High KVA)',
      desc: 'Observed 2020-03-02. Peak industrial corridor demand pushing secondary terminals into saturation.',
      badge: 'HISTORICAL EPISODE',
      severity: 'HIGH',
    },
    {
      id: 'thermal_runaway_degradation',
      name: 'Progressive Neglected Maintenance (Fan Bank Trip)',
      desc: 'Sequential simulated frames where cooling fails and temperature escalates from 68°C to 105°C.',
      badge: 'MAINTENANCE PROGRESSION',
      severity: 'CRITICAL',
    },
    {
      id: 'normal_baseline',
      name: 'Nominal Operating Baseline (IEEE Standard Margins)',
      desc: 'Standard nominal operation recorded 2020-01-21. Negative anomaly score (-0.017), green margins.',
      badge: 'NOMINAL BASELINE',
      severity: 'NOMINAL',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/80 backdrop-blur-sm animate-fade-in select-none">
      <div
        className="w-full max-w-5xl bg-surface-container-lowest border-2 border-primary/50 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-space-lg py-space-md bg-inverse-surface text-inverse-on-surface flex items-center justify-between border-b border-surface-variant">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[1.75rem] animate-pulse">
              stream
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-headline-sm uppercase font-bold tracking-wider text-on-primary">
                  Live Data Injection Studio — Dataset &amp; ML Model
                </h2>
                <span className="px-2 py-0.5 bg-primary text-on-primary font-label-code text-label-code font-bold uppercase">
                  ISOLATION FOREST v2.0.0
                </span>
              </div>
              <p className="font-label-meta text-label-meta text-inverse-on-surface/80 uppercase">
                20,026 HISTORICAL RECORDS • REAL-TIME ML INFERENCE STREAMING • {currentTime}
              </p>
            </div>
          </div>
          <button
            onClick={closeInjectionModal}
            className="p-1.5 text-inverse-on-surface/70 hover:text-on-primary hover:bg-surface-variant/40 rounded transition-colors cursor-pointer"
            aria-label="Close Injection Modal"
          >
            <span className="material-symbols-outlined text-[1.5rem]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-space-lg space-y-space-md">
          {/* Top Control Bar: Select Target Transformer & Scenario */}
          <div className="p-space-md bg-surface-container-low border border-surface-variant flex flex-col md:flex-row md:items-center justify-between gap-space-md">
            {/* Target Transformer */}
            <div className="flex-1">
              <label className="font-label-code text-label-code text-on-surface font-bold uppercase tracking-wider block mb-1">
                Target Transformer for Injection:
              </label>
              <select
                value={targetAssetId}
                onChange={(e) => setTargetAssetId(e.target.value)}
                className="w-full p-2.5 bg-surface border border-outline-variant font-headline-sm text-sm text-on-surface font-bold focus:border-primary focus:outline-none"
              >
                <option value="TX-04">TX-04 (Feeder F-03 • Critical Hotspot 94.2°C)</option>
                <option value="TX-09">TX-09 (Feeder F-04 • Stale RTU / Pending Maint Overdue 12d)</option>
                <option value="TX-Pine-02">TX-Pine-02 (West Substation • Harmonic Overheating Overdue 18d)</option>
                <option value="TX-01">TX-01 (Feeder F-01 • Scheduled Precautionary 36h)</option>
                <option value="TX-Maple-01">TX-Maple-01 (North Substation • Nominal Standby)</option>
              </select>
            </div>

            {/* Target Asset Telemetry Snapshot */}
            <div className="flex items-center gap-4 bg-surface p-2.5 border border-outline-variant/60">
              <div>
                <span className="font-label-meta text-[0.625rem] text-tertiary uppercase block">CURRENT TEMP</span>
                <span className="font-headline-sm text-sm font-bold text-error">{currentAsset.temperatureC}°C</span>
              </div>
              <div className="h-6 w-px bg-outline-variant"></div>
              <div>
                <span className="font-label-meta text-[0.625rem] text-tertiary uppercase block">LOADING</span>
                <span className="font-headline-sm text-sm font-bold text-on-surface">{currentAsset.loadPercentage}%</span>
              </div>
              <div className="h-6 w-px bg-outline-variant"></div>
              <div>
                <span className="font-label-meta text-[0.625rem] text-tertiary uppercase block">RISK SCORE</span>
                <span className="font-headline-sm text-sm font-bold text-primary">{currentAsset.riskScore} / 100</span>
              </div>
            </div>
          </div>

          {/* Scenario Selection Grid */}
          <div>
            <label className="font-label-code text-label-code text-on-surface font-bold uppercase tracking-wider block mb-1.5">
              1. Choose Dataset Scenario from Trained History
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {scenarios.map((sc) => {
                const isSelected = selectedScenario === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      setSelectedScenario(sc.id);
                      setIsPlaying(false);
                    }}
                    className={`p-3 text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary bg-primary-fixed/20 ring-2 ring-primary'
                        : 'border-surface-variant bg-surface-container-lowest hover:bg-surface-container-low'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="px-1.5 py-0.5 bg-surface-container text-[0.625rem] font-label-code font-bold uppercase text-tertiary">
                          {sc.badge}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[0.625rem] font-label-code font-bold uppercase ${
                            sc.severity === 'CRITICAL'
                              ? 'bg-error text-on-error'
                              : sc.severity === 'HIGH'
                              ? 'bg-primary text-on-primary'
                              : 'bg-secondary text-on-secondary'
                          }`}
                        >
                          {sc.severity}
                        </span>
                      </div>
                      <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase leading-snug">
                        {sc.name}
                      </h4>
                      <p className="font-body-sm text-[0.6875rem] text-on-surface-variant mt-1 leading-tight">
                        {sc.desc}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-surface-variant/40 flex items-center justify-between font-label-code text-[0.6875rem]">
                      <span className={isSelected ? 'text-primary font-bold' : 'text-tertiary'}>
                        {isSelected ? '✓ ACTIVE STREAM' : 'SELECT SCENARIO'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Streaming Playback Control Ribbon */}
          <div className="p-space-md bg-inverse-surface text-inverse-on-surface border border-surface-variant flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
            <div className="flex items-center gap-3">
              <span className="font-label-code text-xs font-bold text-primary uppercase">
                STREAM PLAYBACK CONTROLS:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`py-1.5 px-3 rounded font-headline-sm text-xs uppercase font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                    isPlaying
                      ? 'bg-primary text-on-primary animate-pulse'
                      : 'bg-surface/20 text-inverse-on-surface hover:bg-primary hover:text-on-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[1rem]">
                    {isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                  <span>{isPlaying ? 'Pause Stream' : 'Play Live Stream'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleStepNext}
                  disabled={isPlaying}
                  className="py-1.5 px-3 bg-surface/20 hover:bg-surface/30 text-inverse-on-surface font-headline-sm text-xs uppercase font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  title="Advance to next frame from dataset"
                >
                  <span className="material-symbols-outlined text-[1rem]">skip_next</span>
                  <span>Step Frame</span>
                </button>

                <button
                  type="button"
                  onClick={handleInjectCurrentFrame}
                  className="py-1.5 px-3 bg-primary text-on-primary hover:bg-primary/90 font-headline-sm text-xs uppercase font-bold flex items-center gap-1 shadow cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[1rem]">bolt</span>
                  <span>Inject Frame #{currentFrameIndex + 1}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 font-label-code text-xs">
              <span className="text-tertiary-fixed">
                FRAME {currentFrameIndex + 1} / {streamRecords.length || 1}
              </span>
              <button
                type="button"
                onClick={handleResetToBaseline}
                className="py-1 px-2.5 bg-surface/10 hover:bg-error hover:text-on-error border border-outline-variant/40 text-[0.6875rem] uppercase font-bold cursor-pointer transition-colors"
              >
                Reset Transformer Baseline
              </button>
            </div>
          </div>

          {/* Live Isolation Forest v2 Model Inference Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            {/* Live Model Score Gauge */}
            <div className="p-space-md bg-surface-container-lowest border border-surface-variant flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-code text-label-code text-on-surface font-bold uppercase tracking-wider">
                    FITTED ISOLATION FOREST v2.0.0 INFERENCE
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-label-code font-bold uppercase rounded ${
                      lastScoredResult?.anomaly_score > 0.020245
                        ? 'bg-error text-on-error animate-pulse'
                        : 'bg-secondary text-on-secondary'
                    }`}
                  >
                    {lastScoredResult?.anomaly_score > 0.020245 ? 'ANOMALY ALERT FLAGGED' : 'NOMINAL BASELINE'}
                  </span>
                </div>

                <div className="my-3 flex items-baseline gap-3">
                  <span className="font-display text-[2.5rem] font-bold text-on-surface leading-none">
                    {lastScoredResult?.anomaly_score ? lastScoredResult.anomaly_score.toFixed(4) : '0.0482'}
                  </span>
                  <div className="font-label-code text-xs text-tertiary">
                    <div>THRESHOLD: 0.020245</div>
                    <div className="text-secondary font-semibold">95th Percentile Decision Cutoff</div>
                  </div>
                </div>

                {/* Relative progress bar against reference threshold */}
                <div className="w-full bg-surface-container h-2.5 rounded-none overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-500 ${
                      lastScoredResult?.anomaly_score > 0.020245 ? 'bg-error' : 'bg-secondary'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(5, ((lastScoredResult?.anomaly_score || 0.04) / 0.1) * 100))}%`,
                    }}
                  ></div>
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-primary"
                    style={{ left: `${(0.020245 / 0.1) * 100}%` }}
                    title="Reference threshold 0.020245"
                  ></div>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-surface-variant/40 font-label-meta text-[0.6875rem] text-on-surface-variant leading-tight">
                Statistical isolation metric learned from 20,026 chronological records (June 2019 – April 2020).
              </div>
            </div>

            {/* Live Electrical & Thermal Telemetry Injected */}
            <div className="p-space-md bg-surface-container-lowest border border-surface-variant flex flex-col justify-between">
              <span className="font-label-code text-label-code text-on-surface font-bold uppercase tracking-wider mb-2">
                TELEMETRY REGISTERS (ACTIVE FRAME)
              </span>

              <div className="grid grid-cols-3 gap-2 text-center font-label-code">
                <div className="p-2 bg-surface-container-low border border-surface-variant">
                  <span className="text-[0.625rem] text-tertiary uppercase block">AVG PHASE VOLTAGE</span>
                  <span className="text-body-md font-bold text-on-surface">
                    {currentFrame?.voltage_avg || 248.1} V
                  </span>
                </div>
                <div className="p-2 bg-surface-container-low border border-surface-variant">
                  <span className="text-[0.625rem] text-tertiary uppercase block">AVG PHASE CURRENT</span>
                  <span className="text-body-md font-bold text-primary">
                    {currentFrame?.current_avg || 50.5} A
                  </span>
                </div>
                <div className="p-2 bg-surface-container-low border border-surface-variant">
                  <span className="text-[0.625rem] text-tertiary uppercase block">OIL TEMP (OTI)</span>
                  <span className="text-body-md font-bold text-error">
                    {currentFrame?.temperature_oti || currentAsset.temperatureC}°C
                  </span>
                </div>
                <div className="p-2 bg-surface-container-low border border-surface-variant">
                  <span className="text-[0.625rem] text-tertiary uppercase block">ACTIVE LOAD (KW)</span>
                  <span className="text-body-md font-bold text-on-surface">
                    {currentFrame?.power_kw || 34.8} kW
                  </span>
                </div>
                <div className="p-2 bg-surface-container-low border border-surface-variant">
                  <span className="text-[0.625rem] text-tertiary uppercase block">GRID FREQUENCY</span>
                  <span className="text-body-md font-bold text-secondary">
                    {currentFrame?.features?.FRQ || 50.0} Hz
                  </span>
                </div>
                <div className="p-2 bg-surface-container-low border border-surface-variant">
                  <span className="text-[0.625rem] text-tertiary uppercase block">DATASET TIMESTAMP</span>
                  <span className="text-[0.6875rem] font-bold text-tertiary truncate block">
                    {currentFrame?.timestamp || '2020-03-01'}
                  </span>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-surface-variant/40 flex items-center justify-between text-xs font-label-code text-tertiary">
                <span>SCADA INGEST BUS: DNP3 / MODBUS-TCP</span>
                <span className="text-secondary font-bold">ACK SYNCED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-space-md bg-surface-container border-t border-surface-variant flex items-center justify-between gap-space-sm">
          <button
            type="button"
            onClick={closeInjectionModal}
            className="py-2.5 px-space-lg bg-surface hover:bg-surface-container-high border border-outline-variant font-label-code text-xs uppercase text-on-surface cursor-pointer"
          >
            Close Studio
          </button>

          <button
            type="button"
            onClick={handleInjectCurrentFrame}
            className="py-2.5 px-space-xl bg-primary hover:bg-primary/90 text-on-primary font-headline-sm text-body-md uppercase font-bold tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <span className="material-symbols-outlined text-[1.25rem]">bolt</span>
            <span>Inject Frame #{currentFrameIndex + 1} into [{targetAssetId}]</span>
          </button>
        </div>
      </div>
    </div>
  );
}
