/**
 * BhoomiBandhu 2.0 - Weather Service
 * Multi-tier real weather provider:
 * 1. OpenWeatherMap (if OPENWEATHER_API_KEY is configured and valid)
 * 2. Open-Meteo Free Public Weather API (zero-API-key fallback, reliable for Indian coordinates)
 * 3. IMD (India Meteorological Department) Agro-Climatic District Normals (offline resilience)
 */

// IMD 1981-2010 Climatological Regional Agro-Climatic Normals for Indian Agricultural Districts
const IMD_REGIONAL_NORMALS = {
  "delhi": {
    name: "Delhi", state: "Delhi", zone: "Northern Alluvial Plains",
    lat: 28.6139, lon: 77.2090, soilDefault: "loamy",
    monthly: [
      { temp: 14.5, rain: 19, hum: 68 }, // Jan
      { temp: 18.2, rain: 20, hum: 58 }, // Feb
      { temp: 24.1, rain: 15, hum: 47 }, // Mar
      { temp: 30.5, rain: 11, hum: 32 }, // Apr
      { temp: 34.2, rain: 26, hum: 33 }, // May
      { temp: 34.8, rain: 82, hum: 53 }, // Jun
      { temp: 31.5, rain: 232, hum: 74 }, // Jul
      { temp: 30.2, rain: 247, hum: 78 }, // Aug
      { temp: 29.4, rain: 120, hum: 69 }, // Sep
      { temp: 26.1, rain: 14, hum: 54 }, // Oct
      { temp: 20.4, rain: 4, hum: 56 },  // Nov
      { temp: 15.6, rain: 8, hum: 66 }   // Dec
    ]
  },
  "ludhiana": {
    name: "Ludhiana", state: "Punjab", zone: "Northern Alluvial Plains",
    lat: 30.9010, lon: 75.8573, soilDefault: "loamy",
    monthly: [
      { temp: 12.8, rain: 28, hum: 74 },
      { temp: 16.2, rain: 32, hum: 66 },
      { temp: 21.5, rain: 25, hum: 56 },
      { temp: 28.0, rain: 14, hum: 38 },
      { temp: 32.5, rain: 20, hum: 36 },
      { temp: 34.1, rain: 75, hum: 52 },
      { temp: 30.8, rain: 215, hum: 76 },
      { temp: 29.5, rain: 190, hum: 81 },
      { temp: 28.4, rain: 95, hum: 73 },
      { temp: 24.2, rain: 12, hum: 60 },
      { temp: 18.5, rain: 6, hum: 64 },
      { temp: 13.7, rain: 12, hum: 72 }
    ]
  },
  "karnal": {
    name: "Karnal", state: "Haryana", zone: "Northern Alluvial Plains",
    lat: 29.6857, lon: 76.9905, soilDefault: "loamy",
    monthly: [
      { temp: 13.2, rain: 24, hum: 72 },
      { temp: 16.8, rain: 28, hum: 64 },
      { temp: 22.1, rain: 20, hum: 52 },
      { temp: 28.6, rain: 12, hum: 36 },
      { temp: 33.0, rain: 24, hum: 35 },
      { temp: 34.0, rain: 85, hum: 55 },
      { temp: 31.0, rain: 240, hum: 78 },
      { temp: 29.8, rain: 220, hum: 82 },
      { temp: 28.6, rain: 110, hum: 74 },
      { temp: 24.5, rain: 14, hum: 58 },
      { temp: 18.8, rain: 5, hum: 62 },
      { temp: 14.1, rain: 10, hum: 70 }
    ]
  },
  "nagpur": {
    name: "Nagpur", state: "Maharashtra", zone: "Central Plateau & Hills",
    lat: 21.1458, lon: 79.0882, soilDefault: "clay",
    monthly: [
      { temp: 20.8, rain: 13, hum: 52 },
      { temp: 24.0, rain: 16, hum: 42 },
      { temp: 28.8, rain: 17, hum: 32 },
      { temp: 33.5, rain: 11, hum: 26 },
      { temp: 36.4, rain: 18, hum: 28 },
      { temp: 32.2, rain: 185, hum: 62 },
      { temp: 27.8, rain: 340, hum: 82 },
      { temp: 26.8, rain: 290, hum: 85 },
      { temp: 27.4, rain: 175, hum: 78 },
      { temp: 26.2, rain: 55, hum: 62 },
      { temp: 22.8, rain: 18, hum: 56 },
      { temp: 20.2, rain: 8, hum: 54 }
    ]
  },
  "pune": {
    name: "Pune", state: "Maharashtra", zone: "Western Coastal Plains & Ghats",
    lat: 18.5204, lon: 73.8567, soilDefault: "clay",
    monthly: [
      { temp: 21.2, rain: 2, hum: 48 },
      { temp: 23.4, rain: 1, hum: 40 },
      { temp: 27.2, rain: 4, hum: 36 },
      { temp: 30.1, rain: 14, hum: 42 },
      { temp: 30.5, rain: 35, hum: 55 },
      { temp: 27.2, rain: 160, hum: 76 },
      { temp: 25.1, rain: 210, hum: 84 },
      { temp: 24.6, rain: 155, hum: 85 },
      { temp: 25.4, rain: 140, hum: 80 },
      { temp: 25.5, rain: 80, hum: 68 },
      { temp: 23.2, rain: 25, hum: 58 },
      { temp: 21.0, rain: 5, hum: 52 }
    ]
  },
  "bhopal": {
    name: "Bhopal", state: "Madhya Pradesh", zone: "Central Plateau & Hills",
    lat: 23.2599, lon: 77.4126, soilDefault: "clay",
    monthly: [
      { temp: 18.5, rain: 12, hum: 52 },
      { temp: 21.8, rain: 10, hum: 40 },
      { temp: 27.2, rain: 8, hum: 30 },
      { temp: 32.4, rain: 6, hum: 24 },
      { temp: 35.8, rain: 15, hum: 26 },
      { temp: 32.5, rain: 145, hum: 58 },
      { temp: 27.4, rain: 360, hum: 84 },
      { temp: 26.0, rain: 375, hum: 88 },
      { temp: 26.8, rain: 195, hum: 78 },
      { temp: 25.6, rain: 35, hum: 56 },
      { temp: 21.8, rain: 12, hum: 50 },
      { temp: 18.8, rain: 8, hum: 52 }
    ]
  },
  "sehore": {
    name: "Sehore", state: "Madhya Pradesh", zone: "Central Plateau & Hills",
    lat: 23.2031, lon: 77.0844, soilDefault: "clay",
    monthly: [
      { temp: 18.3, rain: 10, hum: 50 },
      { temp: 21.5, rain: 8, hum: 42 },
      { temp: 27.0, rain: 6, hum: 32 },
      { temp: 32.2, rain: 5, hum: 25 },
      { temp: 35.5, rain: 12, hum: 28 },
      { temp: 32.0, rain: 140, hum: 60 },
      { temp: 27.2, rain: 350, hum: 85 },
      { temp: 25.8, rain: 365, hum: 89 },
      { temp: 26.5, rain: 190, hum: 79 },
      { temp: 25.4, rain: 30, hum: 55 },
      { temp: 21.5, rain: 10, hum: 48 },
      { temp: 18.5, rain: 6, hum: 50 }
    ]
  },
  "bathinda": {
    name: "Bathinda", state: "Punjab", zone: "Western Semi-Arid Plains",
    lat: 30.2110, lon: 74.9455, soilDefault: "loamy",
    monthly: [
      { temp: 12.2, rain: 18, hum: 70 },
      { temp: 15.8, rain: 22, hum: 62 },
      { temp: 21.0, rain: 18, hum: 50 },
      { temp: 27.5, rain: 10, hum: 35 },
      { temp: 32.8, rain: 16, hum: 32 },
      { temp: 34.5, rain: 55, hum: 48 },
      { temp: 31.2, rain: 175, hum: 72 },
      { temp: 29.8, rain: 160, hum: 78 },
      { temp: 28.5, rain: 75, hum: 68 },
      { temp: 24.0, rain: 8, hum: 55 },
      { temp: 18.2, rain: 4, hum: 60 },
      { temp: 13.2, rain: 8, hum: 68 }
    ]
  },
  "yavatmal": {
    name: "Yavatmal", state: "Maharashtra", zone: "Vidarbha Plateau",
    lat: 20.3888, lon: 78.1204, soilDefault: "clay",
    monthly: [
      { temp: 21.0, rain: 8, hum: 50 },
      { temp: 24.5, rain: 10, hum: 40 },
      { temp: 29.2, rain: 12, hum: 30 },
      { temp: 34.0, rain: 8, hum: 24 },
      { temp: 37.0, rain: 15, hum: 26 },
      { temp: 32.5, rain: 195, hum: 65 },
      { temp: 27.5, rain: 360, hum: 84 },
      { temp: 26.5, rain: 310, hum: 86 },
      { temp: 27.0, rain: 180, hum: 80 },
      { temp: 26.0, rain: 48, hum: 60 },
      { temp: 22.5, rain: 15, hum: 54 },
      { temp: 20.0, rain: 6, hum: 52 }
    ]
  },
  "indore": {
    name: "Indore", state: "Madhya Pradesh", zone: "Central Plateau & Hills",
    lat: 22.7196, lon: 75.8577, soilDefault: "clay",
    monthly: [
      { temp: 19.2, rain: 6, hum: 50 },
      { temp: 22.4, rain: 4, hum: 38 },
      { temp: 27.8, rain: 5, hum: 28 },
      { temp: 32.8, rain: 4, hum: 22 },
      { temp: 35.2, rain: 14, hum: 28 },
      { temp: 31.8, rain: 140, hum: 60 },
      { temp: 26.8, rain: 310, hum: 82 },
      { temp: 25.6, rain: 270, hum: 86 },
      { temp: 26.2, rain: 170, hum: 78 },
      { temp: 25.2, rain: 30, hum: 54 },
      { temp: 22.0, rain: 15, hum: 48 },
      { temp: 19.4, rain: 5, hum: 50 }
    ]
  },
  "jaipur": {
    name: "Jaipur", state: "Rajasthan", zone: "Western Dry / Semi-Arid",
    lat: 26.9124, lon: 75.7873, soilDefault: "sandy",
    monthly: [
      { temp: 15.6, rain: 8, hum: 58 },
      { temp: 19.0, rain: 10, hum: 48 },
      { temp: 24.8, rain: 6, hum: 36 },
      { temp: 31.0, rain: 5, hum: 26 },
      { temp: 35.2, rain: 18, hum: 28 },
      { temp: 34.8, rain: 68, hum: 46 },
      { temp: 30.5, rain: 220, hum: 72 },
      { temp: 28.8, rain: 210, hum: 78 },
      { temp: 28.6, rain: 85, hum: 66 },
      { temp: 26.0, rain: 12, hum: 48 },
      { temp: 20.8, rain: 4, hum: 50 },
      { temp: 16.5, rain: 6, hum: 56 }
    ]
  },
  "patna": {
    name: "Patna", state: "Bihar", zone: "Eastern Gangetic Plains",
    lat: 25.5941, lon: 85.1376, soilDefault: "loamy",
    monthly: [
      { temp: 16.0, rain: 15, hum: 72 },
      { temp: 19.8, rain: 14, hum: 62 },
      { temp: 25.5, rain: 10, hum: 46 },
      { temp: 31.2, rain: 12, hum: 38 },
      { temp: 33.0, rain: 42, hum: 50 },
      { temp: 32.8, rain: 155, hum: 68 },
      { temp: 29.8, rain: 330, hum: 82 },
      { temp: 29.4, rain: 290, hum: 84 },
      { temp: 28.8, rain: 215, hum: 80 },
      { temp: 26.5, rain: 60, hum: 70 },
      { temp: 21.5, rain: 8, hum: 66 },
      { temp: 16.8, rain: 6, hum: 70 }
    ]
  },
  "varanasi": {
    name: "Varanasi", state: "Uttar Pradesh", zone: "Eastern Gangetic Plains",
    lat: 25.3176, lon: 82.9739, soilDefault: "loamy",
    monthly: [
      { temp: 15.8, rain: 18, hum: 70 },
      { temp: 19.5, rain: 16, hum: 58 },
      { temp: 25.4, rain: 9, hum: 42 },
      { temp: 31.8, rain: 8, hum: 30 },
      { temp: 35.0, rain: 18, hum: 34 },
      { temp: 33.8, rain: 120, hum: 58 },
      { temp: 29.8, rain: 310, hum: 82 },
      { temp: 29.0, rain: 295, hum: 85 },
      { temp: 28.5, rain: 190, hum: 80 },
      { temp: 26.2, rain: 35, hum: 64 },
      { temp: 21.0, rain: 6, hum: 60 },
      { temp: 16.5, rain: 8, hum: 68 }
    ]
  },
  "lucknow": {
    name: "Lucknow", state: "Uttar Pradesh", zone: "Northern Alluvial Plains",
    lat: 26.8467, lon: 80.9462, soilDefault: "loamy",
    monthly: [
      { temp: 15.2, rain: 20, hum: 72 },
      { temp: 18.8, rain: 16, hum: 60 },
      { temp: 24.6, rain: 10, hum: 44 },
      { temp: 31.0, rain: 8, hum: 32 },
      { temp: 34.5, rain: 22, hum: 36 },
      { temp: 33.6, rain: 110, hum: 56 },
      { temp: 30.0, rain: 280, hum: 80 },
      { temp: 29.2, rain: 270, hum: 84 },
      { temp: 28.6, rain: 175, hum: 78 },
      { temp: 25.8, rain: 28, hum: 62 },
      { temp: 20.6, rain: 5, hum: 60 },
      { temp: 16.0, rain: 10, hum: 70 }
    ]
  },
  "kolkata": {
    name: "Kolkata", state: "West Bengal", zone: "Eastern & Coastal Plains",
    lat: 22.5726, lon: 88.3639, soilDefault: "clay",
    monthly: [
      { temp: 20.0, rain: 14, hum: 66 },
      { temp: 23.6, rain: 22, hum: 62 },
      { temp: 28.2, rain: 35, hum: 64 },
      { temp: 31.0, rain: 58, hum: 70 },
      { temp: 31.5, rain: 140, hum: 75 },
      { temp: 30.5, rain: 300, hum: 82 },
      { temp: 29.2, rain: 390, hum: 86 },
      { temp: 29.0, rain: 360, hum: 87 },
      { temp: 29.0, rain: 280, hum: 84 },
      { temp: 27.8, rain: 160, hum: 76 },
      { temp: 24.2, rain: 25, hum: 68 },
      { temp: 20.5, rain: 8, hum: 66 }
    ]
  },
  "hyderabad": {
    name: "Hyderabad", state: "Telangana", zone: "Southern Peninsular",
    lat: 17.3850, lon: 78.4867, soilDefault: "red",
    monthly: [
      { temp: 22.5, rain: 4, hum: 56 },
      { temp: 25.2, rain: 8, hum: 46 },
      { temp: 29.0, rain: 12, hum: 40 },
      { temp: 32.4, rain: 22, hum: 42 },
      { temp: 34.0, rain: 35, hum: 44 },
      { temp: 29.8, rain: 115, hum: 66 },
      { temp: 26.8, rain: 175, hum: 78 },
      { temp: 26.0, rain: 160, hum: 80 },
      { temp: 26.5, rain: 135, hum: 76 },
      { temp: 25.8, rain: 95, hum: 68 },
      { temp: 23.5, rain: 22, hum: 60 },
      { temp: 21.8, rain: 5, hum: 58 }
    ]
  },
  "bengaluru": {
    name: "Bengaluru", state: "Karnataka", zone: "Southern Peninsular",
    lat: 12.9716, lon: 77.5946, soilDefault: "red",
    monthly: [
      { temp: 21.0, rain: 3, hum: 60 },
      { temp: 23.4, rain: 7, hum: 52 },
      { temp: 26.5, rain: 18, hum: 48 },
      { temp: 28.0, rain: 45, hum: 58 },
      { temp: 27.4, rain: 110, hum: 68 },
      { temp: 24.8, rain: 95, hum: 76 },
      { temp: 23.8, rain: 115, hum: 80 },
      { temp: 23.6, rain: 140, hum: 80 },
      { temp: 24.0, rain: 180, hum: 78 },
      { temp: 24.0, rain: 170, hum: 78 },
      { temp: 22.5, rain: 65, hum: 72 },
      { temp: 20.8, rain: 15, hum: 66 }
    ]
  },
  "ahmedabad": {
    name: "Ahmedabad", state: "Gujarat", zone: "Western Dry / Semi-Arid",
    lat: 23.0225, lon: 72.5714, soilDefault: "loamy",
    monthly: [
      { temp: 20.2, rain: 2, hum: 48 },
      { temp: 23.0, rain: 1, hum: 38 },
      { temp: 28.4, rain: 2, hum: 30 },
      { temp: 33.0, rain: 3, hum: 30 },
      { temp: 35.8, rain: 10, hum: 42 },
      { temp: 33.5, rain: 85, hum: 62 },
      { temp: 29.5, rain: 310, hum: 78 },
      { temp: 28.2, rain: 250, hum: 82 },
      { temp: 29.0, rain: 125, hum: 74 },
      { temp: 28.5, rain: 15, hum: 52 },
      { temp: 24.8, rain: 4, hum: 46 },
      { temp: 21.2, rain: 2, hum: 48 }
    ]
  }
};

