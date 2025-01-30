const brokerUrl = "wss://s6dfb2db.ala.us-east-1.emqxsl.com:8084/mqtt";
const username = "MATI";
const password = "MATI";
const topicData = "devices/mi_riego/data";
const topicCommand = "devices/mi_riego/commands";

// Conectar con MQTT
const client = mqtt.connect(brokerUrl, { username, password });

let chartData = {
    labels: [],
    datasets: [{
        label: 'Humedad del Suelo (%)',
        data: [],
        borderColor: '#00FF84',
        backgroundColor: 'rgba(0, 255, 132, 0.2)',
        borderWidth: 2,
        fill: true
    }]
};

let chart = new Chart(document.getElementById('chartCanvas'), {
    type: 'line',
    data: chartData,
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

function publishCommand(command) {
    client.publish(topicCommand, command);
    document.getElementById("status").innerText = (command === "ON") ? "💧 Riego ACTIVADO" : "🛑 Riego DESACTIVADO";
}
