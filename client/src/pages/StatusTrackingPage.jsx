import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { initCommon } from '../legacy/common.js';
import { initStatusTracking } from '../legacy/status-tracking.js';

export default function StatusTrackingPage() {
  useEffect(() => {
    const pageClass = 'page-status-tracking';
    document.body.classList.add(pageClass);
    initCommon();
    initStatusTracking();
    return () => document.body.classList.remove(pageClass);
  }, []);
  return (
    <>
      <header>
<div className={"container header-flex"}>
<div className={"logo"}>
<img src={"/assets/Gemini_Generated_Image_7lty6p7lty6p7lty-removebg-preview.png"} />
<span>BhoomiBandhu</span>
</div>
<nav>
<Link to={"/"}>Home</Link>
<Link to={"/insurance"}>Insurance</Link>
</nav>
</div>
</header>
<section className={"hero"}>
<h1>Claim Status Tracking</h1>
<p>Track your insurance claim and resolve issues faster</p>
</section>
<section className={"section container"}>
<h2>What We Track</h2>
<div className={"grid"}>
<div className={"card"}>Application status</div>
<div className={"card"}>Survey updates</div>
<div className={"card"}>Approval progress</div>
<div className={"card"}>Payment release</div>
</div>
</section>
<section className={"section container"}>
<h2>Support in Case of Delay</h2>
<p style={{"maxWidth": "900px", "margin": "auto", "color": "#4f6f57"}}>
    We assist farmers in understanding delays and guide them on the
    correct steps to resolve issues with authorities.
  </p>
</section>
<section className={"section container"}>
<h2>Track Your Saved Insurance Requests</h2>
<p>Enter the mobile number used on the insurance application form.</p>
<form id={"statusLookupForm"} style={{"display": "flex", "gap": "12px", "flexWrap": "wrap", "maxWidth": "680px", "margin": "18px auto"}}>
<input id={"trackingMobile"} type={"tel"} placeholder={"Mobile Number"} pattern={"[0-9+() -]{7,20}"} required={true} style={{"flex": "1", "minWidth": "220px", "padding": "12px", "border": "1px solid #cbd5cf", "borderRadius": "8px"}} />
<button className={"btn"} type={"submit"}>Find Requests</button>
</form>
<p id={"trackingStatus"} role={"status"} style={{"textAlign": "center"}}></p>
<div id={"trackingResults"} style={{"overflowX": "auto"}}></div>
</section>
<footer>© 2025 BhoomiBandhu</footer>
    </>
  );
}
