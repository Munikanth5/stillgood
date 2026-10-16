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
  FileText,
  Utensils,
  CalendarCheck,
  Footprints
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
  const isRestaurant = kitchen.id === 'kitchen_restaurant_verde' || kitchen.type === 'restaurant_cafe';
  const expectedMeals = isRestaurant ? 70 : 350;
  const originalMeals = isRestaurant ? 120 : 500;
  const bookings = isRestaurant ? 70 : 350;
  const walkins = isRestaurant ? 35 : 18;

  return (
    <div className="space-y-6">
      {/* 4-Step Plain English Workflow Guide */}
      <div className="bg-ivory-cream rounded-2xl p-4 border border-ink-border/70 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-forest-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-forest-600" />
            Simple 4-Step Kitchen Decision Flow
          </span>
          <span className="text-[10px] text-ink-muted">Zero Jargon • Non-Technical Friendly</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-forest-50 border border-forest-600/30 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-forest-800 text-ivory flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
            <div>
              <span className="font-bold text-forest-900 block">Check Today</span>
              <span className="text-[10px] text-forest-700">See expected diners & fridge alerts</span>
            </div>
          </div>
          <button
            onClick={onNavigateToAssistant}
            className="p-2.5 rounded-xl bg-white hover:bg-forest-50/60 border border-ink-border text-left flex items-center gap-2 transition"
          >
            <span className="w-5 h-5 rounded-full bg-terracotta text-ivory flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
            <div>
              <span className="font-bold text-ink block">Tell Us What Changed</span>
              <span className="text-[10px] text-ink-muted">Type cancellations or late deliveries</span>
            </div>
          </button>
          <button
            onClick={onNavigateToComparison}
            className="p-2.5 rounded-xl bg-white hover:bg-forest-50/60 border border-ink-border text-left flex items-center gap-2 transition"
          >
            <span className="w-5 h-5 rounded-full bg-forest-800 text-ivory flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
            <div>
              <span className="font-bold text-ink block">Pick Better Plan</span>
              <span className="text-[10px] text-ink-muted">Compare 3 choices side-by-side</span>
            </div>
          </button>
          <div className="p-2.5 rounded-xl bg-white border border-ink-border flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-forest-800 text-ivory flex items-center justify-center font-bold text-[10px] shrink-0">4</span>
            <div>
              <span className="font-bold text-ink block">Authorize Cooks</span>
              <span className="text-[10px] text-ink-muted">1-click approve locked prep sheet</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Banner: Living Kitchen Status */}
      <div className="bg-forest-900 text-ivory rounded-2xl p-6 sm:p-8 shadow-sm border border-forest-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-forest-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-forest-500 animate-ping" />
              <span className="text-xs font-semibold tracking-wider uppercase text-forest-100/80">
                {isRestaurant ? "Restaurant & Café Live Shift Briefing" : "Today's Live Shift Operations"}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-ivory">
              {kitchen.name}
            </h1>
            <p className="text-sm text-forest-100/80 leading-relaxed">
              {kitchen.tagline} • Service: <span className="text-ivory font-medium">{kitchen.default_service_period}</span>.
              Menu Type: <span className="text-forest-100 font-semibold">{kitchen.menu_type || "Fixed Printed Menu"}</span>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onNavigateToAssistant}
              className="px-5 py-3 bg-terracotta hover:bg-terracotta-dark text-ivory text-sm font-semibold rounded-xl shadow transition flex items-center justify-center gap-2 transform hover:scale-[1.02]"
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
                <span>Evidence Receipt</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Special Widget for Restaurants: The Kitchen & Restaurant Palette Station Breakdown */}
      {isRestaurant && (
        <div className="p-5 rounded-2xl bg-ivory border-2 border-[#153D34]/30 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-forest-900 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-terracotta" />
              The Kitchen & Restaurant Palette: Station-Coded Diners
            </span>
            <span className="text-[10px] bg-forest-50 text-forest-800 border border-forest-600/30 px-2 py-0.5 rounded font-medium">
              Bistro Station Workflow
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Station 1: Front of House Dining Room Linen & Brass */}
            <div className="flex items-center gap-3 p-3.5 bg-[#FAF8F1] rounded-xl border-2 border-[#D4A373]/50 shadow-xs">
              <CalendarCheck className="w-8 h-8 text-[#9E642A] shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E642A] block">
                  🍷 Dining Room (Reservations)
                </span>
                <span className="font-serif text-2xl font-bold text-[#3B2816] tabular-nums">70 Guests</span>
                <span className="text-[10px] text-[#7A5023] block mt-0.5 font-medium">OpenTable confirmed on book</span>
              </div>
            </div>

            {/* Station 2: Chilled Walk-in Cooler Reserve */}
            <div className="flex items-center gap-3 p-3.5 bg-[#EDF5F1] rounded-xl border-2 border-[#23785D]/50 shadow-xs">
              <Footprints className="w-8 h-8 text-[#23785D] shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B5E4B] block">
                  ❄️ Cold Pantry (Walk-in Buffer)
                </span>
                <span className="font-serif text-2xl font-bold text-[#0E382C] tabular-nums">+35 Guests</span>
                <span className="text-[10px] text-[#1B5E4B] block mt-0.5 font-medium">Chilled raw mise-en-place</span>
              </div>
            </div>

            {/* Station 3: Sauté & Hot Line Station */}
            <div className="flex items-center gap-3 p-3.5 bg-[#13332A] text-ivory rounded-xl border-2 border-[#C57B55]/60 shadow-sm">
              <Utensils className="w-8 h-8 text-[#E08A5E] shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F1D1C2] block">
                  🔥 Sauté & Hot Line Target
                </span>
                <span className="font-serif text-2xl font-bold text-ivory tabular-nums">105 Total</span>
                <span className="text-[10px] text-forest-100/80 block mt-0.5 font-medium">Two-stage cook schedule active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5 Meaningful Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Expected Meals */}
        <div className="p-4 rounded-xl bg-ivory border border-ink-border/60 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-ink-muted text-xs">
            <span>Expected Diners</span>
            <Users className="w-4 h-4 text-forest-700" />
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-ink tabular-nums">
            {expectedMeals}
          </div>
          <div className="text-[11px] text-terracotta flex items-center gap-1 font-medium">
            <span>Down from {originalMeals} baseline</span>
          </div>
        </div>

        {/* Metric 2: Planned Meals */}
        <div className="p-4 rounded-xl bg-ivory border border-ink-border/60 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-ink-muted text-xs">
            <span>Planned Prep</span>
            <Clock className="w-4 h-4 text-forest-700" />
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-ink tabular-nums">
            {activePlan ? activePlan.total_portions : expectedMeals}
          </div>
          <div className="text-[11px] text-forest-700 font-medium">
            {activePlan ? 'Balanced by STILLGOOD' : 'Original Schedule'}
          </div>
        </div>

        {/* Metric 3: At-Risk Eligible Inventory */}
        <div
          onClick={onNavigateToInventory}
          className="p-4 rounded-xl bg-amber-50/70 border border-amber-300 shadow-sm space-y-1 cursor-pointer hover:bg-amber-50 transition"
        >
          <div className="flex items-center justify-between text-amber-900 text-xs font-medium">
            <span>At-Risk Food</span>
            <Boxes className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-amber-900 tabular-nums">
            {isRestaurant ? '8.0 kg' : '24.0 kg'}
          </div>
          <div className="text-[11px] text-amber-800">
            {isRestaurant ? 'Fresh Strawberries (Expires in 24h)' : 'Fresh Baby Spinach (Expires in 28h)'}
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
            {isRestaurant ? 'Adjust prep for rain cancellations' : 'Paneer supplier delayed past lunch'}
          </div>
        </div>

        {/* Metric 5: Measured Waste Performance */}
        <div
          onClick={onNavigateToImpact}
          className="p-4 rounded-xl bg-ivory border border-ink-border/60 shadow-sm space-y-1 cursor-pointer hover:bg-forest-50/50 transition"
        >
          <div className="flex items-center justify-between text-ink-muted text-xs">
            <span>Waste / Diner</span>
            <TrendingDown className="w-4 h-4 text-forest-600" />
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-forest-800 tabular-nums">
            0.010 kg
          </div>
          <div className="text-[11px] text-forest-700 font-medium">
            Under 10 grams per plate!
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
                <span>Active Shift Alerts</span>
                <span className="text-xs bg-terracotta-bg text-terracotta font-mono font-bold px-2 py-0.5 rounded-full border border-terracotta/30">
                  Needs Decision
                </span>
              </h2>
              <button
                onClick={onNavigateToAssistant}
                className="text-xs font-semibold text-forest-800 hover:text-forest-600 flex items-center gap-1 transition"
              >
                <span>Open Assistant</span>
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
                  <span className="font-bold text-ink text-sm">
                    {isRestaurant
                      ? 'Rainstorm: 40 Bookings Cancelled (120 → 70 Diners)'
                      : 'Attendance Shift: 500 → 350 Meals'}
                  </span>
                  <span className="text-[10px] font-mono text-ink-muted">Reported 20m ago</span>
                </div>
                <p className="text-ink-muted">
                  {isRestaurant
                    ? '40 guests called to cancel due to stormy weather. If cooks prep the original 120 Tuesday covers, 50 uneaten meals will end up in the dumpster.'
                    : 'Badge attendance sync and remote work shift reduce anticipated covers by 30%. Retaining the 500-meal prep plan will create ~150 surplus unserved meals.'}
                </p>
              </div>
            </div>

            {/* Alert Card 2: Perishable Produce */}
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <Boxes className="w-4 h-4" />
              </div>
              <div className="flex-1 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink text-sm">
                    {isRestaurant
                      ? 'At-Risk Cooler Batch: 8.0 kg Fresh Organic Strawberries'
                      : 'At-Risk Batch: 24 kg Fresh Baby Spinach'}
                  </span>
                  <StatusBadge status="at_risk" size="sm" />
                </div>
                <p className="text-amber-900">
                  {isRestaurant
                    ? 'Ripe organic strawberries will turn soft by tomorrow morning. Recommended: pair with on-hand heavy cream for tonight\'s Strawberries & Whipped Cream dessert special.'
                    : 'Batch LOT-SPN-2026-1014 reaches 48-hour shelf-life limit tomorrow. Optimal for cooking in Palak Dal or Saag.'}
                </p>
              </div>
            </div>

            {/* CTA Box */}
            <div className="p-4 rounded-xl bg-forest-50 border border-forest-600/30 flex items-center justify-between">
              <div className="text-xs text-forest-800">
                <strong>STILLGOOD Fixed-Menu Rescue Plan Ready:</strong> Scales savory prep to 70 diners, pushes the strawberry cream dessert special, and eliminates food waste.
              </div>
              <button
                onClick={onNavigateToComparison}
                className="px-4 py-2 bg-forest-800 hover:bg-forest-900 text-ivory text-xs font-semibold rounded-xl shadow transition whitespace-nowrap ml-4"
              >
                Review Choice C
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
              <span>Shift Operations</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-ink-border/40">
                <span className="text-ink-muted">Stage 1 Hot Prep</span>
                <span className="font-mono font-medium">{isRestaurant ? "4:00 PM" : "08:00 AM"}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-ink-border/40">
                <span className="text-ink-muted">Doors Open / Service</span>
                <span className="font-mono font-medium">{kitchen.default_service_period}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-ink-border/40">
                <span className="text-ink-muted">Menu Structure</span>
                <span className="font-semibold text-forest-800">{kitchen.menu_type || "Fixed Printed Menu"}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-ink-muted">Walk-in Buffer Policy</span>
                <span className="font-mono font-medium text-ink">+35% staging</span>
              </div>
            </div>
          </div>

          {/* Food Safety Guarantee Card */}
          <div className="bg-forest-900 text-ivory rounded-2xl p-6 shadow-sm border border-forest-800 space-y-3">
            <div className="flex items-center gap-2 text-forest-500">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="font-serif text-base font-bold text-ivory">Zero Unsafe Food Protocol</h4>
            </div>
            <p className="text-xs text-forest-100/80 leading-relaxed">
              STILLGOOD strictly isolates quarantined and expired batches. Flagged batches with temperature breaches are locked and never suggested to cooks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
