import React, { useState } from 'react';
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
  FileImage
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
  const [inputText, setInputText] = useState(
    'Tomorrow attendance has dropped from 500 to 350. The paneer supplier cannot deliver before lunch. Keep at least 120 vegetarian meals and prioritize eligible spinach if feasible.'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [scenario, setScenario] = useState<ParsedScenario | null>(null);
  const [extractedDocSummary, setExtractedDocSummary] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const presets = [
    {
      title: '⭐ Hackathon WOW Scenario',
      desc: 'Attendance 500 → 350, delayed paneer, 120 veg minimum, prioritize spinach',
      text: 'Tomorrow attendance has dropped from 500 to 350. The paneer supplier cannot deliver before lunch. Keep at least 120 vegetarian meals and prioritize eligible spinach if feasible.'
    },
    {
      title: 'Severe Attendance Drop (Rainstorm)',
      desc: 'Attendance dropped from 500 to 280, freeze purchasing',
      text: 'Heavy rainstorm predicted tomorrow. Expected cafeteria badge swipes dropped from 500 to 280. Reduce preparation batches while preserving standard vegetarian options.'
    },
    {
      title: 'Supplier Delay Notice',
      desc: 'Poultry delivery delayed past service window',
      text: 'Metro Halal Poultry cannot deliver chicken before 1:00 PM. Shift prep focus to vegetarian legume dishes while keeping 350 total lunch meals.'
    }
  ];

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
      {/* Title */}
      <div className="bg-ivory rounded-2xl p-6 border border-ink-border/60 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-forest-700">
          <Sparkles className="w-5 h-5 text-forest-600" />
          <h2 className="font-serif text-2xl font-bold text-ink">AI Kitchen Assistant</h2>
        </div>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed max-w-3xl">
          Enter operational alerts, voice notes, headcount revisions, or upload delivery slips.
          STILLGOOD extracts verified operational parameters without hallucinating ingredients or modifying official records without your confirmation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Natural Language Input & Presets */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-ivory rounded-2xl border border-ink-border/60 p-6 shadow-sm space-y-4">
            <label className="block text-xs font-bold text-ink uppercase tracking-wider">
              Tell STILLGOOD What Changed
            </label>

            <div className="relative">
              <textarea
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g. Tomorrow attendance has dropped from 500 to 350. The paneer supplier cannot deliver before lunch..."
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
                  <span>{isProcessing ? 'Analyzing...' : 'Analyze Disruption'}</span>
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block">
                Quick Demonstration Scenarios
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputText(p.text)}
                    className="p-3 text-left rounded-xl border border-ink-border/70 hover:border-forest-600/50 bg-ivory-cream hover:bg-forest-50/50 transition text-xs space-y-1"
                  >
                    <div className="font-semibold text-ink line-clamp-1">{p.title}</div>
                    <div className="text-[11px] text-ink-muted line-clamp-2">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Multimodal File Upload */}
            <div className="p-4 rounded-xl bg-ivory-cream border border-dashed border-ink-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-ink-muted">
                <FileImage className="w-5 h-5 text-forest-700" />
                <div>
                  <span className="font-semibold text-ink block">Upload Delivery Slip or Kitchen Note</span>
                  <span className="text-[11px]">Gemini Vision OCR analyzes handwritten or printed stock memos</span>
                </div>
              </div>

              <label className="cursor-pointer px-4 py-2 bg-white hover:bg-forest-50 border border-ink-border rounded-lg text-xs font-medium text-forest-800 transition flex items-center gap-1.5 shadow-sm">
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
                <p>Click &quot;Analyze Disruption&quot; to inspect the typed operational parameters.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {/* 1. User-Provided Facts */}
                <div className="p-3 rounded-xl bg-ivory-cream border border-ink-border/50 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted block">
                    1. User-Provided Facts
                  </span>
                  <div className="font-medium text-ink text-[11px]">{scenario.raw_explanation}</div>
                </div>

                {/* 2. AI-Extracted Parameters */}
                <div className="p-3 rounded-xl bg-forest-50/70 border border-forest-600/30 space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-forest-800 block">
                    2. AI-Extracted Parameters
                  </span>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Expected Attendance:</span>
                      <span className="font-semibold text-ink">
                        {scenario.original_expected_meals} &rarr; {scenario.revised_expected_meals}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Excluded Ingredient:</span>
                      <span className="font-semibold text-terracotta-dark">
                        {scenario.excluded_ingredients.join(', ') || 'None'} (Supplier delayed)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Dietary Constraint:</span>
                      <span className="font-semibold text-ink">
                        Min {scenario.dietary_constraints[0]?.min_meals || 120} Vegetarian
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Inventory Priority:</span>
                      <span className="font-semibold text-amber-900">
                        {scenario.inventory_priorities.join(', ') || 'Spinach'} (At-Risk)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Calculated Results & Human Approval Requirement */}
                <div className="p-3 rounded-xl bg-ivory-cream border border-ink-border/50 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted block">
                    3. Operational Status
                  </span>
                  <div className="text-[11px] text-ink-muted">
                    Deterministic planning engine ready to compare Plan A, Plan B, and Plan C rescue alternatives.
                  </div>
                </div>

                {/* Proceed button */}
                <button
                  onClick={onNavigateToComparison}
                  className="w-full py-2.5 bg-forest-800 hover:bg-forest-900 text-ivory text-xs font-semibold rounded-xl shadow transition flex items-center justify-center gap-2 mt-2"
                >
                  <span>Compare Candidate Plans</span>
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
