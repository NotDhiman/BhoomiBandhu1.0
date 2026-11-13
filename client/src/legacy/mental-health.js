// Migrated from the original mental-health.html page script. Runs after React mounts the page.
export function initMentalHealth() {
  (() => {

const API_BASE = window.location.port === "3000" ? "" : "http://localhost:3000";
document.getElementById("mentalContactForm")?.addEventListener("submit", async function(e) {
  e.preventDefault();
  const form = this;
  const result = document.getElementById("mhResult");
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  result.textContent = "Sending your confidential support request...";
  try {
    const response = await fetch(`${API_BASE}/api/mental-health-requests`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        farmer_name: document.getElementById("mhName").value.trim(),
        mobile: document.getElementById("mhPhone").value.trim(),
        concern_type: document.getElementById("mhIssue").value,
        message: document.getElementById("mhMessage").value.trim()
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to save your request");
    result.textContent = `Thank you for reaching out. Your support request #${data.request_id} has been received. You are not alone.`;
    form.reset();
  } catch (error) {
    result.textContent = `${error.message}. Please make sure the server and database are running.`;
  } finally { button.disabled = false; }
});


  })();
}
