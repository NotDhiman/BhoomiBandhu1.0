import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
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
<Link to={"/ml-crop-advisor"}>🤖 ML Advisor</Link>
<Link to={"/gemini-advisor"} style={{"color": "var(--green)", "fontWeight": "700"}}>💬 AI Chat</Link>
<Link to={"/mental-health"}>Mental Health</Link>
<a href={"#"} onClick={(event) => window.toggleTheme?.()}>🌙</a>
</nav>
</div>
</header>
{/*  HERO  */}
<section className={"hero"}>
<div className={"hero-content"}>
<span className={"hero-badge"}>✨ Powered by BhoomiBandhu AI Advisor</span>
<h1>AI Farming Advisor</h1>
<p>Ask anything about crops, soil, weather, pest control & government schemes</p>
<div className={"hero-stats"}>
<div><strong>Gemini</strong><span>AI Engine</span></div>
<div><strong>24/7</strong><span>Available</span></div>
<div><strong>Hindi</strong><span>+ English</span></div>
<div><strong>Free</strong><span>To Use</span></div>
</div>
</div>
</section>
{/*  TICKER  */}
<div className={"scheme-ticker"}>
<div className={"scheme-track"}>
<span>✨ Ask in Hindi, Hinglish, or English — Gemini understands all</span>
<span>🌾 Crop advice · 🪲 Pest control · 💧 Irrigation · 📋 Schemes · 💰 Loans</span>
<span>🧠 Context-aware: set your soil type and season for tailored answers</span>
<span>📜 Chat history saved during session — click any past question to re-ask</span>
</div>
</div>
{/*  AI STATS  */}
<div className={"ai-stats"}>
<div className={"ai-stat"}><strong>Gemini</strong><span>1.5 Flash</span></div>
<div className={"ai-stat"}><strong>600</strong><span>Max tokens/reply</span></div>
<div className={"ai-stat"}><strong>Hindi</strong><span>Language support</span></div>
<div className={"ai-stat"}><strong>Agro</strong><span>Specialist prompt</span></div>
<div className={"ai-stat"}><strong>Secure</strong><span>Key on server</span></div>
</div>
{/*  MAIN CHAT SHELL  */}
<div className={"chat-shell"}>
{/*  ── LEFT SIDEBAR ──  */}
<aside className={"chat-sidebar"}>
{/*  Quick questions  */}
<div className={"sidebar-card"}>
<h4>⚡ Quick Questions</h4>
<div className={"topic-chips"}>
<button className={"topic-chip"} onClick={(event) => window.injectQuestion?.(event.currentTarget)}>🌾 Kharif season mein best crop kaunsa hai mere loamy soil ke liye?</button>
<button className={"topic-chip"} onClick={(event) => window.injectQuestion?.(event.currentTarget)}>🦟 Wheat mein aphid ka treatment kya hai?</button>
<button className={"topic-chip"} onClick={(event) => window.injectQuestion?.(event.currentTarget)}>💧 Drip irrigation kab use karein aur kab flood irrigation?</button>
<button className={"topic-chip"} onClick={(event) => window.injectQuestion?.(event.currentTarget)}>🧪 Urea aur DAP mein kya difference hai?</button>
<button className={"topic-chip"} onClick={(event) => window.injectQuestion?.(event.currentTarget)}>🌧 Kam rainfall mein konsi crops achi hoti hain?</button>
<button className={"topic-chip"} onClick={(event) => window.injectQuestion?.(event.currentTarget)}>📈 Rice yield kaise badhayein?</button>
<button className={"topic-chip"} onClick={(event) => window.injectQuestion?.(event.currentTarget)}>🐛 Cotton bollworm se kaise bachayein?</button>
<button className={"topic-chip"} onClick={(event) => window.injectQuestion?.(event.currentTarget)}>🌱 Organic farming kaise shuru karein?</button>
</div>
</div>
{/*  Farming context  */}
<div className={"sidebar-card"}>
<h4>🗂 My Farm Context</h4>
<p style={{"fontSize": ".78rem", "color": "var(--text-muted)", "marginBottom": "14px"}}>Set these so AI gives personalised answers.</p>
<div className={"ctx-group"}>
<label>🪨 Soil Type</label>
<select id={"ctxSoil"}>
<option value={""}>-- Select --</option>
<option value={"loamy"}>Loamy</option>
<option value={"clay"}>Clay</option>
<option value={"sandy"}>Sandy</option>
<option value={"red"}>Red / Laterite</option>
<option value={"black"}>Black (Regur)</option>
</select>
</div>
<div className={"ctx-group"}>
<label>☀️ Current Season</label>
<select id={"ctxSeason"}>
<option value={""}>-- Select --</option>
<option value={"Kharif"}>Kharif (Jun–Oct)</option>
<option value={"Rabi"}>Rabi (Oct–Mar)</option>
<option value={"Zaid"}>Zaid (Mar–Jun)</option>
</select>
</div>
<div className={"ctx-group"}>
<label>📍 State / Region</label>
<select id={"ctxState"}>
<option value={""}>-- Select --</option>
<option>Maharashtra</option><option>Punjab</option><option>Haryana</option>
<option>Uttar Pradesh</option><option>Madhya Pradesh</option><option>Rajasthan</option>
<option>Gujarat</option><option>Andhra Pradesh</option><option>Karnataka</option>
<option>Bihar</option><option>West Bengal</option><option>Tamil Nadu</option>
<option>Odisha</option><option>Telangana</option><option>Jharkhand</option>
</select>
</div>
<div className={"ctx-group"}>
<label>💧 Irrigation Type</label>
<select id={"ctxIrr"}>
<option value={""}>-- Select --</option>
<option value={"Irrigated"}>Irrigated (canal/tube well)</option>
<option value={"Rain-fed"}>Rain-fed only</option>
<option value={"Drip"}>Drip / Sprinkler</option>
</select>
</div>
<div className={"ctx-group"}>
<label>🌾 Main Crop</label>
<input type={"text"} id={"ctxCrop"} placeholder={"e.g. Wheat, Rice, Cotton"} />
</div>
</div>
{/*  Government schemes  */}
<div className={"sidebar-card"}>
<h4>📋 Ask About Schemes</h4>
<div className={"scheme-badges"}>
<div className={"scheme-badge"} onClick={(event) => window.askScheme?.('PM-KISAN')}>🌿 PM-KISAN – ₹6000/year support</div>
<div className={"scheme-badge"} onClick={(event) => window.askScheme?.('PMFBY')}>🛡️ PMFBY – Crop Insurance</div>
<div className={"scheme-badge"} onClick={(event) => window.askScheme?.('KCC')}>💳 KCC – Kisan Credit Card</div>
<div className={"scheme-badge"} onClick={(event) => window.askScheme?.('eNAM')}>📦 eNAM – Online Mandi</div>
<div className={"scheme-badge"} onClick={(event) => window.askScheme?.('PKVY')}>🌱 PKVY – Organic Farming</div>
</div>
</div>
{/*  Session history  */}
<div className={"sidebar-card"}>
<h4>🕒 This Session</h4>
<div className={"history-list"} id={"historyList"}>
<div style={{"fontSize": ".8rem", "color": "var(--text-muted)", "textAlign": "center", "padding": "10px 0"}}>No questions yet</div>
</div>
<button className={"chat-action-btn"} style={{"marginTop": "12px", "width": "100%"}} onClick={(event) => window.clearChat?.()}>🗑 Clear Chat</button>
</div>
</aside>
{/*  ── MAIN CHAT ──  */}
<div className={"chat-main"}>
{/*  Chat window  */}
<div className={"chat-window"} id={"chatWindow"}>
<div className={"welcome-msg"}>
<div className={"w-emoji"}>🌾</div>
<h3>Namaste! Main BhoomiBandhu AI hun 🙏</h3>
<p>Apne khet, mitti, fasal, keede ya sarkar ki yojna ke baare mein kuch bhi poochh sakte ho.<br /><br />
        Left side mein apna farm context set karein for personalised answers.</p>
