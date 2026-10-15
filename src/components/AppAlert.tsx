
"use client";

type AppAlertProps = {
  open: boolean;
  title: string;
  message: string;
  variant: "success" | "error" | "confirm";
  onClose: () => void;
  onConfirm?: () => void;
};

export default function AppAlert({
  open,
  title,
  message,
  variant,
  onClose,
  onConfirm,
}: AppAlertProps) {
  if (!open) return null;

  const isSuccess = variant === "success";
  const isError = variant === "error";
  const isConfirm = variant === "confirm";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="app-alert-title"
        aria-describedby="app-alert-message"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-bold ${
              isSuccess
                ? "bg-emerald-100 text-emerald-700"
                : isError
                  ? "bg-red-100 text-red-700"
                  : "bg-indigo-100 text-indigo-700"
            }`}
          >
            {isSuccess ? "✓" : isError ? "!" : "?"}
          </div>

          <div className="flex-1">
            <h2
              id="app-alert-title"
              className="text-lg font-bold text-slate-900"
            >
              {title}
            </h2>

            <p
              id="app-alert-message"
              className="mt-2 text-sm leading-6 text-slate-600"
            >
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {isConfirm && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={isConfirm ? onConfirm : onClose}
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition ${
              isError
                ? "bg-red-600 hover:bg-red-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isConfirm ? "Yes, cancel reservation" : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
