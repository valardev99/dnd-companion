import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function LobbyPage() {
  const { id } = useParams();
  const { user } = useAuth();

  return (
    <div className="hub-layout" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex', minHeight: '100vh', background: 'var(--obsidian)' }}>
      <div className="card" style={{ maxWidth: 500, textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Cinzel', serif", color: 'var(--gold)', marginBottom: 16 }}>
          Multiplayer Lobby
        </h1>
        <p style={{ fontFamily: "'Crimson Text', serif", color: 'var(--silver)', fontSize: '1.1rem', marginBottom: 8 }}>
          Lobby #{id}
        </p>
        <p style={{ fontFamily: "'Crimson Text', serif", color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 24 }}>
          The multiplayer lobby is being forged in the fires of creation. Return soon, adventurer.
        </p>
        <Link to="/play" style={{
          display: 'inline-block',
          fontFamily: "'Cinzel', serif",
          fontSize: '0.85rem',
          color: 'var(--gold)',
          textDecoration: 'none',
          padding: '10px 24px',
          border: '1px solid var(--gold-dim)',
          transition: 'all 0.2s',
        }}>
          Return to Command Center
        </Link>
      </div>
    </div>
  );
}
