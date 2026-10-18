// Migrated from the original insurance.html page script. Runs after React mounts the page.
export function initInsurance() {
  (() => {

  const API_BASE = window.location.port === "3000" ? "" : "http://localhost:3000";
  const insuranceForm = document.getElementById("insuranceForm");
  const insuranceMessage = document.getElementById("insuranceMessage");
  insuranceForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    const submitButton = insuranceForm.querySelector('button[type="submit"]');
    const payload = {
      farmer_name: document.getElementById("farmerName").value.trim(),
      mobile: document.getElementById("mobile").value.trim(),
      district: document.getElementById("district").value.trim(),
      state: document.getElementById("state").value,
      crop_name: document.getElementById("crop").value.trim(),
      request_type: document.getElementById("requestType").value,
      description: document.getElementById("issue").value.trim()
    };
    submitButton.disabled = true;
    insuranceMessage.style.color = "#555";
    insuranceMessage.textContent = "Saving your request...";
    try {
      const response = await fetch(`${API_BASE}/api/insurance-requests`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save the request");
      insuranceMessage.style.color = "#1b5e20";
      insuranceMessage.textContent = `Thank you ${payload.farmer_name}. Your request #${data.request_id} has been saved with status Pending. You can track it using your mobile number.`;
      insuranceForm.reset();
    } catch (error) {
      insuranceMessage.style.color = "#b42318";
      insuranceMessage.textContent = `${error.message}. Make sure the server is running and the MySQL database is configured.`;
    } finally { submitButton.disabled = false; }
  });


  })();
}
