let currentProjectId = null;
let currentProject = null;

document.addEventListener("DOMContentLoaded", async () => {
    if (!isProjectManager()) {
        window.location.href = "index.html";
        return;
    }

    currentProjectId = sessionStorage.getItem("currentProjectId");
    if (!currentProjectId) {
        window.location.href = "projects.html";
        return;
    }

    initTheme();
    initHamburger();
    
    document.getElementById("navLogout")?.addEventListener("click", logout);
    document.getElementById("drawerLogout")?.addEventListener("click", logout);
    
    await loadProject();
    await loadLeaders();
    await updateProjectDisplay();
    
    // Assign leader
    document.getElementById("btnAssignLeader").addEventListener("click", assignLeader);
    
    // Submit requirements
    const reqFile = document.getElementById("reqFile");
    const btnClearFile = document.getElementById("btnClearFile");
    const fileHint = document.getElementById("fileHint");
    const fileMeta = document.getElementById("fileMeta");
    
    reqFile.addEventListener("change", () => {
        const file = reqFile.files[0];
        if (file) {
            fileHint.textContent = `${file.name} • ${(file.size / 1024).toFixed(1)} KB`;
            fileMeta.textContent = `Selected: ${file.name}`;
        } else {
            fileHint.textContent = "PDF or TXT files only";
            fileMeta.textContent = "No file selected";
        }
    });
    
    btnClearFile.addEventListener("click", () => {
        reqFile.value = "";
        fileHint.textContent = "PDF or TXT files only";
        fileMeta.textContent = "No file selected";
    });
    
    document.getElementById("btnSubmitReq").addEventListener("click", submitRequirements);

    async function loadProject() {
        const doc = await db.collection('projects').doc(currentProjectId).get();
        if (doc.exists) {
            currentProject = { id: doc.id, ...doc.data() };
            document.getElementById("projectNameDisplay").textContent = currentProject.name || "Project Details";
        }
    }
    
    async function loadLeaders() {
        const result = await getAvailableLeaders();
        const select = document.getElementById("leaderSelect");
        if (result.success) {
            select.innerHTML = '<option value="">-- Select a leader --</option>' + 
                result.data.map(l => `<option value="${l.id}">${l.name} (${l.email})</option>`).join("");
        }
    }
    
    async function updateProjectDisplay() {
        if (!currentProject) return;
        
        document.getElementById("projectStatus").textContent = currentProject.status || "draft";
        
        if (currentProject.leaderId) {
            const leaderResult = await getUser(currentProject.leaderId);
            if (leaderResult.success) {
                document.getElementById("assignedLeader").textContent = `${leaderResult.data.name} (${leaderResult.data.email})`;
            }
        }
    }
    
    async function assignLeader() {
        const leaderId = document.getElementById("leaderSelect").value;
        if (!leaderId) {
            alert("Please select a leader");
            return;
        }
        
        const result = await updateProjectLeader(currentProjectId, leaderId);
        if (result.success) {
            const leaderResult = await getUser(leaderId);
            document.getElementById("leaderStatus").textContent = `✅ Leader assigned: ${leaderResult.success ? leaderResult.data.name : "Assigned"}`;
            document.getElementById("leaderStatus").hidden = false;
            setTimeout(() => document.getElementById("leaderStatus").hidden = true, 3000);
            
            currentProject.leaderId = leaderId;
            await updateProjectDisplay();
        } else {
            alert("Error assigning leader: " + result.error);
        }
    }
    
    async function submitRequirements() {
        const file = reqFile.files[0];
        if (!file) {
            alert("Please select a file to submit");
            return;
        }
        
        if (!currentProject.leaderId) {
            alert("Please assign a team leader first");
            return;
        }
        
        const submitMessage = document.getElementById("submitMessage");
        const submitError = document.getElementById("submitError");
        submitError.hidden = true;
        
        try {
            // For demo, extract text (in real app, send to your Python API)
            let content = "";
            if (file.type === "text/plain") {
                content = await file.text();
            } else {
                content = `[PDF content would be extracted here. File: ${file.name}]`;
            }
            
            const result = await submitRequirementDocument(currentProjectId, {
                fileName: file.name,
                content: content,
                submittedBy: getCurrentUserId(),
                status: 'pending_approval'
            });
            
            if (result.success) {
                submitMessage.textContent = "✅ Requirements submitted successfully! The leader has been notified.";
                submitMessage.hidden = false;
                setTimeout(() => submitMessage.hidden = true, 3000);
                reqFile.value = "";
                fileHint.textContent = "PDF or TXT files only";
                fileMeta.textContent = "No file selected";
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            submitError.textContent = "Error submitting: " + error.message;
            submitError.hidden = false;
            setTimeout(() => submitError.hidden = true, 3000);
        }
    }
});

function initTheme() {
    const themeToggle = document.getElementById("themeToggle");
    const drawerThemeToggle = document.getElementById("drawerThemeToggle");
    if (localStorage.getItem('metras_theme') === 'light') {
        document.body.classList.add('light-mode');
        themeToggle.textContent = '☀️';
        if(drawerThemeToggle) drawerThemeToggle.textContent = '☀️ Light Mode';
    } else {
        if(drawerThemeToggle) drawerThemeToggle.textContent = '🌙 Dark Mode';
    }
    themeToggle?.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        themeToggle.textContent = isLight ? '☀️' : '🌙';
        if(drawerThemeToggle) drawerThemeToggle.textContent = isLight ? '☀️ Light Mode' : '🌙 Dark Mode';
        localStorage.setItem('metras_theme', isLight ? 'light' : 'dark');
    });
    if(drawerThemeToggle) {
        drawerThemeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            themeToggle.textContent = isLight ? '☀️' : '🌙';
            drawerThemeToggle.textContent = isLight ? '☀️ Light Mode' : '🌙 Dark Mode';
            localStorage.setItem('metras_theme', isLight ? 'light' : 'dark');
        });
    }
}

function initHamburger() {
    const btnMenu = document.getElementById("btnMenu");
    const btnCloseDrawer = document.getElementById("btnCloseDrawer");
    const drawer = document.getElementById("drawer");
    const backdrop = document.getElementById("backdrop");
    btnMenu?.addEventListener("click", () => { drawer.classList.add("open"); backdrop.hidden = false; });
    btnCloseDrawer?.addEventListener("click", () => { drawer.classList.remove("open"); backdrop.hidden = true; });
    backdrop?.addEventListener("click", () => { drawer.classList.remove("open"); backdrop.hidden = true; });
}