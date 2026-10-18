import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { initCommon } from '../legacy/common.js';
import { initInsurance } from '../legacy/insurance.js';

export default function InsurancePage() {
  useEffect(() => {
    const pageClass = 'page-insurance';
    document.body.classList.add(pageClass);
    initCommon();
    initInsurance();
    return () => document.body.classList.remove(pageClass);
  }, []);
  return (
    <>
      {/*  ===== HEADER =====  */}
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
{/*  ===== HERO =====  */}
<section className={"hero-secondary animate-hero insurance-hero"}>
<h1>Crop Insurance<br />Support</h1>
<p className={"hero-tagline"}>
    Protect your crops against natural risks with government-backed insurance and guided claim support.
  </p>
</section>
{/*  ===== INTRO =====  */}
<section className={"section container"}>
<h2>Why Crop Insurance Matters</h2>
<p style={{"maxWidth": "900px", "margin": "auto", "color": "#4f6f57", "lineHeight": "1.8"}}>
    Crop losses due to droughts, floods, pests, and unpredictable weather
    can severely impact farmers’ income. Crop insurance provides financial
    protection and stability by covering losses and ensuring farmers can
    recover and continue farming without falling into debt.
  </p>
</section>
{/*  ===== INSURANCE SERVICES =====  */}
<section className={"section container"}>
<h2>Our Insurance Support Services</h2>
<div className={"grid"}>
<div className={"card"}>
<Link to={"/pmfby-enrollment"} className={"card"}><h3>PMFBY Enrollment</h3></Link>
<p>
        Assistance in enrolling under Pradhan Mantri Fasal Bima Yojana (PMFBY)
        with correct crop and land details.
      </p>
</div>
<div className={"card"}>
<Link to={"/risk-awareness"} className={"card"}><h3>Risk Awareness</h3></Link>
<p>
        Information on weather-related risks and how insurance coverage
        protects against them.
      </p>
</div>
<div className={"card"}>
<Link to={"/claim-filing"} className={"card"}><h3>Claim Filing Support</h3></Link>
<p>
        Step-by-step guidance to file insurance claims accurately and on time.
      </p>
</div>
<div className={"card"}>
<Link to={"/status-tracking"} className={"card"}><h3>Status Tracking</h3></Link>
<p>
        Help in tracking claim status and resolving delays or issues.
      </p>
</div>
</div>
</section>
{/*  ===== APPLY / CLAIM FORM =====  */}
<section className={"section container"}>
<h2>Apply for Crop Insurance / Claim Support</h2>
<div className={"card"}>
<form id={"insuranceForm"}>
<div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "16px"}}>
<input type={"text"} id={"farmerName"} placeholder={"Farmer Name"} required={true} />
<input type={"tel"} id={"mobile"} placeholder={"Mobile Number"} pattern={"[0-9+() -]{7,20}"} required={true} />
</div>
<div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "16px", "marginTop": "16px"}}>
<input type={"text"} id={"district"} placeholder={"District / Location"} required={true} />
<select id={"state"} required={true}>
<option value={""}>Select State</option><option>Haryana</option><option>Punjab</option><option>Uttar Pradesh</option><option>Rajasthan</option><option>Bihar</option><option>Madhya Pradesh</option><option>Other</option>
</select>
</div>
<div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "16px", "marginTop": "16px"}}>
<input type={"text"} id={"crop"} placeholder={"Crop Name"} required={true} />
<select id={"requestType"} required={true}>
<option value={""}>Select Request Type</option>
<option>New Insurance Enrollment</option>
<option>Crop Loss Claim</option>
</select>
</div>
<textarea id={"issue"} placeholder={"Describe crop loss or insurance requirement"} style={{"marginTop": "16px"}} required={true}></textarea>
<button type={"submit"} className={"btn"}>Submit Request</button>
<p id={"insuranceMessage"} style={{"marginTop": "16px", "fontWeight": "500"}}></p>
</form>
</div>
</section>
{/*  ===== FOOTER =====  */}
<footer>
  © 2025 BhoomiBandhu. All rights reserved.
</footer>
{/*  ===== JS =====  */}
    </>
  );
}
