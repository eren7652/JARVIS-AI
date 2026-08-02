import Orb from './Orb.jsx';
import './MessageBubble.css';

export default function MessageBubble({ role, text, image, ts }) {
  if (role === 'system') {
    return <div className="msg-system">{text}</div>;
  }

  const isUser = role === 'user';
  const isError = role === 'error';

  return (
    <div className={`msg-row ${isUser ? 'msg-row-user' : 'msg-row-jarvis'}`}>
      {!isUser && (
        <div className="msg-avatar">
          <Orb state="idle" size={30} />
        </div>
      )}
      <div className={`msg-bubble ${isUser ? 'msg-user' : 'msg-jarvis'} ${isError ? 'msg-error' : ''}`}>
        {image && <img className="msg-image" src={image} alt="attachment" />}
        {text && <div className="msg-text">{text}</div>}
        {ts && <div className="msg-ts">{ts}</div>}
      </div>
    </div>
  );
}
