# Profile Drawer Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a clickable avatar in the hub sidebar that opens a slide-out profile drawer for editing display name and avatar.

**Architecture:** A `ProfileDrawer` component slides over the main content when the user clicks their avatar in the bottom of `HubNav`. The backend gets a new `PUT /auth/profile` endpoint. Avatar selection uses preset fantasy character icons (stored as `preset:<id>` strings). The `UserResponse` schema and `_user_response` helper are extended to include `display_name` and `avatar_url` so profile data flows through the existing auth pipeline.

**Tech Stack:** React 19, FastAPI, SQLAlchemy async, CSS transitions

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `client/src/components/hub/ProfileDrawer.jsx` | Create | Slide-out drawer with avatar grid, display name input, friend code display |
| `client/src/components/hub/avatarPresets.js` | Create | Array of `{ id, label, emoji }` preset avatar data |
| `client/src/components/hub/HubNav.jsx` | Modify | Add clickable avatar button above Sign Out, toggle drawer |
| `client/src/pages/HubPage.jsx` | Modify | Render `ProfileDrawer`, manage open/close state |
| `client/src/contexts/AuthContext.jsx` | Modify | Add `updateProfile` method, expose `setUser` for optimistic updates |
| `client/src/styles/hub.css` | Modify | Drawer slide animation, avatar styles, backdrop |
| `server/app/routes/auth.py` | Modify | Add `PUT /auth/profile` endpoint, extend `UserResponse` + `_user_response` with `display_name`/`avatar_url` |

---

## Chunk 1: Backend — Profile Update Endpoint

### Task 1: Add `PUT /auth/profile` endpoint and extend UserResponse

**Files:**
- Modify: `server/app/routes/auth.py`

- [ ] **Step 1: Add `UpdateProfileRequest` schema to auth.py**

Add after `ApiKeyRequest`:

```python
class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
```

- [ ] **Step 2: Extend `UserResponse` with profile fields**

Add `display_name` and `avatar_url` to `UserResponse`:

```python
class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    is_admin: bool
    has_api_key: bool
    friend_code: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True
```

- [ ] **Step 3: Update `_user_response` helper**

```python
def _user_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=user.email,
        username=user.username,
        is_admin=user.is_admin,
        has_api_key=user.encrypted_api_key is not None,
        friend_code=user.friend_code,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
    )
```

- [ ] **Step 4: Add PUT /auth/profile route**

Add after the `store_api_key` route:

```python
@router.put("/auth/profile", response_model=UserResponse)
async def update_profile(
    body: UpdateProfileRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's display name and/or avatar."""
    if body.display_name is not None:
        clean = body.display_name.strip()
        if len(clean) > 100:
            raise HTTPException(status_code=400, detail="Display name too long (max 100)")
        user.display_name = clean if clean else None
    if body.avatar_url is not None:
        if body.avatar_url and not body.avatar_url.startswith("preset:"):
            raise HTTPException(status_code=400, detail="Invalid avatar format")
        user.avatar_url = body.avatar_url if body.avatar_url else None
    db.add(user)
    await db.flush()
    return _user_response(user)
```

- [ ] **Step 5: Verify backend starts without errors**

Run: `cd server && python -c "from app.routes.auth import router; print('OK')"`
Expected: `OK`

- [ ] **Step 6: Commit**

```bash
git add server/app/routes/auth.py
git commit -m "feat: add PUT /auth/profile endpoint with display_name and avatar_url"
```

---

## Chunk 2: Frontend — Avatar Presets + ProfileDrawer Component

### Task 2: Create avatar presets data

**Files:**
- Create: `client/src/components/hub/avatarPresets.js`

- [ ] **Step 1: Create avatarPresets.js**

```javascript
const avatarPresets = [
  { id: 'warrior', label: 'Warrior', emoji: '\u2694\uFE0F' },
  { id: 'mage', label: 'Mage', emoji: '\uD83E\uDDD9' },
  { id: 'rogue', label: 'Rogue', emoji: '\uD83D\uDDE1\uFE0F' },
  { id: 'ranger', label: 'Ranger', emoji: '\uD83C\uDFF9' },
  { id: 'cleric', label: 'Cleric', emoji: '\u2728' },
  { id: 'paladin', label: 'Paladin', emoji: '\uD83D\uDEE1\uFE0F' },
  { id: 'bard', label: 'Bard', emoji: '\uD83C\uDFB6' },
  { id: 'druid', label: 'Druid', emoji: '\uD83C\uDF3F' },
  { id: 'necromancer', label: 'Necromancer', emoji: '\uD83D\uDC80' },
  { id: 'monk', label: 'Monk', emoji: '\u270A' },
  { id: 'warlock', label: 'Warlock', emoji: '\uD83D\uDD25' },
  { id: 'artificer', label: 'Artificer', emoji: '\u2699\uFE0F' },
];

export default avatarPresets;

export function getAvatarEmoji(avatarUrl) {
  if (!avatarUrl) return '\uD83E\uDDD9';
  const id = avatarUrl.replace('preset:', '');
  const preset = avatarPresets.find(p => p.id === id);
  return preset ? preset.emoji : '\uD83E\uDDD9';
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/hub/avatarPresets.js
git commit -m "feat: add avatar preset data for profile selection"
```

