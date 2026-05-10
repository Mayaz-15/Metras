// login.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
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

const loginForm    = document.getElementById('loginForm');
const loginBtn     = document.getElementById('loginBtn');
const loginError   = document.getElementById('loginError');
const loginLoading = document.getElementById('loginLoading');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  loginError.hidden = true;
  loginLoading.style.display = 'flex';
  loginBtn.disabled = true;

  const email    = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;

  try {
    // ── Step 1: Sign in with Firebase Auth ──
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;

    // ── Step 2: Get role from Firestore ──
    // Try by email (since admin creates users by email before they sign up)
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snap = await getDocs(q);

    if (snap.empty) {
      loginError.textContent = 'Account not found in system. Contact your administrator.';
      loginError.hidden = false;
      await auth.signOut();
      return;
    }

    const userData = snap.docs[0].data();

    if (userData.isActive === false) {
      loginError.textContent = 'Your account has been deactivated. Contact your administrator.';
      loginError.hidden = false;
      await auth.signOut();
      return;
    }

    // ── Step 3: Redirect based on role ──
    const role = userData.role;

    if (role === 'admin') {
      window.location.href = 'admin-dashboard.html';
    } else if (role === 'leader') {
      window.location.href = 'projects.html';
    } else if (role === 'team_member') {
      window.location.href = 'projects.html';
    } else {
      window.location.href = 'projects.html';
    }

  } catch (error) {
    console.error('Login error:', error);

    if (
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/wrong-password' ||
      error.code === 'auth/invalid-credential'
    ) {
      loginError.textContent = 'Incorrect email or password.';
    } else if (error.code === 'auth/too-many-requests') {
      loginError.textContent = 'Too many attempts. Please try again later.';
    } else {
      loginError.textContent = error.message || 'Sign-in failed. Please try again.';
    }

    loginError.hidden = false;

  } finally {
    loginLoading.style.display = 'none';
    loginBtn.disabled = false;
  }
});