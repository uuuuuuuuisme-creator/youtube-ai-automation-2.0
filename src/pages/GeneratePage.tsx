import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Volume2,
  Clock,
  Layers,
  Wand2,
  Check,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Users,
  Bot,
  ChevronRight,
} from 'lucide-react';
import { AppSettings, VoiceSettings, AIEmployee } from '../types';
import { api } from '../api';

interface GeneratePageProps {
  settings: AppSettings | null;
  onJobCreated: () => void;
  onSelectTab: (tab: string) => void;
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

const VIDEO_LENGTHS = [15, 30, 45, 60, 90];
const BATCH_QUANTITIES = [1, 2, 5, 10, 20];

export const GeneratePage: React.FC<GeneratePageProps> = ({
  settings,
  onJobCreated,
  onSelectTab,
}) => {
  const [selectedNiche, setSelectedNiche] = useState(settings?.automation?.defaultNiche || 'Mystery');
  const [customNiche, setCustomNiche] = useState('');
  const [topic, setTopic] = useState('');
  const [suggestedTopics, setSuggestedTopics] = useState<Array<{ title: string; hook: string; angle: string }>>([]);
  const [fetchingTopics, setFetchingTopics] = useState(false);

  // AI Employee Assignment
  const [employees, setEmployees] = useState<AIEmployee[]>([]);
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>('');

  useEffect(() => {
    api.getEmployees().then((data) => {
      setEmployees(data);
      const savedEmpId = localStorage.getItem('shortforge_assigned_employee');
      if (savedEmpId && data.some((e) => e.id === savedEmpId)) {
        setAssignedEmployeeId(savedEmpId);
        const emp = data.find((e) => e.id === savedEmpId);
        if (emp?.specialtyNiche) setSelectedNiche(emp.specialtyNiche);
        if (emp?.voiceStyle) setVoiceStyle(emp.voiceStyle);
        localStorage.removeItem('shortforge_assigned_employee');
      }
    }).catch(console.error);
  }, []);

  const [duration, setDuration] = useState(settings?.automation?.defaultVideoLength || 60);
  const [quantity, setQuantity] = useState(1);
  const [customQuantity, setCustomQuantity] = useState<number | ''>('');

  // Voice controls
  const [voiceStyle, setVoiceStyle] = useState<VoiceSettings['voiceStyle']>(
    settings?.voice?.voiceStyle || 'deep_storyteller'
  );
  const [voiceSpeed, setVoiceSpeed] = useState(settings?.voice?.speed || 1.0);
  const [voiceVolume, setVoiceVolume] = useState(settings?.voice?.volume || 100);
  const [previewingVoice, setPreviewingVoice] = useState(false);

  const [generating, setGenerating] = useState(false);

  const handleSelectEmployee = (empId: string) => {
    setAssignedEmployeeId(empId);
    if (!empId) return;
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      if (emp.specialtyNiche) setSelectedNiche(emp.specialtyNiche);
      if (emp.voiceStyle) setVoiceStyle(emp.voiceStyle);
    }
  };

  const handleFetchAiTopics = async () => {
    try {
      setFetchingTopics(true);
      const nicheToSearch = selectedNiche === 'Custom Niche' ? customNiche || 'Mystery' : selectedNiche;
      const topics = await api.generateTopics(nicheToSearch, 4);
      setSuggestedTopics(topics);
    } catch (err: any) {
      alert(`Failed to fetch AI topic ideas: ${err.message}`);
    } finally {
      setFetchingTopics(false);
    }
  };

  const handlePreviewVoice = async () => {
    try {
      setPreviewingVoice(true);
      const sampleText = topic
        ? `Here is the shocking truth about ${topic}.`
        : `Welcome to ShortForge AI. This is a live preview of the authorized Adam Voice narration model.`;

      const res = await api.previewVoice({
        text: sampleText,
        speed: voiceSpeed,
        volume: voiceVolume,
        voiceStyle,
      });

      const audio = new Audio(res.audioUrl);
      audio.play();
    } catch (err: any) {
      alert(`Voice preview error: ${err.message}`);
    } finally {
      setPreviewingVoice(false);
    }
  };

  const handleQueueProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const activeNiche = selectedNiche === 'Custom Niche' && customNiche.trim() ? customNiche.trim() : selectedNiche;
      const totalQty = typeof customQuantity === 'number' && customQuantity > 0 ? customQuantity : quantity;

