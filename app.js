// Configuración MQTT
const brokerUrl = "wss://s6dfb2db.ala.us-east-1.emqxsl.com:8084/mqtt";
const username = "MATI";
const password = "MATI";

// Configuración de usuarios
const userDevices = {
    "mati": "device1",
    "juaco": "device2"
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
    if (client) client.end();
    localStorage.removeItem('currentUser');
    location.reload();
}

// Inicialización del Dashboard
function initDashboard() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('currentUser').textContent = currentUser;

    // Configurar topics dinámicos
    const deviceId = userDevices[currentUser];
    const topicData = `devices/${deviceId}/data`;
    const topicCommand = `devices/${deviceId}/commands`;

    // Inicializar gráfico
    initChart();
    
    // Conectar a MQTT
    connectMQTT(topicData, topicCommand);
}

function initChart() {
    const ctx = document.getElementById('chartCanvas').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Humedad del Suelo (%)',
                data: [],
                borderColor: '#00FF84',
                backgroundColor: 'rgba(0, 255, 132, 0.2)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            }
        }
    });
}

function connectMQTT(topicData, topicCommand) {
    client = mqtt.connect(brokerUrl, { username, password });

    client.on("connect", () => {
        console.log("✅ Conectado a MQTT");
        client.subscribe(topicData);
        document.getElementById("status").innerText = "✅ Conectado";
    });

    client.on("message", (topic, message) => {
        if (topic === topicData) {
            const data = JSON.parse(message);
            updateDashboard(data);
        }
    });
}

function updateDashboard(data) {
    document.getElementById("humedad").textContent = `${data.soilMoisture} %`;
    document.getElementById("temperatura").textContent = `${data.airTemperature} °C`;

    // Actualizar gráfico
    chart.data.labels.push(new Date().toLocaleTimeString());
    chart.data.datasets[0].data.push(data.soilMoisture);
    
    if (chart.data.labels.length > 20) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }
    
    chart.update();
}

function publishCommand(command) {
    const deviceId = userDevices[currentUser];
    const topicCommand = `devices/${deviceId}/commands`;
    client.publish(topicCommand, command);
    document.getElementById("status").innerText = command === "ON" 
        ? "💧 Riego ACTIVADO" 
        : "🛑 Riego DESACTIVADO";
}

// Cargar usuario al iniciar
window.onload = () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser && userDevices[savedUser]) {
        currentUser = savedUser;
        initDashboard();
    }
};
