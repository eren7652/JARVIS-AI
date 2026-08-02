import { useRef } from 'react';
import { t } from '../i18n/index.js';
import './InputBar.css';

export default function InputBar({
  value, onChange, onSubmit, onMicClick, micActive, micSupported, lang,
  imagePreview, onImageSelect, onImageRemove,
}) {
  const fileInputRef = useRef(null);

  return (
    <div className="input-bar-wrap">
      {imagePreview && (
        <div className="input-image-preview">
          <img src={imagePreview} alt="attachment preview" />
          <button type="button" className="input-image-remove" onClick={onImageRemove} aria-label="Remove image">
            <svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M6.4 5L5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6z"/></svg>
          </button>
        </div>
      )}
      <form className="input-bar" onSubmit={onSubmit}>
        <button
          type="button"
          className="attach-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Attach an image"
        >
          <svg viewBox="0 0 24 24" width="19" height="19">
            <path fill="currentColor" d="M16.5 6v11.5a4 4 0 0 1-8 0V5a2.5 2.5 0 0 1 5 0v10.5a1 1 0 0 1-2 0V6H10v9.5a2.5 2.5 0 0 0 5 0V5a4 4 0 0 0-8 0v12.5a5.5 5.5 0 0 0 11 0V6z"/>
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImageSelect(file);
            e.target.value = '';
          }}
        />

        <button
          type="button"
          className={`mic-btn ${micActive ? 'active' : ''}`}
          onClick={onMicClick}
          disabled={!micSupported}
          title={micSupported ? 'Toggle voice input' : 'Voice input not supported in this browser'}
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"/>
            <path fill="currentColor" d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 1 0 2 0v-3.08A7 7 0 0 0 19 11z"/>
          </svg>
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t(lang, 'inputPlaceholder')}
          autoComplete="off"
        />
        <button type="submit" className="send-btn">{t(lang, 'send')}</button>
      </form>
    </div>
  );
}
