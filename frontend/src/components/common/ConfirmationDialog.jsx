import React, { useEffect, useRef } from 'react';
import { Button } from './Button';
import { Textarea } from './Textarea';
import { AlertTriangle, X } from 'lucide-react';

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'primary'
  loading = false,
  requireReason = false,
  reasonValue = '',
  onReasonChange,
  reasonPlaceholder = 'Please explain the reason...',
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-psyco-deepNavy/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-md p-6 bg-psyco-darkNavy border border-psyco-steel/80 rounded-2xl shadow-2xl space-y-4 animate-scale-up"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1 rounded-lg text-psyco-coolGrey hover:text-psyco-softGrey hover:bg-psyco-slate transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-xl bg-red-950/40 text-red-300 shrink-0 border border-red-700/50">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 id="confirmation-dialog-title" className="text-lg font-semibold text-psyco-softGrey">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-psyco-coolGrey leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Reason Input (Optional) */}
        {requireReason && (
          <div className="pt-2">
            <Textarea
              label="Reason for Action"
              required
              rows={3}
              placeholder={reasonPlaceholder}
              value={reasonValue}
              onChange={(e) => onReasonChange && onReasonChange(e.target.value)}
              disabled={loading}
            />
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-psyco-steel/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            size="sm"
            onClick={onConfirm}
            loading={loading}
            disabled={loading || (requireReason && (!reasonValue || reasonValue.trim().length < 3))}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationDialog;
