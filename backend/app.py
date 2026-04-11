from flask import Flask, request, jsonify, render_template, send_file, Response
from flask_cors import CORS
import requests
import os
import random
import re
import base64
import io
import tempfile
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


@app.route("/detect-faces", methods=["POST"])
def detect_faces_route():
    """Detect all faces and return bounding boxes + image dimensions."""
    try:
        from ai_edit_engine import detect_faces_with_coords, base64_to_image
        data = request.json or {}
        if not data.get("image"):
            return jsonify({"error": "Missing image."}), 400
        img = base64_to_image(data["image"])
        result = detect_faces_with_coords(img)
        return jsonify(result)
    except RuntimeError as e:
        return jsonify({"error": str(e), "faces": []}), 422
    except Exception as e:
        return jsonify({"error": str(e), "faces": []}), 500


@app.route("/face-swap", methods=["POST"])
def face_swap_route():
    """Face swap: swap selected face indices (or all). Supports fast/pro/nano models."""
    try:
        from ai_edit_engine import (face_swap_selected, base64_to_image,
                                    image_to_base64, enhance_realism, nano_banana_edit)
        data = request.json or {}
        if not data.get("source") or not data.get("target"):
            return jsonify({"error": "Missing source or target image."}), 400

        model = data.get("model", "fast")
        face_indices = data.get("faceIndices", [])

        if model == "nano":
            try:
                result_b64 = nano_banana_edit(data["target"], "face swap with provided source face")
                return jsonify({"image": result_b64, "model_used": "nano"})
            except Exception:
                model = "fast"

        source = base64_to_image(data["source"])
        target = base64_to_image(data["target"])
        result = face_swap_selected(source, target, face_indices)

        if model == "pro":
            result = enhance_realism(result)

        return jsonify({"image": image_to_base64(result), "model_used": model})
    except RuntimeError as e:
        return jsonify({"error": str(e), "fallback": True}), 422
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/face-swap-multi", methods=["POST"])
def face_swap_multi_route():
    """Multi face swap: swap selected faces in target (legacy compat, delegates to /face-swap)."""
    try:
        from ai_edit_engine import (face_swap_selected, base64_to_image,
                                    image_to_base64, enhance_realism)
        data = request.json or {}
        if not data.get("source") or not data.get("target"):
            return jsonify({"error": "Missing source or target image."}), 400

        model = data.get("model", "fast")
        face_indices = data.get("faceIndices", [])

        source = base64_to_image(data["source"])
        target = base64_to_image(data["target"])
        result = face_swap_selected(source, target, face_indices)

        if model in ("pro", "nano"):
            result = enhance_realism(result)

        return jsonify({"image": image_to_base64(result), "model_used": model})
    except RuntimeError as e:
        return jsonify({"error": str(e), "fallback": True}), 422
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/outfit-swap", methods=["POST"])
def outfit_swap_route():
    """Outfit swap — Mode A: texture blend. Mode B: AI prompt (via Gemini edit)."""
    try:
        from ai_edit_engine import outfit_swap, base64_to_image, image_to_base64, enhance_realism
        data = request.json or {}
        mode = data.get("mode", "texture")

        if mode == "ai":
            # AI prompt mode — use Gemini editImage via the existing helper
            if not data.get("image"):
                return jsonify({"error": "Missing image."}), 400
            outfit_prompt = data.get("prompt", "a stylish outfit")
            full_prompt = (
                f"Change the clothing/outfit of the person to: {outfit_prompt}. "
                "Requirements: keep body shape and pose exactly the same, "
                "match original lighting and shadows, add realistic fabric folds and texture, "
                "preserve face and skin tone, make it look like a real photograph."
            )
            return jsonify({"prompt": full_prompt, "mode": "ai_prompt"})

        # Texture mode
        if not data.get("image") or not data.get("texture"):
            return jsonify({"error": "Missing image or texture."}), 400

        image = base64_to_image(data["image"])
        texture = base64_to_image(data["texture"])
        result = outfit_swap(image, texture)

        if data.get("realism", True):
            result = enhance_realism(result)

        return jsonify({"image": image_to_base64(result)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/humanizer")
def humanizer_page():
    return render_template("index.html")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


# ---------------------------------------------------------------------------
# Video face swap — POST /video-face-swap
# ---------------------------------------------------------------------------

@app.route("/video-face-swap", methods=["POST"])
def video_face_swap_route():
    """
    Accept multipart/form-data with:
      - 'video': the video file
      - 'face': the source face image
    Returns the processed .mp4 file as a download.
    """
    try:
        from video_engine import process_video

        if "video" not in request.files or "face" not in request.files:
            return jsonify({"error": "Missing 'video' or 'face' file."}), 400

        video_file = request.files["video"]
        face_file = request.files["face"]

        # Save uploaded video to a temp file
        tmp_video = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
        video_file.save(tmp_video.name)
        tmp_video.close()

        # Read source face image
        face_bytes = face_file.read()
        import cv2
        face_arr = np.frombuffer(face_bytes, dtype=np.uint8)
        source_img = cv2.imdecode(face_arr, cv2.IMREAD_COLOR)
        if source_img is None:
            os.remove(tmp_video.name)
            return jsonify({"error": "Could not decode face image."}), 400

        # Process
        output_path = process_video(tmp_video.name, source_img)
        os.remove(tmp_video.name)

        # Clean up output file after the response is sent
        from flask import after_this_request

        @after_this_request
        def _cleanup_video(response):
            try:
                if os.path.exists(output_path):
                    os.remove(output_path)
            except Exception:
                pass
            return response

        return send_file(
            output_path,
            mimetype="video/mp4",
            as_attachment=True,
            download_name="face_swapped.mp4"
        )
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 422
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Live webcam face swap — session-based (avoids putting large payload in URL)
# POST /webcam-swap/session  → upload face image, receive session token
# GET  /webcam-swap?session=<token> → MJPEG stream with face swap applied
# ---------------------------------------------------------------------------

import uuid

# In-memory session store: token -> numpy BGR image
# Entries expire when the server restarts; fine for dev/live use
_webcam_sessions: dict = {}


@app.route("/webcam-swap/session", methods=["POST"])
def webcam_swap_session():
    """
    Accept a face image as multipart/form-data or JSON base64.
    Returns a short-lived session token.

    Accepts:
      - multipart/form-data with field 'face' (file upload)
      - JSON body with field 'face' (base64 string, optionally data URI)
    """
    try:
        import cv2
        source_img = None

        if request.files.get("face"):
            face_bytes = request.files["face"].read()
            face_arr = np.frombuffer(face_bytes, dtype=np.uint8)
            source_img = cv2.imdecode(face_arr, cv2.IMREAD_COLOR)
        else:
            data = request.json or {}
            face_b64 = data.get("face", "")
            if not face_b64:
                return jsonify({"error": "Missing face image."}), 400
            if "," in face_b64:
                face_b64 = face_b64.split(",", 1)[1]
            face_bytes = base64.b64decode(face_b64)
            face_arr = np.frombuffer(face_bytes, dtype=np.uint8)
            source_img = cv2.imdecode(face_arr, cv2.IMREAD_COLOR)

        if source_img is None:
            return jsonify({"error": "Could not decode face image."}), 400

        token = uuid.uuid4().hex
        _webcam_sessions[token] = source_img
        return jsonify({"session": token})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/webcam-swap", methods=["GET"])
def webcam_swap_route():
    """
    Streams a multipart/x-mixed-replace JPEG stream from the webcam
    with InsightFace face swap applied.
    Query param: session — token returned by POST /webcam-swap/session
    """
    try:
        from video_engine import webcam_swap_frames

        token = request.args.get("session", "")
        if not token or token not in _webcam_sessions:
            return jsonify({"error": "Invalid or expired session token."}), 400

        source_img = _webcam_sessions[token]

        def generate():
            boundary = b"--frame\r\n"
            header = b"Content-Type: image/jpeg\r\n\r\n"
            try:
                for jpeg_bytes in webcam_swap_frames(source_img, frame_skip=2,
                                                      resize_w=640, resize_h=480):
                    yield boundary + header + jpeg_bytes + b"\r\n"
            finally:
                # Clean up session after stream ends
                _webcam_sessions.pop(token, None)

        return Response(
            generate(),
            mimetype="multipart/x-mixed-replace; boundary=frame"
        )
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 422
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="localhost", port=8000, threaded=True)
