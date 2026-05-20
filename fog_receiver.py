import json
import os
import paho.mqtt.client as mqtt


BROKER = "broker.hivemq.com" #change this to mac ip addr
PORT = 8000
TOPIC = "cs131/edge/alerts"

# automatically triggered when the code connects to the mqtt server. it starts listening to the alerts sent to the topic.
def onConnect(client, userdata, flags, reason_code, properties=None):
    print(f"Connected to Fog Network via: {BROKER}")
    print(f"Listening for alerts on topic: '{TOPIC}'...\n")
    client.subscribe(TOPIC) 

# triggered when a new message arrives to the topic. reads the json and extracts the values in it
def onMessage(client, userdata, msg):
    #decode it back into a Python dictionary.
    payload = json.loads(msg.payload.decode())
    
    # Extract the specific variables we want
    device = payload.get("device")
    ear = payload.get("ear_value")
    
    # Trigger the visual alert on terminal
    print("\n" + "="*50)
    print("WARNING: UNSAFE DRIVING BEHAVIOR DETECTED")
    print(f" Source Vehicle: {device}")
    print(f" Driver Eye Aspect Ratio: {ear}")
    print("="*50 + "\n")
    
    #add code for audio here
    os.system("afplay /System/Library/Sounds/Basso.aiff")

# Using WebSockets on Port 8000
mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, transport="websockets")

# Attach our custom callback functions to the client
mqtt_client.on_connect = onConnect
mqtt_client.on_message = onMessage

try:
    print("Starting Fog Layer Receiver")
    mqtt_client.connect(BROKER, PORT, 60) #60 second timer
    mqtt_client.loop_forever() #wait here until u get a message. 
except Exception as e:
    print(f"Connection failed: {e}")