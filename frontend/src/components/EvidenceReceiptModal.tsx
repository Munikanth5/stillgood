import React from 'react';
import { EvidenceReceipt } from '../types';
import { StatusBadge } from './StatusBadge';
import {
  X,
  Download,
  Printer,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Boxes,
  CookingPot,
  TrendingUp,
  Ban
} from 'lucide-react';

interface EvidenceReceiptModalProps {
  receipt: EvidenceReceipt | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenApproval: () => void;
}

export const EvidenceReceiptModal: React.FC<EvidenceReceiptModalProps> = ({
  receipt,
  isOpen,
  onClose,
  onOpenApproval
}) => {
  if (!isOpen || !receipt) return null;

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(receipt, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${receipt.receipt_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#FBF9F4] rounded-2xl border border-ink-border shadow-2xl overflow-hidden my-8">
        {/* Receipt Header Banner */}
        <div className="bg-forest-900 text-ivory px-6 py-5 flex items-center justify-between border-b border-forest-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-forest-800 border border-forest-700 flex items-center justify-center text-forest-500">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl font-bold tracking-tight text-ivory">
                  Official Kitchen Evidence Receipt
                </h3>
                <span className="text-[10px] font-mono uppercase bg-forest-800 px-2 py-0.5 rounded text-forest-100 border border-forest-700">
                  Audit Snapshot
                </span>
              </div>
              <p className="text-xs text-forest-100/70 font-mono mt-0.5">
                {receipt.receipt_id} • Stamped {receipt.timestamp}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-forest-800 hover:bg-forest-700 text-ivory text-xs rounded-lg transition"
              title="Download Full Traceability JSON"
            >
              <Download className="w-3.5 h-3.5 text-forest-500" />
              <span className="hidden sm:inline">JSON</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-forest-800 hover:bg-forest-700 text-ivory text-xs rounded-lg transition"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5 text-forest-500" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-forest-800 text-forest-100/70 hover:text-ivory rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Receipt Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto font-sans">
          {/* Top metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-ivory-cream border border-ink-border/50 text-xs">
            <div>
              <span className="text-ink-muted uppercase tracking-wider block text-[10px]">Kitchen Facility</span>
              <span className="font-semibold text-ink text-sm">{receipt.kitchen_name}</span>
            </div>
            <div>
              <span className="text-ink-muted uppercase tracking-wider block text-[10px]">Forecast Driver</span>
              <span className="font-semibold text-ink text-sm">{receipt.forecast_method}</span>
            </div>
            <div>
              <span className="text-ink-muted uppercase tracking-wider block text-[10px]">Modeled Surplus Avoided</span>
              <span className="font-serif font-bold text-forest-700 text-base tabular-nums">
                {receipt.modeled_surplus_avoidance_meals} meals
              </span>
            </div>
            <div>
              <span className="text-ink-muted uppercase tracking-wider block text-[10px]">Modeled Spend Reduction</span>
              <span className="font-serif font-bold text-forest-700 text-base tabular-nums">
                ${receipt.modeled_purchase_savings_cost.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Section 1: Disruption Summary & What Changed */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-terracotta" />
              1. What Changed (Operational Disruption Log)
            </h4>
            <div className="p-4 rounded-xl bg-terracotta-bg/40 border border-terracotta/30 text-sm text-ink space-y-2">
              <p className="font-medium text-terracotta-dark">{receipt.disruption_summary}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-terracotta/20">
                <div>
                  <span className="text-ink-muted">Original Baseline: </span>
                  <span className="font-semibold">{receipt.original_assumptions.expected_meals} expected meals</span>
                </div>
                <div>
                  <span className="text-ink-muted">Revised Target: </span>
                  <span className="font-semibold">{receipt.revised_assumptions.expected_meals} expected meals</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Approved Recipes & Version Control */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-2">
              <CookingPot className="w-4 h-4 text-forest-700" />
              2. Approved Recipes & Version Control
            </h4>
            <div className="border border-ink-border/60 rounded-xl overflow-hidden bg-ivory">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-cream border-b border-ink-border/60 text-ink-muted text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Recipe Name</th>
                    <th className="py-2.5 px-2">Category</th>
                    <th className="py-2.5 px-2">Version</th>
                    <th className="py-2.5 px-2 text-right">Portions</th>
                    <th className="py-2.5 px-2 text-right">Unit Cost</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-border/40">
                  {receipt.recipes_evaluated.map((r) => (
                    <tr key={r.recipe_id} className="hover:bg-forest-50/50">
                      <td className="py-2 px-3 font-medium text-ink flex items-center gap-2">
                        {r.recipe_name}
                        {r.allergens && r.allergens.length > 0 && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded">
                            {r.allergens.join(', ')}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 uppercase text-[10px] text-ink-muted">{r.category}</td>
                      <td className="py-2 px-2 font-mono text-[11px]">v{r.version}</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums font-semibold">{r.portions_planned}</td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums">${r.cost_per_portion.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-medium">${r.total_cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Traceable FEFO Inventory Allocations */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-2">
              <Boxes className="w-4 h-4 text-forest-700" />
              3. Traceable Inventory Allocations (FEFO Batch Priority)
            </h4>
            <div className="border border-ink-border/60 rounded-xl overflow-hidden bg-ivory">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-cream border-b border-ink-border/60 text-ink-muted text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Ingredient</th>
                    <th className="py-2.5 px-2">Lot Code</th>
                    <th className="py-2.5 px-2">Expiry Date</th>
                    <th className="py-2.5 px-2">Priority Tier</th>
                    <th className="py-2.5 px-3 text-right">Allocated Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-border/40">
                  {receipt.inventory_batches_allocated.map((b, idx) => (
                    <tr key={idx} className="hover:bg-forest-50/50">
                      <td className="py-2 px-3 font-medium text-ink">{b.ingredient_name}</td>
                      <td className="py-2 px-2 font-mono text-[11px] text-ink-muted">{b.batch_code}</td>
                      <td className="py-2 px-2 font-mono text-[11px]">{b.expiry_date}</td>
                      <td className="py-2 px-2">
                        {b.was_at_risk ? (
                          <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-1.5 py-0.5 rounded uppercase">
                            Rescued (At-Risk)
                          </span>
                        ) : (
                          <span className="text-[10px] bg-forest-50 text-forest-800 border border-forest-600/30 px-1.5 py-0.5 rounded uppercase">
                            Optimal FEFO
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold">
                        {b.allocated_qty} {b.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Verified Constraints & Hard Operational Gates */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-forest-700" />
              4. Verified Constraints & Hard Operational Gates
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {receipt.constraints_verified.map((c, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                    c.passed
                      ? 'bg-forest-50/70 border-forest-600/30 text-ink'
                      : 'bg-terracotta-bg border-terracotta/40 text-terracotta-dark'
                  }`}
                >
                  <div className="mt-0.5">
                    {c.passed ? (
                      <ShieldCheck className="w-4 h-4 text-forest-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-terracotta" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{c.constraint_name}</div>
                    <div className="text-ink-muted mt-0.5">{c.message}</div>
                    <div className="text-[10px] font-mono mt-1 text-ink-subtle">
                      Target: {c.target_value} | Actual: {c.actual_value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Visibly Rejected Candidates */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-2">
              <Ban className="w-4 h-4 text-terracotta" />
              5. Visibly Rejected Alternatives (Integrity Audit)
            </h4>
            <div className="space-y-2">
              {receipt.rejected_alternatives.map((cand) => (
                <div
                  key={cand.candidate_id}
                  className="p-3.5 rounded-xl bg-terracotta-bg/60 border border-terracotta/40 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-terracotta-dark">{cand.title}</span>
                    <span className="text-[10px] bg-terracotta text-ivory font-bold px-2 py-0.5 rounded uppercase">
                      REJECTED BY CODE
                    </span>
                  </div>
                  {cand.rejection_reasons.map((r, rIdx) => (
                    <div key={rIdx} className="text-ink text-xs pl-2 border-l-2 border-terracotta">
                      {r}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Honest Uncertainty Disclosures */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-forest-700" />
              6. Honest Uncertainty Disclosures
            </h4>
            <div className="p-4 rounded-xl bg-ivory-cream border border-ink-border/50 text-xs space-y-1.5 text-ink-muted">
              {receipt.remaining_uncertainty.map((u, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-forest-700 font-bold">•</span>
                  <span>{u}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with Manager Approval Action */}
        <div className="bg-ivory-cream px-6 py-4 border-t border-ink-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-ink-muted flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-forest-600" />
            <span>Human kitchen manager authorization is strictly required before execution.</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-ink-muted hover:text-ink transition"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenApproval();
              }}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-forest-800 hover:bg-forest-900 text-ivory text-xs font-semibold rounded-lg shadow transition flex items-center justify-center gap-2"
            >
              <FileCheck className="w-4 h-4 text-forest-500" />
              <span>Proceed to Manager Approval</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
