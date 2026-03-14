import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

/**
 * Admin Dashboard — Stats, Quality Metrics, Feedback Triage
 * Protected route — requires admin user.
 */
export default function AdminPage() {
  const { authFetch, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [quality, setQuality] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [feedbackFilter, setFeedbackFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, qualityRes, feedbackRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${localStorage.getItem('wanderlore-token') || ''}` } }),
        fetch('/api/admin/quality', { headers: { 'Authorization': `Bearer ${localStorage.getItem('wanderlore-token') || ''}` } }),
        fetch('/api/feedback', { headers: { 'Authorization': `Bearer ${localStorage.getItem('wanderlore-token') || ''}` } }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (qualityRes.ok) setQuality(await qualityRes.json());
      if (feedbackRes.ok) setFeedback(await feedbackRes.json());
    } catch (e) {
      console.error('Admin load failed:', e);
    }
    setLoading(false);
  };

  const updateFeedbackStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('wanderlore-token') || ''}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
      }
    } catch (e) {
      console.error('Status update failed:', e);
    }
  };

  const filteredFeedback = feedbackFilter === 'all'
    ? feedback
    : feedback.filter(f => f.status === feedbackFilter);

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'quality', label: '⭐ Quality' },
    { id: 'feedback', label: '💬 Feedback' },
  ];

  const statusColors = {
    new: 'var(--gold)',
    reviewed: '#4fc3f7',
    resolved: '#4caf50',
    dismissed: 'var(--muted)',
  };

  const categoryIcons = {
    idea: '💡',
    bug: '🐛',
    question: '❓',
    rating: '⭐',
  };

  return (
    <div style={{
      background: 'var(--obsidian)',
      minHeight: '100vh',
      color: 'var(--parchment)',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(201,168,76,0.08) 0%, transparent 100%)',
        borderBottom: '1px solid var(--gold-dim)',
        padding: '20px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Cinzel', serif",
            color: 'var(--gold-bright)',
            fontSize: '1.5rem',
            margin: 0,
          }}>
            Wanderlore AI — Admin
          </h1>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
            Platform management and quality metrics
          </div>
        </div>
        <a href="/" style={{
          color: 'var(--gold-dim)',
          textDecoration: 'none',
          fontSize: '0.8rem',
          fontFamily: "'Cinzel', serif",
          padding: '8px 16px',
          border: '1px solid var(--border-dim)',
          borderRadius: 6,
        }}>
          ← Back to App
        </a>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid var(--border-dim)',
        padding: '0 40px',
        background: 'rgba(0,0,0,0.2)',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '14px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--gold)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--gold)' : 'var(--muted)',
              cursor: 'pointer',
              fontFamily: "'Cinzel', serif",
              fontSize: '0.85rem',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
            Loading dashboard data...
          </div>
        ) : (
          <>
            {/* Overview tab */}
            {activeTab === 'overview' && (
              <div>
                <h2 style={{ fontFamily: "'Cinzel', serif", color: 'var(--gold)', marginBottom: 24, fontSize: '1.1rem' }}>
                  Platform Overview
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
                  {[
                    { label: 'Total Users', value: stats?.user_count ?? 0, icon: '👤', color: '#4fc3f7' },
                    { label: 'Campaigns', value: stats?.campaign_count ?? 0, icon: '⚔', color: 'var(--gold)' },
                    { label: 'Feedback', value: stats?.feedback_count ?? 0, icon: '💬', color: '#ce93d8' },
                  ].map((stat, i) => (
                    <div key={i} style={{
                      background: 'var(--stone)',
                      border: '1px solid var(--border-dim)',
                      borderRadius: 12,
                      padding: 24,
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: 8 }}>{stat.icon}</div>
                      <div style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: stat.color,
                        fontFamily: "'Fira Code', monospace",
                      }}>
                        {stat.value}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 4 }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick stats */}
                <div style={{
                  background: 'var(--stone)',
                  border: '1px solid var(--border-dim)',
                  borderRadius: 12,
                  padding: 24,
                }}>
                  <h3 style={{ fontFamily: "'Cinzel', serif", color: 'var(--silver)', marginBottom: 16, fontSize: '0.95rem' }}>
                    Quick Stats
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                    <div style={{ padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Avg Rating</div>
                      <div style={{ fontSize: '1.5rem', color: 'var(--gold)', fontFamily: "'Fira Code', monospace" }}>
                        {quality?.avg_rating !== null ? `${quality?.avg_rating}/5 ★` : 'No ratings yet'}
                      </div>
                    </div>
                    <div style={{ padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Rated Sessions</div>
                      <div style={{ fontSize: '1.5rem', color: '#4fc3f7', fontFamily: "'Fira Code', monospace" }}>
                        {quality?.rated_feedback ?? 0} / {quality?.total_feedback ?? 0}
                      </div>
                    </div>
                    <div style={{ padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Open Feedback</div>
                      <div style={{ fontSize: '1.5rem', color: '#ff9800', fontFamily: "'Fira Code', monospace" }}>
                        {feedback.filter(f => f.status === 'new').length}
                      </div>
                    </div>
                    <div style={{ padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Campaigns per User</div>
                      <div style={{ fontSize: '1.5rem', color: '#4caf50', fontFamily: "'Fira Code', monospace" }}>
                        {stats?.user_count > 0 ? (stats?.campaign_count / stats?.user_count).toFixed(1) : '0'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quality tab */}
            {activeTab === 'quality' && (
              <div>
                <h2 style={{ fontFamily: "'Cinzel', serif", color: 'var(--gold)', marginBottom: 24, fontSize: '1.1rem' }}>
                  AI Quality Metrics
                </h2>

                {/* Rating overview */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 20,
                  marginBottom: 32,
                }}>
                  <div style={{
                    background: 'var(--stone)',
                    border: '1px solid var(--border-dim)',
                    borderRadius: 12,
                    padding: 24,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 8 }}>Average Rating</div>
                    <div style={{ fontSize: '3rem', color: 'var(--gold)', fontFamily: "'Fira Code', monospace" }}>
                      {quality?.avg_rating !== null ? quality?.avg_rating?.toFixed(1) : '—'}
                    </div>
                    <div style={{ color: 'var(--gold-dim)', fontSize: '1.5rem' }}>
                      {'★'.repeat(Math.round(quality?.avg_rating || 0))}
                      {'☆'.repeat(5 - Math.round(quality?.avg_rating || 0))}
                    </div>
                  </div>
                  <div style={{
                    background: 'var(--stone)',
                    border: '1px solid var(--border-dim)',
                    borderRadius: 12,
                    padding: 24,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 8 }}>Total Feedback</div>
                    <div style={{ fontSize: '3rem', color: '#4fc3f7', fontFamily: "'Fira Code', monospace" }}>
                      {quality?.total_feedback ?? 0}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                      {quality?.rated_feedback ?? 0} with ratings
                    </div>
                  </div>
                  <div style={{
                    background: 'var(--stone)',
                    border: '1px solid var(--border-dim)',
                    borderRadius: 12,
                    padding: 24,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 8 }}>Rating Rate</div>
                    <div style={{ fontSize: '3rem', color: '#4caf50', fontFamily: "'Fira Code', monospace" }}>
                      {quality?.total_feedback > 0
                        ? `${Math.round((quality?.rated_feedback / quality?.total_feedback) * 100)}%`
                        : '—'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                      of responses rated
                    </div>
                  </div>
                </div>

                {/* Tag emission rates */}
                <div style={{
                  background: 'var(--stone)',
                  border: '1px solid var(--border-dim)',
                  borderRadius: 12,
                  padding: 24,
                }}>
                  <h3 style={{ fontFamily: "'Cinzel', serif", color: 'var(--silver)', marginBottom: 16, fontSize: '0.95rem' }}>
                    Tag Emission Rates
                  </h3>
                  {quality?.tag_rates && Object.keys(quality.tag_rates).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Object.entries(quality.tag_rates)
                        .sort((a, b) => b[1] - a[1])
                        .map(([tag, rate]) => (
                          <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 120,
                              fontSize: '0.72rem',
                              color: 'var(--silver)',
                              fontFamily: "'Fira Code', monospace",
                              textAlign: 'right',
                            }}>
                              {tag}
                            </div>
                            <div style={{
                              flex: 1,
                              height: 16,
                              background: 'rgba(0,0,0,0.3)',
                              borderRadius: 8,
                              overflow: 'hidden',
                            }}>
                              <div style={{
                                width: `${Math.min(rate * 100, 100)}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, var(--gold-dim), var(--gold))',
                                borderRadius: 8,
                                transition: 'width 0.5s ease',
                              }} />
                            </div>
                            <div style={{
                              width: 50,
                              fontSize: '0.7rem',
                              color: 'var(--muted)',
                              fontFamily: "'Fira Code', monospace",
                            }}>
                              {(rate * 100).toFixed(1)}%
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>
                      No tag data collected yet. Tags are tracked from feedback submissions.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Feedback tab */}
            {activeTab === 'feedback' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 style={{ fontFamily: "'Cinzel', serif", color: 'var(--gold)', fontSize: '1.1rem', margin: 0 }}>
                    Feedback Triage ({filteredFeedback.length})
                  </h2>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['all', 'new', 'reviewed', 'resolved', 'dismissed'].map(filter => (
                      <button
                        key={filter}
                        onClick={() => setFeedbackFilter(filter)}
                        style={{
                          padding: '6px 14px',
                          background: feedbackFilter === filter ? 'rgba(201,168,76,0.15)' : 'transparent',
                          border: `1px solid ${feedbackFilter === filter ? 'var(--gold-dim)' : 'var(--border-dim)'}`,
                          borderRadius: 6,
                          color: feedbackFilter === filter ? 'var(--gold)' : 'var(--muted)',
                          cursor: 'pointer',
                          fontSize: '0.72rem',
                          fontFamily: "'Fira Code', monospace",
                          textTransform: 'capitalize',
                        }}
                      >
                        {filter}
                        {filter !== 'all' && (
                          <span style={{ marginLeft: 6, opacity: 0.6 }}>
                            ({feedback.filter(f => f.status === filter).length})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredFeedback.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: 60,
                    color: 'var(--muted)',
                    background: 'var(--stone)',
                    borderRadius: 12,
                    border: '1px solid var(--border-dim)',
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: 12 }}>📭</div>
                    No {feedbackFilter === 'all' ? '' : feedbackFilter} feedback yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredFeedback.map(item => (
                      <div
                        key={item.id}
                        style={{
                          background: 'var(--stone)',
                          border: '1px solid var(--border-dim)',
                          borderLeft: `3px solid ${statusColors[item.status] || 'var(--border-dim)'}`,
                          borderRadius: 8,
                          padding: 20,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '1.1rem' }}>
                              {categoryIcons[item.category] || '💬'}
                            </span>
                            <span style={{
                              fontSize: '0.72rem',
                              color: statusColors[item.status],
                              fontFamily: "'Fira Code', monospace",
                              textTransform: 'uppercase',
                              letterSpacing: 1,
                            }}>
                              {item.status}
                            </span>
                            {item.rating && (
                              <span style={{ color: 'var(--gold)', fontSize: '0.8rem' }}>
                                {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.68rem', color: 'var(--muted)', fontFamily: "'Fira Code', monospace" }}>
                            {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
                          </span>
                        </div>

                        <p style={{
                          fontSize: '0.85rem',
                          color: 'var(--parchment)',
                          lineHeight: 1.6,
                          fontFamily: "'Crimson Text', serif",
                          margin: '8px 0 12px',
                        }}>
                          {item.message}
                        </p>

                        {/* Status actions */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {['new', 'reviewed', 'resolved', 'dismissed']
                            .filter(s => s !== item.status)
                            .map(newStatus => (
                              <button
                                key={newStatus}
                                onClick={() => updateFeedbackStatus(item.id, newStatus)}
                                style={{
                                  padding: '4px 12px',
                                  background: 'rgba(0,0,0,0.3)',
                                  border: `1px solid ${statusColors[newStatus]}`,
                                  borderRadius: 4,
                                  color: statusColors[newStatus],
                                  cursor: 'pointer',
                                  fontSize: '0.68rem',
                                  fontFamily: "'Fira Code', monospace",
                                  textTransform: 'capitalize',
                                }}
                              >
                                → {newStatus}
                              </button>
                            ))}
                        </div>

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                            {item.tags.map((tag, i) => (
                              <span key={i} style={{
                                padding: '2px 8px',
                                background: 'rgba(201,168,76,0.1)',
                                border: '1px solid var(--gold-dim)',
                                borderRadius: 4,
                                fontSize: '0.65rem',
                                color: 'var(--gold-dim)',
                                fontFamily: "'Fira Code', monospace",
                              }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
