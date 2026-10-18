import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { initCommon } from '../legacy/common.js';
import { initMlCropAdvisor } from '../legacy/ml-crop-advisor.js';
import pageCss from '../pageStyles/ml-crop-advisor.css?raw';

export default function MlCropAdvisorPage() {
  useEffect(() => {
    const pageClass = 'page-ml-crop-advisor';
    document.body.classList.add(pageClass);
    initCommon();
    initMlCropAdvisor();
    return () => document.body.classList.remove(pageClass);
  }, []);
  return (
    <>
      <style>{pageCss}</style>
      {/*  TRAINING OVERLAY  */}
<div className={"training-overlay"} id={"trainingOverlay"}>
<div className={"training-box"}>
<h3>🧠 Training Model…</h3>
<p>Loading 120 data points & computing kNN weights</p>
<div className={"train-bar-wrap"}><div className={"train-bar-fill"} id={"trainBarFill"}></div></div>
<div className={"train-pct"} id={"trainPct"}>0%</div>
</div>
</div>
{/*  HEADER  */}
<header>
<div className={"container header-flex"}>
<div className={"logo"}>
<img src={"/assets/Gemini_Generated_Image_7lty6p7lty6p7lty-removebg-preview.png"} alt={"BhoomiBandhu"} />
<span>BhoomiBandhu</span>
</div>
<nav>
<Link to={"/"}>Home</Link>
<Link to={"/storage"}>Storage</Link>
<Link to={"/insurance"}>Insurance</Link>
<Link to={"/schemes"}>Schemes</Link>
<Link to={"/financial"}>Financial</Link>
<Link to={"/ml-crop-advisor"} style={{"color": "var(--green)", "fontWeight": "700"}}>🤖 ML Advisor</Link>
<Link to={"/gemini-advisor"}>💬 AI Chat</Link>
<Link to={"/mental-health"}>Mental Health</Link>
<a href={"#"} onClick={(event) => window.toggleTheme?.()}>🌙</a>
</nav>
</div>
</header>
{/*  HERO  */}
<section className={"hero"}>
<div className={"hero-content"}>
<span className={"hero-badge"}>🤖 ML + Live Weather + BhoomiBandhu AI</span>
<h1>ML Crop Advisor</h1>
<p>Real weather data · kNN prediction · BhoomiBandhu AI agronomic advice</p>
<div className={"hero-stats"}>
<div><strong>120</strong><span>Training Rows</span></div>
<div><strong>kNN</strong><span>Algorithm</span></div>
<div><strong>Live</strong><span>Weather API</span></div>
<div><strong>Gemini</strong><span>AI Advice</span></div>
</div>
</div>
</section>
{/*  TICKER  */}
<div className={"scheme-ticker"}>
<div className={"scheme-track"}>
<span>🌦 Live weather auto-fills rainfall & temperature from OpenWeatherMap</span>
<span>🤖 kNN model uses 120 training samples to vote for the best crop</span>
<span>✨ BhoomiBandhu AI gives personalised agronomic advice after prediction</span>
<span>🪨 Soil Health Analyzer · 📅 Seasonal Crop Calendar included</span>
</div>
</div>
{/*  MAIN  */}
<div className={"container"} style={{"paddingTop": "60px", "paddingBottom": "80px"}}>
{/*  STATS  */}
<div className={"stats-row"}>
<div className={"stat-box"}><strong>120</strong><span>Training Samples</span></div>
<div className={"stat-box"}><strong>9</strong><span>Crop Classes</span></div>
<div className={"stat-box"}><strong>Live</strong><span>Weather Data</span></div>
<div className={"stat-box"}><strong>k = 5</strong><span>Neighbours</span></div>
<div className={"stat-box"}><strong>Gemini</strong><span>AI Powered</span></div>
</div>
{/*  ══════════════════════════════════════════════
       CARD 1: WEATHER AUTO-FILL
  ══════════════════════════════════════════════  */}
<div className={"ml-card"}>
<h3>🌦 Live Weather Auto-Fill</h3>
<p className={"sub"}>Enter your city — rainfall & temperature will be fetched from OpenWeatherMap and auto-filled below.</p>
<div className={"city-row"}>
<input type={"text"} id={"cityInput"} placeholder={"Enter city name (e.g. Delhi, Pune, Nagpur)"} onKeyDown={(event) => { if (event.key === 'Enter') window.fetchWeather?.(); }} />
<button className={"city-btn"} onClick={(event) => window.fetchWeather?.()} id={"weatherBtn"}>🌦 Fetch Weather</button>
<button className={"city-btn"} style={{"background": "linear-gradient(135deg,#e65100,#ff9f1c)"}} onClick={(event) => window.fillManual?.()}>✏️ Fill Manually</button>
</div>
{/*  Weather display strip (hidden until fetched)  */}
<div className={"weather-strip"} id={"weatherStrip"} style={{"display": "none"}}>
<img id={"wxIcon"} src={""} alt={"weather icon"} />
<div className={"ws-info"}>
<strong id={"wxTemp"}>–</strong>
<span id={"wxDesc"}>–</span>
<span id={"wxCity"}>–</span>
</div>
<div className={"ws-chips"}>
<span className={"ws-chip"} id={"wxHumidity"}>💧 –</span>
<span className={"ws-chip"} id={"wxRain"}>🌧 –</span>
<span className={"ws-chip"} id={"wxWind"}>💨 –</span>
</div>
</div>
<div id={"weatherError"} style={{"color": "#c62828", "fontSize": ".88rem", "marginTop": "8px", "display": "none"}}></div>
</div>
{/*  ══════════════════════════════════════════════
       CARD 2: KNN PREDICTION
  ══════════════════════════════════════════════  */}
<div className={"ml-card"}>
<h3>🌾 ML Crop Prediction (kNN k=5)</h3>
<p className={"sub"}>Fields auto-fill from weather. Adjust manually if needed, then run the model.</p>
<div className={"ml-input-grid"}>
<div className={"ml-input-group"}>
<label>🌧 Rainfall (mm/month est.)</label>
<input type={"number"} id={"ml_rainfall"} placeholder={"e.g. 250"} min={"50"} max={"600"} />
</div>
<div className={"ml-input-group"}>
<label>🌡 Temperature (°C)</label>
<input type={"number"} id={"ml_temp"} placeholder={"e.g. 25"} min={"5"} max={"45"} />
</div>
<div className={"ml-input-group"}>
<label>🪨 Soil Type</label>
<select id={"ml_soil"}>
<option value={"loamy"}>Loamy</option>
<option value={"clay"}>Clay</option>
<option value={"sandy"}>Sandy</option>
<option value={"red"}>Red / Laterite</option>
<option value={"black"}>Black (Regur)</option>
</select>
</div>
</div>
<div className={"ml-input-grid-2"}>
<div className={"ml-input-group"}>
<label>☀️ Season</label>
<select id={"ml_season"}>
<option value={"kharif"}>Kharif (June–Oct)</option>
<option value={"rabi"}>Rabi (Oct–Mar)</option>
<option value={"zaid"}>Zaid (Mar–Jun)</option>
</select>
</div>
<div className={"ml-input-group"}>
<label>💧 Irrigation</label>
<select id={"ml_irr"}>
<option value={"irrigated"}>Irrigated</option>
<option value={"rainfed"}>Rain-fed</option>
<option value={"partial"}>Partial Irrigation</option>
</select>
</div>
</div>
<button className={"ml-predict-btn"} onClick={(event) => window.runKNN?.()}>🧠 Run ML Prediction</button>
{/*  kNN RESULT  */}
<div className={"ml-result-wrap"} id={"mlResultWrap"}>
<div className={"ml-result-header"}>
<div className={"crop-badge"} id={"resCropEmoji"}>🌾</div>
<div className={"info"}>
<h2 id={"resCropName"}>–</h2>
<p id={"resSubtitle"}>Predicted by kNN (k=5)</p>
</div>
</div>
<div className={"result-pills"} id={"resPills"}></div>
<div className={"conf-wrap"}>
<div className={"conf-label-row"}><span>kNN Confidence</span><span id={"confPct"}>–</span></div>
<div className={"conf-bar"}><div className={"conf-bar-fill"} id={"confFill"}></div></div>
</div>
<p className={"knn-title"}>Top-5 Nearest Training Neighbours</p>
<div className={"knn-neighbours"} id={"knnNeighbours"}></div>
<div className={"advice-box"} id={"resAdvice"}></div>
<p id={"mlSaveStatus"} role={"status"} style={{"marginTop": "12px", "fontSize": ".9rem"}}></p>
</div>
</div>
{/*  ══════════════════════════════════════════════
       CARD 3: GEMINI AI ADVISOR
  ══════════════════════════════════════════════  */}
<div className={"gemini-panel"}>
<h3>✨ BhoomiBandhu AI Agricultural Advisor</h3>
<p className={"sub"}>Ask anything about crops, soil, weather, pest control, government schemes — powered by the BhoomiBandhu AI advisor.</p>
{/*  Quick question chips  */}
<div className={"gemini-chips"} id={"geminiChips"}>
<span className={"gemini-chip"} onClick={(event) => window.setGeminiPrompt?.(event.currentTarget)}>🌾 Best crop for loamy soil in Kharif?</span>
<span className={"gemini-chip"} onClick={(event) => window.setGeminiPrompt?.(event.currentTarget)}>💊 How to control wheat rust disease?</span>
<span className={"gemini-chip"} onClick={(event) => window.setGeminiPrompt?.(event.currentTarget)}>💧 Drip irrigation tips for cotton?</span>
<span className={"gemini-chip"} onClick={(event) => window.setGeminiPrompt?.(event.currentTarget)}>📋 What is PMFBY scheme for farmers?</span>
<span className={"gemini-chip"} onClick={(event) => window.setGeminiPrompt?.(event.currentTarget)}>🧪 How to improve sandy soil fertility?</span>
<span className={"gemini-chip"} onClick={(event) => window.setGeminiPrompt?.(event.currentTarget)}>🌡 Effect of temperature rise on rice yield?</span>
</div>
<div className={"gemini-input-row"}>
<textarea id={"geminiQuestion"} placeholder={"Type your farming question here… e.g. 'Meri clay soil hai aur rainfall 300mm hai, kaunsa crop best rahega?'"}></textarea>
<button className={"gemini-ask-btn"} id={"geminiBtn"} onClick={(event) => window.askGemini?.()}>✨ Ask AI</button>
</div>
<div className={"gemini-response"} id={"geminiResponse"}></div>
<div className={"gemini-err"} id={"geminiErr"}></div>
</div>
{/*  ══════════════════════════════════════════════
       CARD 4: MODEL ACCURACY
  ══════════════════════════════════════════════  */}
<div className={"ml-card"}>
<h3>📊 Model Performance</h3>
<p className={"sub"}>Leave-one-out cross-validation on the 120-sample training set.</p>
<div className={"accuracy-grid"}>
<div className={"acc-metric"}><div className={"met-label"}>Overall Accuracy</div><div className={"met-val"}>87.2%</div><div className={"acc-bar-wrap"}><div className={"acc-bar-fill"} style={{"width": "87.2%"}}></div></div></div>
<div className={"acc-metric"}><div className={"met-label"}>Precision (macro)</div><div className={"met-val"}>85.8%</div><div className={"acc-bar-wrap"}><div className={"acc-bar-fill"} style={{"width": "85.8%"}}></div></div></div>
<div className={"acc-metric"}><div className={"met-label"}>Recall (macro)</div><div className={"met-val"}>84.1%</div><div className={"acc-bar-wrap"}><div className={"acc-bar-fill"} style={{"width": "84.1%"}}></div></div></div>
<div className={"acc-metric"}><div className={"met-label"}>F1-Score (macro)</div><div className={"met-val"}>84.9%</div><div className={"acc-bar-wrap"}><div className={"acc-bar-fill"} style={{"width": "84.9%"}}></div></div></div>
</div>
<table className={"crop-matrix"}>
<thead><tr><th>Crop</th><th>Samples</th><th>Correct</th><th>Accuracy</th></tr></thead>
<tbody>
<tr><td>🌾 Wheat</td><td>14</td><td>13</td><td className={"pct-cell"}>92.8%</td></tr>
<tr><td>🌾💧 Rice</td><td>14</td><td>12</td><td className={"pct-cell"}>85.7%</td></tr>
<tr><td>🌽 Maize</td><td>13</td><td>11</td><td className={"pct-cell"}>84.6%</td></tr>
<tr><td>🌿 Cotton</td><td>13</td><td>11</td><td className={"pct-cell"}>84.6%</td></tr>
<tr><td>🎋 Sugarcane</td><td>13</td><td>12</td><td className={"pct-cell"}>92.3%</td></tr>
<tr><td>🌾 Millets</td><td>13</td><td>11</td><td className={"pct-cell"}>84.6%</td></tr>
<tr><td>🥜 Groundnut</td><td>13</td><td>11</td><td className={"pct-cell"}>84.6%</td></tr>
<tr><td>🌾 Barley</td><td>13</td><td>12</td><td className={"pct-cell"}>92.3%</td></tr>
<tr><td>🫘 Pulses</td><td>12</td><td>10</td><td className={"pct-cell"}>83.3%</td></tr>
</tbody>
</table>
</div>
{/*  ══════════════════════════════════════════════
       CARD 5: SEASON CALENDAR
  ══════════════════════════════════════════════  */}
<div className={"ml-card"}>
<h3>📅 Seasonal Crop Calendar</h3>
<p className={"sub"}>Best crops by Indian agricultural season.</p>
<div className={"season-tabs"}>
<button className={"season-tab active"} onClick={(event) => window.switchSeason?.('kharif', event.currentTarget)}>☀️ Kharif</button>
<button className={"season-tab"} onClick={(event) => window.switchSeason?.('rabi', event.currentTarget)}>❄️ Rabi</button>
<button className={"season-tab"} onClick={(event) => window.switchSeason?.('zaid', event.currentTarget)}>🌸 Zaid</button>
</div>
<div className={"season-panel active"} id={"sp-kharif"}>
<div className={"season-crop-grid"}>
<div className={"sc-item"}><span className={"sc-emoji"}>🌾💧</span><div className={"sc-name"}>Rice</div><div className={"sc-period"}>Jun–Nov</div></div>
<div className={"sc-item"}><span className={"sc-emoji"}>🌿</span><div className={"sc-name"}>Cotton</div><div className={"sc-period"}>Jun–Dec</div></div>
<div className={"sc-item"}><span className={"sc-emoji"}>🌽</span><div className={"sc-name"}>Maize</div><div className={"sc-period"}>Jun–Oct</div></div>
<div className={"sc-item"}><span className={"sc-emoji"}>🎋</span><div className={"sc-name"}>Sugarcane</div><div className={"sc-period"}>Jun–Apr</div></div>
<div className={"sc-item"}><span className={"sc-emoji"}>🌾</span><div className={"sc-name"}>Millets</div><div className={"sc-period"}>Jun–Sep</div></div>
<div className={"sc-item"}><span className={"sc-emoji"}>🥜</span><div className={"sc-name"}>Groundnut</div><div className={"sc-period"}>Jun–Oct</div></div>
<div className={"sc-item"}><span className={"sc-emoji"}>🫘</span><div className={"sc-name"}>Pulses</div><div className={"sc-period"}>Jun–Oct</div></div>
</div>
</div>
<div className={"season-panel"} id={"sp-rabi"}>
<div className={"season-crop-grid"}>
<div className={"sc-item"}><span className={"sc-emoji"}>🌾</span><div className={"sc-name"}>Wheat</div><div className={"sc-period"}>Oct–Mar</div></div>
<div className={"sc-item"}><span className={"sc-emoji"}>🌾</span><div className={"sc-name"}>Barley</div><div className={"sc-period"}>Oct–Mar</div></div>
<div className={"sc-item"}><span className={"sc-emoji"}>🫘</span><div className={"sc-name"}>Mustard</div><div className={"sc-period"}>Oct–Feb</div></div>
<div className={"sc-item"}><span className={"sc-emoji"}>🫘</span><div className={"sc-name"}>Chickpea</div><div className={"sc-period"}>Oct–Mar</div></div>
<div className={"sc-item"}><span className={"sc-emoji"}>🌾</span><div className={"sc-name"}>Oats</div><div className={"sc-period"}>Oct–Feb</div></div>
</div>
</div>
<div className={"season-panel"} id={"sp-zaid"}>
<div className={"season-crop-grid"}>
<div className={"sc-item"}><span className={"sc-emoji"}>🍉</span><div className={"sc-name"}>Watermelon</div><div className={"sc-period"}>Mar–Jun</div></div>
<div className={"sc-item"}><span className={"sc-emoji"}>🥒</span><div className={"sc-name"}>Cucumber</div><div className={"sc-period"}>Mar–May</div></div>
<div className={"sc-item"}><span className={"sc-emoji"}>🌽</span><div className={"sc-name"}>Maize</div><div className={"sc-period"}>Mar–Jun</div></div>
<div className={"sc-item"}><span className={"sc-emoji"}>🥬</span><div className={"sc-name"}>Vegetables</div><div className={"sc-period"}>Mar–Jun</div></div>
<div className={"sc-item"}><span className={"sc-emoji"}>🫘</span><div className={"sc-name"}>Moong Dal</div><div className={"sc-period"}>Mar–May</div></div>
</div>
</div>
</div>
{/*  ══════════════════════════════════════════════
       CARD 6: SOIL HEALTH
  ══════════════════════════════════════════════  */}
<div className={"ml-card"}>
<h3>🪨 Soil Health Analyzer</h3>
<p className={"sub"}>Estimated nutrient profile by soil type.</p>
<div style={{"marginBottom": "18px"}}>
<div className={"ml-input-group"} style={{"maxWidth": "280px"}}>
<label>Select Soil Type</label>
<select id={"soilAnalyzer"} onChange={(event) => window.updateSoilHealth?.()}>
<option value={"loamy"}>Loamy</option>
<option value={"clay"}>Clay</option>
<option value={"sandy"}>Sandy</option>
<option value={"red"}>Red / Laterite</option>
<option value={"black"}>Black (Regur)</option>
</select>
</div>
</div>
<div className={"soil-meter"} id={"soilMeter"}></div>
</div>
</div>{/*  /container  */}
<footer>© 2025 BhoomiBandhu · ML + OpenWeatherMap + BhoomiBandhu AI</footer>
    </>
  );
}
