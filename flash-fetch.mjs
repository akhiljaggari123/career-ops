#!/usr/bin/env node
/**
 * flash-fetch.mjs — Direct API fetcher for Greenhouse + Lever + Ashby
 * Scans all target companies and outputs verified URLs to data/pipeline.md
 * Usage: node flash-fetch.mjs
 */

import { writeFileSync, readFileSync } from 'fs';

const KEYWORDS = ['Senior', 'Staff', 'Principal', 'SWE', 'SDE', 'Engineer', 'Developer'];
const ROLES    = [
  'Software Engineer', 'Backend Engineer', 'Infrastructure Engineer', 'Platform Engineer',
  'Distributed Systems', 'Frontend Engineer', 'Front-End Engineer', 'Front End Engineer',
  'Fullstack Engineer', 'Full-Stack Engineer', 'Full Stack Engineer',
  'Software Developer', 'SDE', 'SWE', 'Systems Engineer', 'Site Reliability Engineer',
  'DevOps Engineer', 'Data Engineer', 'ML Engineer', 'Applied Scientist',
];
const REMOTE   = ['Remote', 'United States', 'US', 'USA', 'Anywhere'];

// Company → [slug, board, host, portal]
const COMPANIES = {
  // ── GREENHOUSE (verified) ──────────────────────────────────────────
  'Airbnb':             ['airbnb',               'greenhouse'],
  'Affirm':             ['affirm',               'greenhouse'],
  'Asana':              ['asana',                'greenhouse'],
  'Atlassian':          ['atlassian',            'greenhouse'],
  'Better.com':         ['better',               'greenhouse'],
  'Box':                ['box',                  'greenhouse'],
  'Brex':               ['brex',                 'greenhouse'],
  'Canva':              ['canva',                'greenhouse'],
  'Chime':              ['chime',                'greenhouse'],
  'Cloudflare':         ['cloudflare',           'greenhouse'],
  'Coinbase':           ['coinbase',             'greenhouse'],
  'Compass':            ['compass',              'greenhouse'],
  'Confluent':          ['confluent',            'greenhouse'],
  'Databricks':         ['databricks',           'greenhouse'],
  'Datadog':            ['datadog',              'greenhouse'],
  'DocuSign':           ['docusign',             'greenhouse'],
  'DoorDash':           ['doordash',             'greenhouse'],
  'DraftKings':         ['draftkings',           'greenhouse'],
  'Dropbox':            ['dropbox',              'greenhouse'],
  'Expedia Group':      ['expedia',              'greenhouse'],
  'FanDuel':            ['fanduel',              'greenhouse'],
  'Gemini':             ['gemini',               'greenhouse'],
  'Gong':               ['gong',                 'greenhouse'],
  'Gusto':              ['gusto',                'greenhouse'],
  'HashiCorp':          ['hashicorp',            'greenhouse'],
  'HubSpot':            ['hubspot',              'greenhouse'],
  'Instacart':          ['instacart',            'greenhouse'],
  'Intuit':             ['intuit',               'greenhouse'],
  'Kraken':             ['kraken',               'greenhouse'],
  'Miro':               ['miro',                 'greenhouse'],
  'MongoDB':            ['mongodb',              'greenhouse'],
  'Netskope':           ['netskope',             'greenhouse'],
  'Okta':               ['okta',                 'greenhouse'],
  'Oscar Health':       ['oscar',                'greenhouse'],
  'Palo Alto Networks': ['paloaltonetworks',     'greenhouse'],
  'Pinterest':          ['pinterest',            'greenhouse'],
  'Plaid':              ['plaid',                'greenhouse'],
  'Quora':              ['quora',                'greenhouse'],
  'Ramp':               ['ramp',                 'greenhouse'],
  'Rippling':           ['rippling',             'greenhouse'],
  'Robinhood':          ['robinhood',            'greenhouse'],
  'Rubrik':             ['rubrik',               'greenhouse'],
  'Samsara':            ['samsara',              'greenhouse'],
  'Slack':              ['slack',                'greenhouse'],
  'Snap':               ['snapchat',             'greenhouse'],
  'Snowflake':          ['snowflake-computing',  'greenhouse'],
  'Snyk':               ['snyk',                 'greenhouse'],
  'SoFi':               ['sofi',                 'greenhouse'],
  'Splunk':             ['splunk',               'greenhouse'],
  'Stripe':             ['stripe',               'greenhouse'],
  'ThoughtSpot':        ['thoughtspot',          'greenhouse'],
  'Toast':              ['toast',                'greenhouse'],
  'Turo':               ['turo',                 'greenhouse'],
  'Unity':              ['unity',                'greenhouse'],
  'Vanta':              ['vanta',                'greenhouse'],
  'Walmart':            ['walmart',              'greenhouse'],
  'Wayfair':            ['wayfair',              'greenhouse'],
  'Wealthfront':        ['wealthfront',          'greenhouse'],
  'Yext':               ['yext',                 'greenhouse'],
  'Zendesk':            ['zendesk',              'greenhouse'],
  'Zillow':             ['zillow',               'greenhouse'],
  'Zscaler':            ['zscaler',              'greenhouse'],

  // ── WORKDAY (verified) ─────────────────────────────────────────────
  'Adobe':              ['adobe',                'workday', 'adobe.wd5.myworkdayjobs.com', 'external_experienced'],
  'Amazon':             ['amazon',               'workday', 'amazon.wd1.myworkdayjobs.com', 'External'],
  'Google':             ['google',               'workday', 'google.wd1.myworkdayjobs.com', 'External'],
  'Meta':               ['meta',                 'workday', 'meta.wd1.myworkdayjobs.com', 'External'],
  'Microsoft':          ['microsoft',            'workday', 'microsoft.wd1.myworkdayjobs.com', 'External'],
  'NVIDIA':             ['nvidia',               'workday', 'nvidia.wd5.myworkdayjobs.com', 'External'],
  'PayPal':             ['paypal',               'workday', 'paypal.wd1.myworkdayjobs.com', 'jobs'],
  'Salesforce':         ['salesforce',           'workday', 'salesforce.wd12.myworkdayjobs.com', 'External_Career_Site'],
  'Uber':               ['uber',                 'workday', 'uber.wd1.myworkdayjobs.com', 'UberExternalCareerSite'],
  'Workday':            ['workday',              'workday', 'workday.wd5.myworkdayjobs.com', 'wday'],

  // ── LEVER (verified) ──────────────────────────────────────────────
  'Airtable':           ['airtable',             'lever'],
  'Block':              ['block',                'lever'],
  'Cash App':           ['cashapp',              'lever'],
  'Coinbase':           ['coinbase',             'lever'],
  'Etsy':               ['etsy',                 'lever'],
  'Figma':              ['figma',                'lever'],
  'LinkedIn':           ['linkedin',             'lever'],
  'Lyft':               ['lyft',                 'lever'],
  'Medium':             ['medium',               'lever'],
  'Netflix':            ['netflix',              'lever'],
  'Notion':             ['notion',               'lever'],
  'Palantir':           ['palantir',             'lever'],
  'Peloton':            ['peloton',              'lever'],
  'Postmates':          ['postmates',            'lever'],
  'Retool':             ['retool',               'lever'],
  'Spotify':            ['spotify',              'lever'],
  'Twilio':             ['twilio',               'lever'],
  'Vercel':             ['vercel',               'lever'],

  // ── ASHBY ─────────────────────────────────────────────────────────
  'Anthropic':          ['anthropic',            'ashby'],
  'Deel':               ['deel',                 'ashby'],
  'Glean':              ['glean',                'ashby'],
  'Hugging Face':       ['huggingface',          'ashby'],
  'OpenAI':             ['openai',               'ashby'],
  'Perplexity':         ['perplexity',           'ashby'],
  'Rollfi':             ['rollfi',               'ashby'],
};

