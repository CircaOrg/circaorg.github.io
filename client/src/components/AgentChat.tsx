import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiSend, FiX, FiGlobe, FiZap, FiCalendar, FiDroplet,
  FiClock, FiActivity,
  FiVolume2, FiVolumeX, FiMic, FiMicOff,
} from 'react-icons/fi';
import { useFieldStore } from '../lib/socket';
import { useScheduleStore } from '../lib/scheduleStore';
import type { Schedule } from '../lib/scheduleStore';
import { TurretApiClient } from '../lib/turretApi';
import { useHardwareStore } from '../lib/hardwareStore';
import './AgentChat.css';

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

const OPENROUTER_API_KEY    = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
const ELEVENLABS_API_KEY    = import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined;
const ELEVENLABS_VOICE_ID   = (import.meta.env.VITE_ELEVENLABS_VOICE_ID as string | undefined) ?? '21m00Tcm4TlvDq8ikWAM';
const MODEL                 = 'moonshotai/kimi-k2';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChatMessageRole = 'user' | 'assistant';

interface TextMessage {
  id: string;
  role: ChatMessageRole;
  type: 'text';
  content: string;
}

interface ScheduleCardMessage {
  id: string;
  role: 'assistant';
  type: 'schedule_card';
  schedule: Schedule;
  text: string;
}

type ChatMessage = TextMessage | ScheduleCardMessage;

interface OAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: OAIToolCall[];
  tool_call_id?: string;
}

interface OAIToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'zh', label: '中文' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
];

