import cv2
import numpy as np
import time


HEAD_TURN_LIMIT = 25
HEAD_DOWN_LIMIT = 18
DISTRACT_TIME = 2.0


class DistractionDetector:
    def __init__(self):
        self.calibrated = False
        self.base_pitch = 0
        self.base_yaw = 0
        self.distracted_start = None

    def calibrate(self, pitch, yaw):
        self.base_pitch = pitch
        self.base_yaw = yaw
        self.calibrated = True
        self.distracted_start = None

    def update(self, pitch, yaw, roll):
        adj_pitch = pitch - self.base_pitch
        adj_yaw = yaw - self.base_yaw

        head_away = abs(adj_yaw) > HEAD_TURN_LIMIT
        head_down = adj_pitch < -HEAD_DOWN_LIMIT

        distracted = False
        status = "FOCUSED"

        if not self.calibrated:
            status = "NOT CALIBRATED"
        elif head_away or head_down:
            if self.distracted_start is None:
                self.distracted_start = time.time()

            if time.time() - self.distracted_start >= DISTRACT_TIME:
                status = "DISTRACTED"
                distracted = True
            else:
                status = "WARNING"
        else:
            self.distracted_start = None

        return {
            "status": status,
            "distracted": distracted,
            "pitch": round(adj_pitch, 2),
            "yaw": round(adj_yaw, 2),
            "roll": round(roll, 2)
        }


def get_head_pose(landmarks, w, h):
    image_points = np.array([
        landmarks[1],
        landmarks[152],
        landmarks[33],
        landmarks[263],
        landmarks[61],
        landmarks[291]
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