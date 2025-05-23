#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

const char* WIFI_SSID = "Alegre";
const char* WIFI_PASS = "familia2020";

const char* MQTT_SERVER = "s6dfb2db.ala.us-east-1.emqxsl.com";
const int MQTT_PORT = 8883;
const char* MQTT_USER = "MATI";
const char* MQTT_PASS = "MATI";

#define RELAY_PIN 5

const char* TOPIC_DATA = "devices/device2/data";     // Simulación para "device2"
const char* TOPIC_CMD = "devices/device2/commands"; // Comandos para "device2"

WiFiClientSecure client;
PubSubClient mqtt(client);

void connectWiFi() {
  Serial.print("Conectando WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConectado! IP: " + WiFi.localIP().toString());
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];

  digitalWrite(RELAY_PIN, msg == "ON" ? LOW : HIGH);
  Serial.println("Bomba: " + msg);
}

void connectMQTT() {
  while (!mqtt.connected()) {
    Serial.print("Conectando MQTT...");
    if (mqtt.connect("ESP32-Device2", MQTT_USER, MQTT_PASS)) {
      mqtt.subscribe(TOPIC_CMD);
      Serial.println("OK!");
    } else {
      Serial.println("Falló. Reconectando...");
      delay(5000);
    }
  }
}

// Función para generar valores simulados en ESP32
float getSimulatedValue(float minVal, float maxVal) {
  return minVal + (float)(esp_random() % 1000) / 1000.0 * (maxVal - minVal);
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);

  connectWiFi();
  client.setInsecure();
  mqtt.setServer(MQTT_SERVER, MQTT_PORT);
  mqtt.setCallback(mqttCallback);
}

void loop() {
  if (!mqtt.connected()) connectMQTT();
  mqtt.loop();

  static unsigned long lastSend = 0;
  if (millis() - lastSend >= 2000) {
    // Generar datos simulados
    float humSuelo = getSimulatedValue(20.0, 80.0);  // Simula humedad entre 20% y 80%
    float tempAire = getSimulatedValue(15.0, 35.0);  // Simula temperatura entre 15°C y 35°C
    float humAire = getSimulatedValue(30.0, 90.0);   // Simula humedad del aire entre 30% y 90%

    // Crear JSON
    String payload = "{";
    payload += "\"soilMoisture\":" + String(humSuelo, 2) + ",";
    payload += "\"airTemperature\":" + String(tempAire, 2) + ",";
    payload += "\"airHumidity\":" + String(humAire, 2);
    payload += "}";

    mqtt.publish(TOPIC_DATA, payload.c_str());
    Serial.println("Enviado: " + payload);

    lastSend = millis();
  }
}
