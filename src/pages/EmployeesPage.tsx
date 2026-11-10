import React, { useState, useEffect } from 'react';
import {
  Users,
  Sparkles,
  Bot,
  Plus,
  Play,
  Check,
  Edit2,
  Trash2,
  Code,
  Flame,
  Volume2,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  X,
  Zap,
} from 'lucide-react';
import { AIEmployee } from '../types';
import { api } from '../api';

interface EmployeesPageProps {
  onSelectTab: (tab: string) => void;
  onAssignToGenerate?: (employeeId: string) => void;
}

const CLAUDE_PRESETS = [
  {
    name: 'Viktor Graves',
    role: 'Dark Mystery & Suspense Director',
    department: 'Scriptwriting' as const,
    specialtyNiche: 'Mystery',
    voiceStyle: 'deep_storyteller' as const,
    avatarColor: 'from-purple-600 to-indigo-800',
    origin: 'Claude' as const,
    systemPrompt: `You are Viktor Graves, an elite investigative thriller writer trained in Claude. Your signature style is eerie, atmospheric, and psychologically gripping. Open with an impossible fact or chilling paradox within the first 2 seconds. Use short, rhythmic sentences that sustain unbearable curiosity until the final reveal. Never use generic intro phrases like "Have you ever wondered". Jump straight into the darkness.`,
  },
  {
    name: 'Dr. Zachary Vance',
    role: 'Quantum Science & Tech Oracle',
    department: 'Research' as const,
    specialtyNiche: 'Science',
    voiceStyle: 'documentary' as const,
    avatarColor: 'from-cyan-600 to-blue-700',
    origin: 'Claude' as const,
    systemPrompt: `You are Dr. Zachary Vance, an ex-DARPA research scientist turned YouTube science educator. You translate mind-bending physics, AI breakthroughs, and cosmological anomalies into vivid, jaw-dropping 60-second micro-documentaries. You prioritize rigorous factual accuracy, visceral analogies, and thought experiments that shatter conventional intuition.`,
  },
  {
    name: 'Aria Cruz',
    role: 'High-Retention Visual & Pacing Architect',
    department: 'Visuals' as const,
    specialtyNiche: 'Technology',
    voiceStyle: 'energetic' as const,
    avatarColor: 'from-amber-500 to-rose-600',
    origin: 'Claude' as const,
    systemPrompt: `You are Aria Cruz, a YouTube Shorts algorithmic retention expert designed in Claude. You script with extreme visual consciousness—every 3 to 4 seconds requires a dynamic pattern interrupt, kinetic camera movement, or bold visual contrast. Your narration is crisp, authoritative, and perfectly timed to keep swipe-away rates under 15%.`,
  },
  {
    name: 'Cassian Reed',
    role: 'Lost Empires & Ancient History Bard',
    department: 'Scriptwriting' as const,
    specialtyNiche: 'History',
    voiceStyle: 'dramatic' as const,
    avatarColor: 'from-emerald-600 to-teal-800',
    origin: 'Claude' as const,
    systemPrompt: `You are Cassian Reed, an epic historical chronicler. You unearth forgotten wartime deceptions, mysterious archaeological discoveries, and catastrophic historical blunders. You narrate with cinematic grandeur, treating historical figures not as dates in a textbook, but as flawed, ambitious titans battling impossible odds.`,
  },
];

