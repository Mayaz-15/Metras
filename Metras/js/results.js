document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("resultsTableBody");
  const resultsMeta = document.getElementById("resultsMeta");

  // Drawer
  const btnMenu = document.getElementById("btnMenu");
  const btnCloseDrawer = document.getElementById("btnCloseDrawer");
  const drawer = document.getElementById("drawer");
  const backdrop = document.getElementById("backdrop");

  const openDrawer = () => {
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    backdrop.hidden = false;
  };
  const closeDrawer = () => {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    backdrop.hidden = true;
  };

  btnMenu?.addEventListener("click", openDrawer);
  btnCloseDrawer?.addEventListener("click", closeDrawer);
  backdrop?.addEventListener("click", closeDrawer);

  // Mock data (replace later)
  const mockResults = [
    {
      requirement: "The system shall store passwords using salted hashing.",
      severity: "Medium",
      impact: "Medium",
      likelihood: "Medium",
      cve: "CVE-2022-40295",
      similarity: 0.294,
      description: "The application was vulnerable to an authentication bypass."
    },
    {
      requirement: "The system shall encrypt sensitive data at rest.",
      severity: "Low",
      impact: "Medium",
      likelihood: "Low",
      cve: "No strong CVE match",
      similarity: 0.214,
      description: "None"
    },
    {
      requirement: "The system shall enforce MFA for admin access.",
      severity: "Low",
      impact: "Medium",
      likelihood: "Low",
      cve: "No strong CVE match",
      similarity: 0.178,
      description: "None"
    }
  ];

  const chip = (level) => {
  const normalized = level.toLowerCase();
  return `<span class="chip chip-${normalized}">${level}</span>`;
};
  const fmtSim = (n) => (Number.isFinite(n) ? n.toFixed(3) : String(n));

  function renderTable(rows){
    tableBody.innerHTML = rows.map(r => `
      <tr>
        <td><div class="cell-wrap">${r.requirement}</div></td>
        <td>${chip(r.severity)}</td>
        <td>${chip(r.impact)}</td>
        <td>${chip(r.likelihood)}</td>
        <td><span class="mono">${r.cve}</span></td>
        <td><span class="mono">${fmtSim(r.similarity)}</span></td>
        <td><div class="cell-wrap cell-muted">${r.description}</div></td>
      </tr>
    `).join("");

   
  }

  renderTable(mockResults);
});