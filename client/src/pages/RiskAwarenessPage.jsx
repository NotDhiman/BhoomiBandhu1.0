import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { initCommon } from '../legacy/common.js';
import { initRiskAwareness } from '../legacy/risk-awareness.js';

export default function RiskAwarenessPage() {
  useEffect(() => {
    const pageClass = 'page-risk-awareness';
    document.body.classList.add(pageClass);
    initCommon();
    initRiskAwareness();
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
<h1>Crop Risk Awareness</h1>
<p>Understand risks before they affect your crop</p>
</section>
<section className={"section container"}>
<h2>Types of Agricultural Risks</h2>
<div className={"grid"}>
<div className={"card"}>Drought & water scarcity</div>
<div className={"card"}>Floods & heavy rainfall</div>
<div className={"card"}>Pest & disease attacks</div>
<div className={"card"}>Temperature variations</div>
</div>
</section>
<section className={"section container"}>
<h2>Why Insurance Matters</h2>
<p style={{"maxWidth": "900px", "margin": "auto", "color": "#4f6f57"}}>
    Awareness of risks helps farmers choose suitable insurance coverage
    and avoid financial shocks during crop loss.
  </p>
</section>
<footer>© 2025 BhoomiBandhu</footer>
    </>
  );
}
