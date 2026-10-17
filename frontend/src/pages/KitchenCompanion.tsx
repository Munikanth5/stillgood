import React, { useState, useEffect } from 'react';
import {
  KitchenProfile,
  PlanEvaluation,
  KitchenCompanionSummary,
  AttentionItem,
  EvidenceReceipt
} from '../types';
import { fetchCompanionSummary } from '../services/api';
import { PlanFoodFlowModal } from '../components/PlanFoodFlowModal';
import { PredictGuestsModal } from '../components/PredictGuestsModal';
import { RescuePreparedFoodModal } from '../components/RescuePreparedFoodModal';
import { CreateMealOffersModal } from '../components/CreateMealOffersModal';
import {
  CalendarCheck,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Utensils,
  ChefHat,
  FileText,
  Send,
  Truck,
  HeartHandshake
} from 'lucide-react';

interface KitchenCompanionProps {
  kitchen: KitchenProfile;
  activePlan: PlanEvaluation | null;
  plans: {
    plan_a: PlanEvaluation | null;
    plan_b: PlanEvaluation | null;
    plan_c: PlanEvaluation | null;
    rejected_candidates: PlanEvaluation[];
  };
  evidenceReceipt: EvidenceReceipt | null;
  onViewReceipt: () => void;
  onOpenApproval: (plan: PlanEvaluation) => void;
  onOpenCompare: () => void;
}

