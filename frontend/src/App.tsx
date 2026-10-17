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
import { Header } from './components/Header';
import { Navigation, TabKey } from './components/Navigation';
import { EvidenceReceiptModal } from './components/EvidenceReceiptModal';
import { ApprovalModal } from './components/ApprovalModal';

// Pages
import { KitchenCompanion } from './pages/KitchenCompanion';
import { LivingDashboard } from './pages/LivingDashboard';
import { TomorrowPlan } from './pages/TomorrowPlan';
import { AIAssistant } from './pages/AIAssistant';
import { WhatIfSimulator } from './pages/WhatIfSimulator';
import { PlanComparison } from './pages/PlanComparison';
import { AIRescueStudio } from './pages/AIRescueStudio';
import { InventoryIntelligence } from './pages/InventoryIntelligence';
import { ActualOutcomes } from './pages/ActualOutcomes';
import { ImpactDashboard } from './pages/ImpactDashboard';
import { SettingsData } from './pages/SettingsData';

export const App: React.FC = () => {
  const [kitchens, setKitchens] = useState<KitchenProfile[]>([]);
  const [currentKitchen, setCurrentKitchen] = useState<KitchenProfile | null>(null);
  const [inventory, setInventory] = useState<InventoryBatch[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('companion');

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
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [planToApprove, setPlanToApprove] = useState<PlanEvaluation | null>(null);

  const [outcomes, setOutcomes] = useState<ActualOutcomeLog[]>([]);
  const [impactMetrics, setImpactMetrics] = useState<ImpactDashboardMetrics | null>(null);
  const [aiStatus, setAiStatus] = useState<{ is_live_gemini: boolean; model: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize application data
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    setLoading(true);
    try {
      // 1. Health & AI status
      const health = await fetchHealth();
      setAiStatus(health.ai_integration);

      // 2. Kitchens list
      const kList = await fetchKitchens();
      setKitchens(kList);
      const defaultKitchen = kList.find((k) => k.id === 'kitchen_corporate_apex') || kList[0];
      setCurrentKitchen(defaultKitchen);

      // 3. Load kitchen data
      await loadKitchenData(defaultKitchen.id);

      // 4. Preload Hackathon WOW scenario so the judge can immediately see a ready decision twin!
      const defaultScenario = await interpretDisruption(
        'Tomorrow attendance has dropped from 500 to 350. The paneer supplier cannot deliver before lunch. Keep at least 120 vegetarian meals and prioritize eligible spinach if feasible.',
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
    alert('Demo successfully reset to initial verified state!');
  };

  const handleTriggerFixPlan = () => {
    setActiveTab('comparison');
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
          <p className="text-xs text-espresso/60">Loading verified kitchen records & deterministic twin engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vanilla text-espresso flex flex-col font-sans">
      {/* Header */}
      <Header
        kitchens={kitchens}
        currentKitchen={currentKitchen}
        onSelectKitchen={handleSelectKitchen}
        onResetDemo={handleResetDemo}
        onTriggerFixPlan={handleTriggerFixPlan}
        aiStatus={aiStatus}
      />

      {/* Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasPendingPlan={Boolean(plans.plan_c)}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'companion' && currentKitchen && (
          <KitchenCompanion
            kitchen={currentKitchen}
            activePlan={activePlan}
            onViewReceipt={() => setIsReceiptOpen(true)}
            onOpenApproval={(p) => {
              setPlanToApprove(p);
              setIsApprovalOpen(true);
            }}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'today' && currentKitchen && (
          <LivingDashboard
            kitchen={currentKitchen}
            onNavigateToAssistant={() => setActiveTab('assistant')}
            onNavigateToComparison={() => setActiveTab('comparison')}
            onNavigateToInventory={() => setActiveTab('inventory')}
            onNavigateToImpact={() => setActiveTab('impact')}
            onViewReceipt={() => setIsReceiptOpen(true)}
            activePlan={activePlan}
          />
        )}

        {activeTab === 'tomorrow' && currentKitchen && (
          <TomorrowPlan
            kitchen={currentKitchen}
            plan={activePlan || plans.plan_c}
            onOpenReceipt={() => setIsReceiptOpen(true)}
            onNavigateToSimulator={() => setActiveTab('simulator')}
          />
        )}

        {activeTab === 'assistant' && currentKitchen && (
          <AIAssistant
            kitchen={currentKitchen}
            onScenarioParsed={(s) => setScenario(s)}
            onNavigateToComparison={() => setActiveTab('comparison')}
          />
        )}

        {activeTab === 'simulator' && currentKitchen && scenario && (
          <WhatIfSimulator
            kitchen={currentKitchen}
            initialScenario={scenario}
            onPlanGenerated={(data) => {
              setPlans({
                plan_a: data.plans.plan_a,
                plan_b: data.plans.plan_b,
                plan_c: data.plans.plan_c,
                rejected_candidates: data.plans.rejected_candidates
              });
              setEvidenceReceipt(data.evidence_receipt);
            }}
            onNavigateToComparison={() => setActiveTab('comparison')}
          />
        )}

        {activeTab === 'comparison' && (
          <PlanComparison
            planA={plans.plan_a}
            planB={plans.plan_b}
            planC={plans.plan_c}
            rejectedCandidates={plans.rejected_candidates}
            onOpenReceipt={() => setIsReceiptOpen(true)}
            onOpenApproval={(p) => {
              setPlanToApprove(p);
              setIsApprovalOpen(true);
            }}
          />
        )}

        {activeTab === 'rescue' && currentKitchen && (
          <AIRescueStudio
            kitchen={currentKitchen}
            planC={plans.plan_c}
            rejectedCandidates={plans.rejected_candidates}
            onOpenReceipt={() => setIsReceiptOpen(true)}
            onOpenApproval={(p) => {
              setPlanToApprove(p);
              setIsApprovalOpen(true);
            }}
          />
        )}

        {activeTab === 'inventory' && currentKitchen && (
          <InventoryIntelligence
            kitchen={currentKitchen}
            inventory={inventory}
          />
        )}

        {activeTab === 'outcomes' && currentKitchen && (
          <ActualOutcomes
            kitchen={currentKitchen}
            outcomes={outcomes}
            onOutcomeLogged={(newLog) => setOutcomes([newLog, ...outcomes])}
          />
        )}

        {activeTab === 'impact' && (
          <ImpactDashboard
            metrics={impactMetrics}
            outcomes={outcomes}
          />
        )}

        {activeTab === 'settings' && currentKitchen && (
          <SettingsData
            kitchen={currentKitchen}
            kitchens={kitchens}
            recipes={recipes}
            suppliers={suppliers}
            onSelectKitchen={handleSelectKitchen}
            onResetDemo={handleResetDemo}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-oat border-t border-subtle py-6 text-xs text-espresso/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-espresso">STILLGOOD 3.0</span>
            <span>• Google AI Builder Cup 2026 (Sustainability & Social Impact)</span>
          </div>
          <div className="text-[11px] font-mono text-espresso/60">
            Understand &rarr; Forecast &rarr; Simulate &rarr; Replan &rarr; Validate &rarr; Explain &rarr; Approve &rarr; Measure &rarr; Learn
          </div>
        </div>
      </footer>

      {/* Evidence Receipt Modal */}
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
        kitchenId={currentKitchen?.id || 'kitchen_corporate_apex'}
        isOpen={isApprovalOpen}
        onClose={() => setIsApprovalOpen(false)}
        onSubmit={handleApprovePlan}
      />
    </div>
  );
};
export default App;
