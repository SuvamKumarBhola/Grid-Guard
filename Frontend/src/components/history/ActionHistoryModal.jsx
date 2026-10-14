import React, { useState, useMemo } from 'react';
import { useGrid } from '../../context/GridContext';

export default function ActionHistoryModal() {
  const {
    isHistoryModalOpen,
    closeHistoryModal,
    actionHistory,
    currentTime,
    navigateToAsset,
    addToast,
    addHistoryAction,
  } = useGrid();

  const [activeCategory, setActiveCategory] = useState('ALL');
  const [assetFilter, setAssetFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteAssetId, setNoteAssetId] = useState('TX-04');

  const filteredHistory = useMemo(() => {
    return actionHistory.filter((item) => {
      // Category filter
      if (activeCategory !== 'ALL' && item.type !== activeCategory) {
        return false;
      }
      // Asset filter
      if (assetFilter !== 'ALL' && item.assetId !== assetFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const descMatch = (item.description || '').toLowerCase().includes(q);
        const ticketMatch = (item.ticketId || '').toLowerCase().includes(q);
        const opMatch = (item.operator || '').toLowerCase().includes(q);
        const assetMatch = (item.assetId || '').toLowerCase().includes(q);
        return titleMatch || descMatch || ticketMatch || opMatch || assetMatch;
      }
      return true;
    });
  }, [actionHistory, activeCategory, assetFilter, searchQuery]);

  if (!isHistoryModalOpen) return null;

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Date', 'Type', 'Category', 'Asset ID', 'Title', 'Description', 'Ticket ID', 'Operator'];
    const rows = actionHistory.map((h) => [
      `"${h.timestamp}"`,
      `"${h.date || ''}"`,
      `"${h.type}"`,
      `"${h.category || ''}"`,
      `"${h.assetId}"`,
      `"${(h.title || '').replace(/"/g, '""')}"`,
      `"${(h.description || '').replace(/"/g, '""')}"`,
      `"${h.ticketId || ''}"`,
      `"${h.operator || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GridGuard_Operational_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Audit history exported as CSV (NERC-CIP compliant).', 'success');
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(actionHistory, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `GridGuard_Operational_Audit_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Audit history exported as JSON.', 'success');
  };

  const handleAddManualNote = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    addHistoryAction({
      type: 'OPERATOR_LOG',
      category: 'Manual Entry',
      assetId: noteAssetId,
      title: `Operator Shift Entry: [${noteAssetId}]`,
      description: noteText.trim(),
      ticketId: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      metadata: { loggedBy: 'S. Vance, P.E.', source: 'Interactive Dispatch Log' },
    });

    setNoteText('');
    setIsAddingNote(false);
    addToast('Operator audit entry committed.', 'success');
  };

  const getBadgeClass = (type) => {
    switch (type) {
      case 'DISPATCH':
        return 'bg-primary text-on-primary';
      case 'INJECTION':
        return 'bg-primary-fixed text-on-primary-fixed font-bold border border-primary/40';
      case 'SIMULATION':
        return 'bg-surface-container-high text-on-surface border border-outline-variant';
      case 'DIAGNOSTIC':
        return 'bg-error text-on-error';
      case 'STATUS_UPDATE':
        return 'bg-secondary text-on-secondary';
      case 'ALERT_ACK':
        return 'bg-secondary-fixed text-on-secondary-fixed';
      default:
        return 'bg-surface-container text-on-surface border border-outline-variant';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'DISPATCH':
        return 'engineering';
      case 'INJECTION':
        return 'stream';
      case 'SIMULATION':
        return 'bolt';
      case 'DIAGNOSTIC':
        return 'network_check';
      case 'STATUS_UPDATE':
        return 'update';
      case 'ALERT_ACK':
        return 'task_alt';
      default:
        return 'history_edu';
    }
  };

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
            <span className="material-symbols-outlined text-primary text-[1.75rem]">history</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-headline-sm uppercase font-bold tracking-wider text-on-primary">
                  Operational Action History &amp; Audit Trail
                </h2>
                <span className="px-2 py-0.5 bg-primary/20 text-primary border border-primary font-label-code text-label-code font-bold uppercase">
                  {actionHistory.length} ACTIONS RECORDED
                </span>
              </div>
              <p className="font-label-meta text-label-meta text-inverse-on-surface/80 uppercase">
                IMMUTABLE SCADA LOG • NERC-CIP COMPLIANT AUDIT TRAIL • {currentTime}
              </p>
            </div>
          </div>
          <button
            onClick={closeHistoryModal}
            className="p-1.5 text-inverse-on-surface/70 hover:text-on-primary hover:bg-surface-variant/40 rounded transition-colors cursor-pointer"
            aria-label="Close History Modal"
          >
            <span className="material-symbols-outlined text-[1.5rem]">close</span>
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="p-space-md bg-surface-container-low border-b border-surface-variant flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'ALL', label: 'All Actions' },
              { id: 'DISPATCH', label: 'Dispatches' },
              { id: 'INJECTION', label: 'Data Injections' },
              { id: 'SIMULATION', label: 'Load Shifts' },
              { id: 'DIAGNOSTIC', label: 'Diagnostics' },
              { id: 'STATUS_UPDATE', label: 'Status Updates' },
            ].map((tab) => {
              const count =
                tab.id === 'ALL'
                  ? actionHistory.length
                  : actionHistory.filter((a) => a.type === tab.id).length;
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-3 py-1.5 text-xs font-label-code font-bold uppercase transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                    isActive
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1 py-0.2 rounded text-[0.625rem] ${isActive ? 'bg-on-primary/20 text-on-primary' : 'bg-surface text-tertiary'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Transformer Filter */}
          <div className="flex items-center gap-2">
            <select
              value={assetFilter}
              onChange={(e) => setAssetFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-surface border border-outline-variant rounded font-label-code text-xs text-on-surface focus:outline-none"
            >
              <option value="ALL">All Transformers</option>
              <option value="TX-04">TX-04 (Feeder F-03)</option>
              <option value="TX-09">TX-09 (Feeder F-04)</option>
              <option value="TX-Pine-02">TX-Pine-02 (West Sub)</option>
              <option value="TX-01">TX-01 (Feeder F-01)</option>
              <option value="CB-12">CB-12 (Breaker)</option>
            </select>

            <div className="relative w-48 md:w-64">
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[1rem] text-tertiary">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history..."
                className="w-full pl-7 pr-2.5 py-1.5 bg-surface border border-outline-variant rounded text-xs text-on-surface focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Manual Operator Note Input Form (Collapsible) */}
        {isAddingNote && (
          <form onSubmit={handleAddManualNote} className="p-space-md bg-surface-container border-b border-primary/40 flex flex-col md:flex-row gap-2 items-center">
            <select
              value={noteAssetId}
              onChange={(e) => setNoteAssetId(e.target.value)}
              className="p-2 bg-surface border border-outline-variant rounded text-xs text-on-surface font-label-code"
            >
              <option value="TX-04">TX-04 (Primary Hotspot)</option>
              <option value="TX-09">TX-09 (Pending RTU Maint)</option>
              <option value="TX-Pine-02">TX-Pine-02 (Tie Feeder)</option>
              <option value="TX-01">TX-01 (Nominal Transformer)</option>
              <option value="GRID-WIDE">Grid-Wide SCADA System</option>
            </select>
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter operator observation or shift log entry..."
              className="flex-1 p-2 bg-surface border border-outline-variant rounded text-xs text-on-surface focus:outline-none"
              autoFocus
            />
            <div className="flex items-center gap-1.5">
              <button
                type="submit"
                className="px-3 py-1.5 bg-primary text-on-primary text-xs font-bold font-label-code uppercase rounded cursor-pointer"
              >
                Log Entry
              </button>
              <button
                type="button"
                onClick={() => setIsAddingNote(false)}
                className="px-2.5 py-1.5 bg-surface text-on-surface-variant hover:text-on-surface text-xs font-label-code uppercase rounded cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* History Records List */}
        <div className="flex-1 overflow-y-auto p-space-md space-y-space-sm divide-y divide-surface-variant/40">
          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[3rem] text-tertiary">history_toggle_off</span>
              <p className="font-headline-sm text-sm uppercase font-bold text-on-surface">No audit records match the selected filter</p>
              <p className="text-xs text-tertiary max-w-sm">Try clearing your search query or selecting 'All Actions' to inspect complete operational timeline.</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="pt-space-sm first:pt-0 flex flex-col md:flex-row md:items-start justify-between gap-space-sm hover:bg-surface-container/30 p-2.5 rounded transition-colors"
              >
                {/* Left Side: Type Icon, Titles & Description */}
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded shrink-0 flex items-center justify-center ${getBadgeClass(item.type)}`}>
                    <span className="material-symbols-outlined text-[1.25rem]">{getIcon(item.type)}</span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-headline-sm text-sm font-bold text-on-surface">{item.title}</span>
                      <span className="px-1.5 py-0.5 bg-surface-container-high border border-outline-variant text-[0.625rem] font-label-code font-bold uppercase text-on-surface">
                        {item.assetId}
                      </span>
                      {item.ticketId && (
                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/30 text-[0.625rem] font-label-code font-bold">
                          {item.ticketId}
                        </span>
                      )}
                    </div>
                    <p className="font-body-sm text-xs text-on-surface-variant mt-1 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Metadata pill row */}
                    {item.metadata && Object.keys(item.metadata).length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 mt-2 font-label-meta text-[0.625rem] text-tertiary uppercase">
                        {Object.entries(item.metadata).map(([k, v]) => (
                          <span key={k} className="px-1.5 py-0.5 bg-surface-container rounded border border-surface-variant">
                            {k}: <strong className="text-on-surface font-semibold">{String(v)}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Timestamp, Operator & Quick Action */}
                <div className="flex md:flex-col items-center md:items-end justify-between shrink-0 font-label-code text-xs text-right">
                  <span className="text-primary font-bold">{item.timestamp}</span>
                  <span className="text-[0.6875rem] text-tertiary uppercase mt-0.5">OPERATOR: {item.operator}</span>
                  {item.assetId && item.assetId !== 'ALL-ASSETS' && item.assetId !== 'GRID-WIDE' && (
                    <button
                      onClick={() => {
                        navigateToAsset(item.assetId);
                        closeHistoryModal();
                      }}
                      className="mt-2 text-[0.6875rem] text-secondary hover:text-primary underline cursor-pointer"
                    >
                      View [{item.assetId}] →
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-space-md bg-surface-container border-t border-surface-variant flex flex-col md:flex-row items-center justify-between gap-space-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="py-2 px-space-md bg-surface hover:bg-surface-container-high border border-outline-variant font-label-code text-xs uppercase text-on-surface flex items-center gap-1.5 cursor-pointer rounded"
            >
              <span className="material-symbols-outlined text-[1rem]">download</span>
              <span>Export CSV (NERC-CIP)</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="py-2 px-space-md bg-surface hover:bg-surface-container-high border border-outline-variant font-label-code text-xs uppercase text-on-surface flex items-center gap-1.5 cursor-pointer rounded"
            >
              <span className="material-symbols-outlined text-[1rem]">data_object</span>
              <span>Export JSON</span>
            </button>
            {!isAddingNote && (
              <button
                onClick={() => setIsAddingNote(true)}
                className="py-2 px-space-md bg-surface hover:bg-surface-container-high border border-outline-variant font-label-code text-xs uppercase text-on-surface flex items-center gap-1.5 cursor-pointer rounded"
              >
                <span className="material-symbols-outlined text-[1rem]">edit_note</span>
                <span>Add Operator Log</span>
              </button>
            )}
          </div>

          <button
            onClick={closeHistoryModal}
            className="py-2 px-space-xl bg-inverse-surface hover:bg-on-surface text-inverse-on-surface font-headline-sm text-xs uppercase font-bold tracking-wider rounded cursor-pointer"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
}
