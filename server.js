require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;
const path = require("path");

// Auth Controller
const { router: authRouter } = require("./auth");

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRouter);

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
- **AI Crop Predictor** (ai-crop-predictor.html) — predict best crops based on conditions
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