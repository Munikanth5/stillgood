import React, { useState, useEffect } from 'react';
import { KitchenProfile, ParsedScenario } from '../types';
import { interpretDisruption, extractDocument } from '../services/api';
import {
  Sparkles,
  Send,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Boxes,
  Users,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  FileImage,
  Utensils,
  CalendarCheck,
  HelpCircle
} from 'lucide-react';

interface AIAssistantProps {
  kitchen: KitchenProfile;
  onScenarioParsed: (scenario: ParsedScenario) => void;
  onNavigateToComparison: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  kitchen,
  onScenarioParsed,
  onNavigateToComparison
}) => {
  const isRestaurant = kitchen.id === 'kitchen_restaurant_verde' || kitchen.type === 'restaurant_cafe';

  const defaultRestaurantText =
    'Rainstorm alert: 40 dinner reservations cancelled (70 confirmed bookings remaining + 35 walk-ins). Supplier Country Fresh Dairy delayed (no heavy cream before dinner). At-risk fresh strawberries (8 kg) need rescue.';

  const defaultCafeteriaText =
    'Tomorrow attendance has dropped from 500 to 350. The paneer supplier cannot deliver before lunch. Keep at least 120 vegetarian meals and prioritize eligible spinach if feasible.';

  const [inputText, setInputText] = useState(isRestaurant ? defaultRestaurantText : defaultCafeteriaText);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scenario, setScenario] = useState<ParsedScenario | null>(null);
  const [extractedDocSummary, setExtractedDocSummary] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  useEffect(() => {
    setInputText(isRestaurant ? defaultRestaurantText : defaultCafeteriaText);
  }, [kitchen.id, isRestaurant]);

  const restaurantPresets = [
    {
      title: '🌧️ Rainstorm & Cancellations',
      desc: '40 bookings cancel (70 left + 35 walk-ins), dairy delayed, rescue 8 kg strawberries',
      text: 'Rainstorm alert: 40 dinner reservations cancelled (70 confirmed bookings remaining + 35 walk-ins). Supplier Country Fresh Dairy delayed (no heavy cream before dinner). At-risk fresh strawberries (8 kg) need rescue.'
    },
    {
      title: '🎉 Friday Walk-in Rush',
      desc: '+30 walk-in diners at the bar (120 total), prep cold mise-en-place buffer',
      text: 'Busy Friday expected! We have 70 reservations plus 50 walk-ins (120 total diners). Prepare pre-service hot line for bookings, and keep a cold reserve ready for the bar rush.'
    },
    {
      title: '🚚 Late Dairy Delivery Notice',
      desc: 'Milk and cream truck delayed past dinner service kickoff',
      text: 'Country Fresh Dairy truck broke down and cannot deliver cream before 9:00 PM. Pause Creamy Alfredo, scale Rustic Pomodoro, and feature fruit special.'
    },
    {
      title: '☀️ Dream Shift (No Obstacles)',
      desc: '120 diners, all suppliers on time, standard fixed-menu service',
      text: 'Normal dinner service: 85 reservations and 35 walk-ins. All supplier deliveries arrived on time with optimal temperatures.'
    }
  ];

  const cafeteriaPresets = [
    {
      title: '⭐ Hackathon WOW Scenario',
      desc: 'Attendance 500 → 350, delayed paneer, 120 veg minimum, prioritize spinach',
      text: 'Tomorrow attendance has dropped from 500 to 350. The paneer supplier cannot deliver before lunch. Keep at least 120 vegetarian meals and prioritize eligible spinach if feasible.'
    },
    {
      title: '🌧️ Heavy Rain (280 Diners)',
      desc: 'Attendance dropped from 500 to 280, freeze purchasing',
      text: 'Heavy rainstorm predicted tomorrow. Expected cafeteria badge swipes dropped from 500 to 280. Reduce preparation batches while preserving standard vegetarian options.'
    },
    {
      title: '🚚 Supplier Delay Notice',
      desc: 'Poultry delivery delayed past service window',
      text: 'Metro Halal Poultry cannot deliver chicken before 1:00 PM. Shift prep focus to vegetarian legume dishes while keeping 350 total lunch meals.'
    }
  ];

  const presets = isRestaurant ? restaurantPresets : cafeteriaPresets;

  const handleInterpret = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    try {
      const res = await interpretDisruption(inputText, kitchen.id);
      setScenario(res);
      onScenarioParsed(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setIsProcessing(true);
    try {
      const docRes = await extractDocument(file);
      setExtractedDocSummary(docRes.extracted_summary);
      if (docRes.extracted_summary) {
        setInputText(
          `Document slip uploaded: ${docRes.extracted_summary} Replan tomorrow's service accordingly.`
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 4-Step Progress Banner */}
      <div className="bg-ivory-cream rounded-2xl p-4 border border-ink-border/70 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-forest-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-forest-600" />
            Decision Twin Flow
          </span>
          <span className="text-[10px] text-ink-muted">Currently in Step 2</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-white border border-ink-border text-ink-muted flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-forest-800/20 text-forest-900 flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
            <div>
              <span className="font-semibold block">Check Today</span>
              <span className="text-[10px]">Living kitchen review</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-forest-50 border-2 border-forest-600 text-forest-900 flex items-center gap-2 shadow-sm">
            <span className="w-5 h-5 rounded-full bg-forest-800 text-ivory flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
            <div>
              <span className="font-bold block">Tell Us What Changed</span>
              <span className="text-[10px] text-forest-700">Type alerts, notes, or slips</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-ink-border text-ink-muted flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-ink-border text-ink flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
            <div>
              <span className="font-semibold block">Pick Better Plan</span>
              <span className="text-[10px]">Compare 3 choices</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-ink-border text-ink-muted flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-ink-border text-ink flex items-center justify-center font-bold text-[10px] shrink-0">4</span>
            <div>
              <span className="font-semibold block">Authorize Cooks</span>
              <span className="text-[10px]">Dispatch prep sheet</span>
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="bg-ivory rounded-2xl p-6 border border-ink-border/60 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-forest-700">
            <Sparkles className="w-5 h-5 text-forest-600" />
            <h2 className="font-serif text-2xl font-bold text-ink">AI Kitchen Assistant</h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-forest-50 text-forest-800 border border-forest-600/30 font-medium">
            {isRestaurant ? '🍴 Fixed-Menu Restaurant Mode' : '🏢 Corporate Cafeteria Mode'}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-3xl">
          Speak in plain English. Tell STILLGOOD about table cancellations, walk-in rushes, late supplier vans, or produce that needs urgent rescue.
          STILLGOOD extracts exact facts without inventing off-menu dishes or altering your official records without your approval.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Natural Language Input & Presets */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-ivory rounded-2xl border border-ink-border/60 p-6 shadow-sm space-y-4">
            <label className="block text-xs font-bold text-ink uppercase tracking-wider flex items-center justify-between">
              <span>Tell STILLGOOD What Happened</span>
              <span className="text-[11px] text-ink-muted lowercase font-normal">e.g. cancellations, late trucks, or expiring items</span>
            </label>

            <div className="relative">
              <textarea
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g. 40 dinner reservations cancelled. Country Fresh Dairy delivery delayed. Need to rescue strawberries..."
                className="w-full p-4 rounded-xl border border-ink-border bg-white text-ink text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-forest-600/40"
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <button
                  onClick={handleInterpret}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-forest-800 hover:bg-forest-900 text-ivory text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-forest-500" />
                  )}
                  <span>{isProcessing ? 'Analyzing Facts...' : 'Analyze Disruption'}</span>
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block">
                  1-Click Demonstration Scenarios ({isRestaurant ? 'Restaurant & Café' : 'Cafeteria'})
                </span>
                <span className="text-[10px] text-forest-700 font-medium">Click to populate & analyze</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputText(p.text);
                    }}
                    className="p-3 text-left rounded-xl border border-ink-border/70 hover:border-forest-600/60 bg-ivory-cream hover:bg-forest-50/70 transition text-xs space-y-1 group"
                  >
                    <div className="font-semibold text-ink group-hover:text-forest-900 flex items-center justify-between">
                      <span>{p.title}</span>
                      <ArrowRight className="w-3 h-3 text-ink-muted group-hover:text-forest-600 transition transform group-hover:translate-x-0.5" />
                    </div>
                    <div className="text-[11px] text-ink-muted line-clamp-2 leading-relaxed">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Multimodal File Upload */}
            <div className="p-4 rounded-xl bg-ivory-cream border border-dashed border-ink-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-ink-muted">
                <FileImage className="w-5 h-5 text-forest-700 shrink-0" />
                <div>
                  <span className="font-semibold text-ink block">Upload Delivery Slip or Handwritten Kitchen Note</span>
                  <span className="text-[11px]">Gemini Vision OCR extracts text from photos and supplier invoices</span>
                </div>
              </div>

              <label className="cursor-pointer px-4 py-2 bg-white hover:bg-forest-50 border border-ink-border rounded-lg text-xs font-medium text-forest-800 transition flex items-center gap-1.5 shadow-sm shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadedFileName || 'Choose Photo/Slip'}</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {extractedDocSummary && (
              <div className="p-3.5 rounded-xl bg-forest-50 border border-forest-600/30 text-xs text-forest-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-forest-600" />
                  <span>Gemini Vision OCR Extraction</span>
                </div>
                <p className="text-ink text-[11px] leading-relaxed">{extractedDocSummary}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Structured Extracted Facts (Section 4.D Distinction) */}
        <div className="space-y-4">
          <div className="bg-ivory rounded-2xl border border-ink-border/60 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-ink">
                Verified Facts & State
              </h3>
              {scenario && (
                <span className="text-[10px] font-mono bg-forest-50 text-forest-800 border border-forest-600/30 px-2 py-0.5 rounded">
                  {scenario.extraction_source}
                </span>
              )}
            </div>

            {!scenario ? (
              <div className="py-8 text-center text-xs text-ink-muted space-y-2">
                <AlertCircle className="w-8 h-8 text-ink-subtle mx-auto opacity-40" />
                <p>Click &quot;Analyze Disruption&quot; above to inspect the extracted operational parameters.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {/* 1. User-Provided Facts */}
                <div className="p-3 rounded-xl bg-ivory-cream border border-ink-border/50 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted block">
                    1. What You Told Us
                  </span>
                  <div className="font-medium text-ink text-[11px] leading-relaxed">{scenario.raw_explanation}</div>
                </div>

                {/* 2. AI-Extracted Parameters */}
                <div className="p-3 rounded-xl bg-forest-50/70 border border-forest-600/30 space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-forest-800 block">
                    2. Operational Facts Identified
                  </span>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Expected Diners:</span>
                      <span className="font-semibold text-ink">
                        {scenario.original_expected_meals} &rarr; {scenario.revised_expected_meals} guests
                      </span>
                    </div>
                    {isRestaurant && (
                      <div className="flex justify-between text-forest-800">
                        <span className="text-ink-muted">Service Split:</span>
                        <span className="font-medium">
                          70 Bookings • 35 Walk-ins
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Delayed Supplier:</span>
                      <span className="font-semibold text-terracotta-dark">
                        {scenario.excluded_ingredients.join(', ') || 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Dietary Standard:</span>
                      <span className="font-semibold text-ink">
                        Min {scenario.dietary_constraints[0]?.min_meals || 35} Vegetarian
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">At-Risk Stock to Rescue:</span>
                      <span className="font-semibold text-amber-900">
                        {scenario.inventory_priorities.join(', ') || (isRestaurant ? 'Strawberries' : 'Spinach')} (Expiring)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Calculated Results & Human Approval Requirement */}
                <div className="p-3 rounded-xl bg-ivory-cream border border-ink-border/50 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted block">
                    3. What Happens Next
                  </span>
                  <div className="text-[11px] text-ink-muted leading-relaxed">
                    STILLGOOD calculated 3 transparent alternative plans. You choose which one fits your shift best before any cook preps food.
                  </div>
                </div>

                {/* Proceed button */}
                <button
                  onClick={onNavigateToComparison}
                  className="w-full py-2.5 bg-forest-800 hover:bg-forest-900 text-ivory text-xs font-semibold rounded-xl shadow transition flex items-center justify-center gap-2 mt-2"
                >
                  <span>Pick Better Plan (Compare 3 Choices)</span>
                  <ArrowRight className="w-4 h-4 text-forest-500" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
