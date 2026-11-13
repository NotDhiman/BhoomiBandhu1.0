require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;
const path = require("path");

// Auth & Database Controllers
const { router: authRouter } = require("./auth");
const db = require("./db");

// Middleware
app.use(cors());
app.use(express.json({ limit: "25mb" })); // Supports document uploads & photo evidence
app.use("/api/auth", authRouter);

// ─────────────────────────────────────────────────────────────
// Real Insurance Enrollment & Claim Settlement REST APIs
// ─────────────────────────────────────────────────────────────

// Notified Crops & Season-Specific Directory
const NOTIFIED_CROPS_DIRECTORY = {
  "Madhya Pradesh": {
    insurer: "Agriculture Insurance Company of India (AIC)",
    districts: ["Sehore", "Bhopal", "Indore", "Ujjain", "Dewas", "Vidisha", "Raisen", "Hoshangabad"],
    crops: {
      rabi: [
        { crop: "Wheat (गेहूं - Sharbati/Lokwan)", scaleOfFinance: 42000, rate: 0.015, type: "Food Grain" },
        { crop: "Gram / Chickpea (चना)", scaleOfFinance: 38000, rate: 0.015, type: "Pulse" },
        { crop: "Mustard (सरसों)", scaleOfFinance: 36000, rate: 0.015, type: "Oilseed" },
        { crop: "Lentil / Masoor (मसूर)", scaleOfFinance: 35000, rate: 0.015, type: "Pulse" }
      ],
      kharif: [
        { crop: "Soybean (सोयाबीन)", scaleOfFinance: 39000, rate: 0.02, type: "Oilseed" },
        { crop: "Paddy / Rice (धान)", scaleOfFinance: 46000, rate: 0.02, type: "Food Grain" },
        { crop: "Maize (मक्का)", scaleOfFinance: 34000, rate: 0.02, type: "Food Grain" },
        { crop: "Pigeon Pea / Tur (अरहर)", scaleOfFinance: 38000, rate: 0.02, type: "Pulse" }
      ],
      commercial: [
        { crop: "Sugarcane (गन्ना)", scaleOfFinance: 75000, rate: 0.05, type: "Commercial" },
        { crop: "Cotton (कपास)", scaleOfFinance: 52000, rate: 0.05, type: "Commercial" },
        { crop: "Onion / Garlic (प्याज/लहसुन)", scaleOfFinance: 65000, rate: 0.05, type: "Horticultural" }
      ]
    }
  },
  "Punjab": {
    insurer: "SBI General Insurance",
    districts: ["Ludhiana", "Bathinda", "Patiala", "Sangrur", "Amritsar", "Jalandhar"],
    crops: {
      rabi: [
        { crop: "Wheat (गेहूं - PBW 550/HD 3086)", scaleOfFinance: 45000, rate: 0.015, type: "Food Grain" },
        { crop: "Mustard / Raya (सरसों)", scaleOfFinance: 37000, rate: 0.015, type: "Oilseed" },
        { crop: "Barley (जौ)", scaleOfFinance: 34000, rate: 0.015, type: "Food Grain" }
      ],
      kharif: [
        { crop: "Paddy / Rice (धान - PR 126/Pusa)", scaleOfFinance: 50000, rate: 0.02, type: "Food Grain" },
        { crop: "Basmati Paddy (बासमती धान)", scaleOfFinance: 54000, rate: 0.02, type: "Food Grain" },
        { crop: "Cotton / Narma (नरमा कपास)", scaleOfFinance: 54000, rate: 0.05, type: "Commercial" }
      ],
      commercial: [
        { crop: "Sugarcane (गन्ना)", scaleOfFinance: 80000, rate: 0.05, type: "Commercial" },
        { crop: "Potato (आलू)", scaleOfFinance: 70000, rate: 0.05, type: "Horticultural" }
      ]
    }
  },
  "Maharashtra": {
    insurer: "HDFC ERGO General Insurance",
    districts: ["Yavatmal", "Nagpur", "Pune", "Nashik", "Amravati", "Ahmednagar"],
    crops: {
      rabi: [
        { crop: "Wheat (गेहूं)", scaleOfFinance: 40000, rate: 0.015, type: "Food Grain" },
        { crop: "Gram / Harbara (हरभरा)", scaleOfFinance: 36000, rate: 0.015, type: "Pulse" },
        { crop: "Rabi Jowar (ज्वारी)", scaleOfFinance: 32000, rate: 0.015, type: "Food Grain" }
      ],
      kharif: [
        { crop: "Soybean (सोयाबीन)", scaleOfFinance: 40000, rate: 0.02, type: "Oilseed" },
        { crop: "Cotton (कापूस)", scaleOfFinance: 52000, rate: 0.05, type: "Commercial" },
        { crop: "Tur / Arhar (तूर)", scaleOfFinance: 38000, rate: 0.02, type: "Pulse" }
      ],
      commercial: [
        { crop: "Sugarcane (ऊस)", scaleOfFinance: 85000, rate: 0.05, type: "Commercial" },
        { crop: "Onion (कांदा)", scaleOfFinance: 62000, rate: 0.05, type: "Horticultural" }
      ]
    }
  },
  "Rajasthan": {
    insurer: "Bajaj Allianz General Insurance",
    districts: ["Jaipur", "Kota", "Jodhpur", "Alwar", "Sri Ganganagar"],
    crops: {
      rabi: [
        { crop: "Mustard (सरसों)", scaleOfFinance: 38000, rate: 0.015, type: "Oilseed" },
        { crop: "Wheat (गेहूं)", scaleOfFinance: 41000, rate: 0.015, type: "Food Grain" },
        { crop: "Gram (चना)", scaleOfFinance: 36000, rate: 0.015, type: "Pulse" }
      ],
      kharif: [
        { crop: "Bajra / Pearl Millet (बाजरा)", scaleOfFinance: 30000, rate: 0.02, type: "Food Grain" },
        { crop: "Soybean (सोयाबीन)", scaleOfFinance: 38000, rate: 0.02, type: "Oilseed" },
        { crop: "Guar Seed (ग्वार)", scaleOfFinance: 28000, rate: 0.02, type: "Commercial" }
      ],
      commercial: [
        { crop: "Cotton (कपास)", scaleOfFinance: 50000, rate: 0.05, type: "Commercial" },
        { crop: "Cumin / Jeera (जीरा)", scaleOfFinance: 55000, rate: 0.05, type: "Horticultural" }
      ]
    }
  },
  "Uttar Pradesh": {
    insurer: "AIC / Universal Sompo GIC",
    districts: ["Varanasi", "Lucknow", "Prayagraj", "Bareilly", "Meerut", "Agra"],
    crops: {
      rabi: [
        { crop: "Wheat (गेहूं)", scaleOfFinance: 42000, rate: 0.015, type: "Food Grain" },
        { crop: "Mustard (सरसों)", scaleOfFinance: 36000, rate: 0.015, type: "Oilseed" },
        { crop: "Gram (चना)", scaleOfFinance: 37000, rate: 0.015, type: "Pulse" }
      ],
      kharif: [
        { crop: "Paddy / Rice (धान)", scaleOfFinance: 46000, rate: 0.02, type: "Food Grain" },
        { crop: "Maize (मक्का)", scaleOfFinance: 33000, rate: 0.02, type: "Food Grain" },
        { crop: "Arhar (अरहर)", scaleOfFinance: 38000, rate: 0.02, type: "Pulse" }
      ],
      commercial: [
        { crop: "Sugarcane (गन्ना)", scaleOfFinance: 78000, rate: 0.05, type: "Commercial" },
        { crop: "Potato (आलू)", scaleOfFinance: 68000, rate: 0.05, type: "Horticultural" }
      ]
    }
  },
  "Haryana": {
    insurer: "Reliance General Insurance",
    districts: ["Karnal", "Rewari", "Hisar", "Rohtak", "Sirsa"],
    crops: {
      rabi: [
        { crop: "Wheat (गेहूं)", scaleOfFinance: 44000, rate: 0.015, type: "Food Grain" },
        { crop: "Mustard (सरसों)", scaleOfFinance: 37000, rate: 0.015, type: "Oilseed" },
        { crop: "Barley (जौ)", scaleOfFinance: 33000, rate: 0.015, type: "Food Grain" }
      ],
      kharif: [
        { crop: "Paddy / Rice (धान)", scaleOfFinance: 49000, rate: 0.02, type: "Food Grain" },
        { crop: "Cotton (कपास)", scaleOfFinance: 53000, rate: 0.05, type: "Commercial" },
        { crop: "Bajra (बाजरा)", scaleOfFinance: 31000, rate: 0.02, type: "Food Grain" }
      ],
      commercial: [
        { crop: "Sugarcane (गन्ना)", scaleOfFinance: 80000, rate: 0.05, type: "Commercial" }
      ]
    }
  },
  "Gujarat": {
    insurer: "ICICI Lombard General Insurance",
    districts: ["Rajkot", "Ahmedabad", "Surat", "Vadodara", "Junagadh"],
    crops: {
      rabi: [
        { crop: "Wheat (ઘઉં)", scaleOfFinance: 42000, rate: 0.015, type: "Food Grain" },
        { crop: "Gram / Chana (ચણા)", scaleOfFinance: 37000, rate: 0.015, type: "Pulse" },
        { crop: "Mustard (રાયડો)", scaleOfFinance: 36000, rate: 0.015, type: "Oilseed" }
      ],
      kharif: [
        { crop: "Groundnut (મગફળી)", scaleOfFinance: 45000, rate: 0.02, type: "Oilseed" },
        { crop: "Cotton (કપાસ)", scaleOfFinance: 54000, rate: 0.05, type: "Commercial" },
        { crop: "Castor (દિવેલા)", scaleOfFinance: 40000, rate: 0.02, type: "Commercial" }
      ],
      commercial: [
        { crop: "Cotton (કપાસ)", scaleOfFinance: 54000, rate: 0.05, type: "Commercial" },
        { crop: "Cumin / Jeera (જીરું)", scaleOfFinance: 58000, rate: 0.05, type: "Horticultural" }
      ]
    }
  },
  "Bihar": {
    insurer: "AIC / National Insurance",
    districts: ["Patna", "Muzaffarpur", "Gaya", "Bhagalpur"],
    crops: {
      rabi: [
        { crop: "Wheat (गेहूं)", scaleOfFinance: 40000, rate: 0.015, type: "Food Grain" },
        { crop: "Maize / Rabi Makka (मक्का)", scaleOfFinance: 36000, rate: 0.015, type: "Food Grain" },
        { crop: "Lentil / Masoor (मसूर)", scaleOfFinance: 34000, rate: 0.015, type: "Pulse" }
      ],
      kharif: [
        { crop: "Paddy / Rice (धान)", scaleOfFinance: 44000, rate: 0.02, type: "Food Grain" },
        { crop: "Maize (मक्का)", scaleOfFinance: 32000, rate: 0.02, type: "Food Grain" }
      ],
      commercial: [
        { crop: "Sugarcane (गन्ना)", scaleOfFinance: 72000, rate: 0.05, type: "Commercial" },
        { crop: "Potato (आलू)", scaleOfFinance: 64000, rate: 0.05, type: "Horticultural" }
      ]
    }
  }
};

