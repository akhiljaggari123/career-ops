#!/usr/bin/env bash
set -e

# ------------------------------------------------------------
# Full Career‑Ops one‑click pipeline
#   1️⃣ Evaluate every pending job in data/pipeline.md
#   2️⃣ Generate an ATS‑optimized PDF for each report
#   3️⃣ Pre‑fill each application form (stops before final Submit)
# ------------------------------------------------------------

# Step 1 – Evaluate jobs
if command -v node >/dev/null; then
  echo "[1/3] Evaluating job postings…"
  node gemini-eval.mjs
else
  echo "Node.js is required but not found. aborting." >&2
  exit 1
fi

# Step 2 – Generate PDFs
echo "[2/3] Generating PDFs…"
node generate-pdf.mjs

# Step 3 – Pre‑fill application forms (Playwright mode)
# This uses the built‑in career‑ops‑apply mode which fills fields and pauses before the final Submit.
# It will open each URL in Chrome, fill in name, email, phone, LinkedIn, visa answers, etc.
# You must manually upload the PDF and click Submit, then press Enter to continue.

echo "[3/3] Pre‑filling application forms…"
# Extract URLs from pipeline that are marked as processed (the lines that start with '- [x]')
while read -r url; do
  echo "Launching apply mode for $url"
  career-ops-apply "$url"
  read -p "⏎ After uploading the PDF and clicking Submit, press Enter to continue..."
done < <(grep -oP '(https?://[^|]+)' data/pipeline.md | grep -v '\- \[ \]')

echo "✅ All steps completed."
