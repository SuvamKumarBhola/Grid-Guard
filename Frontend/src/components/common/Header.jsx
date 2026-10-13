import React from 'react';
import { useGrid } from '../../context/GridContext';

export default function Header() {
  const { searchQuery, setSearchQuery, addToast } = useGrid();

  return (
    <header className="fixed top-0 left-72 right-0 h-16 bg-surface-container border-b border-surface-variant z-40 px-gutter-desktop flex items-center justify-between select-none">
      {/* Search Bar */}
      <div className="flex items-center gap-gutter">
        <div className="relative w-96">
          <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-[1.125rem] text-tertiary">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-space-md py-1.5 bg-surface border border-outline-variant rounded text-body-sm font-body-sm text-on-surface placeholder:text-tertiary placeholder:font-body-sm focus:outline-none focus:border-on-surface transition-colors"
            placeholder="Search Substations, Feeders, TX-ID (e.g. TX-402)..."
            type="text"
          />
        </div>
      </div>

      {/* Right Side: Alert Notification & Account / Profile Section */}
      <div className="flex items-center gap-space-md">
        <button
          onClick={() =>
            addToast(
              'SCADA Alert Notification: 1 Critical Thermal Alarm on TX-Oak-04 requires dispatch confirmation.',
              'warn'
            )
          }
          className="relative p-1.5 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          title="Active Grid Alerts"
        >
          <span className="material-symbols-outlined text-[1.25rem]">notifications</span>
          <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-on-primary rounded-full font-label-code text-[0.5625rem] flex items-center justify-center font-bold">
            3
          </span>
        </button>

        <div className="h-6 w-px bg-outline-variant"></div>

        {/* Account / User Profile */}
        <div className="flex items-center gap-space-sm">
          <img
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover border border-outline-variant"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdlhBWRBzsG3pQWeEAP6KNRtLKO2j4_67MsOqorHIMVY4crgXsUAYelvUiyjvnQ_z9HLY3QnYYMbyT1VuUmIFGKA5-x9NXj9VxWoTK8nAWdCh3jZDYSVCFMwbzdiqZ7X9ZxGaBDh5iPQaRHfUK_gGL8-CwJw2qeFQ6-7om88z0IGwykkSduAspcIfQVlITbpk6XUcbcRX08Ko4cOxaSQtvZCiZ6YI9zs4vFVcHqyjACwi-m4FL96I"
          />
          <div className="flex flex-col text-left">
            <span className="font-headline-sm text-body-sm text-on-surface font-semibold leading-tight">
              S. Vance, P.E.
            </span>
            <span className="font-label-meta text-label-meta text-on-surface-variant uppercase tracking-wider">
              Grid Operations Lead
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
