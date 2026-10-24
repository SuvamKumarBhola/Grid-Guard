import { useGrid } from '../../context/GridContext';

export default function Sidebar() {
  const { activeTab, setActiveTab } = useGrid();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
    { id: 'assets', label: 'Assets', icon: 'account_tree' },
    { id: 'alerts', label: 'Alerts', icon: 'warning', badge: '7' },
    { id: 'load-simulation', label: 'Load Simulation', icon: 'bolt' },
    { id: 'system-status', label: 'System Status', icon: 'tune' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-inverse-surface text-inverse-on-surface z-50 flex flex-col justify-between border-r border-tertiary-container/30 select-none">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="p-space-lg border-b border-tertiary-container/30 bg-inverse-surface">
          <div className="flex items-center gap-space-md">
            <img
              alt="GridGuard Emblem"
              className="h-8 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3dIQeuSg8JoKFdxt3YfcNG5Fcbgyotje1oYGKKS3oAyJZFA9w8_fIKV-RyoAfrg-ahTIZ5htBf727u0BO0stCK4K2OCBPkpzjREg6HgOWh6IJhUNiJYODUTdXb5IvDKa7WzB-jh9EyOHmEfJXPH3q3Wn657E-wE4K0dTbamWT8M5LvkQ20yfCIuhKQ1yElf-LmrsXSOKsp-SM-JzGcRKjArOEEALsAI9tdpmzHNjRwGECKCBz5x0"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-sm text-headline-sm uppercase tracking-wider text-inverse-on-surface font-bold">
                  GRIDGUARD
                </span>
                <span className="px-1.5 py-0.5 rounded bg-primary text-on-primary font-label-code text-label-code uppercase">
                  TX
                </span>
              </div>
              <span className="font-label-code text-label-code text-tertiary-fixed-dim uppercase tracking-widest mt-0.5">
                GRID INTELLIGENCE
              </span>
            </div>
          </div>
          <p className="mt-space-sm font-label-meta text-label-meta text-tertiary-fixed-dim uppercase tracking-wider border-l-2 border-primary pl-2">
            Understand the risk. Strengthen the grid.
          </p>
        </div>

        {/* Telemetry Status Strip */}
        <div className="px-space-md py-space-sm bg-inverse-surface/60 border-b border-tertiary-container/20 flex items-center justify-between text-tertiary-fixed-dim font-label-code text-label-code">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-pulse"></span>
            SUBSTATION TELEMETRY
          </span>
          <span className="text-secondary-fixed">SYS: OK</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 p-space-md">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center justify-between px-space-md py-space-sm transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-surface/10 text-inverse-on-surface border-l-4 border-primary font-headline-sm'
                    : 'text-tertiary-fixed text-body-md hover:bg-surface/5 hover:text-inverse-on-surface border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center gap-space-md">
                  <span className={`material-symbols-outlined text-[1.25rem] ${isActive ? 'text-primary' : ''}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="font-label-code text-label-code px-1.5 py-0.5 rounded bg-primary text-on-primary font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Substation Mini Schematic */}
      <div className="p-space-md border-t border-tertiary-container/30 bg-inverse-surface/80 flex flex-col gap-space-sm">
        <div className="p-space-sm bg-surface/5 border border-tertiary-container/30">
          <div className="flex items-center justify-between font-label-code text-label-code text-tertiary-fixed-dim">
            <span className="uppercase tracking-wider">BUS TOPOLOGY</span>
            <span className="text-secondary-fixed">LIVE (N-1 OK)</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-tertiary-container/20">
            <div className="h-1.5 flex-1 bg-tertiary-container/40 relative">
              <div className="absolute left-1/4 -top-1 w-2.5 h-3.5 bg-primary rounded-none"></div>
              <div className="absolute right-1/3 -top-1 w-2.5 h-3.5 bg-secondary-fixed rounded-none"></div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between font-label-meta text-label-meta text-tertiary-fixed-dim pt-space-xs">
          <span className="flex items-center gap-1.5 font-label-code text-label-code text-inverse-on-surface">
            <span className="w-2 h-2 rounded-full bg-secondary-fixed"></span>
            DNP3/IEC-61850 SECURE
          </span>
          <span className="font-label-code text-label-code text-tertiary-fixed-dim">v2.4-ENG</span>
        </div>
      </div>
    </aside>
  );
}
