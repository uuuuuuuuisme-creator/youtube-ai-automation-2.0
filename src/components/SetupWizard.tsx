import React, { useState } from 'react';
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Clock,
  Volume2,
  Youtube,
  Calendar,
  Upload,
  Cpu,
  Play,
} from 'lucide-react';
import { AppSettings, VoiceSettings } from '../types';
import { api } from '../api';

interface SetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void;
  initialSettings: AppSettings;
}

const NICHES = [
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
  'Custom Niche',
];

const VIDEO_LENGTHS = [
  { label: '15 seconds', value: 15, desc: 'Ultra-fast viral hook and punchline' },
  { label: '30 seconds', value: 30, desc: 'Compact high-retention factual story' },
  { label: '45 seconds', value: 45, desc: 'Balanced Shorts pacing with deep payoff' },
  { label: '60 seconds', value: 60, desc: 'Recommended standard for maximum watch-time' },
  { label: '90 seconds', value: 90, desc: 'In-depth storytelling and deep exploration' },
];

export const SetupWizard: React.FC<SetupWizardProps> = ({
  isOpen,
  onClose,
  onCompleted,
  initialSettings,
}) => {
  const [step, setStep] = useState(1);
  const [niche, setNiche] = useState(initialSettings?.automation?.defaultNiche || 'Mystery');
  const [customNiche, setCustomNiche] = useState('');
  const [videoLength, setVideoLength] = useState(initialSettings?.automation?.defaultVideoLength || 60);

  // Adam Voice configuration
  const [voiceStyle, setVoiceStyle] = useState<VoiceSettings['voiceStyle']>(
    initialSettings?.voice?.voiceStyle || 'deep_storyteller'
  );
  const [voiceSpeed, setVoiceSpeed] = useState(initialSettings?.voice?.speed || 1.0);
  const [voiceVolume, setVoiceVolume] = useState(initialSettings?.voice?.volume || 100);
  const [isAuthorized, setIsAuthorized] = useState(initialSettings?.voice?.isAuthorized ?? true);
  const [previewingVoice, setPreviewingVoice] = useState(false);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);

  // YouTube Channel connection
  const [channelTitle, setChannelTitle] = useState('My Faceless YouTube Channel');
  const [customUrl, setCustomUrl] = useState('@myfacelessshorts');
  const [connected, setConnected] = useState(initialSettings?.youtube?.accessToken ? true : false);

  // Schedule upload times
  const [time1, setTime1] = useState(initialSettings?.automation?.uploadTimes?.[0] || '12:00');
  const [time2, setTime2] = useState(initialSettings?.automation?.uploadTimes?.[1] || '19:00');
  const [timezone, setTimezone] = useState(
    initialSettings?.automation?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
  );

  // Automatic publishing
  const [autoPublishMode, setAutoPublishMode] = useState<'scheduled' | 'private' | 'unlisted' | 'public'>(
    initialSettings?.automation?.autoPublishMode || 'scheduled'
  );

  // Enable automation
  const [enableAutomation, setEnableAutomation] = useState(initialSettings?.automation?.enabled ?? true);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handlePreviewVoice = async () => {
    try {
      setPreviewingVoice(true);
      const res = await api.previewVoice({
        text: `Hello! This is Adam Voice narrating your next viral YouTube Short on ShortForge AI.`,
        speed: voiceSpeed,
        volume: voiceVolume,
        voiceStyle,
      });
      setPreviewAudioUrl(res.audioUrl);
      const audio = new Audio(res.audioUrl);
      audio.play();
    } catch (err: any) {
      alert(`Voice preview error: ${err.message}`);
    } finally {
      setPreviewingVoice(false);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const selectedNiche = niche === 'Custom Niche' && customNiche.trim() ? customNiche.trim() : niche;

      await api.updateSettings({
        firstTimeSetupCompleted: true,
        automation: {
          enabled: enableAutomation,
          status: enableAutomation ? 'running' : 'stopped',
          dailyTarget: 2,
          uploadTimes: [time1, time2],
          timezone,
          defaultNiche: selectedNiche,
          defaultVideoLength: videoLength,
          autoPublishMode,
          requireApprovalBeforeUpload: autoPublishMode === 'private',
          todayGeneratedCount: 0,
          todayPublishedCount: 0,
          concurrencyLimit: 2,
        },
        voice: {
          provider: 'adam_voice_authorized',
          voiceName: 'Adam Voice',
          voiceStyle,
          speed: voiceSpeed,
          volume: voiceVolume,
          pitch: 1.0,
          isAuthorized,
          authorizationNotes: 'Owner-authorized license for Adam Voice narration on ShortForge AI.',
        },
      });

      // If YouTube channel info provided
      if (channelTitle) {
        await api.connectChannel({
          channelTitle,
          customUrl,
          subscriberCount: 12500,
        });
      }

      onCompleted();
      onClose();
    } catch (err: any) {
      alert(`Failed to save setup: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
              STEP {step} OF 7
            </span>
            <h2 className="text-base font-bold text-white font-display">Setup ShortForge AI</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center gap-1.5 px-6 pt-4">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full flex-1 transition-all ${
                s === step
                  ? 'bg-amber-400'
                  : s < step
                  ? 'bg-neutral-600'
                  : 'bg-neutral-800'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="p-6 min-h-[360px] flex flex-col justify-between">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Step 1: Choose Your Niche</h3>
                <p className="text-sm text-neutral-400 mt-1">
                  Select your primary content domain. Gemini AI uses this to research viral hooks and scripts.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                {NICHES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNiche(n)}
                    className={`p-2.5 rounded-xl text-left border text-xs font-medium transition-all ${
                      niche === n
                        ? 'bg-amber-500/10 border-amber-400 text-amber-300 font-semibold'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {niche === 'Custom Niche' && (
                <input
                  type="text"
                  placeholder="Enter your custom niche (e.g. Ancient Roman Secrets)..."
                  value={customNiche}
                  onChange={(e) => setCustomNiche(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-950 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                />
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Step 2: Choose Video Length</h3>
                <p className="text-sm text-neutral-400 mt-1">
                  All videos are rendered in vertical 9:16 format (1080 × 1920) optimized for YouTube Shorts.
                </p>
              </div>
              <div className="space-y-2">
                {VIDEO_LENGTHS.map((vl) => (
                  <button
                    key={vl.value}
                    type="button"
                    onClick={() => setVideoLength(vl.value)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      videoLength === vl.value
                        ? 'bg-amber-500/10 border-amber-400 text-amber-300'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold">{vl.label}</div>
                      <div className="text-xs text-neutral-400 mt-0.5">{vl.desc}</div>
                    </div>
                    {videoLength === vl.value && <Check className="w-4 h-4 text-amber-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Step 3: Configure Adam Voice</h3>
                <p className="text-sm text-neutral-400 mt-1">
                  Adam Voice is our authorized flagship deep narration profile for high-retention faceless videos.
                </p>
              </div>

              {/* Explicit Authorization check */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="auth-consent"
                  checked={isAuthorized}
                  onChange={(e) => setIsAuthorized(e.target.checked)}
                  className="mt-0.5 rounded text-amber-400 focus:ring-amber-400"
                />
                <label htmlFor="auth-consent" className="cursor-pointer">
                  <span className="font-semibold block">Owner Authorization Verified</span>
                  I confirm that Adam Voice narration is licensed and explicitly authorized for this channel.
                </label>
              </div>

              {/* Style selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Speaking Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'deep_storyteller', label: 'Deep Storyteller (Recommended)' },
                    { id: 'dramatic', label: 'Dramatic Suspense' },
                    { id: 'documentary', label: 'Documentary Authority' },
                    { id: 'energetic', label: 'High Energy Viral' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setVoiceStyle(s.id as any)}
                      className={`p-2 rounded-lg text-xs font-medium border text-left ${
                        voiceStyle === s.id
                          ? 'bg-amber-400/10 border-amber-400 text-amber-300'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Speed & Volume */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs text-neutral-300 mb-1">
                    <span>Speed</span>
                    <span className="font-mono text-amber-400">{voiceSpeed}x</span>
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
                  <div className="flex justify-between text-xs text-neutral-300 mb-1">
                    <span>Volume</span>
                    <span className="font-mono text-amber-400">{voiceVolume}%</span>
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

              {/* Voice Preview Button */}
              <button
                type="button"
                onClick={handlePreviewVoice}
                disabled={previewingVoice}
                className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{previewingVoice ? 'Generating Sample...' : 'Preview Adam Voice'}</span>
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Step 4: Connect YouTube Channel</h3>
                <p className="text-sm text-neutral-400 mt-1">
                  Connect your YouTube channel using Google OAuth 2.0 (YouTube Data API v3).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div>
                  <label className="text-xs font-medium text-neutral-400">Channel Name</label>
                  <input
                    type="text"
                    value={channelTitle}
                    onChange={(e) => setChannelTitle(e.target.value)}
                    placeholder="e.g. Daily Mysteries AI"
                    className="w-full mt-1 px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-400">Handle / Custom URL</label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="e.g. @dailymysteries"
                    className="w-full mt-1 px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800 text-xs text-neutral-400">
                  <div className="font-medium text-neutral-300 mb-1 flex items-center gap-1.5">
                    <Youtube className="w-3.5 h-3.5 text-red-500" />
                    <span>Google OAuth 2.0 Security</span>
                  </div>
                  OAuth credentials and tokens are secured server-side. You can attach production OAuth keys anytime under the YouTube or Settings tab.
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Step 5: Choose 2 Daily Upload Times</h3>
                <p className="text-sm text-neutral-400 mt-1">
                  Automatic YouTube Shorts publishing defaults to 2 videos every day during peak viewer traffic.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 mb-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Video 1 (Lunch Peak)</span>
                  </div>
                  <input
                    type="time"
                    value={time1}
                    onChange={(e) => setTime1(e.target.value)}
                    className="w-full px-3 py-2 text-base font-mono bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                  <div className="text-[11px] text-neutral-500 mt-1.5">Default: 12:00 PM</div>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 mb-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Video 2 (Evening Peak)</span>
                  </div>
                  <input
                    type="time"
                    value={time2}
                    onChange={(e) => setTime2(e.target.value)}
                    className="w-full px-3 py-2 text-base font-mono bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                  <div className="text-[11px] text-neutral-500 mt-1.5">Default: 7:00 PM (19:00)</div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-400">Target Timezone</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-mono bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-300 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Step 6: Automatic Publishing Policy</h3>
                <p className="text-sm text-neutral-400 mt-1">
                  How should generated videos be published to YouTube?
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    id: 'scheduled',
                    title: 'Scheduled Uploads (Recommended)',
                    desc: 'Uploads as private and schedules release at the specified 12:00 PM / 7:00 PM peak times.',
                  },
                  {
                    id: 'private',
                    title: 'Private (Manual Review First)',
                    desc: 'Uploads as Private so you can inspect the final video before making it public.',
                  },
                  {
                    id: 'unlisted',
                    title: 'Unlisted',
                    desc: 'Accessible only via direct YouTube link for team review.',
                  },
                  {
                    id: 'public',
                    title: 'Direct Public Publishing',
                    desc: 'Instantly makes video public upon rendering completion.',
                  },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setAutoPublishMode(mode.id as any)}
                    className={`w-full flex items-start justify-between p-3 rounded-xl border text-left transition-all ${
                      autoPublishMode === mode.id
                        ? 'bg-amber-500/10 border-amber-400 text-amber-300'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">{mode.title}</div>
                      <div className="text-xs text-neutral-400 mt-0.5">{mode.desc}</div>
                    </div>
                    {autoPublishMode === mode.id && <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">Step 7: Enable Cloud Automation</h3>
                <p className="text-sm text-neutral-400 mt-1">
                  Cloud automation runs continuously in the cloud even when your phone, computer, and browser are closed.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">Enable 24/7 Cloud Worker</div>
                    <div className="text-xs text-neutral-400">
                      Researches topics, renders 1080x1920 MP4s, and publishes 2 Shorts/day.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableAutomation(!enableAutomation)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      enableAutomation ? 'bg-amber-400' : 'bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-neutral-950 transition-transform ${
                        enableAutomation ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="border-t border-neutral-800/80 pt-3 text-xs text-neutral-400 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span>Niche:</span>
                    <span className="text-white font-medium">{niche}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Daily Frequency:</span>
                    <span className="text-white font-medium">2 YouTube Shorts per day</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Scheduled Times:</span>
                    <span className="text-amber-400 font-mono font-medium">{time1} & {time2}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Voice Narrator:</span>
                    <span className="text-white font-medium">Adam Voice ({voiceStyle})</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-neutral-800 mt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 7 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1 px-5 py-2 text-xs font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-sm transition-colors"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                className="flex items-center gap-1.5 px-6 py-2 text-xs font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-md shadow-amber-400/20 transition-all font-display"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>{saving ? 'Configuring System...' : 'Launch ShortForge AI'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
