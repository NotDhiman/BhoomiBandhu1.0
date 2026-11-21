import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { initCommon } from '../legacy/common.js';
import { initStorage } from '../legacy/storage.js';
import pageCss from '../pageStyles/storage.css?raw';

export default function StoragePage() {
  useEffect(() => {
    const pageClass = 'page-storage';
    document.body.classList.add(pageClass);
    initCommon();
    initStorage();
    return () => document.body.classList.remove(pageClass);
  }, []);
  return (
    <>
      <style>{pageCss}</style>
      <nav>
<h1 className={"storage-logo"}>
<img src={"/assets/Gemini_Generated_Image_7lty6p7lty6p7lty-removebg-preview.png"} alt={"BhoomiBandhu"} />
<span>Digital Storage Finder</span>
</h1>
<div>
<a href={"#"} onClick={(event) => window.showSection?.('home')}>Home</a>
<a href={"#"} onClick={(event) => window.showSection?.('storage')}>Storage</a>
<a href={"#"} onClick={(event) => window.showSection?.('schemes')}>Schemes</a>
<a href={"#"} onClick={(event) => window.showSection?.('booking')}>Booking</a>
<a href={"#"} onClick={(event) => window.showSection?.('profile')}>Profile</a>
<Link to={"/"}>BhoomiBandhu</Link>
</div>
</nav>
<div className={"scheme-ticker"}>
<div className={"ticker-track"}>
<span className={"ticker-item"}>📢 PM Kisan: ₹6000 annual income support for eligible farmers</span>
<span className={"ticker-item"}>🏬 Gramin Bhandaran Yojana: Subsidy for rural warehouse infrastructure</span>
<span className={"ticker-item"}>🌾 PM Fasal Bima Yojana: Crop insurance against natural calamities</span>
<span className={"ticker-item"}>🛒 e-NAM: Online national agricultural market for better price discovery</span>
</div>
</div>
{/*  HOME  */}
<section id={"home"} className={"active"}>
<div className={"home-hero"}>
<h2 className={"animated-title"}>
<span className={"from-left"}>DIGITAL</span>
<span className={"from-bottom"}>STORAGE</span>
<span className={"from-right"}>FINDER</span>
</h2>
<p className={"hero-desc slide-from-right"}>

                A <strong>digital storage management platform</strong> designed to help farmers
                <strong>locate nearby storage facilities</strong>, <strong>estimate costs accurately</strong>,
                <strong>reduce post-harvest crop wastage</strong>, and <strong>maximize benefits from
                    government schemes</strong>.
            </p>
<p className={"hero-availability"}>
                Available In: <span>Uttar Pradesh</span> <span>Bihar</span> <span>Madhya Pradesh</span>
<span>Punjab</span> <span>Haryana</span> <span>Rajasthan</span>
</p>
</div>
{/*  WHY DIGITAL STORAGE FINDER MATTERS  */}
<div className={"why-storage"}>
<h2>Why Digital Storage Finder Matters</h2>
<div className={"underline"}></div>
<p>
                Farmers often suffer heavy losses due to lack of timely access to proper storage
                facilities, price transparency, and reliable information. The Digital Storage Finder
                bridges this gap by providing a centralized digital platform where farmers can
                locate nearby storage, compare costs, apply government schemes, and make informed
                decisions that reduce post-harvest losses and improve income stability.
            </p>
</div>
{/*  FEATURES SECTION  */}
<div className={"features-section"}>
<h2>Key Features</h2>
<div className={"underline"}></div>
<div className={"features-grid"}>
<div className={"feature-card"}>
<h3>📍 Storage Locator</h3>
<p>Find nearby cold storages, warehouses, and collection centers instantly.</p>
</div>
<div className={"feature-card"}>
<h3>💰 Price Estimation</h3>
<p>Compare storage costs and estimate expenses before booking.</p>
</div>
<div className={"feature-card"}>
<h3>🏛 Government Schemes</h3>
<p>Apply subsidies and reduce storage costs using government schemes.</p>
</div>
</div>
</div>
</section>
{/*  STORAGE  */}
<section id={"storage"}>
<div className={"storage-locator"}>
{/*  STORAGE 1  */}
<div className={"storage-card"}>
<div className={"storage-header"}>
<h3>Cold Storage – Ramnagar</h3>
<span className={"badge available"}>Available</span>
</div>
<p>📍 Ramnagar, Uttar Pradesh • 📏 6 km away</p>
<div className={"storage-info"}>
<span><b>Type:</b> Cold Storage</span>
<span><b>Suitable Crops:</b> Potato, Onion, Fruits</span>
<span><b>Temperature:</b> 2°C – 8°C</span>
<span><b>Capacity:</b> 500 Tons</span>
<span><b>Available Space:</b> 120 Tons</span>
<span><b>Price:</b> ₹2 / kg / month</span>
<span><b>Mode:</b> Online</span>
<span><b>Rating:</b> ⭐ 4.3 (120 reviews)</span>
<span><b>Scheme Support:</b> PM Kisan, Gramin Bhandaran</span>
<span><b>Verified:</b> ✔ Govt Approved</span>
</div>
<div className={"facilities"}>
<b>Facilities:</b>
<span>✔ CCTV</span>
<span>✔ Power Backup</span>
<span>✔ Pest Control</span>
<span>✔ Insurance</span>
</div>
<div className={"storage-actions"}>
<button className={"btn-view"}>View Details</button>
<button className={"btn-book"} onClick={(event) => window.showSection?.('booking')}>Book Now</button>
</div>
</div>
{/*  STORAGE 2  */}
<div className={"storage-card"}>
<div className={"storage-header"}>
<h3>Warehouse – Sitapur</h3>
<span className={"badge limited"}>Limited</span>
</div>
<p>📍 Sitapur, Uttar Pradesh • 📏 12 km away</p>
<div className={"storage-info"}>
<span><b>Type:</b> Warehouse</span>
<span><b>Suitable Crops:</b> Wheat, Rice, Pulses</span>
<span><b>Capacity:</b> 800 Tons</span>
<span><b>Available Space:</b> 60 Tons</span>
<span><b>Price:</b> ₹1.2 / kg / month</span>
<span><b>Mode:</b> Online</span>
<span><b>Rating:</b> ⭐ 4.0 (85 reviews)</span>
<span><b>Scheme Support:</b> Gramin Bhandaran</span>
<span><b>Verified:</b> ✔ Registered Facility</span>
</div>
<div className={"facilities"}>
<b>Facilities:</b>
<span>✔ Security</span>
<span>✔ Fire Safety</span>
<span>✔ Ventilation</span>
</div>
<div className={"storage-actions"}>
<button className={"btn-view"}>View Details</button>
<button className={"btn-book"} onClick={(event) => window.showSection?.('booking')}>Book Now</button>
</div>
</div>
</div>
<h2>Price Estimation Table</h2>
<table>
<tr>
<th>Storage Type</th>
<th>Mode</th>
<th>Price (₹/kg)</th>
<th>Best For</th>
</tr>
<tr>
<td>Cold Storage</td>
<td>Online</td>
<td>2.00</td>
<td>Vegetables</td>
</tr>
<tr>
<td>Warehouse</td>
<td>Online</td>
<td>1.20</td>
<td>Grains</td>
</tr>
<tr>
<td>Local Storage</td>
<td>Offline</td>
<td>1.00</td>
<td>Short Term</td>
</tr>
</table>
{/*  SCHEME PRICE ESTIMATOR  */}
<div className={"price-box"}>
<h2>Scheme Benefit Price Estimator</h2>
<label>Scheme</label>
<select id={"schemeType"}>
<option value={"0"}>No Scheme</option>
<option value={"0.5"}>PM Kisan (₹0.5/kg)</option>
<option value={"0.7"}>Gramin Bhandaran (₹0.7/kg)</option>
<option value={"1"}>State Subsidy (₹1/kg)</option>
</select>
<label>Storage Type</label>
<select id={"schemeStorage"}>
<option value={"2"}>Cold Storage</option>
<option value={"1.2"}>Warehouse</option>
<option value={"1"}>Offline Storage</option>
</select>
<label>Quantity (kg)</label>
<input type={"number"} id={"schemeQty"} placeholder={"Enter quantity"} />
<button onClick={(event) => window.estimateSchemePrice?.()}>Estimate Final Cost</button>
<h3 id={"schemeResult"}></h3>
</div>
</section>

{/*  SCHEMES  */}
<section id={"schemes"}>
<div className={"scheme"}>
<h3>PM Kisan</h3>
<p><b>Benefit:</b> ₹6000 annual income support</p>
<p><b>Eligibility Criteria:</b></p>
<ul>
<li>Small & marginal farmers</li>
<li>Landholding farmer families</li>
<li>Valid Aadhaar-linked bank account</li>
</ul>
</div>
<div className={"scheme"}>
<h3>Gramin Bhandaran Yojana</h3>
<p><b>Benefit:</b> Warehouse construction subsidy</p>
<p><b>Eligibility Criteria:</b></p>
<ul>
<li>Farmers, cooperatives, and SHGs</li>
<li>Rural storage infrastructure projects</li>
<li>Compliance with government storage norms</li>
</ul>
</div>
<div className={"scheme"}>
<h3>PM Fasal Bima Yojana</h3>
<p><b>Benefit:</b> Crop insurance against losses</p>
<p><b>Eligibility Criteria:</b></p>
<ul>
<li>Farmers growing notified crops</li>
<li>Enrollment during crop season</li>
<li>Coverage for natural calamities & pests</li>
</ul>
</div>
<div className={"scheme"}>
<h3>e-NAM</h3>
<p><b>Benefit:</b> Online agricultural market access</p>
<p><b>Eligibility Criteria:</b></p>
<ul>
<li>Registered farmers and traders</li>
<li>Access to internet or mandi support centers</li>
<li>Valid farmer identification</li>
</ul>
</div>
</section>
{/*  BOOKING  */}
<section id={"booking"}>
{/*  PAGE HEADER  */}
<div className={"booking-header"}>
<h2 className={"booking-title slide-in-right"}>Storage Booking</h2>
<p>Secure your crop storage in one simple step</p>
</div>
<div className={"booking-step"}>
            Step 1 of 1: Enter Booking Details
        </div>
<div className={"booking-box"}>
<h2>Book Storage Facility</h2>
<div className={"booking-badge"}>📦 Secure Storage Booking</div>
<div className={"booking-grid"}>
<div className={"form-section"}>
<h3>Farmer Details</h3>
<div className={"booking-grid"}>
<input id={"bName"} placeholder={"Farmer Name"} />
<input id={"bMobile"} type={"tel"} placeholder={"Mobile Number"} />
<select id={"bLocation"}>
<option value={""}>Select State</option>
<option>Uttar Pradesh</option>
<option>Bihar</option>
<option>Madhya Pradesh</option>
<option>Punjab</option>
<option>Haryana</option>
<option>Rajasthan</option>
</select>
</div>
</div>
<div className={"form-section"}>
<h3>Storage Details</h3>
<div className={"booking-grid"}>
<select id={"bStorage"}>
<option value={"2"}>Cold Storage (₹2/kg)</option>
<option value={"1.2"}>Warehouse (₹1.2/kg)</option>
<option value={"1"}>Offline Storage (₹1/kg)</option>
</select>
<select id={"bMode"}>
<option>Online</option>
<option>Offline</option>
</select>
<input id={"bCrop"} placeholder={"Crop Type"} />
</div>
</div>
<div className={"form-section"}>
<h3>Quantity & Scheme</h3>
<div className={"booking-grid"}>
<select id={"bScheme"}>
<option value={"0"}>Without Scheme</option>
<option value={"0.5"}>PM Kisan</option>
<option value={"0.7"}>Gramin Bhandaran</option>
<option value={"1"}>State Subsidy</option>
</select>
<input id={"bQty"} type={"number"} min={"1"} placeholder={"Quantity (kg)"} />
<input id={"bMonths"} type={"number"} min={"1"} placeholder={"Duration (months)"} />
</div>
</div>
</div>
<button onClick={(event) => window.confirmBooking?.()}>Confirm Booking</button>
<div className={"booking-result"} id={"bookingResult"}></div>
<p className={"booking-trust"}>
                🔒 Govt verified storages • 💳 Transparent pricing • 📞 24×7 Support
            </p>
</div>
</section>
{/*  PROFILE  */}
<section id={"profile"}>
<h2 style={{"textAlign": "center"}}>Farmer Profile</h2>
<div className={"profile-dashboard"}>
{/*  PROFILE PHOTO  */}
<div className={"profile-photo"}>👨‍🌾</div>
{/*  LANGUAGE TOGGLE  */}
<button onClick={(event) => window.toggleProfileLang?.()}>English / हिंदी</button>
{/*  PROFILE COMPLETION  */}
<p><b>Profile Completion</b></p>
<div className={"progress-container"}>
<div className={"progress-bar"} id={"profileProgress"}></div>
</div>
{/*  EDITABLE PROFILE FORM  */}
<h3>Personal Details</h3>
<div className={"profile-form"}>
<input id={"pName"} placeholder={"Farmer Name"} />
<input id={"pMobile"} placeholder={"Mobile Number"} />
<select id={"pState"}>
<option>Uttar Pradesh</option>
<option>Bihar</option>
<option>Madhya Pradesh</option>
<option>Punjab</option>
<option>Haryana</option>
<option>Rajasthan</option>
</select>
<input id={"pCrop"} placeholder={"Primary Crop"} />
</div>
<button onClick={(event) => window.saveProfile?.()}>Save Profile</button>
{/*  BOOKING HISTORY  */}
<h3>Booking History</h3>
<table className={"profile-table"}>
<thead><tr>
<th>Booking ID</th><th>Storage / Crop</th><th>Qty (kg)</th><th>Status</th>
</tr></thead>
<tbody id={"bookingHistoryBody"}><tr><td colSpan={"4"}>Enter your mobile number and save your profile to load saved bookings.</td></tr></tbody>
</table>
{/*  SCHEME ELIGIBILITY  */}
<h3>Scheme Eligibility Checker</h3>
<select id={"schemeCheck"}>
<option value={"0"}>No Scheme</option>
<option value={"0.5"}>PM Kisan</option>
<option value={"0.7"}>Gramin Bhandaran</option>
<option value={"1"}>State Subsidy</option>
</select>
<button onClick={(event) => window.checkEligibility?.()}>Check Eligibility</button>
<p id={"schemeResult"}></p>
</div>
</section>
<footer>
<footer className={"footer"}>
<div className={"footer-content"}>
<span><b>Digital Storage Finder for Farmers</b></span>
<span>Helpline: 1800-180-1551</span>
<span>Service Coverage: Multiple Indian States</span>
</div>
</footer>
</footer>
    </>
  );
}