const SEASON_METADATA = {
  rabi: {
    name: "Rabi 2026-27",
    status: "Active - Open for Enrollment",
    status_badge: "OPEN",
    sowing_window: "15 October to 15 December 2026",
    cutoff_date: "2026-12-31",
    cutoff_display: "31st December 2026",
    days_remaining: 48,
    farmer_share_pct: 1.5,
    description: "Covers winter food grains, pulses, and oilseeds. Maximum subsidized farmer premium capped at 1.5% of sum insured."
  },
  kharif: {
    name: "Kharif 2026",
    status: "Notification Active",
    status_badge: "NOTIFICATION ISSUED",
    sowing_window: "01 June to 31 July 2026",
    cutoff_date: "2026-07-31",
    cutoff_display: "31st July 2026",
    days_remaining: 260,
    farmer_share_pct: 2.0,
    description: "Covers monsoon food grains and oilseeds. Maximum subsidized farmer premium capped at 2.0% of sum insured."
  },
  commercial: {
    name: "Commercial & Horticultural 2026-27",
    status: "Active per District Gazette Notification",
    status_badge: "OPEN",
    sowing_window: "Crop specific gazette calendar",
    cutoff_date: "2026-12-31",
    cutoff_display: "31st December 2026",
    days_remaining: 48,
    farmer_share_pct: 5.0,
    description: "Covers cotton, sugarcane, potato, onion, and spices. Maximum statutory farmer premium capped at 5.0%."
  }
};

