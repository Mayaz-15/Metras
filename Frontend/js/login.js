// login.js (replace your current file)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const loginLoading = document.getElementById('loginLoading');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  loginLoading.style.display = 'flex';
  loginBtn.disabled = true;

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Signed in — you can redirect or update UI
    console.log('Signed in:', userCredential.user);
    // example redirect:
    window.location.href = 'admin-dashboard.html';
  } catch (error) {
    console.error(error);
    loginError.textContent = error.message || 'Sign-in failed';
    loginError.hidden = false;
  } finally {
    loginLoading.style.display = 'none';
    loginBtn.disabled = false;
  }
});
