from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import random
import re

app = Flask(__name__)
CORS(app)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

def add_human_touch(text):
    if random.random() < 0.3:
        text = text.replace(". ", "... ", 1)
    if random.random() < 0.2:
        text = text.replace(" ", " — ", 1)
    return text

def fallback(text):
    text = re.sub(r"\bvery\b", "really", text, flags=re.IGNORECASE)
    text = re.sub(r"\bimportant\b", "pretty important", text, flags=re.IGNORECASE)
    return text

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

@app.route("/humanize", methods=["POST"])
def humanize():
    data = request.json
    text = data.get("text", "")
    mode = data.get("mode", "casual")

    result = ai_humanize(text, mode)

    if result is None:
        return jsonify({"humanized_text": None, "fallback": True}), 200

    return jsonify({"humanized_text": result, "fallback": False})

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(host="localhost", port=8000, threaded=True)
