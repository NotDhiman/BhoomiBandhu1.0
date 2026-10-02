/* ============================================================
   BhoomiBandhu – Express Backend
   Routes:
     GET  /api/weather?city=Delhi  → OpenWeatherMap proxy
     POST /api/gemini              → Groq AI proxy (llama-3.3-70b)
     GET  /api/health              → server health check
   ============================================================ */

require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const fetch   = require("node-fetch");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("."));

const OWM_KEY  = process.env.OPENWEATHER_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;

/* ── Health check ─────────────────────────────────────────── */
app.get("/api/health", (req, res) => {
  res.json({
    status : "ok",
    server : "BhoomiBandhu Backend",
    time   : new Date().toISOString(),
    keys   : {
      openweather : OWM_KEY  ? "✅ set" : "❌ missing",
      groq        : GROQ_KEY ? "✅ set" : "❌ missing",
    }
  });
});

/* ── OpenWeatherMap proxy ──────────────────────────────────── */
app.get("/api/weather", async (req, res) => {
  const city = (req.query.city || "").trim();
  if (!city) return res.status(400).json({ error: "city param required" });
  if (!OWM_KEY) return res.status(503).json({ error: "OPENWEATHER_API_KEY missing in .env" });

  try {
    const url  = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OWM_KEY}&units=metric`;
    const wRes = await fetch(url);
    const data = await wRes.json();

    if (data.cod !== 200) return res.status(404).json({ error: data.message || "City not found" });

    const rainfallMm = (data.rain?.["1h"] ?? data.rain?.["3h"] ?? 0) * 30;

    res.json({
      city        : data.name,
      country     : data.sys.country,
      temp_c      : Math.round(data.main.temp),
      feels_like_c: Math.round(data.main.feels_like),
      humidity_pct: data.main.humidity,
      rainfall_mm : Math.round(rainfallMm) || estimateRainfall(data.main.humidity),
      description : data.weather[0].description,
      wind_kmh    : Math.round((data.wind?.speed || 0) * 3.6),
      icon        : `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
    });
  } catch (err) {
    console.error("[weather]", err.message);
    res.status(500).json({ error: "Failed to fetch weather" });
  }
});

function estimateRainfall(humidity) {
  if (humidity >= 85) return 350;
  if (humidity >= 70) return 230;
  if (humidity >= 55) return 150;
  if (humidity >= 40) return 90;
  return 50;
}

/* ── Groq AI proxy ────────────────────────────────────────── */
app.post("/api/gemini", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "prompt (string) required" });
  }
  if (!GROQ_KEY) {
    return res.status(503).json({ error: "GROQ_API_KEY missing in .env — get free key at console.groq.com/keys" });
  }

  try {
    const gRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method  : "POST",
      headers : {
        "Content-Type" : "application/json",
        "Authorization": `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model      : "llama-3.3-70b-versatile",
        messages   : [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: prompt }
        ],
        temperature      : 0.7,
        max_tokens       : 600,
        top_p            : 0.9,
      })
    });

    const data = await gRes.json();

    if (!gRes.ok) {
      const msg = data?.error?.message || "Groq API error";
      return res.status(gRes.status).json({ error: msg });
    }

    const reply = data?.choices?.[0]?.message?.content || "No response.";
    res.json({ reply });

  } catch (err) {
    console.error("[groq]", err.message);
    res.status(500).json({ error: "Failed to reach Groq API" });
  }
});

const SYSTEM_PROMPT = `You are BhoomiBandhu AI — a knowledgeable and friendly agricultural advisor for Indian farmers.
Your role:
- Give practical, actionable crop advice in simple language (mix of Hindi/English is fine if the user writes in Hinglish).
- Focus on: crop selection, sowing time, irrigation, fertiliser, pest/disease management, government schemes.
- Keep answers concise (under 200 words) unless the user asks for detail.
- Always end with one practical tip the farmer can act on today.
- Do NOT discuss unrelated topics.`;

/* ── Start ────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n  ✅  BhoomiBandhu backend running`);
  console.log(`  🌐  http://localhost:${PORT}`);
  console.log(`  🩺  Health: http://localhost:${PORT}/api/health\n`);
});
