async function humanize() {
  const input = document.getElementById('inputText').value.trim();
  const mode = document.getElementById('mode').value;
  const output = document.getElementById('outputText');
  const status = document.getElementById('status');
  const btn = document.querySelector('button');

  if (!input) {
    status.textContent = 'Please paste some text first.';
    status.className = 'error';
    return;
  }

  btn.disabled = true;
  output.value = '';
  status.textContent = 'Humanizing...';
  status.className = 'loading';

  try {
    const res = await fetch('/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input, mode })
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const data = await res.json();

    if (data.fallback || !data.humanized_text) {
      status.textContent = 'OpenRouter key not set — falling back to Gemini via the main app.';
      status.className = 'error';
    } else {
      output.value = data.humanized_text;
      status.textContent = 'Done!';
      status.className = 'success';
    }
  } catch (err) {
    status.textContent = `Error: ${err.message}`;
    status.className = 'error';
  } finally {
    btn.disabled = false;
  }
}
