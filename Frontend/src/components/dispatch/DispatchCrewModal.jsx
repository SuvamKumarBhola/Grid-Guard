import React, { useState, useEffect } from 'react';
import { useGrid } from '../../context/GridContext';
import { STANDARD_SOPS } from '../../data/mockCrews';

export default function DispatchCrewModal() {
  const {
    isDispatchModalOpen,
    closeDispatchModal,
    dispatchAssetId,
    dispatchPrefill,
    dispatchFieldCrew,
    crews,
    assets,
    currentTime,
    addToast,
  } = useGrid();

  const targetAsset =
    assets.find(
      (a) =>
        a.id === dispatchAssetId ||
        a.alias === dispatchAssetId ||
        (dispatchAssetId === 'TX-Oak-04' && a.id === 'TX-04')
    ) || assets[0];

  const [selectedCrewId, setSelectedCrewId] = useState('CREW-03-THERMAL');
  const [priority, setPriority] = useState('P1-EMERGENCY');
  const [failureMode, setFailureMode] = useState('');
  const [sopCode, setSopCode] = useState('SOP-TX-10');
  const [notes, setNotes] = useState('');
  const [ppeAcknowledged, setPpeAcknowledged] = useState(true);
  const [interlockAcknowledged, setInterlockAcknowledged] = useState(true);
  const [previewTicketId, setPreviewTicketId] = useState('');

  useEffect(() => {
    if (isDispatchModalOpen) {
      setPreviewTicketId(`#WO-2026-${Math.floor(1000 + Math.random() * 9000)}`);
      setFailureMode(
        dispatchPrefill.failureMode ||
          targetAsset.primaryFailureMode ||
          'Auxiliary Cooling Fan Bank #2 Complete Trip (Thermal 94.2°C)'
      );
      setSopCode(dispatchPrefill.sopReference || 'SOP-TX-10');
      setPriority(dispatchPrefill.priority || (targetAsset.riskClassification === 'CRITICAL' ? 'P1-EMERGENCY' : 'P2-URGENT'));
      setNotes(dispatchPrefill.recommendedAction || 'Emergency on-site inspection and forced cooling mitigation required.');
    }
  }, [isDispatchModalOpen, dispatchAssetId, dispatchPrefill, targetAsset]);

  if (!isDispatchModalOpen) return null;

  const selectedCrew = crews.find((c) => c.crewId === selectedCrewId) || crews[0];
  const activeSop = STANDARD_SOPS.find((s) => s.code === sopCode) || STANDARD_SOPS[0];

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!failureMode || !failureMode.trim()) {
      addToast('Please provide an observed failure mode or inspection scope before authorizing dispatch.', 'warn');
      return;
    }
    if (!ppeAcknowledged || !interlockAcknowledged) {
      addToast('Mandatory safety requirement: Please confirm PPE briefing and SCADA breaker interlock acknowledgment.', 'warn');
      return;
    }

    dispatchFieldCrew({
      assetId: targetAsset.id,
      crewId: selectedCrew.crewId,
      priority,
      failureMode: failureMode.trim(),
      sopReference: activeSop.code,
      notes,
      etaMinutes: selectedCrew.etaMinutes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-4xl bg-surface-container-lowest border-2 border-primary/50 shadow-2xl rounded-none flex flex-col max-h-[92vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-space-lg py-space-md bg-inverse-surface text-inverse-on-surface flex items-center justify-between border-b border-surface-variant">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[1.75rem] animate-pulse">
              engineering
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-headline-sm uppercase font-bold tracking-wider text-on-primary">
                  Field Dispatch Authorization Desk
                </h2>
                <span className="px-2 py-0.5 bg-error text-on-error font-label-code text-label-code font-bold uppercase tracking-wider">
                  MISSION CRITICAL
                </span>
              </div>
              <p className="font-label-meta text-label-meta text-inverse-on-surface/80 uppercase">
                SCADA PROTOCOL • DUAL-OPERATOR FIELD TICKET GENERATION • {currentTime}
              </p>
            </div>
          </div>
          <button
            onClick={closeDispatchModal}
            className="p-1.5 text-inverse-on-surface/70 hover:text-on-primary hover:bg-surface-variant/40 rounded transition-colors cursor-pointer"
            aria-label="Close Dispatch Modal"
          >
            <span className="material-symbols-outlined text-[1.5rem]">close</span>
          </button>
        </div>

        {/* Modal Content - Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-space-lg space-y-space-md">
          {/* Target Asset Telemetry Banner */}
          <div className="p-space-md bg-surface-container-low border border-surface-variant flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[2rem]">
                electric_meter
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold uppercase">
                    {targetAsset.displayCode || targetAsset.name} ({targetAsset.alias || targetAsset.id})
                  </span>
                  <span className="px-2 py-0.5 bg-surface-container-high border border-outline-variant font-label-code text-label-code text-on-surface font-semibold uppercase">
                    {targetAsset.substationCode || 'FEEDER F-03'}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  {targetAsset.substation} • {targetAsset.classType}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-surface-variant/60 pt-2 md:pt-0 md:pl-4">
              <div>
                <span className="font-label-meta text-label-meta text-tertiary uppercase block">
                  HOTSPOT TEMP
                </span>
                <span className="font-headline-sm text-body-md font-bold text-error">
                  {targetAsset.temperatureC}°C
                </span>
              </div>
              <div>
                <span className="font-label-meta text-label-meta text-tertiary uppercase block">
                  LOADING
                </span>
                <span className="font-headline-sm text-body-md font-bold text-on-surface">
                  {targetAsset.loadPercentage}%
                </span>
              </div>
              <div>
                <span className="font-label-meta text-label-meta text-tertiary uppercase block">
                  POPULATION AT RISK
                </span>
                <span className="font-headline-sm text-body-md font-bold text-secondary">
                  ~1,840 Cust.
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Dispatch Priority Selector */}
          <div>
            <label className="font-label-code text-label-code text-on-surface font-bold uppercase tracking-wider block mb-1.5">
              1. Tactical Response Priority Tier
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {[
                {
                  id: 'P1-EMERGENCY',
                  title: 'P1 - Critical Emergency',
                  desc: '< 30 Min Response • Imminent Trip / Pyrolysis Risk',
                  border: 'border-error text-error bg-error-container/20',
                  activeClass: 'ring-2 ring-error bg-error text-on-error',
                },
                {
                  id: 'P2-URGENT',
                  title: 'P2 - Urgent Intervention',
                  desc: '< 2 Hour Response • Thermal Hotspot / Reduced Cooling',
                  border: 'border-tertiary text-tertiary bg-surface-container',
                  activeClass: 'ring-2 ring-tertiary bg-tertiary text-on-tertiary',
                },
                {
                  id: 'P3-SCHEDULED',
                  title: 'P3 - Precautionary Inspection',
                  desc: '< 24 Hour Response • Telemetry Check / Oil Sampling',
                  border: 'border-secondary text-secondary bg-surface-container',
                  activeClass: 'ring-2 ring-secondary bg-secondary text-on-secondary',
                },
              ].map((tier) => {
                const isSelected = priority === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setPriority(tier.id)}
                    className={`p-3 text-left border transition-all cursor-pointer ${
                      isSelected
                        ? tier.activeClass
                        : 'border-surface-variant bg-surface-container-lowest hover:bg-surface-container-low text-on-surface'
                    }`}
                  >
                    <div className="flex items-center justify-between font-headline-sm text-body-sm font-bold uppercase">
                      <span>{tier.title}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[1.125rem]">check_circle</span>
                      )}
                    </div>
                    <p className={`font-label-meta text-label-meta mt-1 ${isSelected ? 'opacity-90' : 'text-on-surface-variant'}`}>
                      {tier.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Field Crew Assignment */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-label-code text-label-code text-on-surface font-bold uppercase tracking-wider">
                2. Field Crew Selection &amp; Dispatch ETA
              </label>
              <span className="font-label-meta text-label-meta text-secondary uppercase font-semibold">
                {crews.filter((c) => c.status === 'Available').length} CREWS AVAILABLE ON STANDBY
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {crews.map((crew) => {
                const isSelected = selectedCrewId === crew.crewId;
                const isDispatched = crew.status === 'Dispatched';
                return (
                  <div
                    key={crew.crewId}
                    onClick={() => setSelectedCrewId(crew.crewId)}
                    className={`p-3 border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary bg-primary-fixed/20 ring-1 ring-primary'
                        : 'border-surface-variant bg-surface-container-lowest hover:bg-surface-container-low'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-headline-sm text-body-sm font-bold text-on-surface">
                          {crew.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 font-label-code text-[0.6875rem] font-bold uppercase ${
                            isDispatched
                              ? 'bg-secondary-container text-on-secondary-container'
                              : 'bg-primary text-on-primary'
                          }`}
                        >
                          {crew.status}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        {crew.specialty}
                      </p>
                      <div className="flex items-center gap-2 mt-2 font-label-meta text-label-meta text-tertiary uppercase">
                        <span>LEAD: {crew.leadTechnician}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-surface-variant/40 font-label-code text-label-code">
                      <span className="text-primary font-bold">ETA: ~{crew.etaMinutes} MINS</span>
                      <span className="text-secondary font-semibold">RADIO: {crew.radioChannel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Failure Mode & Inspection Scope */}
          <div>
            <label className="font-label-code text-label-code text-on-surface font-bold uppercase tracking-wider block mb-1.5">
              3. Observed Failure Mode / Anomaly Scope
            </label>
            <input
              type="text"
              value={failureMode}
              onChange={(e) => setFailureMode(e.target.value)}
              className="w-full p-2.5 bg-surface-container-low border border-surface-variant text-on-surface font-body-sm focus:border-primary focus:outline-none"
              placeholder="e.g. Auxiliary Fan Bank #2 Trip, Winding Hotspot Runaway, DGA Gas Spike..."
              required
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="font-label-meta text-label-meta text-tertiary uppercase mr-1">QUICK TAGS:</span>
              {[
                'Fan Bank #2 Complete Lockout',
                'Phase Voltage Spread (>8%)',
                'H2 Dissolved Gas Surge (>180ppm)',
                'DNP3 RTU Telemetry Frame Drop',
                'Buchholz Relay Trace Gas Detected',
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setFailureMode(tag)}
                  className="px-2 py-0.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant font-label-meta text-label-meta text-on-surface cursor-pointer"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Standard Operating Procedure (SOP) & Safety Interlocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            <div>
              <label className="font-label-code text-label-code text-on-surface font-bold uppercase tracking-wider block mb-1.5">
                4. Mandatory SOP Protocol
              </label>
              <select
                value={sopCode}
                onChange={(e) => setSopCode(e.target.value)}
                className="w-full p-2.5 bg-surface-container-low border border-surface-variant text-on-surface font-body-sm focus:border-primary focus:outline-none"
              >
                {STANDARD_SOPS.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} — {s.title}
                  </option>
                ))}
              </select>

              <div className="p-2.5 bg-surface-container-low border border-surface-variant/60 mt-2 space-y-1">
                <span className="font-label-meta text-label-meta text-primary font-bold uppercase block">
                  PPE SPECIFICATION: {activeSop.ppeLevel}
                </span>
                <ul className="list-disc list-inside text-body-sm text-on-surface-variant space-y-0.5 text-xs">
                  {activeSop.steps.slice(0, 3).map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <label className="font-label-code text-label-code text-on-surface font-bold uppercase tracking-wider block mb-1.5">
                5. Safety Interlocks &amp; Authorizations
              </label>
              <div className="p-space-sm bg-surface-container-low border border-surface-variant space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ppeAcknowledged}
                    onChange={(e) => setPpeAcknowledged(e.target.checked)}
                    className="mt-1 h-4 w-4 text-primary rounded"
                  />
                  <span className="font-body-sm text-body-sm text-on-surface leading-tight">
                    Confirm field crew briefed on <strong>{activeSop.ppeLevel}</strong> and mandatory grounding.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={interlockAcknowledged}
                    onChange={(e) => setInterlockAcknowledged(e.target.checked)}
                    className="mt-1 h-4 w-4 text-primary rounded"
                  />
                  <span className="font-body-sm text-body-sm text-on-surface leading-tight">
                    SCADA breaker interlock verified. Dual-operator tag applied to bus feed.
                  </span>
                </label>

                <div className="p-2 bg-surface-container border border-surface-variant text-xs text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[1rem]">verified_user</span>
                  <span>Lead Dispatcher ID: <strong>S. Vance, P.E. (#STN-01)</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Operator Notes */}
          <div>
            <label className="font-label-code text-label-code text-on-surface font-bold uppercase tracking-wider block mb-1.5">
              6. Operator Specific Instructions &amp; Site Access Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-surface-container-low border border-surface-variant text-on-surface font-body-sm focus:border-primary focus:outline-none"
              placeholder="e.g. Substation North Gate Access Code: 4921#. Contact local security before entering yard."
            />
          </div>

          {/* Ticket Generation Live Summary Box */}
          <div className="p-space-md bg-inverse-surface text-inverse-on-surface border border-surface-variant flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-label-code text-label-code text-primary font-bold">
                  PROJECTED TICKET ID:
                </span>
                <span className="font-label-code text-label-code font-bold text-on-primary bg-primary/20 px-2 py-0.5">
                  {previewTicketId}
                </span>
              </div>
              <p className="font-label-meta text-label-meta text-inverse-on-surface/80 uppercase mt-1">
                ASSIGNMENT: {selectedCrew.name} • ETA: {selectedCrew.etaMinutes} MIN • RADIO: {selectedCrew.radioChannel}
              </p>
            </div>
            <div className="text-right">
              <span className="font-label-code text-label-code text-secondary font-bold block">
                COMPLIANCE: {sopCode}
              </span>
              <span className="font-label-meta text-label-meta text-inverse-on-surface/60">
                AUDIT TRAIL LOGGED IMMUTABLY
              </span>
            </div>
          </div>
        </form>

        {/* Modal Footer Controls */}
        <div className="p-space-md bg-surface-container border-t border-surface-variant flex items-center justify-between gap-space-sm">
          <button
            type="button"
            onClick={closeDispatchModal}
            className="py-2.5 px-space-lg bg-surface hover:bg-surface-container-high border border-outline-variant font-label-code text-label-code text-on-surface uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            id="modal-authorize-dispatch-btn"
            onClick={handleSubmit}
            className="py-2.5 px-space-xl bg-primary hover:bg-primary/90 text-on-primary font-headline-sm text-body-md uppercase font-bold tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <span className="material-symbols-outlined text-[1.25rem]">send</span>
            <span>Authorize &amp; Dispatch Field Crew</span>
          </button>
        </div>
      </div>
    </div>
  );
}
