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
  const saveTimerRef = useRef(null);
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

      // Include campaign name from game data if available
      const worldName = state?.gameData?.campaign?.worldName;
      if (worldName && worldName !== 'New Campaign') {
        payload.name = worldName;
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

  // Debounced auto-save every 30s when game data changes
  useEffect(() => {
    if (!isAuthenticated || !campaignIdRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(syncToCloud, 30000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [state?.gameData, state?.chatMessages, syncToCloud, isAuthenticated]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (campaignIdRef.current && isAuthenticated) {
        syncToCloud();
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
