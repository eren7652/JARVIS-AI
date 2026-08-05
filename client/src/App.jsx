import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import TopBar from './components/TopBar.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import InputBar from './components/InputBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import BackgroundEmblem from './components/BackgroundEmblem.jsx';
import LandingLogin from './components/LandingLogin.jsx';
import Hero from './components/Hero.jsx';
import Settings from './components/Settings.jsx';
import Orb from './components/Orb.jsx';
import { LANGUAGES, t } from './i18n/index.js';
import { apiFetch, clearToken, getToken } from './api.js';
import './App.css';

const LANG_KEY = 'jarvis-language';
const USER_KEY = 'jarvis-user';
const THEME_KEY = 'jarvis-theme';
const VOICE_MUTED_KEY = 'jarvis-voice-muted';
const WAKE_WORD_KEY = 'jarvis-wake-word-enabled';
const MAX_SPOKEN_WORDS = 25;

function timeLabel() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function uid() {
  return Date.now() + '-' + Math.random().toString(36).slice(2, 7);
}

function normalizeConversation(c) {
  return {
    id: c._id,
    title: c.title,
    messages: (c.messages || []).map((m) => ({ ...m, id: uid() })),
    updatedAt: c.updatedAt,
  };
}

function getGreetingKey(hour) {
  if (hour < 5) return 'greetNight';
  if (hour < 12) return 'greetMorning';
  if (hour < 17) return 'greetAfternoon';
  if (hour < 21) return 'greetEvening';
  return 'greetNight';
}

