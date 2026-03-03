(() => {
  const reqFile = document.getElementById("reqFile");
  const dropzone = document.getElementById("dropzone");
  const fileHint = document.getElementById("fileHint");
  const fileMeta = document.getElementById("fileMeta");
  const btnClearFile = document.getElementById("btnClearFile");

  const reqText = document.getElementById("reqText");
  const textMeta = document.getElementById("textMeta");
  const btnClearText = document.getElementById("btnClearText");

  const btnAnalyze = document.getElementById("btnAnalyze");
  const btnUseSample = document.getElementById("btnUseSample");

  const loading = document.getElementById("loading");
  const analysisBody = document.getElementById("analysisBody");

  const btnMenu = document.getElementById("btnMenu");
  const btnCloseDrawer = document.getElementById("btnCloseDrawer");
  const drawer = document.getElementById("drawer");
  const backdrop = document.getElementById("backdrop");

  // ---------- Helpers ----------
  const humanFileSize = (bytes) => {
    if (!Number.isFinite(bytes)) return "";
    const units = ["B","KB","MB","GB"];
    let size = bytes;
    let u = 0;
    while (size >= 1024 && u < units.length - 1) { size /= 1024; u++; }
    return `${size.toFixed(u === 0 ? 0 : 1)} ${units[u]}`;
  };

  const setLoading = (isLoading) => {
    loading.style.display = isLoading ? "flex" : "none";
    btnAnalyze.disabled = isLoading;
    btnAnalyze.style.opacity = isLoading ? "0.7" : "1";
    btnAnalyze.style.cursor = isLoading ? "not-allowed" : "pointer";
  };

  const renderMockTable = () => {
    analysisBody.innerHTML = `
      <table class="table" aria-label="Risk assessment results (mock)">
        <thead>
          <tr>
            <th>Requirement</th>
            <th>Mapped CWE</th>
            <th>Severity</th>
            <th>Impact</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Users shall authenticate using username/password</td>
            <td>CWE-287 (Improper Authentication)</td>
            <td><span class="badge">High</span></td>
            <td>Account takeover risk</td>
          </tr>
          <tr>
            <td>System shall store sensitive data on device</td>
            <td>CWE-312 (Cleartext Storage)</td>
            <td><span class="badge">Medium</span></td>
            <td>Data exposure</td>
          </tr>
          <tr>
            <td>APIs shall accept user input for search</td>
            <td>CWE-89 (SQL Injection)</td>
            <td><span class="badge">High</span></td>
            <td>DB compromise</td>
          </tr>
        </tbody>
      </table>
    `;
  };

  // ---------- File handling ----------
  const updateFileUI = () => {
    const file = reqFile.files && reqFile.files[0];
    if (!file) {
      fileHint.textContent = "Drag & drop or click to select";
      fileMeta.textContent = "No file selected";
      return;
    }
    fileHint.textContent = `${file.name} • ${humanFileSize(file.size)}`;
    fileMeta.textContent = `Selected: ${file.name}`;
  };

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "#bdbfe6";
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.style.borderColor = "#d6d6ea";
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "#d6d6ea";
    const files = e.dataTransfer.files;
    if (files && files.length) {
      reqFile.files = files;
      updateFileUI();
    }
  });

  reqFile.addEventListener("change", updateFileUI);

  btnClearFile.addEventListener("click", () => {
    reqFile.value = "";
    updateFileUI();
  });

  // ---------- Text handling ----------
  const updateTextMeta = () => {
    const len = reqText.value.length;
    textMeta.textContent = `${len.toLocaleString()} characters`;
  };

  reqText.addEventListener("input", updateTextMeta);

  btnClearText.addEventListener("click", () => {
    reqText.value = "";
    updateTextMeta();
  });

  btnUseSample.addEventListener("click", () => {
    reqText.value =
`1. The system shall require multi-factor authentication for privileged accounts.
2. The application shall encrypt sensitive data at rest on mobile devices.
3. The API shall validate and sanitize all user-provided inputs.
4. The system shall log security-relevant events and retain them for 180 days.`;
    updateTextMeta();
  });

  // ---------- Analyze (front-end only) ----------
  
  btnAnalyze.addEventListener("click", () => {
  const hasFile = reqFile.files && reqFile.files[0];
  const hasText = reqText.value.trim().length > 0;

  if (!hasFile && !hasText) {
    alert("Please upload a document or paste text before analyzing.");
    return;
  }

  // مؤقتًا بدون backend
  window.location.href = "results.html";


    setLoading(true);
    analysisBody.innerHTML = `
      <div class="empty-state">Processing input (mock)…</div>
    `;

    // Mock delay (replace later with API call)
    window.setTimeout(() => {
      setLoading(false);
      renderMockTable();
    }, 1200);
  });

  // ---------- Drawer ----------
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

  btnMenu.addEventListener("click", openDrawer);
  btnCloseDrawer.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);

  // Init
  updateFileUI();
  updateTextMeta();
})();