"""
AI Edit Engine — Face Swap + Outfit Swap
Uses InsightFace for real face swapping with Gemini fallback.
"""
import cv2
import numpy as np
import base64
import os
from io import BytesIO
from PIL import Image

# ---------------------------------------------------------------------------
# InsightFace — lazy init so the server starts even if models aren't ready
# ---------------------------------------------------------------------------
_face_app = None
_swapper = None
_insightface_ready = False

def _init_insightface():
    global _face_app, _swapper, _insightface_ready
    if _insightface_ready:
        return True
    try:
        from insightface.app import FaceAnalysis
        from insightface.model_zoo import get_model

        _face_app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
        _face_app.prepare(ctx_id=-1, det_size=(640, 640))

        # inswapper_128.onnx — auto-downloads from InsightFace model zoo
        model_path = os.path.join(os.path.expanduser("~"), ".insightface", "models", "inswapper_128.onnx")
        if not os.path.exists(model_path):
            # Try to download
            _swapper = get_model("inswapper_128.onnx", download=True, download_zip=True)
        else:
            _swapper = get_model(model_path)

        _insightface_ready = True
        return True
    except Exception as e:
        print(f"[ai_edit_engine] InsightFace init failed: {e}")
        return False

# ---------------------------------------------------------------------------
# Image helpers
# ---------------------------------------------------------------------------

def base64_to_image(b64_str: str) -> np.ndarray:
    """Decode base64 → OpenCV BGR image."""
    img_bytes = base64.b64decode(b64_str)
    img = Image.open(BytesIO(img_bytes)).convert("RGB")
    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

def image_to_base64(img_bgr: np.ndarray) -> str:
    """Encode OpenCV BGR image → base64 PNG."""
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(img_rgb)
    buf = BytesIO()
    pil_img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")

def _detect_faces(img_bgr: np.ndarray):
    """Return list of detected faces (requires InsightFace to be ready)."""
    return _face_app.get(img_bgr)

# ---------------------------------------------------------------------------
# Face swap — single
# ---------------------------------------------------------------------------

def face_swap_single(source_img: np.ndarray, target_img: np.ndarray) -> np.ndarray:
    if not _init_insightface() or _swapper is None:
        raise RuntimeError("InsightFace model not available.")

    faces_source = _detect_faces(source_img)
    faces_target = _detect_faces(target_img)

    if not faces_source or not faces_target:
        raise RuntimeError("No faces detected in one or both images.")

    result = target_img.copy()
    result = _swapper.get(result, faces_target[0], faces_source[0], paste_back=True)
    return result

# ---------------------------------------------------------------------------
# Face swap — multi (swap all faces in target using source faces)
# ---------------------------------------------------------------------------

def face_swap_multi(source_img: np.ndarray, target_img: np.ndarray) -> np.ndarray:
    if not _init_insightface() or _swapper is None:
        raise RuntimeError("InsightFace model not available.")

    faces_source = _detect_faces(source_img)
    faces_target = _detect_faces(target_img)

    if not faces_source or not faces_target:
        raise RuntimeError("No faces detected in one or both images.")

    result = target_img.copy()
    for i, face in enumerate(faces_target):
        src_face = faces_source[i % len(faces_source)]
        result = _swapper.get(result, face, src_face, paste_back=True)

    return result

# ---------------------------------------------------------------------------
# Outfit swap — body segmentation + texture blend
# ---------------------------------------------------------------------------

def get_body_mask(image_bgr: np.ndarray) -> np.ndarray:
    """Return uint8 mask where body pixels are 255."""
    try:
        import mediapipe as mp
        with mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=1) as segmenter:
            img_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
            results = segmenter.process(img_rgb)
            mask = (results.segmentation_mask > 0.5).astype(np.uint8) * 255
            return mask
    except Exception as e:
        # Fallback: simple center-weighted mask
        h, w = image_bgr.shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)
        cy, cx = h // 2, w // 2
        axes = (int(w * 0.3), int(h * 0.45))
        cv2.ellipse(mask, (cx, cy), axes, 0, 0, 360, 255, -1)
        return mask

def outfit_swap(image_bgr: np.ndarray, texture_bgr: np.ndarray) -> np.ndarray:
    """Blend texture into the body region of image."""
    mask = get_body_mask(image_bgr)
    h, w = image_bgr.shape[:2]
    texture = cv2.resize(texture_bgr, (w, h))

    result = image_bgr.copy()

    # Soften mask edges for natural blending
    mask_blur = cv2.GaussianBlur(mask, (31, 31), 0)
    alpha = mask_blur.astype(np.float32) / 255.0
    alpha_3ch = np.stack([alpha] * 3, axis=-1)

    result = (texture.astype(np.float32) * alpha_3ch +
              image_bgr.astype(np.float32) * (1 - alpha_3ch)).astype(np.uint8)

    # Optionally apply seamless clone for better blending
    try:
        center = (w // 2, h // 2)
        seamless = cv2.seamlessClone(texture, image_bgr, mask, center, cv2.NORMAL_CLONE)
        # Blend seamless with alpha result for best output
        result = cv2.addWeighted(seamless, 0.6, result, 0.4, 0)
    except Exception:
        pass

    return result