// GET /api/insurance/notified-crops
app.get("/api/insurance/notified-crops", (req, res) => {
  const { state, district, season } = req.query;
  const stateData = NOTIFIED_CROPS_DIRECTORY[state] || NOTIFIED_CROPS_DIRECTORY["Madhya Pradesh"];
  const seasonKey = (season || "rabi").toLowerCase().includes("kharif") 
    ? "kharif" 
    : ((season || "").toLowerCase().includes("commercial") ? "commercial" : "rabi");
  
  const crops = stateData.crops[seasonKey] || stateData.crops.rabi;
  const seasonInfo = SEASON_METADATA[seasonKey] || SEASON_METADATA.rabi;

  res.json({
    success: true,
    state: state || "Madhya Pradesh",
    district: district || (stateData.districts[0] || "Sehore"),
    season: seasonInfo.name,
    season_info: seasonInfo,
    insurer: stateData.insurer,
    districts: stateData.districts,
    notified_crops: crops,
    official_portal_url: "https://pmfby.gov.in"
  });
});

app.post("/api/insurance/enroll", async (req, res) => {
  try {
    const {
      farmer_name,
      mobile,
      aadhaar_last4,
      state,
      district,
      village,
      season,
      crop_name,
      area_acres,
      bank_account_last4,
      ifsc,
      sowing_date,
      land_khasra,
      documents
    } = req.body;

    if (!farmer_name || !mobile || !crop_name || !area_acres) {
      return res.status(400).json({
        success: false,
        message: "Farmer name, 10-digit mobile number, crop name, and land area (in acres) are required."
      });
    }

    // Official PMFBY Premium Calculation
    // Kharif crops = 2.0%, Rabi food grains = 1.5%, Commercial/Horticulture = 5.0%
    const acres = parseFloat(area_acres) || 1.0;
    const isRabi = (season || "Rabi").toLowerCase().includes("rabi");
    const isCommercial = (season || "").toLowerCase().includes("commercial") || 
      (crop_name || "").toLowerCase().includes("cotton") || 
      (crop_name || "").toLowerCase().includes("sugarcane") ||
      (crop_name || "").toLowerCase().includes("potato") ||
      (crop_name || "").toLowerCase().includes("onion");
    
    // Accept clientSumInsured if provided and >0, else calculate standard default (approx ₹40,000/acre)
    const clientSumInsured = req.body.sum_insured ? Number(req.body.sum_insured) : null;
    const sumInsured = (clientSumInsured && clientSumInsured > 0) ? clientSumInsured : Math.round(acres * 40000);
    const premiumRate = isCommercial ? 0.05 : (isRabi ? 0.015 : 0.02);
    const clientFarmerPremium = req.body.farmer_premium ? Number(req.body.farmer_premium) : null;
    const farmerPremium = (clientFarmerPremium && clientFarmerPremium > 0) ? clientFarmerPremium : Math.round(sumInsured * premiumRate);

    const record = await db.createInsuranceEnrollment({
      farmer_name: farmer_name.trim(),
      mobile: mobile.trim(),
      aadhaar_last4: aadhaar_last4 ? aadhaar_last4.trim() : "",
      state: state || "",
      district: district || "",
      village: village || "",
      season: season || "Rabi 2026",
      crop_name: crop_name.trim(),
      area_acres: acres,
      sum_insured: sumInsured,
      farmer_premium: farmerPremium,
      bank_account_last4: bank_account_last4 ? bank_account_last4.trim() : "",
      ifsc: ifsc ? ifsc.trim().toUpperCase() : "",
      sowing_date: sowing_date || "",
      land_khasra: land_khasra || "",
      documents: Array.isArray(documents) ? documents : [],
      status: "Application Submitted (Under Verification)"
    });

    console.log(`🌾 [PMFBY Enrollment] New Application: ${record.application_id} for ${record.farmer_name} (${record.mobile})`);

    res.status(201).json({
      success: true,
      message: "PMFBY Enrollment application submitted successfully and persisted to database!",
      applicationId: record.application_id,
      record,
      officialPortalUrl: "https://pmfby.gov.in"
    });
  } catch (error) {
    console.error("Insurance enrollment error:", error);
    res.status(500).json({ success: false, message: "Failed to persist insurance enrollment." });
  }
});

app.post("/api/insurance/claim", async (req, res) => {
  try {
    const {
      farmer_name,
      mobile,
      policy_or_khasra_no,
      state,
      district,
      village,
      crop_name,
      affected_area_acres,
      calamity_type,
      loss_date,
      damage_percentage,
      loss_description,
      documents
    } = req.body;

    if (!farmer_name || !mobile || !crop_name || !calamity_type || !loss_date) {
      return res.status(400).json({
        success: false,
        message: "Farmer name, mobile, crop, natural calamity type, and date of loss are mandatory."
      });
    }

    // Validate 72-Hour Intimation Window Guideline
    const lossTime = new Date(loss_date).getTime();
    const nowTime = Date.now();
    const diffHours = (nowTime - lossTime) / (1000 * 60 * 60);
    const isWithin72Hrs = diffHours <= 78; // 72 hours + 6 hours buffer
    const intimationWindowStatus = isWithin72Hrs
      ? `Within 72 Hours (Valid - ${Math.max(1, Math.round(diffHours))}h elapsed)`
      : `Late Intimation (${Math.round(diffHours)}h elapsed - Special review needed)`;

    const record = await db.createCropClaim({
      farmer_name: farmer_name.trim(),
      mobile: mobile.trim(),
      policy_or_khasra_no: policy_or_khasra_no ? policy_or_khasra_no.trim() : "",
      state: state || "",
      district: district || "",
      village: village || "",
      crop_name: crop_name.trim(),
      affected_area_acres: parseFloat(affected_area_acres) || 1.0,
      calamity_type: calamity_type.trim(),
      loss_date: loss_date,
      intimation_window_status: intimationWindowStatus,
      damage_percentage: parseFloat(damage_percentage) || 50,
      loss_description: loss_description ? loss_description.trim() : "",
      documents: Array.isArray(documents) ? documents : [],
      status: "Loss Intimation Registered (Surveyor Appointed)"
    });

    console.log(`🛡️ [PMFBY Claim Intimation] New Claim: ${record.claim_id} for ${record.farmer_name} (${record.calamity_type})`);

    res.status(201).json({
      success: true,
      message: "Crop loss damage intimation registered successfully! Surveyor notification dispatched.",
      claimId: record.claim_id,
      record,
      kisanHelpline: "1800-180-1551"
    });
  } catch (error) {
    console.error("Crop claim filing error:", error);
    res.status(500).json({ success: false, message: "Failed to persist crop claim." });
  }
});

