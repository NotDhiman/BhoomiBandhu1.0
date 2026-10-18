// Migrated from the original gemini-advisor.html page script. Runs after React mounts the page.
export function initGeminiAdvisor() {
  (() => {

/* ============================================================
   GEMINI CHAT – BhoomiBandhu AI Farming Advisor
   ============================================================ */

const API_BASE = window.location.port === "3000" ? "" : "http://localhost:3000";

let chatHistory   = [];   // [{role, text}]  — for context window
let questionHistory = []; // sidebar history list
let isThinking    = false;

/* ── Helpers ──────────────────────────────────────────────── */
function getContext() {
  const soil   = document.getElementById("ctxSoil").value;
  const season = document.getElementById("ctxSeason").value;
  const state  = document.getElementById("ctxState").value;
  const irr    = document.getElementById("ctxIrr").value;
  const crop   = document.getElementById("ctxCrop").value.trim();
  const parts  = [];
  if (soil)   parts.push(`Soil: ${soil}`);
  if (season) parts.push(`Season: ${season}`);
  if (state)  parts.push(`Region: ${state}`);
  if (irr)    parts.push(`Irrigation: ${irr}`);
  if (crop)   parts.push(`Main crop: ${crop}`);
  return parts.length ? `[Farm context — ${parts.join(" | ")}]\n\n` : "";
}

function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 140) + "px";
}

function handleKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

/* ── Render helpers ───────────────────────────────────────── */
function appendMessage(role, text, isTyping = false) {
  const window  = document.getElementById("chatWindow");
  const isUser  = role === "user";
  const div     = document.createElement("div");
  div.className = `msg ${isUser ? "user" : "bot"}`;
  div.id        = isTyping ? "typingMsg" : "";

  const avatar  = isUser ? "👨‍🌾" : "🤖";
  const bubble  = isTyping
    ? `<div class="bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`
    : `<div class="bubble">${text}</div>`;

  div.innerHTML = `<div class="avatar">${avatar}</div>${bubble}`;
  window.appendChild(div);
  window.scrollTop = window.scrollHeight;
  return div;
}

function removeTyping() {
  const el = document.getElementById("typingMsg");
  if (el) el.remove();
}

/* Typewriter into existing bubble */
function typeText(div, text) {
  const bubble = div.querySelector(".bubble");
  bubble.textContent = "";
  let i = 0;
  return new Promise(resolve => {
    const timer = setInterval(() => {
      bubble.textContent += text[i++];
      document.getElementById("chatWindow").scrollTop = 9999;
      if (i >= text.length) { clearInterval(timer); resolve(); }
    }, 16);
  });
}

/* ── Add to history sidebar ───────────────────────────────── */
function addToHistory(question) {
  questionHistory.unshift(question);
  if (questionHistory.length > 20) questionHistory.pop();
  const list = document.getElementById("historyList");
  list.innerHTML = questionHistory.map((q, i) =>
    `<div class="history-item" onclick="injectQuestion({textContent:\`${q.replace(/`/g,"'")}\`})">${q.slice(0, 55)}…</div>`
  ).join("");
}

/* ── Inject question from chips/sidebar ───────────────────── */
function injectQuestion(el) {
  const input = document.getElementById("chatInput");
  input.value = el.textContent.trim();
  autoResize(input);
  input.focus();
}

/* ── Ask about a scheme ───────────────────────────────────── */
function askScheme(name) {
  const q = `${name} yojana ke baare mein details batao — kya hai, kaise apply karein, kon eligible hai, aur kitna benefit milta hai?`;
  document.getElementById("chatInput").value = q;
  autoResize(document.getElementById("chatInput"));
  sendMessage();
}

/* ── MAIN SEND ────────────────────────────────────────────── */
async function sendMessage() {
  if (isThinking) return;
  const input   = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const errEl   = document.getElementById("chatError");
  const question = input.value.trim();
  if (!question) return;

  // Clear welcome message on first use
  const welcome = document.querySelector(".welcome-msg");
  if (welcome) welcome.remove();

  // Show user bubble
  appendMessage("user", question);
  addToHistory(question);
  chatHistory.push({ role:"user", text:question });
  input.value = "";
  autoResize(input);
  errEl.className = "chat-error";

  // Typing indicator
  isThinking = true;
  sendBtn.disabled = true;
  appendMessage("bot", "", true);

  // Build full prompt with context + last 4 exchanges for memory
  const ctx = getContext();
  const memory = chatHistory.slice(-8).map(m =>
    m.role === "user" ? `Farmer: ${m.text}` : `AI: ${m.text}`
  ).join("\n");
  const fullPrompt = `${ctx}Conversation so far:\n${memory}\n\nFarmer's latest question: ${question}`;

  try {
    const res  = await fetch(`${API_BASE}/api/gemini`, {
      method  : "POST",
      headers : { "Content-Type": "application/json" },
      body    : JSON.stringify({ prompt: fullPrompt })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "AI API error");

    removeTyping();
    const botDiv = appendMessage("bot", "");
    await typeText(botDiv, data.reply);
    chatHistory.push({ role:"bot", text:data.reply });

  } catch(err) {
    removeTyping();
    errEl.textContent = "⚠️ " + err.message +
      " — Ensure Node server is running (npm start) and GROQ_API_KEY is in .env";
    errEl.className = "chat-error show";
  } finally {
    isThinking       = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

/* ── Clear chat ───────────────────────────────────────────── */
function clearChat() {
  chatHistory = [];
  const win = document.getElementById("chatWindow");
  win.innerHTML = `
    <div class="welcome-msg">
      <div class="w-emoji">🌾</div>
      <h3>Chat cleared! Dobara poochhein 🙏</h3>
      <p>Apne khet, mitti, fasal, keede ya sarkar ki yojna ke baare mein kuch bhi poochh sakte ho.</p>
    </div>`;
}

    if (typeof getContext === "function") window.getContext = getContext;
    if (typeof autoResize === "function") window.autoResize = autoResize;
    if (typeof handleKey === "function") window.handleKey = handleKey;
    if (typeof appendMessage === "function") window.appendMessage = appendMessage;
    if (typeof removeTyping === "function") window.removeTyping = removeTyping;
    if (typeof typeText === "function") window.typeText = typeText;
    if (typeof addToHistory === "function") window.addToHistory = addToHistory;
    if (typeof injectQuestion === "function") window.injectQuestion = injectQuestion;
    if (typeof askScheme === "function") window.askScheme = askScheme;
    if (typeof sendMessage === "function") window.sendMessage = sendMessage;
    if (typeof clearChat === "function") window.clearChat = clearChat;
  })();
}
