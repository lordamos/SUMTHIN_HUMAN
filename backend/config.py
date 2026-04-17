"""
Backend configuration — centralized model name constants.

All model strings used by the backend live here so that changing a model
version only requires editing this one file.
"""

# ---------------------------------------------------------------------------
# OpenRouter
# ---------------------------------------------------------------------------

OPENROUTER_TEXT_MODEL = "openai/gpt-4o-mini"

# ---------------------------------------------------------------------------
# Gemini (reference constants — consumed by the frontend via env;
# listed here for future server-side Gemini calls and documentation)
# ---------------------------------------------------------------------------

GEMINI_TEXT_MODEL = "gemini-3-pro-preview"
GEMINI_VISION_MODEL = "gemini-3-flash-preview"
GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts"
GEMINI_IMAGE_EDIT_MODEL = "gemini-2.5-flash-image"
