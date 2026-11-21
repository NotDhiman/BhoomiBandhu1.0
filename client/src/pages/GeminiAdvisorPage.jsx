import React, { useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { initCommon } from '../legacy/common.js';
import { initGeminiAdvisor } from '../legacy/gemini-advisor.js';
import pageCss from '../pageStyles/gemini-advisor.css?raw';

export default function GeminiAdvisorPage() {
  useEffect(() => {
    const pageClass = 'page-gemini-advisor';
    document.body.classList.add(pageClass);
    initCommon();
    initGeminiAdvisor();
    return () => document.body.classList.remove(pageClass);
  }, []);

  return (
    <>
      <style>{pageCss}</style>
      <Navbar />

      {/* HERO SECTION */}
      <section className="farmer-hero-section">
        <div className="container hero-container" style={{ padding: '50px 20px 36px', textAlign: 'center' }}>
          <div className="farmer-hero-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="hero-kicker-pill" style={{ margin: '0 auto 16px' }}>
              <span className="kicker-pulse" aria-hidden="true" />
              <span>24/7 AI Agricultural Doctor & Field Companion</span>
            </div>
            <h1 className="farmer-hero-title">BhoomiBandhu AI Farmer Chat</h1>
            <p className="farmer-hero-sub" style={{ margin: '0 auto' }}>
              Ask in simple Hindi, Hinglish, or English. Instant remedies for plant diseases, fertilizer calculations, pest diagnostics, and scheme queries.
            </p>
          </div>
        </div>
      </section>

      {/* CHAT INTERFACE WORKSPACE */}
      <div className="chat-shell">
        {/* LEFT SIDEBAR: CONTEXT & QUICK PROMPTS */}
        <aside className="chat-sidebar">
          {/* Farm Context Presets */}
          <div className="sidebar-card">
            <h4>🌾 Farm Context Filters</h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label htmlFor="ctxSoil" style={{ fontSize: '0.78rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Soil Type</label>
                <select id="ctxSoil" className="auth-input" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                  <option value="">Any / Not Specified</option>
                  <option value="Loamy Alluvial">Loamy (Alluvial)</option>
                  <option value="Black Cotton">Black Soil (Regur)</option>
                  <option value="Clay">Heavy Clay</option>
                  <option value="Sandy">Sandy Soil</option>
                  <option value="Red Laterite">Red Laterite</option>
                </select>
              </div>

              <div>
                <label htmlFor="ctxSeason" style={{ fontSize: '0.78rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Active Season</label>
                <select id="ctxSeason" className="auth-input" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                  <option value="">Current Season</option>
                  <option value="Kharif">Kharif (Monsoon)</option>
                  <option value="Rabi">Rabi (Winter)</option>
                  <option value="Zaid">Zaid (Summer)</option>
                </select>
              </div>

              <div>
                <label htmlFor="ctxState" style={{ fontSize: '0.78rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>State / Climate Zone</label>
                <select id="ctxState" className="auth-input" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                  <option value="">All India</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Bihar">Bihar</option>
                </select>
              </div>

              <div>
                <label htmlFor="ctxIrr" style={{ fontSize: '0.78rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Water Supply</label>
                <select id="ctxIrr" className="auth-input" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                  <option value="">Irrigated / Tube Well</option>
                  <option value="Rainfed">Rainfed (Barani)</option>
                  <option value="Canal">Canal Water</option>
                  <option value="Drip / Sprinkler">Micro-Irrigation (Drip)</option>
                </select>
              </div>

              <div>
                <label htmlFor="ctxCrop" style={{ fontSize: '0.78rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Primary Crop</label>
                <input
                  type="text"
                  id="ctxCrop"
                  className="auth-input"
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  placeholder="e.g. Wheat, Mustard, Paddy"
                />
              </div>
            </div>
          </div>

          {/* Instant Question Starters */}
          <div className="sidebar-card">
            <h4>💡 Quick Agronomic Topics</h4>
            <div className="topic-chips">
              <button
                type="button"
                className="topic-chip"
                onClick={() => window.setQuestion?.('Wheat me peela rathwa (yellow rust) ke lakshan aur ilaj kya hai?')}
              >
                🌾 Yellow Rust in Wheat (पीला रतुआ)
              </button>
              <button
                type="button"
                className="topic-chip"
                onClick={() => window.setQuestion?.('Mustard crop ke liye first irrigation kab karni chahiye aur kaunsa fertilizer de?')}
              >
                🌱 Mustard Irrigation & Urea Timing
              </button>
              <button
                type="button"
                className="topic-chip"
                onClick={() => window.setQuestion?.('Neem oil spray banane ki vidhi aur spray karne ka sahi samay?')}
              >
                🌿 Organic Neem Oil Spray Recipe
              </button>
              <button
                type="button"
                className="topic-chip"
                onClick={() => window.setQuestion?.('PM Fasal Bima Yojana me crop loss claim kaise register kare?')}
              >
                📜 PMFBY 72-Hour Loss Claim Guide
              </button>
            </div>
          </div>

          {/* Session History Sidebar Item */}
          <div className="sidebar-card">
            <h4>🕒 Recent Questions</h4>
            <ul id="historyList" style={{ paddingLeft: '18px', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li>Ask a question to see session logs here</li>
            </ul>
          </div>
        </aside>

        {/* RIGHT: CHAT CONTAINER */}
        <section className="chat-main">
          {/* Header Bar */}
          <div className="chat-header">
            <div className="chat-header-title">
              <div className="chat-status-dot"></div>
              <div>
                <h3 style={{ fontFamily: 'DM Sans', margin: 0, fontSize: '1.1rem' }}>BhoomiBandhu Agri AI Doctor</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Multilingual Assistant (Hindi / English / Dialects)</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '6px' }}
              onClick={() => window.clearChat?.()}
            >
              Reset Chat
            </button>
          </div>

          {/* Scrollable Conversation Stream */}
          <div className="chat-window" id="chatWindow">
            <div className="msg bot">
              <div className="avatar">🤖</div>
              <div className="bubble">
                <strong>Namaste Kisan Mitra! 🙏</strong>
                <p style={{ margin: '8px 0 0' }}>
                  Mai BhoomiBandhu ka AI Krishi Salahkar hoon. Aap mujhse fasal bimari, khad ki matra, beej upchar, mausam aur sarkari yojanaon ke bare me Hindi ya English me pooch sakte hain.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message Notice */}
          <div id="chatError" style={{ color: '#dc2626', padding: '0 24px', fontSize: '0.85rem', fontWeight: '500' }}></div>

          {/* Input & Action Bar */}
          <div className="chat-input-bar">
            <textarea
              id="chatInput"
              placeholder="Ask your agricultural question here… (e.g. 'Tamatar ke patte sukh rahe hain, kya spray karein?')"
              onInput={(e) => window.autoResize?.(e.target)}
              onKeyDown={(e) => window.handleKey?.(e)}
            ></textarea>
            <button
              type="button"
              id="sendBtn"
              onClick={() => window.sendMessage?.()}
            >
              Send
            </button>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
