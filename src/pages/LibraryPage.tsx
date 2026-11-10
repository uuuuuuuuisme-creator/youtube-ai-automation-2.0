import React, { useState } from 'react';
import {
  Film,
  Search,
  Filter,
  Download,
  Play,
  RotateCw,
  Trash2,
  Youtube,
  ExternalLink,
  Upload,
  Calendar,
} from 'lucide-react';
import { VideoItem } from '../types';
import { api } from '../api';

interface LibraryPageProps {
  videos: VideoItem[];
  onOpenVideo: (video: VideoItem) => void;
  onRefresh: () => void;
  onUploadNow: (video: VideoItem) => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  videos,
  onOpenVideo,
  onRefresh,
  onUploadNow,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [nicheFilter, setNicheFilter] = useState('all');

  const filtered = videos.filter((v) => {
    if (statusFilter !== 'all' && v.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (nicheFilter !== 'all' && v.niche.toLowerCase() !== nicheFilter.toLowerCase()) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return v.title.toLowerCase().includes(q) || v.topic.toLowerCase().includes(q);
    }
    return true;
  });

  const niches = Array.from(new Set(videos.map((v) => v.niche).filter(Boolean)));

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this video and rendered MP4?')) {
      try {
        await api.deleteVideo(id);
        onRefresh();
      } catch (err: any) {
        alert(`Delete failed: ${err.message}`);
      }
    }
  };

  const handleRegenerate = async (e: React.MouseEvent, video: VideoItem) => {
    e.stopPropagation();
    try {
      await api.regenerateVideo(video.id);
      onRefresh();
    } catch (err: any) {
      alert(`Regenerate failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display">
            Video Library
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            {videos.length} YouTube Shorts produced in 1080×1920 MP4 format
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh Library</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by title, topic, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Status segmented buttons */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-neutral-950 rounded-lg text-xs font-medium">
          {['all', 'ready', 'scheduled', 'published', 'waiting', 'failed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md transition-colors capitalize whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-amber-400 text-neutral-950 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Niche selector */}
        {niches.length > 0 && (
          <select
            value={nicheFilter}
            onChange={(e) => setNicheFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Niches</option>
            {niches.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Videos Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-2xl bg-neutral-900 border border-neutral-800 text-center space-y-2">
          <Film className="w-8 h-8 text-neutral-600 mx-auto" />
          <div className="text-sm font-semibold text-white">No videos found</div>
          <p className="text-xs text-neutral-400">
            No video records match the selected filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map((video) => (
            <div
              key={video.id}
              onClick={() => onOpenVideo(video)}
              className="group rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 overflow-hidden cursor-pointer transition-all flex flex-col justify-between"
            >
              {/* 9:16 Vertical Thumbnail */}
              <div className="relative aspect-[9/16] bg-neutral-950 overflow-hidden">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-neutral-950">
                    <Film className="w-6 h-6 text-neutral-600 mb-1" />
                    <span className="text-[10px] font-mono text-neutral-400">{video.status}</span>
                  </div>
                )}

                {/* Play Hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Duration */}
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                  {video.durationTarget}s
                </span>

                {/* Status Badge */}
                <span
                  className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium backdrop-blur-md ${
                    video.status === 'Ready' || video.status === 'Published'
                      ? 'bg-emerald-500/80 text-white'
                      : video.status === 'Failed'
                      ? 'bg-red-500/80 text-white'
                      : 'bg-amber-500/80 text-neutral-950'
                  }`}
                >
                  {video.status}
                </span>

                {video.youtubeStatus && video.youtubeStatus !== 'None' && (
                  <span className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-red-500">
                    <Youtube className="w-3 h-3" />
                  </span>
                )}
              </div>

              {/* Video Card Details */}
              <div className="p-3 space-y-2">
                <div>
                  <h3 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                    {video.title}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-0.5">
                    <span>{video.niche}</span>
                    <span className="font-mono text-neutral-500">
                      {new Date(video.createdAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-xs">
                  {video.videoUrl ? (
                    <a
                      href={`/api/videos/${video.id}/download`}
                      download
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 transition-colors"
                      title="Download MP4"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleRegenerate(e, video)}
                      className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                      title="Regenerate"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, video.id)}
                      className="p-1 rounded text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
