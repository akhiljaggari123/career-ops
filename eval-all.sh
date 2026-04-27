#!/usr/bin/env bash
set -e

echo "Starting headless evaluation of pending jobs..."

# Extract URLs marked as pending (- [ ])
urls=$(grep '^\s*- \[ \]' data/pipeline.md | grep -Eo '(https?://[^[:space:]]+)')

if [ -z "$urls" ]; then
  echo "No pending URLs found."
  exit 0
fi

count=0
for url in $urls; do
  count=$((count + 1))
  echo "[$count] Evaluating: $url"
  
  # Fetch JD text
  jd_text=$(curl -s "https://r.jina.ai/$url")
  
  if [ -z "$jd_text" ] || [[ "$jd_text" == *"Error"* ]]; then
    echo "  ⚠️ Failed to fetch JD text. Skipping."
    continue
  fi

  # Run evaluator
  node gemini-eval.mjs "$jd_text"
  
  # Mark as processed in pipeline.md (replace first occurrence of '- [ ] URL' with '- [x] URL')
  # Escaping for sed
  safe_url=$(printf '%s\n' "$url" | sed -e 's/[]\/$*.^|[]/\\&/g')
  sed -i.bak -E "0,/- \[ \] .*$safe_url/ s/- \[ \] (.*$safe_url)/- [x] \1/" data/pipeline.md || true
done

echo "✅ Evaluation complete for $count jobs."
