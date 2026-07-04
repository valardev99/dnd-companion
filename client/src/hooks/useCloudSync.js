import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

/**
 * Cloud sync hook — saves game state to backend as primary store,
 * with localStorage as offline fallback.
 *
 * Debounces saves every 30s and flushes on unmount.
 */
export function useCloudSync(state, dispatch) {
  const { isAuthenticated, authFetch } = useAuth();
  const isSyncingRef = useRef(false);
  const lastSavedRef = useRef(null); // track last saved hash to avoid no-op saves
  const campaignIdRef = useRef(state?.activeSaveId || null);

  // Keep campaignId ref in sync with state
  useEffect(() => {
    if (state?.activeSaveId) {
      campaignIdRef.current = state.activeSaveId;
    }
  }, [state?.activeSaveId]);

  // Save to backend
  const syncToCloud = useCallback(async () => {
    const campaignId = campaignIdRef.current;
    if (!isAuthenticated || isSyncingRef.current || !campaignId) return;

    isSyncingRef.current = true;
    try {
      const chatHistory = (state?.chatMessages || []).slice(-100).map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));

      const payload = {
        game_data: state?.gameData || {},
        chat_history: chatHistory,
        last_played_at: new Date().toISOString(),
      };

      // Include campaign name from game data if available.
      // NOTE: the field is campaign.name (see defaultGameData.js and the
      // UPDATE_CAMPAIGN reducer) — reading .worldName here silently dropped
      // every mid-session rename from sync.
      const campaignName = state?.gameData?.campaign?.name;
      if (campaignName && campaignName !== 'New Campaign' && campaignName !== 'New World') {
        payload.name = campaignName;
      }

      // Also include world_bible if present
      if (state?.worldBible) {
        payload.world_bible = state.worldBible;
      }

      await authFetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      lastSavedRef.current = Date.now();
    } catch (e) {
      console.warn('[CloudSync] Save failed, localStorage fallback active:', e);
    } finally {
      isSyncingRef.current = false;
    }
  }, [isAuthenticated, authFetch, state?.gameData, state?.chatMessages, state?.worldBible]);

  // Keep the latest sync fn + auth state in refs so interval/unmount callbacks
  // never run a stale closure. (The old [] unmount effect captured the
  // FIRST-render syncToCloud — which closed over initial/empty state — and
  // could overwrite real progress with a blank snapshot on navigate-away.)
  const syncRef = useRef(syncToCloud);
  const authRef = useRef(isAuthenticated);
  useEffect(() => { syncRef.current = syncToCloud; authRef.current = isAuthenticated; });

  // Dirty-flag + fixed interval instead of a trailing debounce. The old
  // debounce RESET on every state change, so during active play (a change
  // at least every 30s) it never fired at all.
  const dirtyRef = useRef(false);
  useEffect(() => { dirtyRef.current = true; }, [state?.gameData, state?.chatMessages]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyRef.current && authRef.current && campaignIdRef.current) {
        dirtyRef.current = false;
        syncRef.current();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Save on unmount — via refs, so it flushes the LATEST state
  useEffect(() => {
    return () => {
      if (campaignIdRef.current && authRef.current) {
        syncRef.current();
      }
    };
  }, []);

  // Fetch campaign from backend and hydrate state
  const loadFromCloud = useCallback(async (campaignId) => {
    if (!isAuthenticated || !campaignId) return false;

    try {
      const res = await authFetch(`/api/campaigns/${campaignId}`);
      if (!res.ok) return false;

      const campaign = await res.json();
      campaignIdRef.current = campaignId;

      // Hydrate game state from backend
      const loadPayload = {};

      if (campaign.game_data) {
        loadPayload.gameData = campaign.game_data;
      }
      // Sync campaign name from server into game data
      if (campaign.name) {
        loadPayload.gameData = loadPayload.gameData || {};
        loadPayload.gameData.campaign = loadPayload.gameData.campaign || {};
        if (!loadPayload.gameData.campaign.name || loadPayload.gameData.campaign.name === 'Wonderlore AI') {
          loadPayload.gameData.campaign.name = campaign.name;
        }
      }
      if (campaign.world_bible) {
        loadPayload.worldBible = campaign.world_bible;
      }
      if (campaign.chat_history && Array.isArray(campaign.chat_history)) {
        loadPayload.chatMessages = campaign.chat_history;
      }
      if (campaign.session_summary) {
        loadPayload.sessionSummary = campaign.session_summary;
      }

      loadPayload.activeSaveId = campaignId;

      if (Object.keys(loadPayload).length > 0) {
        dispatch({ type: 'LOAD_GAME_STATE', payload: loadPayload });
      }

      return true;
    } catch (e) {
      console.warn('[CloudSync] Failed to load from cloud:', e);
      return false;
    }
  }, [isAuthenticated, authFetch, dispatch]);

  return {
    campaignId: campaignIdRef.current,
    setCampaignId: (id) => { campaignIdRef.current = id; },
    syncNow: syncToCloud,
    loadFromCloud,
    isSyncing: isSyncingRef.current,
  };
}