app.get("/api/insurance/track/:query", async (req, res) => {
  try {
    const { query } = req.params;
    const verify = req.query.verify || req.query.mobile || req.query.aadhaar || '';
    if (!query || query.trim().length < 3) {
      return res.status(400).json({ success: false, message: "Please enter a valid Application ID, Claim ID, or 10-digit mobile number." });
    }

    const records = await db.findInsuranceRecords(query.trim(), verify ? verify.trim() : '');
    const totalFound = (records.enrollments?.length || 0) + (records.claims?.length || 0);

    res.json({
      success: true,
      query: query.trim(),
      verified: records.verified || false,
      totalFound,
      enrollments: records.enrollments || [],
      claims: records.claims || []
    });
  } catch (error) {
    console.error("Track status error:", error);
    res.status(500).json({ success: false, message: "Failed to query insurance records." });
  }
});

// Secure verification POST endpoint for Application Tracking
app.post("/api/insurance/track", async (req, res) => {
  try {
    const { query, verification_code } = req.body;
    if (!query || query.trim().length < 3) {
      return res.status(400).json({ success: false, message: "Please enter a valid Application ID, Claim ID, or 10-digit mobile number." });
    }

    const records = await db.findInsuranceRecords(query.trim(), (verification_code || '').trim());
    const totalFound = (records.enrollments?.length || 0) + (records.claims?.length || 0);

    res.json({
      success: true,
      query: query.trim(),
      verified: records.verified || false,
      totalFound,
      enrollments: records.enrollments || [],
      claims: records.claims || []
    });
  } catch (error) {
    console.error("Track status verify error:", error);
    res.status(500).json({ success: false, message: "Failed to verify insurance records." });
  }
});

// ── Financial Support & KCC Pre-Screening Endpoints ──────────────────
app.post("/api/financial/prescreen", async (req, res) => {
  try {
    const {
      farmer_name,
      mobile,
      state,
      district,
      village,
      landholding_acres,
      primary_crop,
      annual_income,
      loan_purpose,
      requested_amount,
      target_bank
    } = req.body;

    if (!farmer_name || !mobile || !primary_crop || !landholding_acres) {
      return res.status(400).json({
        success: false,
        message: "Farmer name, 10-digit mobile, primary crop, and landholding (acres) are required."
      });
    }

    const acres = parseFloat(landholding_acres) || 1.0;
    // Scale of finance standard calculation:
    // Scale of finance for crop cultivation ~₹40,000/acre
    // + 10% post-harvest/household consumption expenses
    // + 20% maintenance of farm assets
    // Total KCC Limit = acres * ₹40,000 * 1.30 = acres * ₹52,000 (rounded)
    const baseScaleOfFinance = 40000;
    const estimatedKccLimit = Math.round(acres * baseScaleOfFinance * 1.30);
    const subventionRate = "4.0% (7% base minus 3% Prompt Repayment Incentive)";
    const readinessScore = "95% (Dossier Ready)";

    const record = await db.createFinancialInquiry({
      farmer_name: farmer_name.trim(),
      mobile: mobile.trim(),
      state: state || "",
      district: district || "",
      village: village || "",
      landholding_acres: acres,
      primary_crop: primary_crop.trim(),
      annual_income: parseFloat(annual_income) || 0,
      loan_purpose: loan_purpose || "Kisan Credit Card (Crop Cultivation)",
      requested_amount: parseFloat(requested_amount) || estimatedKccLimit,
      estimated_kcc_limit: estimatedKccLimit,
      eligible_subvention_rate: subventionRate,
      readiness_score: readinessScore,
      target_bank: target_bank || "State Bank of India (YONO Krishi)",
      status: "Dossier Prepared & Ready for Bank Submission"
    });

    res.status(201).json({
      success: true,
      message: "Financial pre-screening dossier generated successfully. Please take this dossier to your chosen bank.",
      record
    });
  } catch (error) {
    console.error("Financial pre-screen error:", error);
    res.status(500).json({ success: false, message: "Failed to persist financial dossier." });
  }
});

app.get("/api/financial/track/:query", async (req, res) => {
  try {
    const { query } = req.params;
    if (!query || query.trim().length < 3) {
      return res.status(400).json({ success: false, message: "Please enter a valid Dossier ID or 10-digit mobile number." });
    }

    const inquiries = await db.findFinancialInquiries(query.trim());
    res.json({
      success: true,
      query: query.trim(),
      totalFound: inquiries.length,
      inquiries
    });
  } catch (error) {
    console.error("Track financial inquiry error:", error);
    res.status(500).json({ success: false, message: "Failed to query financial records." });
  }
});

// ─────────────────────────────────────────────────────────────
// Digital Storage Marketplace & Verified Warehousing REST APIs
// ─────────────────────────────────────────────────────────────

// List facilities with live capacity and filters
app.get("/api/storage/facilities", async (req, res) => {
  try {
    const filters = {
      state: req.query.state,
      district: req.query.district,
      type: req.query.type,
      crop: req.query.crop,
      search: req.query.search
    };
    const facilities = await db.listStorageFacilities(filters);
    res.json({
      success: true,
      count: facilities.length,
      facilities
    });
  } catch (error) {
    console.error("List storage facilities error:", error);
    res.status(500).json({ success: false, message: "Failed to load storage facilities." });
  }
});

// Single facility profile
app.get("/api/storage/facilities/:id", async (req, res) => {
  try {
    const facility = await db.getStorageFacilityById(req.params.id);
    if (!facility) {
      return res.status(404).json({ success: false, message: "Storage facility not found." });
    }
    res.json({ success: true, facility });
  } catch (error) {
    console.error("Get storage facility error:", error);
    res.status(500).json({ success: false, message: "Failed to load facility profile." });
  }
});