      if (totalQty === 1) {
        await api.queueSingleVideo({
          niche: activeNiche,
          topic: topic.trim() || undefined,
          durationTarget: duration,
          voiceStyle,
          voiceSpeed,
          assignedEmployeeId: assignedEmployeeId || undefined,
        });
      } else {
        await api.queueBatchVideos({
          quantity: totalQty,
          niche: activeNiche,
          durationTarget: duration,
          voiceStyle,
          customTopics: topic.trim() ? [topic.trim()] : undefined,
          assignedEmployeeId: assignedEmployeeId || undefined,
        });
      }

      onJobCreated();
      onSelectTab('queue');
    } catch (err: any) {
      alert(`Production queue error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white tracking-tight font-display">
          AI Video Generator
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          Craft high-retention YouTube Shorts with Gemini scriptwriting, Adam Voice narration, and 1080×1920 MP4 rendering.
        </p>
      </div>

      <form onSubmit={handleQueueProduction} className="space-y-6">
        {/* Step 0: AI Employee & Claude Specialist Selection */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-400" />
              <label className="text-sm font-semibold text-white">
                Assigned AI Employee &amp; Claude Specialist
              </label>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('employees')}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium transition-colors"
            >
              <span>Manage / Import Claude Team</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {/* Default Core Brain */}
            <button
              type="button"
              onClick={() => handleSelectEmployee('')}
              className={`p-3 rounded-xl text-left border transition-all flex items-center gap-3 ${
                !assignedEmployeeId
                  ? 'bg-amber-400/10 border-amber-400 text-amber-300 shadow-sm'
                  : 'bg-neutral-950/70 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-xs font-bold shrink-0">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold truncate">Default AI Brain</div>
                <div className="text-[10px] text-neutral-400 truncate">Autonomous Viral Hook</div>
              </div>
            </button>

            {/* AI Employees (including imported Claude personas) */}
            {employees.map((emp) => {
              const isSelected = assignedEmployeeId === emp.id;
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => handleSelectEmployee(emp.id)}
                  className={`p-3 rounded-xl text-left border transition-all flex items-center gap-2.5 relative ${
                    isSelected
                      ? 'bg-purple-600/15 border-purple-400 text-white shadow-sm ring-1 ring-purple-400/50'
                      : 'bg-neutral-950/70 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${emp.avatarColor || 'from-purple-600 to-indigo-800'} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                  >
                    {emp.name[0]}
                  </div>
                  <div className="truncate min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs font-bold truncate text-white">{emp.name}</span>
                      {emp.origin === 'Claude' && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                          Claude
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate">{emp.role}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {assignedEmployeeId && (
            <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-neutral-300 flex items-center justify-between">
              <span className="italic truncate pr-2">
                Active directive:{' '}
                <span className="text-purple-300 font-mono text-[11px]">
                  &quot;{employees.find((e) => e.id === assignedEmployeeId)?.systemPrompt.slice(0, 90)}...&quot;
                </span>
              </span>
              <span className="text-[10px] font-mono text-purple-400 shrink-0 uppercase">Claude persona locked</span>
            </div>
          )}
        </div>

        {/* Niche Selection */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-white">1. Select Niche</label>
            <span className="text-xs text-neutral-500 font-mono">12 Built-in Niches</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {NICHES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSelectedNiche(n)}
                className={`p-2.5 rounded-xl text-left border text-xs font-medium transition-all ${
                  selectedNiche === n
                    ? 'bg-amber-400/10 border-amber-400 text-amber-300 font-semibold shadow-sm'
                    : 'bg-neutral-950/70 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {selectedNiche === 'Custom Niche' && (
            <input
              type="text"
              placeholder="Enter custom niche (e.g., Deep Sea Ocean Mysteries, Cyber Warfare, Stoicism)..."
              value={customNiche}
              onChange={(e) => setCustomNiche(e.target.value)}
              className="w-full mt-2 px-3.5 py-2.5 text-xs bg-neutral-950 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
            />
          )}
        </div>

        {/* Topic Input & AI Suggestions */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-white">2. Topic & Concept</label>
            <button
              type="button"
              onClick={handleFetchAiTopics}
              disabled={fetchingTopics}
              className="flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 disabled:opacity-50"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{fetchingTopics ? 'Researching...' : 'Get Gemini AI Suggestions'}</span>
            </button>
          </div>

          <input
            type="text"
            placeholder="Leave empty for autonomous viral topic selection, or enter a specific topic..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-neutral-950 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
          />

          {suggestedTopics.length > 0 && (
            <div className="pt-2 space-y-2">
              <span className="text-[11px] text-neutral-400 block">Suggested Viral Angles:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestedTopics.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTopic(item.title)}
                    className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-400/50 text-left transition-all text-xs space-y-1"
                  >
                    <div className="font-semibold text-white truncate">{item.title}</div>
                    <div className="text-[11px] text-amber-300/80 italic line-clamp-1">"{item.hook}"</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Video Length & Format */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-white">3. Video Length</label>
            <span className="text-xs text-neutral-400 font-mono">Vertical 9:16 (1080 × 1920)</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {VIDEO_LENGTHS.map((len) => (
              <button
                key={len}
                type="button"
                onClick={() => setDuration(len)}
                className={`py-2.5 px-2 rounded-xl text-center border text-xs font-semibold font-mono transition-all ${
                  duration === len
                    ? 'bg-amber-400/10 border-amber-400 text-amber-300 shadow-sm'
                    : 'bg-neutral-950/70 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                {len}s
              </button>
            ))}
          </div>
          <p className="text-[11px] text-neutral-500">
            Default recommended length is 45-60 seconds for optimal YouTube Shorts retention algorithms.
          </p>
        </div>

        {/* Adam Voice Narration Controls */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <label className="text-sm font-semibold text-white">4. Adam Voice Narration</label>
            </div>
            <span className="text-xs text-emerald-400 font-mono font-medium">Authorized Owner Voice</span>
          </div>

          {/* Speaking Style */}
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-400">Speaking Style</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'deep_storyteller', label: 'Deep Storyteller' },
                { id: 'dramatic', label: 'Dramatic Suspense' },
                { id: 'documentary', label: 'Documentary Authority' },
                { id: 'energetic', label: 'High Energy Viral' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setVoiceStyle(style.id as any)}
                  className={`p-2.5 rounded-xl text-left border text-xs font-medium ${
                    voiceStyle === style.id
                      ? 'bg-amber-400/10 border-amber-400 text-amber-300 font-semibold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Speed & Volume Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Narration Speed</span>
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
                <span>Voice Volume</span>
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

          {/* Preview Button */}
          <button
            type="button"
            onClick={handlePreviewVoice}
            disabled={previewingVoice}
            className="w-full py-2.5 px-4 rounded-xl bg-neutral-950 border border-neutral-700 hover:bg-neutral-800 text-xs font-semibold text-neutral-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{previewingVoice ? 'Synthesizing Narration...' : 'Preview Adam Voice Narration'}</span>
          </button>
        </div>

        {/* Batch Request Quantity (Unlimited Queue) */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-white">5. Generation Quantity</label>
            <span className="text-xs text-amber-400 font-mono font-medium">Unlimited Persistent Queue</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {BATCH_QUANTITIES.map((qty) => (
              <button
                key={qty}
                type="button"
                onClick={() => {
                  setQuantity(qty);
                  setCustomQuantity('');
                }}
                className={`py-2 px-3.5 rounded-xl border text-xs font-semibold font-mono transition-all ${
                  quantity === qty && customQuantity === ''
                    ? 'bg-amber-400/10 border-amber-400 text-amber-300'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                {qty} {qty === 1 ? 'Video' : 'Videos'}
              </button>
            ))}

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-neutral-500">Custom:</span>
              <input
                type="number"
                min="1"
                max="50"
                placeholder="Qty"
                value={customQuantity}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : '';
                  setCustomQuantity(val);
                }}
                className="w-20 px-2.5 py-1.5 text-xs font-mono bg-neutral-950 border border-neutral-700 rounded-lg text-white text-center focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
          <p className="text-[11px] text-neutral-500">
            Jobs are added to the persistent cloud queue and rendered concurrently with automated retry handling.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={generating}
          className="w-full py-3.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-sm shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] font-display"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          <span>
            {generating
              ? 'Queueing Jobs in Cloud Engine...'
              : `Queue ${typeof customQuantity === 'number' && customQuantity > 0 ? customQuantity : quantity} Short(s) for Production`}
          </span>
        </button>
      </form>
    </div>
  );
};
