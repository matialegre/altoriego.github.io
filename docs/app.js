// Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

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

// 📌 Función de Login
document.getElementById("login-btn").addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;
            console.log("✅ Usuario logueado:", user.email);

            // Cargar dispositivo asignado en Firestore
            const deviceID = await obtenerDispositivo(user.email);
            if (deviceID) {
                conectarMQTT(deviceID);
                document.getElementById("user-info").innerText = `Bienvenido, ${user.email}`;
                document.getElementById("dispositivo").innerText = `Dispositivo: ${deviceID}`;
            } else {
                document.getElementById("dispositivo").innerText = "⚠️ No se encontró dispositivo asignado.";
            }
        })
        .catch((error) => {
            console.error("❌ Error en login:", error.message);
            document.getElementById("user-info").innerText = "❌ Error en el login.";
        });
});

// 📌 Obtener el dispositivo asignado al usuario desde Firestore
async function obtenerDispositivo(email) {
    const userRef = doc(db, "users", email);
    const docSnap = await getDoc(userRef);
    return docSnap.exists() ? docSnap.data().device : null;
}

// 📌 Conectar a MQTT usando el dispositivo asignado
function conectarMQTT(deviceID) {
    console.log("🔌 Conectando a MQTT con dispositivo:", deviceID);

    client = mqtt.connect(brokerUrl, { username: "MATI", password: "MATI" });

    const topicData = `devices/${deviceID}/data`;
    const topicCommand = `devices/${deviceID}/commands`;

    client.on("connect", function () {
        console.log("✅ Conectado a MQTT");
        client.subscribe(topicData);
        document.getElementById("status").innerText = "✅ Conectado";
    });

    client.on("message", function (topic, message) {
        if (topic === topicData) {
            let data = JSON.parse(message);
            document.getElementById("humedad").innerText = data.soilMoisture + " %";
            document.getElementById("temperatura").innerText = data.airTemperature + " °C";

            chartData.labels.push(new Date().toLocaleTimeString());
            chartData.datasets[0].data.push(data.soilMoisture);
            if (chartData.labels.length > 20) {
                chartData.labels.shift();
                chartData.datasets[0].data.shift();
            }
            chart.update();
        }
    });

    // 📌 Función para publicar comandos
    window.publishCommand = function (command) {
        client.publish(topicCommand, command);
        document.getElementById("status").innerText = (command === "ON") ? "💧 Riego ACTIVADO" : "🛑 Riego DESACTIVADO";
    };
}
