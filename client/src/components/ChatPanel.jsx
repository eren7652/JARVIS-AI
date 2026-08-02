import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.jsx';
import { t } from '../i18n/index.js';
import './ChatPanel.css';

export default function ChatPanel({ messages, onClear, lang }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chat-panel">
      <div className="chat-panel-header">
        <span>{t(lang, 'sessionLog')}</span>
        <button className="clear-btn" onClick={onClear}>{t(lang, 'clearHistory')}</button>
      </div>
      <div className="chat-scroll" ref={scrollRef}>
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} text={m.text} image={m.image} ts={m.ts} />
        ))}
      </div>
    </div>
  );
}
