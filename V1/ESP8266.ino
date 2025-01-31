#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <DHT.h>

const char* WIFI_SSID = "Alegre";
const char* WIFI_PASS = "familia2020";

const char* MQTT_SERVER = "s6dfb2db.ala.us-east-1.emqxsl.com";
const int MQTT_PORT = 8883;
const char* MQTT_USER = "MATI";
const char* MQTT_PASS = "MATI";

#define DHTPIN 2
#define SOIL_PIN A0
#define RELAY_PIN 5
#define DHTTYPE DHT11

const char* TOPIC_DATA = "devices/device1/data";
const char* TOPIC_CMD = "devices/device1/commands";

WiFiClientSecure client;
PubSubClient mqtt(client);
DHT dht(DHTPIN, DHTTYPE);

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
  for (unsigned int i=0; i<length; i++) msg += (char)payload[i];
  
  digitalWrite(RELAY_PIN, msg == "ON" ? LOW : HIGH);
  Serial.println("Bomba: " + msg);
}

void connectMQTT() {
  while (!mqtt.connected()) {
    Serial.print("Conectando MQTT...");
    if (mqtt.connect("ESP8266-Device1", MQTT_USER, MQTT_PASS)) {
      mqtt.subscribe(TOPIC_CMD);
      Serial.println("OK!");
    } else {
      Serial.println("Falló. Reconectando...");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);
  dht.begin();
  
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
    // Leer sensores
    int suelo = analogRead(SOIL_PIN);
    float humSuelo = map(suelo, 0, 1023, 0, 100); // Ahora correcto
    float tempAire = dht.readTemperature();
    float humAire = dht.readHumidity();
    
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
