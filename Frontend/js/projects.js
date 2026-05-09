document.addEventListener("DOMContentLoaded", () => {
  initDrawer();

  const btnCreateProject = document.getElementById("btnCreateProject");
  const projectsGrid = document.getElementById("projectsGrid");

  btnCreateProject?.addEventListener("click", () => {
    window.location.href = "createProject.html";
  });

  loadProjects(projectsGrid);
});

function loadProjects(projectsGrid) {
  if (!projectsGrid) return;

  const projects = getProjects();

  projectsGrid.innerHTML = "";

  if (projects.length === 0) {
    projectsGrid.innerHTML = `
      <div class="empty-state">
        No projects created yet.
      </div>
    `;
    return;
  }

  projects.forEach((project) => {
    const card = document.createElement("div");
    card.className = "project-card";

    card.innerHTML = `
      <div class="project-top">
        <div class="project-name">${escapeHtml(project.name)}</div>
        <span class="status draft">${escapeHtml(project.status || "Draft")}</span>
      </div>

      <div class="project-desc">
        ${escapeHtml(project.description || "No description provided.")}
      </div>

      <div class="project-members">
        <strong>Team Members:</strong>
        ${
          project.members && project.members.length > 0
            ? project.members
                .map((member) => `<span class="member-chip">${escapeHtml(member)}</span>`)
                .join("")
            : `<span class="project-muted">No members added</span>`
        }
      </div>

      <div class="project-meta">
        Created: ${escapeHtml(project.createdAt || "Unknown")}
      </div>
    `;

    card.addEventListener("click", () => {
      openProjectPopup(project);
    });

    projectsGrid.appendChild(card);
  });
}

function openProjectPopup(project) {
  localStorage.setItem("metras_current_project", JSON.stringify(project));

  const oldPopup = document.getElementById("projectPopup");
  if (oldPopup) oldPopup.remove();

  const popup = document.createElement("div");
  popup.id = "projectPopup";
  popup.className = "project-popup-backdrop";

  popup.innerHTML = `
    <div class="project-popup-card">

      <div class="project-popup-head">
        <h2>${escapeHtml(project.name)}</h2>
        <button class="project-popup-close" id="closeProjectPopup">✕</button>
      </div>

      <div class="project-popup-body">

        <div class="popup-row">
          <span class="popup-label">Project Name</span>
          <span class="popup-value">${escapeHtml(project.name)}</span>
        </div>

        <div class="popup-row">
          <span class="popup-label">Description</span>
          <span class="popup-value">
            ${escapeHtml(project.description || "No description provided.")}
          </span>
        </div>

        <div class="popup-row">
          <span class="popup-label">Team Members</span>
          <span class="popup-value">
            ${
              project.members && project.members.length > 0
                ? project.members.map((member) => escapeHtml(member)).join(", ")
                : "No members added"
            }
          </span>
        </div>

        <div class="popup-row">
          <span class="popup-label">Status</span>
          <span class="popup-value">${escapeHtml(project.status || "Draft")}</span>
        </div>

        <div class="popup-row">
          <span class="popup-label">Created</span>
          <span class="popup-value">${escapeHtml(project.createdAt || "Unknown")}</span>
        </div>

      </div>

      <div class="project-popup-actions">
        <button class="btn btn-secondary" id="popupCancel" type="button">
          Close
        </button>

        <button class="btn btn-primary" id="goToResults" type="button">
          View Results
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(popup);

  document.getElementById("closeProjectPopup")?.addEventListener("click", closeProjectPopup);
  document.getElementById("popupCancel")?.addEventListener("click", closeProjectPopup);

  document.getElementById("goToResults")?.addEventListener("click", () => {
    localStorage.setItem("metras_current_project", JSON.stringify(project));
    window.location.href = "results.html";
  });

  popup.addEventListener("click", (event) => {
    if (event.target === popup) {
      closeProjectPopup();
    }
  });
}

function closeProjectPopup() {
  const popup = document.getElementById("projectPopup");
  if (popup) popup.remove();
}

function getProjects() {
  try {
    return JSON.parse(localStorage.getItem("metras_projects")) || [];
  } catch {
    return [];
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