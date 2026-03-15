import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext.jsx';
import { sendChatMessage } from '../../services/chatService.js';
import { formatDMText } from '../../utils/textFormatter.jsx';
import SessionRating from '../shared/SessionRating.jsx';
import { sendPlayerAction, onMultiplayerMessage } from '../../services/socketService.js';

function ChatPanel({ multiplayer, campaignId, className }) {
  const { state, dispatch } = useGame();
  const [input, setInput] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);

  // Multiplayer: listen for other player's messages via WebSocket
  useEffect(() => {
    if (!multiplayer) return;
    const cleanup = onMultiplayerMessage((data) => {
      dispatch({
        type: 'ADD_CHAT_MESSAGE',
        payload: {
          role: 'dm',
          content: data.content,
          playerName: data.player_name,
          isMultiplayer: true,
        },
      });
    });
    return cleanup;
  }, [multiplayer, dispatch]);

  // Auto-scroll to bottom on new messages (only if near bottom)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    if (isNearBottom) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatMessages, state.isStreaming]);

  // Track scroll position for "new message" button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const onScroll = () => {
      const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowScrollBtn(distFromBottom > 150);
    };
    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-send opening scene message when a new campaign starts
  useEffect(() => {
    if (state.pendingOpening && state.apiKey && state.worldBible && !state.isStreaming) {
      dispatch({ type: 'SET_PENDING_OPENING', payload: false });
      const worldName = state.gameData.campaign.name || 'this world';
      const openingMsg = `[SYSTEM] A new campaign in ${worldName} has begun. Welcome the player, set the opening scene, establish initial character stats via metadata tags, and ask the player what they want to do.`;
      sendChatMessage(openingMsg, state, dispatch);
    }
  }, [state.pendingOpening, state.apiKey, state.worldBible]);

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || state.isStreaming) return;
    setInput('');
    // In multiplayer, also broadcast the action to the other player via WebSocket
    if (multiplayer && campaignId) {
      sendPlayerAction(campaignId, msg);
    }
    sendChatMessage(msg, state, dispatch);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const textSizeMap = { small: '0.85rem', medium: '0.95rem', large: '1.1rem', xl: '1.25rem' };
  const chatTextVar = textSizeMap[state.chatTextSize || 'medium'] || '0.95rem';

  return (
    <div className={`chat-panel ${className || ''}`} style={{ '--chat-text-size': chatTextVar }}>
      <div className="chat-messages" ref={messagesContainerRef}>
        {state.chatMessages.length === 0 && (
          <div className="chat-welcome">
            <div style={{fontSize:'2rem',marginBottom:12}}>⚔️</div>
            <h2 style={{fontFamily:"'Cinzel',serif",color:'var(--gold)',marginBottom:8}}>{state.gameData.campaign.name}</h2>
            <p style={{color:'var(--silver)',fontSize:'0.85rem',lineHeight:1.6,maxWidth:400}}>
              Your AI Dungeon Master awaits. Type a message to begin your adventure.
            </p>
            {state.apiStatus !== 'connected' && (
              <p style={{color:'var(--amber)',fontSize:'0.78rem',marginTop:12,fontFamily:"'Fira Code',monospace"}}>
                ⚙ Configure your API key in Settings to connect
              </p>
            )}
            {state.apiStatus === 'connected' && (
              <p style={{color:'var(--emerald-bright)',fontSize:'0.78rem',marginTop:12,fontFamily:"'Fira Code',monospace"}}>
                ● Connected — Ready to play
              </p>
            )}
          </div>
        )}

        {state.chatMessages.map((msg, i) => (
          <React.Fragment key={msg.id || i}>
            <div className={`message-bubble ${msg.role === 'player' ? 'player' : msg.role === 'system' ? 'system-msg' : 'dm'} ${msg.isMultiplayer ? 'multiplayer-msg' : ''}`}>
              {msg.role === 'dm' && !msg.playerName && <div className="message-sender">The DM</div>}
              {msg.role === 'dm' && msg.playerName && (
                <div className="message-sender multiplayer-sender" style={{ color: 'var(--frost)' }}>
                  {msg.playerName}
                </div>
              )}
              {msg.role === 'player' && <div className="message-sender">{multiplayer && msg.playerName ? msg.playerName : 'You'}</div>}
              {msg.role === 'system' && <div className="message-sender">System</div>}
              <div className="message-content">{msg.role === 'dm' ? formatDMText(msg.content) : (msg.content || (state.isStreaming && i === state.chatMessages.length - 1 ? '' : ''))}</div>
            </div>
            {/* Show rating widget after completed DM messages (not during streaming) */}
            {msg.role === 'dm' && msg.content && !(state.isStreaming && i === state.chatMessages.length - 1) && i === state.chatMessages.length - 1 && (
              <SessionRating messageId={msg.id} />
            )}
          </React.Fragment>
        ))}

        {state.isStreaming && (
          <div className="typing-indicator">
            <span>The DM is writing</span>
            <div className="typing-dots">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {showScrollBtn && (
        <div className="scroll-to-bottom" onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}>
          ↓ New messages
        </div>
      )}

      {state.apiStatus !== 'connected' ? (
        <div className="chat-disconnected-overlay">
          <span className="disconnected-icon">🔑</span>
          <span>Connect your API key in <strong>Settings</strong> to begin</span>
        </div>
      ) : (
        <div className="chat-input-area">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={state.isStreaming ? 'Waiting for the DM...' : 'What do you do?'}
            disabled={state.isStreaming}
            rows={2}
          />
          <button className="chat-send-btn" onClick={handleSend} disabled={state.isStreaming || !input.trim()} aria-label="Send message">
            ⚔
          </button>
        </div>
      )}
    </div>
  );
}

export default ChatPanel;
