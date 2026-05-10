// createProject.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
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

// Selected members list — stores { name, email } objects
let selectedMembers = [];
let currentUserEmail = null;

// ── AUTH GUARD ────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUserEmail = user.email;
  await loadTeamMembers();
});

// ── LOAD TEAM MEMBERS FROM FIRESTORE ─────────
async function loadTeamMembers() {
  const memberSelect = document.getElementById("memberSelect");
  if (!memberSelect) return;

  try {
    const q    = query(collection(db, "users"), where("role", "==", "team_member"), where("isActive", "==", true));
    const snap = await getDocs(q);

    if (snap.empty) {
      memberSelect.innerHTML = '<option value="">No team members registered yet</option>';
      return;
    }

    memberSelect.innerHTML = '<option value="">-- Select a team member --</option>';
    snap.forEach(doc => {
      const u = doc.data();
      const option = document.createElement("option");
      option.value = JSON.stringify({ name: u.name, email: u.email });
      option.textContent = `${u.name} (${u.email})`;
      memberSelect.appendChild(option);
    });

  } catch (err) {
    console.error("loadTeamMembers error:", err);
    memberSelect.innerHTML = '<option value="">Error loading members</option>';
  }
}

// ── INIT ─────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initDrawer();

  const projectName    = document.getElementById("projectName");
  const projectDesc    = document.getElementById("projectDesc");
  const memberSelect   = document.getElementById("memberSelect");
  const btnAddMember   = document.getElementById("btnAddMember");
  const membersList    = document.getElementById("membersList");
  const btnCreateProject = document.getElementById("btnCreateProject");
  const projectError   = document.getElementById("projectError");

  // ── Add member from dropdown ──
  btnAddMember?.addEventListener("click", () => {
    const val = memberSelect?.value;
    if (!val) return;

    try {
      const member = JSON.parse(val);

      // Prevent duplicates
      if (selectedMembers.find(m => m.email === member.email)) {
        memberSelect.value = "";
        return;
      }

      selectedMembers.push(member);
      memberSelect.value = "";
      renderMembers(membersList);
    } catch (_) {}
  });

  // ── Create project ──
  btnCreateProject?.addEventListener("click", () => {
    const name        = projectName?.value.trim();
    const description = projectDesc?.value.trim();

    if (!name) {
      showError(projectError, "Please enter a project name.");
      return;
    }

    projectError.hidden = true;

    const projects = getProjects();

    const newProject = {
      id:          Date.now().toString(),
      name,
      description: description || "No description provided.",
      members:     selectedMembers,   // [{ name, email }, ...]
      leaderEmail: currentUserEmail,  // so projects.js can filter by leader
      status:      "Draft",
      createdAt:   new Date().toLocaleDateString()
    };

    projects.push(newProject);

    localStorage.setItem("metras_projects",        JSON.stringify(projects));
    localStorage.setItem("metras_current_project", JSON.stringify(newProject));

    window.location.href = "teamleader.html";
  });

  projectName?.addEventListener("input", () => { projectError.hidden = true; });
});

// ── RENDER SELECTED MEMBERS ───────────────────
function renderMembers(list) {
  if (!list) return;
  list.innerHTML = "";

  selectedMembers.forEach((member, index) => {
    const chip = document.createElement("span");
    chip.className = "member-chip removable";
    chip.innerHTML = `
      ${escapeHtml(member.name)}
      <button type="button" class="remove-member" data-index="${index}">×</button>
    `;
    list.appendChild(chip);
  });

  document.querySelectorAll(".remove-member").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedMembers.splice(Number(btn.dataset.index), 1);
      renderMembers(list);
    });
  });
}

// ── HELPERS ───────────────────────────────────
function getProjects() {
  try { return JSON.parse(localStorage.getItem("metras_projects")) || []; }
  catch { return []; }
}

function showError(element, message) {
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
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