from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import requests
import os
import random
import re
import base64
import io
import numpy as np

app = Flask(__name__, static_url_path='/humanizer/static')
CORS(app)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def add_human_touch(text):
    if random.random() < 0.3:
        text = text.replace(". ", "... ", 1)
    if random.random() < 0.2:
        text = text.replace(" ", " — ", 1)
    return text

def fallback_humanize(text):
    text = re.sub(r"\bvery\b", "really", text, flags=re.IGNORECASE)
    text = re.sub(r"\bimportant\b", "pretty important", text, flags=re.IGNORECASE)
    return text

def super_prompt_boost(prompt: str) -> str:
    """Wrap any image edit prompt with photorealism instructions."""
    return f"""{prompt}

Make it photorealistic. Preserve all original skin texture, fine details, and micro-imperfections.
Match the original lighting direction and color temperature exactly.
No AI artifacts, no distortions, no smearing. Blend seams seamlessly.
The result must be indistinguishable from a real, unedited photograph."""

def ai_humanize(text, mode):
    prompt_modes = {
        "casual": "Rewrite casually like a real person.",
        "professional": "Rewrite clearly and professionally.",
        "bypass": "Rewrite to avoid AI detection with high variation.",
        "shorten": "Rewrite shorter while keeping meaning.",
        "expand": "Rewrite with more detail."
    }

    if OPENROUTER_API_KEY:
        try:
            res = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "openai/gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": prompt_modes.get(mode, prompt_modes["casual"])},
                        {"role": "user", "content": text}
                    ]
                },
                timeout=30
            )
            result = res.json()["choices"][0]["message"]["content"]
            return add_human_touch(result)
        except Exception:
            return None

    return None

# ---------------------------------------------------------------------------
# MediaPipe helpers (lazy-loaded to avoid startup cost)
# ---------------------------------------------------------------------------

_mp_face = None
_mp_segment = None

def get_face_detector():
    global _mp_face
    if _mp_face is None:
        import mediapipe as mp
        _mp_face = mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)
    return _mp_face

def get_segmenter():
    global _mp_segment
    if _mp_segment is None:
        import mediapipe as mp
        _mp_segment = mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=1)
    return _mp_segment

def decode_image(b64_data: str):
    """Decode base64 image to numpy array (BGR for OpenCV)."""
    import cv2
    img_bytes = base64.b64decode(b64_data)
    arr = np.frombuffer(img_bytes, dtype=np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)

def encode_image(img_bgr, mime_type: str = "image/jpeg") -> str:
    """Encode numpy BGR image to base64."""
    import cv2
    ext = ".jpg" if "jpeg" in mime_type else ".png"
    success, buf = cv2.imencode(ext, img_bgr)
    if not success:
        raise ValueError("Failed to encode image")
    return base64.b64encode(buf.tobytes()).decode("utf-8")