const SUGGESTIONS = [
  { icon: FiCalendar, text: 'Schedule morning irrigation at 6am' },
  { icon: FiDroplet,  text: 'Water zone A now for 10 seconds' },
  { icon: FiZap,      text: 'Turn off the Sunrise Irrigation schedule' },
];

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'create_schedule',
      description: 'Creates an irrigation schedule for a base station.',
      parameters: {
        type: 'object',
        properties: {
          name:         { type: 'string' },
          station_id:   { type: 'string' },
          trigger_type: { type: 'string', enum: ['time', 'condition'] },
          cron:         { type: 'string', description: 'e.g. "0 6 * * *"' },
          metric:       { type: 'string', enum: ['soil_moisture', 'temperature', 'humidity'] },
          operator:     { type: 'string', enum: ['<', '>', '<=', '>='] },
          threshold:    { type: 'number' },
          angle:        { type: 'number', description: '0–180 deg' },
          duration:     { type: 'number', description: 'seconds' },
        },
        required: ['name', 'station_id', 'trigger_type', 'duration'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'toggle_schedule',
      description: 'Enables or disables an existing schedule by name or ID.',
      parameters: {
        type: 'object',
        properties: {
          schedule_id:   { type: 'string' },
          schedule_name: { type: 'string' },
          enabled:       { type: 'boolean' },
        },
        required: ['enabled'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fire_irrigation',
      description: 'Immediately fires the irrigation turret at a station.',
      parameters: {
        type: 'object',
        properties: {
          station_id: { type: 'string' },
          angle:      { type: 'number' },
          duration:   { type: 'number', description: 'ms' },
        },
        required: ['station_id', 'duration'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_schedules',
      description: 'Lists all existing irrigation schedules.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

// ---------------------------------------------------------------------------
// Tool execution
// ---------------------------------------------------------------------------

async function executeTool(name: string, args: Record<string, unknown>, hardwareUrls: Record<string, string>): Promise<unknown> {
  const store = useScheduleStore.getState();

  if (name === 'create_schedule') {
    const { name: sName, station_id, trigger_type, cron, metric, operator, threshold, angle, duration } = args as any;
    const trigger = trigger_type === 'condition'
      ? { type: 'condition' as const, metric, operator, threshold }
      : { type: 'time' as const, cron: cron || '0 8 * * *' };
    const s = store.addSchedule({ name: sName, station_id, trigger, conditions: [], actions: [{ type: 'fire_turret', angle: angle ?? 90, duration: duration ?? 10 }], enabled: true });
    return { __schedule: s, success: true };
  }

  if (name === 'toggle_schedule') {
    const { schedule_id, schedule_name, enabled } = args as any;
    let target = store.schedules.find((s) => s.id === schedule_id);
    if (!target && schedule_name) {
      const lower = (schedule_name as string).toLowerCase();
      target = store.schedules.find((s) => s.name.toLowerCase().includes(lower));
    }
    if (!target) return { success: false, error: 'Schedule not found' };
    store.updateSchedule(target.id, { enabled });
    return { success: true, schedule_id: target.id, name: target.name, enabled };
  }

  if (name === 'fire_irrigation') {
    const { station_id, duration } = args as any;
    const client = new TurretApiClient(hardwareUrls[station_id] ?? 'http://192.168.4.1');
    try {
      const r = await client.pumpOn(duration ?? 5000);
      return { success: r.ok, message: r.body };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  if (name === 'list_schedules') {
    return store.schedules.map((s) => ({ id: s.id, name: s.name, station_id: s.station_id, trigger: s.trigger, enabled: s.enabled }));
  }

  return { error: `Unknown tool: ${name}` };
}

// ---------------------------------------------------------------------------
// AI chat
// ---------------------------------------------------------------------------

async function chatWithAI(oaiMessages: OAIMessage[], hardwareUrls: Record<string, string>): Promise<{ messages: ChatMessage[]; rawContent: string }> {
  if (!OPENROUTER_API_KEY) {
    return { messages: [{ id: uid(), role: 'assistant', type: 'text', content: 'AI not configured — add VITE_OPENROUTER_API_KEY to client/.env' }], rawContent: '' };
  }

  let messages = [...oaiMessages];
  const chatMessages: ChatMessage[] = [];

  for (let round = 0; round < 5; round++) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'HTTP-Referer': window.location.origin, 'X-Title': 'Circa Irrigation Dashboard' },
      body: JSON.stringify({ model: MODEL, messages, tools: TOOLS, tool_choice: 'auto', max_tokens: 1024 }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any)?.error?.message ?? `OpenRouter ${res.status}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    if (!choice) throw new Error('Empty response');

    if (choice.finish_reason === 'tool_calls') {
      messages.push({ role: 'assistant', content: choice.message.content ?? null, tool_calls: choice.message.tool_calls });
      const toolResults: OAIMessage[] = [];

      for (const tc of choice.message.tool_calls as OAIToolCall[]) {
        let result: unknown;
        try { result = await executeTool(tc.function.name, JSON.parse(tc.function.arguments), hardwareUrls); }
        catch (e: any) { result = { error: e.message }; }

        if (result && typeof result === 'object' && '__schedule' in (result as any)) {
          const { __schedule: schedule, ...rest } = result as any;
          chatMessages.push({ id: uid(), role: 'assistant', type: 'schedule_card', schedule, text: '' });
          result = rest;
        }
        toolResults.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
      }
      messages.push(...toolResults);
      continue;
    }

    const text = choice.message.content ?? '';
    chatMessages.push({ id: uid(), role: 'assistant', type: 'text', content: text });
    return { messages: chatMessages, rawContent: text };
  }

  const fallback = 'Reached tool call limit.';
  return { messages: [{ id: uid(), role: 'assistant', type: 'text', content: fallback }], rawContent: fallback };
}

// ---------------------------------------------------------------------------
// TTS helpers
// ---------------------------------------------------------------------------

async function elevenLabsTTS(text: string): Promise<HTMLAudioElement> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
    method: 'POST',
    headers: { 'xi-api-key': ELEVENLABS_API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_flash_v2_5', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
  });
  if (!res.ok) throw new Error(`ElevenLabs TTS ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.addEventListener('ended', () => URL.revokeObjectURL(url), { once: true });
  return audio;
}

function webSpeechTTS(text: string, onEnd?: () => void): { stop: () => void } {
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  if (onEnd) {
    utter.onend = onEnd;
  }
  window.speechSynthesis.speak(utter);
  return { stop: () => window.speechSynthesis.cancel() };
}

// ---------------------------------------------------------------------------
// STT helpers
// ---------------------------------------------------------------------------
// Native Web Speech API is used exclusively.

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

function uid() { return Math.random().toString(36).slice(2); }

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AgentChatProps { onClose: () => void }

export default function AgentChat({ onClose }: AgentChatProps) {
  const { stations, nodes } = useFieldStore();
  const { schedules } = useScheduleStore();
  const hardwareStore = useHardwareStore();

  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome', role: 'assistant', type: 'text',
    content: "Hi, I'm Circa AI. I can create and manage irrigation schedules, trigger watering, and answer field questions. How can I help?",
  }]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [language, setLanguage]     = useState('en');
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Voice
  const [playingId, setPlayingId]   = useState<string | null>(null);
  const [ttsLoading, setTtsLoading] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const audioRef     = useRef<HTMLAudioElement | null>(null);
  const speechRecRef = useRef<any>(null);
  // Snapshot of input text at the moment recording starts, so spoken
  // words are appended rather than overwriting anything already typed.
  const inputSnapshotRef = useRef<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  // ── TTS ────────────────────────────────────────────────────

  const stopAudio = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    window.speechSynthesis?.cancel();
    setPlayingId(null);
  }, []);

  const handlePlay = useCallback(async (id: string, text: string) => {
    if (playingId === id) { stopAudio(); return; }
    stopAudio();

    if (ELEVENLABS_API_KEY) {
      setTtsLoading(id);
      try {
        const audio = await elevenLabsTTS(text);
        setTtsLoading(null);
        setPlayingId(id);
        audioRef.current = audio;
        audio.play();
        audio.addEventListener('ended', () => setPlayingId(null), { once: true });
      } catch {
        setTtsLoading(null);
        // fall through to web speech
        const { stop } = webSpeechTTS(text, () => setPlayingId(null));
        setPlayingId(id);
        audioRef.current = { pause: stop } as any;
      }
    } else {
      // Web Speech API fallback
      const { stop } = webSpeechTTS(text, () => setPlayingId(null));
      setPlayingId(id);
      audioRef.current = { pause: stop } as any;
    }
  }, [playingId, stopAudio]);

  // ── STT ────────────────────────────────────────────────────

  const startRecording = useCallback(() => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported in this browser.'); return; }

    // Snapshot what is already typed so we append speech to it
    inputSnapshotRef.current = input.trim();

    const rec = new SR();
    rec.lang = language !== 'en' ? language : 'en-US';
    rec.interimResults = true;
    rec.continuous = true; // keep listening until user explicitly stops

    rec.onresult = (e: any) => {
      // Concatenate ALL result segments (handles multi-sentence sessions)
      let spoken = '';
      for (let i = 0; i < e.results.length; i++) {
        spoken += e.results[i][0].transcript;
      }
      const prefix = inputSnapshotRef.current;
      setInput(prefix ? `${prefix} ${spoken}` : spoken);
    };

    rec.onend = () => {
      speechRecRef.current = null;
      setIsRecording(false);
    };
    rec.onerror = (e: any) => {
      if (e.error === 'no-speech') return; // Ignore silence errors
      if (e.error !== 'aborted') console.error('SpeechRecognition error', e.error);
      speechRecRef.current = null;
      setIsRecording(false);
    };

    try {
      rec.start();
      speechRecRef.current = rec;
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start speech recognition', err);
    }
  }, [language, input]);

  const stopRecording = useCallback(() => {
    if (speechRecRef.current) {
      // stop() triggers a final onresult + onend, preserving the transcript
      speechRecRef.current.stop();
    }
  }, []);

  const handleMicClick = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  // ── Send message ───────────────────────────────────────────

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    // Stop recording before sending so no late onresult overwrites cleared input
    if (speechRecRef.current) {
      speechRecRef.current.abort();
      speechRecRef.current = null;
      setIsRecording(false);
    }

    const userMsg: TextMessage = { id: uid(), role: 'user', type: 'text', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const stationList = stations.map((s) => `${s.name} (id:${s.id}, moisture:${s.soil_moisture ?? '?'}%, online:${s.online})`).join('; ') || 'none';
      const scheduleList = schedules.length > 0
        ? schedules.map((s) => `"${s.name}" (id:${s.id}, enabled:${s.enabled}, trigger:${JSON.stringify(s.trigger)})`).join('; ')
        : 'none';
      const langInstruction = language !== 'en'
        ? `\nIMPORTANT: Always reply in ${LANGUAGES.find((l) => l.code === language)?.label ?? language}.` : '';

      const systemPrompt = `You are Circa AI, a precision farming assistant.

Field — Stations: ${stationList} | Nodes: ${nodes.length}
Existing schedules: ${scheduleList}

Create/toggle schedules, fire immediate irrigation, or answer field questions. Be concise.${langInstruction}`;

      const historyMsgs = messages
        .filter((m) => m.id !== 'welcome' && m.type === 'text')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: (m as TextMessage).content }));

      const oaiMessages: OAIMessage[] = [
        { role: 'system', content: systemPrompt },
        ...historyMsgs,
        { role: 'user', content: text.trim() },
      ];

      const hardwareUrls: Record<string, string> = {};
      stations.forEach((s) => { hardwareUrls[s.id] = hardwareStore.getUrl(s.id); });

      const result = await chatWithAI(oaiMessages, hardwareUrls);
      const finalText = result.rawContent;
      setMessages((prev) => [
        ...prev,
        ...result.messages.map((m) => m.type === 'schedule_card' && !m.text ? { ...m, text: finalText } : m),
      ]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { id: uid(), role: 'assistant', type: 'text', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const activeLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <aside className="agent-chat">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <span className="chat-ai-badge">AI</span>
          <span className="chat-title">Circa AI</span>
        </div>
        <div className="chat-header-right">
          <div className="lang-selector">
            <button className="lang-btn" onClick={() => setShowLangMenu((v) => !v)} aria-expanded={showLangMenu}>
              <FiGlobe aria-hidden="true" />
              <span className="lang-btn-label">{activeLang.label}</span>
            </button>
            {showLangMenu && (
              <div className="lang-menu" role="menu">
                {LANGUAGES.map((l) => (
                  <button key={l.code} className={`lang-option ${l.code === language ? 'active' : ''}`}
                    onClick={() => { setLanguage(l.code); setShowLangMenu(false); }} role="menuitem">
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="chat-close-btn" onClick={onClose} aria-label="Close AI panel"><FiX aria-hidden="true" /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages" aria-live="polite">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-msg chat-msg--${msg.role}`}>
            {msg.role === 'assistant' && <span className="chat-msg-avatar" aria-hidden="true">AI</span>}
            <div className="chat-msg-bubble-wrap">
              {msg.type === 'schedule_card'
                ? <ScheduleCardBubble msg={msg} />
                : (
                  <TextBubble
                    content={msg.content}
                    isUser={msg.role === 'user'}
                    isPlaying={playingId === msg.id}
                    isTtsLoading={ttsLoading === msg.id}
                    onPlay={msg.role === 'assistant' ? () => handlePlay(msg.id, msg.content) : undefined}
                  />
                )
              }
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-msg chat-msg--assistant">
            <span className="chat-msg-avatar" aria-hidden="true">AI</span>
            <div className="chat-msg-bubble-wrap">
              <div className="chat-msg-bubble chat-typing"><span /><span /><span /></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="chat-suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s.text} className="chat-suggestion" onClick={() => send(s.text)}>
              <s.icon aria-hidden="true" /><span>{s.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="chat-input-area">
        <button
          className={`chat-mic-btn ${isRecording ? 'recording' : ''}`}
          onClick={handleMicClick}
          title={isRecording ? 'Stop recording' : 'Voice input'}
          aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
        >
          {isRecording
            ? <FiMicOff aria-hidden="true" />
            : <FiMic aria-hidden="true" />
          }
        </button>
        <textarea
          ref={textareaRef}
          className="chat-input"
          rows={1}
          placeholder={isRecording ? 'Listening…' : 'Ask Circa AI…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          aria-label="Message Circa AI"
        />
        <button className="chat-send-btn" onClick={() => send(input)} disabled={!input.trim() || loading} aria-label="Send">
          <FiSend aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TextBubble({
  content, isUser, isPlaying, isTtsLoading, onPlay,
}: {
  content: string;
  isUser: boolean;
  isPlaying: boolean;
  isTtsLoading: boolean;
  onPlay?: () => void;
}) {
  return (
    <div className={`chat-msg-bubble ${isUser ? 'chat-msg-bubble--user' : ''}`}>
      <div className="chat-bubble-text">
        {content.split('\n').map((line, i, arr) => (
          <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
        ))}
      </div>
      {onPlay && (
        <button
          className={`chat-tts-btn ${isPlaying ? 'playing' : ''}`}
          onClick={onPlay}
          title={isPlaying ? 'Stop' : 'Play aloud'}
          aria-label={isPlaying ? 'Stop audio' : 'Play response aloud'}
          aria-pressed={isPlaying}
        >
          {isTtsLoading
            ? <span className="chat-tts-spinner" />
            : isPlaying
              ? <FiVolumeX aria-hidden="true" />
              : <FiVolume2 aria-hidden="true" />
          }
        </button>
      )}
    </div>
  );
}

function ScheduleCardBubble({ msg }: { msg: ScheduleCardMessage }) {
  const { schedules, updateSchedule } = useScheduleStore();
  const live = schedules.find((s) => s.id === msg.schedule.id);
  const enabled = live?.enabled ?? msg.schedule.enabled;
  const schedule = live ?? msg.schedule;

  const triggerLabel = schedule.trigger.type === 'time'
    ? schedule.trigger.cron
    : `${schedule.trigger.metric} ${schedule.trigger.operator} ${schedule.trigger.threshold}%`;

  const actionLabel = schedule.actions.map((a) =>
    a.type === 'fire_turret' ? `Fire @ ${a.angle ?? 90}° for ${a.duration}s` : a.type
  ).join(', ');

  return (
    <div className="chat-schedule-card">
      {msg.text && <p className="chat-schedule-confirm">{msg.text}</p>}
      <div className="chat-schedule-body">
        <div className="chat-schedule-info">
          <span className="chat-schedule-name">{schedule.name}</span>
          <span className="chat-schedule-trigger">
            {schedule.trigger.type === 'time' ? <FiClock aria-hidden="true" /> : <FiActivity aria-hidden="true" />}
            {triggerLabel}
          </span>
          <span className="chat-schedule-action">{actionLabel}</span>
        </div>
        <label className="toggle-switch" title={enabled ? 'Disable schedule' : 'Enable schedule'}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={() => updateSchedule(schedule.id, { enabled: !enabled })}
          />
          <span className="toggle-slider" />
        </label>
      </div>
    </div>
  );
}
