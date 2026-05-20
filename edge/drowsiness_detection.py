import cv2
import numpy as np
import time
from collections import deque

from face_utilities import (
    LEFT_EYE, RIGHT_EYE,
    get_face_landmarks, average_ear
)

#  tunable thresholds
EAR_THRESHOLD           = 0.21   # overridden by calibration
BLINK_MIN_FRAMES        = 2      # closures shorter than this are noise
BLINK_MAX_FRAMES        = 10     # closures up to this = normal blink
DROWSY_CONSEC_FRAMES    = 15     # sustained closed frames to trigger alert
DROWSY_CLOSE_SECONDS    = 1.0    # eye must be closed for this long to trigger alert
PERCLOS_WINDOW_SEC      = 60     # sliding window length for PERCLOS
PERCLOS_ALERT_THRESHOLD = 0.25   # >25 % closed in window → alert

# drowsiness state machine
class DrowsinessDetector:
    def __init__(self, fps_estimate=30, ear_threshold=EAR_THRESHOLD):
        fps_estimate = float(fps_estimate) if fps_estimate and fps_estimate > 0 else 30.0
        self.fps           = fps_estimate
        self.ear_threshold = ear_threshold
        self.closed_frames = 0
        self.consec_drowsy = 0
        self.blink_count   = 0
        self.drowsy_alert  = False
        self.last_alert_t  = 0.0
        self.alert_cooldown = 5.0
        # time-based eye closure tracking
        self.eye_closed_since = None   # timestamp when eye first closed
        self.eye_is_closed    = False
        # explicit status state tracker to prevent lingering DROWSY status
        self.current_status = "ALERT"

        window_frames = int(PERCLOS_WINDOW_SEC * fps_estimate)
        self.perclos_window = deque(maxlen=window_frames)
        self.min_perclos_samples = max(1, int(fps_estimate * DROWSY_CLOSE_SECONDS))
        self.ear_history    = deque(maxlen=150)
        self.state_history  = deque(maxlen=150)

    def update(self, ear):
        now = time.time()
        self.ear_history.append(ear)
        is_closed = ear < self.ear_threshold
        self.perclos_window.append(1 if is_closed else 0)

        perclos = sum(self.perclos_window) / max(len(self.perclos_window), 1)
        blink_detected = False

        if is_closed:
            self.closed_frames += 1
            if not self.eye_is_closed:
                # eye just closed — start the timer
                self.eye_closed_since = now
                self.eye_is_closed    = True
        else:
            if self.eye_is_closed:
                # eye just opened — check how long it was closed
                duration = now - self.eye_closed_since
                if (
                    duration < DROWSY_CLOSE_SECONDS
                    and BLINK_MIN_FRAMES <= self.closed_frames <= BLINK_MAX_FRAMES
                ):
                    # short closure = blink
                    self.blink_count += 1
                    blink_detected = True
                # reset — force status back to ALERT when eye opens
                self.eye_is_closed    = False
                self.eye_closed_since = None
                self.drowsy_alert     = False
                self.current_status   = "ALERT"
            self.closed_frames = 0

        # how long has the eye been closed so far?
        closed_duration = (now - self.eye_closed_since) if self.eye_is_closed else 0.0
        perclos_alert = (
            len(self.perclos_window) >= self.min_perclos_samples
            and perclos > PERCLOS_ALERT_THRESHOLD
        )
 
        # Determine status based on current eye state
        if self.eye_is_closed:
            # Eye is currently closed
            if closed_duration >= DROWSY_CLOSE_SECONDS:
                # Eye has been closed long enough — this is drowsiness, not a blink
                if self.current_status != "DROWSY":
                    self.current_status = "DROWSY"
                    self.state_history.append(2)
                status = "DROWSY"
                if now - self.last_alert_t > self.alert_cooldown:
                    self.drowsy_alert = True
                    self.last_alert_t = now
            else:
                # Eye closed but not long enough for drowsy — could be a blink
                status = "ALERT"
                self.drowsy_alert = False
        elif blink_detected:
            self.current_status = "BLINK"
            status = "BLINK"
            self.state_history.append(1)
            self.drowsy_alert = False
        else:
            # Eye is open and no blink — use the tracked status (ALERT after eye opens)
            status = self.current_status
            if self.current_status == "ALERT":
                self.state_history.append(0)
            self.drowsy_alert = False

        return status, perclos

# drawing helpers 
def draw_eye_contour(frame, landmarks, indices, color):
    pts = np.array([landmarks[i] for i in indices], dtype=np.int32)
    cv2.polylines(frame, [pts], isClosed=True, color=color, thickness=1)

def draw_hud(frame, ear, status, blinks, perclos, detector):
    h, w = frame.shape[:2]
    colors = {"ALERT": (0, 200, 0), "BLINK": (0, 200, 255), "DROWSY": (0, 0, 255)}
    col = colors.get(status, (200, 200, 200))

    cv2.rectangle(frame, (0, 0), (w, 38), (20, 20, 20), -1)
    cv2.putText(frame, f"Status: {status}", (10, 26),
                cv2.FONT_HERSHEY_DUPLEX, 0.8, col, 2)
    cv2.putText(frame, f"EAR: {ear:.3f}  |  PERCLOS: {perclos*100:.1f}%",
                (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (220, 220, 220), 1)
    cv2.putText(frame, f"Blinks: {blinks}",
                (10, 82), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (220, 220, 220), 1)

    if detector.drowsy_alert:
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, h), (0, 0, 180), -1)
        cv2.addWeighted(overlay, 0.25, frame, 0.75, 0, frame)
        cv2.putText(frame, "! DROWSINESS DETECTED !",
                    (w // 2 - 200, h // 2),
                    cv2.FONT_HERSHEY_DUPLEX, 1.1, (255, 255, 255), 3)
