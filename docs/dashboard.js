import { getFirestore, doc, getDoc, collection, addDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { app } from "./app.js";

const auth = getAuth(app);
const db = getFirestore(app);
const userEmail = auth.currentUser?.email;

// Conectar a MQTT
const brokerUrl = "wss://s6dfb2db.ala.us-east-1.emqxsl.com:8084/mqtt";
const client = mqtt.connect(brokerUrl, { username: "MATI", password: "MATI" });

client.on("connect", () => {
    document.getElementById("status").innerText = "✅ Conectado";
    client.subscribe(`devices/${userEmail}/data`);
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

sendBtn.addEventListener("click", async () => {
    const message = chatInput.value.trim();
    if (message) {
        await addDoc(collection(db, "chat"), {
            email: userEmail,
            message,
            timestamp: new Date(),
        });
        chatInput.value = "";
    }
});

const q = query(collection(db, "chat"), orderBy("timestamp"));
onSnapshot(q, (snapshot) => {
    chatMessages.innerHTML = "";
    snapshot.forEach((doc) => {
        const msg = doc.data();
        chatMessages.innerHTML += `<div class="chat-message"><strong>${msg.email}:</strong> ${msg.message}</div>`;
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
});