// Scheme subsidy eligibility verifier
app.post("/api/storage/verify-subsidy", (req, res) => {
  try {
    const result = db.verifyStorageSubsidy(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("Verify storage subsidy error:", error);
    res.status(500).json({ success: false, message: "Failed to verify subsidy eligibility." });
  }
});

// Create booking request with unique ID, capacity deduction, and payment breakdown
app.post("/api/storage/book", async (req, res) => {
  try {
    const {
      facility_id,
      farmer_name,
      mobile,
      farmer_state,
      farmer_district,
      crop_name,
      quantity_kg,
      quantity_quintals,
      duration_months,
      intake_date,
      scheme_applied,
      farmer_category,
      payment_mode,
      advance_paid
    } = req.body;

    if (!facility_id || !farmer_name || !mobile || !crop_name || (!quantity_kg && !quantity_quintals) || !duration_months) {
      return res.status(400).json({
        success: false,
        message: "Facility, farmer name, mobile number, crop name, quantity, and duration are required."
      });
    }

    const facility = await db.getStorageFacilityById(facility_id);
    if (!facility) {
      return res.status(404).json({ success: false, message: "Selected storage facility does not exist." });
    }

    const bookingQtyKg = Number(quantity_kg) || (Number(quantity_quintals) * 100);
    const bookingQtyMt = bookingQtyKg / 1000;

    if (facility.available_capacity_mt < bookingQtyMt) {
      return res.status(400).json({
        success: false,
        message: `Insufficient capacity at ${facility.name}. Requested: ${bookingQtyMt} MT, Available: ${facility.available_capacity_mt} MT.`
      });
    }

    const record = await db.createStorageBooking({
      facility_id,
      facility_name: facility.name,
      provider_id: facility.provider_id,
      farmer_name,
      mobile,
      farmer_state: farmer_state || facility.state,
      farmer_district: farmer_district || facility.district,
      crop_name,
      quantity_kg: bookingQtyKg,
      quantity_quintals: Number(quantity_quintals) || (bookingQtyKg / 100),
      duration_months: Number(duration_months),
      intake_date: intake_date || new Date().toISOString().split('T')[0],
      scheme_applied: scheme_applied || 'NONE',
      farmer_category: farmer_category || 'general',
      payment_mode: payment_mode || 'UPI',
      payment_status: advance_paid ? 'Advance Paid (20%)' : 'Advance Required',
      booking_status: 'Pending Provider Confirmation'
    });

    res.status(201).json({
      success: true,
      message: "Storage booking request confirmed and digital gate pass generated.",
      booking: record
    });
  } catch (error) {
    console.error("Storage booking error:", error);
    res.status(500).json({ success: false, message: "Failed to persist storage booking." });
  }
});

// Track storage booking by Booking ID or mobile
app.get("/api/storage/track/:query", async (req, res) => {
  try {
    const { query } = req.params;
    if (!query || query.trim().length < 3) {
      return res.status(400).json({ success: false, message: "Please provide a valid Booking ID (e.g. STG-2026-...) or 10-digit mobile number." });
    }

    const bookings = await db.findStorageBookings(query.trim());
    res.json({
      success: true,
      query: query.trim(),
      totalFound: bookings.length,
      bookings
    });
  } catch (error) {
    console.error("Track storage booking error:", error);
    res.status(500).json({ success: false, message: "Failed to query storage records." });
  }
});

// Provider endpoint: list bookings for facility/provider
app.get("/api/storage/provider/bookings", async (req, res) => {
  try {
    const facilityOrProviderId = req.query.facility_id || req.query.provider_id;
    const bookings = await db.getProviderStorageBookings(facilityOrProviderId);
    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error("Get provider storage bookings error:", error);
    res.status(500).json({ success: false, message: "Failed to query provider bookings." });
  }
});

// Provider endpoint: update booking status (confirm, intake produce, complete, reject)
app.post("/api/storage/provider/bookings/:bookingId/status", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, provider_notes } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required." });
    }

    const updated = await db.updateStorageBookingStatus(bookingId, status, provider_notes);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Booking record not found." });
    }

    res.json({
      success: true,
      message: `Booking ${bookingId} updated to ${status}.`,
      booking: updated
    });
  } catch (error) {
    console.error("Update storage booking status error:", error);
    res.status(500).json({ success: false, message: "Failed to update booking status." });
  }
});

