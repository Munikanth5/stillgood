import React, { useState } from 'react';
import { PlanEvaluation } from '../types';
import { ShieldCheck, AlertTriangle, X, CheckCircle2, User } from 'lucide-react';

interface ApprovalModalProps {
  plan: PlanEvaluation | null;
  kitchenId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (approverName: string, action: 'APPROVE' | 'REJECT', notes: string) => Promise<void>;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  plan,
  kitchenId,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [approverName, setApproverName] = useState('Executive Kitchen Manager');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !plan) return null;

  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    setIsSubmitting(true);
    try {
      await onSubmit(approverName, action, notes);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-ivory rounded-2xl border border-ink-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-forest-900 text-ivory px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-forest-500" />
            <h3 className="font-serif text-lg font-bold">Kitchen Manager Plan Approval</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-forest-800 text-forest-100/70 hover:text-ivory rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs font-sans">
          <div className="p-3.5 rounded-xl bg-ivory-cream border border-ink-border/50 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted">
              Target Plan
            </span>
            <div className="font-semibold text-ink text-sm">{plan.title}</div>
            <div className="text-ink-muted text-xs">{plan.summary_explanation}</div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-forest-50 border border-forest-600/30 rounded-lg">
              <span className="text-ink-muted block text-[10px]">Planned Meals</span>
              <span className="font-serif font-bold text-forest-800 text-base">{plan.total_portions}</span>
            </div>
            <div className="p-2.5 bg-forest-50 border border-forest-600/30 rounded-lg">
              <span className="text-ink-muted block text-[10px]">Estimated Purchasing</span>
              <span className="font-serif font-bold text-forest-800 text-base">${plan.total_purchase_cost.toFixed(2)}</span>
            </div>
          </div>

          {/* Warning notice */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2 text-[11px]">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Audit Rule:</strong> Approving this plan records an immutable operational decision.
              No automated supplier purchasing is executed without human chef procurement sign-off.
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-forest-700" />
                Approver Signature / Title
              </label>
              <input
                type="text"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-ink-border bg-white text-ink text-xs focus:outline-none focus:ring-1 focus:ring-forest-600"
                placeholder="e.g. Head Chef Maria Lopez"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-ink uppercase tracking-wider mb-1">
                Operational Notes / Shift Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-ink-border bg-white text-ink text-xs focus:outline-none focus:ring-1 focus:ring-forest-600"
                placeholder="e.g. Confirmed with sous-chef: prep Chana Masala at 9:00 AM; spinach sorted."
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-ivory-cream px-6 py-4 border-t border-ink-border flex items-center justify-end gap-2.5">
          <button
            onClick={() => handleAction('REJECT')}
            disabled={isSubmitting}
            className="px-4 py-2 border border-terracotta/50 text-terracotta-dark hover:bg-terracotta-bg text-xs font-semibold rounded-lg transition"
          >
            Reject Plan
          </button>
          <button
            onClick={() => handleAction('APPROVE')}
            disabled={isSubmitting}
            className="px-5 py-2 bg-forest-800 hover:bg-forest-900 text-ivory text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-forest-500" />
            <span>{isSubmitting ? 'Recording...' : 'Authorize & Commit Plan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
