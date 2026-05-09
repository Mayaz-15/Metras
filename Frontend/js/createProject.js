document.addEventListener("DOMContentLoaded", () => {
  initDrawer();
  initCreateProject();
});

let members = [];

function initCreateProject() {
  const projectName = document.getElementById("projectName");
  const projectDesc = document.getElementById("projectDesc");
  const memberName = document.getElementById("memberName");
  const btnAddMember = document.getElementById("btnAddMember");
  const membersList = document.getElementById("membersList");
  const btnCreateProject = document.getElementById("btnCreateProject");
  const projectError = document.getElementById("projectError");

  btnAddMember?.addEventListener("click", () => {
    addMember(memberName, membersList);
  });

  memberName?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addMember(memberName, membersList);
    }
  });

  btnCreateProject?.addEventListener("click", () => {
    const name = projectName.value.trim();
    const description = projectDesc ? projectDesc.value.trim() : "";

    if (!name) {
      showError(projectError, "Please enter a project name.");
      return;
    }

    const projects = getProjects();

    const newProject = {
      id: Date.now().toString(),
      name,
      description: description || "No description provided.",
      members,
      status: "Draft",
      createdAt: new Date().toLocaleDateString()
    };

    projects.push(newProject);

    localStorage.setItem("metras_projects", JSON.stringify(projects));
    localStorage.setItem("metras_current_project", JSON.stringify(newProject));

    window.location.href = "teamleader.html";
  });
}

function addMember(input, list) {
  if (!input || !list) return;

  const name = input.value.trim();

  if (!name) return;

  if (members.includes(name)) {
    input.value = "";
    return;
  }

  members.push(name);
  input.value = "";

  renderMembers(list);
}

function renderMembers(list) {
  list.innerHTML = "";

  members.forEach((member, index) => {
    const chip = document.createElement("span");
    chip.className = "member-chip removable";

    chip.innerHTML = `
      ${escapeHtml(member)}
      <button type="button" class="remove-member" data-index="${index}">
        ×
      </button>
    `;

    list.appendChild(chip);
  });

  document.querySelectorAll(".remove-member").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      members.splice(index, 1);
      renderMembers(list);
    });
  });
}

function getProjects() {
  try {
    return JSON.parse(localStorage.getItem("metras_projects")) || [];
  } catch {
    return [];
  }
}

function showError(element, message) {
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
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