import React from 'react';
import {
  ListOrdered,
  Clock,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Play,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { VideoItem, AppStatus } from '../types';
import { api } from '../api';

interface QueuePageProps {
  videos: VideoItem[];
  status: AppStatus | null;
  onRefresh: () => void;
  onOpenVideo: (video: VideoItem) => void;
  onSelectTab: (tab: string) => void;
}

export const QueuePage: React.FC<QueuePageProps> = ({
  videos,
  status,
  onRefresh,
  onOpenVideo,
  onSelectTab,
}) => {
  const waitingOrActive = videos.filter(
    (v) => v.status === 'Waiting' || v.status === 'Generating' || v.status === 'Rendering'
  );
  const completedOrFailed = videos.filter(
    (v) => v.status === 'Ready' || v.status === 'Scheduled' || v.status === 'Published' || v.status === 'Failed'
  );

  const handleRetry = async (video: VideoItem) => {
    try {
      await api.regenerateVideo(video.id);
      onRefresh();
    } catch (e: any) {
      alert(`Retry failed: ${e.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Cancel and remove this video from queue?')) {
      try {
        await api.deleteVideo(id);
        onRefresh();
      } catch (e: any) {
        alert(`Delete failed: ${e.message}`);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display">
            Video Production Queue
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Persistent cloud queue processing video jobs with Gemini AI, Adam Voice, and FFmpeg
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => onSelectTab('generate')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors font-display"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Add More Videos</span>
          </button>
        </div>
      </div>

      {/* Queue Statistics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[11px] text-neutral-500 block">Waiting Jobs</span>
          <span className="text-xl font-bold text-amber-400 font-mono tabular-nums">
            {status?.counts.waiting || 0}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[11px] text-neutral-500 block">In Production</span>
          <span className="text-xl font-bold text-white font-mono tabular-nums">
            {status?.counts.inProgress || 0}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[11px] text-neutral-500 block">Cloud Concurrency</span>
          <span className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
            {status?.automation.concurrencyLimit || 2} Jobs
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[11px] text-neutral-500 block">Daily Automated</span>
          <span className="text-xl font-bold text-neutral-200 font-mono tabular-nums">
            {status?.counts.todayGenerated || 0} Generated
          </span>
        </div>
      </div>

      {/* Active & Waiting Jobs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider text-[11px]">
            In Progress & Waiting ({waitingOrActive.length})
          </h2>
          <span className="text-xs text-neutral-500">Autonomous Cloud Worker</span>
        </div>

        {waitingOrActive.length === 0 ? (
          <div className="p-8 rounded-2xl bg-neutral-900 border border-neutral-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/50 mx-auto" />
            <div className="text-sm font-medium text-white">Queue is clear</div>
            <p className="text-xs text-neutral-400">
              No videos currently waiting in the processing pipeline.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {waitingOrActive.map((video) => (
              <div
                key={video.id}
                className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                          video.status === 'Generating' || video.status === 'Rendering'
                            ? 'bg-amber-400/20 text-amber-300'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {video.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-neutral-400">·</span>
                      <span className="text-xs font-semibold text-neutral-300">{video.niche}</span>
                      <span className="text-xs text-neutral-400">·</span>
                      <span className="text-xs font-mono text-neutral-400">{video.durationTarget}s</span>
                      <span className="text-xs text-neutral-400">·</span>
                      <span className="text-xs text-neutral-400">{video.voiceName}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white truncate">{video.title}</h3>
                    <p className="text-xs text-neutral-400">{video.topic}</p>
                  </div>

                  <button
                    onClick={() => handleDelete(video.id)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors shrink-0"
                    title="Cancel Job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 text-[11px] truncate pr-2">
                      {video.statusMessage || 'Queued in production pipeline...'}
                    </span>
                    <span className="font-mono text-amber-400 font-semibold text-[11px] shrink-0">
                      {video.progress}%
                    </span>
                  </div>

                  <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-300"
                      style={{ width: `${Math.max(5, video.progress)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed & Failed History */}
      <div className="space-y-3 pt-4 border-t border-neutral-800/80">
        <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider text-[11px]">
          Recently Processed Jobs ({completedOrFailed.length})
        </h2>

        <div className="space-y-2">
          {completedOrFailed.slice(0, 8).map((video) => (
            <div
              key={video.id}
              className="p-3 rounded-xl bg-neutral-900 border border-neutral-800/80 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    video.status === 'Ready' || video.status === 'Published' || video.status === 'Scheduled'
                      ? 'bg-emerald-400'
                      : 'bg-red-400'
                  }`}
                />
                <div className="truncate">
                  <div className="font-semibold text-white truncate">{video.title}</div>
                  <div className="text-[11px] text-neutral-500">
                    {video.niche} · {video.durationTarget}s · {video.statusMessage || video.status}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {video.status === 'Failed' && (
                  <button
                    onClick={() => handleRetry(video)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 text-amber-300 hover:bg-neutral-700 font-medium text-[11px]"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                )}

                <button
                  onClick={() => onOpenVideo(video)}
                  className="px-2.5 py-1 rounded bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 font-medium text-[11px]"
                >
                  View Video
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
