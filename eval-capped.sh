#!/usr/bin/env bash
set -e

LIMIT=30
echo "Starting capped evaluation of $LIMIT jobs..."

# Extract URLs marked as pending (- [ ])
urls=$(grep '^\s*- \[ \]' data/pipeline.md | grep -Eo '(https?://[^[:space:]]+)')

if [ -z "$urls" ]; then
  echo "No pending URLs found."
  exit 0
fi

count=0
for url in $urls; do
  if [ $count -ge $LIMIT ]; then
    echo "Reached limit of $LIMIT jobs. Stopping."
    break
  fi
  
  count=$((count + 1))
  echo "[$count/$LIMIT] Evaluating: $url"
  
  # Fetch JD text
  jd_text=$(curl -s "https://r.jina.ai/$url")
  
  if [ -z "$jd_text" ] || [[ "$jd_text" == *"Error"* ]]; then
    echo "  ⚠️ Failed to fetch JD text. Skipping."
    continue
  fi

  # Run evaluator
  node gemini-eval.mjs "$jd_text"
  
  # Get the report file name (latest one)
  report_file=$(ls -t reports/*.md | head -n 1)
  
  # Auto-generate PDF if score >= 4.5
  if grep -qi "Score: 4\.[5-9]" "$report_file"; then
    echo "  🚀 High match detected (>= 4.5)!"
    # The AI (Antigravity) will help generate the PDF manually for these
  fi
  
  # Mark as processed in pipeline.md (Simpler sed)
  sed -i.bak "s|- \[ \] $url|- [x] $url|g" data/pipeline.md
done

echo "✅ Evaluation complete for $count jobs."
grep "SCORE:" reports/*.md | sort -t: -k3 -nr | head -n 10
