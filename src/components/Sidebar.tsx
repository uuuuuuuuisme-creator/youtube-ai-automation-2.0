import React from 'react';
import {
  LayoutDashboard,
  Video,
  ListOrdered,
  Film,
  Youtube,
  Cpu,
  BarChart3,
  Settings,
  Sparkles,
  Calendar,
  Volume2,
  Bot,
} from 'lucide-react';
import { AppStatus } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  status: AppStatus | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, status }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'generate', label: 'AI Generator', icon: Sparkles },
    {
      id: 'employees',
      label: 'AI Team (Claude)',
      icon: Bot,
      badge: 'Claude',
      badgeColor: 'bg-purple-500/20 text-purple-300',
    },
    {
      id: 'queue',
      label: 'Video Queue',
      icon: ListOrdered,
      badge: status?.counts.waiting ? `${status.counts.waiting}` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300',
    },
    {
      id: 'library',
      label: 'Video Library',
      icon: Film,
      badge: status?.counts.ready ? `${status.counts.ready}` : undefined,
      badgeColor: 'bg-neutral-800 text-neutral-300',
    },
    {
      id: 'youtube',
      label: 'YouTube Channel',
      icon: Youtube,
      indicator: status?.channel.connected ? 'green' : 'gray',
    },
    {
      id: 'automation',
      label: 'Cloud Automation',
      icon: Cpu,
      sublabel: status?.automation.status === 'running' ? 'Active 2/day' : 'Paused',
    },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-neutral-900 border-r border-neutral-800 h-[calc(100vh-57px)] sticky top-[57px] p-4 justify-between">
      <div className="space-y-6">
        {/* Navigation list */}
        <div className="space-y-1">
          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-3 mb-2">
            Main Platform
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-neutral-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
                {item.indicator && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.indicator === 'green' ? 'bg-emerald-400' : 'bg-neutral-600'
                    }`}
                  />
                )}
                {item.sublabel && (
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {item.sublabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Daily Target Progress Widget */}
        <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400 font-medium">Daily Target</span>
            <span className="text-amber-400 font-mono font-semibold">
              {status?.counts.todayPublished || 0} / {status?.counts.dailyTarget || 2} Shorts
            </span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  (((status?.counts.todayPublished || 0) / (status?.counts.dailyTarget || 2)) * 100)
                )}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-500">
            <span>Next: 12:00 PM / 7:00 PM</span>
            <span className="text-neutral-400 font-mono">
              {status?.automation.status === 'running' ? 'Auto-Schedule' : 'Manual'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-neutral-800/80 space-y-2 text-xs">
        <div className="flex items-center justify-between text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-neutral-500" />
            <span>Adam Voice</span>
          </span>
          <span className="text-emerald-400 font-medium text-[11px]">Authorized</span>
        </div>
        <div className="text-[11px] text-neutral-500">
          ShortForge AI v2.4 · 1080x1920 MP4
        </div>
      </div>
    </aside>
  );
};