// Provider endpoint: update facility settings
app.post("/api/storage/provider/facility/update", async (req, res) => {
  try {
    const { facility_id, available_capacity_mt, base_rate_per_kg_month, is_active } = req.body;
    if (!facility_id) {
      return res.status(400).json({ success: false, message: "Facility ID is required." });
    }

    const updated = await db.updateStorageFacility(facility_id, {
      available_capacity_mt,
      base_rate_per_kg_month,
      is_active
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Facility not found." });
    }

    res.json({
      success: true,
      message: "Storage facility profile and live capacity updated.",
      facility: updated
    });
  } catch (error) {
    console.error("Update storage facility error:", error);
    res.status(500).json({ success: false, message: "Failed to update facility." });
  }
});

// ─────────────────────────────────────────────────────────────
// Farmer Mental Health Support & Clinical Referral REST APIs
// ─────────────────────────────────────────────────────────────

// Get verified mental health helplines & DMHP centers
app.get("/api/mental-health/resources", (req, res) => {
  try {
    const { state, district } = req.query;
    const resources = db.getVerifiedMentalHealthResources(state, district);
    res.json({ success: true, ...resources });
  } catch (error) {
    console.error("Get mental health resources error:", error);
    res.status(500).json({ success: false, message: "Failed to load mental health resources." });
  }
});

// Create confidential support request or referral dossier
app.post("/api/mental-health/request", async (req, res) => {
  try {
    const {
      patient_alias,
      mobile,
      state,
      district,
      preferred_language,
      primary_concern,
      distress_level,
      message,
      referral_type,
      privacy_level
    } = req.body;

    if (!primary_concern || !distress_level) {
      return res.status(400).json({
        success: false,
        message: "Primary concern and distress level are required."
      });
    }

    const record = await db.createMentalHealthRequest({
      patient_alias,
      mobile,
      state,
      district,
      preferred_language,
      primary_concern,
      distress_level,
      message,
      referral_type,
      privacy_level
    });

    res.status(201).json({
      success: true,
      message: "Referral request processed securely.",
      request: record
    });
  } catch (error) {
    console.error("Mental health request error:", error);
    res.status(500).json({ success: false, message: "Failed to persist mental health referral." });
  }
});

// Track referral dossier by Token or mobile
app.get("/api/mental-health/track/:query", async (req, res) => {
  try {
    const { query } = req.params;
    if (!query || query.trim().length < 3) {
      return res.status(400).json({ success: false, message: "Please enter a valid Referral Token (e.g. MHR-2026-...) or 10-digit mobile." });
    }

    const requests = await db.findMentalHealthRequests(query.trim());
    res.json({
      success: true,
      query: query.trim(),
      totalFound: requests.length,
      requests
    });
  } catch (error) {
    console.error("Track mental health request error:", error);
    res.status(500).json({ success: false, message: "Failed to query mental health records." });
  }
});

// ─────────────────────────────────────────────────────────────
// Real Weather API Endpoint (OpenWeatherMap + Open-Meteo + IMD Normals)
// ─────────────────────────────────────────────────────────────
const weatherService = require("./weather-service");

app.get("/api/weather", async (req, res) => {
  try {
    const city = req.query.city || "Delhi";
    const data = await weatherService.resolveWeather(city);
    res.json(data);
  } catch (err) {
    console.error("Weather resolution error:", err);
    res.status(500).json({ error: "Failed to resolve weather data for specified location." });
  }
});

app.get("/api/weather/cities", (req, res) => {
  const cities = Object.entries(weatherService.IMD_REGIONAL_NORMALS).map(([key, item]) => ({
    key,
    name: item.name,
    state: item.state,
    zone: item.zone,
    soilDefault: item.soilDefault
  }));
  res.json({ success: true, cities });
});

// ─────────────────────────────────────────────────────────────
// Agro-Meteorological Risk & Crop-Stage Advisory Endpoint
// ─────────────────────────────────────────────────────────────
function generateAgroRiskAdvisory(weather, crop = "Wheat", stage = "Grain Filling & Pod Maturity") {
  const temp = Number(weather.temp_c || 22);
  const rain = Number(weather.rainfall_mm || 10);
  const hum = Number(weather.humidity_pct || 50);
  const wind = Number(weather.wind_kmh || 10);

  let alertLevel = "GREEN";
  let alertTitle = "Favorable Agro-Climatic Conditions";
  let alertType = "Normal / Low Risk";
  let alertMessage = "Current atmospheric conditions are optimal for normal crop metabolic activity. Follow standard package of practices.";
  let urgency = "Routine Monitoring";

  if (rain >= 80) {
    alertLevel = "RED";
    alertTitle = "Severe Inundation & Soil Waterlogging Alert (अत्यधिक वर्षा व जलभराव)";
    alertType = "Excessive Precipitation";
    alertMessage = `Heavy precipitation (${rain} mm) observed. High probability of root asphyxiation, nutrient leaching, and physical lodging across standing fields.`;
    urgency = "Immediate Drainage Action Required";
  } else if (temp >= 36) {
    alertLevel = "RED";
    alertTitle = "Terminal Heat Stress & High Evapotranspiration Alert (लू व अत्यधिक तापमान)";
    alertType = "Severe Heatwave";
    alertMessage = `High ambient temperature (${temp}°C) exceeds critical threshold. Triggers pollen sterility, forced maturity, and shriveling of developing grains.`;
    urgency = "Protective Irrigation & Canopy Spray Urgent";
  } else if (temp <= 4) {
    alertLevel = "RED";
    alertTitle = "Ground Frost & Cold Wave Emergency Alert (पाला व शीत लहर प्रकोप)";
    alertType = "Frost Peril";
    alertMessage = `Near-freezing temperatures (${temp}°C) can cause cellular freezing and necrosis in tender floral parts and succulent foliage.`;
    urgency = "Light Evening Irrigation & Smoke Generation Urgently Advised";
  } else if (hum >= 75 && temp >= 18 && temp <= 28) {
    alertLevel = "ORANGE";
    alertTitle = "High Fungal Pathogen & Rust / Blight Warning (कवक व रतुआ अनुकूल मौसम)";
    alertType = "Disease Outbreak Risk";
    alertMessage = `Persistent high humidity (${hum}%) and moderate temperature (${temp}°C) are ideal for rapid sporulation of foliar rusts, powdery mildew, and blight.`;
    urgency = "Prophylactic Bio-Fungicide Spray Recommended";
  } else if (wind >= 24) {
    alertLevel = "ORANGE";
    alertTitle = "High Gale Wind & Crop Lodging Warning (तेज़ आंधी व फसल गिरने का खतरा)";
    alertType = "Squall / Wind Lodging";
    alertMessage = `Wind velocity (${wind} km/h) combined with tall vegetative canopy poses imminent lodging threat. Roots may dislodge if soil is overly saturated.`;
    urgency = "Withhold Flood Irrigation Immediately";
  } else if (rain < 8 && temp >= 30) {
    alertLevel = "YELLOW";
    alertTitle = "Soil Moisture Deficit & Dry Spell Advisory (नमी संरक्षण सलाह)";
    alertType = "Dry Spell Watch";
    alertMessage = `Low moisture index observed. Continuous dry spell may restrict nutrient absorption and reduce photosynthetic efficiency.`;
    urgency = "Schedule Drip or Light Sprinkler Irrigation";
  }

  // Crop-Stage Specific Risks
  const cropStageVulnerabilities = {
    "Wheat": {
      "Sowing / Germination": [
        { hazard: "Sub-optimal Germination", description: "Soil temperature above 28°C slows coleoptile elongation and causes seed rot.", severity: "Moderate", pmfby_stage: "Stage 1: Prevented Sowing" },
        { hazard: "Termite & Cutworm Attack", description: "Dry topsoil encourages subterranean pest feeding on emerging seedlings.", severity: "Low", pmfby_stage: "Stage 2: Standing Crop" }
      ],
      "Tillering / Vegetative": [
        { hazard: "Root Rot & Crown Yellowing", description: "Excess standing water restricts oxygen diffusion to crown root initiation (CRI).", severity: "High", pmfby_stage: "Stage 2: Standing Crop" },
        { hazard: "Aphid Infestation (माहू)", description: "Cloudy days with high humidity trigger rapid sap-sucking colonies on leaves.", severity: "Moderate", pmfby_stage: "Stage 2: Standing Crop" }
      ],
      "Flowering & Booting": [
        { hazard: "Yellow / Brown Rust (पीला रतुआ)", description: "Humid micro-climate (>75%) produces pustules that destroy photosynthetic green area.", severity: "High", pmfby_stage: "Stage 2: Standing Crop" },
        { hazard: "Frost / Cold Sterility", description: "Night temperatures below 4°C during anthesis cause unfertilized floret sterility.", severity: "Critical", pmfby_stage: "Stage 2: Standing Crop" }
      ],
      "Grain Filling & Pod Maturity": [
        { hazard: "Terminal Heat Shriveling", description: "Sudden temperature surge (>32°C) shortens grain-filling duration, causing up to 25% yield loss.", severity: "High", pmfby_stage: "Stage 2: Standing Crop" },
        { hazard: "Lodging from Hail / Wind", description: "Heavy grain heads make plants vulnerable to flattening during convective thunderstorms.", severity: "Critical", pmfby_stage: "Stage 4: Localized Calamity (Hailstorm)" }
      ],
      "Harvest & Cut-and-Spread Drying": [
        { hazard: "Post-Harvest Rain Damage", description: "Cut bundles spread in field suffer mold, grain blackening, and pre-harvest sprouting.", severity: "Critical", pmfby_stage: "Stage 3: Post-Harvest Loss (Up to 14 Days)" }
      ]
    },
    "Soybean": {
      "Sowing / Germination": [
        { hazard: "Seed Rot from Downpour", description: "Heavy downpour within 48 hours of sowing causes soil crusting and seedling emergence failure.", severity: "Critical", pmfby_stage: "Stage 1: Prevented Sowing" }
      ],
      "Tillering / Vegetative": [
        { hazard: "Girdle Beetle & Stem Fly", description: "Larvae bore into tender petioles, leading to branch wilting and plant death.", severity: "High", pmfby_stage: "Stage 2: Standing Crop" },
        { hazard: "Waterlogging Stress", description: "Soybean cannot tolerate standing water beyond 24 hours without significant chlorosis.", severity: "Critical", pmfby_stage: "Stage 2: Standing Crop" }
      ],
      "Flowering & Booting": [
        { hazard: "Flower Drop from Drought", description: "Moisture stress at flowering causes extensive flower shedding and aborted pods.", severity: "Critical", pmfby_stage: "Stage 2: Standing Crop" }
      ],
      "Grain Filling & Pod Maturity": [
        { hazard: "Hailstorm Pod Shattering", description: "Hailstones strike mature brittle pods causing immediate seed shattering onto ground.", severity: "Critical", pmfby_stage: "Stage 4: Localized Calamity (Hailstorm)" },
        { hazard: "Anthracnose Pod Blight", description: "Continuous drizzle causes brownish lesions on pods and seed discoloration.", severity: "High", pmfby_stage: "Stage 2: Standing Crop" }
      ],
      "Harvest & Cut-and-Spread Drying": [
        { hazard: "Post-Harvest Wetting", description: "Cut harvest soaked in rain loses seed oil quality and triggers fungal rot.", severity: "Critical", pmfby_stage: "Stage 3: Post-Harvest Loss" }
      ]
    },
    "Rice / Paddy": {
      "Sowing / Germination": [
        { hazard: "Nursery Submergence", description: "Heavy monsoon floods submerge young nursery beds leading to silt suffocation.", severity: "High", pmfby_stage: "Stage 1: Prevented Sowing" }
      ],
      "Tillering / Vegetative": [
        { hazard: "Stem Borer & Leaf Folder", description: "Larval boring causes 'dead hearts' in tillers and white heads.", severity: "High", pmfby_stage: "Stage 2: Standing Crop" }
      ],
      "Flowering & Booting": [
        { hazard: "Bacterial Leaf Blight (BLB)", description: "High humidity and winds spread water-soaked lesions across entire leaves.", severity: "High", pmfby_stage: "Stage 2: Standing Crop" }
      ],
      "Grain Filling & Pod Maturity": [
        { hazard: "False Smut & Lodging", description: "Excess moisture transforms grain ovaries into velvety yellowish-green spore balls.", severity: "High", pmfby_stage: "Stage 2: Standing Crop" }
      ],
      "Harvest & Cut-and-Spread Drying": [
        { hazard: "Inundation of Harvested Sheaves", description: "Flash floods submerge cut paddy sheaves awaiting threshing.", severity: "Critical", pmfby_stage: "Stage 3: Post-Harvest Loss" }
      ]
    }
  };

  const defaultCropRisks = [
    { hazard: "Localized Extreme Weather (Hail / Cloudburst)", description: "Violent localized convective events causing physical plant trauma and leaf shredding.", severity: "Critical", pmfby_stage: "Stage 4: Localized Disaster" },
    { hazard: "Prolonged Seasonal Moisture Stress", description: "Soil drying beyond permanent wilting point restricting grain fill.", severity: "High", pmfby_stage: "Stage 2: Standing Crop" }
  ];

  const matchedRisks = (cropStageVulnerabilities[crop] && cropStageVulnerabilities[crop][stage]) 
    ? cropStageVulnerabilities[crop][stage] 
    : defaultCropRisks;

  // Preventive Agronomic Actions
  const preventiveActions = [
    {
      category: "Field Drainage & Soil Care",
      action: "Clear drainage channels and create exit furrows across field boundaries to prevent standing water accumulation.",
      timeline: rain > 30 ? "Immediate Priority (Within 6 Hours)" : "Preventive (Before Next Rain Cycle)"
    },
    {
      category: "Irrigation Scheduling",
      action: wind > 18 ? "Strictly withhold flood irrigation until wind speeds subside to prevent severe plant lodging." : "Apply light sprinkler or micro-drip irrigation during early morning hours to maintain root zone humidity.",
      timeline: "Next 24 to 48 Hours"
    },
    {
      category: "Canopy & Stress Mitigation Spray",
      action: temp > 30 ? "Foliar spray of 1% Potassium Nitrate (KNO3) or 0.2% Zinc Sulfate to boost cellular osmotic resistance against terminal heat." : "Prophylactic bio-fungicide spray (Trichoderma viride @ 5g/L or Neem oil 1500 ppm @ 3ml/L) to prevent fungal spore germination.",
      timeline: "During Calm Morning / Evening Hours"
    },
    {
      category: "PMFBY Insurance Readiness",
      action: "Keep PMFBY enrollment application ID and land Khasra details accessible. If localized calamity (hailstorm / inundation) strikes, submit loss intimation within 72 hours.",
      timeline: "Statutory 72-Hour Window Rule"
    }
  ];

  return {
    weather_summary: {
      temp_c: temp,
      rainfall_mm: rain,
      humidity_pct: hum,
      wind_kmh: wind,
      description: weather.description || "Seasonal Agricultural Weather",
      icon: weather.icon || "https://openweathermap.org/img/wn/02d@2x.png",
      source: weather.source || "IMD Agro-Climatic Climatological Normals"
    },
    risk_alert: {
      level: alertLevel,
      title: alertTitle,
      type: alertType,
      message: alertMessage,
      urgency: urgency
    },
    crop_stage_risks: matchedRisks,
    preventive_actions: preventiveActions,
    statutory_pmfby_coverage: {
      covered_perils: ["Hailstorm", "Inundation / Cloudburst", "Post-Harvest Rain (14 Days)", "Drought", "Pest Epidemic"],
      claim_window: "72 Hours from loss occurrence",
      helpline: "14447 (Toll-Free PMFBY Desk) / 1800-180-1551 (KCC)"
    }
  };
}

app.get("/api/risk/advisory", async (req, res) => {
  try {
    const city = req.query.city || "Bhopal";
    const crop = req.query.crop || "Wheat";
    const stage = req.query.stage || "Grain Filling & Pod Maturity";

    const weather = await weatherService.resolveWeather(city);
    const advisory = generateAgroRiskAdvisory(weather, crop, stage);

    res.json({
      success: true,
      city,
      crop,
      stage,
      ...advisory
    });
  } catch (err) {
    console.error("Risk advisory error:", err);
    res.status(500).json({ success: false, message: "Failed to generate risk advisory." });
  }
});

// BhoomiBandhu 2.0 Direct Route Bindings
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "login.html")));
app.get("/register", (req, res) => res.sendFile(path.join(__dirname, "register.html")));
app.get("/forgot-password", (req, res) => res.sendFile(path.join(__dirname, "forgot-password.html")));
app.get("/dashboard/farmer", (req, res) => res.sendFile(path.join(__dirname, "farmer-dashboard.html")));
app.get("/dashboard/provider", (req, res) => res.sendFile(path.join(__dirname, "provider-dashboard.html")));
app.get("/dashboard/admin", (req, res) => res.sendFile(path.join(__dirname, "admin-dashboard.html")));

