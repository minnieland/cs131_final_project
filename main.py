import cv2
import time
import os
import sys
import numpy as np
import json
import paho.mqtt.client as mqtt
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

sys.path.append(os.path.join(os.path.dirname(__file__), 'edge'))

from face_utilities import (
    LEFT_EYE, RIGHT_EYE,
    get_face_landmarks, average_ear
)

from drowsiness_detection import (
    DrowsinessDetector,
    draw_eye_contour,
    draw_hud,
    EAR_THRESHOLD as _EAR_THRESHOLD
)

# ADDED: import distraction logic
from Distraction_Detection import DistractionDetector, get_head_pose

EAR_THRESHOLD = _EAR_THRESHOLD

def main():
    global EAR_THRESHOLD
    
    video_capture = cv2.VideoCapture(0)
    
    if not video_capture.isOpened():
        print("Failed to open camera")
        return
    
    fps = video_capture.get(cv2.CAP_PROP_FPS) or 30
    detector = DrowsinessDetector(fps_estimate=fps)

    # ADDED: create distraction detector
    distraction_detector = DistractionDetector()

    BROKER = "broker.hivemq.com"
    PORT = 8000
    TOPIC = "cs131/edge/alerts"
    
    mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, transport="websockets")
    try:
        mqtt_client.connect(BROKER, PORT, 60)
        mqtt_client.loop_start()
        print(f"Connected to MQTT Broker: {BROKER}")
    except Exception as e:
        print(f"MQTT Connection failed: {e}")
        
    last_status = "ALERT"

    # ADDED: track previous distraction state
    last_distraction_status = False

    calib_ears  = []
    calib_done  = False
    calib_start = time.time()
    CALIB_SEC   = 2
    print("Calibrating — keep eyes open for 2 seconds.")
    
    while video_capture.isOpened():
        success, image = video_capture.read()
        if not success:
            print("Failed to read frame")
            continue
              
        image = cv2.flip(image, 1)
        h, w  = image.shape[:2]
 
        landmarks = get_face_landmarks(image)

        ear     = 0.30
        status  = "ALERT"
        perclos = 0.0

        # ADDED: default distraction values
        distraction_result = {
            "status": "NO FACE",
            "distracted": False,
            "pitch": 0,
            "yaw": 0,
            "roll": 0
        }

        if landmarks:
            ear, _, _ = average_ear(landmarks)

            if not calib_done:
                elapsed = time.time() - calib_start
                if elapsed < CALIB_SEC:
                    calib_ears.append(ear)
                    pct = int(elapsed / CALIB_SEC * 100)
                    cv2.putText(image, f"Calibrating... {pct}%",
                                (w // 2 - 130, h // 2),
                                cv2.FONT_HERSHEY_DUPLEX, 1.0, (0, 220, 255), 2)
                    cv2.imshow("MediaPipe Face Mesh", image)
                    if cv2.waitKey(1) & 0xFF == 27:
                        break
                    continue
                else:
                    if calib_ears:
                        baseline = np.mean(calib_ears)
                        EAR_THRESHOLD = round(baseline * 0.75, 3)
                        detector.ear_threshold = EAR_THRESHOLD
                        print(f"Done. Baseline EAR={baseline:.3f} → Threshold={EAR_THRESHOLD:.3f}")
                    calib_done = True

            eye_col = (0, 255, 0) if ear >= EAR_THRESHOLD else (0, 0, 255)
            draw_eye_contour(image, landmarks, LEFT_EYE,  eye_col)
            draw_eye_contour(image, landmarks, RIGHT_EYE, eye_col)

            status, perclos = detector.update(ear)

            # ADDED: run distraction detection using same landmarks/camera frame
            pitch, yaw, roll = get_head_pose(landmarks, w, h)
            distraction_result = distraction_detector.update(pitch, yaw, roll)

            # ADDED: draw head-pose info
            cv2.putText(image, f"Head: {distraction_result['status']}",
                        (10, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.55,
                        (0, 0, 255) if distraction_result["distracted"] else (220, 220, 220), 1)

            cv2.putText(image, f"Pitch: {distraction_result['pitch']}  Yaw: {distraction_result['yaw']}",
                        (10, 132), cv2.FONT_HERSHEY_SIMPLEX, 0.55,
                        (220, 220, 220), 1)

            if status == "DROWSY" and last_status != "DROWSY":
                payload = json.dumps({
                    "device": "Jetson_Orin_Nano",
                    "event": "DROWSY_DRIVER",
                    "ear_value": round(ear, 3),
                    "perclos_value": round(perclos, 3),
                    "timestamp": time.time()
                })
                mqtt_client.publish(TOPIC, payload)
                print(f"\n[NETWORK PUSH] Alert sent to Fog Layer: {payload}\n")

            # ADDED: publish distraction alert only when it first becomes distracted
            if distraction_result["distracted"] and not last_distraction_status:
                payload = json.dumps({
                    "device": "Jetson_Orin_Nano",
                    "event": "DISTRACTED_DRIVER",
                    "pitch": distraction_result["pitch"],
                    "yaw": distraction_result["yaw"],
                    "roll": distraction_result["roll"],
                    "timestamp": time.time()
                })
                mqtt_client.publish(TOPIC, payload)
                print(f"\n[NETWORK PUSH] Alert sent to Fog Layer: {payload}\n")

            last_status = status
            last_distraction_status = distraction_result["distracted"]  # ADDED

        draw_hud(image, ear, status, detector.blink_count, perclos, detector)

        cv2.imshow('MediaPipe Face Mesh', image)

        # ADDED: store key so ESC and C can both work
        key = cv2.waitKey(1) & 0xFF

        # ADDED: press C to calibrate head pose
        if key == ord('c') and landmarks:
            pitch, yaw, roll = get_head_pose(landmarks, w, h)
            distraction_detector.calibrate(pitch, yaw)
            print("Head pose calibrated")

        if key == 27:
            break
    
    video_capture.release()
    cv2.destroyAllWindows()
        
if __name__ == "__main__":
    main()