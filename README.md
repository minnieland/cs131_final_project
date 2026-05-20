# Drowsiness/Distraction Detection
Building an Edge program to detect drowsiness and distraction in drivers.

**System Diagram:**

![System Diagram](/System_Diagram.png)

**Technical Worksheet:**
**Hardware Components**
1. **Edge Device:**  MacBook Pro 13 inch 2022 running MacOS Tahoe. This device is equipped with an Apple M1 chip with 16 GB of RAM. This will act as the UI layer. It will process results received from the Edge AI Computer, and trigger audio alerts to the driver. It will also log events.
2. **Camera (Video Input):** External camera connected to Jetson Orin Nano (don’t know specs yet). It will capture a continuous video stream of the driver and send input frames directly to the Edge AI Computer. 
3. **Edge AI Computer:** NVIDIA Jetson Orin Nano with a NVIDIA Ampere GPU architecture with 1024 CUDA cores.  a 6-core Arm Cortex-A78AE CPU, and 8 GB of RAM. This device will perform the AI algorithms on the video frames for face detection, drowsiness detection (Eye Aspect Ratio calculation), and head pose estimation for distracted driving detection. Sends detection results back to the Edge Device.
4. **Alert System:** Speaker/Buzzer connected to (). It generates audio alerts when unsafe driving behavior is detected. 
5. **Fog Layer:** Secondary Device (Simulating nearby traffic). Receive alerts from the MacBook, simulate vehicle to vehicle communication, and display warnings to nearby drivers.
6. **Cloud Infrastructure:** Amazon Web Services. Store unsafe driving behavior events/logs, perform model training to improve facial detection/drowsiness performance.
7. **Networking components:** WiFi connection. Will enable communication between MacBook, Jetson, and the cloud with Pub/Sub API.
**Software Tools and Libraries**
1. **Python 3:** Primary language for writing all detection logic, alert handling, and system orchestration
2. **JavaScript:** Langage for displaying metrics
3. **Database (AWS)** - to store detection data
4. **OpenCV** - video capture, image processing
5. **MediaPipe** - facial landmark detection
**Detection Methods**
1. **Drowsiness → Eye Aspect Ratio:** Measures the ratio of eye height to width using facial landmarks. If EAR drops below a threshold for 1 or more consecutive seconds, the driver is flagged as drowsy.
2. **Distraction (Phone or looking away):** Calculates the downward tilt of the head using 3D pose estimation. A downward pitch beyond a threshold signals the driver may be looking at their phone.

