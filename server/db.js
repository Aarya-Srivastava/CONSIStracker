const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

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
    tags: DEFAULT_TAGS,
    habits: [],
    scrap: [],
    closed: [],
    scene: {},
    photo: {},
    mute: false,
    welcomed: false,
    dopamineXp: 0,
    dailyChallenge: null,
    rem: { on: false, t: '21:30' },
    remDay: '',
    snooze: 0,
    lastBackup: ''
  };
}

// ---------------- MONGODB ATLAS CLOUD SCHEMA ----------------
const UserSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
    state: { type: mongoose.Schema.Types.Mixed, default: createDefaultState }
  },
  { minimize: false }
);

const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

let isMongoConnected = false;

async function initDb() {
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri);
      isMongoConnected = true;
      console.log('🍃 Connected to MongoDB Atlas Cloud Database!');

      // Check if cloud DB needs initial migration from db.json
      const count = await UserModel.countDocuments();
      if (count === 0 && fs.existsSync(DB_FILE)) {
        console.log('📦 Seeding cloud database with initial local users...');
        try {
          const raw = fs.readFileSync(DB_FILE, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed.users) {
            for (const u of Object.values(parsed.users)) {
              await UserModel.create(u);
            }
            console.log(`✅ Seeded ${Object.keys(parsed.users).length} users into MongoDB Atlas!`);
          }
        } catch (e) {
          console.error('Initial cloud seed error:', e);
        }
      }
      return;
    } catch (err) {
      console.error('⚠️ MongoDB connection error, falling back to local file storage:', err.message);
      isMongoConnected = false;
    }
  } else {
    console.log('📁 MONGODB_URI not set. Using local file storage (server/data/db.json)');
  }

  ensureLocalDb();
}

// Local File DB fallback
function ensureLocalDb() {
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
}

function readLocalDb() {
  ensureLocalDb();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { users: {} };
  }
}

function writeLocalDb(data) {
  ensureLocalDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Unified CRUD methods
async function findUserByUsername(username) {
  const uname = (username || 'default').trim().toLowerCase();
  if (isMongoConnected) {
    return await UserModel.findOne({ username: uname }).lean();
  }
  const db = readLocalDb();
  return db.users ? db.users[uname] : null;
}

async function findUserById(id) {
  if (isMongoConnected) {
    return await UserModel.findOne({ id }).lean();
  }
  const db = readLocalDb();
  if (!db.users) return null;
  return Object.values(db.users).find((u) => u.id === id) || null;
}

async function createUser(username, rawPassword) {
  const uname = username.trim().toLowerCase();

  if (isMongoConnected) {
    const existing = await UserModel.findOne({ username: uname });
    if (existing) throw new Error('Username already exists');

    const salt = bcrypt.genSaltSync(10);
    const newUser = await UserModel.create({
      id: 'u_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      username: uname,
      passwordHash: bcrypt.hashSync(rawPassword.trim().toLowerCase(), salt),
      createdAt: new Date().toISOString(),
      state: createDefaultState()
    });
    return newUser.toObject();
  }

  const db = readLocalDb();
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
  writeLocalDb(db);
  return newUser;
}

async function updateUserPassword(userId, newPassword) {
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(newPassword.trim().toLowerCase(), salt);

  if (isMongoConnected) {
    await UserModel.updateOne({ id: userId }, { $set: { passwordHash } });
    return true;
  }

  const db = readLocalDb();
  const user = Object.values(db.users || {}).find((u) => u.id === userId);
  if (!user) throw new Error('User not found');

  user.passwordHash = passwordHash;
  writeLocalDb(db);
  return true;
}

async function updateUserState(userId, newState) {
  if (isMongoConnected) {
    const user = await UserModel.findOne({ id: userId });
    if (!user) throw new Error('User not found');

    user.state = {
      ...(user.state || {}),
      ...newState
    };
    user.markModified('state');
    await user.save();
    return user.state;
  }

  const db = readLocalDb();
  const user = Object.values(db.users || {}).find((u) => u.id === userId);
  if (!user) throw new Error('User not found');

  user.state = {
    ...user.state,
    ...newState
  };
  writeLocalDb(db);
  return user.state;
}

module.exports = {
  initDb,
  findUserByUsername,
  findUserById,
  createUser,
  updateUserPassword,
  updateUserState,
  DEFAULT_TAGS
};