### Task 3: Create ProfileDrawer component

**Files:**
- Create: `client/src/components/hub/ProfileDrawer.jsx`

- [ ] **Step 1: Create ProfileDrawer.jsx**

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import avatarPresets, { getAvatarEmoji } from './avatarPresets.js';

export default function ProfileDrawer({ isOpen, onClose }) {
  const { user, authFetch, setUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [showAvatarGrid, setShowAvatarGrid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync form state when drawer opens or user changes
  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.display_name || '');
      setSelectedAvatar(user.avatar_url || '');
      setShowAvatarGrid(false);
    }
  }, [isOpen, user]);

  const hasChanges =
    (displayName !== (user?.display_name || '')) ||
    (selectedAvatar !== (user?.avatar_url || ''));

  const handleSave = useCallback(async () => {
    if (!hasChanges || saving) return;
    setSaving(true);
    try {
      const res = await authFetch('/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName || null,
          avatar_url: selectedAvatar || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(prev => ({ ...prev, ...updated }));
        onClose();
      }
    } catch (e) {
      // silently fail
    } finally {
      setSaving(false);
    }
  }, [hasChanges, saving, displayName, selectedAvatar, authFetch, setUser, onClose]);

  const handleCopyCode = useCallback(() => {
    if (user?.friend_code) {
      navigator.clipboard.writeText(user.friend_code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [user]);

  if (!user) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`profile-drawer-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`profile-drawer ${isOpen ? 'open' : ''}`}>
        <div className="profile-drawer-header">
          <h2 className="profile-drawer-title">Profile</h2>
          <button className="profile-drawer-close" onClick={onClose} title="Close">
            {'\u2715'}
          </button>
        </div>

        <div className="profile-drawer-body">
          {/* Avatar */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-large">
              {getAvatarEmoji(selectedAvatar)}
            </div>
            <button
              className="profile-avatar-change"
              onClick={() => setShowAvatarGrid(!showAvatarGrid)}
            >
              {showAvatarGrid ? 'Close' : 'Change Avatar'}
            </button>

            {showAvatarGrid && (
              <div className="profile-avatar-grid">
                {avatarPresets.map(preset => (
                  <button
                    key={preset.id}
                    className={`profile-avatar-option ${selectedAvatar === 'preset:' + preset.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedAvatar('preset:' + preset.id);
                      setShowAvatarGrid(false);
                    }}
                    title={preset.label}
                  >
                    {preset.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Display Name */}
          <div className="profile-field">
            <label className="profile-field-label">Display Name</label>
            <input
              type="text"
              className="profile-field-input"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={user.username}
              maxLength={100}
            />
          </div>

          {/* Username (read-only) */}
          <div className="profile-field">
            <label className="profile-field-label">Username</label>
            <div className="profile-field-readonly">
              {user.username}
              <span className="profile-field-hint">(cannot change)</span>
            </div>
          </div>

          {/* Friend Code */}
          <div className="profile-field">
            <label className="profile-field-label">Friend Code</label>
            <div className="profile-friend-code" onClick={handleCopyCode} title="Click to copy">
              <span className="profile-friend-code-value">#{user.friend_code}</span>
              <span className="profile-friend-code-copy">
                {copied ? 'Copied!' : 'Copy'}
              </span>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="profile-drawer-footer">
          <button
            className="profile-save-btn"
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/hub/ProfileDrawer.jsx
git commit -m "feat: create ProfileDrawer component with avatar selection"
```

---

## Chunk 3: Frontend — Wire Up Sidebar, AuthContext, and Styles

### Task 4: Add `setUser` to AuthContext exports

**Files:**
- Modify: `client/src/contexts/AuthContext.jsx`

- [ ] **Step 1: Expose `setUser` in the provider value**

Change the Provider value (line ~101-104):

```jsx
// FROM:
value={{
  user, token, loading,
  isAuthenticated: !!user,
  register, login, logout, storeApiKey, authFetch,
}}

// TO:
value={{
  user, setUser, token, loading,
  isAuthenticated: !!user,
  register, login, logout, storeApiKey, authFetch,
}}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/contexts/AuthContext.jsx
git commit -m "feat: expose setUser from AuthContext for profile updates"
```

### Task 5: Add clickable avatar to HubNav

**Files:**
- Modify: `client/src/components/hub/HubNav.jsx`

- [ ] **Step 1: Update HubNav to show avatar and trigger drawer**

Replace the full component:

```jsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { getAvatarEmoji } from './avatarPresets.js';

const navItems = [
  { id: 'campaigns', icon: '\u2694\uFE0F', label: 'Campaigns' },
  { id: 'friends', icon: '\uD83D\uDEE1\uFE0F', label: 'Allies' },
  { id: 'settings', icon: '\u2699\uFE0F', label: 'Settings' },
];

export default function HubNav({ activeView, onNavigate, onProfileClick }) {
  const { user, logout } = useAuth();

  return (
    <nav className="hub-nav">
      <div className="hub-nav-logo">
        <div className="hub-nav-logo-icon">W</div>
        <div className="hub-nav-logo-text">Wanderlore</div>
      </div>

      <div className="hub-nav-divider" />

      <ul className="hub-nav-items">
        {navItems.map(item => (
          <li key={item.id}>
            <button
              className={`hub-nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              title={item.label}
            >
              <span className="hub-nav-item-icon">{item.icon}</span>
              <span className="hub-nav-item-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="hub-nav-spacer" />

      <div className="hub-nav-bottom">
        {/* Profile Avatar */}
        <button
          className="hub-nav-profile-btn"
          onClick={onProfileClick}
          title="Edit Profile"
        >
          <div className="hub-nav-profile-avatar">
            {getAvatarEmoji(user?.avatar_url)}
          </div>
          <span className="hub-nav-profile-name">
            {user?.display_name || user?.username || 'Adventurer'}
          </span>
        </button>

        <button className="hub-nav-item hub-nav-logout" onClick={logout} title="Sign Out">
          <span className="hub-nav-item-icon">{'\uD83D\uDEAA'}</span>
          <span className="hub-nav-item-label">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/hub/HubNav.jsx
git commit -m "feat: add clickable profile avatar to hub sidebar"
```

### Task 6: Wire ProfileDrawer into HubPage

**Files:**
- Modify: `client/src/pages/HubPage.jsx`

- [ ] **Step 1: Add drawer state and render ProfileDrawer**

```jsx
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import HubNav from '../components/hub/HubNav.jsx';
import HubTopBar from '../components/hub/HubTopBar.jsx';
import CampaignsView from '../components/hub/CampaignsView.jsx';
import FriendsView from '../components/hub/FriendsView.jsx';
import SettingsView from '../components/hub/SettingsView.jsx';
import ProfileDrawer from '../components/hub/ProfileDrawer.jsx';

export default function HubPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeView, setActiveView] = useState('campaigns');
  const [profileOpen, setProfileOpen] = useState(false);

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/" />;

  const titles = {
    campaigns: 'Campaigns',
    friends: 'Allies',
    settings: 'Settings',
  };

  const views = { campaigns: CampaignsView, friends: FriendsView, settings: SettingsView };
  const ActiveView = views[activeView];

  return (
    <div className="hub-layout">
      <HubNav
        activeView={activeView}
        onNavigate={setActiveView}
        onProfileClick={() => setProfileOpen(true)}
      />
      <div className="hub-main">
        <HubTopBar title={titles[activeView]} />
        <div className="hub-content">
          <ActiveView />
        </div>
      </div>
      <ProfileDrawer
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/HubPage.jsx
git commit -m "feat: wire ProfileDrawer into HubPage"
```

### Task 7: Add profile drawer and avatar CSS

**Files:**
- Modify: `client/src/styles/hub.css`

- [ ] **Step 1: Add CSS at the end of hub.css**

Append after the last rule:

```css
/* ═══ PROFILE AVATAR IN SIDEBAR ═══ */
.hub-nav-profile-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 24px;
  background: none;
  border: none;
  color: var(--parchment);
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: left;
  margin-bottom: 4px;
}

.hub-nav-profile-btn:hover {
  background: rgba(201, 168, 76, 0.08);
}

.hub-nav-profile-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--border-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  background: rgba(201, 168, 76, 0.08);
  flex-shrink: 0;
}

.hub-nav-profile-name {
  font-family: 'Cinzel', serif;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--gold);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ═══ PROFILE DRAWER ═══ */
.profile-drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.profile-drawer-backdrop.open {
  opacity: 1;
  visibility: visible;
}

.profile-drawer {
  position: fixed;
  top: 0;
  left: 240px; /* Aligned to sidebar edge */
  width: 360px;
  height: 100vh;
  background: linear-gradient(180deg, var(--stone) 0%, var(--void) 100%);
  border-right: 1px solid var(--border-gold);
  z-index: 999;
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  box-shadow: 8px 0 32px rgba(0, 0, 0, 0.6);
}

.profile-drawer.open {
  transform: translateX(0);
}

.profile-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-gold);
}

.profile-drawer-title {
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--gold);
  margin: 0;
  letter-spacing: 1px;
}

.profile-drawer-close {
  background: none;
  border: 1px solid var(--border-dim);
  color: var(--muted);
  cursor: pointer;
  font-size: 1rem;
  padding: 4px 8px;
  transition: all 0.2s;
}

.profile-drawer-close:hover {
  color: var(--parchment);
  border-color: var(--border-gold);
}

.profile-drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* Avatar Section */
.profile-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 28px;
}

.profile-avatar-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 2px solid var(--border-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.8rem;
  background: rgba(201, 168, 76, 0.06);
  margin-bottom: 10px;
  box-shadow: 0 0 20px rgba(201, 168, 76, 0.15);
}

.profile-avatar-change {
  background: none;
  border: none;
  color: var(--gold);
  font-family: 'Crimson Text', serif;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.2s;
}

.profile-avatar-change:hover {
  color: var(--gold-bright);
}

.profile-avatar-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-dim);
  border-radius: 4px;
  width: 100%;
}

.profile-avatar-option {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  border: 2px solid var(--border-dim);
  background: rgba(201, 168, 76, 0.04);
  cursor: pointer;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.profile-avatar-option:hover {
  border-color: var(--gold);
  background: rgba(201, 168, 76, 0.1);
}

.profile-avatar-option.selected {
  border-color: var(--gold-bright);
  background: rgba(201, 168, 76, 0.15);
  box-shadow: 0 0 12px rgba(201, 168, 76, 0.3);
}

/* Profile Fields */
.profile-field {
  margin-bottom: 20px;
}

.profile-field-label {
  display: block;
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.profile-field-input {
  width: 100%;
  padding: 10px 12px;
  background: var(--obsidian);
  border: 1px solid var(--border-dim);
  color: var(--parchment);
  font-family: 'Crimson Text', serif;
  font-size: 1rem;
  transition: border-color 0.2s;
  outline: none;
}

.profile-field-input:focus {
  border-color: var(--gold);
}

.profile-field-input::placeholder {
  color: var(--muted);
}

.profile-field-readonly {
  padding: 10px 0;
  color: var(--muted);
  font-family: 'Crimson Text', serif;
  font-size: 1rem;
}

.profile-field-hint {
  font-size: 0.8rem;
  color: var(--muted);
  margin-left: 8px;
  opacity: 0.6;
}

/* Friend Code */
.profile-friend-code {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  cursor: pointer;
}

.profile-friend-code-value {
  font-family: 'Fira Code', monospace;
  font-size: 1.1rem;
  color: var(--gold);
  letter-spacing: 1px;
}

.profile-friend-code-copy {
  font-family: 'Crimson Text', serif;
  font-size: 0.85rem;
  color: var(--muted);
  transition: color 0.2s;
}

.profile-friend-code:hover .profile-friend-code-copy {
  color: var(--gold);
}

/* Drawer Footer */
.profile-drawer-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-dim);
}

.profile-save-btn {
  width: 100%;
  padding: 12px;
  background: var(--gold);
  color: var(--obsidian);
  border: none;
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: all 0.2s;
}

.profile-save-btn:hover:not(:disabled) {
  background: var(--gold-bright);
}

.profile-save-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/styles/hub.css
git commit -m "feat: add profile drawer and sidebar avatar styles"
```

### Task 8: Verify end-to-end

- [ ] **Step 1: Start backend and frontend, verify no console errors**

Run: Open browser to `http://localhost:5173/play`, check console

- [ ] **Step 2: Click avatar in sidebar — drawer should slide out**
- [ ] **Step 3: Select a preset avatar, type a display name, click Save**
- [ ] **Step 4: Verify drawer closes, sidebar avatar and name update**
- [ ] **Step 5: Refresh page — profile should persist**
- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: profile drawer with avatar presets, display name, friend code"
```
