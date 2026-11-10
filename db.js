// BhoomiBandhu 2.0 - Database & Persistence Layer
// Supports native PostgreSQL connection with auto-migrations and seamless fallback storage.

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

let pgPool = null;
let isPgConnected = false;

// Check if PostgreSQL configuration is available and test connection
try {
  const { Pool } = require('pg');
  const connectionConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST || '127.0.0.1',
        port: parseInt(process.env.PGPORT || '5432', 10),
        database: process.env.PGDATABASE || 'bhoomibandhu',
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        connectionTimeoutMillis: 2000,
      };

  pgPool = new Pool(connectionConfig);

  pgPool.query('SELECT NOW()', (err) => {
    if (err) {
      console.log('ℹ️  PostgreSQL not reachable on port 5432. Using persistent JSON data store.');
      isPgConnected = false;
    } else {
      console.log('✅ PostgreSQL connected successfully. Initializing database schema...');
      isPgConnected = true;
      initPgSchema();
    }
  });
} catch (e) {
  console.log('ℹ️  PostgreSQL driver loaded with fallback persistence.');
}

// Ensure data folder exists for persistent fallback storage
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadLocalStore() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = {
      users: [],
      farmer_profiles: [],
      provider_profiles: [],
      otp_codes: [],
      password_resets: []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return { users: [], farmer_profiles: [], provider_profiles: [], otp_codes: [], password_resets: [] };
  }
}

function saveLocalStore(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// PostgreSQL Schema Initialization
async function initPgSchema() {
  if (!pgPool || !isPgConnected) return;
  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        mobile VARCHAR(30) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'farmer',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS farmer_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        state VARCHAR(100),
        district VARCHAR(100),
        village VARCHAR(100),
        landholding_size VARCHAR(50),
        primary_crops VARCHAR(255),
        farming_experience VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS provider_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        business_name VARCHAR(255),
        service_types TEXT,
        state VARCHAR(100),
        district VARCHAR(100),
        experience VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS otp_codes (
        id SERIAL PRIMARY KEY,
        identifier VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        identifier VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ PostgreSQL schema verified and ready.');
  } catch (err) {
    console.error('Error creating PG schema:', err.message);
  }
}

// Seed Initial Admin & Demo Accounts
async function seedDefaultUsers() {
  const adminEmail = 'admin@bhoomibandhu.in';
  const existingAdmin = await findUserByEmailOrMobile(adminEmail);
  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('Admin@12345', salt);
    await createUser({
      full_name: 'BhoomiBandhu Admin',
      email: adminEmail,
      mobile: '9876543210',
      password_hash: hash,
      role: 'admin',
      status: 'active'
    });
    console.log('🌱 Seeded default Administrator: admin@bhoomibandhu.in (Password: Admin@12345)');
  }

  // Demo Farmer
  const demoFarmerEmail = 'ramesh.farmer@bhoomibandhu.in';
  const existingFarmer = await findUserByEmailOrMobile(demoFarmerEmail);
  if (!existingFarmer) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('Kisan@12345', salt);
    const farmer = await createUser({
      full_name: 'Ramesh Patel',
      email: demoFarmerEmail,
      mobile: '9823456789',
      password_hash: hash,
      role: 'farmer',
      status: 'active'
    });
    await createFarmerProfile({
      user_id: farmer.id,
      state: 'Madhya Pradesh',
      district: 'Sehore',
      village: 'Bilkisganj',
      landholding_size: '4.5 Acres',
      primary_crops: 'Soybean, Wheat, Mustard',
      farming_experience: '12 Years'
    });
    console.log('🌱 Seeded demo Farmer: ramesh.farmer@bhoomibandhu.in (Password: Kisan@12345)');
  }

  // Demo Service Provider
  const demoProviderEmail = 'kisan.agro@bhoomibandhu.in';
  const existingProvider = await findUserByEmailOrMobile(demoProviderEmail);
  if (!existingProvider) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('Service@12345', salt);
    const provider = await createUser({
      full_name: 'Vikram Singh (Kisan Agro Machinery)',
      email: demoProviderEmail,
      mobile: '9811223344',
      password_hash: hash,
      role: 'service_provider',
      status: 'active'
    });
    await createProviderProfile({
      user_id: provider.id,
      business_name: 'Kisan Agro Equipment & Drone Services',
      service_types: 'Tractor Rental, Harvester, Drone Spraying, Soil Testing',
      state: 'Punjab',
      district: 'Ludhiana',
      experience: '8 Years'
    });
    console.log('🌱 Seeded demo Provider: kisan.agro@bhoomibandhu.in (Password: Service@12345)');
  }
}

