import React, { useState } from 'react';
import { ActualOutcomeLog, KitchenProfile } from '../types';
import { recordOutcome } from '../services/api';
import {
  ClipboardCheck,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  TrendingDown,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface ActualOutcomesProps {
  kitchen: KitchenProfile;
  outcomes: ActualOutcomeLog[];
  onOutcomeLogged: (newLog: ActualOutcomeLog) => void;
}

export const ActualOutcomes: React.FC<ActualOutcomesProps> = ({
  kitchen,
  outcomes,
  onOutcomeLogged
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [serviceDate, setServiceDate] = useState('2026-10-16');
  const [servicePeriod, setServicePeriod] = useState('Lunch');
  const [mealsPlanned, setMealsPlanned] = useState(350);
  const [mealsPrepared, setMealsPrepared] = useState(350);
  const [mealsServed, setMealsServed] = useState(342);
  const [unservedPortions, setUnservedPortions] = useState(8);
  const [discardedKg, setDiscardedKg] = useState(3.2);
  const [spoilageKg, setSpoilageKg] = useState(0.4);
  const [prepWasteKg, setPrepWasteKg] = useState(1.6);
  const [plateWasteKg, setPlateWasteKg] = useState(1.2);
  const [stockouts, setStockouts] = useState(0);
  const [notes, setNotes] = useState('Service executed with STILLGOOD Plan C. Zero paneer shortages, spinach fully utilized.');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newLog: Partial<ActualOutcomeLog> = {
        id: `log_${Date.now()}`,
        kitchen_id: kitchen.id,
        service_date: serviceDate,
        service_period: servicePeriod,
        meals_planned: mealsPlanned,
        meals_prepared: mealsPrepared,
        meals_served: mealsServed,
        unserved_portions: unservedPortions,
        discarded_weight_kg: discardedKg,
        ingredient_spoilage_kg: spoilageKg,
        prep_waste_kg: prepWasteKg,
        plate_waste_kg: plateWasteKg,
        stockouts_count: stockouts,
        notes: notes,
        is_sample: false
      };
      const res = await recordOutcome(newLog);
      onOutcomeLogged(res);
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-ivory rounded-2xl p-6 border border-ink-border/60 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-ink">Actual Service Outcomes & Waste Log</h2>
            <p className="text-xs sm:text-sm text-ink-muted">
              Physical scale weigh-ins and post-service audits. Strictly separated into preparation waste, plate waste, and spoilage.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-forest-800 hover:bg-forest-900 text-ivory text-xs font-semibold rounded-xl shadow transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-forest-500" />
            <span>Log Service Outcome</span>
          </button>
        </div>
      </div>

      {/* Add Outcome Form Modal / Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-ivory rounded-2xl border-2 border-forest-600/40 p-6 shadow-md space-y-4 text-xs font-sans"
        >
          <div className="flex items-center justify-between border-b border-ink-border/40 pb-3">
            <h3 className="font-serif text-base font-bold text-ink">Record Physical Post-Service Audit</h3>
            <span className="text-[10px] bg-forest-50 text-forest-800 border border-forest-600/30 px-2 py-0.5 rounded font-mono">
              Live Entry
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-ink-muted uppercase mb-1">
                Service Date
              </label>
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white text-ink text-xs focus:ring-1 focus:ring-forest-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-ink-muted uppercase mb-1">
                Meals Planned
              </label>
              <input
                type="number"
                value={mealsPlanned}
                onChange={(e) => setMealsPlanned(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg bg-white text-ink text-xs focus:ring-1 focus:ring-forest-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-ink-muted uppercase mb-1">
                Meals Prepared
              </label>
              <input
                type="number"
                value={mealsPrepared}
                onChange={(e) => setMealsPrepared(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg bg-white text-ink text-xs focus:ring-1 focus:ring-forest-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-ink-muted uppercase mb-1">
                Meals Served
              </label>
              <input
                type="number"
                value={mealsServed}
                onChange={(e) => setMealsServed(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg bg-white text-ink text-xs focus:ring-1 focus:ring-forest-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-ink-muted uppercase mb-1">
                Total Discarded (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={discardedKg}
                onChange={(e) => setDiscardedKg(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg bg-white text-ink text-xs focus:ring-1 focus:ring-forest-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-ink-muted uppercase mb-1">
                Prep Waste (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={prepWasteKg}
                onChange={(e) => setPrepWasteKg(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg bg-white text-ink text-xs focus:ring-1 focus:ring-forest-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-ink-muted uppercase mb-1">
                Plate Waste (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={plateWasteKg}
                onChange={(e) => setPlateWasteKg(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg bg-white text-ink text-xs focus:ring-1 focus:ring-forest-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-ink-muted uppercase mb-1">
                Ingredient Spoilage (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={spoilageKg}
                onChange={(e) => setSpoilageKg(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg bg-white text-ink text-xs focus:ring-1 focus:ring-forest-600"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-[11px] font-semibold text-ink-muted uppercase mb-1">
              Service Log Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white text-ink text-xs focus:ring-1 focus:ring-forest-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border rounded-lg text-ink-muted hover:text-ink text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-forest-800 hover:bg-forest-900 text-ivory text-xs font-semibold rounded-lg shadow transition"
            >
              {isSubmitting ? 'Saving...' : 'Save Actual Outcome'}
            </button>
          </div>
        </form>
      )}

      {/* Historical Outcome Log Table */}
      <div className="bg-ivory rounded-2xl border border-ink-border/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory-cream border-b border-ink-border/60 text-ink-muted text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Service Date</th>
                <th className="py-3 px-3">Period</th>
                <th className="py-3 px-3 text-right">Planned</th>
                <th className="py-3 px-3 text-right">Served</th>
                <th className="py-3 px-3 text-right">Unserved</th>
                <th className="py-3 px-3 text-right">Discarded (kg)</th>
                <th className="py-3 px-3 text-right">Waste / Meal</th>
                <th className="py-3 px-4">Log Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-border/40">
              {outcomes.map((log) => {
                const wastePerMeal = (log.discarded_weight_kg / Math.max(1, log.meals_served)).toFixed(3);
                return (
                  <tr key={log.id} className="hover:bg-forest-50/50 transition">
                    <td className="py-3 px-4 font-mono font-medium text-ink">{log.service_date}</td>
                    <td className="py-3 px-3 text-ink-muted">{log.service_period}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">{log.meals_planned}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-forest-800">
                      {log.meals_served}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-ink-muted">
                      {log.unserved_portions}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-ink">
                      {log.discarded_weight_kg.toFixed(1)} kg
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-forest-700">
                      {wastePerMeal} kg
                    </td>
                    <td className="py-3 px-4">
                      {log.is_sample ? (
                        <span className="text-[10px] font-mono text-ink-muted bg-ivory-cream border px-1.5 py-0.5 rounded">
                          DEMO SEED
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-forest-800 bg-forest-50 border border-forest-600/30 px-1.5 py-0.5 rounded font-bold">
                          VERIFIED
                        </span>
                      )}
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
