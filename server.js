/*
 * BhoomiBandhu Express backend
 * - Serves the static website
 * - Proxies weather and Groq AI requests without exposing keys to the browser
 * - Persists farmer requests, crop predictions and storage bookings in MySQL
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const mysql = require("mysql2/promise");
const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 3000);
app.use(cors());
app.use(express.json({ limit: "1mb" }));
// Keep database scripts, environment templates and backend internals out of static responses.
const privateStaticPaths = ["/database", "/server.js", "/package.json", "/package-lock.json", "/.env.example", "/README.md", "/COMPARISON.md", "/START.bat", "/LICENSE", "/node_modules", "/.git"];
app.use((req, res, next) => {
  const isPrivate = privateStaticPaths.some((base) => req.path === base || req.path.startsWith(`${base}/`));
  if (isPrivate) return res.sendStatus(404);
  return next();
});
const frontendDist = path.join(__dirname, "client", "dist");
app.use(express.static(frontendDist));

const OWM_KEY = process.env.OPENWEATHER_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const dbConfigured = Boolean(process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_DATABASE);
const pool = dbConfigured ? mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  decimalNumbers: true
}) : null;

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const databaseRoute = (fn) => asyncHandler(async (req, res, next) => {
  if (!pool) {
    return res.status(503).json({ error: "MySQL is not configured. Copy .env.example to .env and set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD and MYSQL_DATABASE." });
  }
  return fn(req, res, next);
});

const text = (value, max = 255) => typeof value === "string" ? value.trim().slice(0, max) : "";
const boolValue = (value) => value === true || value === 1 || value === "1" || String(value).toLowerCase() === "yes" || String(value).toLowerCase() === "true";
const validOneOf = (value, allowed) => allowed.includes(value);
const cleanCropName = (value) => text(value, 80).replace(/\p{Extended_Pictographic}/gu, "").replace(/[\uFE0F\u200D]/g, "").trim();
const badRequest = (res, message) => res.status(400).json({ error: message });

async function upsertFarmer(connection, { name, mobile, state, district = null, village = null, primaryCrop = null }) {
  if (!name || !mobile || !state) return null;
  const normalizedMobile = mobile.replace(/[\s()-]/g, "");
  const [existing] = await connection.execute("SELECT farmer_id FROM farmers WHERE mobile = ? LIMIT 1", [normalizedMobile]);
  if (existing.length) {
    await connection.execute(
      `UPDATE farmers SET name = ?, state = ?, district = COALESCE(?, district), village = COALESCE(?, village),
       primary_crop = COALESCE(?, primary_crop), updated_at = CURRENT_TIMESTAMP WHERE farmer_id = ?`,
      [name, state, district, village, primaryCrop, existing[0].farmer_id]
    );
    return existing[0].farmer_id;
  }
  const [insert] = await connection.execute(
    "INSERT INTO farmers (name, mobile, state, district, village, primary_crop) VALUES (?, ?, ?, ?, ?, ?)",
    [name, normalizedMobile, state, district, village, primaryCrop]
  );
  return insert.insertId;
}

function validMobile(mobile) {
  return /^\+?[0-9]{7,15}$/.test(String(mobile || "").replace(/[\s()-]/g, ""));
}

/* Health check ------------------------------------------------------------ */
app.get("/api/health", asyncHandler(async (req, res) => {
  let database = "not_configured";
  if (pool) {
    try {
      await pool.query("SELECT 1");
      database = "connected";
    } catch (err) {
      database = "unavailable";
    }
  }
  res.json({
    status: "ok",
    server: "BhoomiBandhu Backend",
    time: new Date().toISOString(),
    database,
    keys: { openweather: OWM_KEY ? "set" : "missing", groq: GROQ_KEY ? "set" : "missing" }
  });
}));

