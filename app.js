// Elementos del DOM
const loginContainer = document.getElementById("login-container");
const dashboardContainer = document.getElementById("dashboard-container");
const usernameInput = document.getElementById("username");
const loginBtn = document.getElementById("login-btn");
const errorMessage = document.getElementById("error-message");
const usernameDisplay = document.getElementById("username-display");

// Usuarios válidos
const validUsers = ["mati", "chuba", "joako"];

// MQTT
let client;

// Login
loginBtn.addEventListener("click", () => {
    const username = usernameInput.value.trim().toLowerCase();

    if (validUsers.includes(username)) {
        // Ocultar login y mostrar dashboard
        loginContainer.style.display = "none";
        dashboardContainer.style.display = "block";

        // Mostrar nombre de usuario
        usernameDisplay.innerText = username;

        // Conectar a MQTT
        connectMQTT(username);
    } else {
        errorMessage.innerText = "Usuario no válido. Prueba con 'mati', 'chuba' o 'joako'.";
    }
});

// Conectar a MQTT
function connectMQTT(username) {
    const brokerUrl = "wss://s6dfb2db.ala.us-east-1.emqxsl.com:8084/mqtt";
    client = mqtt.connect(brokerUrl, { username: "MATI", password: "MATI" });

    client.on("connect", () => {
        document.getElementById("status").innerText = "✅ Conectado";
        client.subscribe(`devices/${username}/data`);
    });

    client.on("message", (topic, message) => {
        const data = JSON.parse(message);
        document.getElementById("humedad").innerText = data.soilMoisture + " %";
        document.getElementById("temperatura").innerText = data.airTemperature + " °C";
    });
}

// Chat en Vivo
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

sendBtn.addEventListener("click", () => {
    const message = chatInput.value.trim();
    if (message) {
        const chatMessage = document.createElement("div");
        chatMessage.className = "chat-message";
        chatMessage.innerHTML = `<strong>${usernameDisplay.innerText}:</strong> ${message}`;
        chatMessages.appendChild(chatMessage);
        chatInput.value = "";
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});
