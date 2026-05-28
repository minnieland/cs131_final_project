"""
bridge_server.py
================
  1. Subscribes to MQTT topic that the Jetson publishes alerts to
  2. Exposes a REST API that your React dashboard polls
  3. Writes detection events to Google Cloud Firestore

Start it with:
    pip install fastapi uvicorn paho-mqtt firebase-admin
    uvicorn bridge_server:app --reload --host 0.0.0.0 --port 8000
"""

import json
import time
import threading
from collections import deque
from datetime import datetime, timezone

import paho.mqtt.client as mqtt
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Firestore setup 
import firebase_admin
from firebase_admin import credentials
from google.cloud import firestore as gcp_firestore

try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    db = gcp_firestore.Client(
        project="cs-131-final-project-497701",
        database="cs131project",
        credentials=firebase_admin.get_app().credential.get_credential()
    )
    FIRESTORE_ENABLED = True
    print("[Firestore] Connected successfully")
except Exception as e:
    print(f"[Firestore] Could not connect: {e}")
    db = None
    FIRESTORE_ENABLED = False


# MQTT + shared state 
MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT   = 8000
MQTT_TOPIC  = "cs131/edge/alerts"

latest_metrics = {
    "ear":          0.30,
    "perclos":      0.0,
    "face_present": True,
    "status":       "ALERT",
    "blink_count":  0,
    "yaw":          0.0,
    "pitch":        0.0,
    "last_updated": None,
}

alert_log = deque(maxlen=50)

def on_connect(client, userdata, flags, reason_code, properties):
    print(f"[MQTT] Connected — subscribing to {MQTT_TOPIC}")
    client.subscribe(MQTT_TOPIC)

def save_event(event_type, data):
    """Write a detection event to Firestore. Fails silently if not connected."""
    if not FIRESTORE_ENABLED or db is None:
        return
    try:
        db.collection("detection_events").add({
            "event":     event_type,
            "timestamp": datetime.now(timezone.utc),
            **data
        })
    except Exception as e:
        print(f"[Firestore] Write failed: {e}")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        latest_metrics["last_updated"] = payload.get("timestamp", time.time())
        latest_metrics["face_present"] = True

        if payload.get("event") == "DROWSY_DRIVER":
            latest_metrics["ear"]     = payload.get("ear_value",     latest_metrics["ear"])
            latest_metrics["perclos"] = payload.get("perclos_value", latest_metrics["perclos"])
            latest_metrics["status"]  = "DROWSY"

            entry = {
                "level":     "critical",
                "message":   "Drowsiness detected — eyes closed",
                "ear":       payload.get("ear_value"),
                "perclos":   payload.get("perclos_value"),
                "timestamp": payload.get("timestamp", time.time()),
            }
            alert_log.appendleft(entry)

            # Save to Firestore
            save_event("DROWSY_DRIVER", {
                "ear":     payload.get("ear_value"),
                "perclos": payload.get("perclos_value"),
                "device":  payload.get("device"),
            })
            print(f"[MQTT] Drowsy alert: {payload}")

        elif payload.get("event") == "DISTRACTED_DRIVER":
            latest_metrics["pitch"]  = payload.get("pitch", latest_metrics["pitch"])
            latest_metrics["yaw"]    = payload.get("yaw",   latest_metrics["yaw"])
            latest_metrics["status"] = "DISTRACTED"

            entry = {
                "level":     "alert",
                "message":   "Distraction detected — driver looking away",
                "pitch":     payload.get("pitch"),
                "yaw":       payload.get("yaw"),
                "timestamp": payload.get("timestamp", time.time()),
            }
            alert_log.appendleft(entry)

            # Save to Firestore
            save_event("DISTRACTED_DRIVER", {
                "pitch":  payload.get("pitch"),
                "yaw":    payload.get("yaw"),
                "device": payload.get("device"),
            })
            print(f"[MQTT] Distraction alert: {payload}")

        elif payload.get("event") == "METRICS":
            latest_metrics["ear"]         = payload.get("ear_value",    latest_metrics["ear"])
            latest_metrics["perclos"]     = payload.get("perclos_value", latest_metrics["perclos"])
            latest_metrics["pitch"]       = payload.get("pitch",        latest_metrics["pitch"])
            latest_metrics["yaw"]         = payload.get("yaw",          latest_metrics["yaw"])
            latest_metrics["status"]      = payload.get("status",       latest_metrics["status"])
            latest_metrics["blink_count"] = payload.get("blink_count",  latest_metrics["blink_count"])

    except Exception as e:
        print(f"[MQTT] Failed to parse message: {e}")

def start_mqtt():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, transport="websockets")
    client.on_connect = on_connect
    client.on_message = on_message
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        print(f"[MQTT] Connecting to {MQTT_BROKER}:{MQTT_PORT}")
        client.loop_forever()
    except Exception as e:
        print(f"[MQTT] Connection failed: {e}")

threading.Thread(target=start_mqtt, daemon=True).start()

# FastAPI app 
app = FastAPI(title="Driver Monitor Bridge")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/metrics")
def get_metrics():
    return latest_metrics

@app.get("/alerts")
def get_alerts():
    return list(alert_log)

@app.get("/trends")
def get_trends():
    """
    Queries Firestore for the last 7 days of events and returns
    daily counts of drowsy and distraction events for the dashboard trends panel.
    """
    if not FIRESTORE_ENABLED or db is None:
        return {"error": "Firestore not connected", "days": []}

    try:
        from datetime import timedelta

        now       = datetime.now(timezone.utc)
        week_ago  = now - timedelta(days=7)

        events = (
            db.collection("detection_events")
            .where("timestamp", ">=", week_ago)
            .order_by("timestamp")
            .stream()
        )

        # Bucket into days
        daily = {}
        for doc in events:
            data      = doc.to_dict()
            day_label = data["timestamp"].strftime("%a")  # Mon, Tue, etc.
            if day_label not in daily:
                daily[day_label] = {"day": day_label, "drowsy": 0, "distracted": 0}
            if data.get("event") == "DROWSY_DRIVER":
                daily[day_label]["drowsy"] += 1
            elif data.get("event") == "DISTRACTED_DRIVER":
                daily[day_label]["distracted"] += 1

        return {"days": list(daily.values())}

    except Exception as e:
        print(f"[Firestore] Trends query failed: {e}")
        return {"error": str(e), "days": []}

@app.get("/health")
def health():
    return {
        "status":            "ok",
        "firestore_enabled": FIRESTORE_ENABLED,
        "mqtt_broker":       MQTT_BROKER,
        "last_updated":      latest_metrics["last_updated"],
    }