export const KitchenCompanion: React.FC<KitchenCompanionProps> = ({
  kitchen,
  activePlan,
  plans,
  evidenceReceipt,
  onViewReceipt,
  onOpenApproval,
  onOpenCompare
}) => {
  const [summary, setSummary] = useState<KitchenCompanionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Natural Language Input State (Directive 3)
  const [tellStillgoodText, setTellStillgoodText] = useState('');

  // Action Modals State
  const [isPlanFlowOpen, setIsPlanFlowOpen] = useState(false);
  const [planFlowDisruption, setPlanFlowDisruption] = useState('');
  const [isPredictOpen, setIsPredictOpen] = useState(false);
  const [isRescueOpen, setIsRescueOpen] = useState(false);
  const [isOffersOpen, setIsOffersOpen] = useState(false);

  useEffect(() => {
    loadSummary();
  }, [kitchen.id]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await fetchCompanionSummary(kitchen.id);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load companion summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNaturalLanguageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tellStillgoodText.trim()) return;
    setPlanFlowDisruption(tellStillgoodText);
    setIsPlanFlowOpen(true);
  };

  const handleQuickAction = (action: 'fewer' | 'walkins' | 'leftovers' | 'delayed') => {
    if (action === 'fewer') {
      setPlanFlowDisruption('Attendance dropped by 30%. Rebalance food prep and scale down batch portions.');
      setIsPlanFlowOpen(true);
    } else if (action === 'walkins') {
      setIsPredictOpen(true);
    } else if (action === 'leftovers') {
      setIsRescueOpen(true);
    } else if (action === 'delayed') {
      setPlanFlowDisruption('Delivery delayed from core supplier. Replan recipes using existing in-house stock.');
      setIsPlanFlowOpen(true);
    }
  };

  const handleAttentionAction = (actionType: AttentionItem['action_type']) => {
    if (actionType === 'walkin') setIsPredictOpen(true);
    else if (actionType === 'prepared_rescue') setIsRescueOpen(true);
    else if (actionType === 'combo') setIsOffersOpen(true);
    else if (actionType === 'replan') {
      setPlanFlowDisruption('');
      setIsPlanFlowOpen(true);
    }
  };

  if (loading && !summary) {
    return (
      <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-subtle">
        <div className="w-8 h-8 border-3 border-terracotta border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-espresso/70 font-medium">Opening Kitchen Companion for {kitchen.name}...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 text-espresso">
      {/* 1. WELCOME EXPERIENCE (Question 1: What is happening in my kitchen?) */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-subtle shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-terracotta bg-terracotta/10 px-2.5 py-0.5 rounded-lg capitalize">
                {kitchen.type.replace('_', ' ')} • {kitchen.default_service_period} Service
              </span>
              <span className="text-xs text-espresso/50">•</span>
              <span className="text-xs text-espresso/70 font-medium">
                {kitchen.name}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso tracking-tight">
              Good afternoon, Chef.
            </h1>
          </div>

          <div className="px-4 py-2 bg-vanilla rounded-2xl border border-subtle self-start sm:self-auto text-left sm:text-right">
            <span className="text-[10px] text-espresso/60 uppercase font-bold block">Service Status</span>
            <span className="font-serif font-bold text-sage text-sm flex items-center gap-1.5 justify-start sm:justify-end mt-0.5">
              <span className="w-2 h-2 rounded-full bg-sage" />
              Kitchen Under Control
            </span>
          </div>
        </div>

        {/* Natural Language Disruption Input: "Tell STILLGOOD what happened" (Directive 3) */}
        <div className="pt-2">
          <form onSubmit={handleNaturalLanguageSubmit} className="relative">
            <input
              type="text"
              value={tellStillgoodText}
              onChange={(e) => setTellStillgoodText(e.target.value)}
              placeholder="Tell STILLGOOD what happened (e.g. 20 guests cancelled dinner, or dairy delivery is delayed...)"
              className="w-full pl-4 pr-32 py-3.5 bg-vanilla text-xs sm:text-sm text-espresso rounded-2xl border border-subtle focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta shadow-inner placeholder:text-espresso/50"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-4 bg-terracotta hover:bg-terracotta-dark text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Update Plan</span>
            </button>
          </form>

          {/* Four Relevant Quick Actions (Directive 3) */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-semibold text-espresso/60 mr-1">Quick Scenarios:</span>
            <button
              type="button"
              onClick={() => handleQuickAction('fewer')}
              className="px-3 py-1.5 rounded-xl border border-subtle bg-white hover:bg-oat text-espresso transition flex items-center gap-1.5 shadow-xs"
            >
              <TrendingDown className="w-3.5 h-3.5 text-sage" />
              <span>Fewer guests</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction('walkins')}
              className="px-3 py-1.5 rounded-xl border border-subtle bg-white hover:bg-oat text-espresso transition flex items-center gap-1.5 shadow-xs"
            >
              <Users className="w-3.5 h-3.5 text-saffron" />
              <span>More walk-ins</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction('leftovers')}
              className="px-3 py-1.5 rounded-xl border border-subtle bg-white hover:bg-oat text-espresso transition flex items-center gap-1.5 shadow-xs"
            >
              <Utensils className="w-3.5 h-3.5 text-terracotta" />
              <span>Food left over</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction('delayed')}
              className="px-3 py-1.5 rounded-xl border border-subtle bg-white hover:bg-oat text-espresso transition flex items-center gap-1.5 shadow-xs"
            >
              <Truck className="w-3.5 h-3.5 text-espresso/70" />
              <span>Delivery delayed</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. WHAT NEEDS ATTENTION? (Question 2: At most three important notifications - Directive 3) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-terracotta" />
            <h2 className="font-serif text-base font-bold text-espresso">
              What Needs Attention?
            </h2>
          </div>
          <span className="text-[11px] text-espresso/60">
            Top 3 items requiring your review
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(summary?.attention_items || []).slice(0, 3).map((item) => (
            <div
              key={item.id}
              onClick={() => handleAttentionAction(item.action_type)}
              className="p-5 bg-white rounded-3xl border border-subtle shadow-xs hover:border-terracotta/50 transition cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider ${
                      item.urgency === 'high'
                        ? 'bg-terracotta/15 text-terracotta'
                        : item.urgency === 'medium'
                        ? 'bg-saffron/20 text-espresso'
                        : 'bg-sage/15 text-sage'
                    }`}
                  >
                    {item.urgency} Urgency
                  </span>
                  <ArrowRight className="w-4 h-4 text-espresso/40 group-hover:text-terracotta group-hover:translate-x-0.5 transition" />
                </div>
                <h3 className="font-serif text-sm font-bold text-espresso group-hover:text-terracotta transition">
                  {item.title}
                </h3>
                <p className="text-xs text-espresso/70 leading-relaxed">
                  {item.detail}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-subtle/60 flex items-center justify-between text-xs font-semibold text-terracotta">
                <span>Take Action</span>
                <span>&rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. WHAT SHOULD I DO NEXT? (Question 3: Four simple action cards - Directive 3) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-base font-bold text-espresso">
            What would you like to do?
          </h2>
          <span className="text-[11px] text-espresso/60">
            Select a task to get started
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action 1: Plan my food */}
          <div
            onClick={() => {
              setPlanFlowDisruption('');
              setIsPlanFlowOpen(true);
            }}
            className="p-5 bg-white rounded-3xl border border-subtle shadow-xs hover:border-terracotta/60 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-oat border border-subtle flex items-center justify-center mb-3 group-hover:bg-terracotta/10 transition">
                <CalendarCheck className="w-5 h-5 text-terracotta" />
              </div>
              <h3 className="font-serif text-base font-bold text-espresso group-hover:text-terracotta transition">
                Plan my food
              </h3>
              <p className="text-xs text-espresso/70 mt-1.5 leading-relaxed">
                3-step guided flow to rebalance meal prep against cancellations & delivery delays.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-subtle/50 flex items-center text-xs font-semibold text-terracotta">
              <span>Start plan</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Action 2: Predict guests */}
          <div
            onClick={() => setIsPredictOpen(true)}
            className="p-5 bg-white rounded-3xl border border-subtle shadow-xs hover:border-saffron/80 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-oat border border-subtle flex items-center justify-center mb-3 group-hover:bg-saffron/20 transition">
                <Users className="w-5 h-5 text-saffron" />
              </div>
              <h3 className="font-serif text-base font-bold text-espresso group-hover:text-espresso transition">
                Predict guests
              </h3>
              <p className="text-xs text-espresso/70 mt-1.5 leading-relaxed">
                Walk-ins expected in the next 30 minutes, forecast range, and practical prep advice.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-subtle/50 flex items-center text-xs font-semibold text-terracotta">
              <span>Check walk-ins</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Action 3: Food left over */}
          <div
            onClick={() => setIsRescueOpen(true)}
            className="p-5 bg-white rounded-3xl border border-subtle shadow-xs hover:border-sage/80 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-oat border border-subtle flex items-center justify-center mb-3 group-hover:bg-sage/20 transition">
                <ShieldCheck className="w-5 h-5 text-sage" />
              </div>
              <h3 className="font-serif text-base font-bold text-espresso group-hover:text-sage transition">
                Food left over
              </h3>
              <p className="text-xs text-espresso/70 mt-1.5 leading-relaxed">
                Log post-service leftovers with progressive food-safety checks for resale or donation.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-subtle/50 flex items-center text-xs font-semibold text-sage">
              <span>Check safety</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Action 4: Create meal offers */}
          <div
            onClick={() => setIsOffersOpen(true)}
            className="p-5 bg-white rounded-3xl border border-subtle shadow-xs hover:border-terracotta/60 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-oat border border-subtle flex items-center justify-center mb-3 group-hover:bg-terracotta/10 transition">
                <Sparkles className="w-5 h-5 text-terracotta" />
              </div>
              <h3 className="font-serif text-base font-bold text-espresso group-hover:text-terracotta transition">
                Create meal offers
              </h3>
              <p className="text-xs text-espresso/70 mt-1.5 leading-relaxed">
                Generate at most three safe surplus combos with transparent discount pricing.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-subtle/50 flex items-center text-xs font-semibold text-terracotta">
              <span>View offers</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. ONE BEST RECOMMENDED ACTION (Directive 10) */}
      <div className="p-6 sm:p-7 bg-white rounded-3xl border border-subtle shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-saffron/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-terracotta" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-espresso/60 block">
                Best Recommended Action
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-espresso">
                {summary?.ai_recommendation?.title || 'Authorize Dinner Rebalance Plan'}
              </h3>
            </div>
          </div>

          <span className="text-xs text-sage font-medium bg-sage/10 px-3 py-1 rounded-xl border border-sage/20 self-start sm:self-auto">
            Ready for Chef Review
          </span>
        </div>

        {/* 4 Plain Language Pillars: What to do, Why it helps, What is required, Remaining uncertainty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-4 bg-vanilla rounded-2xl border border-subtle space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-espresso/60 block">
              What To Do
            </span>
            <p className="text-espresso font-medium leading-relaxed">
              {summary?.ai_recommendation?.what_to_do || 'Hold excess hot prep, activate cold strawberry coulis reserve, and open rescue combos.'}
            </p>
          </div>

          <div className="p-4 bg-vanilla rounded-2xl border border-subtle space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sage block">
              Why It Helps
            </span>
            <p className="text-espresso font-medium leading-relaxed">
              {summary?.ai_recommendation?.why_it_helps || 'Protects kitchen margins and avoids 15 kg of surplus by rebalancing prep portions before cooking starts.'}
            </p>
          </div>

          <div className="p-4 bg-vanilla rounded-2xl border border-subtle space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta block">
              What You Need To Confirm
            </span>
            <p className="text-espresso font-medium leading-relaxed">
              {summary?.ai_recommendation?.what_is_required || 'Review portion targets and authorize shift prep sheet with sous-chef.'}
            </p>
          </div>

          <div className="p-4 bg-vanilla rounded-2xl border border-subtle space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-saffron block">
              Remaining Uncertainty
            </span>
            <p className="text-espresso font-medium leading-relaxed">
              {summary?.ai_recommendation?.what_is_uncertain || 'Walk-in guest arrivals between 18:30 and 20:00 will follow evening weather changes.'}
            </p>
          </div>
        </div>

        {/* Clear Action Buttons (Directive 10) */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-subtle">
          <button
            type="button"
            onClick={onViewReceipt}
            className="text-xs text-espresso/70 hover:text-espresso flex items-center gap-1.5 transition underline-offset-4 hover:underline"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Why this works (Evidence Receipt)</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOpenCompare}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-oat hover:bg-subtle text-espresso text-xs font-semibold rounded-xl border border-subtle transition"
            >
              Compare other options
            </button>

            <button
              type="button"
              onClick={() => {
                if (activePlan) {
                  onOpenApproval(activePlan);
                } else {
                  setIsPlanFlowOpen(true);
                }
              }}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-terracotta hover:bg-terracotta-dark text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Review &amp; Approve Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK STATUS METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 bg-white rounded-2xl border border-subtle shadow-xs">
          <span className="text-[10px] uppercase font-bold text-espresso/60 block">Meals Saved Today</span>
          <span className="font-serif text-2xl font-bold text-espresso mt-0.5 block">142</span>
          <span className="text-[11px] text-sage font-medium">96% forecast accuracy</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-subtle shadow-xs">
          <span className="text-[10px] uppercase font-bold text-espresso/60 block">Tonight's Expected Guests</span>
          <span className="font-serif text-2xl font-bold text-terracotta mt-0.5 block">
            {summary?.walkins_expected_today ? summary.walkins_expected_today + 70 : 105}
          </span>
          <span className="text-[11px] text-espresso/70">70 booked + walk-in band</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-subtle shadow-xs">
          <span className="text-[10px] uppercase font-bold text-espresso/60 block">Active Surplus Offers</span>
          <span className="font-serif text-2xl font-bold text-saffron mt-0.5 block">
            {summary?.active_combos_count || 1}
          </span>
          <span className="text-[11px] text-espresso/70">Passing safety gate</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-subtle shadow-xs">
          <span className="text-[10px] uppercase font-bold text-espresso/60 block">Purchase Cost Prevented</span>
          <span className="font-serif text-2xl font-bold text-sage mt-0.5 block">$314.80</span>
          <span className="text-[11px] text-espresso/70">Zero unserved waste</span>
        </div>
      </div>

      {/* MODAL FLOWS */}
      <PlanFoodFlowModal
        isOpen={isPlanFlowOpen}
        onClose={() => setIsPlanFlowOpen(false)}
        kitchen={kitchen}
        initialDisruptionText={planFlowDisruption}
        onPlanApproved={(p) => {
          setIsPlanFlowOpen(false);
          onOpenApproval(p);
        }}
        onOpenCompare={() => {
          setIsPlanFlowOpen(false);
          onOpenCompare();
        }}
        onOpenReceipt={() => {
          setIsPlanFlowOpen(false);
          onViewReceipt();
        }}
      />

      <PredictGuestsModal
        isOpen={isPredictOpen}
        onClose={() => setIsPredictOpen(false)}
        kitchenId={kitchen.id}
        kitchenName={kitchen.name}
      />

      <RescuePreparedFoodModal
        isOpen={isRescueOpen}
        onClose={() => setIsRescueOpen(false)}
        kitchenId={kitchen.id}
        kitchenName={kitchen.name}
        onBatchCreated={loadSummary}
        onNavigateToOffers={() => setIsOffersOpen(true)}
      />

      <CreateMealOffersModal
        isOpen={isOffersOpen}
        onClose={() => setIsOffersOpen(false)}
        kitchenId={kitchen.id}
        kitchenName={kitchen.name}
        onOfferOrdered={loadSummary}
      />
    </div>
  );
};
export default KitchenCompanion;
