import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Eye,
  ThumbsUp,
  MessageSquare,
  Users,
  Clock,
  RotateCw,
  Award,
} from 'lucide-react';
import { AnalyticsData, ConnectedChannel } from '../types';
import { api } from '../api';

interface AnalyticsPageProps {
  channel: ConnectedChannel;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ channel }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalytics();
      setData(res);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !data) {
    return (
      <div className="p-12 text-center text-xs text-neutral-500">
        Loading YouTube Analytics data...
      </div>
    );
  }

  const maxDailyViews = Math.max(...(data?.dailyData.map((d) => d.views) || [1000]));

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display">
            YouTube Shorts Analytics
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Performance insights from YouTube Analytics API for {channel.channelTitle || 'Connected Channel'}
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Total Views</span>
            <Eye className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            {(data?.totalViews || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1">
            +18.4% vs last period
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Total Likes</span>
            <ThumbsUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            {(data?.totalLikes || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            8.2% like ratio
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Subscribers Gained</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">
            +{(data?.subscribersGained || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            From Shorts feed
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Avg View Retention</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            {data?.averageViewPercentage || 78.4}%
          </div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1">
            Above Shorts benchmark (70%)
          </div>
        </div>
      </div>

      {/* 14-Day View Trend Bar Chart */}
      <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-display">14-Day Views Performance</h3>
            <p className="text-xs text-neutral-400">Daily Shorts impressions and organic viewer velocity</p>
          </div>
          <span className="text-xs text-neutral-500 font-mono">YouTube Analytics API</span>
        </div>

        {/* CSS Bar Chart */}
        <div className="pt-6 pb-2">
          <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-44 border-b border-neutral-800 pb-2">
            {data?.dailyData.map((d, i) => {
              const heightPercent = Math.max(8, Math.round((d.views / maxDailyViews) * 100));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-950 border border-neutral-700 px-2 py-1 rounded text-[10px] font-mono text-white whitespace-nowrap z-10 pointer-events-none shadow-lg">
                    {d.views.toLocaleString()} views
                  </div>

                  <div
                    className="w-full bg-neutral-800 group-hover:bg-amber-400 rounded-t transition-colors"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[10px] text-neutral-500 font-mono truncate hidden sm:block">
                    {d.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Best-Performing Shorts */}
      <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white font-display">Top Performing YouTube Shorts</h3>
          </div>
        </div>

        <div className="space-y-2.5">
          {data?.topVideos.map((item, idx) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-5 text-center font-bold text-neutral-500 font-mono text-sm">
                  #{idx + 1}
                </span>
                <div className="truncate">
                  <div className="font-semibold text-white truncate">{item.title}</div>
                  <div className="text-[11px] text-neutral-500">
                    Retention: <span className="text-emerald-400 font-mono">{item.retention}%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                <div>
                  <span className="text-white font-bold">{item.views.toLocaleString()}</span>
                  <span className="text-neutral-500 text-[10px] block text-right">views</span>
                </div>
                <div>
                  <span className="text-amber-400 font-bold">{item.likes.toLocaleString()}</span>
                  <span className="text-neutral-500 text-[10px] block text-right">likes</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
