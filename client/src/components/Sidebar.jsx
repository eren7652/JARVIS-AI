import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n/index.js';
import './Sidebar.css';

const LONG_PRESS_MS = 500;

export default function Sidebar({
  open, conversations, activeId, onSelect, onNewChat,
  search, onSearchChange, lang, user, onOpenSettings,
  onDeleteConversation, onCloseSidebar,
}) {
  const [imgError, setImgError] = useState(false);
  const [menu, setMenu] = useState(null); // { x, y, id } | null
  const longPressTimer = useRef(null);
  const menuRef = useRef(null);

  const query = search.trim().toLowerCase();
  const filtered = query
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(query) ||
        c.messages.some((m) => m.text && m.text.toLowerCase().includes(query))
      )
    : conversations;

  // Close the context menu on outside click/tap or Escape
  useEffect(() => {
    if (!menu) return;
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(null);
    };
    const handleKey = (e) => { if (e.key === 'Escape') setMenu(null); };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menu]);

  const openMenuAt = (x, y, id) => {
    const menuWidth = 170;
    const clampedX = Math.min(x, window.innerWidth - menuWidth - 8);
    setMenu({ x: clampedX, y, id });
  };

  const handleContextMenu = (e, id) => {
    e.preventDefault();
    openMenuAt(e.clientX, e.clientY, id);
  };

  const handleTouchStart = (e, id) => {
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      openMenuAt(touch.clientX, touch.clientY, id);
    }, LONG_PRESS_MS);
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDelete = () => {
    if (menu) onDeleteConversation(menu.id);
    setMenu(null);
  };

  return (
    <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
      <div className="sidebar-top">
        <button className="sidebar-new-chat" onClick={onNewChat}>
          <svg viewBox="0 0 24 24" width="15" height="15">
            <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zm17.71-10.04a1 1 0 0 0 0-1.42l-2.5-2.5a1 1 0 0 0-1.42 0l-1.83 1.83 3.75 3.75z"/>
          </svg>
          {t(lang, 'newChat')}
        </button>
        <button className="sidebar-close-btn" onClick={onCloseSidebar} aria-label="Close sidebar">
          <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M6.4 5L5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6z"/></svg>
        </button>
      </div>

      <div className="sidebar-search">
        <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14"/></svg>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t(lang, 'searchPlaceholder')}
        />
      </div>

      <div className="sidebar-list">
        {filtered.length === 0 && (
          <div className="sidebar-empty">{t(lang, 'noConversations')}</div>
        )}
        {filtered.map((c) => (
          <button
            key={c.id}
            className={`sidebar-item ${c.id === activeId ? 'active' : ''}`}
            onClick={() => onSelect(c.id)}
            onContextMenu={(e) => handleContextMenu(e, c.id)}
            onTouchStart={(e) => handleTouchStart(e, c.id)}
            onTouchEnd={clearLongPress}
            onTouchMove={clearLongPress}
            title={c.title}
          >
            {c.title}
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        {user && (
          <button className="sidebar-profile" onClick={onOpenSettings}>
            {user.picture && !imgError ? (
              <img
                className="sidebar-avatar"
                src={user.picture}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="sidebar-avatar sidebar-avatar-fallback">
                {(user.name || user.email || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="sidebar-profile-info">
              <div className="sidebar-profile-name">{user.name}</div>
              <div className="sidebar-profile-email">{user.email || user.phone}</div>
            </div>
            <svg className="sidebar-settings-icon" viewBox="0 0 24 24" width="17" height="17">
              <path fill="currentColor" d="M19.14 12.94a7.14 7.14 0 0 0 .06-.94 7.14 7.14 0 0 0-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.3 7.3 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54a7.3 7.3 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.65 8.84a.5.5 0 0 0 .12.64L4.8 11.06a7.14 7.14 0 0 0 0 1.88L2.77 14.5a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.4 1.05.71 1.63.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54c.58-.23 1.13-.54 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7"/>
            </svg>
          </button>
        )}
      </div>

      {menu && (
        <div
          className="sidebar-context-menu"
          ref={menuRef}
          style={{ left: menu.x, top: menu.y }}
        >
          <button className="sidebar-context-delete" onClick={handleDelete}>
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4zM6 9h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z"/>
            </svg>
            Delete chat
          </button>
        </div>
      )}
    </aside>
  );
}
