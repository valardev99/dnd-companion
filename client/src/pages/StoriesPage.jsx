import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const SORT_TABS = [
  { key: 'recent', label: 'Recent' },
  { key: 'most_liked', label: 'Most Liked' },
];

const PAGE_SIZE = 12;

export default function StoriesPage() {
  const { authFetch, isAuthenticated } = useAuth();

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState('recent');
  const [expandedId, setExpandedId] = useState(null);
  const [likingIds, setLikingIds] = useState(new Set());

  const fetchStories = useCallback(async (pageNum, sortBy, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    setError('');

    try {
      const res = await fetch(`/api/stories?page=${pageNum}&limit=${PAGE_SIZE}&sort=${sortBy}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to load stories');
      }
      const data = await res.json();
      const newStories = data.stories || data.items || data || [];
      const totalPages = data.total_pages || data.totalPages;

      if (append) {
        setStories(prev => [...prev, ...newStories]);
      } else {
        setStories(newStories);
      }

      // Determine if there are more pages
      if (totalPages !== undefined) {
        setHasMore(pageNum < totalPages);
      } else {
        setHasMore(newStories.length >= PAGE_SIZE);
      }
    } catch (e) {
      setError(e.message || 'Failed to load stories.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial fetch and re-fetch on sort change
  useEffect(() => {
    setPage(1);
    setExpandedId(null);
    fetchStories(1, sort, false);
  }, [sort, fetchStories]);

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchStories(nextPage, sort, true);
  }, [page, sort, fetchStories]);

  const handleSortChange = useCallback((newSort) => {
    if (newSort !== sort) {
      setSort(newSort);
    }
  }, [sort]);

  const handleToggleExpand = useCallback((id) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const handleLike = useCallback(async (e, storyId) => {
    e.stopPropagation();
    if (likingIds.has(storyId)) return;

    setLikingIds(prev => new Set([...prev, storyId]));
    try {
      const fetchFn = isAuthenticated ? authFetch : fetch;
      const res = await fetchFn(`/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setStories(prev => prev.map(s =>
          (s.id === storyId || s._id === storyId)
            ? { ...s, likes: data.likes !== undefined ? data.likes : (s.likes || 0) + 1, liked: true }
            : s
        ));
      }
    } catch {
      // Silently fail
    } finally {
      setLikingIds(prev => {
        const next = new Set(prev);
        next.delete(storyId);
        return next;
      });
    }
  }, [likingIds, isAuthenticated, authFetch]);

  const truncate = (text, len = 150) => {
    if (!text || text.length <= len) return text || '';
    return text.slice(0, len).trimEnd() + '...';
  };

  return (
    <div className="stories-page">
      {/* Navigation */}
      <nav className="stories-nav">
        <Link to="/" className="stories-nav-brand">WONDERLORE</Link>
        <div className="stories-nav-links">
          <Link to="/">Home</Link>
          <Link to="/play">Play</Link>
          <Link to="/stories" className="stories-nav-active">Stories</Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="stories-hero">
        <div className="stories-hero-rune">{'\u2726'} {'\u2726'} {'\u2726'}</div>
        <h1 className="stories-hero-title">Community Stories</h1>
        <p className="stories-hero-subtitle">
          Epic tales from adventurers across the realms. Read, like, and share your own journey.
        </p>
        <div className="stories-hero-divider" />
      </header>

      {/* Sort Tabs */}
      <div className="stories-container">
        <div className="stories-tab-bar">
          {SORT_TABS.map(tab => (
            <button
              key={tab.key}
              className={`stories-tab ${sort === tab.key ? 'active' : ''}`}
              onClick={() => handleSortChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="stories-error">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="stories-loading">
            <div className="stories-spinner" />
            <span>Loading tales from the archives...</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && stories.length === 0 && (
          <div className="stories-empty">
            <div className="stories-empty-icon">{'\uD83D\uDCDC'}</div>
            <h3>No Stories Yet</h3>
            <p>Be the first to share your adventure. Start playing and share your journey!</p>
            <Link to="/play" className="stories-cta-btn">Begin Your Adventure</Link>
          </div>
        )}

        {/* Story Grid */}
        {!loading && stories.length > 0 && (
          <>
            <div className="stories-grid">
              {stories.map(story => {
                const id = story.id || story._id;
                const isExpanded = expandedId === id;
                return (
                  <div
                    key={id}
                    className={`story-card ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => handleToggleExpand(id)}
                  >
                    <div className="story-card-header">
                      <h3 className="story-card-title">{story.title || 'Untitled Tale'}</h3>
                      <span className="story-card-expand">{isExpanded ? '\u25B2' : '\u25BC'}</span>
                    </div>

                    <p className="story-card-excerpt">
                      {isExpanded
                        ? (story.recap || story.content || story.excerpt || 'No content available.')
                        : truncate(story.excerpt || story.recap || story.content || '', 150)
                      }
                    </p>

                    <div className="story-card-meta">
                      <div className="story-card-author">
                        <span className="story-meta-icon">{'\uD83D\uDDE1\uFE0F'}</span>
                        <span>{story.character_name || story.characterName || 'Unknown Hero'}</span>
                        {(story.character_class || story.characterClass) && (
                          <span className="story-card-class">
                            {story.character_class || story.characterClass}
                          </span>
                        )}
                      </div>
                      <div className="story-card-by">
                        by {story.author || story.username || 'Anonymous'}
                      </div>
                    </div>

                    <div className="story-card-footer">
                      <button
                        className={`story-like-btn ${story.liked ? 'liked' : ''}`}
                        onClick={(e) => handleLike(e, id)}
                        disabled={likingIds.has(id)}
                      >
                        <span>{story.liked ? '\u2764\uFE0F' : '\u2661'}</span>
                        <span>{story.likes || 0}</span>
                      </button>
                      {story.world_name || story.worldName ? (
                        <span className="story-card-world">
                          {'\uD83C\uDF0D'} {story.world_name || story.worldName}
                        </span>
                      ) : null}
                      {story.level && (
                        <span className="story-card-level">Lvl {story.level}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="stories-load-more">
                <button
                  className="stories-load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <span style={{display:'inline-flex',alignItems:'center',gap:8}}>
                      <span className="stories-spinner-small" /> Loading...
                    </span>
                  ) : (
                    'Load More Tales'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="stories-footer">
        <span className="stories-footer-brand">WONDERLORE</span>
        <div className="stories-footer-links">
          <Link to="/">Home</Link>
          <Link to="/play">Play</Link>
          <Link to="/stories">Stories</Link>
        </div>
        <span className="stories-footer-copy">Forged in imagination</span>
      </footer>
    </div>
  );
}
