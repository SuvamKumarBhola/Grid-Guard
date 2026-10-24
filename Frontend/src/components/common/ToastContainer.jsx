import { useGrid } from '../../context/GridContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useGrid();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md pointer-events-auto">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isWarn = toast.type === 'warn';
        const icon = isSuccess ? 'check_circle' : isWarn ? 'warning' : 'info';
        const iconColor = isSuccess ? 'text-secondary-fixed' : isWarn ? 'text-primary' : 'text-on-primary';

        return (
          <div
            key={toast.id}
            className="p-space-md bg-inverse-surface text-inverse-on-surface shadow-2xl flex items-center justify-between gap-space-sm border border-tertiary-container/40 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <div className="flex items-center gap-space-sm">
              <span className={`material-symbols-outlined ${iconColor} text-[1.25rem] shrink-0`}>
                {icon}
              </span>
              <div className="flex flex-col">
                <span className="font-label-code text-label-code text-tertiary-fixed uppercase font-bold tracking-wider">
                  SYSTEM TELEMETRY ENGINE
                </span>
                <span className="font-body-sm text-body-sm text-inverse-on-surface font-medium leading-tight mt-0.5">
                  {toast.message}
                </span>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 text-tertiary-fixed hover:text-inverse-on-surface transition-colors cursor-pointer"
              title="Dismiss"
            >
              <span className="material-symbols-outlined text-[1rem]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
