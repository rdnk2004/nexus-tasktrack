import React from 'react';
import { useToast, ToastType } from '@/hooks/useToast';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
  error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
  info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
};

const BORDER_STYLES: Record<ToastType, string> = {
  success: 'border-emerald-500/30 bg-[#0e1612]/95 shadow-[0_8px_30px_rgba(16,185,129,0.15)]',
  error: 'border-rose-500/30 bg-[#190e12]/95 shadow-[0_8px_30px_rgba(244,63,94,0.15)]',
  warning: 'border-amber-500/30 bg-[#18130a]/95 shadow-[0_8px_30px_rgba(245,158,11,0.15)]',
  info: 'border-blue-500/30 bg-[#0e131d]/95 shadow-[0_8px_30px_rgba(59,130,246,0.15)]',
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none sm:max-w-md"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl transition-all duration-200 animate-slide-up ${BORDER_STYLES[t.type]}`}
          role="alert"
        >
          {ICONS[t.type]}
          <div className="flex-1 min-w-0">
            {t.title && <h4 className="text-xs font-bold text-white tracking-tight mb-0.5">{t.title}</h4>}
            <p className="text-xs text-gray-200 leading-relaxed break-words">{t.message}</p>
          </div>
          <button
            type="button"
            onClick={() => removeToast(t.id)}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