function isMatch(title, location = '') {
  const t = title.toLowerCase();
  const l = location.toLowerCase();
  
  // Skip roles that imply 8-12+ years experience (Staff, Principal, Architect, etc.)
  const highSeniority = ['staff', 'principal', 'architect', 'distinguished', 'fellow', 'manager', 'director', 'vp', 'head of', 'lead engineer'];
  if (highSeniority.some(s => t.includes(s) && !t.includes('lead to'))) return false;

  // Senior/Mid level markers to allow
  const allowedSeniority = ['senior', 'ii', 'iii', 'iv', 'v', 'l4', 'l5', 'l6', 'level 4', 'level 5'];

  // Skip non-US locations even if they say 'remote'
  const nonUsLocs = ['poland', 'spain', 'canada', 'india', 'uk', 'germany', 'london', 'toronto', 'vancouver', 'madrid', 'berlin', 'warsaw', 'remote spain', 'remote poland', 'remote canada'];
  if (nonUsLocs.some(nonUs => l.includes(nonUs))) return false;

  // Match if title contains any role keyword
  const hasRole  = ROLES.some(r => t.includes(r.toLowerCase()));
  // Remote or US-based
  const isRemote = REMOTE.some(r => l.includes(r.toLowerCase())) || l === '' || l.includes('usa') || l.includes('united states');
  
  return hasRole && isRemote;
}

