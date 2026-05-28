# Drowsiness/Distraction Detection
Building an Edge program to detect drowsiness and distraction in drivers.

**System Diagram:**

![System Diagram](/SystemDiagram.png)

**Workload Distribution Diagram:**

![Workload Distribution Diagram](/Workload_Distribution_Diagram.png)

**Task distribution:**

1. **Edge Layer:** Real-time video processing, head/eye tracking, drowsiness/distraction detection, and immediate alerts with low latency
2. **Fog Layer:** Sends alerts to other devices and the cloud
3. **Cloud Layer:** Data storage and analytics (driver behavior trends over time)

**Technical Worksheet:**
**Hardware Components**
1. **Edge Device:**  MacBook Pro 13 inch 2022 running MacOS Tahoe. This device is equipped with an Apple M1 chip with 16 GB of RAM. This will act as the UI layer. It will process results received from the Edge AI Computer, and trigger audio alerts to the driver. It will also log events.
2. **Camera (Video Input):** External camera connected to Jetson Orin Nano. Logitech Webcam C925e (1080p HD). It will capture a continuous video stream of the driver and send input frames directly to the Edge AI Computer.
3. **Edge AI Computer:** NVIDIA Jetson Orin Nano with a NVIDIA Ampere GPU architecture with 1024 CUDA cores.  a 6-core Arm Cortex-A78AE CPU, and 8 GB of RAM. This device will perform the AI algorithms on the video frames for face detection, drowsiness detection (Eye Aspect Ratio calculation), and head pose estimation for distracted driving detection. Sends detection results back to the Edge Device.
4. **Alert System:** Speaker from Cloud layer generates audio alerts when unsafe driving behavior is detected.
5. **Fog Layer:** Secondary Device (Simulating nearby traffic). Receive alerts from the Jetson, simulate vehicle to vehicle communication, and display warnings to nearby drivers.
6. **Cloud Infrastructure:** Firestore. Store unsafe driving behavior events/logs.
7. **Networking components:** Will enable communication between MacBook, Jetson, and the cloud with Pub/Sub API.
**Software Tools and Libraries**
1. **Python 3:** Primary language for writing all detection logic, alert handling, and system orchestration
2. **JavaScript:** Langage for displaying metrics
3. **Database (Firestore)** - to store detection data
4. **OpenCV** - video capture, image processing
5. **MediaPipe** - facial landmark detection
6. **FastAPI** - REST API running on MacBook
7. **HiveMQ** - Public cloud broker for communication between devices (will update to use IP directly for communication)
8. **Paho-MQTT** - Python library for PUB/SUB network communication 
9. **Python OS Library** - Python library to trigger audio alters on Macbook.

**Detection Methods**
1. **Drowsiness → Eye Aspect Ratio:** Measures the ratio of eye height to width using facial landmarks. If EAR drops below a threshold of 1 or more consecutive seconds, the driver is flagged as drowsy.
2. **Distraction (Phone or looking away):** Calculates the tilt of the head using 3D pose estimation. A pitch beyond a threshold of 2 or more consecutive seconds signals the driver may be distracted.

**Network Operation:**

**Challenges:**
1. False positives (Blink vs. Drowsiness)
2. Repeated/spamming blinking
3. Frontend issues (Real-time dashboard updates, MQTT to REST bridge (connecting Python detection pipeline and React dashboard))
4. Hardware-Specific Audio Triggers (MacOS was blocking the audio alerts in Python, used Python’s OS library to use native MacOS audio alert sounds)
5. Connection drops on public broker server (Used free MQTT broker over weak UCR WiFi caused temporary disconnects, used Paho-MQTT library with built in reconnection logic and made sure our JSON payloads had minimal information)

**Services:**
1. **Database (Firestore)** - to store detection data
2. **OpenCV** - video capture, image processing
3. **MediaPipe** - facial landmark detection
4. **FastAPI** - REST API running on MacBook
5. **HiveMQ** - Public cloud broker for communication between devices (will update to use IP directly for communication)
6. **Paho-MQTT** - Python library for PUB/SUB network communication 
7. **Python OS Library** - Python library to trigger audio alters on Macbook.

**Quality Attributes:**
1. **Security:** Local host, restricted dashboard access
2. **Privacy:** Does not store raw video, edge processing keeps events local
3. **Reliability:** Local alerts work even if cloud disconnects

**Messaging Patterns & Communication Protocol:**
**Pub/Sub Pattern** - Jetson is a publisher and the cloud and other drivers are subscribed
**Event Driven Messaging** - Messages are automatically sent once detection is made

## Running the System
Open three terminals:
* Terminal 1 - Bridge Server
  `cd backend`
  `uvicorn bridge_server:app --reload --host 0.0.0.0 --port 8000`
* Terminal 2 - React Dashboard
  `cd frontend/driver-dashboard`
  `npm run dev`
* Terminal 3 - Detection Pipeline
  `python main.py`

Simulating Nearby Vehicle Alerts (Two Jetsons)
* `python fog_receiver.py`
