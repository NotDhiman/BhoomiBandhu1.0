import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { initCommon } from '../legacy/common.js';
import { initMentalHealth } from '../legacy/mental-health.js';

export default function MentalHealthPage() {
  useEffect(() => {
    const pageClass = 'page-mental-health';
    document.body.classList.add(pageClass);
    initCommon();
    initMentalHealth();
    return () => document.body.classList.remove(pageClass);
  }, []);
  return (
    <>
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
<Link to={"/gemini-advisor"}>💬 AI Chat</Link>
<Link to={"/mental-health"}>Mental Health</Link>
<a href={"#"} onClick={(event) => window.toggleTheme?.()}>🌙</a>
</nav>
</div>
</header>
<section className={"hero"}>
<div className={"hero-content"}>
<span className={"hero-badge"}>🧠 Farmer Well-Being</span>
<h1>Mental Health Support</h1>
<p>Because farmers matter beyond crops</p>
<div className={"hero-stats"}>
<div><strong>24×7</strong><span>Support</span></div>
<div><strong>Stress</strong><span>Relief</span></div>
<div><strong>Care</strong><span>Community</span></div>
</div>
</div>
</section>
<section className={"section container"}>
<h2>Why Mental Health Matters</h2>
<p style={{"maxWidth": "900px", "margin": "auto", "color": "#4f6f57", "lineHeight": "1.8"}}>
    Farmers face constant pressure due to crop uncertainty, debt,
    weather conditions, and social expectations. Mental well-being
    is as important as financial stability. BhoomiBandhu aims to
    provide emotional support, awareness, and access to help
    in times of stress.
  </p>
</section>
<section className={"section container"}>
<h2>Our Mental Health Support Services</h2>
<div className={"grid"}>
<div className={"card"}>
<h3>Stress & Anxiety Management</h3>
<p>
        Practical techniques and guidance to manage stress related
        to farming risks, loans, and crop losses.
      </p>
</div>
<div className={"card"}>
<h3>Helpline & Emergency Support</h3>
<p>
        Information about farmer helplines and professional support
        services available across India.
      </p>
</div>
<div className={"card"}>
<h3>Community & Awareness</h3>
<p>
        Encouraging open conversations, awareness programs,
        and community-driven care for farmers.
      </p>
</div>
</div>
</section>
<section className={"section container"}>
<h2>Reach Out for Support</h2>
<p className={"support-intro"}>
    If you or someone you know is feeling overwhelmed, stressed, or anxious,
    help is available. Reaching out can make a real difference.
  </p>
<div className={"support-grid"}>
{/*  Helpline Card  */}
<div className={"support-card helpline-card"}>
<h3>📞 Farmer & Mental Health Helplines</h3>
<ul>
<li><strong>Kisan Call Centre:</strong> 1800-180-1551</li>
<li><strong>Tele MANAS (Mental Health):</strong> 14416</li>
<li><strong>Suicide Prevention:</strong> 9152987821</li>
<li><strong>Availability:</strong> 24×7 Confidential Support</li>
</ul>
<p className={"helpline-note"}>
        All calls are confidential and handled by trained professionals.
      </p>
</div>
{/*  Contact Form Card  */}
<div className={"support-card form-card"}>
<h3>🧑‍⚕️ Talk to a Support Counselor</h3>
<form id={"mentalContactForm"} className={"support-form"}>
<div className={"form-row"}>
<input type={"text"} id={"mhName"} placeholder={"Your Name"} required={true} />
<input type={"tel"} id={"mhPhone"} placeholder={"Mobile Number"} required={true} />
</div>
<select id={"mhIssue"} required={true}>
<option value={""}>Select Concern</option>
<option>Stress & Anxiety</option>
<option>Financial Pressure</option>
<option>Crop Loss Stress</option>
<option>Family or Personal Issues</option>
</select>
<textarea id={"mhMessage"} placeholder={"Briefly describe how you are feeling"} rows={"4"}></textarea>
<button type={"submit"} className={"btn full-btn"}>
          Request Support
        </button>
</form>
<p id={"mhResult"} className={"contact-result"}></p>
</div>
</div>
</section>
<footer>© 2025 BhoomiBandhu</footer>
    </>
  );
}