// Weather code translation for WMO standards (Open-Meteo)
function interpretWmoCode(code) {
  if (code === 0) return { desc: "Clear Sky", icon: "https://openweathermap.org/img/wn/01d@2x.png" };
  if (code === 1 || code === 2) return { desc: "Partly Cloudy", icon: "https://openweathermap.org/img/wn/02d@2x.png" };
  if (code === 3) return { desc: "Overcast", icon: "https://openweathermap.org/img/wn/04d@2x.png" };
  if (code >= 45 && code <= 48) return { desc: "Fog / Haze", icon: "https://openweathermap.org/img/wn/50d@2x.png" };
  if (code >= 51 && code <= 55) return { desc: "Light Drizzle", icon: "https://openweathermap.org/img/wn/09d@2x.png" };
  if (code >= 61 && code <= 65) return { desc: "Rain Showers", icon: "https://openweathermap.org/img/wn/10d@2x.png" };
  if (code >= 80 && code <= 82) return { desc: "Heavy Rain Showers", icon: "https://openweathermap.org/img/wn/09d@2x.png" };
  if (code >= 95) return { desc: "Thunderstorm", icon: "https://openweathermap.org/img/wn/11d@2x.png" };
  return { desc: "Scattered Clouds", icon: "https://openweathermap.org/img/wn/03d@2x.png" };
}

