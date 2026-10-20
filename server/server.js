const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const {
  initDb,
  findUserByUsername,
  findUserById,
  createUser,
  updateUserPassword,
  updateUserState,
  DEFAULT_TAGS
} = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'consistracker_secret_jwt_key_2026';

// Initialize Cloud MongoDB or Local File DB
initDb();

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// JWT Authentication Middleware
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    const defaultUser = await findUserByUsername('default');
    if (defaultUser) {
      req.user = { id: defaultUser.id, username: defaultUser.username };
      return next();
    }
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      const defaultUser = await findUserByUsername('default');
      if (defaultUser) {
        req.user = { id: defaultUser.id, username: defaultUser.username };
        return next();
      }
      return res.status(403).json({ success: false, message: 'Invalid or expired session' });
    }
    req.user = decoded;
    next();
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: process.env.MONGODB_URI ? 'mongodb_cloud' : 'local_json',
    time: new Date().toISOString()
  });
});

// ---------------- AUTH ROUTES ----------------

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }

  const targetUsername = (username || 'default').trim().toLowerCase();
  const user = await findUserByUsername(targetUsername);

  if (!user) {
    return res.status(404).json({ success: false, message: `User "${targetUsername}" not found` });
  }

  const isMatch = bcrypt.compareSync(password.trim().toLowerCase(), user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Incorrect password. Try again.' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });

  return res.json({
    success: true,
    message: 'Password accepted. Access granted.',
    token,
    user: { id: user.id, username: user.username }
  });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !username.trim()) {
    return res.status(400).json({ success: false, message: 'Username is required' });
  }
  if (!password || password.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Password must be at least 3 characters' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const existing = await findUserByUsername(cleanUsername);
  if (existing) {
    return res.status(409).json({ success: false, message: `Username "${cleanUsername}" is already taken` });
  }

  try {
    const user = await createUser(cleanUsername, password);
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Registration failed' });
  }
});

// Current User Profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ id: user.id, username: user.username, createdAt: user.createdAt });
});

// Change Password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await findUserById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (oldPassword) {
    const isMatch = bcrypt.compareSync(oldPassword.trim().toLowerCase(), user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
  }

  if (!newPassword || newPassword.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'New password must be at least 3 characters' });
  }

  await updateUserPassword(user.id, newPassword);
  return res.json({ success: true, message: 'Password updated successfully' });
});

// Reset Password to default 'focus'
app.post('/api/auth/reset', async (req, res) => {
  const { username } = req.body;
  const targetUsername = (username || 'default').trim().toLowerCase();
  const user = await findUserByUsername(targetUsername);

  if (!user) {
    return res.status(404).json({ success: false, message: `User "${targetUsername}" not found` });
  }

  await updateUserPassword(user.id, 'focus');
  return res.json({ success: true, message: `Password for ${targetUsername} reset to "focus"` });
});

// ---------------- DATA ROUTES (PER-USER) ----------------

// Get user state
app.get('/api/data', authenticateToken, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const state = user.state || {};
  if (!Array.isArray(state.tags)) {
    state.tags = [];
  }
  if (!Array.isArray(state.habits)) {
    state.habits = [];
  }
  res.json(state);
});

// Update user state
app.post('/api/data', authenticateToken, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const newState = req.body;
  const updatedState = await updateUserState(user.id, newState);
  res.json({ success: true, state: updatedState });
});

// Add single study session
app.post('/api/sessions', authenticateToken, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const { session } = req.body;
  if (!session || !session.date || typeof session.sec !== 'number') {
    return res.status(400).json({ success: false, message: 'Valid session required' });
  }

  if (!session.tag) session.tag = 'General';
  if (!session.color) session.color = '#94a3b8';

  const userState = user.state || {};
  userState.sessions = userState.sessions || [];
  userState.sessions.push(session);

  await updateUserState(user.id, userState);
  res.json({ success: true, sessions: userState.sessions });
});

// Delete single study session
app.delete('/api/sessions/:id', authenticateToken, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const { id } = req.params;
  const userState = user.state || {};
  userState.sessions = (userState.sessions || []).filter(s => s.id !== id);

  await updateUserState(user.id, userState);
  res.json({ success: true, sessions: userState.sessions });
});

// Manage user category tags
app.get('/api/tags', authenticateToken, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json(user.state?.tags || DEFAULT_TAGS);
});

app.post('/api/tags', authenticateToken, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const { tags } = req.body;
  if (!Array.isArray(tags)) {
    return res.status(400).json({ success: false, message: 'Tags must be an array' });
  }

  const userState = user.state || {};
  userState.tags = tags;
  await updateUserState(user.id, userState);
  res.json({ success: true, tags: userState.tags });
});

// ---------------- STATIC PRODUCTION ASSETS (FULL-STACK UNIFIED) ----------------
const CLIENT_DIST = path.join(__dirname, '../client/dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  // Universal SPA fallback for Express 5
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`Consistracker Multi-User Backend running on http://localhost:${PORT}`);
});
