let timeout;

async function humanize() {
  const input = document.getElementById("inputText").value;
  const mode = document.getElementById("mode").value;
  const output = document.getElementById("outputText");
  const status = document.getElementById("status");

  if (!input) return;

  status.innerText = "Processing...";
  output.value = "";

  const res = await fetch("/humanize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: input, mode })
  });

  const data = await res.json();
  output.value = data.humanized_text;

  navigator.clipboard.writeText(data.humanized_text);
  status.innerText = "Done ✅";
}

// REAL-TIME
document.getElementById("inputText").addEventListener("input", () => {
  clearTimeout(timeout);
  timeout = setTimeout(humanize, 700);
});
