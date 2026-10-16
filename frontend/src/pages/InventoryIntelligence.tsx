import React, { useState } from 'react';
import { InventoryBatch, KitchenProfile } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Boxes,
  AlertTriangle,
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  Layers,
  Ban,
  Clock,
  Sparkles
} from 'lucide-react';

interface InventoryIntelligenceProps {
  kitchen: KitchenProfile;
  inventory: InventoryBatch[];
}

export const InventoryIntelligence: React.FC<InventoryIntelligenceProps> = ({
  kitchen,
  inventory
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredBatches = inventory.filter((b) => {
    const matchesSearch =
      b.ingredient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.batch_code.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterCategory === 'at_risk') return b.eligibility_status === 'at_risk';
    if (filterCategory === 'quarantined')
      return b.storage_status === 'quarantined' || b.eligibility_status === 'ineligible';
    if (filterCategory === 'eligible') return b.eligibility_status === 'eligible';

    return true;
  });

  const atRiskCount = inventory.filter((b) => b.eligibility_status === 'at_risk').length;
  const quarantinedCount = inventory.filter(
    (b) => b.storage_status === 'quarantined' || b.eligibility_status === 'ineligible'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-ivory rounded-2xl p-6 border border-ink-border/60 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-ink">Inventory Intelligence & FEFO Batches</h2>
            <p className="text-xs sm:text-sm text-ink-muted">
              Live batch-level tracking with food safety quarantine enforcement and shelf-life prioritization.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl font-medium">
              {atRiskCount} Batch Approaching Expiry
            </span>
            <span className="text-xs bg-terracotta-bg text-terracotta-dark border border-terracotta/40 px-3 py-1.5 rounded-xl font-medium">
              {quarantinedCount} Quarantined
            </span>
          </div>
        </div>
      </div>

      {/* Safety Quarantine Protocol Banner */}
      <div className="p-4 rounded-xl bg-forest-900 text-ivory border border-forest-800 flex items-start gap-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-forest-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm block">Strict Food Safety Protocol Active</span>
          <p className="text-forest-100/80 leading-relaxed">
            STILLGOOD never allocates spoiled, recalled, temperature-abused, or quarantined inventory.
            Eligible-stock-first algorithms deploy FEFO (First Expired First Out) while isolating flagged batches.
          </p>
        </div>
      </div>

      {/* Controls: Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search ingredient or lot code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-ink-border rounded-xl text-xs text-ink focus:outline-none focus:ring-1 focus:ring-forest-600"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          {['all', 'at_risk', 'eligible', 'quarantined'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-forest-800 text-ivory shadow-sm'
                  : 'bg-ivory text-ink-muted hover:text-ink hover:bg-ivory-cream border border-ink-border/50'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Batches Table */}
      <div className="bg-ivory rounded-2xl border border-ink-border/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory-cream border-b border-ink-border/60 text-ink-muted text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Ingredient</th>
                <th className="py-3 px-3">Batch Code</th>
                <th className="py-3 px-3">Received</th>
                <th className="py-3 px-3">Recorded Expiry</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">In Stock</th>
                <th className="py-3 px-3 text-right">Unit Cost</th>
                <th className="py-3 px-4">Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-border/40 font-sans">
              {filteredBatches.map((b) => {
                const isQuarantined =
                  b.storage_status === 'quarantined' || b.eligibility_status === 'ineligible';
                const isAtRisk = b.eligibility_status === 'at_risk';

                return (
                  <tr
                    key={b.id}
                    className={`hover:bg-forest-50/50 transition ${
                      isQuarantined ? 'bg-terracotta-bg/30' : isAtRisk ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-ink">
                      <div className="flex items-center gap-2">
                        {isQuarantined && <Ban className="w-3.5 h-3.5 text-terracotta" />}
                        {isAtRisk && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                        <span>{b.ingredient_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-ink-muted">{b.batch_code}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-ink-muted">{b.received_date}</td>
                    <td className="py-3 px-3 font-mono text-[11px] font-medium text-ink">
                      {b.expiry_date}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={b.eligibility_status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-ink">
                      {b.remaining_qty} {b.unit}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-ink-muted">
                      ${b.unit_cost.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-ink-muted text-[11px] max-w-xs truncate">
                      {b.notes || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
