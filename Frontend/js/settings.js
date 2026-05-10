// settings.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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

let currentDocId = null;

// ── DOM ───────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initDrawer();

  document.getElementById("navLogout")?.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });

  document.getElementById("btnSaveSettings")?.addEventListener("click", saveSettings);
});

// ── AUTH ──────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  await loadUserInfo(user.email.toLowerCase());
});

// ── LOAD USER INFO ────────────────────────────
async function loadUserInfo(email) {
  try {
    const q    = query(collection(db, "users"), where("email", "==", email));
    const snap = await getDocs(q);

    if (snap.empty) return;

    const userDoc  = snap.docs[0];
    const userData = userDoc.data();
    currentDocId   = userDoc.id;

    // Fill in real values
    const fullNameInput = document.getElementById("fullName");
    const emailInput    = document.getElementById("email");
    const roleInput     = document.getElementById("role");

    if (fullNameInput) fullNameInput.value = userData.name    || "";
    if (emailInput)    emailInput.value    = userData.email   || "";
    if (roleInput)     roleInput.value     = formatRole(userData.role);

  } catch (err) {
    console.error("loadUserInfo error:", err);
  }
}

// ── SAVE SETTINGS ─────────────────────────────
async function saveSettings() {
  if (!currentDocId) {
    showMessage("Could not find your account. Please try again.", "error");
    return;
  }

  const fullName = document.getElementById("fullName")?.value.trim();

  if (!fullName) {
    showMessage("Name cannot be empty.", "error");
    return;
  }

  const btnSave = document.getElementById("btnSaveSettings");
  btnSave.disabled    = true;
  btnSave.textContent = "Saving...";

  try {
    await updateDoc(doc(db, "users", currentDocId), {
      name: fullName
    });

    showMessage("Settings saved successfully!", "success");

  } catch (err) {
    console.error("saveSettings error:", err);
    showMessage("Failed to save settings. Please try again.", "error");
  } finally {
    btnSave.disabled    = false;
    btnSave.textContent = "Save Changes";
  }
}

// ── HELPERS ───────────────────────────────────
function formatRole(role) {
  switch (role) {
    case "admin":       return "Admin";
    case "leader":      return "Team Leader";
    case "team_member": return "Team Member";
    default: return role || "Unknown";
  }
}

function showMessage(msg, type) {
  // Remove any existing message
  document.getElementById("settingsMsg")?.remove();

  const el = document.createElement("div");
  el.id = "settingsMsg";
  el.className = type === "success" ? "success-message" : "error-message";
  el.textContent = msg;
  el.style.marginTop = "12px";

  document.querySelector(".actions")?.appendChild(el);

  setTimeout(() => el.remove(), 3000);
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