// Multi-User API Client with JWT Auth & Offline Fallback
const API_BASE = '/api';
const TOKEN_KEY = 'consis_auth_token';
const USER_KEY = 'consis_user_profile';
const LOCAL_STORAGE_KEY = 'consistracker_v4';

export const DEFAULT_TAGS = [
  { id: 'general', name: 'General', color: '#94a3b8' },
  { id: 'coding', name: 'Coding', color: '#06b6d4' },
  { id: 'math', name: 'Math', color: '#a855f7' },
  { id: 'reading', name: 'Reading', color: '#10b981' },
  { id: 'design', name: 'Design', color: '#f59e0b' },
  { id: 'writing', name: 'Writing', color: '#f43f5e' }
];

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch (e) {
    return '';
  }
}

function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (e) {}
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : { username: 'default', id: 'u_default' };
  } catch (e) {
    return { username: 'default', id: 'u_default' };
  }
}

export function setCurrentUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch (e) {}
}

function getLocalState() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    goal: 2,
    dayGoals: {},
    dayNotes: {},
    sessions: [],
    tags: DEFAULT_TAGS,
    scrap: [],
    closed: [],
    scene: {},
    photo: {},
    mute: false,
    welcomed: false,
    rem: { on: false, t: '21:30' },
    remDay: '',
    snooze: 0,
    lastBackup: ''
  };
}

function saveLocalState(state) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {}
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  getToken,
  setToken,

  // Login (supports optional username, defaults to 'default')
  async login(password, username = 'default') {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success && data.token) {
        setToken(data.token);
        setCurrentUser(data.user);
      }
      return data;
    } catch (err) {
      console.warn('Backend offline, using fallback auth:', err);
      // Offline fallback: if password is focus, allow default login
      const isOk = password.trim().toLowerCase() === 'focus';
      if (isOk) {
        setCurrentUser({ username: username || 'default', id: 'u_default' });
      }
      return {
        success: isOk,
        message: isOk ? 'Password accepted. Access granted.' : 'Incorrect password. Try again.'
      };
    }
  },

  // Register new user
  async register(username, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success && data.token) {
        setToken(data.token);
        setCurrentUser(data.user);
      }
      return data;
    } catch (err) {
      return { success: false, message: 'Could not connect to backend server' };
    }
  },

  // Logout
  logout() {
    setToken('');
    setCurrentUser(null);
  },

  // Verify password (convenience wrapper)
  async verifyPassword(password, username = 'default') {
    return this.login(password, username);
  },

  // Change password
  async changePassword(oldPassword, newPassword) {
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ oldPassword, newPassword })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Could not connect to backend server' };
    }
  },

  // Load user app state
  async getState() {
    try {
      const res = await fetch(`${API_BASE}/data`, {
        headers: authHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        saveLocalState(data);
        return data;
      }
    } catch (err) {
      console.warn('Backend unavailable, loading local state:', err);
    }
    return getLocalState();
  },

  // Save user app state
  async saveState(newState) {
    saveLocalState(newState);
    try {
      await fetch(`${API_BASE}/data`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(newState)
      });
    } catch (err) {
      console.warn('Backend sync failed, saved locally:', err);
    }
  },

  // Add session
  async addSession(session, currentState) {
    const updated = {
      ...currentState,
      sessions: [...(currentState.sessions || []), session]
    };
    await this.saveState(updated);
    return updated;
  },

  // Delete session
  async deleteSession(sessionId, currentState) {
    const updated = {
      ...currentState,
      sessions: (currentState.sessions || []).filter((s) => s.id !== sessionId)
    };
    await this.saveState(updated);
    return updated;
  },

  // Save tags
  async saveTags(tags, currentState) {
    const updated = {
      ...currentState,
      tags
    };
    await this.saveState(updated);
    return updated;
  }
};
