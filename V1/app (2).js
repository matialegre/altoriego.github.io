const MQTT_CONFIG = {
    server: 'wss://s6dfb2db.ala.us-east-1.emqxsl.com:8084/mqtt',
    options: {
        username: 'MATI',
        password: 'MATI',
        clientId: 'webClient-' + Math.random().toString(16).substr(2, 8)
    }
};

const USER_DEVICES = {
    "ale": "device1", "leo": "device1", "joako": "device1",
    "chuba": "device1", "gordo": "device2", "juan": "device1",
    "mati": "device1", "lina": "device1", "seba": "device1", "jeta": "device1"
};

let currentUser = null;
let mqttClient = null;
let chart = null;

// Inicialización
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim().toLowerCase();
    
    if (USER_DEVICES[username]) {
        currentUser = username;
        localStorage.setItem('currentUser', username);
        initDashboard();
    } else {
        alert('Usuario no válido. Verifica las opciones en el mensaje de bienvenida.');
    }
});

function initDashboard() {
    // Ocultar login y mostrar dashboard
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('currentUser').textContent = currentUser;

    // Conectar a MQTT
    mqttClient = mqtt.connect(MQTT_CONFIG.server, MQTT_CONFIG.options);
    
    mqttClient.on('connect', () => {
        console.log('Conectado a MQTT');
        document.getElementById('status').textContent = 'Estado: Conectado ✅';
        
        // Suscribirse a tópicos
        const deviceId = USER_DEVICES[currentUser];
        mqttClient.subscribe(`devices/${deviceId}/data`);
        mqttClient.subscribe('alto_riego/presence');
        mqttClient.subscribe('alto_riego/chat');
        
        // Publicar presencia
        mqttClient.publish('alto_riego/presence', JSON.stringify({
            user: currentUser,
            status: 'online',
            timestamp: new Date().toISOString()
        }));
    });

    // Manejar mensajes MQTT
    mqttClient.on('message', (topic, message) => {
        const data = JSON.parse(message.toString());
        
        if (topic.includes('data')) {
            updateSensorData(data);
        } else if (topic === 'alto_riego/presence') {
            updateUserPresence(data);
        } else if (topic === 'alto_riego/chat') {
            updateChat(data);
        }
    });

    // Inicializar gráfico
    initChart();
}

function updateSensorData(data) {
    document.getElementById('soilMoisture').textContent = `${data.soilMoisture.toFixed(1)}%`;
    document.getElementById('airTemperature').textContent = `${data.airTemperature.toFixed(1)}°C`;
    document.getElementById('airHumidity').textContent = `${data.airHumidity.toFixed(1)}%`;
    
    // Actualizar gráfico
    const time = new Date().toLocaleTimeString();
    chart.data.labels.push(time);
    chart.data.datasets[0].data.push(data.soilMoisture);
    chart.data.datasets[1].data.push(data.airTemperature);
    
    if (chart.data.labels.length > 15) {
        chart.data.labels.shift();
        chart.data.datasets.forEach(dataset => dataset.data.shift());
    }
    
    chart.update();
}

function initChart() {
    const ctx = document.getElementById('sensorChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Humedad del Suelo (%)',
                data: [],
                borderColor: '#00FF84',
                backgroundColor: 'rgba(0, 255, 132, 0.1)',
                tension: 0.3
            }, {
                label: 'Temperatura (°C)',
                data: [],
                borderColor: '#FFA500',
                backgroundColor: 'rgba(255, 165, 0, 0.1)',
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Funciones de Chat y Presencia
function updateUserPresence(data) {
    const userList = document.getElementById('userList');
    const existingUser = Array.from(userList.children).find(el => el.dataset.user === data.user);
    
    if (data.status === 'online') {
        if (!existingUser) {
            const userEl = document.createElement('div');
            userEl.dataset.user = data.user;
            userEl.innerHTML = `${data.user} 🟢`;
            userList.appendChild(userEl);
        }
    } else {
        if (existingUser) existingUser.remove();
    }
    
    document.getElementById('onlineCount').textContent = userList.children.length;
}

function updateChat(data) {
    const chatBox = document.getElementById('chatMessages');
    const messageEl = document.createElement('div');
    messageEl.classList.add('message');
    messageEl.innerHTML = `
        <strong>${data.user}:</strong> ${data.message}
        <span class="timestamp">${new Date(data.timestamp).toLocaleTimeString()}</span>
    `;
    chatBox.appendChild(messageEl);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message) {
        mqttClient.publish('alto_riego/chat', JSON.stringify({
            user: currentUser,
            message: message,
            timestamp: new Date().toISOString()
        }));
        input.value = '';
    }
}

function sendCommand(command) {
    const deviceId = USER_DEVICES[currentUser];
    mqttClient.publish(`devices/${deviceId}/commands`, command);
}

function logout() {
    mqttClient.publish('alto_riego/presence', JSON.stringify({
        user: currentUser,
        status: 'offline',
        timestamp: new Date().toISOString()
    }));
    
    mqttClient.end();
    localStorage.removeItem('currentUser');
    location.reload();
}

// Cargar usuario al iniciar
window.onload = () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser && USER_DEVICES[savedUser]) {
        currentUser = savedUser;
        initDashboard();
    }
};