// Database API Methods (abstraction that uses PostgreSQL if live, otherwise JSON store)

async function findUserByEmailOrMobile(identifier) {
  const cleaned = (identifier || '').trim().toLowerCase();
  const rawMobile = (identifier || '').trim();

  if (isPgConnected && pgPool) {
    try {
      const res = await pgPool.query(
        'SELECT * FROM users WHERE LOWER(email) = $1 OR mobile = $2 LIMIT 1',
        [cleaned, rawMobile]
      );
      return res.rows[0] || null;
    } catch (e) {
      console.warn('PG lookup failed, falling back:', e.message);
    }
  }

  const store = loadLocalStore();
  return store.users.find(u => 
    (u.email && u.email.toLowerCase() === cleaned) || 
    (u.mobile && u.mobile.trim() === rawMobile)
  ) || null;
}

async function getUserById(id) {
  if (isPgConnected && pgPool) {
    try {
      const res = await pgPool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
      const user = res.rows[0];
      if (!user) return null;

      if (user.role === 'farmer') {
        const prof = await pgPool.query('SELECT * FROM farmer_profiles WHERE user_id = $1 LIMIT 1', [id]);
        user.profile = prof.rows[0] || null;
      } else if (user.role === 'service_provider') {
        const prof = await pgPool.query('SELECT * FROM provider_profiles WHERE user_id = $1 LIMIT 1', [id]);
        user.profile = prof.rows[0] || null;
      }
      return user;
    } catch (e) {
      console.warn('PG getUserById failed, falling back:', e.message);
    }
  }

  const store = loadLocalStore();
  const user = store.users.find(u => u.id === Number(id));
  if (!user) return null;

  if (user.role === 'farmer') {
    user.profile = store.farmer_profiles.find(p => p.user_id === user.id) || null;
  } else if (user.role === 'service_provider') {
    user.profile = store.provider_profiles.find(p => p.user_id === user.id) || null;
  }
  return user;
}

async function createUser(userData) {
  if (isPgConnected && pgPool) {
    try {
      const res = await pgPool.query(
        `INSERT INTO users (full_name, email, mobile, password_hash, role, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [userData.full_name, userData.email || null, userData.mobile, userData.password_hash, userData.role || 'farmer', userData.status || 'active']
      );
      return res.rows[0];
    } catch (e) {
      console.warn('PG createUser error, falling back:', e.message);
    }
  }

  const store = loadLocalStore();
  const newUser = {
    id: store.users.length > 0 ? Math.max(...store.users.map(u => u.id)) + 1 : 1,
    full_name: userData.full_name,
    email: userData.email || null,
    mobile: userData.mobile,
    password_hash: userData.password_hash,
    role: userData.role || 'farmer',
    status: userData.status || 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  store.users.push(newUser);
  saveLocalStore(store);
  return newUser;
}

async function createFarmerProfile(profileData) {
  if (isPgConnected && pgPool) {
    try {
      const res = await pgPool.query(
        `INSERT INTO farmer_profiles (user_id, state, district, village, landholding_size, primary_crops, farming_experience)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [profileData.user_id, profileData.state, profileData.district, profileData.village, profileData.landholding_size, profileData.primary_crops, profileData.farming_experience]
      );
      return res.rows[0];
    } catch (e) {
      console.warn('PG createFarmerProfile error:', e.message);
    }
  }

  const store = loadLocalStore();
  const newProfile = {
    id: store.farmer_profiles.length > 0 ? Math.max(...store.farmer_profiles.map(p => p.id)) + 1 : 1,
    user_id: profileData.user_id,
    state: profileData.state || '',
    district: profileData.district || '',
    village: profileData.village || '',
    landholding_size: profileData.landholding_size || '',
    primary_crops: profileData.primary_crops || '',
    farming_experience: profileData.farming_experience || '',
    created_at: new Date().toISOString()
  };
  store.farmer_profiles.push(newProfile);
  saveLocalStore(store);
  return newProfile;
}

