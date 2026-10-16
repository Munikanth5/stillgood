import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck2,
  Bot,
  Sliders,
  GitCompare,
  Sparkles,
  Boxes,
  ClipboardCheck,
  BarChart3,
  Settings
} from 'lucide-react';

export type TabKey =
  | 'today'
  | 'tomorrow'
  | 'assistant'
  | 'simulator'
  | 'comparison'
  | 'rescue'
  | 'inventory'
  | 'outcomes'
  | 'impact'
  | 'settings';

interface NavigationProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  hasPendingPlan: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  hasPendingPlan
}) => {
  const tabs = [
    { key: 'today' as TabKey, label: 'Today', icon: LayoutDashboard },
    { key: 'tomorrow' as TabKey, label: "Tomorrow's Plan", icon: CalendarCheck2 },
    { key: 'assistant' as TabKey, label: 'AI Assistant', icon: Bot },
    { key: 'simulator' as TabKey, label: 'What-If Simulator', icon: Sliders },
    { key: 'comparison' as TabKey, label: 'Plan Comparison', icon: GitCompare, badge: hasPendingPlan ? 'Ready' : undefined },
    { key: 'rescue' as TabKey, label: 'Rescue Studio', icon: Sparkles },
    { key: 'inventory' as TabKey, label: 'Inventory', icon: Boxes },
    { key: 'outcomes' as TabKey, label: 'Actual Outcomes', icon: ClipboardCheck },
    { key: 'impact' as TabKey, label: 'Impact Dashboard', icon: BarChart3 },
    { key: 'settings' as TabKey, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="bg-ivory-cream border-b border-ink-border/50 sticky top-16 z-30 overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                  isActive
                    ? 'bg-forest-800 text-ivory shadow-sm'
                    : 'text-ink-muted hover:text-ink hover:bg-ivory'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-forest-500' : 'text-ink-muted'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                    isActive ? 'bg-terracotta text-ivory' : 'bg-terracotta/20 text-terracotta'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
