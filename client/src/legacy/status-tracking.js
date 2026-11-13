// Migrated from the original status-tracking.html page script. Runs after React mounts the page.
export function initStatusTracking() {
  (() => {

const API_BASE = window.location.port === "3000" ? "" : "http://localhost:3000";
document.getElementById("statusLookupForm").addEventListener("submit", async function(event) {
  event.preventDefault();
  const status = document.getElementById("trackingStatus");
  const results = document.getElementById("trackingResults");
  const mobile = document.getElementById("trackingMobile").value.trim();
  status.textContent = "Searching..."; results.replaceChildren();
  try {
    const response = await fetch(`${API_BASE}/api/insurance-requests?mobile=${encodeURIComponent(mobile)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not retrieve requests");
    if (!data.requests.length) { status.textContent = "No insurance requests found for this mobile number."; return; }
    status.textContent = `${data.requests.length} request(s) found.`;
    const table = document.createElement("table"); table.style.width = "100%"; table.style.borderCollapse = "collapse";
    const head = document.createElement("thead"); const headRow = document.createElement("tr");
    ["Request #", "Crop", "Type", "District", "Status", "Submitted"].forEach(label => { const th=document.createElement("th"); th.textContent=label; th.style.padding="10px"; th.style.borderBottom="1px solid #d7ded8"; headRow.appendChild(th); });
    head.appendChild(headRow); table.appendChild(head);
    const body = document.createElement("tbody");
    data.requests.forEach(item => { const row=document.createElement("tr"); [item.id,item.crop_name,item.request_type,item.district,item.req_status,item.submitted_at ? new Date(item.submitted_at).toLocaleString() : ""].forEach(value => { const td=document.createElement("td"); td.textContent=String(value ?? ""); td.style.padding="10px"; td.style.borderBottom="1px solid #edf0ed"; row.appendChild(td); }); body.appendChild(row); });
    table.appendChild(body); results.appendChild(table);
  } catch (error) { status.textContent = `${error.message}. Make sure the server and database are running.`; }
});


  })();
}
