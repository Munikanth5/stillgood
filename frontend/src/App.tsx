import React, { useState, useEffect } from 'react';
import {
  KitchenProfile,
  InventoryBatch,
  Recipe,
  Supplier,
  ParsedScenario,
  PlanEvaluation,
  EvidenceReceipt,
  ActualOutcomeLog,
  ImpactDashboardMetrics
} from './types';
import {
  fetchKitchens,
  fetchInventory,
  fetchRecipes,
  fetchSuppliers,
  interpretDisruption,
  calculateReplan,
  submitApproval,
  fetchOutcomes,
  fetchImpactMetrics,
  resetDemoState,
  fetchHealth
} from './services/api';
import { Header, MainNavView } from './components/Header';
import { EvidenceReceiptModal } from './components/EvidenceReceiptModal';
import { ApprovalModal } from './components/ApprovalModal';
import { PlanFoodFlowModal } from './components/PlanFoodFlowModal';
import { PlanComparison } from './pages/PlanComparison';

// Pages
import { KitchenCompanion } from './pages/KitchenCompanion';
import { ActualOutcomes } from './pages/ActualOutcomes';
import { ImpactDashboard } from './pages/ImpactDashboard';
import { SettingsData } from './pages/SettingsData';
import { GitCompare, X } from 'lucide-react';

