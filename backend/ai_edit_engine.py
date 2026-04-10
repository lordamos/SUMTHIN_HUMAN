"""
AI Edit Engine — Face Swap + Outfit Swap + Realism Boost
Supports: InsightFace face swapping, MediaPipe outfit segmentation,
          realism post-processing, Nano Banana hook, model switching.
"""
import cv2
import numpy as np
import base64
import os
import requests
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

        model_path = os.path.join(os.path.expanduser("~"), ".insightface", "models", "inswapper_128.onnx")
        if not os.path.exists(model_path):
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
    img_bytes = base64.b64decode(b64_str)
    img = Image.open(BytesIO(img_bytes)).convert("RGB")
    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

def image_to_base64(img_bgr: np.ndarray) -> str:
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(img_rgb)
    buf = BytesIO()
    pil_img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")

def _detect_raw(img_bgr: np.ndarray):
    return _face_app.get(img_bgr)

# ---------------------------------------------------------------------------
# Face detection with bounding boxes
# ---------------------------------------------------------------------------

def detect_faces_with_coords(image: np.ndarray) -> dict:
    """Return bounding boxes + image dimensions for all detected faces."""
    if not _init_insightface():
        raise RuntimeError("InsightFace not available.")

    faces = _face_app.get(image)
    h, w = image.shape[:2]
    result = []
    for i, f in enumerate(faces):
        x1, y1, x2, y2 = map(int, f.bbox)
        x1 = max(0, x1); y1 = max(0, y1)
        x2 = min(w, x2); y2 = min(h, y2)
        result.append({"index": i, "bbox": [x1, y1, x2, y2]})

    return {"faces": result, "img_w": w, "img_h": h}

# ---------------------------------------------------------------------------
# Face swap — selected indices
# ---------------------------------------------------------------------------

def face_swap_selected(source_img: np.ndarray, target_img: np.ndarray,
                       face_indices: list) -> np.ndarray:
    """Swap faces at the given indices in target with source faces."""
    if not _init_insightface() or _swapper is None:
        raise RuntimeError("InsightFace model not available.")

    faces_source = _detect_raw(source_img)
    faces_target = _detect_raw(target_img)

    if not faces_source or not faces_target:
        raise RuntimeError("No faces detected in one or both images.")

    result = target_img.copy()
    src_face = faces_source[0]

    indices_to_swap = face_indices if face_indices else list(range(len(faces_target)))

    for idx in indices_to_swap:
        if 0 <= idx < len(faces_target):
            result = _swapper.get(result, faces_target[idx], src_face, paste_back=True)

    return result

# ---------------------------------------------------------------------------
# Outfit swap — texture mode (body segmentation + blend)
# ---------------------------------------------------------------------------

def get_body_mask(image_bgr: np.ndarray) -> np.ndarray:
    try:
        import mediapipe as mp
        with mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=1) as segmenter:
            img_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
            results = segmenter.process(img_rgb)
            mask = (results.segmentation_mask > 0.5).astype(np.uint8) * 255
            return mask
    except Exception:
        h, w = image_bgr.shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)
        cy, cx = h // 2, w // 2
        axes = (int(w * 0.3), int(h * 0.45))
        cv2.ellipse(mask, (cx, cy), axes, 0, 0, 360, 255, -1)
        return mask

def outfit_swap(image_bgr: np.ndarray, texture_bgr: np.ndarray) -> np.ndarray:
    mask = get_body_mask(image_bgr)
    h, w = image_bgr.shape[:2]
    texture = cv2.resize(texture_bgr, (w, h))

    mask_blur = cv2.GaussianBlur(mask, (31, 31), 0)
    alpha = mask_blur.astype(np.float32) / 255.0
    alpha_3ch = np.stack([alpha] * 3, axis=-1)

    result = (texture.astype(np.float32) * alpha_3ch +
              image_bgr.astype(np.float32) * (1 - alpha_3ch)).astype(np.uint8)

    try:
        center = (w // 2, h // 2)
        seamless = cv2.seamlessClone(texture, image_bgr, mask, center, cv2.NORMAL_CLONE)
        result = cv2.addWeighted(seamless, 0.6, result, 0.4, 0)
    except Exception:
        pass

    return result

# ---------------------------------------------------------------------------
# Realism boost — applied after any swap/edit
# ---------------------------------------------------------------------------

def enhance_realism(image: np.ndarray) -> np.ndarray:
    """Remove AI artifacts: detail enhance + denoise."""
    try:
        enhanced = cv2.detailEnhance(image, sigma_s=10, sigma_r=0.15)
        enhanced = cv2.fastNlMeansDenoisingColored(enhanced, None, 10, 10, 7, 21)
        return enhanced
    except Exception:
        return image

# ---------------------------------------------------------------------------
# Nano Banana — placeholder hook (plug real endpoint later)
# ---------------------------------------------------------------------------

def nano_banana_edit(image_b64: str, prompt: str) -> str:
    """Placeholder: forwards to Nano Banana API, falls back to local."""
    try:
        res = requests.post(
            "https://api.nanobanana.ai/edit",
            json={"image": image_b64, "prompt": prompt},
            timeout=30
        )
        if res.ok:
            return res.json()["image"]
        raise RuntimeError(f"Nano Banana API error: {res.status_code}")
    except Exception as e:
        raise RuntimeError(f"Nano Banana unavailable: {e}")
