import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { initCommon } from '../legacy/common.js';
import { initPmfbyEnrollment } from '../legacy/pmfby-enrollment.js';

export default function PmfbyEnrollmentPage() {
  useEffect(() => {
    const pageClass = 'page-pmfby-enrollment';
    document.body.classList.add(pageClass);
    initCommon();
    initPmfbyEnrollment();
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
<h1>PMFBY Enrollment Support</h1>
<p>Guided assistance to enroll under Pradhan Mantri Fasal Bima Yojana</p>
</section>
<section className={"section container"}>
<h2>What We Help With</h2>
<div className={"grid"}>
<div className={"card"}>Eligibility verification</div>
<div className={"card"}>Crop & land detail verification</div>
<div className={"card"}>Premium calculation</div>
<div className={"card"}>Application submission guidance</div>
</div>
</section>
<section className={"section container"}>
<h2>Required Information</h2>
<div className={"card"}>
<ul>
<li>Aadhaar-linked bank account</li>
<li>Land records</li>
<li>Crop details</li>
<li>Sowing date</li>
</ul>
</div>
</section>
<footer>© 2025 BhoomiBandhu</footer>
    </>
  );
}
