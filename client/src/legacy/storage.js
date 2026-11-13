// Migrated from the original storage.html page script. Runs after React mounts the page.
export function initStorage() {
  (() => {

        function showSection(id) {
            document.querySelectorAll("section").forEach(sec => sec.classList.remove("active"));
            const activeSection = document.getElementById(id);
            activeSection.classList.add("active");

            // Animate booking title when section opens
            if (id === "booking") {
                const title = activeSection.querySelector(".booking-title");
                title.classList.remove("animate"); // reset
                void title.offsetWidth; // force reflow
                title.classList.add("animate");
            }
        }


        function estimateSchemePrice() {
            const schemeBenefit = parseFloat(document.getElementById("schemeType").value);
            const basePrice = parseFloat(document.getElementById("schemeStorage").value);
            const qty = parseFloat(document.getElementById("schemeQty").value);

            if (isNaN(qty) || qty <= 0) {
                document.getElementById("schemeResult").innerText =
                    "Please enter a valid quantity";
                return;
            }

            let effectivePrice = basePrice - schemeBenefit;
            if (effectivePrice < 0) effectivePrice = 0;

            const total = effectivePrice * qty;

            document.getElementById("schemeResult").innerText =
                "Estimated Monthly Cost After Scheme Benefit: ₹" + total.toFixed(2);
        }

        const API_BASE = window.location.port === "3000" ? "" : "http://localhost:3000";

        async function confirmBooking() {
            const name = document.getElementById("bName").value.trim();
            const mobile = document.getElementById("bMobile").value.trim();
            const state = document.getElementById("bLocation").value;
            const basePrice = parseFloat(document.getElementById("bStorage").value);
            const schemeValue = document.getElementById("bScheme").value;
            const schemeBenefit = parseFloat(schemeValue);
            const qty = parseFloat(document.getElementById("bQty").value);
            const months = parseInt(document.getElementById("bMonths").value, 10);
            const crop = document.getElementById("bCrop").value.trim();
            const mode = document.getElementById("bMode").value.toLowerCase();
            const result = document.getElementById("bookingResult");
            if (!name || !mobile || !state || !crop || !Number.isFinite(qty) || !Number.isInteger(months) || qty <= 0 || months <= 0 || !/^[+]?\d[\d\s()-]{6,18}$/.test(mobile)) {
                result.textContent = "Please enter a valid name, mobile number, state, crop, quantity and duration.";
                return;
            }
            const schemeSlug = ({ "0.5": "pmkisan", "0.7": "gramin_bhandaran", "1": "state_subsidy", "0": "" })[schemeValue];
            const storageType = basePrice === 2 ? "cold_storage" : (basePrice === 1.2 ? "warehouse" : "offline");
            result.textContent = "Saving your booking...";
            try {
                const response = await fetch(`${API_BASE}/api/storage-bookings`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        farmer_name: name, mobile, state, crop_type: crop, quantity_kg: qty,
                        duration_months: months, mode, base_price_per_kg: basePrice,
                        storage_type: storageType, scheme_slug: schemeSlug
                    })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Could not save booking");
                const benefitText = data.effective_price_per_kg < basePrice
                    ? `Scheme applied: ₹${(basePrice - data.effective_price_per_kg).toFixed(2)}/kg. `
                    : "No subsidy applied. ";
                result.textContent = `Booking saved! Reference: ${data.booking_ref}. ${benefitText}Final payable amount: ₹${Number(data.total_amount).toFixed(2)}. ` +
                    (data.facility_id ? "A matching storage facility was linked." : "Your request is saved; a matching facility will need to be assigned.");
                await loadBookingHistory(mobile);
            } catch (error) {
                result.textContent = `${error.message}. Make sure the server and MySQL database are running.`;
            }
        }

        async function loadBookingHistory(mobile) {
            if (!mobile) return;
            const body = document.getElementById("bookingHistoryBody");
            try {
                const response = await fetch(`${API_BASE}/api/storage-bookings?mobile=${encodeURIComponent(mobile)}`);
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Could not load booking history");
                body.replaceChildren();
                if (!data.bookings.length) {
                    const row = body.insertRow(); const cell = row.insertCell(); cell.colSpan = 4; cell.textContent = "No saved bookings found for this mobile number."; return;
                }
                data.bookings.forEach(booking => {
                    const row = body.insertRow();
                    [booking.booking_ref, `${booking.facility_name || "Facility pending"} / ${booking.crop_type}`, Number(booking.quantity_kg).toLocaleString(), booking.booking_status].forEach(value => {
                        row.insertCell().textContent = String(value ?? "");
                    });
                });
            } catch (error) {
                body.replaceChildren(); const row = body.insertRow(); const cell = row.insertCell(); cell.colSpan = 4; cell.textContent = `Could not load booking history: ${error.message}`;
            }
        }

        // Scroll-based animation for "Why Digital Storage Finder Matters"
        const whySection = document.querySelector(".why-storage");

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("active");
                        observer.unobserve(entry.target); // run once
                    }
                });
            },
            { threshold: 0.4 }
        );

        if (whySection) {
            observer.observe(whySection);
        }
        // Scroll animation for feature cards
        const featureCards = document.querySelectorAll(".feature-card");

        const featureObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            entry.target.classList.add("visible");
                        }, index * 150); // stagger effect
                        featureObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.3 }
        );

        featureCards.forEach(card => featureObserver.observe(card));



        /* PROFILE COMPLETION */
        function updateProgress() {
            let filled = 0;
            if (document.getElementById("pName").value.trim()) filled++;
            if (document.getElementById("pMobile").value.trim()) filled++;
            if (document.getElementById("pState").value) filled++;
            if (document.getElementById("pCrop").value.trim()) filled++;

            const percent = (filled / 4) * 100;
            document.getElementById("profileProgress").style.width = percent + "%";
        }

        async function saveProfile() {
            updateProgress();
            const name = document.getElementById("pName").value.trim();
            const mobile = document.getElementById("pMobile").value.trim();
            const state = document.getElementById("pState").value;
            const crop = document.getElementById("pCrop").value.trim();
            if (!name || !mobile || !state) { alert("Please enter farmer name, mobile number and state."); return; }
            try {
                const response = await fetch(`${API_BASE}/api/farmers`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, mobile, state, primary_crop: crop })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Could not save profile");
                alert(`Profile saved to database. Farmer ID: ${data.farmer_id}`);
                await loadBookingHistory(mobile);
            } catch (error) { alert(`${error.message}. Make sure the server and MySQL database are running.`); }
        }

        /* SCHEME ELIGIBILITY */
        function checkEligibility() {
            const val = document.getElementById("schemeCheck").value;
            const text = val > 0
                ? "You are eligible for ₹" + val + " per kg subsidy."
                : "No scheme selected.";
            document.getElementById("schemeResult").innerText = text;
        }

        /* LANGUAGE TOGGLE */
        let isHindi = false;
        function toggleProfileLang() {
            isHindi = !isHindi;
            document.querySelector("#profile h2").innerText =
                isHindi ? "किसान प्रोफ़ाइल" : "Farmer Profile";
        }

    
    if (typeof showSection === "function") window.showSection = showSection;
    if (typeof estimateSchemePrice === "function") window.estimateSchemePrice = estimateSchemePrice;
    if (typeof confirmBooking === "function") window.confirmBooking = confirmBooking;
    if (typeof loadBookingHistory === "function") window.loadBookingHistory = loadBookingHistory;
    if (typeof updateProgress === "function") window.updateProgress = updateProgress;
    if (typeof saveProfile === "function") window.saveProfile = saveProfile;
    if (typeof checkEligibility === "function") window.checkEligibility = checkEligibility;
    if (typeof toggleProfileLang === "function") window.toggleProfileLang = toggleProfileLang;
  })();
}
