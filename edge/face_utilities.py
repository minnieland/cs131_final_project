import cv2
import mediapipe as mp
import numpy as np

# eye landmark indices (MediaPipe Face Mesh - 468 landmarks)
# 6 points per eye: [left corner, upper1, upper2, right corner, lower1, lower2]
LEFT_EYE  = [362, 385, 387, 263, 373, 380]
RIGHT_EYE = [33,  160, 158, 133, 153, 144]

# Global face landmarker instance (lazy initialized)
_face_landmarker = None

def _get_face_landmarker():
    """Lazily initialize the FaceLandmarker."""
    global _face_landmarker
    if _face_landmarker is None:
        from mediapipe.tasks import python
        from mediapipe.tasks.python import vision
        
        base_options = python.BaseOptions(model_asset_path='edge/face_landmarker.task')
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            num_faces=1,
            min_face_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        _face_landmarker = vision.FaceLandmarker.create_from_options(options)
    return _face_landmarker

def extract_landmarks(face_landmarks, width, height):
    landmarks = []
    for landmark in face_landmarks.landmark:
        x = int(landmark.x * width)
        y = int(landmark.y * height)
        landmarks.append((x, y))
    return landmarks

# Eye aspect ratio calculation
def eye_aspect_ratio(landmarks, eye_indices):
    # EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
    # Vertical distances divided by twice the horizontal distance.
    pts = np.array([landmarks[i] for i in eye_indices], dtype=float)
    d1 = np.linalg.norm(pts[1] - pts[5])  # p2 - p6
    d2 = np.linalg.norm(pts[2] - pts[4])  # p3 - p5
    d3 = np.linalg.norm(pts[0] - pts[3])  # p1 - p4
    return (d1 + d2) / (2.0 * d3 + 1e-6)

def average_ear(landmarks):
    # returns (avg_EAR, left_EAR, right_EAR).
    left  = eye_aspect_ratio(landmarks, LEFT_EYE)
    right = eye_aspect_ratio(landmarks, RIGHT_EYE)
    return (left + right) / 2.0, left, right

def get_face_landmarks(frame):
    """Process a BGR frame and return pixel landmarks, or None if no face found."""
    h, w = frame.shape[:2]
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    
    landmarker = _get_face_landmarker()
    detection_result = landmarker.detect(mp_image)
    
    if detection_result.face_landmarks:
        landmarks = detection_result.face_landmarks[0]  # First face
        return [(int(lm.x * w), int(lm.y * h)) for lm in landmarks]
    return None
