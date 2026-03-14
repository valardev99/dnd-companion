import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export function useCloudSync(gameData, worldBible, onLoad) {
  const { isAuthenticated, authFetch } = useAuth();
  const saveTimerRef = useRef(null);
  const campaignIdRef = useRef(null);
  const isSyncingRef = useRef(false);

  // Auto-save to cloud every 30s when authenticated
  const syncToCloud = useCallback(async () => {
    if (!isAuthenticated || isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      if (campaignIdRef.current) {
        // Update existing campaign
        await authFetch(`/api/campaigns/${campaignIdRef.current}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ game_data: gameData, world_bible: worldBible }),
        });
      }
    } catch (e) {
      console.warn('Cloud sync failed:', e);
    } finally {
      isSyncingRef.current = false;
    }
  }, [isAuthenticated, authFetch, gameData, worldBible]);

  // Debounced auto-save
  useEffect(() => {
    if (!isAuthenticated || !campaignIdRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(syncToCloud, 30000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [gameData, syncToCloud, isAuthenticated]);

  return {
    campaignId: campaignIdRef.current,
    setCampaignId: (id) => { campaignIdRef.current = id; },
    syncNow: syncToCloud,
    isSyncing: isSyncingRef.current,
  };
}