async function fetchGreenhouse(slug) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=false`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).map(j => ({
      title: j.title,
      url: j.absolute_url,
      location: j.location?.name || '',
    }));
  } catch(e) { return []; }
}

async function fetchLever(slug) {
  const url = `https://api.lever.co/v0/postings/${slug}?mode=json&limit=250`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : []).map(j => ({
      title: j.text,
      url: j.hostedUrl,
      location: j.categories?.location || j.workplaceType || '',
    }));
  } catch(e) { return []; }
}

async function fetchAshby(slug) {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${slug}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobPostings || []).map(j => ({
      title: j.title,
      url: j.jobUrl,
      location: j.isRemote ? 'Remote' : (j.location || ''),
    }));
  } catch(e) { return []; }
}

async function fetchWorkday(host, tenant, portal) {
  const url = `https://${host}/wday/cxs/${tenant}/${portal}/jobs`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({limit: 50, offset: 0, appliedFacets: {}}),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobPostings || []).map(j => ({
      title: j.title,
      url: `https://${host}/job/${tenant}/${portal}${j.externalPath}`,
      location: j.locationsText || '',
    }));
  } catch(e) { return []; }
}

async function main() {
  console.log(`🔍 Flash Fetching ${Object.keys(COMPANIES).length} companies...`);
  const results = [];
  const errors  = [];

  await Promise.all(
    Object.entries(COMPANIES).map(async ([company, config]) => {
      const [slug, board, host, portal] = config;
      try {
        let jobs = [];
        if (board === 'greenhouse') jobs = await fetchGreenhouse(slug);
        else if (board === 'lever')      jobs = await fetchLever(slug);
        else if (board === 'ashby')      jobs = await fetchAshby(slug);
        else if (board === 'workday')    jobs = await fetchWorkday(host, slug, portal);

        const matched = jobs.filter(j => isMatch(j.title, j.location));
        for (const j of matched) {
          results.push({ company, title: j.title, url: j.url, location: j.location });
        }
        if (matched.length) console.log(`  ✅ ${company}: ${matched.length} match(es)`);
      } catch (e) {
        errors.push(`${company}: ${e.message}`);
      }
    })
  );

  // Priority score — prefer backend/infra/platform
  const PREFER_ROLES = ['backend', 'infra', 'platform', 'distributed', 'payments', 'identity', 'security', 'data engineer', 'fullstack', 'full stack', 'full-stack', 'sre'];

  function priorityScore(r) {
    const t = r.title.toLowerCase();
    if (PREFER_ROLES.some(s => t.includes(s))) return 2;     // top priority
    return 1;                                                  // neutral (frontend, sde, etc)
  }

  // Final filter for US-only remote/hybrid/onsite
  const US_LOCS = ['remote us', 'remote, us', 'united states', 'usa', 'remote, usa', 'remote', 'denton', 'tx', 'texas', 'san jose', 'san francisco', 'seattle', 'new york', 'nyc', 'chicago', 'austin', 'mountain view', 'palo alto'];
  const filtered = results.filter(r => {
    const loc = r.location.toLowerCase();
    const nonUsLocs = ['poland', 'spain', 'canada', 'india', 'uk', 'germany', 'london', 'toronto', 'vancouver', 'madrid', 'berlin', 'warsaw', 'denmark', 'aarhus', 'amsterdam', 'dublin', 'ireland', 'europe', 'asia', 'apac', 'emea', 'tokyo', 'singapore', 'sydney'];
    const isNonUs = nonUsLocs.some(n => loc.includes(n));
    const isUsKeyword = US_LOCS.some(u => loc.includes(u)) || loc === '';
    return !isNonUs && isUsKeyword;
  });

  // Sort by priority before dedup so best roles survive
  filtered.sort((a, b) => priorityScore(b) - priorityScore(a));

  // Deduplicate: max 5 distinct base roles per company
  const seen = {};
  const deduped = [];
  for (const r of filtered) {
    const key = r.company;
    if (!seen[key]) seen[key] = [];
    // Normalize: strip team name in parens to detect true duplicates
    const baseTitle = r.title.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
    if (!seen[key].includes(baseTitle)) {
      seen[key].push(baseTitle);
      if (seen[key].length <= 10) deduped.push(r);
    }
  }
  const unique = deduped;

  // Sort by company
  unique.sort((a, b) => a.company.localeCompare(b.company));

  // Write to pipeline.md
  const header = 'URL\tCompany\tTitle\tLocation\tResume\n';
  const rows   = unique.map(r => `${r.url}\t${r.company}\t${r.title}\t${r.location}\t`).join('\n');
  writeFileSync('data/pipeline.md', header + rows + '\n');

  console.log(`\n✅ Done. ${unique.length} roles (deduped) → data/pipeline.md`);
  if (errors.length) console.log(`⚠️  Errors: ${errors.join(', ')}`);
}

main().catch(console.error);
