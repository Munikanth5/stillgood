import React, { useState, useEffect } from 'react';
import { MealComboProposal, MealOfferOrderResult, ComboPriceOption } from '../types';
import { fetchCombos, generateCombos, publishCombo, orderCombo } from '../services/api';
import {
  Sparkles, Tag, ShoppingBag, CheckCircle2, ShieldCheck, X,
  Clock, AlertCircle, ArrowRight, Utensils, Award, RefreshCw
} from 'lucide-react';

interface CreateMealOffersModalProps {
  isOpen: boolean;
  onClose: () => void;
  kitchenId: string;
  kitchenName: string;
  onOfferOrdered?: () => void;
}

export const CreateMealOffersModal: React.FC<CreateMealOffersModalProps> = ({
  isOpen,
  onClose,
  kitchenId,
  kitchenName,
  onOfferOrdered
}) => {
  const [combos, setCombos] = useState<MealComboProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<MealComboProposal | null>(null);
  const [selectedBand, setSelectedBand] = useState<string>('35% Value-Combo');
  const [ordering, setOrdering] = useState(false);
  const [orderReceipt, setOrderReceipt] = useState<MealOfferOrderResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCombos();
    }
  }, [isOpen, kitchenId]);

  const loadCombos = async () => {
    setLoading(true);
    try {
      const data = await fetchCombos(kitchenId);
      setCombos(data);
      if (data.length > 0 && !selectedCombo) {
        setSelectedCombo(data[0]);
      }
    } catch (err) {
      console.error('Failed to load combos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const updated = await generateCombos(kitchenId);
      setCombos(updated);
      if (updated.length > 0) {
        setSelectedCombo(updated[0]);
      }
    } catch (err: any) {
      alert(`Combo generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async (comboId: string) => {
    try {
      const updated = await publishCombo(kitchenId, comboId);
      setCombos((prev) => prev.map((c) => (c.combo_id === comboId ? updated : c)));
      if (selectedCombo?.combo_id === comboId) {
        setSelectedCombo(updated);
      }
    } catch (err) {
      console.error('Failed to publish combo:', err);
    }
  };

  const handleOrderTest = async () => {
    if (!selectedCombo) return;
    setOrdering(true);
    try {
      const receipt = await orderCombo(selectedCombo.combo_id, {
        combo_id: selectedCombo.combo_id,
        quantity: 1,
        chosen_band: selectedBand,
        customer_name: 'Diner Walk-in #402'
      });
      setOrderReceipt(receipt);
      // Reload combos to update portion counts
      await loadCombos();
      if (onOfferOrdered) onOfferOrdered();
    } catch (err: any) {
      alert(`Order failed: ${err.message}`);
    } finally {
      setOrdering(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-cocoa/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-vanilla rounded-2xl border border-subtle shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-espresso text-vanilla px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-saffron/20 border border-saffron/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-saffron" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-white">Create Meal Offers</h3>
                <span className="text-[10px] bg-terracotta text-white px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                  Gemini Flash + Margin Engine
                </span>
              </div>
              <p className="text-xs text-vanilla/70">
                Safe surplus pairings with 3 discount bands for {kitchenName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 text-vanilla/80 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-4 bg-oat border-b border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-espresso/80">
            <strong>Culinary Pairing Rule:</strong> Only dishes passing the mandatory FSSAI safety gate are bundled. Positive contribution margins (≥15%) guaranteed.
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-terracotta hover:bg-terracotta-dark text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2 shrink-0"
          >
            <Sparkles className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Crafting with Gemini...' : 'Generate AI Surplus Combos'}</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto font-sans text-espresso">
          {loading ? (
            <div className="py-12 text-center text-xs text-espresso/60 space-y-2">
              <div className="w-8 h-8 border-3 border-terracotta border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Loading meal combo proposals...</p>
            </div>
          ) : combos.length === 0 ? (
            <div className="p-12 text-center text-espresso/60 bg-white rounded-xl border border-dashed border-subtle space-y-3">
              <Utensils className="w-10 h-10 text-espresso/30 mx-auto" />
              <div className="font-serif text-base font-bold text-espresso">No active combos yet</div>
              <p className="text-xs max-w-md mx-auto">
                Click "Generate AI Surplus Combos" above to let Google Gemini assemble delicious culinary pairings from your verified safe surplus batches.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Combo Proposals List */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-espresso">
                    Verified Meal Offers (Max 3)
                  </span>
                  <span className="text-[11px] text-espresso/60">
                    Select an offer to review discount bands
                  </span>
                </div>

                <div className="space-y-3">
                  {combos.slice(0, 3).map((combo) => {
                    const isSelected = selectedCombo?.combo_id === combo.combo_id;
                    const recommendedBand = combo.price_options.find((b) => b.recommended) || combo.price_options[0];
                    return (
                      <div
                        key={combo.combo_id}
                        onClick={() => setSelectedCombo(combo)}
                        className={`p-4 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-white border-terracotta shadow-md ring-1 ring-terracotta/20'
                            : 'bg-white/80 border-subtle hover:bg-white hover:border-terracotta/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-serif text-sm font-bold text-espresso">
                                {combo.combo_title}
                              </h4>
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                  combo.status === 'published'
                                    ? 'bg-sage/15 text-sage border border-sage/30'
                                    : 'bg-saffron/20 text-espresso'
                                }`}
                              >
                                {combo.status}
                              </span>
                            </div>
                            <p className="text-xs text-espresso/70 mt-1 line-clamp-2">
                              {combo.description}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-espresso/50 line-through block">
                              ${combo.original_combined_price.toFixed(2)}
                            </span>
                            <span className="font-serif text-base font-bold text-terracotta">
                              ${recommendedBand?.discounted_price.toFixed(2)}
                            </span>
                            <span className="text-[9px] bg-terracotta/10 text-terracotta font-bold px-1.5 py-0.2 rounded block mt-0.5">
                              {recommendedBand?.discount_pct}% OFF
                            </span>
                          </div>
                        </div>

                        {/* Components & portions available */}
                        <div className="mt-3 pt-3 border-t border-subtle/50 flex flex-wrap items-center justify-between text-[11px] text-espresso/70 gap-2">
                          <div className="flex items-center gap-1.5">
                            <Utensils className="w-3.5 h-3.5 text-espresso/50" />
                            <span>{combo.component_dishes.join(' + ')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-espresso">
                              {combo.portions_available} portions
                            </span>
                            <span className="text-espresso/40">•</span>
                            <span className="flex items-center gap-1 text-espresso/60">
                              <Clock className="w-3 h-3" /> Cutoff: {combo.safe_until}
                            </span>
                          </div>
                        </div>

                        {combo.status !== 'published' && (
                          <div className="mt-3 pt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePublish(combo.combo_id);
                              }}
                              className="px-3 py-1 bg-sage hover:bg-sage/90 text-white text-[11px] font-semibold rounded-lg shadow-xs transition"
                            >
                              Publish to Evening Service
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Pricing Bands & Live In-App Diner Order Demo */}
              <div className="lg:col-span-5 space-y-4">
                {selectedCombo ? (
                  <>
                    {/* Three Discount Tiers */}
                    <div className="p-4 bg-white rounded-xl border border-subtle shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-espresso uppercase tracking-wider">
                          Discount Pricing Bands
                        </span>
                        <span className="text-[10px] text-espresso/60 font-mono">
                          Margin Guaranteed &ge;15%
                        </span>
                      </div>

                      <div className="space-y-2">
                        {selectedCombo.price_options.map((band: ComboPriceOption) => (
                          <div
                            key={band.band_name}
                            onClick={() => setSelectedBand(band.band_name)}
                            className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                              selectedBand === band.band_name
                                ? 'bg-vanilla border-terracotta shadow-xs ring-1 ring-terracotta/20'
                                : 'bg-white border-subtle hover:bg-vanilla/40'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-espresso">{band.band_name}</span>
                                {band.recommended && (
                                  <span className="bg-sage/15 text-sage text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
                                    Recommended
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-espresso/60">
                                Saves customer ${band.savings_amount.toFixed(2)} • Gross margin: {band.gross_margin_pct.toFixed(0)}%
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="font-serif font-bold text-terracotta text-sm">
                                ${band.discounted_price.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-espresso/50 block">
                                {band.discount_pct}% off
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customer-Facing Live Menu Demo */}
                    <div className="p-4 bg-oat rounded-xl border border-subtle space-y-3">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-terracotta" />
                        <span className="text-xs font-bold text-espresso uppercase tracking-wider">
                          Diner Live Menu Preview
                        </span>
                      </div>
                      <p className="text-[11px] text-espresso/70">
                        Test a simulated walk-in guest purchase. This demonstrates atomic decrement of both the offer and its component batches!
                      </p>

                      <div className="p-3 bg-white rounded-lg border border-subtle space-y-2">
                        <div className="font-serif text-sm font-bold text-espresso">
                          {selectedCombo.combo_title}
                        </div>
                        <div className="text-[11px] text-espresso/70">
                          Selected Band: <strong>{selectedBand}</strong>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-espresso/80">Available Portions:</span>
                          <span className="font-mono font-bold text-espresso">
                            {selectedCombo.portions_available} remaining
                          </span>
                        </div>

                        <button
                          onClick={handleOrderTest}
                          disabled={ordering || selectedCombo.portions_available <= 0}
                          className="w-full py-2 bg-espresso hover:bg-cocoa text-vanilla text-xs font-semibold rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 mt-2"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>
                            {ordering
                              ? 'Processing Atomic Order...'
                              : selectedCombo.portions_available <= 0
                              ? 'Sold Out'
                              : 'Order 1 Meal Combo (Test Order)'}
                          </span>
                        </button>
                      </div>

                      {orderReceipt && (
                        <div className="p-3 bg-sage/15 border border-sage/30 rounded-lg text-sage text-xs space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Order Confirmed: {orderReceipt.order_id}</span>
                          </div>
                          <p className="text-[11px] text-espresso">
                            Paid ${orderReceipt.total_price.toFixed(2)}. Remaining combo portions: {orderReceipt.remaining_portions}.
                          </p>
                          <div className="text-[10px] text-espresso/70 font-mono">
                            Decremented Batches:{' '}
                            {orderReceipt.decremented_batches.map((b) => `${b.dish_name} (-${b.decremented_by})`).join(', ')}
                          </div>
                          <div className="text-[9px] font-bold text-sage uppercase">
                            Zero double-counting verified!
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-8 bg-white rounded-xl border border-dashed border-subtle text-center text-espresso/60 text-xs">
                    Select a combo from the list to view pricing bands and test ordering.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-oat px-6 py-3.5 border-t border-subtle flex items-center justify-between">
          <div className="text-[11px] text-espresso/60 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sage" />
            <span>Guaranteed positive contribution margin and atomic component inventory decrement</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-espresso hover:bg-cocoa text-vanilla text-xs font-semibold rounded-lg transition"
          >
            Close Offers
          </button>
        </div>
      </div>
    </div>
  );
};
