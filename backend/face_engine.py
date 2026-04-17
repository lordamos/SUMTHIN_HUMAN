"""
Shared InsightFace engine — single initialization point for face detection
and face swapping, used by ai_edit_engine.py and video_engine.py.

Both modules previously duplicated this logic; all InsightFace state now
lives here so there is exactly one copy of the model in memory.
"""
import os
import urllib.request

# ---------------------------------------------------------------------------
# GPU / CPU context detection
# ---------------------------------------------------------------------------

def _get_ctx_id() -> int:
    """Return 0 if a CUDA-capable GPU is available, else -1 (CPU)."""
    try:
        import onnxruntime as ort
        if "CUDAExecutionProvider" in ort.get_available_providers():
            return 0
    except Exception:
        pass
    return -1


# ---------------------------------------------------------------------------
# Shared state
# ---------------------------------------------------------------------------

_face_app = None
_swapper = None
_ready = False
_init_failed = False  # prevents repeated download attempts after a hard failure

# Known public mirrors for inswapper_128.onnx (tried in order).
# The original GitHub URL (v0.7 release) was removed upstream.
_INSWAPPER_MIRRORS = [
    "https://huggingface.co/ezioruan/inswapper_128.onnx/resolve/main/inswapper_128.onnx",
    "https://huggingface.co/thebiglaskowski/inswapper_128.onnx/resolve/main/inswapper_128.onnx",
]


def _download_inswapper(dest_path: str) -> bool:
    """Download inswapper_128.onnx from one of the known public mirrors.

    Returns True if the file was downloaded successfully, False otherwise.
    """
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    tmp_path = dest_path + ".tmp"
    for url in _INSWAPPER_MIRRORS:
        print(f"[face_engine] Downloading inswapper_128.onnx from {url} …")
        try:
            urllib.request.urlretrieve(url, tmp_path)
            os.replace(tmp_path, dest_path)
            print(f"[face_engine] Model saved to {dest_path}")
            return True
        except Exception as exc:
            print(f"[face_engine] Mirror failed ({url}): {exc}")
            try:
                os.remove(tmp_path)
            except OSError:
                pass
    return False


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def init() -> bool:
    """Lazily initialize InsightFace. Returns True when ready."""
    global _face_app, _swapper, _ready, _init_failed
    if _ready:
        return True
    if _init_failed:
        return False
    try:
        from insightface.app import FaceAnalysis
        from insightface.model_zoo import get_model

        ctx_id = _get_ctx_id()
        providers = (
            ["CUDAExecutionProvider", "CPUExecutionProvider"]
            if ctx_id == 0
            else ["CPUExecutionProvider"]
        )

        _face_app = FaceAnalysis(name="buffalo_l", providers=providers)
        _face_app.prepare(ctx_id=ctx_id, det_size=(640, 640))

        model_path = os.path.join(
            os.path.expanduser("~"), ".insightface", "models", "inswapper_128.onnx"
        )

        if not os.path.exists(model_path):
            # InsightFace's built-in downloader fetches from GitHub, but that
            # release asset was removed.  Use our own mirror-aware downloader.
            if not _download_inswapper(model_path):
                raise RuntimeError(
                    "Could not download inswapper_128.onnx from any mirror."
                )

        _swapper = get_model(model_path)

        _ready = True
        return True
    except Exception as e:
        print(f"[face_engine] InsightFace init failed: {e}")
        _init_failed = True
        return False


def reset() -> None:
    """Allow a fresh init attempt (e.g. after fixing network or model path)."""
    global _face_app, _swapper, _ready, _init_failed
    _face_app = None
    _swapper = None
    _ready = False
    _init_failed = False


def get_faces(image_bgr):
    """Return InsightFace face objects detected in *image_bgr* (BGR numpy array)."""
    if _face_app is None:
        return []
    return _face_app.get(image_bgr)


def get_swapper():
    """Return the loaded inswapper model, or None if not ready."""
    return _swapper


def get_face_app():
    """Return the FaceAnalysis app instance, or None if not ready."""
    return _face_app
