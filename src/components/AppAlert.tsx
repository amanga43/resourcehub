"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, X } from "lucide-react";

export type AlertVariant = "success" | "error" | "confirm";

type AppAlertProps = {
  open: boolean;
  title: string;
  message: string;
  variant: AlertVariant;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  isProcessing?: boolean;
};

export default function AppAlert({
  open,
  title,
  message,
  variant,
  onClose,
  onConfirm,
  confirmText,
  cancelText = "Keep Reservation",
  isProcessing = false,
}: AppAlertProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && open && !isProcessing) {
        onClose();
      }
    }

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, isProcessing, onClose]);

  if (!open) return null;

  const isSuccess = variant === "success";
  const isError = variant === "error";
  const isConfirm = variant === "confirm";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      role="alertdialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0a1120]/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={() => {
          if (!isProcessing) onClose();
        }}
        aria-hidden="true"
      />

      {/* Dialog Modal */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-md transform overflow-hidden rounded-2xl border border-indigo-150 bg-white p-6 shadow-2xl shadow-blue-950/20 transition-all duration-200 sm:p-7"
      >
        {/* Close Icon Button */}
        {!isProcessing && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-indigo-50 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              isSuccess
                ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/20"
                : isError
                  ? "bg-rose-50 text-rose-600 ring-1 ring-rose-600/20"
                  : "bg-amber-50 text-amber-600 ring-1 ring-amber-600/20"
            }`}
          >
            {isSuccess && <CheckCircle2 className="h-5 w-5" />}
            {isError && <AlertCircle className="h-5 w-5" />}
            {isConfirm && <AlertTriangle className="h-5 w-5" />}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3
              id="alert-dialog-title"
              className="text-base font-semibold tracking-tight text-[#0b1528] sm:text-lg"
            >
              {title}
            </h3>

            <p
              id="alert-dialog-description"
              className="mt-2 text-sm leading-relaxed text-slate-600"
            >
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          {isConfirm && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-2xs transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            disabled={isProcessing}
            onClick={isConfirm ? onConfirm : onClose}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-2xs transition focus:outline-none focus:ring-2 disabled:opacity-60 ${
              isConfirm
                ? "bg-rose-600 hover:bg-rose-700 focus:ring-rose-500/20 shadow-rose-600/10"
                : isError
                  ? "bg-slate-900 hover:bg-slate-800 focus:ring-slate-900/20"
                  : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/20 shadow-blue-600/10"
            }`}
          >
            {isProcessing && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {isConfirm
              ? confirmText || "Yes, cancel reservation"
              : isError
                ? "Dismiss"
                : "Got it"}
          </button>
        </div>
      </div>
    </div>
  );
}