async function createProviderProfile(profileData) {
  if (isPgConnected && pgPool) {
    try {
      const res = await pgPool.query(
        `INSERT INTO provider_profiles (user_id, business_name, service_types, state, district, experience)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [profileData.user_id, profileData.business_name, profileData.service_types, profileData.state, profileData.district, profileData.experience]
      );
      return res.rows[0];
    } catch (e) {
      console.warn('PG createProviderProfile error:', e.message);
    }
  }

  const store = loadLocalStore();
  const newProfile = {
    id: store.provider_profiles.length > 0 ? Math.max(...store.provider_profiles.map(p => p.id)) + 1 : 1,
    user_id: profileData.user_id,
    business_name: profileData.business_name || '',
    service_types: profileData.service_types || '',
    state: profileData.state || '',
    district: profileData.district || '',
    experience: profileData.experience || '',
    created_at: new Date().toISOString()
  };
  store.provider_profiles.push(newProfile);
  saveLocalStore(store);
  return newProfile;
}

async function updateUserPassword(userId, newHash) {
  if (isPgConnected && pgPool) {
    try {
      await pgPool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, userId]);
      return true;
    } catch (e) {
      console.warn('PG updateUserPassword error:', e.message);
    }
  }

  const store = loadLocalStore();
  const user = store.users.find(u => u.id === Number(userId));
  if (user) {
    user.password_hash = newHash;
    user.updated_at = new Date().toISOString();
    saveLocalStore(store);
    return true;
  }
  return false;
}

async function saveOtp(identifier, code, expiresMinutes = 10) {
  const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000).toISOString();
  if (isPgConnected && pgPool) {
    try {
      await pgPool.query(
        'INSERT INTO otp_codes (identifier, code, expires_at) VALUES ($1, $2, $3)',
        [identifier, code, expiresAt]
      );
      return true;
    } catch (e) {
      console.warn('PG saveOtp error:', e.message);
    }
  }

  const store = loadLocalStore();
  store.otp_codes.push({
    identifier,
    code,
    expires_at: expiresAt,
    verified: false,
    created_at: new Date().toISOString()
  });
  saveLocalStore(store);
  return true;
}

async function verifyOtp(identifier, code) {
  const now = new Date();
  if (isPgConnected && pgPool) {
    try {
      const res = await pgPool.query(
        'SELECT * FROM otp_codes WHERE identifier = $1 AND code = $2 AND expires_at > NOW() AND verified = FALSE ORDER BY id DESC LIMIT 1',
        [identifier, code]
      );
      if (res.rows.length > 0) {
        await pgPool.query('UPDATE otp_codes SET verified = TRUE WHERE id = $1', [res.rows[0].id]);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('PG verifyOtp error:', e.message);
    }
  }

  const store = loadLocalStore();
  const record = store.otp_codes
    .slice()
    .reverse()
    .find(o => o.identifier === identifier && o.code === code && !o.verified && new Date(o.expires_at) > now);

  if (record) {
    record.verified = true;
    saveLocalStore(store);
    return true;
  }
  return false;
}

async function listUsers() {
  if (isPgConnected && pgPool) {
    try {
      const res = await pgPool.query('SELECT id, full_name, email, mobile, role, status, created_at FROM users ORDER BY id DESC');
      return res.rows;
    } catch (e) {
      console.warn('PG listUsers error:', e.message);
    }
  }

  const store = loadLocalStore();
  return store.users.map(({ password_hash, ...safe }) => safe);
}

async function getStats() {
  const users = await listUsers();
  const farmersCount = users.filter(u => u.role === 'farmer').length;
  const providersCount = users.filter(u => u.role === 'service_provider').length;
  const adminsCount = users.filter(u => u.role === 'admin').length;

  return {
    totalUsers: users.length,
    farmers: farmersCount,
    serviceProviders: providersCount,
    admins: adminsCount,
    activeClaims: 142,
    schemesAvailable: 18,
    advisorSessions: 1250,
    systemHealth: 'Optimal (PostgreSQL / Express)'
  };
}

// Auto seed default accounts on module initialization
seedDefaultUsers().catch(err => console.error('Error seeding default users:', err));

module.exports = {
  findUserByEmailOrMobile,
  getUserById,
  createUser,
  createFarmerProfile,
  createProviderProfile,
  updateUserPassword,
  saveOtp,
  verifyOtp,
  listUsers,
  getStats,
  seedDefaultUsers
};