def seamless_blend(src_bgr, dst_bgr):
    """Apply OpenCV seamlessClone from src into dst at the center."""
    import cv2
    h, w = dst_bgr.shape[:2]
    center = (w // 2, h // 2)
    # Create a mask that covers everything except a 2px border
    mask = np.ones((h, w), dtype=np.uint8) * 255
    mask[:2, :] = 0; mask[-2:, :] = 0
    mask[:, :2] = 0; mask[:, -2:] = 0
    try:
        result = cv2.seamlessClone(src_bgr, dst_bgr, mask, center, cv2.NORMAL_CLONE)
        return result
    except Exception:
        return src_bgr

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/humanize", methods=["POST"])
def humanize():
    data = request.json
    text = data.get("text", "")
    mode = data.get("mode", "casual")
    result = ai_humanize(text, mode)
    if result is None:
        return jsonify({"humanized_text": None, "fallback": True}), 200
    return jsonify({"humanized_text": result, "fallback": False})


@app.route("/detect-face", methods=["POST"])
def detect_face():
    """Detect faces using MediaPipe. Returns bounding boxes + landmarks."""
    try:
        data = request.json or {}
        b64 = data.get("image")
        if not b64:
            return jsonify({"error": "No image provided"}), 400

        import cv2
        img_bgr = decode_image(b64)
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        h, w = img_rgb.shape[:2]

        detector = get_face_detector()
        results = detector.process(img_rgb)

        faces = []
        if results.detections:
            for det in results.detections:
                bbox = det.location_data.relative_bounding_box
                faces.append({
                    "x": round(bbox.xmin * w),
                    "y": round(bbox.ymin * h),
                    "w": round(bbox.width * w),
                    "h": round(bbox.height * h),
                    "score": round(det.score[0], 3),
                    "rel": {
                        "xmin": round(bbox.xmin, 4),
                        "ymin": round(bbox.ymin, 4),
                        "width": round(bbox.width, 4),
                        "height": round(bbox.height, 4),
                    }
                })

        return jsonify({"faces": faces, "image_size": {"width": w, "height": h}})

    except Exception as e:
        return jsonify({"error": str(e), "faces": []}), 500


@app.route("/segment-body", methods=["POST"])
def segment_body():
    """Return body segmentation mask as a base64 grayscale PNG."""
    try:
        data = request.json or {}
        b64 = data.get("image")
        if not b64:
            return jsonify({"error": "No image provided"}), 400

        import cv2
        img_bgr = decode_image(b64)
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

        segmenter = get_segmenter()
        results = segmenter.process(img_rgb)
        mask = results.segmentation_mask  # float32 0-1

        # Convert to uint8
        mask_u8 = (mask * 255).astype(np.uint8)
        _, buf = cv2.imencode(".png", mask_u8)
        mask_b64 = base64.b64encode(buf.tobytes()).decode("utf-8")

        # Rough bounding box of body region
        coords = np.argwhere(mask > 0.5)
        body_bbox = None
        if coords.size:
            y_min, x_min = coords.min(axis=0)
            y_max, x_max = coords.max(axis=0)
            body_bbox = {"x": int(x_min), "y": int(y_min), "w": int(x_max - x_min), "h": int(y_max - y_min)}

        return jsonify({"mask": mask_b64, "body_bbox": body_bbox})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/precision-edit", methods=["POST"])
def precision_edit():
    """
    Precision edit: detect faces/body first, then return enhanced prompt
    with spatial coordinates for the frontend to use in the Gemini edit call.
    """
    try:
        data = request.json or {}
        b64 = data.get("image")
        base_prompt = data.get("prompt", "")
        edit_type = data.get("edit_type", "general")  # face | outfit | general

        if not b64:
            return jsonify({"error": "No image provided"}), 400

        import cv2
        img_bgr = decode_image(b64)
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        h, w = img_rgb.shape[:2]

        face_info = ""
        body_info = ""

        # Face detection
        try:
            detector = get_face_detector()
            face_results = detector.process(img_rgb)
            if face_results.detections:
                det = face_results.detections[0]
                bbox = det.location_data.relative_bounding_box
                fx = round(bbox.xmin * w)
                fy = round(bbox.ymin * h)
                fw = round(bbox.width * w)
                fh = round(bbox.height * h)
                face_info = f"Face detected at pixel region x={fx}-{fx+fw}, y={fy}-{fy+fh} ({round(bbox.width*100)}% of image width). "
        except Exception:
            pass

        # Body segmentation
        try:
            segmenter = get_segmenter()
            seg_results = segmenter.process(img_rgb)
            mask = seg_results.segmentation_mask
            coords = np.argwhere(mask > 0.5)
            if coords.size:
                y_min, x_min = coords.min(axis=0)
                y_max, x_max = coords.max(axis=0)
                body_info = f"Body/person occupies pixel region x={int(x_min)}-{int(x_max)}, y={int(y_min)}-{int(y_max)}. "
        except Exception:
            pass

        spatial_context = face_info + body_info
        enhanced_prompt = super_prompt_boost(
            f"{base_prompt}\n\nSpatial context for precision: {spatial_context}"
            if spatial_context else base_prompt
        )

        return jsonify({
            "enhanced_prompt": enhanced_prompt,
            "face_info": face_info.strip(),
            "body_info": body_info.strip(),
            "spatial_context": spatial_context.strip(),
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/humanizer")
def humanizer_page():
    return render_template("index.html")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="localhost", port=8000, threaded=True)
