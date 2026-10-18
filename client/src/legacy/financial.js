// Migrated from the original financial.html page script. Runs after React mounts the page.
export function initFinancial() {
  (() => {

  const API_BASE = window.location.port === "3000" ? "" : "http://localhost:3000";
  const form = document.getElementById("loanForm");
  const message = document.getElementById("formMessage");
  form.addEventListener("submit", async function(e) {
    e.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const payload = {
      farmer_name: document.getElementById("name").value.trim(),
      mobile: document.getElementById("mobile").value.trim(),
      village: document.getElementById("village").value.trim(),
      state: document.getElementById("state").value,
      loan_amount: Number(document.getElementById("amount").value),
      loan_type: document.getElementById("loanType").value,
      purpose: document.getElementById("purpose").value.trim()
    };
    if (payload.loan_amount <= 0) { message.style.color = "red"; message.textContent = "Please enter a valid loan amount."; return; }
    submitButton.disabled = true;
    message.style.color = "#555"; message.textContent = "Submitting application...";
    try {
      const response = await fetch(`${API_BASE}/api/loan-applications`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save the application");
      message.style.color = "#1b5e20";
      message.textContent = `Application #${data.application_id} saved successfully with status Pending. Our team will contact you shortly.`;
      form.reset();
    } catch (error) {
      message.style.color = "#b42318";
      message.textContent = `${error.message}. Make sure the server is running and the MySQL database is configured.`;
    } finally { submitButton.disabled = false; }
  });


  })();
}
