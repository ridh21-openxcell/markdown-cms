"use client";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-surface border border-border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted mt-2">{message}</p>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-surface-hover text-foreground hover:bg-border transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-danger text-white hover:bg-danger-hover transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
