// Conectar a MQTT
const brokerUrl = "wss://s6dfb2db.ala.us-east-1.emqxsl.com:8084/mqtt";
const client = mqtt.connect(brokerUrl, { username: "MATI", password: "MATI" });

client.on("connect", () => {
    document.getElementById("status").innerText = "✅ Conectado";
    client.subscribe("devices/mi_riego/data");
});

client.on("message", (topic, message) => {
    const data = JSON.parse(message);
    document.getElementById("humedad").innerText = data.soilMoisture + " %";
    document.getElementById("temperatura").innerText = data.airTemperature + " °C";
});

// Chat en Vivo
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

sendBtn.addEventListener("click", () => {
    const message = chatInput.value.trim();
    if (message) {
        const chatMessage = document.createElement("div");
        chatMessage.className = "chat-message";
        chatMessage.innerHTML = `<strong>Usuario:</strong> ${message}`;
        chatMessages.appendChild(chatMessage);
        chatInput.value = "";
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

// Publicar comandos MQTT
function publishCommand(command) {
    client.publish("devices/mi_riego/commands", command);
}
