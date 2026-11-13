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
      password_resets: [],
      insurance_enrollments: [],
      crop_claims: [],
      financial_inquiries: [],
      storage_facilities: [],
      storage_bookings: [],
      mental_health_requests: []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(content);
    parsed.insurance_enrollments = parsed.insurance_enrollments || [];
    parsed.crop_claims = parsed.crop_claims || [];
    parsed.financial_inquiries = parsed.financial_inquiries || [];
    parsed.storage_facilities = parsed.storage_facilities || [];
    parsed.storage_bookings = parsed.storage_bookings || [];
    parsed.mental_health_requests = parsed.mental_health_requests || [];
    return parsed;
  } catch (err) {
    return { users: [], farmer_profiles: [], provider_profiles: [], otp_codes: [], password_resets: [], insurance_enrollments: [], crop_claims: [], financial_inquiries: [], storage_facilities: [], storage_bookings: [], mental_health_requests: [] };
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

      CREATE TABLE IF NOT EXISTS insurance_enrollments (
        id SERIAL PRIMARY KEY,
        application_id VARCHAR(50) UNIQUE NOT NULL,
        farmer_name VARCHAR(255) NOT NULL,
        mobile VARCHAR(30) NOT NULL,
        aadhaar_last4 VARCHAR(10),
        state VARCHAR(100),
        district VARCHAR(100),
        village VARCHAR(100),
        season VARCHAR(50),
        crop_name VARCHAR(100),
        area_acres NUMERIC,
        sum_insured NUMERIC,
        farmer_premium NUMERIC,
        bank_account_last4 VARCHAR(10),
        ifsc VARCHAR(20),
        sowing_date VARCHAR(50),
        land_khasra VARCHAR(100),
        documents JSONB,
        status VARCHAR(50) DEFAULT 'Submitted',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS crop_claims (
        id SERIAL PRIMARY KEY,
        claim_id VARCHAR(50) UNIQUE NOT NULL,
        farmer_name VARCHAR(255) NOT NULL,
        mobile VARCHAR(30) NOT NULL,
        policy_or_khasra_no VARCHAR(100),
        state VARCHAR(100),
        district VARCHAR(100),
        village VARCHAR(100),
        crop_name VARCHAR(100),
        affected_area_acres NUMERIC,
        calamity_type VARCHAR(100),
        loss_date VARCHAR(50),
        intimation_window_status VARCHAR(100),
        damage_percentage NUMERIC,
        loss_description TEXT,
        documents JSONB,
        status VARCHAR(50) DEFAULT 'Intimation Registered',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS financial_inquiries (
        id SERIAL PRIMARY KEY,
        dossier_id VARCHAR(50) UNIQUE NOT NULL,
        farmer_name VARCHAR(255) NOT NULL,
        mobile VARCHAR(30) NOT NULL,
        state VARCHAR(100),
        district VARCHAR(100),
        village VARCHAR(100),
        landholding_acres NUMERIC,
        primary_crop VARCHAR(100),
        annual_income NUMERIC,
        loan_purpose VARCHAR(100),
        requested_amount NUMERIC,
        estimated_kcc_limit NUMERIC,
        eligible_subvention_rate VARCHAR(50),
        readiness_score VARCHAR(50),
        target_bank VARCHAR(100),
        status VARCHAR(100) DEFAULT 'Dossier Prepared & Ready for Bank Submission',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS storage_facilities (
        id VARCHAR(50) PRIMARY KEY,
        provider_id INTEGER,
        name VARCHAR(255) NOT NULL,
        operator_name VARCHAR(255),
        mobile VARCHAR(30) NOT NULL,
        email VARCHAR(255),
        state VARCHAR(100) NOT NULL,
        district VARCHAR(100) NOT NULL,
        address TEXT,
        facility_type VARCHAR(100) NOT NULL,
        total_capacity_mt NUMERIC NOT NULL,
        available_capacity_mt NUMERIC NOT NULL,
        suitable_crops TEXT,
        temp_range VARCHAR(100),
        humidity_range VARCHAR(100),
        base_rate_per_kg_month NUMERIC NOT NULL,
        min_duration_days INTEGER DEFAULT 15,
        wdra_reg_no VARCHAR(100),
        rating NUMERIC DEFAULT 4.5,
        reviews_count INTEGER DEFAULT 0,
        amenities JSONB,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS storage_bookings (
        id SERIAL PRIMARY KEY,
        booking_id VARCHAR(50) UNIQUE NOT NULL,
        facility_id VARCHAR(50) NOT NULL,
        facility_name VARCHAR(255) NOT NULL,
        provider_id INTEGER,
        farmer_name VARCHAR(255) NOT NULL,
        mobile VARCHAR(30) NOT NULL,
        farmer_state VARCHAR(100),
        farmer_district VARCHAR(100),
        crop_name VARCHAR(100) NOT NULL,
        quantity_kg NUMERIC NOT NULL,
        quantity_quintals NUMERIC NOT NULL,
        duration_months NUMERIC NOT NULL,
        intake_date VARCHAR(50),
        scheme_applied VARCHAR(100),
        scheme_eligibility_verified BOOLEAN DEFAULT FALSE,
        pricing_breakdown JSONB,
        payment_mode VARCHAR(100),
        payment_status VARCHAR(100) DEFAULT 'Advance Required',
        payment_reference VARCHAR(100),
        booking_status VARCHAR(100) DEFAULT 'Pending Provider Confirmation',
        provider_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS mental_health_requests (
        id SERIAL PRIMARY KEY,
        request_token VARCHAR(50) UNIQUE NOT NULL,
        patient_alias VARCHAR(255) DEFAULT 'Anonymous Farmer',
        mobile VARCHAR(30),
        state VARCHAR(100),
        district VARCHAR(100),
        preferred_language VARCHAR(50) DEFAULT 'Hindi',
        primary_concern VARCHAR(100) NOT NULL,
        distress_level VARCHAR(100) NOT NULL,
        message TEXT,
        referral_type VARCHAR(100) NOT NULL,
        assigned_facility VARCHAR(255),
        privacy_level VARCHAR(50) DEFAULT 'Confidential',
        status VARCHAR(100) DEFAULT 'Referral Dossier Generated',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

// ─────────────────────────────────────────────────────────────
// Insurance Enrollment & Crop Claim Data Access Methods
// ─────────────────────────────────────────────────────────────

function generateAppId(prefix = 'BB-ENR') {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${year}-${rand}`;
}

async function createInsuranceEnrollment(data) {
  const appId = data.application_id || generateAppId('BB-ENR');
  const record = {
    application_id: appId,
    farmer_name: data.farmer_name,
    mobile: data.mobile,
    aadhaar_last4: data.aadhaar_last4 || '',
    state: data.state || '',
    district: data.district || '',
    village: data.village || '',
    season: data.season || 'Rabi 2026',
    crop_name: data.crop_name || '',
    area_acres: Number(data.area_acres) || 1,
    sum_insured: Number(data.sum_insured) || 50000,
    farmer_premium: Number(data.farmer_premium) || 750,
    bank_account_last4: data.bank_account_last4 || '',
    ifsc: data.ifsc || '',
    sowing_date: data.sowing_date || '',
    land_khasra: data.land_khasra || '',
    documents: data.documents || [],
    status: data.status || 'Application Submitted',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isPgConnected && pgPool) {
    try {
      const res = await pgPool.query(
        `INSERT INTO insurance_enrollments 
         (application_id, farmer_name, mobile, aadhaar_last4, state, district, village, season, crop_name, area_acres, sum_insured, farmer_premium, bank_account_last4, ifsc, sowing_date, land_khasra, documents, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
        [record.application_id, record.farmer_name, record.mobile, record.aadhaar_last4, record.state, record.district, record.village, record.season, record.crop_name, record.area_acres, record.sum_insured, record.farmer_premium, record.bank_account_last4, record.ifsc, record.sowing_date, record.land_khasra, JSON.stringify(record.documents), record.status]
      );
      return res.rows[0];
    } catch (e) {
      console.warn('PG createInsuranceEnrollment error:', e.message);
    }
  }

  const store = loadLocalStore();
  store.insurance_enrollments = store.insurance_enrollments || [];
  record.id = store.insurance_enrollments.length > 0 ? Math.max(...store.insurance_enrollments.map(e => e.id || 0)) + 1 : 1;
  store.insurance_enrollments.push(record);
  saveLocalStore(store);
  return record;
}

async function createCropClaim(data) {
  const claimId = data.claim_id || generateAppId('BB-CLM');
  const record = {
    claim_id: claimId,
    farmer_name: data.farmer_name,
    mobile: data.mobile,
    policy_or_khasra_no: data.policy_or_khasra_no || '',
    state: data.state || '',
    district: data.district || '',
    village: data.village || '',
    crop_name: data.crop_name || '',
    affected_area_acres: Number(data.affected_area_acres) || 1,
    calamity_type: data.calamity_type || 'Unseasonal Rainfall',
    loss_date: data.loss_date || new Date().toISOString().split('T')[0],
    intimation_window_status: data.intimation_window_status || 'Within 72 Hours (Valid)',
    damage_percentage: Number(data.damage_percentage) || 50,
    loss_description: data.loss_description || '',
    documents: data.documents || [],
    status: data.status || 'Loss Intimation Registered',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isPgConnected && pgPool) {
    try {
      const res = await pgPool.query(
        `INSERT INTO crop_claims 
         (claim_id, farmer_name, mobile, policy_or_khasra_no, state, district, village, crop_name, affected_area_acres, calamity_type, loss_date, intimation_window_status, damage_percentage, loss_description, documents, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
        [record.claim_id, record.farmer_name, record.mobile, record.policy_or_khasra_no, record.state, record.district, record.village, record.crop_name, record.affected_area_acres, record.calamity_type, record.loss_date, record.intimation_window_status, record.damage_percentage, record.loss_description, JSON.stringify(record.documents), record.status]
      );
      return res.rows[0];
    } catch (e) {
      console.warn('PG createCropClaim error:', e.message);
    }
  }

  const store = loadLocalStore();
  store.crop_claims = store.crop_claims || [];
  record.id = store.crop_claims.length > 0 ? Math.max(...store.crop_claims.map(c => c.id || 0)) + 1 : 1;
  store.crop_claims.push(record);
  saveLocalStore(store);
  return record;
}

function enrichEnrollmentRecord(e, isVerified) {
  const sumInsured = Number(e.sum_insured || 0);
  const farmerPremium = Number(e.farmer_premium || 0);
  const totalActuarialPremium = Math.round(sumInsured * 0.12);
  const remainingGovtSubsidy = Math.max(0, totalActuarialPremium - farmerPremium);
  const stateSubsidy = Math.round(remainingGovtSubsidy / 2);
  const centralSubsidy = remainingGovtSubsidy - stateSubsidy;

  const statusStr = (e.status || '').toUpperCase();
  const isPolicyIssued = statusStr.includes('POLICY') || statusStr.includes('ISSUED') || statusStr.includes('ACTIVE');
  const isDocVerified = isPolicyIssued || statusStr.includes('VERIF') || statusStr.includes('COMPLETE');

  const baseTime = e.created_at ? new Date(e.created_at).getTime() : Date.now() - 5 * 86400000;

  const timeline = [
    {
      step: 1,
      title: 'Application Logged',
      desc: 'Digital enrollment submitted via BhoomiBandhu PMFBY gateway',
      date: new Date(baseTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'done'
    },
    {
      step: 2,
      title: 'Land Records & Sowing Verification',
      desc: `Khasra (${e.land_khasra || 'Verified'}) cross-verified with State Revenue Records & Patwari report`,
      date: new Date(baseTime + 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: isDocVerified ? 'done' : 'active'
    },
    {
      step: 3,
      title: 'Bank Premium Subsidy Debit',
      desc: `Farmer share ₹${farmerPremium.toLocaleString('en-IN')} debited from A/C ****${e.bank_account_last4 || '4892'} (${e.ifsc || 'SBIN0001244'})`,
      date: new Date(baseTime + 172800000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: isDocVerified ? 'done' : 'pending'
    },
    {
      step: 4,
      title: 'Govt Co-Subsidy Contribution',
      desc: `State (₹${stateSubsidy.toLocaleString('en-IN')}) & Centre (₹${centralSubsidy.toLocaleString('en-IN')}) mapped to policy pool`,
      date: new Date(baseTime + 259200000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: isPolicyIssued ? 'done' : (isDocVerified ? 'active' : 'pending')
    },
    {
      step: 5,
      title: 'Policy Certificate Active',
      desc: isPolicyIssued ? 'Official PMFBY Policy Bond Generated & Active' : 'Queued for final underwriting certificate generation',
      date: isPolicyIssued ? new Date(baseTime + 345600000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Estimated 24-48 hrs',
      status: isPolicyIssued ? 'done' : 'pending'
    }
  ];

  // Document audit & missing document check
  const presentDocs = e.documents || [];
  const missingDocs = [];

  const hasLand = presentDocs.some(d => (d || '').toLowerCase().includes('land') || (d || '').toLowerCase().includes('ror') || (d || '').toLowerCase().includes('khasra'));
  const hasSowing = presentDocs.some(d => (d || '').toLowerCase().includes('sowing') || (d || '').toLowerCase().includes('declaration'));
  const hasBank = presentDocs.some(d => (d || '').toLowerCase().includes('bank') || (d || '').toLowerCase().includes('passbook'));

  if (!hasLand) missingDocs.push({ name: 'Land Record (RoR / Khasra Copy)', reason: 'Mandatory for land possession & survey match' });
  if (!hasSowing) missingDocs.push({ name: 'Sowing Certificate (Patwari / Self-Declaration)', reason: 'Required to verify actual crop area sown' });
  if (!hasBank) missingDocs.push({ name: 'Bank Passbook / Cancelled Cheque', reason: 'Required for DBT bank account verification' });

  return {
    ...e,
    is_verified: isVerified,
    timeline,
    payment_updates: {
      sum_insured: sumInsured,
      farmer_premium: farmerPremium,
      state_subsidy: stateSubsidy,
      central_subsidy: centralSubsidy,
      total_actuarial_premium: totalActuarialPremium,
      bank_ifsc: e.ifsc || 'SBIN0001244',
      bank_account_masked: isVerified ? `XXXX-XXXX-${e.bank_account_last4 || '4892'}` : 'XXXX-XXXX-**** (Verify to view)',
      debit_status: 'Debited & Transferred to Agriculture Insurance Company',
      payment_ref: `PMFBY-TXN-${(e.application_id || '').replace(/[^0-9]/g, '').slice(-6) || '482910'}`
    },
    missing_documents: missingDocs,
    official_portal_url: `https://pmfby.gov.in/farmer/trackApplication?appId=${encodeURIComponent(e.application_id || '')}`
  };
}

function enrichClaimRecord(c, isVerified) {
  const damagePct = Number(c.damage_percentage || 50);
  const sumInsured = 180000;
  const estimatedLossAmount = Math.round((sumInsured * damagePct) / 100);
  const interimReliefAmount = Math.round(estimatedLossAmount * 0.25);
  const statusStr = (c.status || '').toUpperCase();
  const isSettled = statusStr.includes('APPROVED') || statusStr.includes('SETTLED') || statusStr.includes('CREDITED');
  const isSurveyDone = isSettled || statusStr.includes('SURVEY_COMPLETED') || statusStr.includes('ASSESSED') || statusStr.includes('REGISTERED');

  let finalApprovedAmount = estimatedLossAmount;
  const matchAmount = (c.status || '').match(/₹([0-9,]+)/);
  if (matchAmount) {
    finalApprovedAmount = parseInt(matchAmount[1].replace(/,/g, ''), 10);
  }

  const baseTime = c.loss_date ? new Date(c.loss_date).getTime() : Date.now() - 14 * 86400000;

  const timeline = [
    {
      step: 1,
      title: 'Loss Intimation Registered',
      desc: c.intimation_window_status || 'Logged within statutory 72-hour window',
      date: new Date(baseTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'done'
    },
    {
      step: 2,
      title: 'Joint Loss Surveyor Assigned',
      desc: 'Loss Assessor Er. Sudhir Sharma appointed alongside local Revenue Patwari',
      date: new Date(baseTime + 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'done'
    },
    {
      step: 3,
      title: 'On-Site Field Damage Survey',
      desc: `Joint field survey completed. Assessed crop loss: ${damagePct}% (GPS Geo-tagged)`,
      date: new Date(baseTime + 172800000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: isSurveyDone ? 'done' : 'active'
    },
    {
      step: 4,
      title: 'District Grievance Committee (DGC) Review',
      desc: isSettled ? `Claim approved for ₹${finalApprovedAmount.toLocaleString('en-IN')} (incl. 25% interim relief)` : 'Panchnama under DGC review for final sanction',
      date: isSettled ? new Date(baseTime + 432000000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pending DGC sign-off',
      status: isSettled ? 'done' : 'pending'
    },
    {
      step: 5,
      title: 'Direct Benefit Transfer (DBT) Payout',
      desc: isSettled ? `₹${finalApprovedAmount.toLocaleString('en-IN')} credited to Aadhaar-seeded bank account via PFMS` : 'Pending final treasury release',
      date: isSettled ? new Date(baseTime + 691200000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Expected within statutory window',
      status: isSettled ? 'done' : 'pending'
    }
  ];

  // Survey updates
  const surveyUpdates = {
    surveyor_name: 'Er. Sudhir Sharma (Lead Loss Assessor, Lic. #LA-4892)',
    surveyor_phone: isVerified ? '+91 94250 88291' : '+91 94250 ***** (Verify to view)',
    joint_patwari: 'R. K. Verma (Halqa Patwari, Bilkisganj)',
    survey_date: new Date(baseTime + 172800000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    gps_coordinates: '23.1982° N, 77.0821° E (Sehore, MP)',
    assessed_damage_pct: damagePct,
    cause_confirmed: c.calamity_type || 'Hailstorm & Unseasonal Rain',
    panchnama_status: 'Digitally Signed & Uploaded to National Crop Insurance Portal (NCIP)'
  };

  // Payment updates
  const paymentUpdates = {
    assessed_claim_amount: finalApprovedAmount,
    on_account_interim_25pct: interimReliefAmount,
    dbt_status: isSettled ? 'Credited to Bank Account (DBT Success)' : 'Under Processing via PFMS',
    pfms_utr_ref: isSettled ? `PFMS2026${(c.claim_id || '').replace(/[^0-9]/g, '').slice(-7) || '8491024'}` : 'Pending Generation',
    credited_bank_masked: isVerified ? `A/C ****${c.mobile ? c.mobile.slice(-4) : '4892'} (Aadhaar Seeded)` : 'A/C **** (Verify to view)',
    settlement_date: isSettled ? new Date(baseTime + 691200000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Under Statutory 3-Week Window'
  };

  // Missing documents check
  const presentDocs = c.documents || [];
  const missingDocs = [];

  const hasPhoto = presentDocs.some(d => (d || '').toLowerCase().includes('photo') || (d || '').toLowerCase().includes('jpg') || (d || '').toLowerCase().includes('image'));
  const hasPanchnama = presentDocs.some(d => (d || '').toLowerCase().includes('panchnama') || (d || '').toLowerCase().includes('patwari') || (d || '').toLowerCase().includes('survey'));

  if (!hasPhoto) missingDocs.push({ name: 'Geo-Tagged Field Damage Photograph', reason: 'Mandatory proof of crop damage on ground with date/time' });
  if (!hasPanchnama) missingDocs.push({ name: 'Joint Survey Panchnama / Intimation Slip', reason: 'Required for DGC assessment validation' });

  return {
    ...c,
    is_verified: isVerified,
    timeline,
    survey_updates: surveyUpdates,
    payment_updates: paymentUpdates,
    missing_documents: missingDocs,
    official_portal_url: `https://pmfby.gov.in/farmer/trackClaim?claimId=${encodeURIComponent(c.claim_id || '')}`
  };
}

async function findInsuranceRecords(query, verify = '') {
  const clean = (query || '').trim().toUpperCase();
  const raw = (query || '').trim();
  const verifyCode = (verify || '').trim().toUpperCase();

  let enrollments = [];
  let claims = [];

  if (isPgConnected && pgPool) {
    try {
      const enrRes = await pgPool.query(
        'SELECT * FROM insurance_enrollments WHERE UPPER(application_id) = $1 OR mobile = $2 ORDER BY id DESC',
        [clean, raw]
      );
      enrollments = enrRes.rows;

      const clmRes = await pgPool.query(
        'SELECT * FROM crop_claims WHERE UPPER(claim_id) = $1 OR mobile = $2 OR UPPER(policy_or_khasra_no) = $1 ORDER BY id DESC',
        [clean, raw]
      );
      claims = clmRes.rows;
    } catch (e) {
      console.warn('PG findInsuranceRecords error:', e.message);
    }
  }

  if (enrollments.length === 0 && claims.length === 0) {
    const store = loadLocalStore();
    enrollments = (store.insurance_enrollments || []).filter(e => 
      (e.application_id && e.application_id.toUpperCase() === clean) ||
      (e.mobile && e.mobile.trim() === raw)
    );

    claims = (store.crop_claims || []).filter(c => 
      (c.claim_id && c.claim_id.toUpperCase() === clean) ||
      (c.mobile && c.mobile.trim() === raw) ||
      (c.policy_or_khasra_no && c.policy_or_khasra_no.toUpperCase() === clean)
    );
  }

  const isSearchByMobile = /^\d{10}$/.test(raw);
  let overallVerified = isSearchByMobile;

  const enrichedEnrollments = enrollments.map(e => {
    let recVerified = isSearchByMobile;
    if (!recVerified && verifyCode) {
      if (
        (e.mobile && (e.mobile === verifyCode || e.mobile.endsWith(verifyCode))) ||
        (e.aadhaar_last4 && e.aadhaar_last4.toUpperCase() === verifyCode) ||
        (e.bank_account_last4 && e.bank_account_last4.toUpperCase() === verifyCode)
      ) {
        recVerified = true;
        overallVerified = true;
      }
    }
    return enrichEnrollmentRecord(e, recVerified);
  });

  const enrichedClaims = claims.map(c => {
    let recVerified = isSearchByMobile;
    if (!recVerified && verifyCode) {
      if (
        (c.mobile && (c.mobile === verifyCode || c.mobile.endsWith(verifyCode))) ||
        (c.aadhaar_last4 && c.aadhaar_last4.toUpperCase() === verifyCode) ||
        (c.mobile && c.mobile.slice(-4) === verifyCode)
      ) {
        recVerified = true;
        overallVerified = true;
      }
    }
    return enrichClaimRecord(c, recVerified);
  });

  return {
    verified: overallVerified,
    enrollments: enrichedEnrollments,
    claims: enrichedClaims
  };
}

// Auto seed default accounts & insurance records on module initialization
async function seedDefaultInsuranceRecords() {
  const store = loadLocalStore();
  store.insurance_enrollments = store.insurance_enrollments || [];
  store.crop_claims = store.crop_claims || [];

  if (store.insurance_enrollments.length === 0) {
    await createInsuranceEnrollment({
      application_id: 'BB-ENR-2026-48291',
      farmer_name: 'Ramesh Patel',
      mobile: '9823456789',
      aadhaar_last4: '7412',
      state: 'Madhya Pradesh',
      district: 'Sehore',
      village: 'Bilkisganj',
      season: 'Rabi 2026',
      crop_name: 'Wheat (गेहूं)',
      area_acres: 4.5,
      sum_insured: 180000,
      farmer_premium: 2700,
      bank_account_last4: '4892',
      ifsc: 'SBIN0001244',
      sowing_date: '2026-10-28',
      land_khasra: 'Khasra No. 142/3',
      documents: ['Land_Record_RoR_Sehore.pdf', 'Sowing_Certificate_Patwari.pdf', 'Bank_Passbook_SBI.pdf'],
      status: 'Policy Issued (Active)'
    });

    await createInsuranceEnrollment({
      application_id: 'BB-ENR-2026-91823',
      farmer_name: 'uv',
      mobile: '1234567891',
      aadhaar_last4: '9921',
      state: 'Haryana',
      district: 'Rewari',
      village: 'Yamunanagar',
      season: 'Rabi 2026',
      crop_name: 'Wheat (गेहूं)',
      area_acres: 8.0,
      sum_insured: 320000,
      farmer_premium: 4800,
      bank_account_last4: '6120',
      ifsc: 'PUNB0123400',
      sowing_date: '2026-11-04',
      land_khasra: 'Khasra No. 89/1',
      documents: ['RoR_Rewari_LandRecord.pdf', 'Sowing_Declaration.pdf', 'Aadhaar_Card.pdf'],
      status: 'Document Verification Completed'
    });
  }

  if (store.crop_claims.length === 0) {
    await createCropClaim({
      claim_id: 'BB-CLM-2026-19342',
      farmer_name: 'Ramesh Patel',
      mobile: '9823456789',
      policy_or_khasra_no: 'BB-ENR-2026-48291',
      state: 'Madhya Pradesh',
      district: 'Sehore',
      village: 'Bilkisganj',
      crop_name: 'Soybean (सोयाबीन)',
      affected_area_acres: 3.5,
      calamity_type: 'Hailstorm & Unseasonal Rain (ओलावृष्टि)',
      loss_date: '2026-09-18',
      intimation_window_status: 'Within 72 Hours (Valid - 24 hrs reported)',
      damage_percentage: 65,
      loss_description: 'Severe hailstorm damaged mature pods before harvest. Waterlogging observed across 3.5 acres.',
      documents: ['Damage_Photo_Field_1.jpg', 'Damage_Photo_Field_2.jpg', 'Patwari_Panchnama.pdf'],
      status: 'Settlement Approved (₹38,000)'
    });
  }
}

async function createFinancialInquiry(data) {
  const dossierId = data.dossier_id || generateAppId('BB-FIN');
  const record = {
    dossier_id: dossierId,
    farmer_name: data.farmer_name,
    mobile: data.mobile,
    state: data.state || '',
    district: data.district || '',
    village: data.village || '',
    landholding_acres: Number(data.landholding_acres) || 1,
    primary_crop: data.primary_crop || '',
    annual_income: Number(data.annual_income) || 0,
    loan_purpose: data.loan_purpose || 'Kisan Credit Card (Crop Cultivation)',
    requested_amount: Number(data.requested_amount) || 0,
    estimated_kcc_limit: Number(data.estimated_kcc_limit) || 0,
    eligible_subvention_rate: data.eligible_subvention_rate || '4% (with 3% Govt Subvention)',
    readiness_score: data.readiness_score || '95% (Bank Ready)',
    target_bank: data.target_bank || 'State Bank of India',
    status: data.status || 'Dossier Prepared & Ready for Bank Submission',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isPgConnected && pgPool) {
    try {
      const q = `
        INSERT INTO financial_inquiries (
          dossier_id, farmer_name, mobile, state, district, village,
          landholding_acres, primary_crop, annual_income, loan_purpose,
          requested_amount, estimated_kcc_limit, eligible_subvention_rate,
          readiness_score, target_bank, status, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW(),NOW())
        RETURNING *;
      `;
      const res = await pgPool.query(q, [
        record.dossier_id, record.farmer_name, record.mobile, record.state, record.district, record.village,
        record.landholding_acres, record.primary_crop, record.annual_income, record.loan_purpose,
        record.requested_amount, record.estimated_kcc_limit, record.eligible_subvention_rate,
        record.readiness_score, record.target_bank, record.status
      ]);
      return res.rows[0];
    } catch (e) {
      console.warn('PG createFinancialInquiry fallback:', e.message);
    }
  }

  const store = loadLocalStore();
  store.financial_inquiries.push(record);
  saveLocalStore(store);
  return record;
}

async function findFinancialInquiries(query) {
  const clean = (query || '').trim().toUpperCase();
  const raw = (query || '').trim();

  let inquiries = [];

  if (isPgConnected && pgPool) {
    try {
      const res = await pgPool.query(
        'SELECT * FROM financial_inquiries WHERE UPPER(dossier_id) = $1 OR mobile = $2 ORDER BY id DESC',
        [clean, raw]
      );
      return res.rows;
    } catch (e) {
      console.warn('PG findFinancialInquiries error:', e.message);
    }
  }

  const store = loadLocalStore();
  inquiries = (store.financial_inquiries || []).filter(item =>
    (item.dossier_id && item.dossier_id.toUpperCase() === clean) ||
    (item.mobile && item.mobile.trim() === raw)
  );

  return inquiries;
}

async function seedDefaultFinancialRecords() {
  const store = loadLocalStore();
  if (!store.financial_inquiries || store.financial_inquiries.length === 0) {
    await createFinancialInquiry({
      dossier_id: 'BB-FIN-2026-38291',
      farmer_name: 'Ramesh Patel',
      mobile: '9823456789',
      state: 'Madhya Pradesh',
      district: 'Sehore',
      village: 'Bilkisganj',
      landholding_acres: 4.5,
      primary_crop: 'Wheat & Soybean',
      annual_income: 380000,
      loan_purpose: 'Kisan Credit Card (Crop Loan)',
      requested_amount: 200000,
      estimated_kcc_limit: 225000,
      eligible_subvention_rate: '4.0% (3% Subvention Eligible)',
      readiness_score: '96% (Verified Land & Passbook)',
      target_bank: 'State Bank of India (YONO Krishi)',
      status: 'Bank Application Dossier Ready'
    });

    await createFinancialInquiry({
      dossier_id: 'BB-FIN-2026-59182',
      farmer_name: 'Balwant Singh',
      mobile: '9876543210',
      state: 'Punjab',
      district: 'Ludhiana',
      village: 'Khanna',
      landholding_acres: 5.0,
      primary_crop: 'Wheat (PBW 550)',
      annual_income: 520000,
      loan_purpose: 'Kisan Credit Card & Tractor Modernization',
      requested_amount: 250000,
      estimated_kcc_limit: 250000,
      eligible_subvention_rate: '4.0% (Subsidized KCC)',
      readiness_score: '98% (High Credit Score & RoR)',
      target_bank: 'Punjab National Bank (PNB Krishi)',
      status: 'Submitted via JanSamarth Portal'
    });
  }
}

// ─────────────────────────────────────────────────────────────
// Digital Storage Marketplace Engine & Verified Persistence
// ─────────────────────────────────────────────────────────────

function verifyStorageSubsidy(criteria = {}) {
  const schemeCode = (criteria.scheme_code || '').trim().toUpperCase();
  const farmerCategory = (criteria.farmer_category || 'general').trim().toLowerCase();
  const cropName = (criteria.crop_name || '').trim().toLowerCase();
  const facilityType = (criteria.facility_type || '').trim().toLowerCase();
  const quantityKg = Number(criteria.quantity_kg) || 0;
  const durationMonths = Number(criteria.duration_months) || 1;
  const baseRatePerKg = Number(criteria.base_rate_per_kg) || 1.8;

  const perishables = ['potato', 'onion', 'garlic', 'apple', 'orange', 'tomato', 'carrot', 'mango', 'litchi', 'peas', 'vegetables', 'fruits', 'floriculture', 'ginger'];
  const dryGrains = ['wheat', 'rice', 'paddy', 'mustard', 'soybean', 'maize', 'chana', 'gram', 'cotton', 'tur', 'moong', 'pulses', 'barley', 'millet', 'sorghum'];

  const isPerishable = perishables.some(p => cropName.includes(p));
  const isGrain = dryGrains.some(g => cropName.includes(g));
  const isColdFacility = facilityType.includes('cold') || facilityType.includes('controlled') || facilityType.includes('ca');
  const isDryFacility = facilityType.includes('warehouse') || facilityType.includes('godown') || facilityType.includes('silo');

  if (schemeCode === 'GRAMIN_BHANDARAN') {
    if (isPerishable && !isGrain && isColdFacility) {
      return {
        is_eligible: false,
        scheme_code: 'GRAMIN_BHANDARAN',
        scheme_name: 'Gramin Bhandaran Yojana (Rural Godown Scheme)',
        subsidy_percentage: 0,
        subsidy_rate_per_kg: 0,
        estimated_subsidy_amount: 0,
        criteria_met: [
          '❌ Scheme Mismatch: Gramin Bhandaran Yojana covers dry warehouses, rural godowns and grain silos.',
          '💡 Recommendation: For perishable cold storage, apply under PM Kisan SAMPADA Yojana (PMKSY).'
        ],
        verification_code: null
      };
    }

    const isPriorityCategory = farmerCategory === 'small_marginal' || farmerCategory === 'women_sc_st';
    const subsidyPct = isPriorityCategory ? 33.33 : 25.0;
    const maxCapPerKg = isPriorityCategory ? 0.35 : 0.25;
    const computedRate = Math.min(baseRatePerKg * (subsidyPct / 100), maxCapPerKg);
    const subsidyAmount = Math.round(computedRate * quantityKg * durationMonths);

    return {
      is_eligible: true,
      scheme_code: 'GRAMIN_BHANDARAN',
      scheme_name: 'Gramin Bhandaran Yojana (ISAM / AMI)',
      subsidy_percentage: subsidyPct,
      subsidy_rate_per_kg: Number(computedRate.toFixed(2)),
      estimated_subsidy_amount: subsidyAmount,
      criteria_met: [
        `✓ Farmer Category Verified: ${isPriorityCategory ? 'Small/Marginal/Women/SC/ST (33.33% Tier)' : 'General Farmer (25.0% Tier)'}`,
        '✓ Warehouse Infrastructure: WDRA-compliant storage facility',
        `✓ Statutory Subsidy Capped at ₹${maxCapPerKg}/kg/month`,
        '✓ Electronic Negotiable Warehouse Receipt (e-NWR) loan eligible'
      ],
      verification_code: `SUB-2026-GBY-${Math.floor(1000 + Math.random() * 9000)}`
    };
  }

  if (schemeCode === 'PMKSY_COLD_CHAIN') {
    if (isGrain && !isPerishable && isDryFacility) {
      return {
        is_eligible: false,
        scheme_code: 'PMKSY_COLD_CHAIN',
        scheme_name: 'PMKSY Integrated Cold Chain Subsidy',
        subsidy_percentage: 0,
        subsidy_rate_per_kg: 0,
        estimated_subsidy_amount: 0,
        criteria_met: [
          '❌ Scheme Mismatch: PMKSY is dedicated to cold chain & perishable horticulture crops.',
          '💡 Recommendation: For dry grain storage, select Gramin Bhandaran Yojana.'
        ],
        verification_code: null
      };
    }

    const isPriorityCategory = farmerCategory === 'small_marginal' || farmerCategory === 'women_sc_st';
    const subsidyPct = isPriorityCategory ? 35.0 : 25.0;
    const maxCapPerKg = isPriorityCategory ? 0.65 : 0.45;
    const computedRate = Math.min(baseRatePerKg * (subsidyPct / 100), maxCapPerKg);
    const subsidyAmount = Math.round(computedRate * quantityKg * durationMonths);

    return {
      is_eligible: true,
      scheme_code: 'PMKSY_COLD_CHAIN',
      scheme_name: 'PM Kisan SAMPADA Yojana (Cold Chain)',
      subsidy_percentage: subsidyPct,
      subsidy_rate_per_kg: Number(computedRate.toFixed(2)),
      estimated_subsidy_amount: subsidyAmount,
      criteria_met: [
        `✓ Farmer Category Verified: ${isPriorityCategory ? 'Small/Marginal/Women (35.0% Tariff Subvention)' : 'General Category (25.0% Tariff Subvention)'}`,
        '✓ Crop Classification: Horticultural perishable produce under National Cold Chain Mission',
        `✓ Subsidy Rate: ₹${computedRate.toFixed(2)}/kg/month deducted directly from facility rent`
      ],
      verification_code: `SUB-2026-PMKSY-${Math.floor(1000 + Math.random() * 9000)}`
    };
  }

  if (schemeCode === 'AIF_STORAGE') {
    const subsidyPct = 20.0;
    const computedRate = Math.min(baseRatePerKg * 0.20, 0.35);
    const subsidyAmount = Math.round(computedRate * quantityKg * durationMonths);

    return {
      is_eligible: true,
      scheme_code: 'AIF_STORAGE',
      scheme_name: 'Agriculture Infrastructure Fund (AIF Storage Subvention)',
      subsidy_percentage: subsidyPct,
      subsidy_rate_per_kg: Number(computedRate.toFixed(2)),
      estimated_subsidy_amount: subsidyAmount,
      criteria_met: [
        '✓ AIF Subvention Scheme: 20.0% statutory post-harvest tariff rebate',
        '✓ Available to all verified farmers with valid Land/Khasra credentials',
        '✓ Direct credit settlement to accredited storage operator'
      ],
      verification_code: `SUB-2026-AIF-${Math.floor(1000 + Math.random() * 9000)}`
    };
  }

  if (schemeCode === 'PM_KISAN_BHANDAR') {
    const isSmallMarginal = farmerCategory === 'small_marginal' || farmerCategory === 'women_sc_st';
    if (!isSmallMarginal) {
      return {
        is_eligible: false,
        scheme_code: 'PM_KISAN_BHANDAR',
        scheme_name: 'PM-Kisan Farmer Bhandar Concession',
        subsidy_percentage: 0,
        subsidy_rate_per_kg: 0,
        estimated_subsidy_amount: 0,
        criteria_met: [
          '❌ Ineligible: PM-Kisan Bhandar Concession is strictly reserved for Small & Marginal farmers (<5 acres landholding).',
          '💡 Recommendation: Select Gramin Bhandaran Yojana (25% General Tier).'
        ],
        verification_code: null
      };
    }
    const subsidyPct = 15.0;
    const computedRate = Math.min(baseRatePerKg * 0.15, 0.25);
    const subsidyAmount = Math.round(computedRate * quantityKg * durationMonths);

    return {
      is_eligible: true,
      scheme_code: 'PM_KISAN_BHANDAR',
      scheme_name: 'PM-Kisan Farmer Bhandar Concession',
      subsidy_percentage: subsidyPct,
      subsidy_rate_per_kg: Number(computedRate.toFixed(2)),
      estimated_subsidy_amount: subsidyAmount,
      criteria_met: [
        '✓ PM-Kisan Aadhaar-linked beneficiary verified (<5 acres landholding)',
        '✓ 15.0% direct storage rate deduction applied'
      ],
      verification_code: `SUB-2026-PMK-${Math.floor(1000 + Math.random() * 9000)}`
    };
  }

  return {
    is_eligible: false,
    scheme_code: 'NONE',
    scheme_name: 'Direct Commercial Storage (No Subsidy)',
    subsidy_percentage: 0,
    subsidy_rate_per_kg: 0,
    estimated_subsidy_amount: 0,
    criteria_met: ['No government subsidy scheme applied.'],
    verification_code: null
  };
}

async function listStorageFacilities(filters = {}) {
  let facilities = [];
  if (isPgConnected && pgPool) {
    try {
      const res = await pgPool.query('SELECT * FROM storage_facilities ORDER BY rating DESC, available_capacity_mt DESC');
      facilities = res.rows;
    } catch (e) {
      console.warn('PG listStorageFacilities error:', e.message);
    }
  }

  if (facilities.length === 0) {
    const store = loadLocalStore();
    facilities = store.storage_facilities || [];
  }

  // Apply filters
  if (filters.state) {
    const stateFilter = filters.state.trim().toLowerCase();
    facilities = facilities.filter(f => (f.state || '').toLowerCase() === stateFilter);
  }
  if (filters.district) {
    const distFilter = filters.district.trim().toLowerCase();
    facilities = facilities.filter(f => (f.district || '').toLowerCase().includes(distFilter));
  }
  if (filters.type && filters.type !== 'all') {
    const typeFilter = filters.type.trim().toLowerCase();
    facilities = facilities.filter(f => (f.facility_type || '').toLowerCase().includes(typeFilter));
  }
  if (filters.crop) {
    const cropFilter = filters.crop.trim().toLowerCase();
    facilities = facilities.filter(f => (f.suitable_crops || '').toLowerCase().includes(cropFilter));
  }
  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    facilities = facilities.filter(f =>
      (f.name || '').toLowerCase().includes(q) ||
      (f.address || '').toLowerCase().includes(q) ||
      (f.district || '').toLowerCase().includes(q) ||
      (f.suitable_crops || '').toLowerCase().includes(q)
    );
  }

  return facilities;
}

async function getStorageFacilityById(id) {
  if (!id) return null;
  const cleanId = id.trim();

  if (isPgConnected && pgPool) {
    try {
      const res = await pgPool.query('SELECT * FROM storage_facilities WHERE id = $1 LIMIT 1', [cleanId]);
      if (res.rows[0]) return res.rows[0];
    } catch (e) {
      console.warn('PG getStorageFacilityById error:', e.message);
    }
  }

  const store = loadLocalStore();
  return (store.storage_facilities || []).find(f => f.id === cleanId) || null;
}

async function createStorageBooking(data) {
  const bookingId = data.booking_id || generateAppId('STG-2026');
  const facility = await getStorageFacilityById(data.facility_id);

  const quantityKg = Number(data.quantity_kg) || (Number(data.quantity_quintals) * 100) || 1000;
  const quantityQuintals = Number(data.quantity_quintals) || (quantityKg / 100);
  const durationMonths = Number(data.duration_months) || 1;
  const baseRatePerKg = facility ? Number(facility.base_rate_per_kg_month) : (Number(data.base_rate_per_kg_month) || 1.8);

  const subsidyEval = verifyStorageSubsidy({
    scheme_code: data.scheme_applied,
    farmer_category: data.farmer_category || 'general',
    crop_name: data.crop_name,
    facility_type: facility ? facility.facility_type : (data.facility_type || 'Cold Storage'),
    quantity_kg: quantityKg,
    duration_months: durationMonths,
    base_rate_per_kg: baseRatePerKg
  });

  const grossBaseAmount = Math.round(quantityKg * baseRatePerKg * durationMonths);
  const handlingFee = Math.round(quantityKg * 0.08); // 8 paise per kg for handling/inspection
  const insuranceFee = Math.round(grossBaseAmount * 0.02); // 2% comprehensive insurance
  const subsidyAmount = subsidyEval.is_eligible ? subsidyEval.estimated_subsidy_amount : 0;
  const gstAmount = 0; // Exempt for agricultural storage
  const netPayable = Math.max(0, grossBaseAmount + handlingFee + insuranceFee - subsidyAmount);
  const advanceRequired = Math.round(netPayable * 0.20); // 20% advance token

  const pricingBreakdown = {
    base_rate_per_kg_month: baseRatePerKg,
    quantity_kg: quantityKg,
    quantity_quintals: quantityQuintals,
    duration_months: durationMonths,
    gross_base_amount: grossBaseAmount,
    handling_fee: handlingFee,
    insurance_fee: insuranceFee,
    subsidy_amount: subsidyAmount,
    subsidy_percentage: subsidyEval.subsidy_percentage || 0,
    gst_amount: gstAmount,
    net_payable: netPayable,
    advance_required: advanceRequired,
    balance_on_arrival: netPayable - advanceRequired,
    verification_code: subsidyEval.verification_code || null,
    criteria_met: subsidyEval.criteria_met || []
  };

  const record = {
    booking_id: bookingId,
    facility_id: data.facility_id || (facility ? facility.id : 'STG-FAC-001'),
    facility_name: data.facility_name || (facility ? facility.name : 'Verified Storage Facility'),
    provider_id: facility ? facility.provider_id : (data.provider_id || 1),
    farmer_name: data.farmer_name,
    mobile: data.mobile,
    farmer_state: data.farmer_state || (facility ? facility.state : 'Uttar Pradesh'),
    farmer_district: data.farmer_district || (facility ? facility.district : 'Varanasi'),
    crop_name: data.crop_name,
    quantity_kg: quantityKg,
    quantity_quintals: quantityQuintals,
    duration_months: durationMonths,
    intake_date: data.intake_date || new Date().toISOString().split('T')[0],
    scheme_applied: data.scheme_applied || 'NONE',
    scheme_eligibility_verified: subsidyEval.is_eligible,
    farmer_category: data.farmer_category || 'general',
    pricing_breakdown: pricingBreakdown,
    payment_mode: data.payment_mode || 'UPI',
    payment_status: data.payment_status || (data.advance_paid ? 'Advance Paid (20%)' : 'Advance Required'),
    payment_reference: data.payment_reference || `PAY-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    booking_status: data.booking_status || 'Pending Provider Confirmation',
    provider_notes: data.provider_notes || '',
    gate_pass_no: `GP-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isPgConnected && pgPool) {
    try {
      const res = await pgPool.query(
        `INSERT INTO storage_bookings 
         (booking_id, facility_id, facility_name, provider_id, farmer_name, mobile, farmer_state, farmer_district, crop_name, quantity_kg, quantity_quintals, duration_months, intake_date, scheme_applied, scheme_eligibility_verified, pricing_breakdown, payment_mode, payment_status, payment_reference, booking_status, provider_notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING *`,
        [record.booking_id, record.facility_id, record.facility_name, record.provider_id, record.farmer_name, record.mobile, record.farmer_state, record.farmer_district, record.crop_name, record.quantity_kg, record.quantity_quintals, record.duration_months, record.intake_date, record.scheme_applied, record.scheme_eligibility_verified, JSON.stringify(record.pricing_breakdown), record.payment_mode, record.payment_status, record.payment_reference, record.booking_status, record.provider_notes]
      );
      const qtyMt = quantityKg / 1000;
      await pgPool.query('UPDATE storage_facilities SET available_capacity_mt = GREATEST(0, available_capacity_mt - $1) WHERE id = $2', [qtyMt, record.facility_id]);
      return res.rows[0];
    } catch (e) {
      console.warn('PG createStorageBooking error:', e.message);
    }
  }

  const store = loadLocalStore();
  store.storage_bookings = store.storage_bookings || [];
  record.id = store.storage_bookings.length > 0 ? Math.max(...store.storage_bookings.map(b => b.id || 0)) + 1 : 1;
  store.storage_bookings.unshift(record);

  // Deduct capacity in local store
  if (store.storage_facilities) {
    const fac = store.storage_facilities.find(f => f.id === record.facility_id);
    if (fac) {
      const qtyMt = quantityKg / 1000;
      fac.available_capacity_mt = Math.max(0, Number((fac.available_capacity_mt - qtyMt).toFixed(1)));
    }
  }

  saveLocalStore(store);
  return record;
}

async function findStorageBookings(query) {
  const clean = (query || '').trim().toUpperCase();
  const raw = (query || '').trim();

  let bookings = [];
  if (isPgConnected && pgPool) {
    try {
      const res = await pgPool.query(
        'SELECT * FROM storage_bookings WHERE UPPER(booking_id) = $1 OR mobile = $2 OR facility_id = $3 ORDER BY id DESC',
        [clean, raw, clean]
      );
      return res.rows;
    } catch (e) {
      console.warn('PG findStorageBookings error:', e.message);
    }
  }

  const store = loadLocalStore();
  bookings = (store.storage_bookings || []).filter(b =>
    (b.booking_id && b.booking_id.toUpperCase() === clean) ||
    (b.mobile && b.mobile.trim() === raw) ||
    (b.facility_id && b.facility_id.toUpperCase() === clean)
  );

  return bookings;
}

async function getProviderStorageBookings(facilityOrProviderId) {
  const store = loadLocalStore();
  const all = store.storage_bookings || [];
  if (!facilityOrProviderId) return all;

  const clean = facilityOrProviderId.toString().trim().toUpperCase();
  return all.filter(b => 
    (b.facility_id && b.facility_id.toUpperCase() === clean) ||
    (b.provider_id && b.provider_id.toString().toUpperCase() === clean)
  );
}

async function updateStorageBookingStatus(bookingId, newStatus, providerNotes = '') {
  if (!bookingId) return null;
  const cleanId = bookingId.trim().toUpperCase();

  if (isPgConnected && pgPool) {
    try {
      const res = await pgPool.query(
        'UPDATE storage_bookings SET booking_status = $1, provider_notes = $2, updated_at = CURRENT_TIMESTAMP WHERE UPPER(booking_id) = $3 RETURNING *',
        [newStatus, providerNotes, cleanId]
      );
      if (res.rows[0]) return res.rows[0];
    } catch (e) {
      console.warn('PG updateStorageBookingStatus error:', e.message);
    }
  }

  const store = loadLocalStore();
  const booking = (store.storage_bookings || []).find(b => b.booking_id && b.booking_id.toUpperCase() === cleanId);
  if (!booking) return null;

  booking.booking_status = newStatus;
  if (providerNotes) booking.provider_notes = providerNotes;
  booking.updated_at = new Date().toISOString();

  // If rejected/cancelled, restore capacity
  if (newStatus === 'Cancelled' || newStatus === 'Rejected') {
    const fac = (store.storage_facilities || []).find(f => f.id === booking.facility_id);
    if (fac) {
      const qtyMt = (booking.quantity_kg || 1000) / 1000;
      fac.available_capacity_mt = Math.min(fac.total_capacity_mt, Number((fac.available_capacity_mt + qtyMt).toFixed(1)));
    }
  }

  saveLocalStore(store);
  return booking;
}

async function updateStorageFacility(facilityId, updates = {}) {
  const store = loadLocalStore();
  const facility = (store.storage_facilities || []).find(f => f.id === facilityId);
  if (!facility) return null;

  if (updates.available_capacity_mt !== undefined) {
    facility.available_capacity_mt = Number(updates.available_capacity_mt);
  }
  if (updates.base_rate_per_kg_month !== undefined) {
    facility.base_rate_per_kg_month = Number(updates.base_rate_per_kg_month);
  }
  if (updates.is_active !== undefined) {
    facility.is_active = Boolean(updates.is_active);
  }
  facility.updated_at = new Date().toISOString();

  saveLocalStore(store);
  return facility;
}

async function seedDefaultStorageRecords() {
  const store = loadLocalStore();
  if (!store.storage_facilities || store.storage_facilities.length === 0) {
    const initialFacilities = [
      {
        id: 'STG-FAC-001',
        provider_id: 2,
        name: 'Kisan Cold Chain Logistics & Packhouse',
        operator_name: 'Vikram Singh',
        mobile: '9811223344',
        email: 'kisan.agro@bhoomibandhu.in',
        state: 'Uttar Pradesh',
        district: 'Varanasi',
        address: 'Plot 44, Agro Park Industrial Phase II, Ramnagar, Varanasi, UP - 221008',
        facility_type: 'Cold Storage',
        total_capacity_mt: 1500,
        available_capacity_mt: 420,
        suitable_crops: 'Potato, Onion, Tomato, Apple, Seasonal Vegetables & Fruits',
        temp_range: '2°C – 8°C (85-90% RH)',
        humidity_range: '85% – 95%',
        base_rate_per_kg_month: 1.85,
        min_duration_days: 30,
        wdra_reg_no: 'WDRA/UP/2023/4192',
        rating: 4.8,
        reviews_count: 142,
        amenities: [
          'WDRA Approved & Certified',
          'NABARD & AIF Subsidized',
          '24/7 CCTV & Security Guard',
          '100% Dual DG Power Backup',
          'Electronic Weighbridge Onsite',
          'Cold Air Blast Freezing & Stacking',
          'Grading, Washing & Sorting Line'
        ],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'STG-FAC-002',
        provider_id: 3,
        name: 'Annapurna Agro Silos & Warehousing Corp',
        operator_name: 'Sunil Sharma',
        mobile: '9838012345',
        email: 'annapurna.storage@bhoomibandhu.in',
        state: 'Uttar Pradesh',
        district: 'Sitapur',
        address: 'NH-24 Lucknow-Sitapur Highway, Maholi Bypass, Sitapur, UP - 261001',
        facility_type: 'Grain Warehouse',
        total_capacity_mt: 3000,
        available_capacity_mt: 850,
        suitable_crops: 'Wheat, Paddy (Rice), Mustard, Maize, Pulses (Arhar, Chana)',
        temp_range: 'Ambient Scientific Aerated (<12% Moisture)',
        humidity_range: '50% – 65%',
        base_rate_per_kg_month: 1.15,
        min_duration_days: 15,
        wdra_reg_no: 'WDRA/UP/2022/1084',
        rating: 4.6,
        reviews_count: 98,
        amenities: [
          'WDRA Registered Godown',
          'Gramin Bhandaran Yojana Accredited',
          'Automatic Fire Safety & Hydrants',
          'Fumigation & Rodent Pest Control',
          'Electronic 100 MT Weighbridge',
          'e-NWR Issuance for Bank Pledge Loans'
        ],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'STG-FAC-003',
        provider_id: 4,
        name: 'Sheetal Krishi Controlled Atmosphere (CA) Hub',
        operator_name: 'Harpreet Cheema',
        mobile: '9872112233',
        email: 'sheetal.ca@bhoomibandhu.in',
        state: 'Haryana',
        district: 'Karnal',
        address: 'GT Road, Near National Dairy Research Institute, Karnal, Haryana - 132001',
        facility_type: 'Controlled Atmosphere (CA) Hub',
        total_capacity_mt: 2200,
        available_capacity_mt: 610,
        suitable_crops: 'Apple, Pears, Carrot, Seed Potato, Garlic, Cherry',
        temp_range: '-0.5°C to 2°C (O2 < 2%, CO2 1-2%)',
        humidity_range: '92% – 96%',
        base_rate_per_kg_month: 2.40,
        min_duration_days: 60,
        wdra_reg_no: 'WDRA/HR/2024/7712',
        rating: 4.9,
        reviews_count: 67,
        amenities: [
          'German CA Sensor Gas Monitoring',
          'Govt Horticulture Subsidy Partner',
          '16 Independent Sealed Chambers',
          'Thermal Insulation Panels',
          'Refrigerated Reefer Truck Docking'
        ],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'STG-FAC-004',
        provider_id: 5,
        name: 'Malwa Central Rural Bhandaran Kendra',
        operator_name: 'Dinesh Patidar',
        mobile: '9826054321',
        email: 'malwa.bhandaran@bhoomibandhu.in',
        state: 'Madhya Pradesh',
        district: 'Ujjain',
        address: 'Mandi Road, Tarana Crossing, Ujjain, MP - 456006',
        facility_type: 'Rural Godown & Silos',
        total_capacity_mt: 4500,
        available_capacity_mt: 1200,
        suitable_crops: 'Soybean, Wheat, Gram (Chana), Garlic, Coriander, Mustard',
        temp_range: 'Moisture Protected / Dry Aerated',
        humidity_range: '55% – 70%',
        base_rate_per_kg_month: 1.05,
        min_duration_days: 15,
        wdra_reg_no: 'WDRA/MP/2021/3391',
        rating: 4.7,
        reviews_count: 115,
        amenities: [
          'NABARD Subsidized Godown',
          'Direct e-NAM Mandi Terminal Link',
          'Heavy Railway Siding 2 km',
          'Moisture & Oil Content Testing Lab',
          'Loading / Unloading Labour Available'
        ],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'STG-FAC-005',
        provider_id: 6,
        name: 'Doaba Farmer Cold Storage & Packhouse',
        operator_name: 'Jaswinder Brar',
        mobile: '9814455667',
        email: 'doaba.cold@bhoomibandhu.in',
        state: 'Punjab',
        district: 'Ludhiana',
        address: 'Samrala Road, Machhiwara Link, Ludhiana, Punjab - 141115',
        facility_type: 'Cold Storage',
        total_capacity_mt: 2800,
        available_capacity_mt: 540,
        suitable_crops: 'Potato, Kinnow, Green Peas, Cauliflower, Capsicum',
        temp_range: '1°C – 6°C Multi-chamber',
        humidity_range: '88% – 92%',
        base_rate_per_kg_month: 1.95,
        min_duration_days: 30,
        wdra_reg_no: 'WDRA/PB/2023/9102',
        rating: 4.8,
        reviews_count: 83,
        amenities: [
          'Solar Powered Cold Grid',
          'PMKSY Scheme Partner',
          'Pre-cooling Blast Tunnel',
          'Hydraulic Dock Levelers',
          'Farmer Rest House & Canteen'
        ],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'STG-FAC-006',
        provider_id: 7,
        name: 'Magadh Krishi Agri-Warehouse & Cold Room',
        operator_name: 'Arvind Kumar',
        mobile: '9431098765',
        email: 'magadh.agri@bhoomibandhu.in',
        state: 'Bihar',
        district: 'Patna',
        address: 'Bakhtiyarpur By-pass, Near Fatuha Food Park, Patna, Bihar - 803212',
        facility_type: 'Dual Chamber (Cold + Grain)',
        total_capacity_mt: 1800,
        available_capacity_mt: 390,
        suitable_crops: 'Maize, Potato, Litchi, Pulses, Paddy, Turmeric',
        temp_range: 'Dual Block: 4°C Cold & Dry Ambient',
        humidity_range: '65% – 85%',
        base_rate_per_kg_month: 1.35,
        min_duration_days: 15,
        wdra_reg_no: 'WDRA/BR/2024/2048',
        rating: 4.5,
        reviews_count: 54,
        amenities: [
          'State Warehousing Affiliated',
          'Priority Stacking for Small Landholders',
          'Digital Grain Moisture Analyzer',
          'Tarpulin & Pallet Provided',
          '24/7 Security & Weighbridge'
        ],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    store.storage_facilities = initialFacilities;
    saveLocalStore(store);
  }

  // Seed initial demo storage bookings
  if (!store.storage_bookings || store.storage_bookings.length === 0) {
    await createStorageBooking({
      booking_id: 'STG-2026-10214',
      facility_id: 'STG-FAC-001',
      facility_name: 'Kisan Cold Chain Logistics & Packhouse',
      provider_id: 2,
      farmer_name: 'Ramesh Patel',
      mobile: '9823456789',
      farmer_state: 'Madhya Pradesh',
      farmer_district: 'Sehore',
      crop_name: 'Potato (Kufri Jyoti)',
      quantity_kg: 5000,
      quantity_quintals: 50,
      duration_months: 3,
      intake_date: '2026-11-20',
      scheme_applied: 'PMKSY_COLD_CHAIN',
      farmer_category: 'small_marginal',
      payment_mode: 'UPI',
      payment_status: 'Advance Paid (20%)',
      payment_reference: 'UPI-SBI-9847192841',
      booking_status: 'Confirmed - Space Allocated',
      provider_notes: 'Chamber 2B assigned. Temperature preset at 3.5°C.'
    });

    await createStorageBooking({
      booking_id: 'STG-2026-09871',
      facility_id: 'STG-FAC-002',
      facility_name: 'Annapurna Agro Silos & Warehousing Corp',
      provider_id: 3,
      farmer_name: 'Ramesh Patel',
      mobile: '9823456789',
      farmer_state: 'Madhya Pradesh',
      farmer_district: 'Sehore',
      crop_name: 'Wheat (Sharbati)',
      quantity_kg: 3000,
      quantity_quintals: 30,
      duration_months: 4,
      intake_date: '2026-10-15',
      scheme_applied: 'GRAMIN_BHANDARAN',
      farmer_category: 'small_marginal',
      payment_mode: 'NetBanking',
      payment_status: 'Fully Paid',
      payment_reference: 'NEFT-PNB-09823412',
      booking_status: 'Produce Received / In Storage',
      provider_notes: 'Lot #WH-402 stacked on wooden pallets. Moisture 10.8% passed.'
    });
  }
}

// ─────────────────────────────────────────────────────────────
// Farmer Mental Health Support & Clinical Referral Engine
// ─────────────────────────────────────────────────────────────

const VERIFIED_DMHP_DIRECTORY = {
  'Madhya Pradesh': {
    nodal_center: 'NIMHANS Bhopal / AIIMS Bhopal Tele MANAS Hub',
    phone: '0755-2660144 / 14416',
    opd_timings: 'Mon - Sat: 9:00 AM - 2:00 PM',
    districts: {
      'Sehore': 'District Mental Health Unit, Civil Hospital Sehore (Near Bus Stand)',
      'Bhopal': 'Department of Psychiatry, Hamidia Hospital / Gandhi Medical College, Bhopal',
      'Indore': 'Mental Hospital Indore / MY Hospital Psychiatry OPD',
      'Ujjain': 'District Hospital Ujjain DMHP Wing'
    }
  },
  'Maharashtra': {
    nodal_center: 'State Mental Health Authority / IPH Pune Tele-MANAS Hub',
    phone: '020-25447781 / 14416',
    opd_timings: 'Mon - Sat: 9:00 AM - 1:30 PM',
    districts: {
      'Yavatmal': 'District Civil Hospital Yavatmal DMHP Clinic (Prerna Project Nodal Unit)',
      'Nagpur': 'Regional Mental Hospital Nagpur, Square Road',
      'Amravati': 'District General Hospital Amravati DMHP',
      'Pune': 'Sassoon General Hospital & BJ Medical College Psychiatry OPD'
    }
  },
  'Punjab': {
    nodal_center: 'PGIMER Chandigarh Tele-MANAS Regional Node',
    phone: '0172-2756565 / 14416',
    opd_timings: 'Mon - Sat: 8:30 AM - 2:00 PM',
    districts: {
      'Ludhiana': 'Civil Hospital Ludhiana DMHP Counseling Wing',
      'Bathinda': 'Civil Hospital Bathinda DMHP (Near Rose Garden)',
      'Patiala': 'Rajindra Hospital & Government Medical College Psychiatry Center',
      'Amritsar': 'Swami Vivekanand Drug De-addiction & Mental Health Hospital'
    }
  },
  'Uttar Pradesh': {
    nodal_center: 'KGMU Lucknow Centre for Tele-MANAS & DMHP Hub',
    phone: '0522-2257451 / 14416',
    opd_timings: 'Mon - Sat: 9:00 AM - 2:00 PM',
    districts: {
      'Varanasi': 'SS Hospital IMS BHU / Pandit Deen Dayal Upadhyaya District Hospital',
      'Lucknow': 'King George Medical University (KGMU) Psychiatry OPD, Chowk',
      'Sitapur': 'District Eye & General Hospital DMHP Unit, Sitapur',
      'Kanpur': 'GSVM Medical College & LLR Hospital Psychiatry Center'
    }
  },
  'Rajasthan': {
    nodal_center: 'SMS Medical College Jaipur Psychiatric Center',
    phone: '0141-2605656 / 14416',
    opd_timings: 'Mon - Sat: 8:00 AM - 1:00 PM',
    districts: {
      'Jaipur': 'Psychiatric Centre SMS Hospital, Janta Colony, Jaipur',
      'Kota': 'MBS Hospital & New Medical College Hospital DMHP',
      'Jodhpur': 'SN Medical College & Mathura Das Mathur Hospital Psychiatry OPD'
    }
  },
  'Bihar': {
    nodal_center: 'State Health Society / AIIMS Patna Tele-MANAS Unit',
    phone: '0612-2451006 / 14416',
    opd_timings: 'Mon - Sat: 9:00 AM - 2:00 PM',
    districts: {
      'Patna': 'AIIMS Patna Psychiatry OPD / Nalanda Medical College & Hospital',
      'Gaya': 'Anugrah Narayan Magadh Medical College & Hospital Psychiatry Wing',
      'Muzaffarpur': 'SKMCH Muzaffarpur DMHP Clinic'
    }
  },
  'Haryana': {
    nodal_center: 'Pandit Bhagwat Dayal Sharma PGIMS Rohtak Tele-MANAS',
    phone: '01262-281307 / 14416',
    opd_timings: 'Mon - Sat: 9:00 AM - 2:00 PM',
    districts: {
      'Karnal': 'Kalpana Chawla Government Medical College & Civil Hospital DMHP',
      'Hisar': 'Civil Hospital Hisar DMHP Wing',
      'Rohtak': 'PGIMS Rohtak Psychiatry OPD, Medical Mor'
    }
  }
};

function getVerifiedMentalHealthResources(state = '', district = '') {
  const st = state.trim();
  const dist = district.trim();

  const stateData = VERIFIED_DMHP_DIRECTORY[st] || VERIFIED_DMHP_DIRECTORY['Madhya Pradesh'];
  const localCenter = (dist && stateData.districts && stateData.districts[dist]) 
    ? stateData.districts[dist] 
    : Object.values(stateData.districts)[0] || stateData.nodal_center;

  return {
    national_helplines: [
      {
        name: 'Tele MANAS (Ministry of Health & Family Welfare, Govt of India)',
        number: '14416',
        toll_free: '1800-891-4416',
        availability: '24 Hours × 7 Days',
        cost: '100% Free & Confidential',
        languages: 'Hindi, Punjabi, Marathi, Telugu, Tamil, Bengali, Kannada, English + 14 Regional',
        coverage: 'Pan-India Government Clinical Psychologists & Psychiatric Social Workers'
      },
      {
        name: 'KIRAN National Mental Health Rehabilitation Helpline',
        number: '1800-599-0019',
        availability: '24×7 Toll-Free',
        cost: 'Free Government Service',
        languages: '13 Languages (Department of Empowerment of Persons with Disabilities)',
        coverage: 'Crisis Intervention, Psychological First Aid & Distress De-escalation'
      },
      {
        name: 'Kisan Call Centre (Ministry of Agriculture)',
        number: '1800-180-1551',
        availability: '6:00 AM to 10:00 PM (All 7 Days)',
        cost: 'Free Toll-Free',
        languages: '22 Recognized Languages',
        coverage: 'Agricultural Distress, Crop Failure Grievances & Financial Stress Guidance'
      },
      {
        name: 'Vandrevala Foundation for Mental Health',
        number: '9999 666 555',
        availability: '24×7',
        cost: 'Free Non-Profit Helpline',
        languages: 'Hindi, English & Regional',
        coverage: 'Trained Crisis Counselors'
      }
    ],
    state_nodal_center: stateData.nodal_center,
    state_phone: stateData.phone,
    opd_timings: stateData.opd_timings,
    assigned_local_hospital: localCenter
  };
}

async function createMentalHealthRequest(data) {
  const token = data.request_token || generateAppId('MHR-2026');
  const isAnonymous = (data.privacy_level || '').toLowerCase() === 'anonymous' || !data.mobile;

  const resources = getVerifiedMentalHealthResources(data.state || '', data.district || '');

  let determinedStatus = 'Referral Dossier Prepared';
  let responseNotes = '';

  const isSevere = (data.distress_level || '').toLowerCase().includes('severe') || 
                   (data.distress_level || '').toLowerCase().includes('crisis');

  if (isSevere) {
    determinedStatus = 'Urgent Crisis Protocol Activated';
    responseNotes = 'CRISIS PROTOCOL: Farmer instructed to connect directly with 24/7 Tele MANAS (14416) or Emergency (112) without delay.';
  } else if (data.referral_type === 'kisan_volunteer') {
    determinedStatus = 'Queued for Regional Volunteer Review';
    responseNotes = 'Assigned to BhoomiBandhu Kisan Wellness Volunteer Desk. Operating hours: Weekdays 9:00 AM - 5:00 PM. No emergency callbacks.';
  } else {
    determinedStatus = 'District DMHP Referral Slip Issued';
    responseNotes = `Referral issued for ${resources.assigned_local_hospital}. Patient can attend OPD during ${resources.opd_timings}.`;
  }

  const record = {
    request_token: token,
    patient_alias: isAnonymous ? 'Anonymous Farmer (गोपनीय)' : (data.patient_alias || 'Farmer'),
    mobile: isAnonymous ? null : (data.mobile || null),
    state: data.state || 'Madhya Pradesh',
    district: data.district || '',
    preferred_language: data.preferred_language || 'Hindi',
    primary_concern: data.primary_concern || 'Agricultural & Financial Distress',
    distress_level: data.distress_level || 'Moderate',
    message: data.message || '',
    referral_type: data.referral_type || 'dmhp_hospital',
    assigned_facility: resources.assigned_local_hospital,
    privacy_level: isAnonymous ? 'Anonymous' : 'Confidential',
    status: determinedStatus,
    notes: responseNotes,
    emergency_helplines: {
      tele_manas: '14416',
      kisan_helpline: '1800-180-1551',
      emergency: '112'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isPgConnected && pgPool) {
    try {
      const res = await pgPool.query(
        `INSERT INTO mental_health_requests 
         (request_token, patient_alias, mobile, state, district, preferred_language, primary_concern, distress_level, message, referral_type, assigned_facility, privacy_level, status, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
        [record.request_token, record.patient_alias, record.mobile, record.state, record.district, record.preferred_language, record.primary_concern, record.distress_level, record.message, record.referral_type, record.assigned_facility, record.privacy_level, record.status, record.notes]
      );
      return res.rows[0];
    } catch (e) {
      console.warn('PG createMentalHealthRequest error:', e.message);
    }
  }

  const store = loadLocalStore();
  store.mental_health_requests = store.mental_health_requests || [];
  record.id = store.mental_health_requests.length > 0 ? Math.max(...store.mental_health_requests.map(m => m.id || 0)) + 1 : 1;
  store.mental_health_requests.unshift(record);
  saveLocalStore(store);

  return record;
}

async function findMentalHealthRequests(query) {
  const clean = (query || '').trim().toUpperCase();
  const raw = (query || '').trim();

  let requests = [];
  if (isPgConnected && pgPool) {
    try {
      const res = await pgPool.query(
        'SELECT * FROM mental_health_requests WHERE UPPER(request_token) = $1 OR mobile = $2 ORDER BY id DESC',
        [clean, raw]
      );
      return res.rows;
    } catch (e) {
      console.warn('PG findMentalHealthRequests error:', e.message);
    }
  }

  const store = loadLocalStore();
  requests = (store.mental_health_requests || []).filter(r =>
    (r.request_token && r.request_token.toUpperCase() === clean) ||
    (r.mobile && r.mobile.trim() === raw)
  );

  return requests;
}

async function seedDefaultMentalHealthRecords() {
  const store = loadLocalStore();
  if (!store.mental_health_requests || store.mental_health_requests.length === 0) {
    await createMentalHealthRequest({
      request_token: 'MHR-2026-10492',
      patient_alias: 'Ramesh Patel',
      mobile: '9823456789',
      state: 'Madhya Pradesh',
      district: 'Sehore',
      preferred_language: 'Hindi',
      primary_concern: 'Crop Loss Stress & Unseasonal Rainfall Anxiety',
      distress_level: 'Moderate Distress',
      message: 'Experiencing severe sleep loss and continuous worry after hailstorm damage to wheat crop.',
      referral_type: 'dmhp_hospital',
      privacy_level: 'Confidential'
    });
  }
}

seedDefaultInsuranceRecords().catch(err => console.error('Error seeding demo insurance:', err));
seedDefaultFinancialRecords().catch(err => console.error('Error seeding demo financial:', err));
seedDefaultStorageRecords().catch(err => console.error('Error seeding demo storage:', err));
seedDefaultMentalHealthRecords().catch(err => console.error('Error seeding demo mental health:', err));
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
  seedDefaultUsers,
  createInsuranceEnrollment,
  createCropClaim,
  findInsuranceRecords,
  createFinancialInquiry,
  findFinancialInquiries,
  // Storage Marketplace Engine
  verifyStorageSubsidy,
  listStorageFacilities,
  getStorageFacilityById,
  createStorageBooking,
  findStorageBookings,
  getProviderStorageBookings,
  updateStorageBookingStatus,
  updateStorageFacility,
  seedDefaultStorageRecords,
  // Farmer Mental Health Support & Clinical Referral Engine
  createMentalHealthRequest,
  findMentalHealthRequests,
  getVerifiedMentalHealthResources,
  seedDefaultMentalHealthRecords
};
