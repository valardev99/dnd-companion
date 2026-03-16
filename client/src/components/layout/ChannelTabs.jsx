import React from 'react';
import '../../styles/channel-tabs.css';

const SINGLE_PLAYER_CHANNELS = [
  { id: 'story', label: 'Story', color: 'var(--gold)' },
  { id: 'whisper', label: 'Whisper', color: 'var(--msg-other-purple)' },
];

const MULTIPLAYER_CHANNELS = [
  { id: 'story', label: 'Story', color: 'var(--gold)' },
  { id: 'ooc', label: 'OOC', color: 'var(--channel-ooc)' },
  { id: 'whisper', label: 'Whisper', color: 'var(--msg-other-purple)' },
];

export default function ChannelTabs({ activeChannel, onChannelChange, multiplayer = false, unreadChannels = {} }) {
  const channels = multiplayer ? MULTIPLAYER_CHANNELS : SINGLE_PLAYER_CHANNELS;

  return (
    <div className="channel-tabs">
      {channels.map(ch => (
        <button
          key={ch.id}
          className={`channel-tab ${activeChannel === ch.id ? 'active' : ''}`}
          style={{
            '--tab-color': ch.color,
          }}
          onClick={() => onChannelChange(ch.id)}
        >
          {ch.label}
          {unreadChannels[ch.id] && <span className="channel-unread-dot" />}
        </button>
      ))}
    </div>
  );
}
