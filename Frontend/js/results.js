document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("resultsTableBody");
  const currentProjectTab = document.getElementById("currentProjectTab");

  initDrawer();
  loadProjectName();
  loadSavedResults();

  function loadProjectName() {
    const currentProject = getCurrentProject();

    if (currentProject && currentProjectTab) {
      currentProjectTab.textContent = currentProject.name;
    }
  }

  function loadSavedResults() {
    const currentProject = getCurrentProject();

    if (!tableBody) return;

    if (!currentProject) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;color:#6b6b7a;padding:32px;">
            No project selected.
          </td>
        </tr>
      `;
      return;
    }

    const allProjectResults =
      JSON.parse(localStorage.getItem("metras_project_results")) || {};

    const results = allProjectResults[currentProject.id] || [];

    renderTable(results);
  }

  function renderTable(rows) {
    if (!rows || rows.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;color:#6b6b7a;padding:32px;">
            No saved results for this project yet.
            <a href="teamleader.html" style="color:#5861b5;font-weight:900;">
              Run an analysis first →
            </a>
          </td>
        </tr>
      `;
      return;
    }

    const seenGroups = new Set();

    const filteredRows = rows.filter((r) => {
      if (!r["Is Duplicate"]) return true;

      const group = r["Duplicate Group"];

      if (!seenGroups.has(group)) {
        seenGroups.add(group);
        return true;
      }

      return false;
    });

    tableBody.innerHTML = filteredRows.map((r) => `
      <tr>
        <td>
          <div class="cell-wrap">
            ${escapeHtml(r["Requirement"] ?? "—")}
          </div>
        </td>

        <td>${chip(r["Predicted Severity"])}</td>
        <td>${chip(r["Predicted Impact"])}</td>
        <td>${chip(r["Predicted Likelihood"])}</td>

        <td>
          <span class="mono">
            ${escapeHtml(r["Top CVE"] ?? "—")}
          </span>
        </td>

        <td>
          <span class="mono">
            ${escapeHtml(fmtSim(r["Similarity"]))}
          </span>
        </td>

        <td>
          <div class="cell-wrap cell-muted">
            ${escapeHtml(r["CVE Description"] ?? "—")}
          </div>
        </td>
      </tr>
    `).join("");
  }

  function chip(level) {
    if (!level) return '<span class="chip">—</span>';

    const normalized = level.toString().toLowerCase();

    return `
      <span class="chip chip-${escapeHtml(normalized)}">
        ${escapeHtml(level)}
      </span>
    `;
  }

  function fmtSim(n) {
    return Number.isFinite(Number(n)) ? Number(n).toFixed(3) : String(n ?? "—");
  }

  function getCurrentProject() {
    try {
      return JSON.parse(localStorage.getItem("metras_current_project"));
    } catch {
      return null;
    }
  }

  function initDrawer() {
    const btnMenu = document.getElementById("btnMenu");
    const btnCloseDrawer = document.getElementById("btnCloseDrawer");
    const drawer = document.getElementById("drawer");
    const backdrop = document.getElementById("backdrop");

    btnMenu?.addEventListener("click", () => {
      drawer.classList.add("open");
      drawer.setAttribute("aria-hidden", "false");
      backdrop.hidden = false;
    });

    btnCloseDrawer?.addEventListener("click", () => {
      drawer.classList.remove("open");
      drawer.setAttribute("aria-hidden", "true");
      backdrop.hidden = true;
    });

    backdrop?.addEventListener("click", () => {
      drawer.classList.remove("open");
      drawer.setAttribute("aria-hidden", "true");
      backdrop.hidden = true;
    });
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
  }
});