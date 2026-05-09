document.addEventListener("DOMContentLoaded", () => {
  initDrawer();
  initCreateProject();
});

function initCreateProject() {
  const projectName = document.getElementById("projectName");
  const projectDesc = document.getElementById("projectDesc");
  const btnCreateProject = document.getElementById("btnCreateProject");
  const projectError = document.getElementById("projectError");

  if (!btnCreateProject || !projectName) return;

  btnCreateProject.addEventListener("click", () => {
    const name = projectName.value.trim();
    const description = projectDesc ? projectDesc.value.trim() : "";

    if (!name) {
      projectError.textContent = "Please enter a project name.";
      projectError.hidden = false;
      return;
    }

    const projects = JSON.parse(localStorage.getItem("metras_projects")) || [];

    const newProject = {
      id: Date.now().toString(),
      name,
      description: description || "No description provided.",
      status: "Draft",
      createdAt: new Date().toLocaleDateString()
    };

    projects.push(newProject);

    localStorage.setItem("metras_projects", JSON.stringify(projects));
    localStorage.setItem("metras_current_project", JSON.stringify(newProject));

    window.location.href = "teamleader.html";
  });
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