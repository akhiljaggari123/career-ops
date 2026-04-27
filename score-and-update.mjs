
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const PIPELINE_PATH = 'data/pipeline.md';

async function main() {
  if (!existsSync(PIPELINE_PATH)) {
    console.error('Pipeline file not found');
    return;
  }

  let content = readFileSync(PIPELINE_PATH, 'utf-8');
  let lines = content.split('\n').filter(l => l.trim() !== '');
  let header = lines[0].split('\t');

  if (!header.includes('Score')) {
    header.splice(4, 0, 'Score');
    lines[0] = header.join('\t');
  }

  const scoreIdx = header.indexOf('Score');
  const urlIdx = header.indexOf('URL');

  // Shuffle unscored rows so an early stop still yields a diverse sample
  // across companies + role types. Scored rows stay in place at the top.
  // Set SHUFFLE=0 to disable.
  if (process.env.SHUFFLE !== '0') {
    const headerLine = lines[0];
    const scored = [];
    const unscored = [];
    for (const l of lines.slice(1)) {
      const cols = l.split('\t');
      while (cols.length <= scoreIdx) cols.push('');
      if (cols[scoreIdx] && cols[scoreIdx] !== '') scored.push(l);
      else unscored.push(l);
    }
    // Fisher–Yates shuffle
    for (let i = unscored.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unscored[i], unscored[j]] = [unscored[j], unscored[i]];
    }
    lines = [headerLine, ...scored, ...unscored];
    writeFileSync(PIPELINE_PATH, lines.join('\n') + '\n');
    console.log(`🔀 Shuffled ${unscored.length} unscored rows (${scored.length} already scored, kept in place)`);
  }

  for (let i = 1; i < lines.length; i++) {
    let cols = lines[i].split('\t');
    while (cols.length < header.length) cols.push('');
    
    if (cols[scoreIdx] && cols[scoreIdx] !== '') continue;

    const url = cols[urlIdx];
    console.log(`\n[${i}/${lines.length-1}] Evaluating: ${url}`);
    
    try {
      console.log(`  Fetching JD...`);
      const jdText = execSync(`curl -s "https://r.jina.ai/${url}"`, { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 });
      
      if (!jdText || jdText.includes('Error') || jdText.length < 200) {
        console.warn(`  ⚠️ Failed to fetch JD. Skipping.`);
        continue;
      }

      console.log(`  Running Gemini...`);
      const output = execSync(`node gemini-eval.mjs "${jdText.replace(/"/g, '\\"').replace(/\$/g, '\\$')}"`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
      
      const scoreMatch = output.match(/SCORE:\s*([\d\.]+)/);
      if (scoreMatch) {
        const score = scoreMatch[1];
        console.log(`  ✅ Score: ${score}`);
        cols[scoreIdx] = score;
        lines[i] = cols.join('\t');
        writeFileSync(PIPELINE_PATH, lines.join('\n') + '\n');
      } else {
        console.warn(`  ⚠️ Score not found in output.`);
      }

      const waitMs = parseInt(process.env.GEMINI_WAIT_MS || '0', 10);
      if (waitMs > 0) {
        console.log(`  Waiting ${waitMs/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
      }

    } catch (err) {
      if (err.message.includes('503') || err.message.includes('429')) {
        console.log(`  🚨 Rate limit hit (503/429). Waiting 2 minutes before retry...`);
        await new Promise(resolve => setTimeout(resolve, 120000));
        i--; 
      } else {
        console.error(`  ❌ Error: ${err.message.slice(0, 100)}...`);
      }
    }
  }
}

main();