/* Weather proxy ----------------------------------------------------------- */
app.get("/api/weather", asyncHandler(async (req, res) => {
  const city = text(req.query.city, 100);
  if (!city) return badRequest(res, "city query parameter is required");
  if (!OWM_KEY) return res.status(503).json({ error: "OPENWEATHER_API_KEY is missing in .env" });
  const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OWM_KEY}&units=metric`);
  const data = await response.json();
  if (!response.ok || Number(data.cod) !== 200) return res.status(404).json({ error: data.message || "City not found" });
  const rainfallMm = (data.rain?.["1h"] ?? data.rain?.["3h"] ?? 0) * 30;
  res.json({
    city: data.name, country: data.sys.country,
    temp_c: Math.round(data.main.temp), feels_like_c: Math.round(data.main.feels_like),
    humidity_pct: data.main.humidity,
    rainfall_mm: Math.round(rainfallMm) || estimateRainfall(data.main.humidity),
    description: data.weather?.[0]?.description || "Current weather",
    wind_kmh: Math.round((data.wind?.speed || 0) * 3.6),
    icon: data.weather?.[0]?.icon ? `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png` : null
  });
}));
function estimateRainfall(humidity) {
  if (humidity >= 85) return 350;
  if (humidity >= 70) return 230;
  if (humidity >= 55) return 150;
  if (humidity >= 40) return 90;
  return 50;
}

/* Groq AI proxy (the existing /api/gemini URL is retained for the pages) -- */
app.post("/api/gemini", asyncHandler(async (req, res) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  if (!prompt) return badRequest(res, "prompt (string) is required");
  if (!GROQ_KEY) return res.status(503).json({ error: "GROQ_API_KEY is missing in .env. Get a key at https://console.groq.com/keys" });
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt.slice(0, 12000) }
      ],
      temperature: 0.7,
      max_tokens: 600,
      top_p: 0.9
    })
  });
  const data = await response.json();
  if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "Groq API error" });
  res.json({ reply: data?.choices?.[0]?.message?.content || "No response." });
}));

/* Farmer profiles --------------------------------------------------------- */
app.post("/api/farmers", databaseRoute(async (req, res) => {
  const name = text(req.body?.name, 100);
  const mobile = text(req.body?.mobile, 20).replace(/[\s()-]/g, "");
  const state = text(req.body?.state, 50);
  const primaryCrop = cleanCropName(req.body?.primary_crop) || null;
  if (!name || !state || !validMobile(mobile)) return badRequest(res, "A name, state and valid mobile number are required.");
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const farmerId = await upsertFarmer(connection, { name, mobile, state, primaryCrop });
    await connection.commit();
    res.status(200).json({ success: true, farmer_id: farmerId, message: "Farmer profile saved." });
  } catch (err) { await connection.rollback(); throw err; }
  finally { connection.release(); }
}));

/* Insurance requests; new-enrollment requests also create a linked PMFBY row. */
app.post("/api/insurance-requests", databaseRoute(async (req, res) => {
  const farmerName = text(req.body?.farmer_name, 100);
  const district = text(req.body?.district, 80);
  const cropName = cleanCropName(req.body?.crop_name);
  const requestType = text(req.body?.request_type, 30);
  const description = text(req.body?.description, 5000);
  const state = text(req.body?.state, 50);
  const mobile = text(req.body?.mobile, 20).replace(/[\s()-]/g, "");
  if (!farmerName || !district || !cropName || !description || !validOneOf(requestType, ["New Insurance Enrollment", "Crop Loss Claim"])) {
    return badRequest(res, "Complete all insurance form fields with a valid request type.");
  }
  if (!validMobile(mobile) || !state) return badRequest(res, "A valid mobile number and state are required to link your request to your farmer profile.");
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const farmerId = await upsertFarmer(connection, { name: farmerName, mobile, state, district, primaryCrop: cropName });
    const [insert] = await connection.execute(
      `INSERT INTO insurance_requests (farmer_id, farmer_name, district, crop_name, request_type, description, req_status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [farmerId, farmerName, district, cropName, requestType, description]
    );
    if (requestType === "New Insurance Enrollment") {
      await connection.execute(
        `INSERT INTO pmfby_enrollments (insurance_request_id, farmer_id, crop_name, land_records_verified)
         VALUES (?, ?, ?, 0)`,
        [insert.insertId, farmerId, cropName]
      );
    }
    await connection.commit();
    res.status(201).json({ success: true, request_id: insert.insertId, status: "pending", message: "Insurance request saved." });
  } catch (err) { await connection.rollback(); throw err; }
  finally { connection.release(); }
}));

