import React, { useState } from 'react';
import {
  Settings,
  Volume2,
  Key,
  Shield,
  HardDrive,
  RotateCw,
  Wand2,
  Check,
  AlertCircle,
  Play,
  ExternalLink,
} from 'lucide-react';
import { AppSettings, VoiceSettings } from '../types';
import { api } from '../api';

interface SettingsPageProps {
  settings: AppSettings | null;
  onRefresh: () => void;
  onOpenWizard: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onRefresh,
  onOpenWizard,
}) => {
  const [saving, setSaving] = useState(false);

  // Voice state
  const [provider, setProvider] = useState<VoiceSettings['provider']>(
    settings?.voice?.provider || 'adam_voice_authorized'
  );
  const [voiceStyle, setVoiceStyle] = useState<VoiceSettings['voiceStyle']>(
    settings?.voice?.voiceStyle || 'deep_storyteller'
  );
  const [voiceSpeed, setVoiceSpeed] = useState(settings?.voice?.speed || 1.0);
  const [voiceVolume, setVoiceVolume] = useState(settings?.voice?.volume || 100);
  const [isAuthorized, setIsAuthorized] = useState(settings?.voice?.isAuthorized ?? true);
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState(settings?.voice?.elevenLabsApiKey || '');
  const [voiceId, setVoiceId] = useState(settings?.voice?.voiceId || 'pNInz6obpgDQGcFmaJgB');

  // Stock Visual Keys
  const [pexelsApiKey, setPexelsApiKey] = useState(settings?.pexelsApiKey || '');
  const [pixabayApiKey, setPixabayApiKey] = useState(settings?.pixabayApiKey || '');

  // Concurrency
  const [concurrency, setConcurrency] = useState(settings?.automation?.concurrencyLimit || 2);

  const [previewingVoice, setPreviewingVoice] = useState(false);

  const handlePreviewVoice = async () => {
    try {
      setPreviewingVoice(true);
      const res = await api.previewVoice({
        text: 'This is a test of the authorized Adam Voice narration profile with current speed and volume settings.',
        speed: voiceSpeed,
        volume: voiceVolume,
        voiceStyle,
      });
      const audio = new Audio(res.audioUrl);
      audio.play();
    } catch (e: any) {
      alert(`Voice preview failed: ${e.message}`);
    } finally {
      setPreviewingVoice(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateSettings({
        voice: {
          provider,
          voiceName: 'Adam Voice',
          voiceStyle,
          speed: voiceSpeed,
          volume: voiceVolume,
          pitch: 1.0,
          isAuthorized,
          voiceId: voiceId.trim() || undefined,
          elevenLabsApiKey: elevenLabsApiKey.trim() || undefined,
          authorizationNotes: 'Owner authorization confirmed on ShortForge AI',
        },
        pexelsApiKey: pexelsApiKey.trim() || undefined,
        pixabayApiKey: pixabayApiKey.trim() || undefined,
        automation: {
          ...settings?.automation!,
          concurrencyLimit: parseInt(concurrency.toString(), 10) || 2,
        },
      });
      alert('Settings saved successfully!');
      onRefresh();
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display">
            Platform Settings
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Configure Adam Voice narration, copyright-safe media providers, and engine concurrency
          </p>
        </div>

        <button
          onClick={onOpenWizard}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Launch Setup Wizard</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Adam Voice Authorization & Configuration */}
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white font-display">Adam Voice Narration Engine</h2>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-400">
              {isAuthorized ? 'LICENSED & AUTHORIZED' : 'UNAUTHORIZED'}
            </span>
          </div>

          <p className="text-neutral-400 leading-relaxed">
            Adam Voice is the default authoritative narration voice for ShortForge YouTube Shorts. Per platform policy, Adam Voice may only be used when explicitly authorized by the voice owner.
          </p>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="settings-auth"
              checked={isAuthorized}
              onChange={(e) => setIsAuthorized(e.target.checked)}
              className="mt-0.5 rounded text-amber-400 focus:ring-amber-400"
            />
            <label htmlFor="settings-auth" className="cursor-pointer">
              <span className="font-semibold block">Explicit Voice Owner Authorization</span>
              I confirm that the voice owner has authorized the use of Adam Voice for this channel's YouTube Shorts narration.
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-neutral-400 font-medium block mb-1">Narration Engine Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as any)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
              >
                <option value="adam_voice_authorized">ShortForge Native Narration Engine (Unlimited)</option>
                <option value="elevenlabs">ElevenLabs Custom Voice API (Voice Cloning / Adam ID)</option>
              </select>
            </div>

            <div>
              <label className="text-neutral-400 font-medium block mb-1">Default Speaking Style</label>
              <select
                value={voiceStyle}
                onChange={(e) => setVoiceStyle(e.target.value as any)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
              >
                <option value="deep_storyteller">Deep Storyteller (Recommended)</option>
                <option value="dramatic">Dramatic Suspense</option>
                <option value="documentary">Documentary Authority</option>
                <option value="energetic">High Energy Viral</option>
              </select>
            </div>
          </div>

          {provider === 'elevenlabs' && (
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div>
                <label className="text-neutral-400 font-medium block mb-1">ElevenLabs API Key</label>
                <input
                  type="password"
                  value={elevenLabsApiKey}
                  onChange={(e) => setElevenLabsApiKey(e.target.value)}
                  placeholder="xi-api-key-..."
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-neutral-400 font-medium block mb-1">Authorized Adam Voice ID</label>
                <input
                  type="text"
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  placeholder="pNInz6obpgDQGcFmaJgB"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                />
                <span className="text-[11px] text-neutral-500 mt-1 block">
                  Default Adam voice ID: <code>pNInz6obpgDQGcFmaJgB</code>
                </span>
              </div>
            </div>
          )}

          {/* Speed & Volume */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Default Narration Speed</span>
                <span className="font-mono text-amber-400 font-semibold">{voiceSpeed}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={voiceSpeed}
                onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Default Narration Volume</span>
                <span className="font-mono text-amber-400 font-semibold">{voiceVolume}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={voiceVolume}
                onChange={(e) => setVoiceVolume(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handlePreviewVoice}
            disabled={previewingVoice}
            className="w-full py-2 px-3 rounded-lg bg-neutral-950 border border-neutral-700 hover:bg-neutral-800 text-neutral-200 font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{previewingVoice ? 'Generating Preview...' : 'Test Current Voice Settings'}</span>
          </button>
        </div>

        {/* Copyright-Safe Stock Visual Media APIs */}
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white font-display">Copyright-Safe Visual Sources</h2>
          </div>

          <p className="text-neutral-400 leading-relaxed">
            ShortForge strictly enforces copyright safety. Connect free stock media API keys (Pexels / Pixabay) to retrieve portrait stock footage matching scene keywords, or rely on our built-in 1080×1920 cinematic procedural generator.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-neutral-400 font-medium block mb-1">Pexels API Key (Free)</label>
              <input
                type="password"
                value={pexelsApiKey}
                onChange={(e) => setPexelsApiKey(e.target.value)}
                placeholder="Optional Pexels API key..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-neutral-400 font-medium block mb-1">Pixabay API Key (Free)</label>
              <input
                type="password"
                value={pixabayApiKey}
                onChange={(e) => setPixabayApiKey(e.target.value)}
                placeholder="Optional Pixabay API key..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Engine Performance & Concurrency */}
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white font-display">Cloud Concurrency & Processing Limits</h2>
          </div>

          <div>
            <label className="text-neutral-400 font-medium block mb-1">
              Parallel Video Production Concurrency
            </label>
            <select
              value={concurrency}
              onChange={(e) => setConcurrency(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
            >
              <option value={1}>1 Job at a time (Light CPU)</option>
              <option value={2}>2 Parallel Jobs (Recommended for Cloud Run)</option>
              <option value={4}>4 Parallel Jobs (High Throughput)</option>
            </select>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 px-6 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors font-display shadow-lg shadow-amber-400/20"
        >
          {saving ? 'Saving...' : 'Save Platform Settings'}
        </button>
      </form>
    </div>
  );
};
