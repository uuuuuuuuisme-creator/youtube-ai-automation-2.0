import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  ListOrdered,
  Film,
  Cpu,
  Youtube,
  Settings,
  Bot,
} from 'lucide-react';
import { AppStatus } from '../types';

interface MobileNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  status: AppStatus | null;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onSelectTab, status }) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'generate', label: 'Create', icon: Sparkles },
    { id: 'employees', label: 'Team', icon: Bot },
    {
      id: 'queue',
      label: 'Queue',
      icon: ListOrdered,
      count: status?.counts.waiting || 0,
    },
    { id: 'library', label: 'Library', icon: Film },
    { id: 'automation', label: 'Cloud', icon: Cpu },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral-900/95 backdrop-blur-lg border-t border-neutral-800 px-2 py-1.5 flex items-center justify-around safe-bottom">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center min-w-[52px] min-h-[48px] px-1 py-1 rounded-lg transition-colors relative ${
              isActive ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'text-neutral-400'}`} />
              {Boolean(tab.count) && (
                <span className="absolute -top-1 -right-2 bg-amber-400 text-neutral-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono">
                  {tab.count}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
