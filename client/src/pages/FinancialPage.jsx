import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { initCommon } from '../legacy/common.js';
import { initFinancial } from '../legacy/financial.js';

export default function FinancialPage() {
  useEffect(() => {
    const pageClass = 'page-financial';
    document.body.classList.add(pageClass);
    initCommon();
    initFinancial();
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
<section className={"hero"}>
<div className={"hero-content"}>
<span className={"hero-badge"}>💰 Smart Finance</span>
<h1>Financial Support for Farmers</h1>
<p>Loans, subsidies & financial stability guidance</p>
<div className={"hero-stats"}>
<div><strong>Low</strong><span>Interest</span></div>
<div><strong>Safe</strong><span>Planning</span></div>
<div><strong>Trusted</strong><span>Advice</span></div>
</div>
</div>
</section>
{/*  ===== SERVICES =====  */}
<section className={"section container"}>
<h2>Our Financial Services</h2>
<div className={"grid"}>
<div className={"card"}>
<h3>Loan Guidance</h3>
<p>
        We help farmers choose suitable agricultural loans from banks
        and cooperatives with low interest rates and flexible repayment
        options.
      </p>
</div>
<div className={"card"}>
<h3>Debt Management</h3>
<p>
        Structured planning to manage existing loans, avoid
        high-interest lenders, and reduce financial stress.
      </p>
</div>
<div className={"card"}>
<h3>Subsidy & Grant Support</h3>
<p>
        Assistance in identifying eligible government subsidies and
        preparing accurate applications.
      </p>
</div>
<div className={"card"}>
<h3>Financial Literacy</h3>
<p>
        Simple explanations of savings, insurance, interest rates and
        repayment planning for informed decisions.
      </p>
</div>
</div>
</section>
{/*  ===== LOAN APPLICATION FORM =====  */}
<section className={"section container"}>
<h2>Apply for Agricultural Loan</h2>
<div className={"card"}>
<form id={"loanForm"}>
<div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "16px"}}>
<input type={"text"} id={"name"} placeholder={"Farmer Name"} required={true} />
<input type={"tel"} id={"mobile"} placeholder={"Mobile Number"} pattern={"[0-9+() -]{7,20}"} required={true} />
</div>
<div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "16px", "marginTop": "16px"}}>
<input type={"text"} id={"village"} placeholder={"Village / Location"} required={true} />
<select id={"state"} required={true}>
<option value={""}>Select State</option><option>Haryana</option><option>Punjab</option><option>Uttar Pradesh</option><option>Rajasthan</option><option>Bihar</option><option>Madhya Pradesh</option><option>Other</option>
</select>
</div>
<div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "16px", "marginTop": "16px"}}>
<input type={"number"} id={"amount"} placeholder={"Loan Amount (₹)"} min={"1"} step={"0.01"} required={true} />
<select id={"loanType"} required={true}>
<option value={""}>Select Loan Type</option>
<option>Crop Loan</option>
<option>Equipment Loan</option>
<option>Irrigation Loan</option>
<option>Dairy / Livestock Loan</option>
</select>
</div>
<textarea id={"purpose"} placeholder={"Purpose of Loan (e.g. seeds, tractor, irrigation)"} style={{"marginTop": "16px"}} required={true}></textarea>
<button type={"submit"} className={"btn"}>Submit Application</button>
<p id={"formMessage"} style={{"marginTop": "16px", "fontWeight": "500"}}></p>
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
