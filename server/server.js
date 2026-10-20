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
  createFeedback,
  getAllFeedbacks,
  deleteFeedback,
  recordVisit,
  getSiteStats,
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
    return res.status(409).json({ success: false, message: 'Username already exists' });
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

// Check if username already exists
app.get('/api/auth/check-username', async (req, res) => {
  const username = (req.query.username || '').trim().toLowerCase();
  if (!username) {
    return res.json({ exists: false });
  }
  const user = await findUserByUsername(username);
  return res.json({ exists: !!user });
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

// Reset Password (sets custom new password without referencing or defaulting to 'focus')
app.post('/api/auth/reset', async (req, res) => {
  const { username, newPassword } = req.body;
  const targetUsername = (username || 'default').trim().toLowerCase();
  const user = await findUserByUsername(targetUsername);

  if (!user) {
    return res.status(404).json({ success: false, message: `User "${targetUsername}" not found` });
  }

  if (!newPassword || newPassword.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'New password must be at least 3 characters' });
  }

  await updateUserPassword(user.id, newPassword);
  return res.json({ success: true, message: `Password for "${targetUsername}" updated successfully` });
});

// ---------------- TRIAL RUN FEEDBACK ROUTES ----------------

// Submit cute feedback
app.post('/api/feedback', async (req, res) => {
  const { username, rating, category, message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Feedback message is required' });
  }

  try {
    const feedback = await createFeedback({
      username: (username || 'anonymous').trim(),
      rating,
      category,
      message
    });
    return res.status(201).json({ success: true, feedback, message: 'Thank you for your feedback!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not save feedback' });
  }
});

// Get all feedbacks (viewable by admin)
app.get('/api/feedback', async (req, res) => {
  try {
    const list = await getAllFeedbacks();
    return res.json({ success: true, feedbacks: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not fetch feedbacks' });
  }
});

// Delete feedback (admin moderation)
app.delete('/api/feedback/:id', async (req, res) => {
  try {
    await deleteFeedback(req.params.id);
    return res.json({ success: true, message: 'Feedback deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not delete feedback' });
  }
});

// ---------------- WEBSITE VISIT ANALYTICS ROUTES ----------------

// Record page / app visit
app.post('/api/analytics/visit', async (req, res) => {
  try {
    const stats = await recordVisit();
    return res.json({ success: true, stats });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not record visit' });
  }
});

// Get site stats (for admin dashboard)
app.get('/api/analytics/stats', async (req, res) => {
  try {
    const stats = await getSiteStats();
    return res.json({ success: true, stats });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not fetch site stats' });
  }
});

// ---------------- CHATGPT OPENAI INTEGRATION ----------------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// Generate dynamic challenge using ChatGPT
app.post('/api/ai/challenge', async (req, res) => {
  const { domain, domainName, level } = req.body;
  const targetDomain = domainName || domain || 'Software Engineering & DSA';

  if (!OPENAI_API_KEY) {
    // Curated AI generator fallback when API key is not configured in environment
    const aiPool = [
      {
        id: 'ai_curated_' + Date.now(),
        domain: domain || 'swe_dsa',
        title: `${targetDomain} Edge-Case Crusher`,
        desc: `Write down 3 boundary constraints & edge cases for your current ${targetDomain} project or problem set and verify them.`,
        reward: '+70 Dopamine XP',
        tag: 'ChatGPT AI Quest',
        icon: '🤖'
      },
      {
        id: 'ai_curated_' + (Date.now() + 1),
        domain: domain || 'swe_dsa',
        title: `30m ${targetDomain} Deep Recall Drill`,
        desc: `Without checking any reference or documentation, reconstruct the core architecture or algorithm formula on blank paper.`,
        reward: '+65 Dopamine XP',
        tag: 'ChatGPT AI Quest',
        icon: '⚡'
      },
      {
        id: 'ai_curated_' + (Date.now() + 2),
        domain: domain || 'swe_dsa',
        title: `${targetDomain} Architecture Refactor`,
        desc: `Identify 1 bottleneck or redundant logic block in your ${targetDomain} work and optimize its efficiency.`,
        reward: '+75 Dopamine XP',
        tag: 'ChatGPT AI Quest',
        icon: '✨'
      }
    ];
    const picked = aiPool[Math.floor(Math.random() * aiPool.length)];
    return res.json({
      success: true,
      source: 'smart_ai',
      challenge: picked,
      message: 'Add OPENAI_API_KEY in Render environment variables for live dynamic ChatGPT prompts!'
    });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an elite study coach in CONSIStracker. Generate 1 exciting, actionable daily study challenge for the user. Return ONLY a valid JSON object with keys: "title" (string, max 6 words), "desc" (string, 15-25 words actionable instruction), "reward" (e.g. "+70 Dopamine XP"), "tag" (e.g. "AI Quest"), "icon" (1 single emoji).'
          },
          {
            role: 'user',
            content: `Generate a fresh daily challenge for someone whose focus domain is "${targetDomain}". Level: ${level || 'Intermediate'}. Make it motivating and concrete.`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || 'OpenAI error');
    }
    const parsed = JSON.parse(data.choices[0].message.content);
    return res.json({
      success: true,
      source: 'chatgpt',
      challenge: {
        id: 'ai_' + Date.now(),
        domain: domain || 'swe_dsa',
        title: parsed.title || `${targetDomain} AI Gauntlet`,
        desc: parsed.desc || `Complete focused deep work in ${targetDomain}.`,
        reward: parsed.reward || '+70 Dopamine XP',
        tag: parsed.tag || 'ChatGPT Quest',
        icon: parsed.icon || '🤖'
      }
    });
  } catch (err) {
    console.error('ChatGPT API error:', err);
    return res.status(500).json({ success: false, message: 'ChatGPT generation failed: ' + err.message });
  }
});

// Interactive AI Study Coach Chat
app.post('/api/ai/coach', async (req, res) => {
  const { message, domain, history } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  if (!OPENAI_API_KEY) {
    return res.json({
      success: true,
      reply: `Hi! I'm Diano AI, your study coach. 🦖 To connect me with live ChatGPT, please add your OPENAI_API_KEY into your Render Environment Variables! In the meantime, remember: consistency compounds every single day. Keep crushing your ${domain || 'study'} goals! ✨`
    });
  }

  try {
    const messages = [
      {
        role: 'system',
        content: `You are Diano, the encouraging, slightly witty green dinosaur study mentor in the CONSIStracker app. Help the user stay consistent with focus, answer questions about ${domain || 'their studies and tech'}, explain difficult concepts simply (Feynman method), and keep replies concise, friendly, and motivational (under 120 words).`
      },
      ...(Array.isArray(history) ? history.slice(-6) : []),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 350,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || 'OpenAI error');
    }
    const reply = data.choices[0].message.content;
    return res.json({ success: true, reply });
  } catch (err) {
    console.error('AI Coach error:', err);
    return res.status(500).json({ success: false, message: 'AI coach error: ' + err.message });
  }
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
  app.use(express.static(CLIENT_DIST, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));

  // Universal SPA fallback for Express
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`Consistracker Multi-User Backend running on http://localhost:${PORT}`);
});