app.get("/api/insurance-requests", databaseRoute(async (req, res) => {
  const mobile = text(req.query.mobile, 20).replace(/[\s()-]/g, "");
  if (!validMobile(mobile)) return badRequest(res, "Enter the mobile number used when submitting the insurance request.");
  const [rows] = await pool.execute(
    `SELECT ir.id, ir.farmer_name, ir.district, ir.crop_name, ir.request_type, ir.req_status, ir.submitted_at, ir.updated_at
     FROM insurance_requests ir INNER JOIN farmers f ON f.farmer_id = ir.farmer_id
     WHERE f.mobile = ? ORDER BY ir.submitted_at DESC LIMIT 50`, [mobile]
  );
  res.json({ requests: rows });
}));

/* Loan applications ------------------------------------------------------- */
app.post("/api/loan-applications", databaseRoute(async (req, res) => {
  const farmerName = text(req.body?.farmer_name, 100);
  const village = text(req.body?.village, 100);
  const amount = Number(req.body?.loan_amount);
  const loanType = text(req.body?.loan_type, 50);
  const purpose = text(req.body?.purpose, 5000);
  const mobile = text(req.body?.mobile, 20).replace(/[\s()-]/g, "");
  const state = text(req.body?.state, 50);
  if (!farmerName || !village || !purpose || !Number.isFinite(amount) || amount <= 0 || !validOneOf(loanType, ["Crop Loan", "Equipment Loan", "Irrigation Loan", "Dairy / Livestock Loan"])) {
    return badRequest(res, "Complete all loan fields and enter an amount greater than zero.");
  }
  let farmerId = null;
  if (mobile) {
    if (!validMobile(mobile) || !state) return badRequest(res, "A valid mobile number and state are required when linking a farmer profile.");
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      farmerId = await upsertFarmer(connection, { name: farmerName, mobile, state, village });
      const [insert] = await connection.execute(
        `INSERT INTO loan_applications (farmer_id, farmer_name, village, loan_amount, loan_type, purpose, app_status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [farmerId, farmerName, village, amount, loanType, purpose]
      );
      await connection.commit();
      return res.status(201).json({ success: true, application_id: insert.insertId, status: "pending" });
    } catch (err) { await connection.rollback(); throw err; }
    finally { connection.release(); }
  }
  const [insert] = await pool.execute(
    `INSERT INTO loan_applications (farmer_id, farmer_name, village, loan_amount, loan_type, purpose, app_status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')`, [farmerId, farmerName, village, amount, loanType, purpose]
  );
  res.status(201).json({ success: true, application_id: insert.insertId, status: "pending" });
}));

/* Mental-health support requests ----------------------------------------- */
app.post("/api/mental-health-requests", databaseRoute(async (req, res) => {
  const farmerName = text(req.body?.farmer_name, 100);
  const mobile = text(req.body?.mobile, 20).replace(/[\s()-]/g, "");
  const concernType = text(req.body?.concern_type, 50);
  const message = text(req.body?.message, 5000);
  const allowed = ["Stress & Anxiety", "Financial Pressure", "Crop Loss Stress", "Family or Personal Issues"];
  if (!farmerName || !validMobile(mobile) || !validOneOf(concernType, allowed)) return badRequest(res, "Provide your name, valid mobile number and a listed concern type.");
  const [farmerRows] = await pool.execute("SELECT farmer_id FROM farmers WHERE mobile = ? LIMIT 1", [mobile]);
  const farmerId = farmerRows[0]?.farmer_id || null;
  const [insert] = await pool.execute(
    `INSERT INTO mental_health_requests (farmer_id, farmer_name, mobile, concern_type, message, req_status)
     VALUES (?, ?, ?, ?, ?, 'pending')`, [farmerId, farmerName, mobile, concernType, message]
  );
  res.status(201).json({ success: true, request_id: insert.insertId, status: "pending" });
}));

/* Eligibility checks ------------------------------------------------------ */
app.post("/api/scheme-eligibility-checks", databaseRoute(async (req, res) => {
  const slug = text(req.body?.scheme_slug, 50);
  const category = text(req.body?.farmer_category, 20);
  const land = Number(req.body?.land_ha);
  const season = text(req.body?.crop_season, 15);
  const aadhaar = boolValue(req.body?.aadhaar_linked);
  const bank = boolValue(req.body?.bank_linked);
  const eligible = boolValue(req.body?.is_eligible);
  const resultMessage = text(req.body?.result_message, 2000);
  if (!validOneOf(slug, ["pmkisan", "pmfby", "kcc"]) || !validOneOf(category, ["small", "marginal", "large"]) || !Number.isFinite(land) || land < 0 || !validOneOf(season, ["Kharif", "Rabi", "Zaid"])) {
    return badRequest(res, "Invalid scheme eligibility details.");
  }
  const [schemes] = await pool.execute("SELECT id FROM government_schemes WHERE slug = ? AND active = 1 LIMIT 1", [slug]);
  if (!schemes.length) return res.status(404).json({ error: "The selected government scheme is not available in the database." });
  const [insert] = await pool.execute(
    `INSERT INTO scheme_eligibility_checks (scheme_id, farmer_category, land_ha, crop_season, aadhaar_linked, bank_linked, is_eligible, result_message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [schemes[0].id, category, land, season, aadhaar ? 1 : 0, bank ? 1 : 0, eligible ? 1 : 0, resultMessage]
  );
  res.status(201).json({ success: true, check_id: insert.insertId });
}));

/* Crop predictions -------------------------------------------------------- */
app.post("/api/crop-predictions", databaseRoute(async (req, res) => {
  const rainfall = Number(req.body?.rainfall_mm);
  const temperature = Number(req.body?.temperature_celsius);
  const soil = text(req.body?.soil_type, 20).toLowerCase();
  const crop = cleanCropName(req.body?.recommended_crop);
  const yieldLevel = text(req.body?.yield_level, 10);
  const riskLevel = text(req.body?.risk_level, 10);
  const confidence = Number(req.body?.confidence_percent);
  const advice = text(req.body?.ai_advice, 5000);
  if (!Number.isFinite(rainfall) || rainfall < 0 || !Number.isFinite(temperature) || !validOneOf(soil, ["loamy", "clay", "sandy"]) || !crop || !validOneOf(yieldLevel, ["Low", "Medium", "High"]) || !validOneOf(riskLevel, ["Low", "Medium", "High"]) || !Number.isFinite(confidence) || confidence < 0 || confidence > 100) {
    return badRequest(res, "Invalid crop prediction values.");
  }
  let farmerId = null;
  const mobile = text(req.body?.mobile, 20).replace(/[\s()-]/g, "");
  if (mobile && validMobile(mobile)) {
    const [farmers] = await pool.execute("SELECT farmer_id FROM farmers WHERE mobile = ? LIMIT 1", [mobile]);
    farmerId = farmers[0]?.farmer_id || null;
  }
  const [insert] = await pool.execute(
    `INSERT INTO crop_predictions (farmer_id, rainfall_mm, temperature_celsius, soil_type, recommended_crop, yield_level, risk_level, confidence_percent, ai_advice)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [farmerId, rainfall, temperature, soil, crop, yieldLevel, riskLevel, Math.round(confidence), advice]
  );
  res.status(201).json({ success: true, prediction_id: insert.insertId });
}));

/* Database reference catalogues ------------------------------------------- */
app.get("/api/crops", databaseRoute(async (req, res) => {
  const [rows] = await pool.execute("SELECT crop_id, crop_name, crop_category FROM crops ORDER BY crop_name");
  res.json({ crops: rows });
}));


/* External government schemes API -----------------------------------------
   Configure GOV_SCHEMES_API_URL and optionally GOV_SCHEMES_API_KEY in .env.
   Provider responses can be arrays or objects containing schemes/data/results.
   Credentials remain server-side; React only calls this local endpoint. */
app.get("/api/external-government-schemes", asyncHandler(async (req, res) => {
  const apiUrl = process.env.GOV_SCHEMES_API_URL;
  if (!apiUrl) return res.status(503).json({
    configured: false,
    schemes: [],
    message: "External scheme API is not configured. Set GOV_SCHEMES_API_URL in .env."
  });
  let parsedUrl;
  try { parsedUrl = new URL(apiUrl); } catch { return res.status(500).json({ error: "GOV_SCHEMES_API_URL must be a valid URL." }); }
  if (!["https:", "http:"].includes(parsedUrl.protocol)) return res.status(500).json({ error: "Government schemes API URL must use HTTP or HTTPS." });
  const headers = { Accept: "application/json" };
  if (process.env.GOV_SCHEMES_API_KEY) {
    const headerName = process.env.GOV_SCHEMES_API_KEY_HEADER || "Authorization";
    const prefix = process.env.GOV_SCHEMES_API_KEY_PREFIX;
    headers[headerName] = prefix === "none" ? process.env.GOV_SCHEMES_API_KEY :
      `${prefix || "Bearer"} ${process.env.GOV_SCHEMES_API_KEY}`;
  }
  const response = await fetch(parsedUrl, { headers, signal: AbortSignal.timeout(12000) });
  if (!response.ok) return res.status(502).json({ error: `External schemes provider returned HTTP ${response.status}.` });
  const payload = await response.json();
  const rows = Array.isArray(payload) ? payload :
    (payload.schemes || payload.data || payload.results || payload.items || payload.records || []);
  if (!Array.isArray(rows)) return res.status(502).json({ error: "External API response must be an array or contain a schemes/data/results/items/records array." });
  const schemes = rows.map((item, index) => ({
    id: item.id ?? item.scheme_id ?? item.code ?? index + 1,
    slug: item.slug ?? item.code ?? item.scheme_id ?? item.id ?? `external-${index + 1}`,
    name: item.name ?? item.scheme_name ?? item.title ?? item.schemeName ?? "Government scheme",
    scheme_type: item.scheme_type ?? item.type ?? item.category ?? item.government ?? "central",
    benefit_summary: item.benefit_summary ?? item.description ?? item.benefits ?? item.short_description ?? item.objective ?? "",
    eligibility: item.eligibility ?? item.eligibility_criteria ?? item.eligibilityCriteria ?? "",
    official_url: item.official_url ?? item.url ?? item.link ?? item.apply_url ?? item.application_url ?? ""
  }));
  res.json({ configured: true, count: schemes.length, schemes });
}));

app.get("/api/government-schemes", databaseRoute(async (req, res) => {
  const [rows] = await pool.execute(
    "SELECT id, slug, name, scheme_type, benefit_summary, storage_benefit_per_kg FROM government_schemes WHERE active = 1 ORDER BY name"
  );
  res.json({ schemes: rows });
}));

/* Storage facilities and bookings ---------------------------------------- */
app.get("/api/storage-facilities", databaseRoute(async (req, res) => {
  const state = text(req.query.state, 60);
  const params = [];
  let sql = `SELECT id, name, storage_type, location_text, state, district, distance_km, capacity_tons,
                    available_space_tons, price_per_kg_month, mode, temperature_range, suitable_crops,
                    facilities, scheme_support, rating, review_count, govt_approved, status
             FROM storage_facilities WHERE status IN ('available','limited') AND available_space_tons > 0`;
  if (state) { sql += " AND state = ?"; params.push(state); }
  sql += " ORDER BY govt_approved DESC, rating DESC LIMIT 100";
  const [rows] = await pool.execute(sql, params);
  res.json({ facilities: rows });
}));

app.post("/api/storage-bookings", databaseRoute(async (req, res) => {
  const farmerName = text(req.body?.farmer_name, 100);
  const mobile = text(req.body?.mobile, 20).replace(/[\s()-]/g, "");
  const state = text(req.body?.state, 60);
  const cropName = cleanCropName(req.body?.crop_type);
  const quantity = Number(req.body?.quantity_kg);
  const months = Number(req.body?.duration_months);
  const mode = text(req.body?.mode, 10).toLowerCase();
  const basePrice = Number(req.body?.base_price_per_kg);
  const storageType = text(req.body?.storage_type, 30);
  const schemeSlug = text(req.body?.scheme_slug, 50);
  if (!farmerName || !validMobile(mobile) || !state || !cropName || !Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(months) || months < 1 || !validOneOf(mode, ["online", "offline"]) || !Number.isFinite(basePrice) || basePrice <= 0 || !validOneOf(storageType, ["cold_storage", "warehouse", "offline"])) {
    return badRequest(res, "Complete the storage booking details using valid values.");
  }
  if (schemeSlug && !validOneOf(schemeSlug, ["pmkisan", "gramin_bhandaran", "state_subsidy"])) {
    return badRequest(res, "Invalid storage subsidy selected.");
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const farmerId = await upsertFarmer(connection, { name: farmerName, mobile, state, primaryCrop: cropName });
    let schemeId = null;
    let benefit = 0;
    if (schemeSlug) {
      const [schemes] = await connection.execute("SELECT id, storage_benefit_per_kg FROM government_schemes WHERE slug = ? AND active = 1 LIMIT 1", [schemeSlug]);
      if (!schemes.length) {
        await connection.rollback();
        return res.status(400).json({ error: "The selected storage scheme is not active in the database." });
      }
      schemeId = schemes[0].id;
      benefit = Number(schemes[0].storage_benefit_per_kg || 0);
    }
    const [facilities] = await connection.execute(
      `SELECT id FROM storage_facilities WHERE state = ? AND storage_type = ? AND mode = ? AND status IN ('available','limited')
       AND available_space_tons > 0 ORDER BY rating DESC LIMIT 1`, [state, storageType, mode]
    );
    const facilityId = facilities[0]?.id || null;
    const effective = Math.max(0, basePrice - benefit);
    const total = Math.round(effective * quantity * months * 100) / 100;
    const bookingRef = `BB${Date.now().toString().slice(-8)}${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    const [insert] = await connection.execute(
      `INSERT INTO storage_booking (booking_ref, farmer_name, mobile, facility_id, state, crop_type, quantity_kg,
       duration_months, mode, scheme_id, base_price_per_kg, scheme_benefit_per_kg, effective_price_per_kg,
       total_amount, booking_status, farmer_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [bookingRef, farmerName, mobile, facilityId, state, cropName, quantity, months, mode, schemeId, basePrice, benefit, effective, total, farmerId]
    );
    await connection.commit();
    res.status(201).json({ success: true, booking_id: insert.insertId, booking_ref: bookingRef, total_amount: total, effective_price_per_kg: effective, facility_id: facilityId, message: "Storage booking saved." });
  } catch (err) { await connection.rollback(); throw err; }
  finally { connection.release(); }
}));

app.get("/api/storage-bookings", databaseRoute(async (req, res) => {
  const mobile = text(req.query.mobile, 20).replace(/[\s()-]/g, "");
  if (!validMobile(mobile)) return badRequest(res, "Enter a valid mobile number to view storage bookings.");
  const [rows] = await pool.execute(
    `SELECT b.id, b.booking_ref, b.crop_type, b.quantity_kg, b.duration_months, b.total_amount, b.booking_status, b.booked_at,
            s.name AS facility_name
     FROM storage_booking b LEFT JOIN storage_facilities s ON s.id = b.facility_id
     WHERE b.mobile = ? ORDER BY b.booked_at DESC LIMIT 50`, [mobile]
  );
  res.json({ bookings: rows });
}));

const SYSTEM_PROMPT = `You are BhoomiBandhu AI — a knowledgeable and friendly agricultural advisor for Indian farmers.\n- Give practical, actionable crop advice in simple language (Hindi/English mix is fine when the user writes in Hinglish).\n- Focus on crop selection, sowing time, irrigation, fertiliser, pest/disease management and government schemes.\n- Keep answers concise (under 200 words) unless the user asks for detail.\n- End with one practical tip the farmer can act on today.\n- Do not discuss unrelated topics.`;

/* React SPA fallback: API routes above retain their Express handlers. */
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(frontendDist, "index.html"), (err) => {
    if (err && !res.headersSent) {
      res.status(404).send("React frontend is not built yet. Run `npm run build` and restart the server.");
    }
  });
});

/* Error handling ---------------------------------------------------------- */
app.use((err, req, res, next) => {
  console.error(`[${req.method} ${req.path}]`, err?.message || err);
  if (res.headersSent) return next(err);
  if (err?.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "A record with this unique value already exists." });
  if (err?.code === "ER_NO_REFERENCED_ROW_2" || err?.code === "ER_CHECK_CONSTRAINT_VIOLATED") {
    return res.status(400).json({ error: "One or more submitted values do not match the database rules." });
  }
  res.status(500).json({ error: "Server/database operation failed. Check the terminal for details." });
});

app.listen(PORT, () => {
  console.log(`\n  BhoomiBandhu backend running at http://localhost:${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/api/health`);
  console.log(`  MySQL: ${dbConfigured ? "configured (connection checked by health route)" : "not configured; copy .env.example to .env"}\n`);
});