export const App: React.FC = () => {
  const [kitchens, setKitchens] = useState<KitchenProfile[]>([]);
  const [currentKitchen, setCurrentKitchen] = useState<KitchenProfile | null>(null);
  const [inventory, setInventory] = useState<InventoryBatch[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Directive 2: Single Kitchen Companion home screen with lightweight secondary navigation for History and Settings
  const [activeView, setActiveView] = useState<MainNavView>('home');

  const [scenario, setScenario] = useState<ParsedScenario | null>(null);
  const [plans, setPlans] = useState<{
    plan_a: PlanEvaluation | null;
    plan_b: PlanEvaluation | null;
    plan_c: PlanEvaluation | null;
    rejected_candidates: PlanEvaluation[];
  }>({
    plan_a: null,
    plan_b: null,
    plan_c: null,
    rejected_candidates: []
  });

  const [activePlan, setActivePlan] = useState<PlanEvaluation | null>(null);
  const [evidenceReceipt, setEvidenceReceipt] = useState<EvidenceReceipt | null>(null);

  // Modals
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [planToApprove, setPlanToApprove] = useState<PlanEvaluation | null>(null);
  const [isPlanFlowOpen, setIsPlanFlowOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const [outcomes, setOutcomes] = useState<ActualOutcomeLog[]>([]);
  const [impactMetrics, setImpactMetrics] = useState<ImpactDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize application data
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    setLoading(true);
    try {
      // 1. Kitchens list
      const kList = await fetchKitchens();
      setKitchens(kList);
      const defaultKitchen = kList.find((k) => k.id === 'kitchen_restaurant_verde') || kList[0];
      setCurrentKitchen(defaultKitchen);

      // 2. Load kitchen data
      await loadKitchenData(defaultKitchen.id);

      // 3. Preload restaurant scenario (Osteria Verde)
      const defaultScenario = await interpretDisruption(
        'Rainstorm alert: 40 dinner reservations cancelled (70 confirmed bookings remaining + 35 walk-ins). Supplier Country Fresh Dairy delayed (no heavy cream before dinner). At-risk fresh strawberries (8 kg) need rescue.',
        defaultKitchen.id
      );
      setScenario(defaultScenario);

      const replanRes = await calculateReplan(defaultScenario);
      setPlans({
        plan_a: replanRes.plans.plan_a,
        plan_b: replanRes.plans.plan_b,
        plan_c: replanRes.plans.plan_c,
        rejected_candidates: replanRes.plans.rejected_candidates
      });
      setActivePlan(replanRes.plans.plan_c);
      setEvidenceReceipt(replanRes.evidence_receipt);
    } catch (e) {
      console.error('Initialization error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadKitchenData = async (kitchenId: string) => {
    try {
      const [inv, rec, supp, outs, imp] = await Promise.all([
        fetchInventory(kitchenId),
        fetchRecipes(kitchenId),
        fetchSuppliers(kitchenId),
        fetchOutcomes(kitchenId),
        fetchImpactMetrics(kitchenId)
      ]);
      setInventory(inv);
      setRecipes(rec);
      setSuppliers(supp);
      setOutcomes(outs);
      setImpactMetrics(imp);
    } catch (e) {
      console.error('Error loading kitchen data:', e);
    }
  };

  const handleSelectKitchen = async (k: KitchenProfile) => {
    setCurrentKitchen(k);
    await loadKitchenData(k.id);

    try {
      const scenarioText = (k.id === 'kitchen_restaurant_verde' || k.type === 'restaurant_cafe')
        ? 'Rainstorm alert: 40 dinner reservations cancelled (70 confirmed bookings remaining + 35 walk-ins). Supplier Country Fresh Dairy delayed (no heavy cream before dinner). At-risk fresh strawberries (8 kg) need rescue.'
        : 'Tomorrow attendance has dropped from 500 to 350. The paneer supplier cannot deliver before lunch. Keep at least 120 vegetarian meals and prioritize eligible spinach if feasible.';

      const newScenario = await interpretDisruption(scenarioText, k.id);
      setScenario(newScenario);

      const replanRes = await calculateReplan(newScenario);
      setPlans({
        plan_a: replanRes.plans.plan_a,
        plan_b: replanRes.plans.plan_b,
        plan_c: replanRes.plans.plan_c,
        rejected_candidates: replanRes.plans.rejected_candidates
      });
      setActivePlan(replanRes.plans.plan_c);
      setEvidenceReceipt(replanRes.evidence_receipt);
    } catch (e) {
      console.error('Error generating kitchen scenario:', e);
    }
  };

  const handleResetDemo = async () => {
    await resetDemoState();
    await initApp();
    alert('Kitchen demo data reset to verified initial state.');
  };

  const handleApprovePlan = async (
    approverName: string,
    action: 'APPROVE' | 'REJECT',
    notes: string
  ) => {
    if (!planToApprove || !currentKitchen) return;
    try {
      await submitApproval({
        plan_id: planToApprove.plan_id,
        kitchen_id: currentKitchen.id,
        approver_name: approverName,
        action: action,
        notes: notes
      });

      if (action === 'APPROVE') {
        setActivePlan(planToApprove);
      }

      // Refresh impact metrics
      const updatedImpact = await fetchImpactMetrics(currentKitchen.id);
      setImpactMetrics(updatedImpact);
      setIsApprovalOpen(false);
      alert(`Plan successfully ${action === 'APPROVE' ? 'Authorized and Committed' : 'Rejected'}! Recorded in official audit history.`);
    } catch (err) {
      console.error(err);
      alert('Error recording approval.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-vanilla flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-terracotta border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="font-serif text-xl font-bold text-espresso">STILLGOOD Kitchen Decision Twin</h2>
          <p className="text-xs text-espresso/60">Opening kitchen workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vanilla text-espresso flex flex-col font-sans">
      {/* Header with Brand, Kitchen Switcher, Secondary Nav & "Plan My Food" */}
      <Header
        kitchens={kitchens}
        currentKitchen={currentKitchen}
        activeView={activeView}
        onSelectView={setActiveView}
        onSelectKitchen={handleSelectKitchen}
        onPlanFood={() => setIsPlanFlowOpen(true)}
      />

      {/* Main Workspace (No horizontal tab maze - Directive 2) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* VIEW 1: HOME WORKSPACE (Single Kitchen Companion Screen - Directive 2 & 3) */}
        {activeView === 'home' && currentKitchen && (
          <KitchenCompanion
            kitchen={currentKitchen}
            activePlan={activePlan}
            plans={plans}
            evidenceReceipt={evidenceReceipt}
            onViewReceipt={() => setIsReceiptOpen(true)}
            onOpenApproval={(p) => {
              setPlanToApprove(p);
              setIsApprovalOpen(true);
            }}
            onOpenCompare={() => setIsCompareOpen(true)}
          />
        )}

        {/* VIEW 2: SERVICE HISTORY & AUDIT LOGS (Lightweight secondary view - Directive 2) */}
        {activeView === 'history' && currentKitchen && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-subtle">
              <div>
                <h2 className="font-serif text-2xl font-bold text-espresso">
                  Service History &amp; Impact
                </h2>
                <p className="text-xs text-espresso/70">
                  Audit log of service outcomes, approved plans, and measured waste reduction for {currentKitchen.name}
                </p>
              </div>
              <button
                onClick={() => setActiveView('home')}
                className="px-4 py-2 bg-espresso text-vanilla text-xs font-semibold rounded-xl hover:bg-cocoa transition"
              >
                Back to Kitchen
              </button>
            </div>

            <ImpactDashboard
              metrics={impactMetrics}
              outcomes={outcomes}
            />

            <ActualOutcomes
              kitchen={currentKitchen}
              outcomes={outcomes}
              onOutcomeLogged={(newLog) => setOutcomes([newLog, ...outcomes])}
            />
          </div>
        )}

        {/* VIEW 3: SETTINGS & DATA (Lightweight secondary view - Directive 2) */}
        {activeView === 'settings' && currentKitchen && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-subtle">
              <div>
                <h2 className="font-serif text-2xl font-bold text-espresso">
                  Kitchen Profile &amp; Inventory Settings
                </h2>
                <p className="text-xs text-espresso/70">
                  Manage recipe catalog, suppliers, and operational parameters for {currentKitchen.name}
                </p>
              </div>
              <button
                onClick={() => setActiveView('home')}
                className="px-4 py-2 bg-espresso text-vanilla text-xs font-semibold rounded-xl hover:bg-cocoa transition"
              >
                Back to Kitchen
              </button>
            </div>

            <SettingsData
              kitchen={currentKitchen}
              kitchens={kitchens}
              recipes={recipes}
              suppliers={suppliers}
              onSelectKitchen={handleSelectKitchen}
              onResetDemo={handleResetDemo}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-oat border-t border-subtle py-6 text-xs text-espresso/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-espresso">STILLGOOD</span>
            <span>• No-Meal-Left-Behind AI Kitchen Decision Twin</span>
          </div>
          <div className="text-[11px] font-mono text-espresso/60">
            Responsible Hospitality AI • Google Cloud Architecture
          </div>
        </div>
      </footer>

      {/* 3-Step Plan Food Modal Flow (Directive 5) */}
      {currentKitchen && (
        <PlanFoodFlowModal
          isOpen={isPlanFlowOpen}
          onClose={() => setIsPlanFlowOpen(false)}
          kitchen={currentKitchen}
          onPlanApproved={(p) => {
            setPlanToApprove(p);
            setIsApprovalOpen(true);
          }}
          onOpenCompare={(plansData) => {
            setPlans(plansData);
            setIsCompareOpen(true);
          }}
          onOpenReceipt={(receipt) => {
            setEvidenceReceipt(receipt);
            setIsReceiptOpen(true);
          }}
        />
      )}

      {/* Modal: Compare Other Options (Directive 5 & 10) */}
      {isCompareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-cocoa/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-vanilla rounded-3xl border border-subtle shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="bg-espresso text-vanilla px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-saffron" />
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">Compare Alternative Plans</h3>
                  <p className="text-xs text-vanilla/70">
                    Review Plan A (Wasteful Baseline) vs Plan B (Blind Cut) vs Plan C (Balanced Decision Twin)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCompareOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-xl text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 font-sans text-espresso">
              <PlanComparison
                planA={plans.plan_a}
                planB={plans.plan_b}
                planC={plans.plan_c}
                rejectedCandidates={plans.rejected_candidates}
                onOpenReceipt={() => {
                  setIsCompareOpen(false);
                  setIsReceiptOpen(true);
                }}
                onOpenApproval={(p) => {
                  setIsCompareOpen(false);
                  setPlanToApprove(p);
                  setIsApprovalOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Evidence Receipt Modal ("Why this works" - Directive 5 & 10) */}
      <EvidenceReceiptModal
        receipt={evidenceReceipt}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        onOpenApproval={() => {
          if (plans.plan_c) {
            setPlanToApprove(plans.plan_c);
            setIsApprovalOpen(true);
          }
        }}
      />

      {/* Manager Approval Modal */}
      <ApprovalModal
        plan={planToApprove}
        kitchenId={currentKitchen?.id || 'kitchen_restaurant_verde'}
        isOpen={isApprovalOpen}
        onClose={() => setIsApprovalOpen(false)}
        onSubmit={handleApprovePlan}
      />
    </div>
  );
};
export default App;
