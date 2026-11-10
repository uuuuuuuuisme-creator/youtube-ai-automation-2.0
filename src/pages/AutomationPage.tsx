import React, { useState } from 'react';
import {
  Cpu,
  Clock,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCw,
  Power,
  Sliders,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { AutomationSettings, AppStatus } from '../types';
import { api } from '../api';

interface AutomationPageProps {
  automation: AutomationSettings;
  status: AppStatus | null;
  onRefresh: () => void;
  onSelectTab: (tab: string) => void;
}

export const AutomationPage: React.FC<AutomationPageProps> = ({
  automation,
  status,
  onRefresh,
  onSelectTab,
}) => {
  const [updating, setUpdating] = useState(false);
  const [time1, setTime1] = useState(automation.uploadTimes?.[0] || '12:00');
  const [time2, setTime2] = useState(automation.uploadTimes?.[1] || '19:00');
  const [timezone, setTimezone] = useState(automation.timezone || 'America/New_York');
  const [niche, setNiche] = useState(automation.defaultNiche || 'Mystery');
  const [videoLength, setVideoLength] = useState(automation.defaultVideoLength || 60);
  const [autoPublishMode, setAutoPublishMode] = useState(automation.autoPublishMode || 'scheduled');

  const handleAction = async (action: 'enable' | 'pause' | 'resume' | 'stop') => {
    try {
      setUpdating(true);
      await api.controlAutomation(action);
      onRefresh();
    } catch (e: any) {
      alert(`Action error: ${e.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await api.controlAutomation('update_config', {
        uploadTimes: [time1, time2],
        timezone,
        niche,
        videoLength: parseInt(videoLength.toString(), 10),
      });

      await api.updateSettings({
        automation: {
          ...automation,
          autoPublishMode,
        },
      });

      alert('Cloud Automation configuration updated!');
      onRefresh();
    } catch (e: any) {
      alert(`Config error: ${e.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleGenerateNow = async (count: 1 | 2) => {
    try {
      setUpdating(true);
      await api.controlAutomation(count === 2 ? 'generate_2_now' : 'generate_now');
      onRefresh();
      onSelectTab('queue');
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight font-display">
          Cloud Automation Engine
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          Operates 24/7 in the cloud independent of phone, browser, or computer power states
        </p>
      </div>

      {/* Main Status & Controls Card */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                automation.status === 'running'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10'
                  : automation.status === 'paused'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400'
              }`}
            >
              <Cpu className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-display">
                  Autonomous 2-Shorts/Day Cloud Worker
                </h2>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                    automation.status === 'running'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : automation.status === 'paused'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {automation.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Background worker checks queue every 10 seconds, researches non-duplicate topics, and renders full MP4 videos.
              </p>
            </div>
          </div>

          {/* Master Toggle Buttons */}
          <div className="flex items-center gap-2">
            {automation.status === 'running' ? (
              <button
                onClick={() => handleAction('pause')}
                disabled={updating}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
              >
                Pause Automation
              </button>
            ) : (
              <button
                onClick={() => handleAction('enable')}
                disabled={updating}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors font-display shadow-md shadow-amber-400/20"
              >
                Enable Automation
              </button>
            )}

            {automation.status !== 'stopped' && (
              <button
                onClick={() => handleAction('stop')}
                disabled={updating}
                className="p-2 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 border border-neutral-700 transition-colors"
                title="Stop completely"
              >
                <Power className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Today's Publishing Progress */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-neutral-800/80 text-center text-xs">
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="text-[11px] text-neutral-500 block">Daily Target</span>
            <span className="text-lg font-bold text-white font-mono">2 Shorts/day</span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="text-[11px] text-neutral-500 block">Generated Today</span>
            <span className="text-lg font-bold text-amber-400 font-mono">
              {automation.todayGeneratedCount || 0}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="text-[11px] text-neutral-500 block">Published Today</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">
              {automation.todayPublishedCount || 0} / 2
            </span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
            <span className="text-[11px] text-neutral-500 block">Cloud Status</span>
            <span className="text-xs font-semibold text-neutral-300 font-mono">
              Cloud Run 24/7
            </span>
          </div>
        </div>
      </div>

      {/* Manual Instant Triggers */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
        <h3 className="text-sm font-bold text-white font-display">Instant Production Actions</h3>
        <p className="text-xs text-neutral-400">
          Trigger immediate video creation outside the regular automated daily timetable:
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleGenerateNow(1)}
            disabled={updating}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Generate 1 Video Now</span>
          </button>

          <button
            onClick={() => handleGenerateNow(2)}
            disabled={updating}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors font-display"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Generate 2 Videos Now</span>
          </button>
        </div>
      </div>

      {/* Daily Publishing Configuration Form */}
      <form onSubmit={handleSaveConfig} className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 text-xs">
        <h3 className="text-sm font-bold text-white font-display">Daily 2-Video Schedule Settings</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
            <label className="text-neutral-300 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Video 1 Scheduled Upload Time</span>
            </label>
            <input
              type="time"
              value={time1}
              onChange={(e) => setTime1(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
            />
            <span className="text-[11px] text-neutral-500 block">Default: 12:00 PM (Mid-day traffic)</span>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
            <label className="text-neutral-300 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Video 2 Scheduled Upload Time</span>
            </label>
            <input
              type="time"
              value={time2}
              onChange={(e) => setTime2(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
            />
            <span className="text-[11px] text-neutral-500 block">Default: 7:00 PM (Evening peak traffic)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-neutral-400 font-medium block mb-1">Timezone</label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-neutral-400 font-medium block mb-1">Default Daily Niche</label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
            >
              {[
                'Mystery',
                'History',
                'Science',
                'Space',
                'Geography',
                'Technology',
                'Interesting Facts',
                'Business',
                'Documentaries',
                'Psychology',
                'Unsolved Mysteries',
              ].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-neutral-400 font-medium block mb-1">Target Length</label>
            <select
              value={videoLength}
              onChange={(e) => setVideoLength(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
            >
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={45}>45 seconds</option>
              <option value={60}>60 seconds (Recommended)</option>
              <option value={90}>90 seconds</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-neutral-400 font-medium block mb-1">Publishing Mode</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'scheduled', label: 'Scheduled (Default)' },
              { id: 'private', label: 'Private (Review First)' },
              { id: 'unlisted', label: 'Unlisted' },
              { id: 'public', label: 'Public Release' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setAutoPublishMode(m.id as any)}
                className={`p-2.5 rounded-lg border text-left font-medium ${
                  autoPublishMode === m.id
                    ? 'bg-amber-400/10 border-amber-400 text-amber-300 font-semibold'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={updating}
          className="w-full py-2.5 px-4 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors font-display"
        >
          {updating ? 'Saving Configuration...' : 'Save Automation Schedule'}
        </button>
      </form>
    </div>
  );
};
