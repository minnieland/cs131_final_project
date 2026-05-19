import cv2
import time
import os
import sys
import numpy as np
# mediapipe only works with python 3.9-3.12
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

sys.path.append(os.path.join(os.path.dirname(__file__), 'edge'))

# import landmark utilities from face_utilities
from face_utilities import (
    LEFT_EYE, RIGHT_EYE,
    get_face_landmarks, average_ear
)
 
# import drowsiness logic and drawing from drowsiness_detection
from drowsiness_detection import (
    DrowsinessDetector,
    draw_eye_contour,
    draw_hud,
    EAR_THRESHOLD as _EAR_THRESHOLD
)

EAR_THRESHOLD = _EAR_THRESHOLD

def main():
    global EAR_THRESHOLD
    
    video_capture = cv2.VideoCapture(0)
    
    if not video_capture.isOpened():
        print("Failed to open camera")
        return
    
    fps = video_capture.get(cv2.CAP_PROP_FPS) or 30
    detector = DrowsinessDetector(fps_estimate=fps)

    # calibration: measure open-eye EAR for 2 seconds to set threshold
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
 
        # get_face_landmarks from face_utilities handles MediaPipe processing (does its own colors)
        landmarks = get_face_landmarks(image)

        # Initialize default values (used when no face is detected)
        ear     = 0.30
        status  = "ALERT"
        perclos = 0.0

        if landmarks:
            ear, _, _ = average_ear(landmarks)

            # calibration phase
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

            # draw_eye_contour from drowsiness_detection
            eye_col = (0, 255, 0) if ear >= EAR_THRESHOLD else (0, 0, 255)
            draw_eye_contour(image, landmarks, LEFT_EYE,  eye_col)
            draw_eye_contour(image, landmarks, RIGHT_EYE, eye_col)

            # DrowsinessDetector.update from drowsiness_detection
            status, perclos = detector.update(ear)

        # draw_hud from drowsiness_detection (always drawn, even without landmarks)
        draw_hud(image, ear, status, detector.blink_count, perclos, detector)

        cv2.imshow('MediaPipe Face Mesh', image)
        # quit with 'esc' key
        if cv2.waitKey(1) & 0xFF == 27:
            break
    
    video_capture.release()
    cv2.destroyAllWindows()
        
if __name__ == "__main__":
    main()