export const EmployeesPage: React.FC<EmployeesPageProps> = ({ onSelectTab, onAssignToGenerate }) => {
  const [employees, setEmployees] = useState<AIEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<AIEmployee | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState<AIEmployee['department']>('Scriptwriting');
  const [specialtyNiche, setSpecialtyNiche] = useState('Mystery');
  const [voiceStyle, setVoiceStyle] = useState<AIEmployee['voiceStyle']>('deep_storyteller');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [origin, setOrigin] = useState<'Claude' | 'Custom'>('Claude');
  const [avatarColor, setAvatarColor] = useState('from-purple-600 to-indigo-800');

  // Test Modal State
  const [testModalEmployee, setTestModalEmployee] = useState<AIEmployee | null>(null);
  const [testTopic, setTestTopic] = useState('');
  const [testResult, setTestResult] = useState<{ hook: string; script: string; title: string } | null>(null);
  const [runningTest, setRunningTest] = useState(false);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await api.getEmployees();
      setEmployees(data);
    } catch (e: any) {
      console.error('Error fetching employees:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const openCreateModal = (preset?: typeof CLAUDE_PRESETS[0]) => {
    if (preset) {
      setName(preset.name);
      setRole(preset.role);
      setDepartment(preset.department);
      setSpecialtyNiche(preset.specialtyNiche);
      setVoiceStyle(preset.voiceStyle);
      setSystemPrompt(preset.systemPrompt);
      setOrigin('Claude');
      setAvatarColor(preset.avatarColor);
    } else {
      setName('');
      setRole('');
      setDepartment('Scriptwriting');
      setSpecialtyNiche('Mystery');
      setVoiceStyle('deep_storyteller');
      setSystemPrompt('');
      setOrigin('Claude');
      setAvatarColor('from-purple-600 to-indigo-800');
    }
    setEditingEmployee(null);
    setModalOpen(true);
  };

  const openEditModal = (emp: AIEmployee) => {
    setName(emp.name);
    setRole(emp.role);
    setDepartment(emp.department);
    setSpecialtyNiche(emp.specialtyNiche);
    setVoiceStyle(emp.voiceStyle);
    setSystemPrompt(emp.systemPrompt);
    setOrigin(emp.origin === 'Built-in' ? 'Custom' : emp.origin);
    setAvatarColor(emp.avatarColor);
    setEditingEmployee(emp);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Please enter an employee name');

    try {
      if (editingEmployee) {
        await api.updateEmployee(editingEmployee.id, {
          name: name.trim(),
          role: role.trim() || 'AI Content Specialist',
          department,
          specialtyNiche,
          voiceStyle,
          systemPrompt: systemPrompt.trim(),
          origin,
          avatarColor,
        });
      } else {
        await api.createEmployee({
          name: name.trim(),
          role: role.trim() || 'AI Content Specialist',
          department,
          specialtyNiche,
          voiceStyle,
          systemPrompt: systemPrompt.trim(),
          origin,
          avatarColor,
        });
      }
      setModalOpen(false);
      loadEmployees();
    } catch (e: any) {
      alert(`Failed to save AI employee: ${e.message}`);
    }
  };

  const handleToggleActive = async (emp: AIEmployee) => {
    try {
      await api.updateEmployee(emp.id, { active: !emp.active });
      loadEmployees();
    } catch (e: any) {
      alert(`Failed to toggle employee: ${e.message}`);
    }
  };

  const handleDelete = async (id: string, empName: string) => {
    if (!confirm(`Are you sure you want to remove ${empName} from your AI team?`)) return;
    try {
      await api.deleteEmployee(id);
      loadEmployees();
    } catch (e: any) {
      alert(`Failed to delete employee: ${e.message}`);
    }
  };

  const handleRunTest = async () => {
    if (!testModalEmployee) return;
    try {
      setRunningTest(true);
      setTestResult(null);
      const res = await api.testEmployee(testModalEmployee.id, testTopic.trim() || undefined);
      setTestResult(res);
    } catch (e: any) {
      alert(`Test generation error: ${e.message}`);
    } finally {
      setRunningTest(false);
    }
  };

  const handleAssignAndCreate = (emp: AIEmployee) => {
    if (onAssignToGenerate) {
      onAssignToGenerate(emp.id);
    }
    // Also save in localStorage for GeneratePage to pick up
    localStorage.setItem('shortforge_assigned_employee', emp.id);
    onSelectTab('generate');
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Top Banner & Direct Yes Confirmation */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/70 via-neutral-900 to-neutral-900 border border-purple-500/30 p-6 sm:p-8 shadow-xl">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Claude AI Employees Integration
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
              Yes, You Can Add Your Claude AI Employees Here
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              Import your custom personas, prompt instructions, and specialists created in Claude. When assigned to a YouTube Short, their custom psychological hooks, narrative pacing, and tone directly drive the scriptwriting and voice performance.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => openCreateModal()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/25 transition-all"
            >
              <Bot className="w-4 h-4" />
              <span>Import from Claude</span>
            </button>
            <button
              onClick={() => {
                setName('');
                setRole('');
                setOrigin('Custom');
                setModalOpen(true);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-sm border border-neutral-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Custom Employee</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick 1-Click Claude Import Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              1-Click Claude Persona Templates
            </h2>
          </div>
          <span className="text-xs text-neutral-500">Click to instantly recruit to your studio</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CLAUDE_PRESETS.map((preset) => (
            <div
              key={preset.name}
              className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-purple-500/50 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${preset.avatarColor} flex items-center justify-center text-white font-bold text-xs`}>
                    {preset.name[0]}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                    Claude Agent
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                    {preset.name}
                  </h3>
                  <p className="text-xs text-neutral-400">{preset.role}</p>
                </div>
                <p className="text-[11px] text-neutral-500 line-clamp-3">
                  {preset.systemPrompt}
                </p>
              </div>

              <button
                onClick={() => openCreateModal(preset)}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-neutral-800 hover:bg-purple-600 text-xs font-semibold text-neutral-300 hover:text-white transition-all"
              >
                <span>Import This Claude Agent</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Active Studio Staff Roster */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-bold text-white">Active AI Production Staff ({employees.length})</h2>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            {employees.filter((e) => e.active).length} Active & Producing
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-neutral-500 text-sm">
            Loading your AI team...
          </div>
        ) : employees.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
            <Bot className="w-10 h-10 text-neutral-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">No AI Employees Added Yet</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Click &quot;Import from Claude&quot; to paste your prompt persona and start generating specialized Shorts.
            </p>
            <button
              onClick={() => openCreateModal()}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold"
            >
              Import from Claude
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  emp.active
                    ? 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
                    : 'bg-neutral-950/40 border-neutral-800/60 opacity-60'
                }`}
              >
                {/* Header Info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${emp.avatarColor || 'from-amber-500 to-orange-600'} flex items-center justify-center text-white font-bold text-base shadow-md`}>
                        {emp.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-sm tracking-tight">{emp.name}</h3>
                          {emp.origin === 'Claude' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                              Claude
                            </span>
                          )}
                          {emp.origin === 'Built-in' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
                              Core
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">{emp.role}</p>
                      </div>
                    </div>

                    {/* Active Switch */}
                    <button
                      onClick={() => handleToggleActive(emp)}
                      title={emp.active ? 'Active in workflow' : 'Paused'}
                      className={`w-9 h-5 rounded-full transition-colors relative p-0.5 flex items-center ${
                        emp.active ? 'bg-emerald-500' : 'bg-neutral-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          emp.active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-md bg-neutral-800/80 text-neutral-300 font-mono text-[11px]">
                      {emp.department}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-neutral-800/80 text-amber-300 font-mono text-[11px]">
                      Niche: {emp.specialtyNiche}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-neutral-800/80 text-neutral-400 font-mono text-[11px] flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-neutral-500" />
                      {emp.voiceStyle.replace('_', ' ')}
                    </span>
                  </div>

                  {/* System Prompt Viewport */}
                  <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                      <span>INSTRUCTIONS & PROMPT DIRECTIVE</span>
                      <Code className="w-3 h-3 text-neutral-500" />
                    </div>
                    <p className="text-xs text-neutral-300 line-clamp-3 italic leading-relaxed">
                      &quot;{emp.systemPrompt}&quot;
                    </p>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-5 pt-4 border-t border-neutral-800/70 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-neutral-500 font-mono">
                    {emp.videosProduced} Shorts Produced
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Test Hook Button */}
                    <button
                      onClick={() => {
                        setTestModalEmployee(emp);
                        setTestTopic('');
                        setTestResult(null);
                      }}
                      title="Test scriptwriting style"
                      className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Test Hook</span>
                    </button>

                    {/* Assign & Create Button */}
                    <button
                      onClick={() => handleAssignAndCreate(emp)}
                      title="Assign to generate next YouTube Short"
                      className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <span>Assign</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEditModal(emp)}
                      title="Edit Employee"
                      className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(emp.id, emp.name)}
                      title="Delete Employee"
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-neutral-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Import / Edit AI Employee */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingEmployee ? `Edit ${editingEmployee.name}` : 'Import AI Employee from Claude'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Paste your Claude persona prompt to incorporate them into the video pipeline
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Employee Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marcus, Dr. Elena, CyberScribe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Role / Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Viral Hook & Curiosity Specialist"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-sm focus:outline-none focus:border-purple-400"
                  >
                    <option value="Scriptwriting">Scriptwriting & Hooks</option>
                    <option value="Research">Research & Facts</option>
                    <option value="Visuals">Visual Director</option>
                    <option value="Audio & Voice">Audio & Voice</option>
                    <option value="SEO & Growth">SEO & Metadata</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Specialty Niche</label>
                  <select
                    value={specialtyNiche}
                    onChange={(e) => setSpecialtyNiche(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-sm focus:outline-none focus:border-purple-400"
                  >
                    <option value="Mystery">Mystery</option>
                    <option value="History">History</option>
                    <option value="Science">Science</option>
                    <option value="Space">Space</option>
                    <option value="Geography">Geography</option>
                    <option value="Technology">Technology</option>
                    <option value="Interesting Facts">Interesting Facts</option>
                    <option value="Business">Business</option>
                    <option value="Documentaries">Documentaries</option>
                    <option value="Psychology">Psychology</option>
                    <option value="Unsolved Mysteries">Unsolved Mysteries</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Voice Tone</label>
                  <select
                    value={voiceStyle}
                    onChange={(e) => setVoiceStyle(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-sm focus:outline-none focus:border-purple-400"
                  >
                    <option value="deep_storyteller">Deep Storyteller</option>
                    <option value="dramatic">Dramatic</option>
                    <option value="documentary">Documentary</option>
                    <option value="energetic">Energetic</option>
                  </select>
                </div>
              </div>

              {/* System Prompt / Instructions */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300">
                    Claude System Prompt / Persona Directive
                  </label>
                  <span className="text-[11px] text-purple-400 font-mono">
                    Directs the Gemini engine
                  </span>
                </div>
                <textarea
                  required
                  rows={6}
                  placeholder="Paste the prompt or instructions from your Claude conversation here. E.g.: 'You are an investigative writer. Start with an urgent question, maintain extreme suspense, and build toward an unforgettable plot twist...'"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-purple-400 placeholder:text-neutral-600"
                />
              </div>

              {/* Source Origin & Avatar Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Platform Origin</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setOrigin('Claude')}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        origin === 'Claude'
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                      }`}
                    >
                      Imported from Claude
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrigin('Custom')}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        origin === 'Custom'
                          ? 'bg-amber-400 text-neutral-950 border-amber-400 font-bold'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                      }`}
                    >
                      Custom Persona
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Avatar Theme</label>
                  <div className="flex items-center gap-2 pt-1">
                    {[
                      { label: 'Purple', val: 'from-purple-600 to-indigo-800' },
                      { label: 'Amber', val: 'from-amber-500 to-orange-600' },
                      { label: 'Cyan', val: 'from-cyan-600 to-blue-700' },
                      { label: 'Emerald', val: 'from-emerald-600 to-teal-800' },
                      { label: 'Rose', val: 'from-rose-600 to-pink-700' },
                    ].map((c) => (
                      <button
                        key={c.val}
                        type="button"
                        onClick={() => setAvatarColor(c.val)}
                        className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${c.val} transition-transform ${
                          avatarColor === c.val ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg transition-all"
                >
                  {editingEmployee ? 'Save Changes' : 'Confirm & Recruit Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Live Hook / Script Test */}
      {testModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${testModalEmployee.avatarColor} flex items-center justify-center text-white font-bold text-sm`}>
                  {testModalEmployee.name[0]}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Test Scriptwriting: {testModalEmployee.name}
                  </h3>
                  <p className="text-xs text-neutral-400">{testModalEmployee.role}</p>
                </div>
              </div>
              <button
                onClick={() => setTestModalEmployee(null)}
                className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">
                  Topic (or leave blank for an autonomous {testModalEmployee.specialtyNiche} concept)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`e.g. The Voynich Manuscript, Quantum Entanglement, Black Holes...`}
                    value={testTopic}
                    onChange={(e) => setTestTopic(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={handleRunTest}
                    disabled={runningTest}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    {runningTest ? (
                      <span>Writing...</span>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Run Test</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {testResult && (
                <div className="space-y-3 p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <div>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">Generated Title</span>
                    <h4 className="text-sm font-bold text-white">{testResult.title}</h4>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30">
                    <span className="text-[10px] font-mono text-amber-300 font-bold uppercase block mb-1">
                      Viral 3-Second Hook
                    </span>
                    <p className="text-xs text-amber-200 font-medium italic">
                      &quot;{testResult.hook}&quot;
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase block mb-1">
                      Full Script Sample
                    </span>
                    <p className="text-xs text-neutral-300 leading-relaxed font-mono whitespace-pre-wrap">
                      {testResult.script}
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        handleAssignAndCreate(testModalEmployee);
                        setTestModalEmployee(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1"
                    >
                      <span>Create Video With This Employee</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
