const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const DEFAULT_TAGS = [
  { id: 'general', name: 'General', color: '#94a3b8' },
  { id: 'coding', name: 'Coding', color: '#06b6d4' },
  { id: 'math', name: 'Math', color: '#a855f7' },
  { id: 'reading', name: 'Reading', color: '#10b981' },
  { id: 'design', name: 'Design', color: '#f59e0b' },
  { id: 'writing', name: 'Writing', color: '#f43f5e' }
];

function createDefaultState() {
  return {
    goal: 2,
    dayGoals: {},
    dayNotes: {},
    sessions: [],
    tags: [],
    habits: [],
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

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const salt = bcrypt.genSaltSync(10);
    const initialUsers = {
      default: {
        id: 'u_default',
        username: 'default',
        passwordHash: bcrypt.hashSync('focus', salt),
        createdAt: new Date().toISOString(),
        state: createDefaultState()
      }
    };

    fs.writeFileSync(DB_FILE, JSON.stringify({ users: initialUsers }, null, 2), 'utf-8');
    return;
  }

  // Migrate legacy single-user structure if present
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.users) {
      console.log('Migrating single-user db.json to multi-user format...');
      const salt = bcrypt.genSaltSync(10);
      const oldPassword = (parsed.auth && parsed.auth.password) || 'focus';
      const oldState = parsed.state || createDefaultState();
      if (!oldState.tags) oldState.tags = DEFAULT_TAGS;

      const migrated = {
        users: {
          default: {
            id: 'u_default',
            username: 'default',
            passwordHash: bcrypt.hashSync(oldPassword, salt),
            createdAt: new Date().toISOString(),
            state: oldState
          }
        }
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(migrated, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error during db format validation:', err);
  }
}

function readDb() {
  ensureDb();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json, returning empty structure:', err);
    return { users: {} };
  }
}

function writeDb(data) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// User Helpers
function findUserByUsername(username) {
  const db = readDb();
  const uname = (username || 'default').trim().toLowerCase();
  return db.users ? db.users[uname] : null;
}

function findUserById(id) {
  const db = readDb();
  if (!db.users) return null;
  return Object.values(db.users).find(u => u.id === id) || null;
}

function createUser(username, rawPassword) {
  const db = readDb();
  const uname = username.trim().toLowerCase();
  if (db.users && db.users[uname]) {
    throw new Error('Username already exists');
  }

  const salt = bcrypt.genSaltSync(10);
  const newUser = {
    id: 'u_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    username: uname,
    passwordHash: bcrypt.hashSync(rawPassword.trim().toLowerCase(), salt),
    createdAt: new Date().toISOString(),
    state: createDefaultState()
  };

  db.users = db.users || {};
  db.users[uname] = newUser;
  writeDb(db);
  return newUser;
}

function updateUserPassword(userId, newPassword) {
  const db = readDb();
  const user = Object.values(db.users || {}).find(u => u.id === userId);
  if (!user) throw new Error('User not found');

  const salt = bcrypt.genSaltSync(10);
  user.passwordHash = bcrypt.hashSync(newPassword.trim().toLowerCase(), salt);
  writeDb(db);
  return true;
}

function updateUserState(userId, newState) {
  const db = readDb();
  const user = Object.values(db.users || {}).find(u => u.id === userId);
  if (!user) throw new Error('User not found');

  user.state = {
    ...user.state,
    ...newState
  };
  writeDb(db);
  return user.state;
}

module.exports = {
  readDb,
  writeDb,
  findUserByUsername,
  findUserById,
  createUser,
  updateUserPassword,
  updateUserState,
  DEFAULT_TAGS
};
