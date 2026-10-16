import React, { useState } from 'react';
import { KitchenProfile, Recipe, Supplier, InventoryBatch } from '../types';
import {
  Settings,
  Building2,
  CookingPot,
  Truck,
  Boxes,
  RefreshCw,
  Plus,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

interface SettingsDataProps {
  kitchen: KitchenProfile;
  kitchens: KitchenProfile[];
  recipes: Recipe[];
  suppliers: Supplier[];
  onSelectKitchen: (k: KitchenProfile) => void;
  onResetDemo: () => void;
}

export const SettingsData: React.FC<SettingsDataProps> = ({
  kitchen,
  kitchens,
  recipes,
  suppliers,
  onSelectKitchen,
  onResetDemo
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profiles' | 'recipes' | 'suppliers' | 'import'>('profiles');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-ivory rounded-2xl p-6 border border-ink-border/60 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-ink">Kitchen Setup & Master Data Management</h2>
            <p className="text-xs sm:text-sm text-ink-muted">
              Configure profile archetypes, approved recipe versions, approved supplier rosters, and reset demo data.
            </p>
          </div>
          <button
            onClick={onResetDemo}
            className="px-4 py-2 border border-terracotta/40 text-terracotta-dark hover:bg-terracotta-bg text-xs font-semibold rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo to Initial State</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-ink-border/50 pb-2">
        {[
          { key: 'profiles', label: '8 Kitchen Archetypes', icon: Building2 },
          { key: 'recipes', label: 'Approved Recipes', icon: CookingPot },
          { key: 'suppliers', label: 'Suppliers & Cutoffs', icon: Truck },
          { key: 'import', label: 'Data Import & Export', icon: FileSpreadsheet },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveSubTab(key as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition ${
              activeSubTab === key
                ? 'bg-forest-800 text-ivory shadow-sm'
                : 'text-ink-muted hover:text-ink hover:bg-ivory'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Sub Tab 1: 8 Kitchen Archetypes */}
      {activeSubTab === 'profiles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kitchens.map((k) => (
            <div
              key={k.id}
              className={`p-5 rounded-2xl border transition text-xs space-y-3 ${
                kitchen.id === k.id
                  ? 'bg-forest-50/70 border-forest-600 shadow-sm ring-1 ring-forest-600/20'
                  : 'bg-ivory border-ink-border/70 hover:border-forest-600/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-ink">{k.name}</h3>
                  <p className="text-[11px] text-ink-muted">{k.tagline}</p>
                </div>
                <span className="text-[10px] font-mono uppercase bg-ivory-cream border px-2 py-0.5 rounded">
                  {k.type.replace('_', ' ')}
                </span>
              </div>

              <p className="text-ink text-xs leading-relaxed">{k.description}</p>

              <div className="grid grid-cols-2 gap-2 text-[11px] py-2 border-t border-ink-border/40 text-ink-muted">
                <div>
                  <span>Capacity: </span>
                  <span className="font-mono font-bold text-ink">{k.capacity_meals_per_service} meals</span>
                </div>
                <div>
                  <span>Dietary Strictness: </span>
                  <span className="font-semibold text-ink">{k.dietary_strictness}</span>
                </div>
                <div className="col-span-2">
                  <span>Demand Driver: </span>
                  <span className="font-medium text-forest-800">{k.primary_demand_driver}</span>
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                {kitchen.id === k.id ? (
                  <span className="text-xs font-bold text-forest-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Active Kitchen
                  </span>
                ) : (
                  <button
                    onClick={() => onSelectKitchen(k)}
                    className="px-3.5 py-1.5 bg-forest-800 hover:bg-forest-900 text-ivory text-xs font-semibold rounded-lg shadow transition"
                  >
                    Select Kitchen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sub Tab 2: Approved Recipes */}
      {activeSubTab === 'recipes' && (
        <div className="bg-ivory rounded-2xl border border-ink-border/60 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory-cream border-b border-ink-border/60 text-ink-muted text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Recipe</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Version</th>
                <th className="py-3 px-3">Portion Size</th>
                <th className="py-3 px-3">Dietary Tags</th>
                <th className="py-3 px-3 text-right">Cost / Portion</th>
                <th className="py-3 px-4">Allergens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-border/40 font-sans">
              {recipes.map((r) => (
                <tr key={r.id} className="hover:bg-forest-50/50 transition">
                  <td className="py-3 px-4 font-semibold text-ink">{r.name}</td>
                  <td className="py-3 px-3 uppercase text-[10px] text-ink-muted">{r.category}</td>
                  <td className="py-3 px-3 font-mono">v{r.version}</td>
                  <td className="py-3 px-3 font-mono">{r.portion_size_grams}g</td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {r.dietary_tags.map((t) => (
                        <span key={t} className="text-[10px] bg-forest-50 text-forest-800 px-1 rounded uppercase">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                    ${r.cost_per_portion.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-ink-muted">
                    {r.allergens.length > 0 ? r.allergens.join(', ') : 'None'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sub Tab 3: Suppliers */}
      {activeSubTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map((s) => (
            <div key={s.id} className="p-5 rounded-2xl border bg-ivory border-ink-border/70 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-ink">{s.name}</h3>
                <span
                  className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                    s.status === 'delayed'
                      ? 'bg-terracotta-bg text-terracotta-dark border border-terracotta/40'
                      : 'bg-forest-50 text-forest-800 border border-forest-600/30'
                  }`}
                >
                  {s.status}
                </span>
              </div>
              <p className="text-ink-muted">{s.contact}</p>

              <div className="grid grid-cols-2 gap-2 text-[11px] py-2 border-t border-ink-border/40">
                <div>
                  <span className="text-ink-muted">Order Cutoff: </span>
                  <span className="font-mono font-bold text-ink">{s.cutoff_time}</span>
                </div>
                <div>
                  <span className="text-ink-muted">Lead Time: </span>
                  <span className="font-mono font-bold text-ink">{s.lead_time_hours} hours</span>
                </div>
              </div>

              {s.delay_notes && (
                <div className="p-2.5 rounded-lg bg-terracotta-bg text-terracotta-dark text-[11px]">
                  <strong>Incident Alert: </strong>
                  {s.delay_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sub Tab 4: Import / Export */}
      {activeSubTab === 'import' && (
        <div className="bg-ivory rounded-2xl border border-ink-border/60 p-6 shadow-sm space-y-4 text-xs">
          <h3 className="font-serif text-lg font-bold text-ink">
            CSV & Cloud Storage Data Management
          </h3>
          <p className="text-ink-muted leading-relaxed">
            Export kitchen inventory logs, recipe ingredient standards, or forecast records in CSV format.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => alert('Exporting kitchen records as CSV...')}
              className="px-4 py-2 bg-ivory-cream border border-ink-border hover:bg-forest-50 text-ink text-xs font-semibold rounded-xl transition"
            >
              Export Inventory CSV
            </button>
            <button
              onClick={() => alert('Exporting recipe specs as CSV...')}
              className="px-4 py-2 bg-ivory-cream border border-ink-border hover:bg-forest-50 text-ink text-xs font-semibold rounded-xl transition"
            >
              Export Recipes CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
