import paho.mqtt.client as mqtt
import time
import random

broker = "w073fbd2.ala.us-east-1.emqxsl.com"
port = 8883
username = "malegre"
password = "malegre"
topic = "iot/temperatura"

client = mqtt.Client()
client.username_pw_set(username, password)
client.tls_set()  # Para conexión segura (puerto 8883)
client.connect(broker, port)

try:
    while True:
        payload = {
            "airTemperature": round(random.uniform(5, 15), 2),
            "airHumidity": round(random.uniform(60, 90), 1),
            "soilMoisture": round(random.uniform(30, 80), 1)
        }
        import json
        client.publish(topic, json.dumps(payload))
        print(f"Publicado en {topic}: {payload}")
        time.sleep(5)
except KeyboardInterrupt:
    print("Simulación detenida.")
