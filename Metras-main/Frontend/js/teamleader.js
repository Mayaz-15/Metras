document.addEventListener("DOMContentLoaded", () => {
  initDrawer();
  loadCurrentProjectName();
  initInputs();
  initAnalyzeButton();
});

let selectedFile = null;

function loadCurrentProjectName() {
  const currentProjectTab = document.getElementById("currentProjectTab");
  const currentProject = getCurrentProject();

  if (currentProject && currentProjectTab) {
    currentProjectTab.textContent = currentProject.name;
  }
}

function initInputs() {
  const reqFile = document.getElementById("reqFile");
  const fileMeta = document.getElementById("fileMeta");
  const fileHint = document.getElementById("fileHint");
  const btnClearFile = document.getElementById("btnClearFile");

  const reqText = document.getElementById("reqText");
  const textMeta = document.getElementById("textMeta");
  const btnClearText = document.getElementById("btnClearText");

  reqFile?.addEventListener("change", () => {
    selectedFile = reqFile.files[0] || null;

    if (selectedFile) {
      fileMeta.textContent = selectedFile.name;
      fileHint.textContent = "File selected";
    } else {
      fileMeta.textContent = "No file selected";
      fileHint.textContent = "Drag & drop or click to select";
    }
  });

  btnClearFile?.addEventListener("click", () => {
    selectedFile = null;

    if (reqFile) reqFile.value = "";
    if (fileMeta) fileMeta.textContent = "No file selected";
    if (fileHint) fileHint.textContent = "Drag & drop or click to select";
  });

  reqText?.addEventListener("input", () => {
    if (textMeta) {
      textMeta.textContent = `${reqText.value.length} characters`;
    }
  });

  btnClearText?.addEventListener("click", () => {
    if (reqText) reqText.value = "";
    if (textMeta) textMeta.textContent = "0 characters";
  });
}

function initAnalyzeButton() {
  const btnAnalyze = document.getElementById("btnAnalyze");
  const btnUseSample = document.getElementById("btnUseSample");
  const reqText = document.getElementById("reqText");
  const textMeta = document.getElementById("textMeta");
  const fileError = document.getElementById("fileError");

  btnUseSample?.addEventListener("click", () => {
    const sampleText =
      "The system shall allow users to create accounts using email and password. " +
      "The system shall store user login credentials securely. " +
      "The system shall allow users to upload requirement documents for analysis.";

    if (reqText) {
      reqText.value = sampleText;
    }

    if (textMeta) {
      textMeta.textContent = `${sampleText.length} characters`;
    }
  });

  btnAnalyze?.addEventListener("click", async () => {
    const currentProject = getCurrentProject();

    if (!currentProject) {
      showError(fileError, "Please create or select a project first.");
      return;
    }

    const textValue = reqText ? reqText.value.trim() : "";

    if (!selectedFile && !textValue) {
      showError(fileError, "Please upload a file or paste requirements text.");
      return;
    }

    hideError(fileError);

    const formData = new FormData();

    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    if (textValue) {
      formData.append("text", textValue);
    }

    await runAnalysis(formData, currentProject);
  });
}

async function runAnalysis(formData, currentProject) {
  try {
    const response = await fetch("http://localhost:8000/analyze", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Analysis failed.");
    }

    const results = await response.json();

    sessionStorage.setItem("metras_results", JSON.stringify(results));

    const allProjectResults = getAllProjectResults();

    allProjectResults[currentProject.id] = results;

    localStorage.setItem(
      "metras_project_results",
      JSON.stringify(allProjectResults)
    );

    localStorage.setItem(
      "metras_current_project",
      JSON.stringify(currentProject)
    );

    updateProjectStatus(currentProject.id, "Analyzed");

    window.location.href = "results.html";

  } catch (error) {
    console.error(error);
    alert("Failed to analyze requirements. Make sure the backend is running.");
  }
}

function updateProjectStatus(projectId, newStatus) {
  const projects = getProjects();

  const updatedProjects = projects.map((project) => {
    if (project.id === projectId) {
      return {
        ...project,
        status: newStatus
      };
    }

    return project;
  });

  localStorage.setItem("metras_projects", JSON.stringify(updatedProjects));

  const updatedCurrentProject = updatedProjects.find(
    (project) => project.id === projectId
  );

  if (updatedCurrentProject) {
    localStorage.setItem(
      "metras_current_project",
      JSON.stringify(updatedCurrentProject)
    );
  }
}

function getCurrentProject() {
  try {
    return JSON.parse(localStorage.getItem("metras_current_project"));
  } catch {
    return null;
  }
}

function getProjects() {
  try {
    return JSON.parse(localStorage.getItem("metras_projects")) || [];
  } catch {
    return [];
  }
}

function getAllProjectResults() {
  try {
    return JSON.parse(localStorage.getItem("metras_project_results")) || {};
  } catch {
    return {};
  }
}

function showError(element, message) {
  if (!element) return;

  element.textContent = message;
  element.hidden = false;
}

function hideError(element) {
  if (!element) return;

  element.textContent = "";
  element.hidden = true;
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