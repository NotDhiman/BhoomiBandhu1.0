import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { initCommon } from '../legacy/common.js';
import { initIndex } from '../legacy/index.js';

export default function IndexPage() {
  useEffect(() => {
    const pageClass = 'page-index';
    document.body.classList.add(pageClass);
    initCommon();
    initIndex();
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
<div className={"scheme-ticker"}>
<div className={"scheme-track"}>
<span>🌾 PMFBY: Crop insurance enrollment open for Kharif season</span>
<span>💰 KCC Loan: Interest subsidy extended till March 2026</span>
<span>🚜 Subsidy: 50% subsidy on agricultural equipment announced</span>
<span>📢 Scheme: New irrigation support scheme launched for small farmers</span>
</div>
</div>
{/*  paste common header here  */}
<section className={"hero-secondary animate-hero"}>
<h1>A Trusted Friend for Every Farmer</h1>
<p className={"hero-tagline"}>
    Financial, mental & crop protection support
  </p>
</section>
<section className={"section container"}>
<h2>Our Core Services</h2>
<div className={"grid"}>
<Link to={"/financial"} className={"card"}>
<h3>Financial Support</h3>
<p>Loan guidance, subsidies and debt management for farmers.</p>
</Link>
<Link to={"/insurance"} className={"card"}>
<h3>Crop Insurance</h3>
<p>Protect crops with PMFBY and risk coverage support.</p>
</Link>
<Link to={"/ml-crop-advisor"} className={"card"}>
<h3>🤖 ML Crop Advisor</h3>
<p>kNN machine learning model trained on 120 samples — finds your nearest crop match by distance.</p>
</Link>
<Link to={"/gemini-advisor"} className={"card"}>
<h3>💬 AI Farming Chat</h3>
<p>Ask anything in Hindi or English — Google BhoomiBandhu AI answers crop, soil, scheme & pest questions.</p>
</Link>
<Link to={"/mental-health"} className={"card"}>
<h3>Mental Health Support</h3>
<p>Stress relief, helpline access and community care.</p>
</Link>
</div>
</section>
<footer>© 2025 BhoomiBandhu</footer>
    </>
  );
}
