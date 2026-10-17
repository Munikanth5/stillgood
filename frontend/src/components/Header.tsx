import React from 'react';
import { KitchenProfile } from '../types';
import { RefreshCw, Sparkles, AlertCircle, Building2, ChevronDown } from 'lucide-react';

interface HeaderProps {
  kitchens: KitchenProfile[];
  currentKitchen: KitchenProfile | null;
  onSelectKitchen: (kitchen: KitchenProfile) => void;
  onResetDemo: () => void;
  onTriggerFixPlan: () => void;
  aiStatus: { is_live_gemini: boolean; model: string } | null;
}

export const Header: React.FC<HeaderProps> = ({
  kitchens,
  currentKitchen,
  onSelectKitchen,
  onResetDemo,
  onTriggerFixPlan,
  aiStatus
}) => {
  return (
    <header className="bg-espresso text-vanilla border-b border-subtle/30 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cocoa border border-subtle/20 flex items-center justify-center shadow-inner">
              <svg className="w-6 h-6 text-terracotta" viewBox="0 0 100 100" fill="none">
                <path d="M20 70 C20 35, 80 35, 80 70 Z" fill="#B95438" />
                <circle cx="50" cy="32" r="14" fill="#E8A44E" />
                <path d="M40 70 Q50 82 60 70" stroke="#FFF9F2" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-bold tracking-tight text-white">STILLGOOD</span>
                <span className="bg-terracotta text-white text-[10px] font-semibold px-2 py-0.5 rounded tracking-wider uppercase font-mono">
                  3.0
                </span>
              </div>
              <p className="text-xs text-vanilla/70 hidden sm:block">
                No Meal Left Behind. No Good Food Wasted.
              </p>
            </div>
          </div>

          {/* Center: Kitchen Archetype Switcher */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <button className="flex items-center gap-2 bg-cocoa/90 hover:bg-cocoa border border-subtle/20 px-3.5 py-1.5 rounded-xl text-sm transition">
                <Building2 className="w-4 h-4 text-saffron" />
                <span className="font-medium text-white">
                  {currentKitchen ? currentKitchen.name : 'Select Kitchen'}
                </span>
                <span className="text-[11px] bg-espresso text-vanilla/80 px-1.5 py-0.5 rounded uppercase font-mono hidden md:inline">
                  {currentKitchen?.type.replace('_', ' ')}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-vanilla/60" />
              </button>

              {/* Dynamic Hospitality Palette Indicator */}
              <div
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cocoa/80 border border-terracotta/40 text-xs text-vanilla shadow-xs"
                title="The Kitchen & Restaurant Palette: Vanilla Cream, Espresso, Terracotta, Saffron & Sage"
              >
                <span className="w-2 h-2 rounded-full bg-terracotta" />
                <span className="text-[11px] font-semibold text-vanilla">Kitchen &amp; Restaurant Palette</span>
              </div>

              {/* Dropdown for all 8 Kitchen Archetypes */}
              <div className="absolute left-0 mt-1 w-80 bg-espresso border border-subtle/30 rounded-2xl shadow-2xl py-2 hidden group-hover:block z-50">
                <div className="px-3.5 py-1.5 text-[11px] font-semibold tracking-wider text-vanilla/50 uppercase border-b border-subtle/20">
                  Select Kitchen Archetype
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {kitchens.map((k) => (
                    <button
                      key={k.id}
                      onClick={() => onSelectKitchen(k)}
                      className={`w-full text-left px-3.5 py-2.5 hover:bg-cocoa flex items-start gap-2.5 transition ${
                        currentKitchen?.id === k.id ? 'bg-cocoa/90 border-l-2 border-terracotta' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-saffron" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{k.name}</div>
                        <div className="text-xs text-vanilla/60 flex items-center justify-between mt-0.5">
                          <span>{k.tagline}</span>
                          <span className="text-[10px] uppercase font-mono">{k.type.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: AI Status, Demo Reset, Primary CTA */}
          <div className="flex items-center gap-3">
            {/* AI Status Badge */}
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cocoa/80 border border-subtle/20 text-xs text-vanilla"
              title={aiStatus?.is_live_gemini ? "Connected to live Google Vertex AI / GenAI SDK" : "Verified offline deterministic reasoning active"}
            >
              <Sparkles className={`w-3.5 h-3.5 ${aiStatus?.is_live_gemini ? 'text-saffron animate-pulse' : 'text-sage'}`} />
              <span className="text-[11px]">
                {aiStatus?.is_live_gemini ? 'Gemini 2.5 Live' : 'Deterministic Engine'}
              </span>
            </div>

            {/* Reset Demo button */}
            <button
              onClick={onResetDemo}
              title="Reset data to initial hackathon demonstration state"
              className="p-1.5 text-vanilla/70 hover:text-white hover:bg-cocoa rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* FIX MY KITCHEN PLAN CTA */}
            <button
              onClick={onTriggerFixPlan}
              className="bg-terracotta hover:bg-terracotta-dark text-white font-medium text-xs sm:text-sm px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Fix My Kitchen Plan</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
export default Header;

