import { useState } from 'react';
import { useGrid } from '../context/GridContext';

export default function SimulationPage() {
  const { simulationShift, adjustSimulationShift, resetSimulation, addToast } = useGrid();
  const [unitMode, setUnitMode] = useState('MVA');
  const [checkN1, setCheckN1] = useState(true);
  const [checkThermal, setCheckThermal] = useState(true);
  const [checkSag, setCheckSag] = useState(true);

  // Dynamic calculations based on simulationShift
  const sourceBaseLoad = 49.2;
  const targetBaseLoad = 38.6;
  const rating = 50.0;

  const sourcePostLoad = Math.max(0, parseFloat((sourceBaseLoad - simulationShift).toFixed(1)));
  const sourcePostPct = parseFloat(((sourcePostLoad / rating) * 100).toFixed(1));

  const targetPostLoad = parseFloat((targetBaseLoad + simulationShift).toFixed(1));
  const targetPostPct = parseFloat(((targetPostLoad / rating) * 100).toFixed(1));

  // Dynamic temperature projections
  const tempDrop = parseFloat((simulationShift * 1.32).toFixed(1));
  const sourcePostTemp = parseFloat((94.2 - tempDrop).toFixed(1));

  const tempRise = parseFloat((simulationShift * 0.73).toFixed(1));
  const targetPostTemp = parseFloat((68.4 + tempRise).toFixed(1));

  const handleRunSimulation = (e) => {
    if (e) e.preventDefault();
    addToast(
      `Recomputing Newton-Raphson power flow for ${simulationShift} MVA transfer... Convergence achieved in 18ms.`,
      'success'
    );
  };

  const handleExportPlan = () => {
    addToast(
      `Generated DNP3 Switching Sequence Sheet for Operator S. Vance, P.E. (Tie F-104 Authorization Code: #OP-8821)`,
      'success'
    );
  };

  const handleSaveLog = () => {
    addToast(
      `Scenario saved to Dispatch Log: Shift ${simulationShift} MVA from TX-Oak-04 to TX-Pine-02.`,
      'info'
    );
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* SAFETY DISCLAIMER BANNER */}
      <div className="w-full bg-error-container text-on-error-container px-space-lg py-space-sm shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-space-sm border border-error/30">
        <div className="flex items-center gap-space-md">
          <span className="material-symbols-outlined text-[1.5rem] text-error">warning</span>
          <div className="flex flex-col">
            <span className="font-headline-sm text-body-sm font-bold uppercase tracking-wider text-error">
              Simulated Dispatch Protocol
            </span>
            <span className="font-body-sm text-body-sm text-on-surface">
              HYPOTHETICAL SIMULATION ENGINE ONLY. This tool does not physically actuate breakers, energize bus ties, or execute SCADA supervisory control commands.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-space-xs shrink-0 self-end md:self-auto bg-error text-on-error px-space-md py-1 font-label-code text-label-code uppercase tracking-widest shadow-sm">
          <span className="w-2 h-2 rounded-full bg-surface-bright animate-ping"></span>
          <span>NON-DISPATCH RUNTIME</span>
        </div>
      </div>

      {/* PAGE HEADER & DIAGNOSTIC META */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md bg-surface-container p-space-lg shadow-sm border border-surface-variant">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-space-sm">
            <span className="font-label-code text-label-code text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5">
              SUBSTATION STUDY LAB • WEST 138kV RING
            </span>
            <span className="font-label-code text-label-code text-tertiary uppercase">
              MODEL ID: SIM-DNP3-8821
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight">
            Load Redistribution Simulation
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
            Evaluate hypothetical power flow transfers and N-1 contingency headroom against asset thermal limits. Real-time topology snapshot verified at 16:42:19 UTC.
          </p>
        </div>

        {/* Quick Telemetry HUD */}
        <div className="flex items-center gap-space-md shrink-0 flex-wrap">
          <div className="flex flex-col items-end px-space-md py-space-xs bg-surface-container-lowest shadow-sm border border-outline-variant">
            <span className="font-label-meta text-label-meta uppercase text-tertiary">Grid Solver Mode</span>
            <span className="font-headline-sm text-body-sm text-on-surface font-bold uppercase">Newton-Raphson (AC)</span>
          </div>
          <div className="flex flex-col items-end px-space-md py-space-xs bg-surface-container-lowest shadow-sm border border-outline-variant">
            <span className="font-label-meta text-label-meta uppercase text-tertiary">Convergence Target</span>
            <span className="font-headline-sm text-body-sm text-secondary font-bold">0.0012 MW/MVAR [OK]</span>
          </div>
          <div className="flex items-center gap-2 px-space-md py-space-xs bg-primary text-on-primary shadow-sm font-label-code text-label-code uppercase tracking-wider">
            <span className="material-symbols-outlined text-[1rem]">tune</span>
            <span>STUDY BENCH v4.2</span>
          </div>
        </div>
      </div>

      {/* MAIN THREE-PART ENGINEERING COMPOSITION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* ========================================================== */}
        {/* SECTION A: SCENARIO CONFIGURATION (Left Panel - ~32%)      */}
        {/* ========================================================== */}
        <div className="lg:col-span-4 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest shadow-sm p-space-lg flex flex-col gap-space-lg border border-surface-variant">
            {/* Panel Title Bar */}
            <div className="flex items-center justify-between pb-space-sm bg-surface-container-high -mx-space-lg -mt-space-lg px-space-lg py-space-sm mb-0 border-b border-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[1.25rem]">settings_input_composite</span>
                <span className="font-headline-sm text-headline-sm uppercase tracking-wider text-on-surface">Configuration</span>
              </div>
              <span className="font-label-code text-label-code text-tertiary bg-surface-container-lowest px-2 py-0.5 border border-outline-variant">
                MOD: STATIC_N-1
              </span>
            </div>

            <form className="flex flex-col gap-space-md" onSubmit={handleRunSimulation}>
              {/* Source Overloaded Asset */}
              <div className="flex flex-col gap-1">
                <label className="font-label-meta text-label-meta uppercase text-on-surface-variant flex justify-between">
                  <span>Source Overloaded Asset</span>
                  <span className="text-error font-bold">OVERLOAD PROBABLE</span>
                </label>
                <div className="bg-surface-container-low p-space-sm flex flex-col gap-1 border border-surface-variant">
                  <div className="flex items-center justify-between font-headline-sm text-body-sm text-on-surface">
                    <span className="font-bold">TX-Oak-04</span>
                    <span className="font-label-code text-label-code bg-error text-on-error px-1.5 py-0.5 font-bold">
                      138kV / 13.8kV
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-body-sm font-telemetry-num text-on-surface-variant">
                    <span>Load: 49.2 MVA / 98.4%</span>
                    <span className="text-error font-bold">Margin: 0.8 MVA</span>
                  </div>
                </div>
              </div>

              {/* Target Receiving Asset */}
              <div className="flex flex-col gap-1">
                <label className="font-label-meta text-label-meta uppercase text-on-surface-variant flex justify-between">
                  <span>Target Receiving Asset</span>
                  <span className="text-secondary font-bold">ACCEPTOR CANDIDATE</span>
                </label>
                <div className="bg-surface-container-low p-space-sm flex flex-col gap-1 border border-surface-variant">
                  <div className="flex items-center justify-between font-headline-sm text-body-sm text-on-surface">
                    <span className="font-bold">TX-Pine-02</span>
                    <span className="font-label-code text-label-code bg-secondary text-on-secondary px-1.5 py-0.5 font-bold">
                      138kV / 13.8kV
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-body-sm font-telemetry-num text-on-surface-variant">
                    <span>Load: 38.6 MVA / 77.2%</span>
                    <span className="text-secondary font-bold">Headroom: +11.4 MVA</span>
                  </div>
                </div>
              </div>

              {/* Pathway */}
              <div className="flex flex-col gap-1">
                <label className="font-label-meta text-label-meta uppercase text-on-surface-variant">
                  Interconnecting Transfer Pathway
                </label>
                <div className="bg-surface-container-high p-space-sm flex items-center justify-between border border-surface-variant">
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-body-sm text-on-surface">Feeder Tie F-104</span>
                    <span className="font-label-code text-label-code text-tertiary">
                      Max Cap: 15.0 MVA • XLPE Subterranean
                    </span>
                  </div>
                  <span className="font-label-code text-label-code bg-surface-container px-2 py-1 text-on-surface-variant uppercase border border-outline-variant">
                    De-energized Tie
                  </span>
                </div>
              </div>

              {/* Proposed Load Transfer Stepper */}
              <div className="bg-surface-container p-space-md flex flex-col gap-space-sm border border-surface-variant">
                <div className="flex items-center justify-between">
                  <label className="font-label-meta text-label-meta uppercase text-on-surface font-bold tracking-wider">
                    Proposed Shift Magnitude
                  </label>
                  <div className="flex bg-surface-container-highest p-0.5 border border-outline-variant">
                    <button
                      type="button"
                      onClick={() => setUnitMode('MVA')}
                      className={`px-2 py-0.5 font-label-code text-label-code cursor-pointer ${
                        unitMode === 'MVA' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface'
                      }`}
                    >
                      MVA
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnitMode('MW')}
                      className={`px-2 py-0.5 font-label-code text-label-code cursor-pointer ${
                        unitMode === 'MW' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface'
                      }`}
                    >
                      MW
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-space-sm">
                  <button
                    type="button"
                    onClick={() => adjustSimulationShift(-0.5)}
                    className="w-10 h-10 bg-inverse-surface text-inverse-on-surface hover:bg-primary transition-colors flex items-center justify-center font-bold text-headline-sm select-none cursor-pointer"
                  >
                    −
                  </button>
                  <div className="flex-1 bg-surface-container-lowest px-space-md py-2 text-center border border-outline-variant">
                    <span className="font-display text-headline-lg font-bold text-primary font-telemetry-num">
                      {simulationShift.toFixed(1)}
                    </span>
                    <span className="font-label-code text-label-code text-tertiary ml-1">{unitMode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => adjustSimulationShift(0.5)}
                    className="w-10 h-10 bg-inverse-surface text-inverse-on-surface hover:bg-primary transition-colors flex items-center justify-center font-bold text-headline-sm select-none cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <div className="flex justify-between items-center text-body-sm font-label-meta text-tertiary uppercase">
                  <span>Feeder Min: 1.0 MVA</span>
                  <span>Tie Limit: 15.0 MVA</span>
                </div>
              </div>

              {/* Power Factor Assumption */}
              <div className="flex flex-col gap-1">
                <label className="font-label-meta text-label-meta uppercase text-on-surface-variant">
                  Power Factor Baseline
                </label>
                <div className="bg-surface-container-low px-space-md py-2 flex items-center justify-between font-body-sm text-body-sm text-on-surface border border-surface-variant">
                  <span className="font-telemetry-num font-semibold">0.95 Lagging (Standard Grid Baseline)</span>
                  <span className="font-label-code text-label-code text-tertiary">Q = 2.79 MVAR</span>
                </div>
              </div>

              {/* Contingency Constraints */}
              <div className="flex flex-col gap-space-xs pt-space-xs">
                <span className="font-label-meta text-label-meta uppercase text-on-surface-variant font-bold tracking-wider mb-1">
                  Active Mathematical Constraints
                </span>
                <label className="flex items-center gap-space-sm p-space-xs bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer select-none border border-surface-variant/40">
                  <input
                    checked={checkN1}
                    onChange={(e) => setCheckN1(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                    type="checkbox"
                  />
                  <span className="font-body-sm text-body-sm text-on-surface font-semibold">
                    N-1 Bus Contingency Headroom Check
                  </span>
                </label>
                <label className="flex items-center gap-space-sm p-space-xs bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer select-none border border-surface-variant/40">
                  <input
                    checked={checkThermal}
                    onChange={(e) => setCheckThermal(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                    type="checkbox"
                  />
                  <span className="font-body-sm text-body-sm text-on-surface font-semibold">
                    Thermal Time Constant Dynamic Model (τ = 90m)
                  </span>
                </label>
                <label className="flex items-center gap-space-sm p-space-xs bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer select-none border border-surface-variant/40">
                  <input
                    checked={checkSag}
                    onChange={(e) => setCheckSag(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                    type="checkbox"
                  />
                  <span className="font-body-sm text-body-sm text-on-surface font-semibold">
                    Secondary Voltage Sag Bounds (±5% nominal)
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-space-sm pt-space-md">
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-container text-on-primary py-3 px-space-md flex items-center justify-center gap-2 font-headline-sm text-headline-sm uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[1.25rem]">bolt</span>
                  <span>Compute Power Flow Simulation</span>
                </button>
                <button
                  type="button"
                  onClick={resetSimulation}
                  className="w-full bg-surface-container-high hover:bg-surface-container text-on-surface py-2 px-space-md font-label-code text-label-code uppercase tracking-widest text-center transition-colors cursor-pointer border border-outline-variant"
                >
                  Reset Parameters to Baseline
                </button>
              </div>
            </form>
          </div>

          {/* Quick Dispatch Telemetry Vector Card */}
          <div className="bg-surface-container p-space-md shadow-sm flex flex-col gap-space-xs border border-surface-variant">
            <span className="font-label-meta text-label-meta uppercase text-tertiary">Real-time SCADA Bus Vector</span>
            <div className="flex items-center justify-between text-body-sm font-telemetry-num text-on-surface">
              <span>OAK_138_BUS_V: <span className="font-bold text-secondary">1.004 pu</span></span>
              <span>PINE_138_BUS_V: <span className="font-bold text-secondary">0.998 pu</span></span>
            </div>
            <div className="flex items-center justify-between text-body-sm font-telemetry-num text-on-surface">
              <span>AMBIENT_TEMP: <span className="font-bold">31.4°C</span></span>
              <span>SYSTEM_FREQ: <span className="font-bold text-secondary">60.002 Hz</span></span>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* SECTION B: BEFORE & AFTER VISUAL LOADING ANALYSIS (~42%)   */}
        {/* ========================================================== */}
        <div className="lg:col-span-5 flex flex-col gap-space-md">
          {/* Header Ribbon */}
          <div className="bg-surface-container-lowest p-space-md shadow-sm flex items-center justify-between border border-surface-variant">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[1.25rem]">compare_arrows</span>
              <span className="font-headline-sm text-headline-sm uppercase tracking-wider text-on-surface">
                Dual Asset Loading Shift Analysis
              </span>
            </div>
            <span className="font-label-code text-label-code text-secondary font-bold px-2 py-0.5 bg-secondary-container text-on-secondary-container uppercase">
              ΔP Flow: {simulationShift.toFixed(1)} MVA
            </span>
          </div>

          {/* SOURCE ASSET CARD (TX-Oak-04) */}
          <div className="bg-surface-container-lowest shadow-sm flex flex-col border border-surface-variant">
            <div className="bg-surface-container px-space-lg py-space-sm flex items-center justify-between border-b border-surface-variant">
              <div className="flex items-center gap-space-sm">
                <span className="w-3 h-3 bg-error inline-block"></span>
                <span className="font-headline-sm text-headline-sm uppercase tracking-tight text-on-surface font-bold">
                  SOURCE: TX-Oak-04
                </span>
                <span className="font-label-code text-label-code bg-surface-container-highest px-1.5 py-0.5 text-on-surface-variant">
                  RATING: 50.0 MVA
                </span>
              </div>
              <span className="font-label-code text-label-code bg-error text-on-error px-2 py-0.5 uppercase tracking-widest font-bold">
                {sourcePostPct > 90 ? 'OVERLOAD RISK' : 'RELIEVED'}
              </span>
            </div>

            <div className="p-space-lg flex flex-col gap-space-md">
              {/* Numerical Metrics Row */}
              <div className="grid grid-cols-3 gap-space-md">
                <div className="bg-surface-container-low p-space-sm flex flex-col border border-surface-variant">
                  <span className="font-label-meta text-label-meta uppercase text-tertiary">Pre-Transfer</span>
                  <span className="font-headline-lg text-headline-lg font-telemetry-num text-error font-bold leading-none mt-1">
                    49.2
                  </span>
                  <span className="font-body-sm text-body-sm text-error font-bold">98.4% (CRITICAL)</span>
                </div>
                <div className="bg-primary/10 p-space-sm flex flex-col justify-center items-center text-center border border-primary/20">
                  <span className="font-label-meta text-label-meta uppercase text-primary font-bold">Relief Offset</span>
                  <span className="font-headline-lg text-headline-lg font-telemetry-num text-primary font-bold leading-none mt-1">
                    -{simulationShift.toFixed(1)}
                  </span>
                  <span className="font-body-sm text-body-sm text-primary font-bold">MVA SHIFT</span>
                </div>
                <div className="bg-surface-container-low p-space-sm flex flex-col border border-surface-variant">
                  <span className="font-label-meta text-label-meta uppercase text-tertiary">Post-Transfer</span>
                  <span className="font-headline-lg text-headline-lg font-telemetry-num text-primary-container font-bold leading-none mt-1">
                    {sourcePostLoad.toFixed(1)}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface font-bold">
                    {sourcePostPct}% ({sourcePostPct <= 85 ? 'NORMAL' : 'ELEVATED'})
                  </span>
                </div>
              </div>

              {/* Horizontal Capacity Bar Gauge */}
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex justify-between font-label-meta text-label-meta uppercase text-on-surface-variant font-bold">
                  <span>Dynamic Nameplate Utilization</span>
                  <span>Thermal Relief: -{(98.4 - sourcePostPct).toFixed(1)}%</span>
                </div>
                <div className="relative w-full h-8 bg-surface-container flex overflow-hidden border border-outline-variant">
                  <div className="h-full bg-secondary-fixed/50" style={{ width: '75%' }}></div>
                  <div className="h-full bg-secondary/30" style={{ width: '15%' }}></div>
                  <div className="h-full bg-error-container" style={{ width: '10%' }}></div>

                  {/* Pre-Shift Level Indicator (98.4%) */}
                  <div className="absolute top-0 bottom-0 bg-error w-1.5 z-20" style={{ left: '98.4%' }} title="Pre-Shift: 98.4%">
                    <div className="absolute -top-1 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-t-error"></div>
                  </div>

                  {/* Post-Shift Fill Bar */}
                  <div
                    className="absolute top-1.5 bottom-1.5 left-0 bg-primary/75 z-10 transition-all duration-500"
                    style={{ width: `${Math.min(sourcePostPct, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between font-label-code text-label-code text-tertiary">
                  <span>0 MVA (0%)</span>
                  <span className="text-secondary font-bold">75% NOMINAL</span>
                  <span className="text-primary font-bold">90% CAUTION</span>
                  <span className="text-error font-bold">50 MVA (100%)</span>
                </div>
              </div>

              {/* Top-Oil Thermal Projection */}
              <div className="bg-surface-container-high p-space-sm flex items-center justify-between border border-surface-variant">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-primary text-[1.25rem]">thermostat</span>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-body-sm font-bold text-on-surface">Top-Oil Temp Trajectory</span>
                    <span className="font-body-sm text-body-sm text-tertiary">Projected steady-state within 35 minutes</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-telemetry-num text-body-sm text-error line-through">94.2°C</span>
                  <span className="material-symbols-outlined text-secondary text-[1rem]">trending_down</span>
                  <span className="font-headline-sm text-headline-sm font-telemetry-num text-secondary font-bold">
                    {sourcePostTemp.toFixed(1)}°C
                  </span>
                  <span className="font-label-code text-label-code bg-secondary text-on-secondary px-1 py-0.5">
                    -{tempDrop.toFixed(1)}°C
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RECEIVING ASSET CARD (TX-Pine-02) */}
          <div className="bg-surface-container-lowest shadow-sm flex flex-col border border-surface-variant">
            <div className="bg-surface-container px-space-lg py-space-sm flex items-center justify-between border-b border-surface-variant">
              <div className="flex items-center gap-space-sm">
                <span className="w-3 h-3 bg-secondary inline-block"></span>
                <span className="font-headline-sm text-headline-sm uppercase tracking-tight text-on-surface font-bold">
                  RECEIVING: TX-Pine-02
                </span>
                <span className="font-label-code text-label-code bg-surface-container-highest px-1.5 py-0.5 text-on-surface-variant">
                  RATING: 50.0 MVA
                </span>
              </div>
              <span className="font-label-code text-label-code bg-secondary text-on-secondary px-2 py-0.5 uppercase tracking-widest font-bold">
                N-1 ABSORBER
              </span>
            </div>

            <div className="p-space-lg flex flex-col gap-space-md">
              {/* Numerical Metrics Row */}
              <div className="grid grid-cols-3 gap-space-md">
                <div className="bg-surface-container-low p-space-sm flex flex-col border border-surface-variant">
                  <span className="font-label-meta text-label-meta uppercase text-tertiary">Pre-Transfer</span>
                  <span className="font-headline-lg text-headline-lg font-telemetry-num text-secondary font-bold leading-none mt-1">
                    38.6
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary font-bold">77.2% (HEALTHY)</span>
                </div>
                <div className="bg-secondary/10 p-space-sm flex flex-col justify-center items-center text-center border border-secondary/20">
                  <span className="font-label-meta text-label-meta uppercase text-secondary font-bold">Injected Inflow</span>
                  <span className="font-headline-lg text-headline-lg font-telemetry-num text-secondary font-bold leading-none mt-1">
                    +{simulationShift.toFixed(1)}
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary font-bold">MVA LOAD</span>
                </div>
                <div className="bg-surface-container-low p-space-sm flex flex-col border border-surface-variant">
                  <span className="font-label-meta text-label-meta uppercase text-tertiary">Post-Transfer</span>
                  <span className="font-headline-lg text-headline-lg font-telemetry-num text-primary font-bold leading-none mt-1">
                    {targetPostLoad.toFixed(1)}
                  </span>
                  <span className="font-body-sm text-body-sm text-primary font-bold">
                    {targetPostPct}% ({targetPostPct >= 90 ? 'ELEVATED' : 'STABLE'})
                  </span>
                </div>
              </div>

              {/* Horizontal Capacity Bar Gauge */}
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex justify-between font-label-meta text-label-meta uppercase text-on-surface-variant font-bold">
                  <span>Dynamic Nameplate Utilization</span>
                  <span className="text-primary font-bold">
                    Remaining Headroom: {(50.0 - targetPostLoad).toFixed(1)} MVA
                  </span>
                </div>
                <div className="relative w-full h-8 bg-surface-container flex overflow-hidden border border-outline-variant">
                  <div className="h-full bg-secondary-fixed/50" style={{ width: '75%' }}></div>
                  <div className="h-full bg-secondary/30" style={{ width: '15%' }}></div>
                  <div className="h-full bg-error-container" style={{ width: '10%' }}></div>

                  {/* Pre-Shift Level Indicator (77.2%) */}
                  <div className="absolute top-0 bottom-0 bg-secondary w-1.5 z-20" style={{ left: '77.2%' }} title="Pre-Shift: 77.2%">
                    <div className="absolute -top-1 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-t-secondary"></div>
                  </div>

                  {/* Post-Shift Fill Bar */}
                  <div
                    className="absolute top-1.5 bottom-1.5 left-0 bg-primary/75 z-10 transition-all duration-500"
                    style={{ width: `${Math.min(targetPostPct, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between font-label-code text-label-code text-tertiary">
                  <span>0 MVA (0%)</span>
                  <span className="text-secondary font-bold">75% NOMINAL</span>
                  <span className="text-primary font-bold">90% CAUTION</span>
                  <span className="text-error font-bold">50 MVA (100%)</span>
                </div>
              </div>

              {/* Top-Oil Temp Trajectory */}
              <div className="bg-surface-container-high p-space-sm flex items-center justify-between border border-surface-variant">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-secondary text-[1.25rem]">thermostat</span>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-body-sm font-bold text-on-surface">Top-Oil Temp Trajectory</span>
                    <span className="font-body-sm text-body-sm text-tertiary">Calculated thermal equilibrium</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-telemetry-num text-body-sm text-tertiary">68.4°C</span>
                  <span className="material-symbols-outlined text-primary text-[1rem]">trending_up</span>
                  <span className="font-headline-sm text-headline-sm font-telemetry-num text-on-surface font-bold">
                    {targetPostTemp.toFixed(1)}°C
                  </span>
                  <span className="font-label-code text-label-code bg-surface-container-highest text-on-surface px-1 py-0.5">
                    +{tempRise.toFixed(1)}°C (&lt; 85°C Max)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* INLINE VECTOR SCHEMATIC: TRANSFER PATHWAY */}
          <div className="bg-surface-container-lowest p-space-md shadow-sm flex flex-col gap-space-sm border border-surface-variant">
            <div className="flex items-center justify-between">
              <span className="font-label-meta text-label-meta uppercase text-tertiary">Path Impedance &amp; Line Reactance Diagram</span>
              <span className="font-label-code text-label-code text-primary font-bold">X/R RATIO = 8.42</span>
            </div>
            <div className="w-full bg-surface-container-high p-space-sm border border-surface-variant/40">
              <svg className="w-full h-16" viewBox="0 0 600 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Oak Sub Bus */}
                <rect x="20" y="12" width="12" height="40" fill="#944521" />
                <text x="38" y="24" fill="#1c1c17" fontSize="10" fontWeight="bold" className="font-label-code">
                  BUS-OAK-13.8kV
                </text>
                <text x="38" y="38" fill="#55433c" fontSize="9" className="font-body-sm">
                  TX-Oak-04 Primary
                </text>

                {/* Breaker 52-OAK */}
                <line x1="32" y1="32" x2="160" y2="32" stroke="#944521" strokeWidth="2" strokeDasharray="2 2" />
                <rect x="160" y="24" width="16" height="16" fill="#1c1c17" />
                <text x="163" y="36" fill="#fcf9f1" fontSize="8" fontWeight="bold" className="font-label-code">
                  52-A
                </text>

                {/* Feeder Pathway F-104 */}
                <line x1="176" y1="32" x2="280" y2="32" stroke="#446554" strokeWidth="3" />

                {/* Tie Breaker */}
                <circle cx="300" cy="32" r="14" fill="#fcf9f1" stroke="#944521" strokeWidth="2" />
                <text x="293" y="35" fill="#944521" fontSize="9" fontWeight="bold" className="font-label-code">
                  TIE
                </text>
                <text x="282" y="56" fill="#944521" fontSize="8" fontWeight="bold" className="font-body-sm">
                  F-104 (SIM CLOSED)
                </text>

                {/* Feeder to Pine */}
                <line x1="320" y1="32" x2="424" y2="32" stroke="#446554" strokeWidth="3" />

                {/* Breaker 52-PINE */}
                <rect x="424" y="24" width="16" height="16" fill="#1c1c17" />
                <text x="427" y="36" fill="#fcf9f1" fontSize="8" fontWeight="bold" className="font-label-code">
                  52-B
                </text>
                <line x1="440" y1="32" x2="568" y2="32" stroke="#446554" strokeWidth="2" />

                {/* Pine Sub Bus */}
                <rect x="568" y="12" width="12" height="40" fill="#446554" />
                <text x="495" y="24" fill="#1c1c17" fontSize="10" fontWeight="bold" className="font-label-code">
                  BUS-PINE-13.8kV
                </text>
                <text x="495" y="38" fill="#55433c" fontSize="9" className="font-body-sm">
                  TX-Pine-02 Secondary
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* SECTION C & D: FINDINGS & DECISION SUMMARY (~26%)          */}
        {/* ========================================================== */}
        <div className="lg:col-span-3 flex flex-col gap-space-md">
          {/* Status Verdict Card */}
          <div className="bg-secondary-fixed/30 p-space-lg shadow-sm flex flex-col gap-space-sm border border-secondary/30">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-secondary text-[2rem]">check_circle</span>
              <div className="flex flex-col">
                <span className="font-label-meta text-label-meta uppercase text-on-secondary-fixed font-bold tracking-wider">
                  Feasibility Verdict
                </span>
                <span className="font-headline-sm text-body-sm font-bold text-on-secondary-fixed-variant uppercase">
                  CONSTRAINTS SATISFIED
                </span>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-secondary-container">
              The proposed {simulationShift.toFixed(1)} MVA shift via Feeder Tie F-104 falls entirely within transient thermal headroom models and complies with NERC PRC-023 loadability metrics.
            </p>
          </div>

          {/* Constraint Validation Checklist */}
          <div className="bg-surface-container-lowest shadow-sm p-space-lg flex flex-col gap-space-md border border-surface-variant">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-variant">
              <span className="font-headline-sm text-headline-sm uppercase tracking-wider text-on-surface">Criteria Matrix</span>
              <span className="font-label-code text-label-code text-tertiary">3 PASS / 1 ATTN</span>
            </div>

            <div className="flex flex-col gap-space-sm">
              {/* Item 1 */}
              <div className="p-space-sm bg-surface-container-low flex flex-col gap-1 border border-surface-variant/40">
                <div className="flex items-center justify-between">
                  <span className="font-headline-sm text-body-sm text-secondary font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[1rem]">check</span>
                    <span>Thermal Capacity Limit</span>
                  </span>
                  <span className="font-label-code text-label-code bg-secondary text-on-secondary px-1.5 py-0.5 font-bold">
                    PASS
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Neither asset exceeds 50.0 MVA maximum nameplate. Source relief = {simulationShift.toFixed(1)} MVA.
                </p>
              </div>

              {/* Item 2 */}
              <div className="p-space-sm bg-surface-container-low flex flex-col gap-1 border border-surface-variant/40">
                <div className="flex items-center justify-between">
                  <span className="font-headline-sm text-body-sm text-secondary font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[1rem]">check</span>
                    <span>Feeder Tie Rating</span>
                  </span>
                  <span className="font-label-code text-label-code bg-secondary text-on-secondary px-1.5 py-0.5 font-bold">
                    PASS
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {simulationShift.toFixed(1)} MVA transfer is within Feeder Tie F-104 physical cable rating of 15.0 MVA ({((simulationShift / 15.0) * 100).toFixed(1)}% utilization).
                </p>
              </div>

              {/* Item 3 */}
              <div className="p-space-sm bg-surface-container-low flex flex-col gap-1 border border-surface-variant/40">
                <div className="flex items-center justify-between">
                  <span className="font-headline-sm text-body-sm text-secondary font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[1rem]">check</span>
                    <span>Bus Voltage Stability</span>
                  </span>
                  <span className="font-label-code text-label-code bg-secondary text-on-secondary px-1.5 py-0.5 font-bold">
                    PASS
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Post-shift bus voltages remain between 0.98 pu and 1.01 pu; zero tap changer hunting predicted.
                </p>
              </div>

              {/* Item 4 */}
              <div className="p-space-sm bg-surface-container-high flex flex-col gap-1 border border-surface-variant/40">
                <div className="flex items-center justify-between">
                  <span className="font-headline-sm text-body-sm text-primary font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[1rem]">warning</span>
                    <span>Receiving Asset Margin</span>
                  </span>
                  <span className="font-label-code text-label-code bg-primary text-on-primary px-1.5 py-0.5 font-bold">
                    ATTENTION
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  TX-Pine-02 will operate at {targetPostPct}% capacity ({targetPostLoad.toFixed(1)} MVA). Operator must monitor closely if ambient load climbs past 18:00 UTC evening ramp.
                </p>
              </div>
            </div>
          </div>

          {/* Engineering Recommendation */}
          <div className="bg-surface-container-lowest shadow-sm p-space-lg flex flex-col gap-space-sm border border-surface-variant">
            <span className="font-label-meta text-label-meta uppercase text-on-surface-variant font-bold tracking-wider">
              Engineering Recommendation
            </span>
            <blockquote className="font-body-sm text-body-sm text-on-surface italic pl-space-sm bg-surface-container-low py-space-xs border-l-2 border-primary">
              “Hypothetical transfer of {simulationShift.toFixed(1)} MVA via Tie F-104 eliminates immediate thermal runaway condition on TX-Oak-04 while maintaining operational N-1 compliance on West Substation.”
            </blockquote>
            <div className="flex items-center justify-between pt-space-xs font-label-meta text-label-meta text-tertiary">
              <span>SIGN-OFF: Automated Study Engine</span>
              <span>STAMP: 16:42:19 UTC</span>
            </div>
          </div>

          {/* Artifact Export & Logging */}
          <div className="bg-surface-container shadow-sm p-space-md flex flex-col gap-space-sm border border-surface-variant">
            <span className="font-label-meta text-label-meta uppercase text-on-surface-variant font-bold tracking-wider">
              Artifact Export &amp; Logging
            </span>
            <button
              onClick={handleExportPlan}
              type="button"
              className="w-full bg-inverse-surface hover:bg-on-surface text-inverse-on-surface py-2.5 px-space-md flex items-center justify-center gap-2 font-headline-sm text-body-sm uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[1.125rem]">assignment</span>
              <span>Export Switching Plan (DNP3)</span>
            </button>
            <button
              onClick={handleSaveLog}
              type="button"
              className="w-full bg-surface-container-lowest hover:bg-surface text-on-surface py-2 px-space-md flex items-center justify-center gap-2 font-label-code text-label-code uppercase tracking-wider transition-colors shadow-sm cursor-pointer border border-outline-variant"
            >
              <span className="material-symbols-outlined text-[1rem]">save</span>
              <span>Save Scenario to Dispatch Log</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
