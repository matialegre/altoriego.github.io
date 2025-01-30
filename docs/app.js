// Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, addDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Importar MQTT.js
import mqtt from "https://unpkg.com/mqtt/dist/mqtt.min.js";

// 🔥 CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyDwLd-EO1g6TTv6eEsjM_x1Lgz_PMGNSHQ",
    authDomain: "alto-riego.firebaseapp.com",
    projectId: "alto-riego",
    storageBucket: "alto-riego.appspot.com",
    messagingSenderId: "698378558038",
    appId: "1:698378558038:web:462593b27b5d7baa9539f7"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// MQTT Configuración
const brokerUrl = "wss://s6dfb2db.ala.us-east-1.emqxsl.com:8084/mqtt";
let client;
let userEmail = "";

// 📌 Login
document.getElementById("login-btn").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        userEmail = userCredential.user.email;
        console.log("✅ Usuario logueado:", userEmail);

        // Obtener dispositivo
        const userRef = doc(db, "users", email);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            const deviceID = docSnap.data().device;
            conectarMQTT(deviceID);
            document.getElementById("user-info").innerText = `Bienvenido, ${userEmail}`;
            document.getElementById("dispositivo").innerText = `Dispositivo: ${deviceID}`;
        }
    } catch (error) {
        console.error("❌ Error en login:", error.message);
    }
});

// 📌 Conectar a MQTT
function conectarMQTT(deviceID) {
    client = mqtt.connect(brokerUrl, { username: "MATI", password: "MATI" });
    const topicData = `devices/${deviceID}/data`;

    client.on("connect", () => client.subscribe(topicData));

    client.on("message", (topic, message) => {
        let data = JSON.parse(message);
        document.getElementById("humedad").innerText = data.soilMoisture + " %";
        document.getElementById("temperatura").innerText = data.airTemperature + " °C";
    });
}
