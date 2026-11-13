// Migrated from the original schemes.html page script. Runs after React mounts the page.
export function initSchemes() {
  (() => {

  function toggleCard(card) { card.classList.toggle("active"); }
  const API_BASE = window.location.port === "3000" ? "" : "http://localhost:3000";
  document.getElementById("eligibilityForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const scheme = document.getElementById("scheme").value;
    const category = document.getElementById("category").value;
    const land = Number(document.getElementById("land").value);
    const season = document.getElementById("season").value;
    const aadhaar = document.getElementById("aadhaar").value === "yes";
    const bank = document.getElementById("bank").value === "yes";
    const resultBox = document.getElementById("eligibilityResult");
    const saveStatus = document.getElementById("eligibilitySaveStatus");
    let eligible = true;
    let message = "";
    if (!aadhaar || !bank) { eligible = false; message = "Aadhaar-linked bank account is mandatory."; }
    else if (scheme === "pmkisan") {
      eligible = category === "small" && land <= 2;
      message = eligible ? "You may receive ₹6000 annual income support." : "PM-KISAN is for small & marginal farmers with eligible landholding.";
    } else if (scheme === "pmfby") {
      eligible = true; message = "You can apply for crop insurance this season.";
    } else if (scheme === "kcc") {
      eligible = land > 0; message = eligible ? "You can apply for agricultural credit." : "Valid landholding is required for KCC.";
    }
    resultBox.classList.remove("hidden", "success", "error");
    resultBox.classList.add(eligible ? "success" : "error");
    resultBox.textContent = `${eligible ? "Eligible" : "Not Eligible"}: ${message}`;
    saveStatus.textContent = "Saving eligibility check...";
    try {
      const response = await fetch(`${API_BASE}/api/scheme-eligibility-checks`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheme_slug: scheme, farmer_category: category, land_ha: land, crop_season: season,
          aadhaar_linked: aadhaar, bank_linked: bank, is_eligible: eligible, result_message: message
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save eligibility check");
      saveStatus.textContent = `Check #${data.check_id} saved to the database.`;
    } catch (error) {
      saveStatus.textContent = `${error.message}. The result above is shown, but was not saved.`;
    }
  });

    if (typeof toggleCard === "function") window.toggleCard = toggleCard;
  })();
}
