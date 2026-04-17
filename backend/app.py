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

from config import OPENROUTER_TEXT_MODEL

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
                    "model": OPENROUTER_TEXT_MODEL,
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
    Start a video face-swap job.
    Accept multipart/form-data with:
      - 'video': the video file
      - 'face': the source face image
    Returns {job_id} immediately; use /video-progress/<id> to poll.
    """
    try:
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

        job_id = uuid.uuid4().hex
        cancel_event = threading.Event()
        now = time.time()
        # Pre-assign a stable output path inside our dedicated directory.
        pre_output_path = os.path.join(_VIDEO_OUTPUT_DIR, f"{job_id}.mp4")
        _video_jobs[job_id] = {
            "status": "running",
            "progress": 0.0,
            "frame": 0,
            "total": 0,
            "output_path": None,
            "cancel_event": cancel_event,
            "error": None,
            "created_at": now,
            "last_polled_at": now,
        }
        job_store.insert_job(job_id, now, output_path=pre_output_path)

        t = threading.Thread(
            target=_run_video_job,
            args=(job_id, tmp_video.name, source_img, pre_output_path),
            daemon=True,
        )
        t.start()

        return jsonify({"job_id": job_id})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/video-progress/<job_id>", methods=["GET"])
def video_progress_route(job_id: str):
    """Return {status, progress, frame, total} for a video job."""
    job = _video_jobs.get(job_id)
    if job is None:
        return jsonify({"error": "Job not found."}), 404
    now = time.time()
    job["last_polled_at"] = now
    job_store.update_job(job_id, last_polled_at=now)
    return jsonify({
        "status": job["status"],
        "progress": job["progress"],
        "frame": job["frame"],
        "total": job["total"],
        "error": job.get("error"),
    })


@app.route("/video-cancel/<job_id>", methods=["DELETE"])
def video_cancel_route(job_id: str):
    """Cancel a running video job."""
    job = _video_jobs.get(job_id)
    if job is None:
        return jsonify({"error": "Job not found."}), 404
    job["cancel_event"].set()
    job_store.update_job(job_id, status="cancelled")
    return jsonify({"ok": True})


@app.route("/video-result/<job_id>", methods=["GET"])
def video_result_route(job_id: str):
    """Return the processed video file for a completed job."""
    job = _video_jobs.get(job_id)
    if job is None:
        return jsonify({"error": "Job not found."}), 404
    if job["status"] != "done":
        return jsonify({"error": "Job not complete.", "status": job["status"]}), 400

    output_path = job.get("output_path")
    if not output_path or not os.path.exists(output_path):
        return jsonify({"error": "Result file not found."}), 404

    from flask import after_this_request

    @after_this_request
    def _cleanup(response):
        try:
            if os.path.exists(output_path):
                os.remove(output_path)
        except Exception:
            pass
        _video_jobs.pop(job_id, None)
        job_store.delete_job(job_id)
        return response

    return send_file(
        output_path,
        mimetype="video/mp4",
        as_attachment=True,
        download_name="face_swapped.mp4"
    )


# ---------------------------------------------------------------------------
# Live webcam face swap — session-based (avoids putting large payload in URL)
# POST /webcam-swap/session  → upload face image, receive session token
# GET  /webcam-swap?session=<token> → MJPEG stream with face swap applied
# ---------------------------------------------------------------------------

import uuid
import threading
import time
import job_store

# In-memory session store: token -> numpy BGR image
# Entries expire when the server restarts; fine for dev/live use
_webcam_sessions: dict = {}

# ---------------------------------------------------------------------------
# Video job store
# ---------------------------------------------------------------------------
# Each job: {status, progress, frame, total, output_path, cancel_event, error,
#            created_at, last_polled_at}
# Persistent fields (status, output_path, error, created_at, last_polled_at)
# are mirrored to SQLite via job_store so they survive a server restart.
_video_jobs: dict = {}

# Dedicated directory for video output files so we can detect orphans on startup.
_VIDEO_OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "video_outputs")
os.makedirs(_VIDEO_OUTPUT_DIR, exist_ok=True)

# How long (seconds) before an undownloaded job is considered abandoned.
# Override via the VIDEO_JOB_TTL env var (default: 3600 = 1 hour).
_VIDEO_JOB_TTL = int(os.getenv("VIDEO_JOB_TTL", "3600"))
# How often (seconds) the cleanup sweep runs.
_VIDEO_JOB_SWEEP_INTERVAL = 60

# ---------------------------------------------------------------------------
# Startup: initialise DB, reload persisted jobs, and clean up orphaned files
# ---------------------------------------------------------------------------

job_store.init_db()

def _startup_restore_jobs() -> None:
    """
    Called once at startup to:
    1. Reload persisted job records into the in-memory dict.
    2. For "running" jobs, check whether the output file was actually written
       before the crash.  If found, promote to "done"; otherwise mark "error".
    3. Verify "done" jobs still have their output file on disk.
    4. Delete output files that have no matching job record (orphaned by crash).
    """
    rows = job_store.load_all_jobs()
    known_output_paths: set = set()

    for row in rows:
        jid = row["job_id"]
        status = row["status"]
        output_path = row.get("output_path")

        if status == "running":
            # The server restarted mid-job.  Check whether the processing
            # actually finished before the crash by looking for the output file.
            # process_video writes a _final.mp4 (normal path) or falls back to
            # the raw output_path when moviepy is unavailable.
            actual_path = None
            if output_path:
                final_candidate = output_path.replace(".mp4", "_final.mp4")
                if os.path.exists(final_candidate):
                    actual_path = final_candidate
                elif os.path.exists(output_path):
                    actual_path = output_path

            if actual_path:
                # Processing completed right before the crash — recover as done.
                status = "done"
                output_path = actual_path
                job_store.update_job(jid, status="done", output_path=actual_path)
            else:
                status = "error"
                output_path = None
                job_store.update_job(jid, status="error", error="Server restarted while job was running.")

        # If a "done" job's output file was lost, demote it to error.
        if status == "done" and output_path and not os.path.exists(output_path):
            status = "error"
            job_store.update_job(jid, status="error", error="Output file missing after restart.")
            output_path = None

        if output_path:
            known_output_paths.add(os.path.abspath(output_path))

        _video_jobs[jid] = {
            "status": status,
            "progress": 1.0 if status == "done" else 0.0,
            "frame": 0,
            "total": 0,
            "output_path": output_path,
            "cancel_event": threading.Event(),
            "error": row.get("error"),
            "created_at": row["created_at"],
            "last_polled_at": row["last_polled_at"],
        }

    # Scan the output directory for files not referenced by any job record.
    try:
        for fname in os.listdir(_VIDEO_OUTPUT_DIR):
            fpath = os.path.abspath(os.path.join(_VIDEO_OUTPUT_DIR, fname))
            if fpath not in known_output_paths:
                try:
                    os.remove(fpath)
                except Exception:
                    pass
    except Exception:
        pass


_startup_restore_jobs()


def _cleanup_video_jobs() -> None:
    """Background daemon that purges abandoned jobs older than _VIDEO_JOB_TTL.

    Staleness is measured from last_polled_at so that actively-watched
    long-running jobs are never evicted mid-processing.
    """
    while True:
        time.sleep(_VIDEO_JOB_SWEEP_INTERVAL)
        cutoff = time.time() - _VIDEO_JOB_TTL

        # Atomically remove stale rows from SQLite and get what was deleted.
        stale_rows = job_store.delete_stale_jobs(cutoff)

        for row in stale_rows:
            jid = row["job_id"]
            job = _video_jobs.pop(jid, None)

            # Signal any still-running thread to stop
            cancel_event = (job or {}).get("cancel_event")
            if cancel_event is not None:
                cancel_event.set()

            # Delete any output file left on disk (prefer row's path over memory)
            output_path = row.get("output_path") or (job or {}).get("output_path")
            if output_path and os.path.exists(output_path):
                try:
                    os.remove(output_path)
                except Exception:
                    pass


_cleanup_thread = threading.Thread(target=_cleanup_video_jobs, daemon=True)
_cleanup_thread.start()


def _run_video_job(job_id: str, video_path: str, source_img, pre_output_path: str) -> None:
    """Background thread target for video face swap jobs."""
    from video_engine import process_video
    job = _video_jobs[job_id]
    cancel_event: threading.Event = job["cancel_event"]

    def on_progress(frame_num: int, total_frames: int):
        job["frame"] = frame_num
        job["total"] = total_frames
        job["progress"] = (frame_num / total_frames) if total_frames > 0 else 0.0

    try:
        output_path = process_video(
            video_path,
            source_img,
            output_path=pre_output_path,
            progress_callback=on_progress,
            cancel_event=cancel_event,
        )
        if cancel_event.is_set() or output_path is None:
            job["status"] = "cancelled"
            job_store.update_job(job_id, status="cancelled")
            # Ensure any leftover output file is removed
            if output_path and os.path.exists(output_path):
                try:
                    os.remove(output_path)
                except Exception:
                    pass
            # Evict cancelled job from store after a brief delay so one final
            # poll can read the status (frontend stops polling immediately on
            # cancel, but belt-and-suspenders)
            def _evict():
                import time
                time.sleep(5)
                _video_jobs.pop(job_id, None)
                job_store.delete_job(job_id)
            threading.Thread(target=_evict, daemon=True).start()
        else:
            job["output_path"] = output_path
            job["status"] = "done"
            job["progress"] = 1.0
            job_store.update_job(job_id, status="done", output_path=output_path)
    except Exception as exc:
        job["status"] = "error"
        job["error"] = str(exc)
        job_store.update_job(job_id, status="error", error=str(exc))
        # Evict error jobs after a brief window
        def _evict_err():
            import time
            time.sleep(30)
            _video_jobs.pop(job_id, None)
            job_store.delete_job(job_id)
        threading.Thread(target=_evict_err, daemon=True).start()
    finally:
        try:
            if os.path.exists(video_path):
                os.remove(video_path)
        except Exception:
            pass


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


@app.route("/video-jobs/stats", methods=["GET"])
def video_jobs_stats():
    """Return aggregate stats about current video jobs and disk usage."""
    counts: dict = {s: 0 for s in ("running", "done", "error", "cancelled")}
    total_bytes = 0
    oldest_age: float | None = None
    now = time.time()

    for job in list(_video_jobs.values()):
        status = job.get("status", "unknown")
        counts[status] = counts.get(status, 0) + 1

        output_path = job.get("output_path")
        if output_path and os.path.exists(output_path):
            try:
                total_bytes += os.path.getsize(output_path)
            except OSError:
                pass

        created_at = job.get("created_at")
        if created_at is not None:
            age = now - created_at
            if oldest_age is None or age > oldest_age:
                oldest_age = age

    return jsonify({
        "counts": counts,
        "total_jobs": len(_video_jobs),
        "output_bytes": total_bytes,
        "oldest_job_age_seconds": round(oldest_age, 1) if oldest_age is not None else None,
        "ttl_seconds": _VIDEO_JOB_TTL,
    })


if __name__ == "__main__":
    app.run(host="localhost", port=8000, threaded=True)
