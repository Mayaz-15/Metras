// projects.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAQ5GxT46n3RmKFVxj_iYQuO2emOpkLQbQ",
  authDomain: "metrasdatabase.firebaseapp.com",
  databaseURL: "https://metrasdatabase-default-rtdb.firebaseio.com",
  projectId: "metrasdatabase",
  storageBucket: "metrasdatabase.firebasestorage.app",
  messagingSenderId: "800641554410",
  appId: "1:800641554410:web:e511850495b4e2b0210493",
  measurementId: "G-04PLV9QBWK"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

let currentUserEmail = null;
let currentUserRole  = null;

// ── ATTACH BUTTON + DRAWER IMMEDIATELY ───────
// Do this on DOMContentLoaded so the button works
// even before Firebase auth resolves
document.addEventListener("DOMContentLoaded", () => {
  initDrawer();

  // New Project button — always wire it up immediately
  document.getElementById("btnCreateProject")?.addEventListener("click", () => {
    window.location.href = "createProject.html";
  });

  // Logout
  document.getElementById("navLogout")?.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
});

// ── AUTH GUARD ────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUserEmail = user.email.toLowerCase();

  // Get role from Firestore
  try {
    const q    = query(collection(db, "users"), where("email", "==", currentUserEmail));
    const snap = await getDocs(q);
    if (!snap.empty) {
      currentUserRole = snap.docs[0].data().role;
    }
  } catch (err) {
    console.error("Error getting user role:", err);
  }

  // Admins don't belong here
  if (currentUserRole === "admin") {
    window.location.href = "admin-dashboard.html";
    return;
  }

  // Hide New Project button for team members
  if (currentUserRole !== "leader") {
    document.getElementById("btnCreateProject")?.remove();
  }

  loadProjects();
});

// ── LOAD PROJECTS ─────────────────────────────
function loadProjects() {
  const projectsGrid = document.getElementById("projectsGrid");
  if (!projectsGrid) return;

  const allProjects = getProjects();
  let filtered = [];

  if (currentUserRole === "leader") {
    filtered = allProjects.filter(p => p.leaderEmail === currentUserEmail);
  } else if (currentUserRole === "team_member") {
    filtered = allProjects.filter(p =>
      p.members && p.members.some(m => m.email === currentUserEmail)
    );
  }

  projectsGrid.innerHTML = "";

  if (filtered.length === 0) {
    projectsGrid.innerHTML = `
      <div class="empty-state">
        ${currentUserRole === "leader"
          ? 'No projects yet. Click "+ New Project" to get started.'
          : "You have not been added to any projects yet."}
      </div>`;
    return;
  }

  filtered.forEach(project => {
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
        ${project.members && project.members.length > 0
          ? project.members.map(m => `<span class="member-chip">${escapeHtml(m.name)}</span>`).join("")
          : '<span class="project-muted">No members added</span>'}
      </div>
      <div class="project-meta">Created: ${escapeHtml(project.createdAt || "Unknown")}</div>
    `;

    card.addEventListener("click", () => openProjectPopup(project));
    projectsGrid.appendChild(card);
  });
}

// ── PROJECT POPUP ─────────────────────────────
function openProjectPopup(project) {
  localStorage.setItem("metras_current_project", JSON.stringify(project));

  document.getElementById("projectPopup")?.remove();

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
          <span class="popup-label">Description</span>
          <span class="popup-value">${escapeHtml(project.description || "No description provided.")}</span>
        </div>
        <div class="popup-row">
          <span class="popup-label">Team Members</span>
          <span class="popup-value">
            ${project.members && project.members.length > 0
              ? project.members.map(m => escapeHtml(m.name)).join(", ")
              : "No members added"}
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
        <button class="btn btn-secondary" id="popupCancel" type="button">Close</button>
        <button class="btn btn-primary" id="goToResults" type="button">View Results</button>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  document.getElementById("closeProjectPopup")?.addEventListener("click", closeProjectPopup);
  document.getElementById("popupCancel")?.addEventListener("click", closeProjectPopup);
  document.getElementById("goToResults")?.addEventListener("click", () => {
    window.location.href = "results.html";
  });
  popup.addEventListener("click", e => { if (e.target === popup) closeProjectPopup(); });
}

function closeProjectPopup() {
  document.getElementById("projectPopup")?.remove();
}

// ── HELPERS ───────────────────────────────────
function getProjects() {
  try { return JSON.parse(localStorage.getItem("metras_projects")) || []; }
  catch { return []; }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

function initDrawer() {
  const btnMenu        = document.getElementById("btnMenu");
  const btnCloseDrawer = document.getElementById("btnCloseDrawer");
  const drawer         = document.getElementById("drawer");
  const backdrop       = document.getElementById("backdrop");

  btnMenu?.addEventListener("click",        () => { drawer.classList.add("open");    backdrop.hidden = false; });
  btnCloseDrawer?.addEventListener("click", () => { drawer.classList.remove("open"); backdrop.hidden = true;  });
  backdrop?.addEventListener("click",       () => { drawer.classList.remove("open"); backdrop.hidden = true;  });
}