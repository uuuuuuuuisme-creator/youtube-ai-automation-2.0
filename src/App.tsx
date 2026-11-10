import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { SetupWizard } from './components/SetupWizard';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { QuotaUsageModal } from './components/QuotaUsageModal';

import { DashboardPage } from './pages/DashboardPage';
import { GeneratePage } from './pages/GeneratePage';
import { QueuePage } from './pages/QueuePage';
import { LibraryPage } from './pages/LibraryPage';
import { YouTubePage } from './pages/YouTubePage';
import { AutomationPage } from './pages/AutomationPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { EmployeesPage } from './pages/EmployeesPage';

import { AppStatus, AppSettings, VideoItem } from './types';
import { api } from './api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  const [showWizard, setShowWizard] = useState(false);
  const [showUsage, setShowUsage] = useState(false);

  const fetchAppData = useCallback(async () => {
    try {
      const [statusRes, videosRes, settingsRes] = await Promise.all([
        api.getStatus(),
        api.getVideos(),
        api.getSettings(),
      ]);

      setStatus(statusRes);
      setVideos(videosRes);
      setSettings(settingsRes);

      // If viewing a video that is currently rendering, update its state in the modal
      setSelectedVideo((prev) => {
        if (!prev) return null;
        const fresh = videosRes.find((v) => v.id === prev.id);
        return fresh || prev;
      });

      // Requirement #19: First-Time Setup Wizard on initial open
      if (!settingsRes.firstTimeSetupCompleted) {
        setShowWizard(true);
      }
    } catch (err) {
      console.error('[ShortForge] Error loading state:', err);
    }
  }, []);

  useEffect(() => {
    fetchAppData();
    // Poll every 6 seconds to update queue progress and video rendering state live
    const interval = setInterval(fetchAppData, 6000);
    return () => clearInterval(interval);
  }, [fetchAppData]);

  const handleUploadNow = async (video: VideoItem) => {
    try {
      const res = await api.uploadVideo(video.id);
      alert(`YouTube Upload response: ${res.uploadResult?.status} (${res.uploadResult?.youtubeUrl})`);
      fetchAppData();
    } catch (e: any) {
      alert(`Upload error: ${e.message}`);
    }
  };

  const handleRegenerate = async (video: VideoItem) => {
    try {
      await api.regenerateVideo(video.id);
      fetchAppData();
    } catch (e: any) {
      alert(`Regeneration error: ${e.message}`);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      await api.deleteVideo(id);
      fetchAppData();
    } catch (e: any) {
      alert(`Delete error: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-300">
      {/* Top Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        channel={status?.channel || { connected: false }}
        automation={status?.automation || { enabled: false, status: 'stopped', dailyTarget: 2, uploadTimes: [], timezone: '', defaultNiche: '', defaultVideoLength: 60, autoPublishMode: 'scheduled', requireApprovalBeforeUpload: false, todayGeneratedCount: 0, todayPublishedCount: 0, concurrencyLimit: 2 }}
        onOpenWizard={() => setShowWizard(true)}
        onOpenUsage={() => setShowUsage(true)}
        onQuickGenerate={() => setCurrentTab('generate')}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          status={status}
        />

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {currentTab === 'dashboard' && (
            <DashboardPage
              status={status}
              recentVideos={videos}
              onSelectTab={setCurrentTab}
              onOpenVideo={setSelectedVideo}
              onRefresh={fetchAppData}
            />
          )}

          {currentTab === 'generate' && (
            <GeneratePage
              settings={settings}
              onJobCreated={fetchAppData}
              onSelectTab={setCurrentTab}
            />
          )}

          {currentTab === 'employees' && (
            <EmployeesPage
              onSelectTab={setCurrentTab}
            />
          )}

          {currentTab === 'queue' && (
            <QueuePage
              videos={videos}
              status={status}
              onRefresh={fetchAppData}
              onOpenVideo={setSelectedVideo}
              onSelectTab={setCurrentTab}
            />
          )}

          {currentTab === 'library' && (
            <LibraryPage
              videos={videos}
              onOpenVideo={setSelectedVideo}
              onRefresh={fetchAppData}
              onUploadNow={handleUploadNow}
            />
          )}

          {currentTab === 'youtube' && (
            <YouTubePage
              channel={status?.channel || { connected: false }}
              videos={videos}
              settings={settings}
              onRefresh={fetchAppData}
              onOpenVideo={setSelectedVideo}
            />
          )}

          {currentTab === 'automation' && (
            <AutomationPage
              automation={status?.automation || { enabled: false, status: 'stopped', dailyTarget: 2, uploadTimes: [], timezone: '', defaultNiche: '', defaultVideoLength: 60, autoPublishMode: 'scheduled', requireApprovalBeforeUpload: false, todayGeneratedCount: 0, todayPublishedCount: 0, concurrencyLimit: 2 }}
              status={status}
              onRefresh={fetchAppData}
              onSelectTab={setCurrentTab}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsPage channel={status?.channel || { connected: false }} />
          )}

          {currentTab === 'settings' && (
            <SettingsPage
              settings={settings}
              onRefresh={fetchAppData}
              onOpenWizard={() => setShowWizard(true)}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        status={status}
      />

      {/* 9:16 Video Player Modal */}
      <VideoPlayerModal
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
        onUpload={handleUploadNow}
        onRegenerate={handleRegenerate}
        onDelete={handleDeleteVideo}
      />

      {/* 7-Step Setup Wizard Modal */}
      {settings && (
        <SetupWizard
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          onCompleted={fetchAppData}
          initialSettings={settings}
        />
      )}

      {/* Transparency / Engine Quotas Modal */}
      <QuotaUsageModal
        isOpen={showUsage}
        onClose={() => setShowUsage(false)}
      />
    </div>
  );
}