/**
 * Fetch weather from OpenWeatherMap
 */
async function fetchFromOpenWeather(city, apiKey) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
  const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`OpenWeather status ${res.status}`);
  const data = await res.json();
  return {
    city: data.name,
    country: data.sys?.country || "IN",
    temp_c: Math.round(data.main.temp * 10) / 10,
    rainfall_mm: data.rain?.["1h"] ? Math.round(data.rain["1h"] * 30) : (data.main.humidity > 80 ? 120 : 30),
    humidity_pct: data.main.humidity,
    wind_kmh: Math.round((data.wind?.speed || 0) * 3.6),
    description: data.weather?.[0]?.description || "Clear",
    icon: `https://openweathermap.org/img/wn/${data.weather?.[0]?.icon || "02d"}@2x.png`,
    source: "OpenWeatherMap API (Live)"
  };
}

/**
 * Fetch weather from Open-Meteo (Zero-key public API)
 */
async function fetchFromOpenMeteo(city, coordinates) {
  let lat = coordinates?.lat;
  let lon = coordinates?.lon;
  let cityName = coordinates?.name || city;

  if (!lat || !lon) {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(3500) });
    if (!geoRes.ok) throw new Error("Geocoding failed");
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) throw new Error("City not found");
    lat = geoData.results[0].latitude;
    lon = geoData.results[0].longitude;
    cityName = geoData.results[0].name;
  }

  const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m`;
  const wxRes = await fetch(wxUrl, { signal: AbortSignal.timeout(4000) });
  if (!wxRes.ok) throw new Error("Open-Meteo forecast failed");
  const wxData = await wxRes.json();
  const cur = wxData.current;
  const wmo = interpretWmoCode(cur.weather_code);

  // Derive estimated seasonal/monthly rain indicator from precipitation rate
  const estRainMm = cur.rain > 0 ? Math.round(cur.rain * 40 + 80) : (cur.relative_humidity_2m > 75 ? 140 : 45);

  return {
    city: cityName,
    country: "IN",
    temp_c: Math.round(cur.temperature_2m * 10) / 10,
    rainfall_mm: estRainMm,
    humidity_pct: cur.relative_humidity_2m,
    wind_kmh: Math.round(cur.wind_speed_10m),
    description: wmo.desc,
    icon: wmo.icon,
    source: "Open-Meteo Meteorological Service (Live)"
  };
}

/**
 * Get Climatological Normals fallback from IMD regional data
 */
function getImdNormals(city) {
  const normKey = (city || "").toLowerCase().trim();
  const matched = IMD_REGIONAL_NORMALS[normKey] ||
                  Object.values(IMD_REGIONAL_NORMALS).find(c => c.name.toLowerCase().includes(normKey)) ||
                  IMD_REGIONAL_NORMALS["delhi"];

  const monthIdx = new Date().getMonth();
  const monthData = matched.monthly[monthIdx];

  return {
    city: matched.name,
    state: matched.state,
    zone: matched.zone,
    country: "IN",
    temp_c: monthData.temp,
    rainfall_mm: monthData.rain,
    humidity_pct: monthData.hum,
    wind_kmh: 10,
    description: monthData.rain > 100 ? "Monsoon Rainfall Period" : "Typical Regional Seasonal Weather",
    icon: monthData.rain > 100 ? "https://openweathermap.org/img/wn/10d@2x.png" : "https://openweathermap.org/img/wn/02d@2x.png",
    source: "IMD Agro-Climatic Climatological Normals (1981–2010)",
    soilDefault: matched.soilDefault,
    isFallback: true
  };
}

/**
 * Unified Weather Resolver
 */
async function resolveWeather(city) {
  const cleanCity = (city || "Delhi").trim();
  const normKey = cleanCity.toLowerCase();
  const knownCoords = IMD_REGIONAL_NORMALS[normKey];

  // Strategy 1: OpenWeatherMap (if configured with real key)
  const owKey = process.env.OPENWEATHER_API_KEY;
  if (owKey && owKey !== "your_openweathermap_key_here" && owKey.length > 10) {
    try {
      return await fetchFromOpenWeather(cleanCity, owKey);
    } catch (e) {
      console.warn(`[Weather] OpenWeather query failed (${e.message}), trying Open-Meteo...`);
    }
  }

  // Strategy 2: Open-Meteo Free Public API
  try {
    return await fetchFromOpenMeteo(cleanCity, knownCoords);
  } catch (e) {
    console.warn(`[Weather] Open-Meteo query failed (${e.message}), using IMD Regional Normals...`);
  }

  // Strategy 3: Deterministic IMD Agro-Climatic Normals (offline resilience)
  return getImdNormals(cleanCity);
}

module.exports = {
  resolveWeather,
  getImdNormals,
  IMD_REGIONAL_NORMALS
};
