// admin.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

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

// Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// =============================================
// PROTECT PAGE - ONLY ADMINS CAN ACCESS
// =============================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  
  // Check if user has admin role
  const userDoc = await getDocs(collection(db, 'users'));
  let isAdmin = false;
  userDoc.forEach(doc => {
    if (doc.id === user.uid && doc.data().role === 'admin') {
      isAdmin = true;
    }
  });
  
  if (!isAdmin) {
    window.location.href = 'index.html';
  }
});

// =============================================
// HAMBURGER MENU
// =============================================
const btnMenu = document.getElementById("btnMenu");
const btnCloseDrawer = document.getElementById("btnCloseDrawer");
const drawer = document.getElementById("drawer");
const backdrop = document.getElementById("backdrop");

if (btnMenu) {
  btnMenu.addEventListener("click", () => {
    drawer.classList.add("open");
    backdrop.hidden = false;
  });
}

if (btnCloseDrawer) {
  btnCloseDrawer.addEventListener("click", () => {
    drawer.classList.remove("open");
    backdrop.hidden = true;
  });
}

if (backdrop) {
  backdrop.addEventListener("click", () => {
    drawer.classList.remove("open");
    backdrop.hidden = true;
  });
}

// =============================================
// LOGOUT FUNCTION
// =============================================
const navLogout = document.getElementById("navLogout");
const drawerLogout = document.getElementById("drawerLogout");

async function handleLogout() {
  try {
    await auth.signOut();
    window.location.href = 'login.html';
  } catch (error) {
    console.error("Logout error:", error);
  }
}

if (navLogout) navLogout.addEventListener("click", handleLogout);
if (drawerLogout) drawerLogout.addEventListener("click", handleLogout);

// =============================================
// ADD USER - MATCHING YOUR HTML IDs
// =============================================
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const userRole = document.getElementById('userRole');
const userCompany = document.getElementById('userCompany');
const btnAddUser = document.getElementById('btnAddUser');
const addUserMessage = document.getElementById('addUserMessage');
const addUserError = document.getElementById('addUserError');

async function addUser() {
  // Clear previous messages
  addUserMessage.hidden = true;
  addUserError.hidden = true;
  
  const name = userName?.value.trim();
  const email = userEmail?.value.trim();
  const role = userRole?.value;
  const company = userCompany?.value.trim();
  
  if (!name || !email || !role) {
    addUserError.textContent = "Please fill all required fields";
    addUserError.hidden = false;
    return;
  }
  
  if (!btnAddUser) return;
  
  btnAddUser.disabled = true;
  btnAddUser.textContent = "Adding...";
  
  try {
    // Create user in Firestore (Auth user needs to be created separately in Firebase Console or via email invite)
    const usersCol = collection(db, 'users');
    const docRef = await addDoc(usersCol, {
      name: name,
      email: email,
      role: role,
      company: company || "Not specified",
      isActive: true,
      createdAt: serverTimestamp(),
      lastLogin: null
    });
    
    addUserMessage.textContent = `User ${name} added successfully! They will need to be created in Firebase Authentication.`;
    addUserMessage.hidden = false;
    
    // Clear form
    if (userName) userName.value = "";
    if (userEmail) userEmail.value = "";
    if (userCompany) userCompany.value = "";
    
    // Refresh user list
    loadUsers();
    
  } catch (err) {
    console.error('Add user error', err);
    addUserError.textContent = err.message || 'Failed to add user';
    addUserError.hidden = false;
  } finally {
    btnAddUser.disabled = false;
    btnAddUser.textContent = "Add User";
  }
}

if (btnAddUser) {
  btnAddUser.addEventListener('click', addUser);
}

// =============================================
// LOAD AND DISPLAY USERS
// =============================================
const usersTableBody = document.getElementById('usersTableBody');
const userCountSpan = document.getElementById('userCount');

async function loadUsers() {
  if (!usersTableBody) return;
  
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    querySnapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    userCountSpan.textContent = `${users.length} users`;
    
    if (users.length === 0) {
      usersTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No users found</td></tr>';
      return;
    }
    
    usersTableBody.innerHTML = users.map(user => `
      <tr>
        <td>${escapeHtml(user.name || 'N/A')}</td>
        <td>${escapeHtml(user.email)}</td>
        <td><span class="chip chip-${getRoleColor(user.role)}">${formatRole(user.role)}</span></td>
        <td>${escapeHtml(user.company || 'N/A')}</td>
        <td>${user.isActive !== false ? '✅ Active' : '❌ Inactive'}</td>
        <td>
          <button class="link-btn" onclick="toggleUserStatus('${user.id}', ${!user.isActive})">
            ${user.isActive !== false ? "Disable" : "Enable"}
          </button>
          <button class="link-btn" style="color:#ff8a96;" onclick="deleteUser('${user.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
    
  } catch (error) {
    console.error("Load users error:", error);
    usersTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Error loading users</td></tr>';
  }
}

// Helper functions
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getRoleColor(role) {
  switch(role) {
    case 'admin': return 'primary';
    case 'project_manager': return 'high';
    case 'leader': return 'medium';
    case 'team_member': return 'low';
    default: return 'medium';
  }
}

function formatRole(role) {
  switch(role) {
    case 'project_manager': return 'Project Manager';
    case 'team_member': return 'Team Member';
    default: return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Unknown';
  }
}

// Global functions for inline buttons
window.toggleUserStatus = async function(userId, newStatus) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { isActive: newStatus });
    loadUsers();
  } catch (error) {
    console.error("Error updating user status:", error);
    alert("Error updating user status");
  }
};

window.deleteUser = async function(userId) {
  if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
    try {
      await deleteDoc(doc(db, 'users', userId));
      loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error deleting user: " + error.message);
    }
  }
};

// Load users when page loads
loadUsers();