// signup.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
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

// ── DOM ──────────────────────────────────────
const signupForm    = document.getElementById('signupForm');
const signupBtn     = document.getElementById('signupBtn');
const signupError   = document.getElementById('signupError');
const signupSuccess = document.getElementById('signupSuccess');
const signupLoading = document.getElementById('signupLoading');

function showError(msg) {
  signupError.textContent = msg;
  signupError.hidden = false;
  signupSuccess.hidden = true;
}

function showSuccess(msg) {
  signupSuccess.textContent = msg;
  signupSuccess.hidden = false;
  signupError.hidden = true;
}

function setLoading(on) {
  signupLoading.style.display = on ? 'flex' : 'none';
  signupBtn.disabled = on;
}

// ── SUBMIT ───────────────────────────────────
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  signupError.hidden = true;
  signupSuccess.hidden = true;

  const email    = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  const confirm  = document.getElementById('confirmPassword').value;

  // ── Basic validation ──
  if (!email || !password || !confirm) {
    showError('Please fill in all fields.');
    return;
  }

  if (password.length < 6) {
    showError('Password must be at least 6 characters.');
    return;
  }

  if (password !== confirm) {
    showError('Passwords do not match.');
    return;
  }

  setLoading(true);

  try {
    // ── Step 1: Check email exists in Firestore ──
    const q    = query(collection(db, 'users'), where('email', '==', email));
    const snap = await getDocs(q);

    if (snap.empty) {
      showError('This email is not registered in the system. Please contact your administrator.');
      setLoading(false);
      return;
    }

    const userData = snap.docs[0].data();

    if (userData.isActive === false) {
      showError('Your account has been deactivated. Please contact your administrator.');
      setLoading(false);
      return;
    }

    // ── Step 2: Create Firebase Auth account ──
    await createUserWithEmailAndPassword(auth, email, password);

    showSuccess('Account created! Redirecting...');

    // ── Step 3: Redirect based on role ──
    setTimeout(() => {
      const role = userData.role;
      if (role === 'admin') {
        window.location.href = 'admin-dashboard.html';
      } else {
        window.location.href = 'projects.html';
      }
    }, 1500);

  } catch (error) {
    console.error('Signup error:', error);

    if (error.code === 'auth/email-already-in-use') {
      showError('An account with this email already exists. Please log in instead.');
    } else {
      showError(error.message || 'Failed to create account. Please try again.');
    }
  } finally {
    setLoading(false);
  }
});