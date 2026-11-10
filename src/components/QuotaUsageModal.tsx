import React, { useEffect, useState } from 'react';
import { X, Cpu, HardDrive, DollarSign, Activity, CheckCircle, ShieldAlert } from 'lucide-react';
import { api } from '../api';

interface QuotaUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuotaUsageModal: React.FC<QuotaUsageModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      api.getSystemUsage().then(setData).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white font-display">Engine Quotas & Transparency</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
            <span className="text-neutral-400 uppercase tracking-wider font-semibold text-[10px]">
              Unlimited Queue Policy
            </span>
            <p className="text-neutral-300 leading-relaxed">
              ShortForge AI imposes <strong>zero arbitrary artificial software limits</strong> on the number of videos you can request or queue. Actual production throughput is governed by real cloud environment resources and API quota limits outlined below.
            </p>
          </div>

          {/* Engine Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
              <div className="flex items-center gap-2 text-neutral-200 font-semibold">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>Gemini 3.8 Flash AI</span>
              </div>
              <div className="text-neutral-400">
                Model: <span className="text-white font-mono">gemini-3.8-flash</span>
              </div>
              <div className="text-neutral-400">
                Quota: <span className="text-emerald-400 font-mono">1,500 requests/day</span>
              </div>
              <div className="text-[11px] text-neutral-500">
                High-throughput scriptwriting, hook generation, and verified fact checking.
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
              <div className="flex items-center gap-2 text-neutral-200 font-semibold">
                <HardDrive className="w-4 h-4 text-blue-400" />
                <span>Native FFmpeg Engine</span>
              </div>
              <div className="text-neutral-400">
                Binary: <span className="text-white font-mono">/usr/bin/ffmpeg</span>
              </div>
              <div className="text-neutral-400">
                Resolution: <span className="text-emerald-400 font-mono">1080 × 1920 (9:16)</span>
              </div>
              <div className="text-[11px] text-neutral-500">
                Full-motion vertical MP4 encoding with burned-in dynamic animated captions.
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
              <div className="flex items-center gap-2 text-neutral-200 font-semibold">
                <Activity className="w-4 h-4 text-red-500" />
                <span>YouTube API v3</span>
              </div>
              <div className="text-neutral-400">
                Quota Pool: <span className="text-white font-mono">10,000 units/day</span>
              </div>
              <div className="text-neutral-400">
                Upload Cost: <span className="text-amber-400 font-mono">~1,600 units/upload</span>
              </div>
              <div className="text-[11px] text-neutral-500">
                Supports ~6 daily uploads under standard Google quota; default is 2 Shorts/day.
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
              <div className="flex items-center gap-2 text-neutral-200 font-semibold">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Cost Architecture</span>
              </div>
              <div className="text-neutral-400">
                Current Cost: <span className="text-emerald-400 font-mono">$0 / Free Tier</span>
              </div>
              <div className="text-neutral-400">
                Optimization: <span className="text-white font-mono">Zero paid video APIs</span>
              </div>
              <div className="text-[11px] text-neutral-500">
                Uses copyright-safe visual assembly instead of $0.10/sec commercial AI video models.
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>
              Cloud automation executes continuously in the background on Google Cloud Run even when your browser or phone is closed.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
