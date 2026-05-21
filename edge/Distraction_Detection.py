import cv2
import numpy as np
import time
from face_utilities import get_face_landmarks


HEAD_TURN_LIMIT = 25
HEAD_DOWN_LIMIT = 18
DISTRACT_TIME = 2.0


calibrated = False
base_pitch = 0
base_yaw = 0


def get_head_pose(landmarks, w, h):
    image_points = np.array([
        landmarks[1],    # nose
        landmarks[152],  # chin
        landmarks[33],   # left eye corner
        landmarks[263],  # right eye corner
        landmarks[61],   # left mouth corner
        landmarks[291]   # right mouth corner
    ], dtype=np.float64)

    model_points = np.array([
        [0, 0, 0],
        [0, -63, -12],
        [-43, 32, -26],
        [43, 32, -26],
        [-28, -28, -24],
        [28, -28, -24]
    ], dtype=np.float64)

    cam_matrix = np.array([
        [w, 0, w / 2],
        [0, w, h / 2],
        [0, 0, 1]
    ], dtype=np.float64)

    success, rvec, tvec = cv2.solvePnP(
        model_points,
        image_points,
        cam_matrix,
        np.zeros((4, 1))
    )

    if not success:
        return 0, 0, 0

    rmat, _ = cv2.Rodrigues(rvec)
    angles, _, _, _, _, _ = cv2.RQDecomp3x3(rmat)

    return angles[0], angles[1], angles[2]


def run_detection(source=0):
    global calibrated, base_pitch, base_yaw
    cap = cv2.VideoCapture(source)
    distracted_start = None

    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            break

        h, w = frame.shape[:2]
        landmarks = get_face_landmarks(frame)
        status = "NO FACE"
        distracted = False

        if landmarks:
            pitch, yaw, roll = get_head_pose(landmarks, w, h)
            adj_pitch = pitch - base_pitch
            adj_yaw = yaw - base_yaw
            head_away = abs(adj_yaw) > HEAD_TURN_LIMIT
            head_down = adj_pitch < -HEAD_DOWN_LIMIT

            if not calibrated:
                status = "PRESS C TO CALIBRATE"
            elif head_away or head_down:
                if distracted_start is None:
                    distracted_start = time.time()
                if time.time() - distracted_start >= DISTRACT_TIME:
                    status = "DISTRACTED"
                    distracted = True
                else:
                    status = "WARNING"
            else:
                status = "FOCUSED"
                distracted_start = None

            cv2.putText(frame, f"Pitch: {adj_pitch:.1f}", (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

            cv2.putText(frame, f"Yaw: {adj_yaw:.1f}", (20, 70),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        cv2.putText(frame, status, (20, 120),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0,
                    (0, 0, 255) if distracted else (0, 255, 0), 3)

        cv2.putText(frame, "C = calibrate, ESC = quit", (20, h - 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        cv2.imshow("Driver Distraction Detection", frame)

        key = cv2.waitKey(1) & 0xFF

        if key == 27:
            break
        if key == ord('c') and landmarks:
            base_pitch = pitch
            base_yaw = yaw
            calibrated = True
            distracted_start = None
            print("Calibrated")

    cap.release()
    cv2.destroyAllWindows()


def test_webcam():
    run_detection(0)


def test_dashcam(video_path):
    run_detection(video_path)


if __name__ == "__main__":
    test_webcam()