</div>
</div>
{/*  Input bar  */}
<div className={"chat-input-bar"}>
<textarea id={"chatInput"} placeholder={"Apna sawaal yahaan likhein… (Hindi, Hinglish ya English)"} rows={"1"} onKeyDown={(event) => window.handleKey?.(event)} onInput={(event) => window.autoResize?.(event.currentTarget)}></textarea>
<button className={"send-btn"} id={"sendBtn"} onClick={(event) => window.sendMessage?.()} title={"Send"}>➤</button>
</div>
{/*  Quick action chips below input  */}
<div className={"chat-actions"}>
<button className={"chat-action-btn"} onClick={(event) => window.injectQuestion?.({textContent:'Meri fasal ke liye aaj ka weather kaisa hai?'})}>🌦 Weather advice</button>
<button className={"chat-action-btn"} onClick={(event) => window.injectQuestion?.({textContent:'Soil health improve karne ke 5 tips batao'})}>🪨 Soil tips</button>
<button className={"chat-action-btn"} onClick={(event) => window.injectQuestion?.({textContent:'Is season mein kaun se keede zyada hote hain aur bachao kaise karein?'})}>🦟 Pest alert</button>
<button className={"chat-action-btn"} onClick={(event) => window.injectQuestion?.({textContent:'Fertiliser schedule kya hona chahiye mere crop ke liye?'})}>🧪 Fertiliser plan</button>
<button className={"chat-action-btn"} onClick={(event) => window.injectQuestion?.({textContent:'Government se loan kaise lein kisan?'})}>💰 Kisan loan</button>
</div>
{/*  Error banner  */}
<div className={"chat-error"} id={"chatError"}></div>
</div>
</div>{/*  /chat-shell  */}
<footer>© 2025 BhoomiBandhu · AI Advisor powered by the BhoomiBandhu AI advisor</footer>
    </>
  );
}