// Resize/compress an image before sending so requests and stored history
// stay small — full-resolution phone photos would bloat both quickly.
function resizeImage(file, maxDim = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [user, setUser] = useState(() => {
    if (!getToken()) return null;
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  });

  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');
  const [language, setLanguage] = useState(() => localStorage.getItem(LANG_KEY) || 'en');
  const [voiceMuted, setVoiceMuted] = useState(() => localStorage.getItem(VOICE_MUTED_KEY) === 'true');
  const [wakeWordEnabled, setWakeWordEnabled] = useState(() => localStorage.getItem(WAKE_WORD_KEY) === 'true');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 860 : true
  );

  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [coreState, setCoreState] = useState('idle');
  const [now, setNow] = useState(new Date());

  const recognitionRef = useRef(null);
  const [micSupported, setMicSupported] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const wakeRecognitionRef = useRef(null);
  const awaitingCommandRef = useRef(false);
  const awaitingTimeoutRef = useRef(null);
  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [conversations, activeId]
  );

  // apply theme to the document root so CSS variables switch globally
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // tick the clock
  useEffect(() => {
    const tmr = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tmr);
  }, []);

  useEffect(() => {
    localStorage.setItem(LANG_KEY, language);
    // stop any in-progress speech in the old language rather than let it finish
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, [language]);

  useEffect(() => {
    localStorage.setItem(VOICE_MUTED_KEY, String(voiceMuted));
  }, [voiceMuted]);

  useEffect(() => {
    localStorage.setItem(WAKE_WORD_KEY, String(wakeWordEnabled));
  }, [wakeWordEnabled]);

  // load conversations from the server once logged in
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const list = await apiFetch('/api/conversations');
        if (cancelled) return;

        if (list.length === 0) {
          const created = await apiFetch('/api/conversations', { method: 'POST' });
          const fresh = normalizeConversation(created);
          fresh.messages = [{ id: uid(), role: 'system', text: t(language, 'initMessage') }];
          setConversations([fresh]);
          setActiveId(fresh.id);
        } else {
          const normalized = list.map(normalizeConversation);
          setConversations(normalized);
          setActiveId(normalized[0].id);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  const speak = useCallback((text) => {
    if (voiceMuted || !('speechSynthesis' in window)) {
      setCoreState('idle');
      return;
    }

    // Keep spoken replies short — greetings and brief answers get read aloud,
    // long paragraphs (search results, explanations) are shown in the chat
    // but not read out in full.
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > MAX_SPOKEN_WORDS) {
      setCoreState('idle');
      return;
    }

    const speechLang = LANGUAGES.find((l) => l.code === language)?.speech || 'en-US';
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.02;
    utter.pitch = 0.85;
    utter.lang = speechLang;
    const voices = window.speechSynthesis.getVoices();
    const matched = voices.find((v) => v.lang === speechLang) ||
      voices.find((v) => v.lang.startsWith(speechLang.split('-')[0]));
    if (matched) utter.voice = matched;

    utter.onstart = () => setCoreState('speaking');
    utter.onend = () => setCoreState('idle');
    utter.onerror = () => setCoreState('idle');

   window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }, [language, voiceMuted]);

  const handleToggleMute = useCallback(() => {
    setVoiceMuted((prev) => {
      const next = !prev;
      if (next && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setCoreState((s) => (s === 'speaking' ? 'idle' : s));
      }
      return next;
    });
  }, []);

  const sendMessage = useCallback(async (text, image) => {
    const conv = activeConversation;
    if (!conv) return;
    if (!text && !image) return;

    const userMsg = { id: uid(), role: 'user', text: text || '', image, ts: timeLabel() };
    const title = conv.title === t(language, 'untitled') ? (text || 'Image').slice(0, 40) : conv.title;
    let updatedMessages = [...conv.messages, userMsg];

    setConversations((prev) => prev.map((c) => (c.id === conv.id ? { ...c, messages: updatedMessages, title } : c)));
    setCoreState('thinking');

    try {
      const data = await apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, image, history: conv.messages, language }),
      });

      const jarvisMsg = { id: uid(), role: 'jarvis', text: data.reply, ts: timeLabel() };
      updatedMessages = [...updatedMessages, jarvisMsg];
      setConversations((prev) => prev.map((c) => (c.id === conv.id ? { ...c, messages: updatedMessages, title } : c)));
      speak(data.reply);

      apiFetch(`/api/conversations/${conv.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title, messages: updatedMessages }),
      }).catch(() => {});
    } catch (err) {
      const errMsg = { id: uid(), role: 'error', text: 'Connection to core systems failed: ' + err.message, ts: timeLabel() };
      updatedMessages = [...updatedMessages, errMsg];
      setConversations((prev) => prev.map((c) => (c.id === conv.id ? { ...c, messages: updatedMessages } : c)));
      setCoreState('error');
      setTimeout(() => setCoreState('idle'), 2000);
    }
  }, [activeConversation, language, speak]);

  // rebuild recognition object when language changes
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = LANGUAGES.find((l) => l.code === language)?.speech || 'en-US';

    recognition.onstart = () => {
      setMicActive(true);
      setCoreState('listening');
    };
    recognition.onresult = (event) => {
      sendMessage(event.results[0][0].transcript);
    };
    recognition.onerror = (event) => {
      setConversations((prev) => prev.map((c) => (c.id === activeId
        ? { ...c, messages: [...c.messages, { id: uid(), role: 'error', text: 'Voice input error: ' + event.error, ts: timeLabel() }] }
        : c)));
    };
    recognition.onend = () => {
      setMicActive(false);
      setCoreState((s) => (s === 'listening' ? 'idle' : s));
    };

    recognitionRef.current = recognition;
    setMicSupported(true);
  }, [sendMessage, language, activeId]);

  // "Hey JARVIS" wake-word listening — runs continuously in the background
  // when enabled, paused while the manual mic button is in use or while
  // JARVIS is talking (so it doesn't hear itself).
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || !wakeWordEnabled || micActive || coreState === 'speaking') {
      wakeRecognitionRef.current?.stop();
      wakeRecognitionRef.current = null;
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = LANGUAGES.find((l) => l.code === language)?.speech || 'en-US';

    const wakeRegex = /\bjarvis[,!.]?\s*(.*)/i;

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      if (!result.isFinal) return;
      const transcript = result[0].transcript.trim();
      if (!transcript) return;

      const match = transcript.match(wakeRegex);
      if (match) {
        clearTimeout(awaitingTimeoutRef.current);
        const command = match[1].trim();
        if (command) {
          awaitingCommandRef.current = false;
          sendMessage(command);
        } else {
          // just the wake word alone — listen for the actual command next
          awaitingCommandRef.current = true;
          setCoreState('listening');
          awaitingTimeoutRef.current = setTimeout(() => {
            awaitingCommandRef.current = false;
            setCoreState((s) => (s === 'listening' ? 'idle' : s));
          }, 6000);
        }
      } else if (awaitingCommandRef.current) {
        clearTimeout(awaitingTimeoutRef.current);
        awaitingCommandRef.current = false;
        sendMessage(transcript);
      }
    };

    recognition.onerror = (event) => {
      // "no-speech" fires constantly in continuous mode — expected, ignore it.
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setWakeWordEnabled(false);
      }
    };

    recognition.onend = () => {
      // Chrome auto-stops continuous recognition after a while; restart it
      // as long as wake-word mode is still meant to be active.
      if (wakeWordEnabled && !micActive && coreState !== 'speaking') {
        try { recognition.start(); } catch { /* already running */ }
      }
    };

    wakeRecognitionRef.current = recognition;
    try { recognition.start(); } catch { /* ignore */ }

    return () => {
      recognition.onend = null;
      recognition.stop();
    };
  }, [wakeWordEnabled, micActive, coreState, language, sendMessage]);

  const handleMicClick = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (micActive) {
      recognition.stop();
    } else {
      window.speechSynthesis.cancel();
      recognition.start();
    }
  };

  const handleImageSelect = async (file) => {
    try {
      const dataUrl = await resizeImage(file);
      setImagePreview(dataUrl);
    } catch (err) {
      console.error('Failed to process image:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = input.trim();
    if (!value && !imagePreview) return;
    setInput('');
    const image = imagePreview;
    setImagePreview(null);
    sendMessage(value, image);
  };

  const handleClear = () => {
    const conv = activeConversation;
    if (!conv) return;
    const clearedMessages = [{ id: uid(), role: 'system', text: t(language, 'historyCleared') }];
    setConversations((prev) => prev.map((c) => (c.id === conv.id ? { ...c, messages: clearedMessages } : c)));
    apiFetch(`/api/conversations/${conv.id}`, {
      method: 'PUT',
      body: JSON.stringify({ messages: clearedMessages }),
    }).catch(() => {});
  };

  const handleNewChat = async () => {
    try {
      const created = await apiFetch('/api/conversations', { method: 'POST' });
      const fresh = normalizeConversation(created);
      fresh.messages = [{ id: uid(), role: 'system', text: t(language, 'initMessage') }];
      setConversations((prev) => [fresh, ...prev]);
      setActiveId(fresh.id);
      if (window.innerWidth <= 860) setSidebarOpen(false);
    } catch (err) {
      console.error('Failed to start new chat:', err);
    }
  };

  const handleSelectConversation = (id) => {
    setActiveId(id);
    if (window.innerWidth <= 860) setSidebarOpen(false);
  };

  const handleDeleteConversation = async (id) => {
    try {
      await apiFetch(`/api/conversations/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);
    if (id === activeId) {
      if (remaining.length > 0) {
        setActiveId(remaining[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  };

  const handleLogout = () => {
    clearToken();
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setConversations([]);
    setActiveId(null);
    setSettingsOpen(false);
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  };

  if (!user) {
    if (!showAuth) {
      return <Hero onEnter={() => setShowAuth(true)} onLogin={() => setShowAuth(true)} />;
    }
    return <LandingLogin onLogin={handleLogin} onBack={() => setShowAuth(false)} />;
  }

  if (!activeConversation) {
    return (
      <div className="app-loading">
        <Orb state="thinking" size={70} />
      </div>
    );
  }

  const statusKey =
    coreState === 'listening' ? 'statusListening' :
    coreState === 'thinking' ? 'statusThinking' :
    coreState === 'speaking' ? 'statusSpeaking' :
    coreState === 'error' ? 'statusError' :
    wakeWordEnabled ? 'statusWakeReady' : 'statusNominal';

  return (
    <div className="app-root">
      <BackgroundEmblem />
      {sidebarOpen && <div className="sidebar-scrim" onClick={() => setSidebarOpen(false)} />}
      <Sidebar
        open={sidebarOpen}
        conversations={conversations}
        activeId={activeConversation.id}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        search={search}
        onSearchChange={setSearch}
        lang={language}
        user={user}
        onOpenSettings={() => setSettingsOpen(true)}
        onDeleteConversation={handleDeleteConversation}
        onCloseSidebar={() => setSidebarOpen(false)}
      />
      <div className="app-shell">
        <TopBar
          coreState={coreState}
          statusText={t(language, statusKey)}
          greeting={t(language, getGreetingKey(now.getHours()))}
          clock={now.toLocaleTimeString('en-US', { hour12: false })}
          dateline={now.toLocaleDateString('en-US', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
          }).toUpperCase()}
         onMenuClick={() => setSidebarOpen((v) => !v)}
          voiceMuted={voiceMuted}
          onToggleMute={handleToggleMute}
        />
        <ChatPanel messages={activeConversation.messages} onClear={handleClear} lang={language} />
        <InputBar
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          onMicClick={handleMicClick}
          micActive={micActive}
          micSupported={micSupported}
          lang={language}
          imagePreview={imagePreview}
          onImageSelect={handleImageSelect}
          onImageRemove={() => setImagePreview(null)}
        />
      </div>

      {settingsOpen && (
        <Settings
          user={user}
          theme={theme}
          onThemeChange={setTheme}
          language={language}
          onLanguageChange={setLanguage}
          voiceMuted={voiceMuted}
          onToggleMute={handleToggleMute}
          wakeWordEnabled={wakeWordEnabled}
          onToggleWakeWord={() => setWakeWordEnabled((v) => !v)}
          micSupported={micSupported}
          onClose={() => setSettingsOpen(false)}
          onLogout={handleLogout}
          onUserUpdate={handleUserUpdate}
        />
      )}
    </div>
  );
}
