import React from 'react';
import {
  Sparkles,
  Youtube,
  Play,
  RotateCw,
  Wand2,
  Sliders,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ConnectedChannel, AutomationSettings } from '../types';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  channel: ConnectedChannel;
  automation: AutomationSettings;
  onOpenWizard: () => void;
  onOpenUsage: () => void;
  onQuickGenerate: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  channel,
  automation,
  onOpenWizard,
  onOpenUsage,
  onQuickGenerate,
}) => {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-4 md:gap-8 px-4 md:px-6 py-3 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center text-neutral-950 font-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-neutral-950 fill-neutral-950" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 font-display">
              ShortForge <span className="text-amber-400">AI</span>
            </span>
          </div>
        </button>

        {/* Small Automation State Indicator */}
        <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-neutral-800 text-xs">
          <span className="text-neutral-400">Cloud Automation:</span>
          <span
            className={`font-medium ${
              automation.status === 'running'
                ? 'text-emerald-400'
                : automation.status === 'paused'
                ? 'text-amber-400'
                : 'text-neutral-500'
            }`}
          >
            {automation.status === 'running'
              ? 'Active (24/7 Cloud)'
              : automation.status === 'paused'
              ? 'Paused'
              : 'Off'}
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links (Desktop) */}
      <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-neutral-400">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            currentTab === 'dashboard' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onSelectTab('generate')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            currentTab === 'generate' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Generate
        </button>
        <button
          onClick={() => onSelectTab('employees')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white flex items-center gap-1.5 ${
            currentTab === 'employees' ? 'text-purple-400 font-semibold' : 'text-neutral-300'
          }`}
        >
          <span>AI Team</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
            Claude
          </span>
        </button>
        <button
          onClick={() => onSelectTab('queue')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            currentTab === 'queue' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Video Queue
        </button>
        <button
          onClick={() => onSelectTab('library')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            currentTab === 'library' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Library
        </button>
        <button
          onClick={() => onSelectTab('youtube')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            currentTab === 'youtube' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          YouTube
        </button>
        <button
          onClick={() => onSelectTab('automation')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            currentTab === 'automation' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Automation
        </button>
        <button
          onClick={() => onSelectTab('analytics')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            currentTab === 'analytics' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => onSelectTab('settings')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            currentTab === 'settings' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Settings
        </button>
      </nav>

      {/* Zone 3: Actions & Channel Status */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Connected YouTube Channel Tag */}
        <button
          onClick={() => onSelectTab('youtube')}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 text-xs transition-colors"
          title={channel.connected ? `Connected: ${channel.channelTitle}` : 'Connect your YouTube Channel'}
        >
          <Youtube className={`w-3.5 h-3.5 ${channel.connected ? 'text-red-500' : 'text-neutral-500'}`} />
          <span className="hidden sm:inline max-w-[120px] truncate text-neutral-200 font-medium">
            {channel.connected ? channel.channelTitle : 'Connect Channel'}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              channel.connected ? 'bg-emerald-400' : 'bg-neutral-600'
            }`}
          />
        </button>

        {/* Quota & Resource Usage trigger */}
        <button
          onClick={onOpenUsage}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          title="View Quotas and Cloud Engine limits"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Quotas</span>
        </button>

        {/* Wizard trigger */}
        <button
          onClick={onOpenWizard}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
          title="Open Setup Wizard"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Setup Wizard</span>
        </button>

        {/* Primary Action Button */}
        <button
          onClick={onQuickGenerate}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm shadow-amber-400/20 transition-all active:scale-95 whitespace-nowrap"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Create Short</span>
        </button>
      </div>
    </header>
  );
};
