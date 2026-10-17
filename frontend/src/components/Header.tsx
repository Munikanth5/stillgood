import React from 'react';
import { KitchenProfile } from '../types';
import { Building2, ChevronDown, CalendarCheck, History, Settings, Sparkles, ChefHat } from 'lucide-react';

export type MainNavView = 'home' | 'history' | 'settings';

interface HeaderProps {
  kitchens: KitchenProfile[];
  currentKitchen: KitchenProfile | null;
  activeView: MainNavView;
  onSelectView: (view: MainNavView) => void;
  onSelectKitchen: (kitchen: KitchenProfile) => void;
  onPlanFood: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  kitchens,
  currentKitchen,
  activeView,
  onSelectView,
  onSelectKitchen,
  onPlanFood
}) => {
  const handleTrySample = () => {
    if (!kitchens || kitchens.length === 0) return;
    // Toggle between Osteria Verde (restaurant) and Apex (institutional)
    const isVerde = currentKitchen?.id === 'kitchen_restaurant_verde';
    const nextTarget = isVerde
      ? kitchens.find((k) => k.id === 'kitchen_corporate_apex') || kitchens[0]
      : kitchens.find((k) => k.id === 'kitchen_restaurant_verde') || kitchens[0];
    onSelectKitchen(nextTarget);
  };

  return (
    <header className="bg-espresso text-vanilla border-b border-subtle/30 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Home Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => onSelectView('home')}
              className="flex items-center gap-3 text-left group"
            >
              <div className="w-10 h-10 rounded-2xl bg-cocoa border border-subtle/20 flex items-center justify-center shadow-inner group-hover:border-terracotta transition">
                <ChefHat className="w-5 h-5 text-terracotta" />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold tracking-tight text-white block leading-none">
                  STILLGOOD
                </span>
                <span className="text-[11px] text-vanilla/70">
                  Kitchen Decision Companion
                </span>
              </div>
            </button>

            {/* Subtle Navigation Links (Directive 2) */}
            <nav className="hidden md:flex items-center gap-1 ml-4 border-l border-white/10 pl-4">
              <button
                onClick={() => onSelectView('home')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeView === 'home'
                    ? 'bg-cocoa text-white'
                    : 'text-vanilla/70 hover:text-white hover:bg-white/5'
                }`}
              >
                Kitchen
              </button>
              <button
                onClick={() => onSelectView('history')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeView === 'history'
                    ? 'bg-cocoa text-white'
                    : 'text-vanilla/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>History</span>
              </button>
              <button
                onClick={() => onSelectView('settings')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeView === 'settings'
                    ? 'bg-cocoa text-white'
                    : 'text-vanilla/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
            </nav>
          </div>

          {/* Center: Kitchen Selector & "Try Sample Kitchen" (Directive 3) */}
          <div className="flex items-center gap-2">
            <div className="relative group">
              <button className="flex items-center gap-2 bg-cocoa/90 hover:bg-cocoa border border-subtle/20 px-3 py-1.5 rounded-xl text-xs sm:text-sm transition">
                <Building2 className="w-3.5 h-3.5 text-saffron shrink-0" />
                <span className="font-medium text-white max-w-[120px] sm:max-w-[200px] truncate">
                  {currentKitchen ? currentKitchen.name : 'Select Kitchen'}
                </span>
                <ChevronDown className="w-3 h-3 text-vanilla/60 shrink-0" />
              </button>

              {/* Kitchen Dropdown */}
              <div className="absolute right-0 sm:left-0 mt-1 w-72 bg-espresso border border-subtle/30 rounded-2xl shadow-2xl py-2 hidden group-hover:block z-50">
                <div className="px-3.5 py-1 text-[10px] font-semibold tracking-wider text-vanilla/50 uppercase border-b border-subtle/20">
                  Select Kitchen
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {kitchens.map((k) => (
                    <button
                      key={k.id}
                      onClick={() => onSelectKitchen(k)}
                      className={`w-full text-left px-3.5 py-2 hover:bg-cocoa flex items-start gap-2 transition ${
                        currentKitchen?.id === k.id ? 'bg-cocoa/90 border-l-2 border-terracotta' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <div className="text-xs font-medium text-white">{k.name}</div>
                        <div className="text-[10px] text-vanilla/60 capitalize">
                          {k.type.replace('_', ' ')}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Unobtrusive "Try Sample Kitchen" (Directive 3) */}
            <button
              onClick={handleTrySample}
              title="Toggle between restaurant and institutional dining samples"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cocoa/60 hover:bg-cocoa border border-subtle/20 text-xs text-vanilla/90 transition"
            >
              <Sparkles className="w-3 h-3 text-saffron" />
              <span>Try Sample Kitchen</span>
            </button>
          </div>

          {/* Right: Primary "Plan My Food" Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onPlanFood}
              className="bg-terracotta hover:bg-terracotta-dark text-white font-medium text-xs sm:text-sm px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Plan My Food</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
export default Header;
