// Configuración MQTT
const brokerUrl = "wss://s6dfb2db.ala.us-east-1.emqxsl.com:8084/mqtt";
const username = "MATI";
const password = "MATI";

// Topics MQTT
const topicChat = "alto_riego/chat";
const topicPresence = "alto_riego/presence";

// Configuración de usuarios
const userDevices = {
    "ale": "device1",
    "leo": "device1",
    "joako": "device1",
    "chuba": "device1",
    "gordo": "device1",
    "juan": "device1",
    "mati": "device1",
    "lina": "device1",
    "seba": "device1",
    "jeta": "device1"
};

let currentUser = null;
let client = null;
let chart = null;

// Sistema de Login
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const inputUser = document.getElementById('username').value.trim().toLowerCase();
    
    if (userDevices[inputUser]) {
        currentUser = inputUser;
        localStorage.setItem('currentUser', currentUser);
        initDashboard();
    } else {
        alert('Usuario no registrado');
    }
});

function logout() {
    if (client) {
        publishPresence('offline');
        client.end();
    }
    localStorage.removeItem('currentUser');
    location.reload();
}

// Inicialización del Dashboard
function initDashboard() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('currentUser').textContent = currentUser;

    // Conectar a MQTT
    connectMQTT();
}

// Conexión MQTT
function connectMQTT() {
    client = mqtt.connect(brokerUrl, { username, password });

    client.on("connect", () => {
        console.log("✅ Conectado a MQTT");
        document.getElementById("status").innerText = "✅ Conectado";

        client.subscribe(topicChat);
        client.subscribe(topicPresence);
        
        publishPresence('online');
    });

    client.on("message", (topic, message) => {
        if (topic === topicChat) {
            displayChatMessage(JSON.parse(message));
        } else if (topic === topicPresence) {
            updateUserStatus(JSON.parse(message));
        }
    });
}

// Publicar estado de presencia
function publishPresence(status) {
    const message = JSON.stringify({
        user: currentUser,
        status: status,
        timestamp: new Date().toISOString()
    });
    client.publish(topicPresence, message);
}

// Enviar mensaje de chat
function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message) {
        const payload = JSON.stringify({
            user: currentUser,
            message: message,
            timestamp: new Date().toISOString()
        });
        client.publish(topicChat, payload);
        input.value = '';
    }
}

// Mostrar mensajes en el chat
function displayChatMessage(data) {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML += `
        <div class="message">
            <strong>${data.user}:</strong> ${data.message}
            <span class="timestamp">${new Date(data.timestamp).toLocaleTimeString()}</span>
        </div>
    `;
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Actualizar lista de usuarios conectados
function updateUserStatus(data) {
    const userList = document.getElementById('userList');

    if (data.status === 'online') {
        userList.innerHTML += `<div class="user-online">${data.user} 🟢</div>`;
    } else {
        const userElement = Array.from(userList.children).find(el => el.textContent.includes(data.user));
        if (userElement) userElement.remove();
    }

    document.getElementById('onlineCount').textContent = document.querySelectorAll('.user-online').length;
}

// Cargar usuario al iniciar
window.onload = () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser && userDevices[savedUser]) {
        currentUser = savedUser;
        initDashboard();
    }
};
