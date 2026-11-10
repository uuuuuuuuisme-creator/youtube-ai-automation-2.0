import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  Play,
  RotateCw,
  Trash2,
  Copy,
  Check,
  Youtube,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { VideoItem } from '../types';

interface VideoPlayerModalProps {
  video: VideoItem | null;
  onClose: () => void;
  onUpload: (video: VideoItem) => void;
  onRegenerate: (video: VideoItem) => void;
  onDelete: (id: string) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  onClose,
  onUpload,
  onRegenerate,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'script' | 'scenes' | 'metadata'>('video');
  const [copied, setCopied] = useState(false);

  if (!video) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(`${video.title}\n\nHOOK:\n${video.hook}\n\nSCRIPT:\n${video.script}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5 truncate pr-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono shrink-0">
              {video.durationTarget}s · 9:16
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white truncate font-display">
              {video.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Split: 9:16 Video Player on left, Tabs on right */}
        <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto flex-1">
          {/* Left Column: 9:16 Video Viewport */}
          <div className="md:col-span-5 bg-neutral-950 p-4 sm:p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-neutral-800">
            <div className="relative w-full max-w-[280px] aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl flex items-center justify-center">
              {video.videoUrl ? (
                <video
                  src={video.videoUrl}
                  controls
                  playsInline
                  autoPlay
                  loop
                  poster={video.thumbnailUrl}
                  className="w-full h-full object-cover"
                />
              ) : video.thumbnailUrl ? (
                <div className="relative w-full h-full">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4 text-center">
                    <span className="text-xs text-amber-300 font-mono mb-2">Rendering in progress</span>
                    <span className="text-xs text-neutral-300">{video.statusMessage}</span>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-neutral-500 text-xs">
                  <Sparkles className="w-8 h-8 text-amber-400/40 mx-auto mb-2 animate-pulse" />
                  <span>{video.statusMessage || 'Preparing video...'}</span>
                </div>
              )}
            </div>

            {/* Quick Video Actions */}
            <div className="w-full max-w-[280px] mt-4 flex items-center gap-2">
              {video.videoUrl && (
                <a
                  href={`/api/videos/${video.id}/download`}
                  download
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download MP4</span>
                </a>
              )}

              {video.youtubeUrl ? (
                <a
                  href={video.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                >
                  <Youtube className="w-3.5 h-3.5" />
                  <span>YouTube</span>
                </a>
              ) : (
                <button
                  onClick={() => onUpload(video)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-red-400" />
                  <span>Upload Now</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Tabbed Inspector */}
          <div className="md:col-span-7 flex flex-col bg-neutral-900 overflow-hidden">
            {/* Tab navigation */}
            <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-neutral-800 overflow-x-auto shrink-0">
              <button
                onClick={() => setActiveTab('video')}
                className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'video'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('script')}
                className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'script'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                Script & Hook
              </button>
              <button
                onClick={() => setActiveTab('scenes')}
                className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'scenes'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                Scenes ({video.scenes?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('metadata')}
                className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'metadata'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                YouTube Metadata
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {activeTab === 'video' && (
                <div className="space-y-4">
                  {/* Status Card */}
                  <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-400">Production Status</span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded font-mono ${
                          video.status === 'Ready' || video.status === 'Published'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : video.status === 'Failed'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {video.status}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-300">{video.statusMessage || 'Job complete.'}</div>
                  </div>

                  {/* Metadata Specs */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-500 block">Niche / Topic</span>
                      <span className="font-semibold text-white mt-0.5 block">{video.niche}</span>
                      <span className="text-neutral-400 text-[11px] truncate block">{video.topic}</span>
                    </div>

                    <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-500 block">Voice Narrator</span>
                      <span className="font-semibold text-white mt-0.5 block">{video.voiceName}</span>
                      <span className="text-neutral-400 text-[11px] block">{video.voiceStyle} · {video.voiceSpeed}x</span>
                    </div>

                    <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-500 block">Resolution & Ratio</span>
                      <span className="font-mono text-white mt-0.5 block">1080 × 1920 (9:16)</span>
                      <span className="text-neutral-400 text-[11px] block">FFmpeg H.264 / AAC</span>
                    </div>

                    <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                      <span className="text-neutral-500 block">YouTube Publishing</span>
                      <span className="font-semibold text-white mt-0.5 block">
                        {video.youtubeStatus || 'Not uploaded'}
                      </span>
                      {video.scheduledTime && (
                        <span className="text-amber-400 text-[11px] block truncate">
                          Scheduled: {new Date(video.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hook preview */}
                  <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>3-Second Opening Hook</span>
                    </div>
                    <p className="text-sm text-neutral-200 italic font-serif">"{video.hook}"</p>
                  </div>
                </div>
              )}

              {activeTab === 'script' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-400">Complete Narration Voiceover</span>
                    <button
                      onClick={handleCopyScript}
                      className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Script'}</span>
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-200 leading-relaxed font-sans whitespace-pre-wrap">
                    {video.script || 'Script generation in progress...'}
                  </div>
                </div>
              )}

              {activeTab === 'scenes' && (
                <div className="space-y-3">
                  {video.scenes?.map((scene, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-amber-400 font-mono">
                          Scene {scene.sceneNumber} · {scene.durationSeconds}s
                        </span>
                        <span className="text-neutral-500 text-[11px] font-mono capitalize">
                          Camera: {scene.cameraMovement}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-300">
                        <strong className="text-neutral-400 font-normal">Narration: </strong>
                        {scene.narrationText}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        <strong className="text-neutral-400 font-normal">Visual Prompt: </strong>
                        {scene.visualPrompt}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'metadata' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-neutral-400 font-semibold block mb-1">Title</label>
                    <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white font-medium">
                      {video.title}
                    </div>
                  </div>

                  <div>
                    <label className="text-neutral-400 font-semibold block mb-1">Description</label>
                    <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 whitespace-pre-wrap">
                      {video.description || `${video.title}\n\nSubscribe for more!`}
                    </div>
                  </div>

                  <div>
                    <label className="text-neutral-400 font-semibold block mb-1">Hashtags</label>
                    <div className="flex flex-wrap gap-1.5">
                      {video.hashtags?.map((h, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-amber-300 font-mono text-[11px]">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="px-4 sm:px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  if (confirm(`Delete video "${video.title}"?`)) {
                    onDelete(video.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onRegenerate(video);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