// Support both /dashboard asset requests and direct HTML routing
app.use("/dashboard", express.static(__dirname));
app.use(express.static(__dirname)); // Serves HTML, CSS, images, etc.

// Initialize Gemini SDK (lazy — checked per-request so server still starts without key)
let ai = null;
function getAI() {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

// ── Comprehensive system instruction ────────────────────────────────
const SYSTEM_INSTRUCTION = `
You are **BhoomiBandhu AI** — a warm, empathetic, and highly knowledgeable agricultural advisor built for Indian farmers.

## Your Personality
- You speak like a helpful elder brother / Bhaiya from the village — respectful, encouraging, practical.
- Match the farmer's language: reply in Hindi, Hinglish, or English based on how they ask.
- Use emojis sparingly to keep things friendly (🌾 🪲 💧 ✅ ❌ 📋).
- Keep answers concise (under 250 words) unless the farmer asks for detailed explanation.
- Always end with a helpful follow-up question or suggestion.

## Your Expertise Areas
1. **Crops & Farming** — crop selection by soil/season/region, sowing & harvesting calendars, yield improvement, organic farming, intercropping.
2. **Soil Management** — soil types (loamy, clay, sandy, red, black), soil health cards, composting, pH management.
3. **Pest & Disease Control** — identification, organic & chemical remedies, IPM (Integrated Pest Management).
4. **Irrigation & Water** — drip, sprinkler, flood irrigation, rainwater harvesting, water scheduling.
5. **Fertilisers** — urea, DAP, NPK, organic alternatives, application timing.
6. **Weather Adaptation** — drought management, flood preparedness, frost protection.
7. **Government Schemes** — deep knowledge of:
   - **PM-KISAN**: ₹6000/year in 3 instalments, eligibility, registration at pmkisan.gov.in
   - **PMFBY** (Pradhan Mantri Fasal Bima Yojana): crop insurance, premium rates, claim process, enrollment deadlines
   - **KCC** (Kisan Credit Card): loan up to ₹3 lakh at 4% interest, application process
   - **eNAM**: online mandi platform, how to register, selling process
   - **PKVY** (Paramparagat Krishi Vikas Yojana): organic farming clusters, ₹50,000/ha support
   - **Soil Health Card Scheme**, **PM Krishi Sinchayee Yojana**, **NABARD** schemes
8. **Financial Literacy** — farm loans, crop insurance vs general insurance, MSP (Minimum Support Price), mandi prices.
9. **Mental Health** — farmer stress, debt anxiety, where to seek help, encouraging words.
10. **Post-Harvest** — storage (cold storage, warehousing), grading, transportation, market linkage.

## BhoomiBandhu Platform Awareness
You know about these pages on the BhoomiBandhu platform and should guide farmers to use them:
- **Insurance Page** (insurance.html) — PMFBY enrollment, risk awareness, claim filing, status tracking
- **Claim Filing** (claim-filing.html) — step-by-step claim filing with document guidance
- **PMFBY Enrollment** (pmfby-enrollment.html) — enroll in crop insurance scheme
- **Schemes Page** (schemes.html) — browse all government schemes
- **Financial Page** (financial.html) — financial tools and loan information
- **Crop Suitability Tool** (ai-crop-predictor.html) — rule-based multi-factor crop suitability assessment & ICAR yield estimation
- **ML Crop Advisor** (ml-crop-advisor.html) — ML-based crop recommendation
- **Storage** (storage.html) — cold storage and warehouse information
- **Mental Health** (mental-health.html) — mental wellness resources for farmers
- **Status Tracking** (status-tracking.html) — track insurance claim status

When relevant, suggest the farmer visit these pages. Format links as: **[Page Name](page-url.html)**

## Claim Filing Guidance (Important!)
When a farmer asks about filing a claim, guide them step-by-step:
1. **Crop loss intimation** — report within 72 hours to insurance company/bank/agriculture officer
2. **Document collection** — land records (khasra/khatauni), sowing certificate, bank passbook, Aadhaar, photos of crop damage
3. **Online submission** — through PMFBY portal or CSC centre
4. **Follow-up** — track via status-tracking.html or toll-free number 1800-180-1551

Common mistakes to warn about:
- Late submission (❌ deadline miss = claim rejected)
- Incorrect land details
- Missing damage photos
- Not intimating the bank branch

## Response Format
- Use **bold** for important terms, scheme names, amounts
- Use bullet points for lists
- Use numbered steps for processes
- Keep paragraphs short
- If the farmer's question is unclear, ask a clarifying question
- If the question is outside agriculture/farming, politely redirect to farming topics
`;

// ── Chatbot API Endpoint ────────────────────────────────────────────
app.post("/api/gemini", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured on the server. Create a .env file with your key from https://aistudio.google.com/app/apikey"
      });
    }

    const client = getAI();
    if (!client) {
      return res.status(500).json({ error: "Failed to initialise Gemini client. Check your API key." });
    }

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        maxOutputTokens: 800,
        temperature: 0.7,
      },
    });

    const reply = response.text || "Main abhi javab nahi de pa raha hu. Kripya thodi der baad prayas karein. 🙏";
    res.json({ reply });

  } catch (error) {
    console.error("Gemini API error:", error?.message || error);

    // Give a user-friendly error message based on the error type
    let userMsg = "Gemini AI se response nahi aa paya. Server logs check karein.";
    if (error?.message?.includes("API_KEY_INVALID") || error?.message?.includes("401")) {
      userMsg = "GEMINI_API_KEY invalid hai. Naya key generate karein: https://aistudio.google.com/app/apikey";
    } else if (error?.message?.includes("RATE_LIMIT") || error?.message?.includes("429")) {
      userMsg = "Rate limit hit ho gaya hai. Thodi der baad try karein (1-2 minute).";
    } else if (error?.message?.includes("SAFETY")) {
      userMsg = "Safety filter triggered. Kripya apna sawaal rephrase karein.";
    }

    res.status(500).json({ error: userMsg });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🌾 BhoomiBandhu server is running at http://localhost:${PORT}`);
  });
}

module.exports = app;