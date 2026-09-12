import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { TOAST_DURATION } from "../lib/constants";

export default function ToastCard({ toast, onClose, C }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  const accentColor = isError ? C.red : C.green;
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div className="fixed top-5 right-5 z-50 w-[calc(100%-2.5rem)] max-w-xs">
      <style>{`
        @keyframes toast-in { from { opacity: 0; transform: translateY(-10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes toast-shrink { from { width: 100%; } to { width: 0%; } }
      `}</style>
      <div
        key={toast.id}
        className="rounded-lg overflow-hidden"
        style={{
          backgroundColor: C.surface,
          border: `1px solid ${C.border}`,
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          animation: "toast-in 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="flex items-start gap-3 p-4" style={{ borderLeft: `3px solid ${accentColor}` }}>
          <Icon size={18} style={{ color: accentColor, marginTop: 1, flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{toast.title}</p>
            {toast.message && (
              <p className="text-sm mt-0.5" style={{ color: C.textMuted }}>{toast.message}</p>
            )}
          </div>
          <button onClick={onClose} style={{ color: C.textMuted }} className="shrink-0">
            <X size={14} />
          </button>
        </div>
        <div className="h-0.5" style={{ backgroundColor: C.border }}>
          <div
            key={toast.id}
            className="h-full"
            style={{ backgroundColor: accentColor, animation: `toast-shrink ${TOAST_DURATION}ms linear forwards` }}
          />
        </div>
      </div>
    </div>
  );
}
