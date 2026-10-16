import React from 'react';
import { KitchenProfile, PlanEvaluation } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Users,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
  Clock,
  Truck,
  Sparkles,
  ShieldCheck,
  FileText
} from 'lucide-react';

interface LivingDashboardProps {
  kitchen: KitchenProfile;
  onNavigateToAssistant: () => void;
  onNavigateToComparison: () => void;
  onNavigateToInventory: () => void;
  onNavigateToImpact: () => void;
  onViewReceipt: () => void;
  activePlan: PlanEvaluation | null;
}

export const LivingDashboard: React.FC<LivingDashboardProps> = ({
  kitchen,
  onNavigateToAssistant,
  onNavigateToComparison,
  onNavigateToInventory,
  onNavigateToImpact,
  onViewReceipt,
  activePlan
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner: Living Kitchen Status */}
      <div className="bg-forest-900 text-ivory rounded-2xl p-6 sm:p-8 shadow-sm border border-forest-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-forest-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-forest-500 animate-ping" />
              <span className="text-xs font-semibold tracking-wider uppercase text-forest-100/80">
                Today's Live Shift Operations
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-ivory">
              {kitchen.name}
            </h1>
            <p className="text-sm text-forest-100/80 leading-relaxed">
              {kitchen.description} Current service window: <span className="text-ivory font-medium">{kitchen.default_service_period}</span>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onNavigateToAssistant}
              className="px-5 py-3 bg-terracotta hover:bg-terracotta-dark text-ivory text-sm font-semibold rounded-xl shadow transition flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Fix My Kitchen Plan</span>
            </button>
            {activePlan && (
              <button
                onClick={onViewReceipt}
                className="px-4 py-3 bg-forest-800 hover:bg-forest-700 text-ivory text-sm font-medium rounded-xl border border-forest-700 transition flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4 text-forest-500" />
                <span>View Evidence Receipt</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5 Meaningful Metrics (Section 4.B) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Expected Meals */}
        <div className="p-4 rounded-xl bg-ivory border border-ink-border/60 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-ink-muted text-xs">
            <span>Expected Meals</span>
            <Users className="w-4 h-4 text-forest-700" />
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-ink tabular-nums">
            500
          </div>
          <div className="text-[11px] text-terracotta flex items-center gap-1">
            <span>Shift alert: -150 expected</span>
          </div>
        </div>

        {/* Metric 2: Planned Meals */}
        <div className="p-4 rounded-xl bg-ivory border border-ink-border/60 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-ink-muted text-xs">
            <span>Planned Batches</span>
            <Clock className="w-4 h-4 text-forest-700" />
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-ink tabular-nums">
            {activePlan ? activePlan.total_portions : '500'}
          </div>
          <div className="text-[11px] text-forest-700 font-medium">
            {activePlan ? 'Optimized for 350' : 'Baseline Schedule'}
          </div>
        </div>

        {/* Metric 3: At-Risk Eligible Inventory */}
        <div
          onClick={onNavigateToInventory}
          className="p-4 rounded-xl bg-amber-50/70 border border-amber-300 shadow-sm space-y-1 cursor-pointer hover:bg-amber-50 transition"
        >
          <div className="flex items-center justify-between text-amber-900 text-xs font-medium">
            <span>At-Risk Inventory</span>
            <Boxes className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-amber-900 tabular-nums">
            24.0 kg
          </div>
          <div className="text-[11px] text-amber-800">
            Fresh Baby Spinach (Expires in 28h)
          </div>
        </div>

        {/* Metric 4: Open Decisions */}
        <div className="p-4 rounded-xl bg-terracotta-bg/70 border border-terracotta/40 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-terracotta-dark text-xs font-medium">
            <span>Pending Decisions</span>
            <AlertTriangle className="w-4 h-4 text-terracotta" />
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-terracotta-dark tabular-nums">
            1 Action
          </div>
          <div className="text-[11px] text-terracotta font-medium">
            Paneer supplier delayed past lunch
          </div>
        </div>

        {/* Metric 5: Measured Waste Performance */}
        <div
          onClick={onNavigateToImpact}
          className="p-4 rounded-xl bg-ivory border border-ink-border/60 shadow-sm space-y-1 cursor-pointer hover:bg-forest-50/50 transition"
        >
          <div className="flex items-center justify-between text-ink-muted text-xs">
            <span>Waste / Meal</span>
            <TrendingDown className="w-4 h-4 text-forest-600" />
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-forest-800 tabular-nums">
            0.010 kg
          </div>
          <div className="text-[11px] text-forest-700 font-medium">
            -34% vs peer benchmark
          </div>
        </div>
      </div>

      {/* Main Grid: Operational Attention Items & Quick Simulator Entry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Items Needing Attention */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-ivory rounded-2xl border border-ink-border/60 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
                <span>Active Kitchen Disruptions</span>
                <span className="text-xs bg-terracotta-bg text-terracotta font-mono font-bold px-2 py-0.5 rounded-full border border-terracotta/30">
                  Needs Decision
                </span>
              </h2>
              <button
                onClick={onNavigateToAssistant}
                className="text-xs font-semibold text-forest-800 hover:text-forest-600 flex items-center gap-1 transition"
              >
                <span>Launch Assistant</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Alert Card 1: Attendance Drop */}
            <div className="p-4 rounded-xl bg-ivory-cream border border-ink-border/70 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-terracotta-bg text-terracotta flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink text-sm">Attendance Revised: 500 &rarr; 350 Meals</span>
                  <span className="text-[10px] font-mono text-ink-muted">Reported 20m ago</span>
                </div>
                <p className="text-ink-muted">
                  Badge attendance sync and remote work shift reduce anticipated covers by 30%. Retaining the 500-meal prep plan will create ~150 surplus unserved meals.
                </p>
              </div>
            </div>

            {/* Alert Card 2: Supplier Disruption */}
            <div className="p-4 rounded-xl bg-ivory-cream border border-ink-border/70 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-terracotta-bg text-terracotta flex items-center justify-center shrink-0 mt-0.5">
                <Truck className="w-4 h-4" />
              </div>
              <div className="flex-1 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink text-sm">Supplier Delay: Fresh Dairy Farms Co.</span>
                  <StatusBadge status="delayed" size="sm" />
                </div>
                <p className="text-ink-muted">
                  Refrigerated delivery vehicle delayed on highway. Cannot deliver 30 kg Malai Paneer before 2:30 PM (lunch finishes at 2:00 PM). Existing stock has only 5.0 kg remaining.
                </p>
              </div>
            </div>

            {/* Alert Card 3: Perishable Produce */}
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <Boxes className="w-4 h-4" />
              </div>
              <div className="flex-1 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink text-sm">At-Risk Batch: 24 kg Fresh Baby Spinach</span>
                  <StatusBadge status="at_risk" size="sm" />
                </div>
                <p className="text-amber-900">
                  Batch <span className="font-mono">LOT-SPN-2026-1014</span> reaches 48-hour shelf-life limit tomorrow. Eligible for cooking immediately in Palak Dal or Saag.
                </p>
              </div>
            </div>

            {/* CTA Box */}
            <div className="p-4 rounded-xl bg-forest-50 border border-forest-600/30 flex items-center justify-between">
              <div className="text-xs text-forest-800">
                <strong>STILLGOOD Rescue Plan Ready:</strong> Replaces unavailable paneer with in-stock Chana Masala, rescues 14 kg at-risk spinach, and satisfies 120+ vegetarian meals.
              </div>
              <button
                onClick={onNavigateToComparison}
                className="px-4 py-2 bg-forest-800 hover:bg-forest-900 text-ivory text-xs font-semibold rounded-lg shadow transition whitespace-nowrap ml-4"
              >
                Review Plan C
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Service Timeline & Kitchen Profile Facts */}
        <div className="space-y-4">
          {/* Quick Schedule Card */}
          <div className="bg-ivory rounded-2xl border border-ink-border/60 p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
              <Clock className="w-4 h-4 text-forest-700" />
              <span>Service Schedule</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-ink-border/40">
                <span className="text-ink-muted">Prep Shift Start</span>
                <span className="font-mono font-medium">08:00 AM</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-ink-border/40">
                <span className="text-ink-muted">Supplier Cutoff</span>
                <span className="font-mono font-medium text-terracotta">08:30 AM (Passed)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-ink-border/40">
                <span className="text-ink-muted">Lunch Service</span>
                <span className="font-mono font-medium">11:30 AM – 02:00 PM</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-ink-border/40">
                <span className="text-ink-muted">Capacity Ceiling</span>
                <span className="font-mono font-medium">{kitchen.capacity_meals_per_service} meals</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-ink-muted">Dietary Policy</span>
                <span className="font-semibold text-forest-800">
                  {kitchen.dietary_strictness === 'clinical_strict' ? 'Clinical Strict' : 'Multi-Dietary Standard'}
                </span>
              </div>
            </div>
          </div>

          {/* Food Safety Compliance Guarantee Card */}
          <div className="bg-forest-900 text-ivory rounded-2xl p-6 shadow-sm border border-forest-800 space-y-3">
            <div className="flex items-center gap-2 text-forest-500">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="font-serif text-base font-bold text-ivory">Zero Unsafe Food Protocol</h4>
            </div>
            <p className="text-xs text-forest-100/80 leading-relaxed">
              STILLGOOD strictly isolates quarantined and expired batches. Milk batch <span className="font-mono text-terracotta-light">LOT-BAD-MILK-99</span> remains quarantined and excluded from all planning alternatives.
            </p>
            <div className="text-[11px] text-forest-100/60 font-mono">
              Audit Gate: Human chef approval mandatory.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
