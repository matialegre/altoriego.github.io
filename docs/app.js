import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDwLd-EO1g6TTv6eEsjM_x1Lgz_PMGNSHQ",
    authDomain: "alto-riego.firebaseapp.com",
    projectId: "alto-riego",
    storageBucket: "alto-riego.appspot.com",
    messagingSenderId: "698378558038",
    appId: "1:698378558038:web:462593b27b5d7baa9539f7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById("login-btn").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "dashboard.html"; // Redirigir al dashboard
    } catch (error) {
        document.getElementById("error-message").innerText = error.message;
    }
});
