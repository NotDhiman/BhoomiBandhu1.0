// Migrated from the original ml-crop-advisor.html page script. Runs after React mounts the page.
export function initMlCropAdvisor() {
  (() => {

/* ============================================================
   CONFIG — backend base URL
   When running via Node server: http://localhost:3000
   Fallback: direct (keys won't work without server)
   ============================================================ */
const API_BASE = window.location.port === "3000"
  ? ""           // same origin as server
  : "http://localhost:3000";

/* ============================================================
   TRAINING DATASET (120 samples)
   [rainfall_mm, temp_c, soil, season, irrigation, crop, yield, risk]
   ============================================================ */
const TRAINING_DATA = [
  [200,18,"loamy","rabi","irrigated","Wheat 🌾","High","Low"],
  [180,17,"loamy","rabi","irrigated","Wheat 🌾","High","Low"],
  [220,20,"loamy","rabi","irrigated","Wheat 🌾","High","Low"],
  [160,15,"loamy","rabi","partial","Wheat 🌾","Medium","Low"],
  [250,22,"loamy","rabi","irrigated","Wheat 🌾","High","Low"],
  [170,16,"loamy","rabi","rainfed","Wheat 🌾","Medium","Medium"],
  [190,19,"loamy","rabi","irrigated","Wheat 🌾","High","Low"],
  [210,21,"loamy","rabi","irrigated","Wheat 🌾","High","Low"],
  [155,14,"loamy","rabi","rainfed","Wheat 🌾","Low","Medium"],
  [235,23,"loamy","rabi","irrigated","Wheat 🌾","High","Low"],
  [200,18,"red","rabi","irrigated","Wheat 🌾","Medium","Low"],
  [175,16,"loamy","rabi","partial","Wheat 🌾","Medium","Low"],
  [260,24,"loamy","rabi","irrigated","Wheat 🌾","High","Low"],
  [145,13,"loamy","rabi","rainfed","Wheat 🌾","Low","High"],
  [300,28,"clay","kharif","rainfed","Rice 🌾💧","High","Low"],
  [350,30,"clay","kharif","rainfed","Rice 🌾💧","High","Low"],
  [280,27,"loamy","kharif","irrigated","Rice 🌾💧","High","Low"],
  [320,29,"clay","kharif","rainfed","Rice 🌾💧","High","Low"],
  [270,26,"clay","kharif","partial","Rice 🌾💧","Medium","Low"],
  [380,32,"clay","kharif","rainfed","Rice 🌾💧","High","Low"],
  [260,25,"loamy","kharif","irrigated","Rice 🌾💧","Medium","Low"],
  [340,31,"clay","kharif","rainfed","Rice 🌾💧","High","Low"],
  [250,24,"loamy","kharif","irrigated","Rice 🌾💧","Medium","Medium"],
  [370,33,"clay","kharif","rainfed","Rice 🌾💧","High","Low"],
  [290,28,"black","kharif","irrigated","Rice 🌾💧","High","Low"],
  [310,30,"loamy","kharif","irrigated","Rice 🌾💧","High","Low"],
  [400,34,"clay","kharif","rainfed","Rice 🌾💧","High","Low"],
  [240,23,"clay","kharif","partial","Rice 🌾💧","Low","Medium"],
  [240,24,"loamy","kharif","partial","Maize 🌽","High","Medium"],
  [260,26,"loamy","kharif","irrigated","Maize 🌽","High","Low"],
  [220,22,"loamy","kharif","partial","Maize 🌽","Medium","Medium"],
  [280,27,"loamy","kharif","irrigated","Maize 🌽","High","Low"],
  [200,20,"red","kharif","partial","Maize 🌽","Medium","Medium"],
  [300,29,"loamy","kharif","irrigated","Maize 🌽","High","Low"],
  [210,21,"loamy","zaid","irrigated","Maize 🌽","Medium","Low"],
  [250,25,"red","kharif","rainfed","Maize 🌽","Medium","Medium"],
  [270,28,"loamy","kharif","partial","Maize 🌽","High","Medium"],
  [190,19,"loamy","zaid","irrigated","Maize 🌽","Low","Medium"],
  [310,30,"loamy","kharif","irrigated","Maize 🌽","High","Low"],
  [230,23,"red","kharif","partial","Maize 🌽","Medium","Medium"],
  [285,27,"loamy","kharif","irrigated","Maize 🌽","High","Low"],
  [220,30,"black","kharif","rainfed","Cotton 🌿","High","Medium"],
  [250,32,"black","kharif","rainfed","Cotton 🌿","High","Low"],
  [200,28,"clay","kharif","rainfed","Cotton 🌿","Medium","Medium"],
  [270,34,"black","kharif","rainfed","Cotton 🌿","High","Low"],
  [230,31,"black","kharif","partial","Cotton 🌿","High","Medium"],
  [210,29,"clay","kharif","rainfed","Cotton 🌿","Medium","Medium"],
  [260,33,"black","kharif","rainfed","Cotton 🌿","High","Low"],
  [180,27,"clay","kharif","partial","Cotton 🌿","Low","High"],
  [290,35,"black","kharif","rainfed","Cotton 🌿","High","Low"],
  [240,32,"black","kharif","partial","Cotton 🌿","High","Medium"],
  [195,28,"red","kharif","rainfed","Cotton 🌿","Low","High"],
  [275,34,"black","kharif","rainfed","Cotton 🌿","High","Low"],
  [255,31,"clay","kharif","partial","Cotton 🌿","Medium","Medium"],
  [350,28,"loamy","kharif","irrigated","Sugarcane 🎋","High","Medium"],
  [400,30,"loamy","kharif","irrigated","Sugarcane 🎋","High","Low"],
  [320,26,"loamy","kharif","irrigated","Sugarcane 🎋","High","Medium"],
  [450,32,"black","kharif","irrigated","Sugarcane 🎋","High","Low"],
  [380,29,"loamy","kharif","irrigated","Sugarcane 🎋","High","Low"],
  [300,25,"loamy","kharif","partial","Sugarcane 🎋","Medium","Medium"],
  [420,31,"black","kharif","irrigated","Sugarcane 🎋","High","Low"],
  [340,27,"loamy","kharif","irrigated","Sugarcane 🎋","High","Medium"],
  [480,33,"black","kharif","irrigated","Sugarcane 🎋","High","Low"],
  [360,28,"clay","kharif","irrigated","Sugarcane 🎋","Medium","Medium"],
  [500,34,"loamy","kharif","irrigated","Sugarcane 🎋","High","Low"],
  [310,26,"black","kharif","partial","Sugarcane 🎋","Medium","Medium"],
  [440,30,"loamy","kharif","irrigated","Sugarcane 🎋","High","Low"],
  [120,30,"sandy","kharif","rainfed","Millets 🌾","Medium","Low"],
  [150,32,"sandy","kharif","rainfed","Millets 🌾","Medium","Low"],
  [100,28,"sandy","kharif","rainfed","Millets 🌾","Low","Medium"],
  [180,34,"sandy","kharif","rainfed","Millets 🌾","High","Low"],
  [130,31,"red","kharif","rainfed","Millets 🌾","Medium","Low"],
  [110,29,"sandy","kharif","rainfed","Millets 🌾","Low","Low"],
  [160,33,"sandy","kharif","rainfed","Millets 🌾","Medium","Low"],
  [140,30,"red","kharif","rainfed","Millets 🌾","Medium","Low"],
  [200,35,"sandy","kharif","rainfed","Millets 🌾","High","Low"],
  [125,31,"sandy","kharif","rainfed","Millets 🌾","Medium","Low"],
  [170,32,"red","kharif","rainfed","Millets 🌾","Medium","Low"],
  [95, 28,"sandy","kharif","rainfed","Millets 🌾","Low","Medium"],
  [185,34,"sandy","kharif","partial","Millets 🌾","High","Low"],
  [200,28,"sandy","kharif","rainfed","Groundnut 🥜","Medium","Medium"],
  [180,26,"sandy","kharif","rainfed","Groundnut 🥜","Medium","Medium"],
  [220,30,"sandy","kharif","partial","Groundnut 🥜","High","Low"],
  [170,25,"red","kharif","rainfed","Groundnut 🥜","Low","Medium"],
  [240,32,"sandy","kharif","irrigated","Groundnut 🥜","High","Low"],
  [190,27,"sandy","kharif","rainfed","Groundnut 🥜","Medium","Medium"],
  [210,29,"red","kharif","partial","Groundnut 🥜","Medium","Low"],
  [160,24,"sandy","kharif","rainfed","Groundnut 🥜","Low","Medium"],
  [250,33,"sandy","kharif","irrigated","Groundnut 🥜","High","Low"],
  [205,28,"sandy","kharif","rainfed","Groundnut 🥜","Medium","Medium"],
  [230,31,"red","kharif","partial","Groundnut 🥜","Medium","Low"],
  [155,23,"sandy","kharif","rainfed","Groundnut 🥜","Low","High"],
  [270,34,"sandy","kharif","irrigated","Groundnut 🥜","High","Low"],
  [150,16,"loamy","rabi","rainfed","Barley 🌾","Medium","Low"],
  [120,14,"loamy","rabi","rainfed","Barley 🌾","Low","Medium"],
  [180,18,"loamy","rabi","irrigated","Barley 🌾","High","Low"],
  [140,15,"loamy","rabi","partial","Barley 🌾","Medium","Low"],
  [200,20,"loamy","rabi","irrigated","Barley 🌾","High","Low"],
  [130,13,"red","rabi","rainfed","Barley 🌾","Low","Medium"],
  [160,17,"loamy","rabi","partial","Barley 🌾","Medium","Low"],
  [110,12,"loamy","rabi","rainfed","Barley 🌾","Low","Medium"],
  [190,19,"loamy","rabi","irrigated","Barley 🌾","High","Low"],
  [145,15,"sandy","rabi","rainfed","Barley 🌾","Low","Medium"],
  [170,18,"loamy","rabi","partial","Barley 🌾","Medium","Low"],
  [210,21,"loamy","rabi","irrigated","Barley 🌾","High","Low"],
  [135,14,"loamy","rabi","rainfed","Barley 🌾","Low","Medium"],
  [150,24,"sandy","kharif","rainfed","Pulses 🫘","Medium","Low"],
  [130,22,"loamy","rabi","rainfed","Pulses 🫘","Medium","Low"],
  [170,26,"sandy","kharif","rainfed","Pulses 🫘","Medium","Low"],
  [120,21,"loamy","rabi","rainfed","Pulses 🫘","Low","Low"],
  [190,28,"red","kharif","rainfed","Pulses 🫘","Medium","Low"],
  [140,23,"sandy","kharif","rainfed","Pulses 🫘","Medium","Low"],
  [160,25,"loamy","rabi","partial","Pulses 🫘","Medium","Low"],
  [110,20,"sandy","rabi","rainfed","Pulses 🫘","Low","Medium"],
  [180,27,"red","kharif","rainfed","Pulses 🫘","Medium","Low"],
  [155,24,"loamy","rabi","partial","Pulses 🫘","Medium","Low"],
  [145,22,"sandy","kharif","rainfed","Pulses 🫘","Medium","Low"],
  [200,29,"red","kharif","partial","Pulses 🫘","High","Low"],
];

/* ── Feature encoding ───────────────────── */
const SOIL_ENC   = {loamy:0,clay:1,sandy:2,red:3,black:4};
const SEASON_ENC = {kharif:0,rabi:1,zaid:2};
const IRR_ENC    = {irrigated:0,rainfed:1,partial:2};
const FEAT_MIN   = [50,5,0,0,0];
const FEAT_MAX   = [600,45,4,2,2];

function encode(r){ return [r[0],r[1],SOIL_ENC[r[2]]??0,SEASON_ENC[r[3]]??0,IRR_ENC[r[4]]??0]; }
function normalise(v){ return v.map((x,i)=>(x-FEAT_MIN[i])/(FEAT_MAX[i]-FEAT_MIN[i])); }
function euclidean(a,b){ return Math.sqrt(a.reduce((s,v,i)=>s+(v-b[i])**2,0)); }
function majority(arr){ const f={}; arr.forEach(v=>f[v]=(f[v]||0)+1); return Object.entries(f).sort((a,b)=>b[1]-a[1])[0][0]; }

/* ── kNN ────────────────────────────────── */
function knnPredict(rainfall,temp,soil,season,irr,K=5){
  const q = normalise(encode([rainfall,temp,soil,season,irr]));
  const dists = TRAINING_DATA.map((r,i)=>({dist:euclidean(q,normalise(encode(r))),i}));
  dists.sort((a,b)=>a.dist-b.dist);
  const topK = dists.slice(0,K);
  const votes={};
  topK.forEach(({i})=>{ const c=TRAINING_DATA[i][5]; votes[c]=(votes[c]||0)+1; });
  const winner   = Object.entries(votes).sort((a,b)=>b[1]-a[1])[0][0];
  const confidence = (votes[winner]/K)*100;
  const wRows    = topK.map(({i})=>TRAINING_DATA[i]).filter(r=>r[5]===winner);
  return {
    crop:winner, confidence,
    yieldLevel:majority(wRows.map(r=>r[6])),
    riskLevel :majority(wRows.map(r=>r[7])),
    neighbours:topK.map(({dist,i})=>({crop:TRAINING_DATA[i][5],dist:dist.toFixed(3),yield:TRAINING_DATA[i][6],risk:TRAINING_DATA[i][7]}))
  };
}

/* ── Crop meta ──────────────────────────── */
const CROP_META = {
  "Wheat 🌾"     :{emoji:"🌾",advice:"Apply DAP at sowing. Irrigate at CRI and flowering. Watch for yellow rust."},
  "Rice 🌾💧"    :{emoji:"🌾",advice:"Transplant at 25-30 days. Keep 5cm standing water. Apply urea in 3 splits."},
  "Maize 🌽"     :{emoji:"🌽",advice:"Use hybrid seeds. Apply zinc sulphate as basal dose. Needs well-drained soil."},
  "Cotton 🌿"    :{emoji:"🌿",advice:"Sow 60×30cm spacing. Manage bollworm with Bt spray. Avoid waterlogging at boll stage."},
  "Sugarcane 🎋" :{emoji:"🎋",advice:"Harvest at 10-12 months. Apply 250kg N/ha in splits. Drip irrigation saves 40% water."},
  "Millets 🌾"   :{emoji:"🌾",advice:"Drought-tolerant. No heavy fertiliser needed. Weed at 2-3 week stage."},
  "Groundnut 🥜" :{emoji:"🥜",advice:"Apply gypsum at pegging stage. 3-week dry spell at harvest improves quality."},
  "Barley 🌾"    :{emoji:"🌾",advice:"Sow early November. Low water requirement. Good wheat alternative in drier zones."},
  "Pulses 🫘"    :{emoji:"🫘",advice:"Inoculate with Rhizobium. Fixes nitrogen — improves next crop soil. Short duration."},
};

/* ══════════════════════════════════════════
   WEATHER FETCH
══════════════════════════════════════════ */
/* Manual fill fallback — no API key needed */
function fillManual() {
  const city = document.getElementById("cityInput").value.trim() || "your city";
  // Typical Indian averages by rough season guess
  const month = new Date().getMonth(); // 0=Jan
  let rain = 150, temp = 28;
  if (month >= 5 && month <= 9)  { rain = 280; temp = 30; } // Kharif (Jun-Oct)
  if (month >= 10 || month <= 1) { rain = 60;  temp = 18; } // Rabi   (Nov-Feb)
  if (month >= 2 && month <= 4)  { rain = 40;  temp = 32; } // Zaid   (Mar-May)

  const rainEl = document.getElementById("ml_rainfall");
  const tempEl = document.getElementById("ml_temp");
  rainEl.value = rain;
  tempEl.value = temp;
  rainEl.classList.add("auto-filled");
  tempEl.classList.add("auto-filled");
  setTimeout(()=>{ rainEl.classList.remove("auto-filled"); tempEl.classList.remove("auto-filled"); }, 2000);

  document.getElementById("weatherError").style.display = "none";
  document.getElementById("weatherStrip").style.display = "none";

  alert(`✏️ Seasonal average values filled!\nRainfall: ${rain}mm | Temp: ${temp}°C\n\nYou can adjust these manually before running prediction.`);
}

async function fetchWeather(){
  const city = document.getElementById("cityInput").value.trim();
  if(!city){ alert("Please enter a city name."); return; }

  const btn = document.getElementById("weatherBtn");
  const errEl = document.getElementById("weatherError");
  btn.innerHTML = '<span class="spinner"></span> Fetching…';
  btn.disabled  = true;
  errEl.style.display = "none";
  document.getElementById("weatherStrip").style.display = "none";

  try {
    const res  = await fetch(`${API_BASE}/api/weather?city=${encodeURIComponent(city)}`);
    const data = await res.json();

    if(!res.ok) throw new Error(data.error || "Weather fetch failed");

    /* Show weather strip */
    document.getElementById("wxIcon").src      = data.icon;
    document.getElementById("wxTemp").textContent = `${data.temp_c}°C`;
    document.getElementById("wxDesc").textContent = data.description;
    document.getElementById("wxCity").textContent = `${data.city}, ${data.country}`;
    document.getElementById("wxHumidity").textContent = `💧 Humidity: ${data.humidity_pct}%`;
    document.getElementById("wxRain").textContent     = `🌧 Rain est: ${data.rainfall_mm} mm`;
    document.getElementById("wxWind").textContent     = `💨 Wind: ${data.wind_kmh} km/h`;
    document.getElementById("weatherStrip").style.display = "flex";

    /* Auto-fill kNN inputs */
    const rainEl = document.getElementById("ml_rainfall");
    const tempEl = document.getElementById("ml_temp");
    rainEl.value = data.rainfall_mm;
    tempEl.value = data.temp_c;
    rainEl.classList.add("auto-filled");
    tempEl.classList.add("auto-filled");
    setTimeout(()=>{ rainEl.classList.remove("auto-filled"); tempEl.classList.remove("auto-filled"); }, 2000);

  } catch(err){
    errEl.textContent   = "⚠️ " + err.message + " — Make sure the Node server is running (npm start) and API key is set in .env";
    errEl.style.display = "block";
  } finally {
    btn.innerHTML = "🌦 Fetch Weather";
    btn.disabled  = false;
  }
}

/* ══════════════════════════════════════════
   KNN PREDICTION
══════════════════════════════════════════ */
function runKNN(){
  const rainfall = Number(document.getElementById("ml_rainfall").value);
  const temp     = Number(document.getElementById("ml_temp").value);
  const soil     = document.getElementById("ml_soil").value;
  const season   = document.getElementById("ml_season").value;
  const irr      = document.getElementById("ml_irr").value;

  if(!rainfall||!temp){ alert("Enter Rainfall and Temperature first."); return; }

  /* Training animation */
  const overlay = document.getElementById("trainingOverlay");
  const fill    = document.getElementById("trainBarFill");
  const pctEl   = document.getElementById("trainPct");
  overlay.classList.add("active");
  let pct=0;
  const timer = setInterval(()=>{
    pct = Math.min(pct + Math.random()*14+4, 100);
    fill.style.width  = pct+"%";
    pctEl.textContent = Math.floor(pct)+"%";
    if(pct>=100){ clearInterval(timer); setTimeout(()=>{ overlay.classList.remove("active"); showKNNResult(rainfall,temp,soil,season,irr); },350); }
  },80);
}

function showKNNResult(rainfall,temp,soil,season,irr){
  const res  = knnPredict(rainfall,temp,soil,season,irr);
  const meta = CROP_META[res.crop] || {emoji:"🌾",advice:"Follow standard agronomic practices."};

  document.getElementById("resCropEmoji").textContent = meta.emoji;
  document.getElementById("resCropName").textContent  = res.crop;
  document.getElementById("resSubtitle").textContent  = `kNN voted ${Math.round(res.confidence)}% confidence · k=5`;

  const yc = {High:"pill-green",Medium:"pill-orange",Low:"pill-red"};
  const rc  = {Low:"pill-green",Medium:"pill-orange",High:"pill-red"};
  const sLabel = {kharif:"Kharif ☀️",rabi:"Rabi ❄️",zaid:"Zaid 🌸"};
  const iLabel = {irrigated:"Irrigated 💧",rainfed:"Rain-fed 🌧",partial:"Partial 💦"};
  document.getElementById("resPills").innerHTML =
    `<span class="pill ${yc[res.yieldLevel]||'pill-blue'}">📈 Yield: ${res.yieldLevel}</span>`+
    `<span class="pill ${rc[res.riskLevel] ||'pill-blue'}">⚠️ Risk: ${res.riskLevel}</span>`+
    `<span class="pill pill-blue">🌱 ${sLabel[document.getElementById("ml_season").value]}</span>`+
    `<span class="pill pill-purple">${iLabel[document.getElementById("ml_irr").value]}</span>`;

  const confPct = Math.round(res.confidence);
  document.getElementById("confPct").textContent = confPct+"%";
  setTimeout(()=>{ document.getElementById("confFill").style.width = confPct+"%"; },100);

  document.getElementById("knnNeighbours").innerHTML = res.neighbours.map(n=>
    `<div class="knn-nb"><div class="nb-crop">${n.crop}</div><div class="nb-dist">dist: ${n.dist}</div><div class="nb-dist">${n.yield} · ${n.risk}</div></div>`
  ).join("");

  document.getElementById("resAdvice").innerHTML = `<strong>🧑‍🌾 Tip:</strong> ${meta.advice}`;

  const wrap = document.getElementById("mlResultWrap");
  wrap.classList.add("show");
  wrap.scrollIntoView({behavior:"smooth",block:"nearest"});

  /* Auto-populate Gemini question with prediction context */
  document.getElementById("geminiQuestion").value =
    `Mera khet ${document.getElementById("ml_soil").value} soil ke saath hai, rainfall ${document.getElementById("ml_rainfall").value}mm aur temperature ${document.getElementById("ml_temp").value}°C hai. kNN model ne ${res.crop} suggest kiya hai. Mujhe is crop ke liye detailed farming advice chahiye.`;
  saveMLPrediction(res, rainfall, temp, soil, meta.advice);
}

async function saveMLPrediction(res, rainfall, temperature, soil, advice) {
  const status = document.getElementById("mlSaveStatus");
  status.textContent = "Saving prediction to database...";
  try {
    const response = await fetch(`${API_BASE}/api/crop-predictions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rainfall_mm: rainfall, temperature_celsius: temperature, soil_type: soil,
        recommended_crop: res.crop, yield_level: res.yieldLevel, risk_level: res.riskLevel,
        confidence_percent: Math.round(res.confidence), ai_advice: advice
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not save prediction");
    status.textContent = `Prediction #${data.prediction_id} saved to the database.`;
  } catch (error) {
    status.textContent = `${error.message}. The result is displayed but was not saved.`;
  }
}

/* ══════════════════════════════════════════
   GEMINI AI
══════════════════════════════════════════ */
function setGeminiPrompt(el){ document.getElementById("geminiQuestion").value = el.textContent.trim(); }

async function askGemini(){
  const prompt = document.getElementById("geminiQuestion").value.trim();
  if(!prompt){ alert("Please type a question."); return; }

  const btn    = document.getElementById("geminiBtn");
  const resEl  = document.getElementById("geminiResponse");
  const errEl  = document.getElementById("geminiErr");

  btn.disabled    = true;
  btn.textContent = "⏳ Thinking…";
  resEl.className = "gemini-response show typing";
  resEl.textContent = "";
  errEl.className = "gemini-err";

  try {
    const res  = await fetch(`${API_BASE}/api/gemini`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({prompt})
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || "AI API error");

    /* Typewriter effect */
    resEl.className = "gemini-response show typing";
    resEl.textContent = "";
    const text = data.reply;
    let i=0;
    const typer = setInterval(()=>{
      resEl.textContent += text[i++];
      if(i>=text.length){ clearInterval(typer); resEl.classList.remove("typing"); }
    },18);

  } catch(err){
    resEl.className = "gemini-response";
    errEl.textContent = "⚠️ " + err.message + " — Make sure Node server is running and GROQ_API_KEY is in .env";
    errEl.className   = "gemini-err show";
  } finally {
    btn.disabled    = false;
    btn.textContent = "✨ Ask AI";
  }
}

/* ══════════════════════════════════════════
   SEASON TABS
══════════════════════════════════════════ */
function switchSeason(id,btn){
  document.querySelectorAll(".season-panel").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".season-tab").forEach(b=>b.classList.remove("active"));
  document.getElementById("sp-"+id).classList.add("active");
  btn.classList.add("active");
}

/* ══════════════════════════════════════════
   SOIL HEALTH
══════════════════════════════════════════ */
const SOIL_PROFILES = {
  loamy:  {"Nitrogen (N)":{v:72,u:"72 kg/ha"},"Phosphorus (P)":{v:65,u:"65 kg/ha"},"Potassium (K)":{v:80,u:"80 kg/ha"},"Organic Matter":{v:68,u:"High"},"pH Level":{v:65,u:"6.5"},"Water Retention":{v:75,u:"75%"}},
  clay:   {"Nitrogen (N)":{v:60,u:"60 kg/ha"},"Phosphorus (P)":{v:55,u:"55 kg/ha"},"Potassium (K)":{v:85,u:"85 kg/ha"},"Organic Matter":{v:70,u:"High"},"pH Level":{v:55,u:"6.2"},"Water Retention":{v:90,u:"90%"}},
  sandy:  {"Nitrogen (N)":{v:35,u:"35 kg/ha"},"Phosphorus (P)":{v:30,u:"30 kg/ha"},"Potassium (K)":{v:40,u:"40 kg/ha"},"Organic Matter":{v:25,u:"Low"},"pH Level":{v:70,u:"6.8"},"Water Retention":{v:20,u:"20%"}},
  red:    {"Nitrogen (N)":{v:40,u:"40 kg/ha"},"Phosphorus (P)":{v:35,u:"35 kg/ha"},"Potassium (K)":{v:45,u:"45 kg/ha"},"Organic Matter":{v:30,u:"Low"},"pH Level":{v:60,u:"6.0"},"Water Retention":{v:45,u:"45%"}},
  black:  {"Nitrogen (N)":{v:55,u:"55 kg/ha"},"Phosphorus (P)":{v:48,u:"48 kg/ha"},"Potassium (K)":{v:90,u:"90 kg/ha"},"Organic Matter":{v:60,u:"Medium"},"pH Level":{v:45,u:"7.8"},"Water Retention":{v:85,u:"85%"}},
};

function updateSoilHealth(){
  const soil = document.getElementById("soilAnalyzer").value;
  document.getElementById("soilMeter").innerHTML = Object.entries(SOIL_PROFILES[soil]).map(([n,d])=>
    `<div class="soil-param"><div class="sp-label">${n}</div><div class="sp-val">${d.u}</div><div class="sp-bar"><div class="sp-bar-fill" style="width:${d.v}%"></div></div></div>`
  ).join("");
}
updateSoilHealth();

    if (typeof encode === "function") window.encode = encode;
    if (typeof normalise === "function") window.normalise = normalise;
    if (typeof euclidean === "function") window.euclidean = euclidean;
    if (typeof majority === "function") window.majority = majority;
    if (typeof knnPredict === "function") window.knnPredict = knnPredict;
    if (typeof fillManual === "function") window.fillManual = fillManual;
    if (typeof fetchWeather === "function") window.fetchWeather = fetchWeather;
    if (typeof runKNN === "function") window.runKNN = runKNN;
    if (typeof showKNNResult === "function") window.showKNNResult = showKNNResult;
    if (typeof saveMLPrediction === "function") window.saveMLPrediction = saveMLPrediction;
    if (typeof setGeminiPrompt === "function") window.setGeminiPrompt = setGeminiPrompt;
    if (typeof askGemini === "function") window.askGemini = askGemini;
    if (typeof switchSeason === "function") window.switchSeason = switchSeason;
    if (typeof updateSoilHealth === "function") window.updateSoilHealth = updateSoilHealth;
  })();
}
