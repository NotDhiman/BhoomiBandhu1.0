import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { initCommon } from '../legacy/common.js';
import { initStorage } from '../legacy/storage.js';
import pageCss from '../pageStyles/storage.css?raw';

/* â”€â”€ Modern Inline SVG Icons â”€â”€ */
const IconHome = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);
const IconWarehouse = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 8.35V20a2 2 0 01-2 2H4a2 2 0 01-2-2V8.35A2 2 0 013.26 6.5l8-3.2a2 2 0 011.48 0l8 3.2A2 2 0 0122 8.35z"/><path d="M6 18h12"/><path d="M6 14h12"/><rect x="6" y="10" width="12" height="12" rx="0"/></svg>
);
const IconScroll = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h12a2 2 0 002-2v-2H10v2a2 2 0 11-4 0V5a2 2 0 112 0v2h12a2 2 0 012 2v2H10"/><path d="M19 17V5a2 2 0 00-2-2H4"/></svg>
);
const IconCalendarCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>
);
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
);

export default function StoragePage() {
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const pageClass = 'page-storage';
    document.body.classList.add(pageClass);
    initCommon();
    initStorage();
    return () => document.body.classList.remove(pageClass);
  }, []);

  const handleTabClick = (tabId, e) => {
    e.preventDefault();
    setActiveTab(tabId);
    if (typeof window.showSection === 'function') {
      window.showSection(tabId);
    }
  };

  return (
    <>
      <style>{pageCss}</style>
      <Navbar />

      {/* ── Page Sub-Navigation (Storage Portal Tabs) ── */}
      <div className="storage-subnav">
        <div className="storage-subnav-inner">
          <button
            className={`storage-tab${activeTab === 'home' ? ' storage-tab--active' : ''}`}
            onClick={(e) => handleTabClick('home', e)}
          >
            <IconHome />
            <span>Overview</span>
          </button>
          <button
            className={`storage-tab${activeTab === 'storage' ? ' storage-tab--active' : ''}`}
            onClick={(e) => handleTabClick('storage', e)}
          >
            <IconWarehouse />
            <span>Find Storage</span>
          </button>
          <button
            className={`storage-tab${activeTab === 'booking' ? ' storage-tab--active' : ''}`}
            onClick={(e) => handleTabClick('booking', e)}
          >
            <IconCalendarCheck />
            <span>Book Now</span>
          </button>
        </div>
      </div>

      {/* Real-time Storage & Scheme Ticker */}
      <div className="scheme-ticker" role="region" aria-label="Agricultural Notices">
        <div className="ticker-track">
          <span className="ticker-item">🌾 Gramin Bhandaran Yojana: Up to 33.3% subsidy on rural warehouse infrastructure</span>
          <span className="ticker-item">🏬 PM Kisan: Instant subsidy deduction on cold storage bookings</span>
          <span className="ticker-item">🛡️ PM Fasal Bima Yojana: Post-harvest storage risk insurance active</span>
          <span className="ticker-item">📊 e-NAM: Direct market discovery for stored grain batches</span>
        </div>
      </div>

      {/* 1. HOME SECTION */}
      <section id="home" className="active">
        <div className="home-hero">
          <h2 className="animated-title">
            <span className="from-left">DIGITAL</span>
            <span className="from-bottom">STORAGE</span>
            <span className="from-right">FINDER</span>
          </h2>
          <p className="hero-desc slide-from-right">
            A state-of-the-art <strong>digital storage management platform</strong> engineered for farmers to
            <strong> locate certified local facilities</strong>, <strong>estimate costs with scheme benefits</strong>,
            and <strong>prevent post-harvest crop damage</strong>.
          </p>
          <div className="hero-availability">
            <span>Available In:</span>
            <span>Uttar Pradesh</span>
            <span>Bihar</span>
            <span>Madhya Pradesh</span>
            <span>Punjab</span>
            <span>Haryana</span>
            <span>Rajasthan</span>
          </div>
        </div>

        {/* Why Digital Storage Finder Matters */}
        <div className="why-storage">
          <h2>Why Digital Storage Finder Matters</h2>
          <div className="underline"></div>
          <p>
            Farmers frequently suffer catastrophic distress sales due to lack of timely access to verified cold storages and warehouses.
            The Digital Storage Finder creates complete pricing transparency, verified capacity reservations, and seamless application
            of government subsidies to protect your harvest margins.
          </p>
        </div>

        {/* Features Grid */}
        <div className="features-section">
          <h2>Key Capabilities</h2>
          <div className="underline"></div>
          <div className="features-grid">
            <div className="feature-card">
              <h3>📍 Storage Locator</h3>
              <p>Discover nearby cold storages, grain godowns, and rural collection centers with live availability status.</p>
            </div>
            <div className="feature-card">
              <h3>💰 Price Estimation</h3>
              <p>Compare storage costs per quintal/month with automated subsidy deductions before you book space.</p>
            </div>
            <div className="feature-card">
              <h3>🏛 Government Subsidies</h3>
              <p>Direct integration with Gramin Bhandaran Yojana and State Agricultural Warehousing grants.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STORAGE LOCATOR SECTION */}
      <section id="storage">
        <div className="storage-locator">
          {/* STORAGE 1: Ramnagar */}
          <div className="storage-card">
            <div className="storage-header">
              <h3>Cold Storage – Ramnagar</h3>
              <span className="badge available">Available</span>
            </div>
            <p>📍 Ramnagar, Uttar Pradesh • 📏 6 km away</p>
            <div className="storage-info">
              <span><b>Type:</b> Cold Storage</span>
              <span><b>Crops:</b> Potato, Onion, Fruits</span>
              <span><b>Temp:</b> 2°C – 8°C</span>
              <span><b>Capacity:</b> 500 Tons</span>
              <span><b>Available:</b> 120 Tons</span>
              <span><b>Price:</b> ₹2 / kg / month</span>
              <span><b>Mode:</b> Online Booking</span>
              <span><b>Rating:</b> ★ 4.3 (120 reviews)</span>
              <span><b>Subsidy:</b> PM Kisan, Gramin Bhandaran</span>
              <span><b>Status:</b> ✔ Govt Approved</span>
            </div>
            <div className="facilities">
              <b>Facilities:</b>
              <span>CCTV</span>
              <span>Power Backup</span>
              <span>Pest Control</span>
              <span>Insurance Shield</span>
            </div>
            <div className="storage-actions">
              <button type="button" className="btn-view" onClick={(e) => handleTabClick('booking', e)}>View Details</button>
              <button type="button" className="btn-book" onClick={(e) => handleTabClick('booking', e)}>Book Now</button>
            </div>
          </div>

          {/* STORAGE 2: Sitapur */}
          <div className="storage-card">
            <div className="storage-header">
              <h3>Warehouse – Sitapur</h3>
              <span className="badge limited">Limited Space</span>
            </div>
            <p>📍 Sitapur, Uttar Pradesh • 📏 12 km away</p>
            <div className="storage-info">
              <span><b>Type:</b> Dry Warehouse</span>
              <span><b>Crops:</b> Wheat, Rice, Pulses</span>
              <span><b>Capacity:</b> 800 Tons</span>
              <span><b>Available:</b> 60 Tons</span>
              <span><b>Price:</b> ₹1.2 / kg / month</span>
              <span><b>Mode:</b> Online Booking</span>
              <span><b>Rating:</b> ★ 4.0 (85 reviews)</span>
              <span><b>Subsidy:</b> Gramin Bhandaran</span>
              <span><b>Status:</b> ✔ Registered Facility</span>
            </div>
            <div className="facilities">
              <b>Facilities:</b>
              <span>24/7 Security</span>
              <span>Fire Safety</span>
              <span>Aeration Systems</span>
            </div>
            <div className="storage-actions">
              <button type="button" className="btn-view" onClick={(e) => handleTabClick('booking', e)}>View Details</button>
              <button type="button" className="btn-book" onClick={(e) => handleTabClick('booking', e)}>Book Now</button>
            </div>
          </div>
        </div>

        {/* Storage Comparison Matrix */}
        <h2>Standard Storage Rates Comparison</h2>
        <table>
          <thead>
            <tr>
              <th>Storage Type</th>
              <th>Mode</th>
              <th>Base Rate (₹/kg/mo)</th>
              <th>Optimal For</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Cold Storage</strong></td>
              <td>Online Certified</td>
              <td>₹2.00</td>
              <td>Potatoes, Fruits, Perishables</td>
            </tr>
            <tr>
              <td><strong>Dry Warehouse</strong></td>
              <td>Online Certified</td>
              <td>₹1.20</td>
              <td>Wheat, Paddy, Pulses, Mustard</td>
            </tr>
            <tr>
              <td><strong>Local Mandi Godown</strong></td>
              <td>Offline / Counter</td>
              <td>₹1.00</td>
              <td>Short-Term Mandi Transit</td>
            </tr>
          </tbody>
        </table>

        {/* Scheme Benefit Price Estimator */}
        <div className="price-box">
          <h2>Scheme Benefit Price Estimator</h2>
          <label htmlFor="schemeType">Eligible Subsidy Scheme</label>
          <select id="schemeType">
            <option value="0">No Scheme (Full Tariff)</option>
            <option value="0.5">PM Kisan Support (₹0.50 / kg discount)</option>
            <option value="0.7">Gramin Bhandaran Yojana (₹0.70 / kg discount)</option>
            <option value="1">State Agricultural Subsidy (₹1.00 / kg discount)</option>
          </select>

          <label htmlFor="schemeStorage">Facility Tier</label>
          <select id="schemeStorage">
            <option value="2">Cold Storage (₹2.00 / kg base)</option>
            <option value="1.2">Dry Warehouse (₹1.20 / kg base)</option>
            <option value="1">Offline Storage (₹1.00 / kg base)</option>
          </select>

          <label htmlFor="schemeQty">Crop Volume (in kg)</label>
          <input type="number" id="schemeQty" min="1" placeholder="e.g. 5000" />

          <button type="button" onClick={() => window.estimateSchemePrice?.()}>Calculate Final Net Cost</button>
          <h3 id="schemeResult"></h3>
        </div>
      </section>

      {/* 4. BOOKING SECTION */}
      <section id="booking">
        <div className="booking-header">
          <h2 className="booking-title slide-in-right">Verified Storage Booking</h2>
          <p>Direct reservation with certified storage partners</p>
        </div>
        <div className="booking-step">
          Step 1: Enter Verified Reservation Details
        </div>

        <div className="booking-box">
          <h2>Reserve Space</h2>
          <div className="booking-badge">🛡️ Government Certified Facility Guarantee</div>

          <div className="booking-grid">
            <div className="form-section">
              <h3>Farmer Details</h3>
              <div className="booking-grid">
                <input id="bName" placeholder="Full Name of Farmer" />
                <input id="bMobile" type="tel" placeholder="10-Digit Mobile Number" />
                <select id="bLocation">
                  <option value="">Select State</option>
                  <option>Uttar Pradesh</option>
                  <option>Bihar</option>
                  <option>Madhya Pradesh</option>
                  <option>Punjab</option>
                  <option>Haryana</option>
                  <option>Rajasthan</option>
                </select>
              </div>
            </div>

            <div className="form-section">
              <h3>Storage Preferences</h3>
              <div className="booking-grid">
                <select id="bStorage">
                  <option value="2">Cold Storage (₹2/kg/month)</option>
                  <option value="1.2">Dry Warehouse (₹1.2/kg/month)</option>
                  <option value="1">Offline Godown (₹1/kg/month)</option>
                </select>
                <select id="bMode">
                  <option>Online</option>
                  <option>Offline</option>
                </select>
                <input id="bCrop" placeholder="Crop Type (e.g. Potato, Wheat)" />
              </div>
            </div>

            <div className="form-section">
              <h3>Volume & Scheme Application</h3>
              <div className="booking-grid">
                <select id="bScheme">
                  <option value="0">Standard Tariff (No Subsidy)</option>
                  <option value="0.5">PM Kisan (₹0.50/kg discount)</option>
                  <option value="0.7">Gramin Bhandaran (₹0.70/kg discount)</option>
                  <option value="1">State Subsidy (₹1.00/kg discount)</option>
                </select>
                <input id="bQty" type="number" min="1" placeholder="Quantity in kg" />
                <input id="bMonths" type="number" min="1" placeholder="Storage Duration (months)" />
              </div>
            </div>
          </div>

          <button type="button" onClick={() => window.confirmBooking?.()}>Confirm & Generate Booking Voucher</button>
          <div className="booking-result" id="bookingResult"></div>
          <p className="booking-trust">
            🔒 WDRA Verified • 💳 Transparent Pricing • 📞 Toll-Free Assistance: 1800-180-1551
          </p>
        </div>
      </section>

      {/* Shared BhoomiBandhu Footer */}
      <Footer />
    </>
  );
}

