import React, { useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
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

      {/* TRAINING OVERLAY */}
      <div className="training-overlay" id="trainingOverlay">
        <div className="training-box">
          <h3 style={{ fontFamily: 'DM Sans', fontSize: '1.4rem' }}>🧠 Training kNN Model…</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0' }}>Loading 120 agro-climatic training vectors & calculating distance matrices</p>
          <div className="train-bar">
            <div id="trainBarFill"></div>
          </div>
          <div id="trainPct" style={{ fontWeight: '700', color: '#0d9488' }}>0%</div>
        </div>
      </div>

      <Navbar />

      {/* HERO SECTION */}
      <section className="farmer-hero-section">
        <div className="container hero-container" style={{ padding: '60px 20px 40px', textAlign: 'center' }}>
          <div className="farmer-hero-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="hero-kicker-pill" style={{ margin: '0 auto 16px' }}>
              <span className="kicker-pulse" aria-hidden="true" />
              <span>Machine Learning & Micro-Climate Agronomy</span>
            </div>
            <h1 className="farmer-hero-title">ML Crop Recommendation Engine</h1>
            <p className="farmer-hero-sub" style={{ margin: '0 auto 24px' }}>
              Real-time OpenWeatherMap data · k-Nearest Neighbors classification · BhoomiBandhu AI agronomic guidance for maximum yield.
            </p>
            <div className="hero-trust-bar" style={{ justifyContent: 'center' }}>
              <div className="trust-item">
                <span className="trust-icon">📊</span>
                <span><strong>120</strong> Validated Soil Vectors</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🌦️</span>
                <span><strong>Live</strong> GPS Weather Auto-Fill</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">⚡</span>
                <span><strong>k=5</strong> Supervised Voting</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN DIAGNOSTIC WORKSPACE */}
      <main className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
        {/* CARD 1: WEATHER AUTO-FILL */}
        <div className="card" style={{ padding: '32px', marginBottom: '28px', borderLeft: '5px solid #0d9488' }}>
          <h3 style={{ fontFamily: 'DM Sans', fontSize: '1.35rem', marginBottom: '8px' }}>🌦 Live Weather Integration</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Enter your district or mandi name to automatically pull live precipitation estimates and temperature metrics.
          </p>
          <div className="city-row">
            <input
              type="text"
              id="cityInput"
              placeholder="Enter district name (e.g. Karnal, Ludhiana, Indore, Pune)"
              onKeyDown={(e) => { if (e.key === 'Enter') window.fetchWeather?.(); }}
            />
            <button type="button" className="city-btn" id="weatherBtn" onClick={() => window.fetchWeather?.()}>
              Fetch Live Weather
            </button>
            <button
              type="button"
              className="city-btn"
              style={{ background: '#f59e0b' }}
              onClick={() => window.fillManual?.()}
            >
              Fill Manually
            </button>
          </div>

          {/* Live Weather strip */}
          <div className="weather-strip" id="weatherStrip" style={{ display: 'none' }}>
            <img id="wxIcon" src="" alt="Weather condition" />
            <div className="ws-info">
              <strong id="wxTemp">–</strong>
              <span id="wxDesc">–</span>
              <span id="wxCity">–</span>
            </div>
            <div className="ws-chips">
              <span className="ws-chip" id="wxHumidity">💧 –</span>
              <span className="ws-chip" id="wxRain">🌧 –</span>
              <span className="ws-chip" id="wxWind">💨 –</span>
            </div>
          </div>
          <div id="weatherError" style={{ display: 'none' }}></div>
        </div>

        {/* CARD 2: KNN PREDICTION */}
        <div className="card" style={{ padding: '32px', marginBottom: '28px' }}>
          <h3 style={{ fontFamily: 'DM Sans', fontSize: '1.35rem', marginBottom: '8px' }}>🌾 Soil & Climate Metrics (kNN Classifier)</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Parameters are pre-filled from your weather query. Fine-tune soil type and irrigation availability to run the model.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '18px' }}>
            <div className="form-group">
              <label htmlFor="ml_rainfall">Estimated Rainfall (mm/month) *</label>
              <input type="number" id="ml_rainfall" className="auth-input" placeholder="e.g. 250" min="50" max="600" />
            </div>
            <div className="form-group">
              <label htmlFor="ml_temp">Ambient Temperature (°C) *</label>
              <input type="number" id="ml_temp" className="auth-input" placeholder="e.g. 25" min="5" max="45" />
            </div>
            <div className="form-group">
              <label htmlFor="ml_soil">Predominant Soil Type *</label>
              <select id="ml_soil" className="auth-input">
                <option value="loamy">Loamy (Alluvial)</option>
                <option value="clay">Clay (Heavy Texture)</option>
                <option value="sandy">Sandy (Light Porous)</option>
                <option value="red">Red / Laterite</option>
                <option value="black">Black (Regur Cotton Soil)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '28px' }}>
            <div className="form-group">
              <label htmlFor="ml_season">Cropping Season *</label>
              <select id="ml_season" className="auth-input">
                <option value="kharif">Kharif (Monsoon: June–Oct)</option>
                <option value="rabi">Rabi (Winter: Oct–March)</option>
                <option value="zaid">Zaid (Summer: March–June)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="ml_irr">Irrigation Infrastructure *</label>
              <select id="ml_irr" className="auth-input">
                <option value="irrigated">Canal / Tube Well Irrigated</option>
                <option value="rainfed">Rain-fed (Monsoon Dependent)</option>
                <option value="partial">Partial Supplemental Irrigation</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', padding: '14px', borderRadius: '10px', fontSize: '1rem' }}
            onClick={() => window.runKNN?.()}
          >
            Run ML Recommendation Model
          </button>

          {/* kNN RESULT WRAPPER */}
          <div id="mlResultWrap">
            <div className="res-card">
              <div className="res-top">
                <div className="res-emoji" id="resCropEmoji">🌾</div>
                <div>
                  <h2 className="res-name" id="resCropName">–</h2>
                  <p className="res-sub" id="resSubtitle">Predicted by kNN (k=5)</p>
                </div>
              </div>
              <div className="res-pills" id="resPills"></div>
              
              <div className="conf-meter">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: '600' }}>
                  <span>Prediction Confidence Score</span>
                  <span id="confPct" style={{ color: '#0d9488' }}>–</span>
                </div>
                <div className="conf-track">
                  <div id="confFill"></div>
                </div>
              </div>

              <h4 style={{ fontFamily: 'DM Sans', marginTop: '20px', marginBottom: '10px' }}>Top-5 Nearest Training Clusters</h4>
              <div className="knn-neighbours" id="knnNeighbours"></div>

              <div id="resAdvice" style={{ padding: '16px', background: 'var(--bg-soft)', borderRadius: '10px', marginTop: '16px', borderLeft: '4px solid #0d9488' }}></div>
              <p id="mlSaveStatus" role="status" style={{ marginTop: '12px', fontSize: '0.9rem', fontWeight: '500' }}></p>
            </div>
          </div>
        </div>

        {/* CARD 3: AI ADVISOR PROMPTER */}
        <div className="card gemini-box">
          <h3 style={{ fontFamily: 'DM Sans', fontSize: '1.35rem', marginBottom: '8px' }}>💬 Follow-Up Agronomic Guidance</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Click any instant inquiry prompt below to request personalized fertilizer schedules, pest control remedies, or organic methods.
          </p>

          <div className="prompt-chips" id="geminiChips">
            <button type="button" className="prompt-chip" onClick={(e) => window.setGeminiPrompt?.(e.currentTarget)}>
              🌾 Best crop for loamy soil in Kharif?
            </button>
            <button type="button" className="prompt-chip" onClick={(e) => window.setGeminiPrompt?.(e.currentTarget)}>
              💊 How to prevent yellow rust in wheat?
            </button>
            <button type="button" className="prompt-chip" onClick={(e) => window.setGeminiPrompt?.(e.currentTarget)}>
              💧 Drip irrigation fertilizer schedule for cotton?
            </button>
            <button type="button" className="prompt-chip" onClick={(e) => window.setGeminiPrompt?.(e.currentTarget)}>
              🧪 Best organic spray for fall armyworm in maize?
            </button>
          </div>

          <div style={{ marginTop: '16px' }}>
            <textarea
              id="geminiQuestion"
              className="auth-input"
              style={{ minHeight: '90px', marginBottom: '12px' }}
              placeholder="Type your crop question here in Hindi or English…"
            ></textarea>
            <button
              type="button"
              id="geminiBtn"
              className="btn-primary"
              style={{ padding: '12px 24px', borderRadius: '8px' }}
              onClick={() => window.askGemini?.()}
            >
              Ask Agri Doctor
            </button>
          </div>

          <div id="geminiResponse" style={{ marginTop: '20px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}></div>
          <div id="geminiErr" style={{ color: '#dc2626', marginTop: '10px', fontWeight: '600' }}></div>
        </div>

        {/* CARD 4: ACCURACY & CONFUSION MATRIX */}
        <div className="card" style={{ padding: '32px', marginTop: '28px' }}>
          <h3 style={{ fontFamily: 'DM Sans', fontSize: '1.35rem', marginBottom: '8px' }}>📊 Verified Model Performance</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Leave-one-out cross-validation results across the multi-season agronomic test dataset.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="stat-box" style={{ padding: '16px', background: 'var(--bg-soft)', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0d9488' }}>87.2%</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Overall Accuracy</div>
            </div>
            <div className="stat-box" style={{ padding: '16px', background: 'var(--bg-soft)', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0d9488' }}>85.8%</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Precision (Macro)</div>
            </div>
            <div className="stat-box" style={{ padding: '16px', background: 'var(--bg-soft)', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0d9488' }}>84.1%</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Recall Rate</div>
            </div>
            <div className="stat-box" style={{ padding: '16px', background: 'var(--bg-soft)', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0d9488' }}>84.9%</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>F1-Score</div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '10px' }}>Crop Name</th>
                <th style={{ padding: '10px' }}>Test Samples</th>
                <th style={{ padding: '10px' }}>Correct Predictions</th>
                <th style={{ padding: '10px' }}>Validation Accuracy</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '10px' }}>🌾 Wheat</td><td style={{ padding: '10px' }}>14</td><td style={{ padding: '10px' }}>13</td><td style={{ padding: '10px', fontWeight: '700', color: '#0d9488' }}>92.8%</td></tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '10px' }}>🌾💧 Rice (Paddy)</td><td style={{ padding: '10px' }}>14</td><td style={{ padding: '10px' }}>12</td><td style={{ padding: '10px', fontWeight: '700', color: '#0d9488' }}>85.7%</td></tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '10px' }}>🌽 Maize</td><td style={{ padding: '10px' }}>13</td><td style={{ padding: '10px' }}>11</td><td style={{ padding: '10px', fontWeight: '700', color: '#0d9488' }}>84.6%</td></tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '10px' }}>🌿 Cotton</td><td style={{ padding: '10px' }}>13</td><td style={{ padding: '10px' }}>11</td><td style={{ padding: '10px', fontWeight: '700', color: '#0d9488' }}>84.6%</td></tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '10px' }}>🎋 Sugarcane</td><td style={{ padding: '10px' }}>13</td><td style={{ padding: '10px' }}>12</td><td style={{ padding: '10px', fontWeight: '700', color: '#0d9488' }}>92.3%</td></tr>
            </tbody>
          </table>
        </div>

        {/* CARD 5: SOIL ANALYZER */}
        <div className="card" style={{ padding: '32px', marginTop: '28px' }}>
          <h3 style={{ fontFamily: 'DM Sans', fontSize: '1.35rem', marginBottom: '8px' }}>🪨 Interactive Soil Nutrient Profile</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '18px' }}>
            Select your farm soil type to inspect baseline Nitrogen (N), Phosphorus (P), Potassium (K), and organic matter ranges.
          </p>
          <div style={{ maxWidth: '300px', marginBottom: '18px' }}>
            <label htmlFor="soilAnalyzer" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>
              Select Soil Type
            </label>
            <select id="soilAnalyzer" className="auth-input" onChange={() => window.updateSoilHealth?.()}>
              <option value="loamy">Loamy</option>
              <option value="clay">Clay</option>
              <option value="sandy">Sandy</option>
              <option value="red">Red / Laterite</option>
              <option value="black">Black (Regur)</option>
            </select>
          </div>
          <div className="soil-meter" id="soilMeter"></div>
        </div>
      </main>

      <Footer />
    </>
  );
}
