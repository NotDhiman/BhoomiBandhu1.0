import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { initCommon } from '../legacy/common.js';
import { initClaimFiling } from '../legacy/claim-filing.js';

export default function ClaimFilingPage() {
  useEffect(() => {
    const pageClass = 'page-claim-filing';
    document.body.classList.add(pageClass);
    initCommon();
    initClaimFiling();
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
<h1>Claim Filing Support</h1>
<p>Step-by-step help to file insurance claims correctly</p>
</section>
<section className={"section container"}>
<h2>Claim Filing Process</h2>
<div className={"grid"}>
<div className={"card"}>Crop loss intimation</div>
<div className={"card"}>Document collection</div>
<div className={"card"}>Online claim submission</div>
<div className={"card"}>Follow-up support</div>
</div>
</section>
<section className={"section container"}>
<h2>Common Mistakes We Help Avoid</h2>
<div className={"card"}>
<ul>
<li>Late claim submission</li>
<li>Incorrect land details</li>
<li>Missing documents</li>
</ul>
</div>
</section>
<footer>© 2025 BhoomiBandhu</footer>
    </>
  );
}
