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
  'Adyen':              ['adyen',                'greenhouse'],
  'Affirm':             ['affirm',               'greenhouse'],
  'Airbnb':             ['airbnb',               'greenhouse'],
  'Algolia':            ['algolia',              'greenhouse'],
  'Alloy':              ['alloy',                'greenhouse'],
  'Amplitude':          ['amplitude',            'greenhouse'],
  'Anthropic':          ['anthropic',            'greenhouse'],
  'Apollo':             ['apollo',               'greenhouse'],
  'Arize AI':           ['arizeai',              'greenhouse'],
  'Asana':              ['asana',                'greenhouse'],
  'AssemblyAI':         ['assemblyai',           'greenhouse'],
  'Atlassian':          ['atlassian',            'greenhouse'],
  'Better.com':         ['better',               'greenhouse'],
  'Bitwarden':          ['bitwarden',            'greenhouse'],
  'Box':                ['box',                  'greenhouse'],
  'Brex':               ['brex',                 'greenhouse'],
  'Buildkite':          ['buildkite',            'greenhouse'],
  'Calendly':           ['calendly',             'greenhouse'],
  'Canva':              ['canva',                'greenhouse'],
  'Carta':              ['carta',                'greenhouse'],
  'Chime':              ['chime',                'greenhouse'],
  'Clarity AI':         ['clarityai',            'greenhouse'],
  'Cloudflare':         ['cloudflare',           'greenhouse'],
  'CockroachLabs':      ['cockroachlabs',        'greenhouse'],
  'Coalition':          ['coalition',            'greenhouse'],
  'Coinbase':           ['coinbase',             'greenhouse'],
  'Compass':            ['compass',              'greenhouse'],
  'Confluent':          ['confluent',            'greenhouse'],
  'CoreWeave':          ['coreweave',            'greenhouse'],
  'Coursera':           ['coursera',             'greenhouse'],
  'Cresta':             ['cresta',               'greenhouse'],
  'Dashlane':           ['dashlane',             'greenhouse'],
  'Databricks':         ['databricks',           'greenhouse'],
  'Datadog':            ['datadog',              'greenhouse'],
  'Dialpad':            ['dialpad',              'greenhouse'],
  'Discord':            ['discord',              'greenhouse'],
  'DocuSign':           ['docusign',             'greenhouse'],
  'DoorDash':           ['doordash',             'greenhouse'],
  'DraftKings':         ['draftkings',           'greenhouse'],
  'Dropbox':            ['dropbox',              'greenhouse'],
  'Duolingo':           ['duolingo',             'greenhouse'],
  'Elastic':            ['elastic',              'greenhouse'],
  'Epic Games':         ['epicgames',            'greenhouse'],
  'Expedia Group':      ['expedia',              'greenhouse'],
  'Faire':              ['faire',                'greenhouse'],
  'FanDuel':            ['fanduel',              'greenhouse'],
  'Figma':              ['figma',                'greenhouse'],
  'Fireblocks':         ['fireblocks',           'greenhouse'],
  'Five9':              ['five9',                'greenhouse'],
  'Fivetran':           ['fivetran',             'greenhouse'],
  'Flexport':           ['flexport',             'greenhouse'],
  'Gemini':             ['gemini',               'greenhouse'],
  'Ginkgo Bioworks':    ['ginkgobioworks',       'greenhouse'],
  'Glean':              ['gleanwork',            'greenhouse'],
  'GoCardless':         ['gocardless',           'greenhouse'],
  'Gong':               ['gong',                 'greenhouse'],
  'Grafana Labs':       ['grafanalabs',          'greenhouse'],
  'Guild':              ['guild',                'greenhouse'],
  'Gusto':              ['gusto',                'greenhouse'],
  'HashiCorp':          ['hashicorp',            'greenhouse'],
  'HubSpot':            ['hubspot',              'greenhouse'],
  'Hume AI':            ['humeai',               'greenhouse'],
  'Instacart':          ['instacart',            'greenhouse'],
  'Intercom':           ['intercom',             'greenhouse'],
  'Intuit':             ['intuit',               'greenhouse'],
  'Klaviyo':            ['klaviyo',              'greenhouse'],
  'Kraken':             ['kraken',               'greenhouse'],
  'Lattice':            ['lattice',              'greenhouse'],
  'LaunchDarkly':       ['launchdarkly',         'greenhouse'],
  'LivePerson':         ['liveperson',           'greenhouse'],
  'Lucid Motors':       ['lucidmotors',          'greenhouse'],
  'Marqeta':            ['marqeta',              'greenhouse'],
  'Maven':              ['maven',                'greenhouse'],
  'Mercury':            ['mercury',              'greenhouse'],
  'Miro':               ['miro',                 'greenhouse'],
  'Mixpanel':           ['mixpanel',             'greenhouse'],
  'MongoDB':            ['mongodb',              'greenhouse'],
  'Navan':              ['tripactions',          'greenhouse'],
  'Neo4j':              ['neo4j',                'greenhouse'],
  'Netlify':            ['netlify',              'greenhouse'],
  'Netskope':           ['netskope',             'greenhouse'],
  'New Relic':          ['newrelic',             'greenhouse'],
  'NICE':               ['nice',                 'greenhouse'],
  'Nuro':               ['nuro',                 'greenhouse'],
  'OKX':                ['okx',                  'greenhouse'],
  'Okta':               ['okta',                 'greenhouse'],
  'Ooma':               ['ooma',                 'greenhouse'],
  'Opendoor':           ['opendoor',             'greenhouse'],
  'Oscar Health':       ['oscar',                'greenhouse'],
  'Oura':               ['oura',                 'greenhouse'],
  'Palo Alto Networks': ['paloaltonetworks',     'greenhouse'],
  'Parloa':             ['parloa',               'greenhouse'],
  'Pendo':              ['pendo',                'greenhouse'],
  'Pinterest':          ['pinterest',            'greenhouse'],
  'Plaid':              ['plaid',                'greenhouse'],
  'PlanetScale':        ['planetscale',          'greenhouse'],
  'PolyAI':             ['polyai',               'greenhouse'],
  'Project44':          ['project44',            'greenhouse'],
  'Qualtrics':          ['qualtrics',            'greenhouse'],
  'Quora':              ['quora',                'greenhouse'],
  'Ramp':               ['ramp',                 'greenhouse'],
  'Reddit':             ['reddit',               'greenhouse'],
  'RingDNA':            ['ringdna',              'greenhouse'],
  'Riot Games':         ['riotgames',            'greenhouse'],
  'Rippling':           ['rippling',             'greenhouse'],
  'Roblox':             ['roblox',               'greenhouse'],
  'Robinhood':          ['robinhood',            'greenhouse'],
  'Rubrik':             ['rubrik',               'greenhouse'],
  'Samsara':            ['samsara',              'greenhouse'],
  'Scale AI':           ['scaleai',              'greenhouse'],
  'Sezzle':             ['sezzle',               'greenhouse'],
  'Slack':              ['slack',                'greenhouse'],
  'Smartsheet':         ['smartsheet',           'greenhouse'],
  'Snap':               ['snapchat',             'greenhouse'],
  'Snowflake':          ['snowflake-computing',  'greenhouse'],
  'Snyk':               ['snyk',                 'greenhouse'],
  'SoFi':               ['sofi',                 'greenhouse'],
  'SpaceX':             ['spacex',               'greenhouse'],
  'Speechmatics':       ['speechmatics',         'greenhouse'],
  'Splunk':             ['splunk',               'greenhouse'],
  'Squarespace':        ['squarespace',          'greenhouse'],
  'Stitch Fix':         ['stitchfix',            'greenhouse'],
  'StockX':             ['stockx',               'greenhouse'],
  'Stripe':             ['stripe',               'greenhouse'],
  'Sumo Logic':         ['sumologic',            'greenhouse'],
  'Tailscale':          ['tailscale',            'greenhouse'],
  'Tanium':             ['tanium',               'greenhouse'],
  'ThoughtSpot':        ['thoughtspot',          'greenhouse'],
  'Thumbtack':          ['thumbtack',            'greenhouse'],
  'Toast':              ['toast',                'greenhouse'],
  'Together AI':        ['togetherai',           'greenhouse'],
  'TrueLayer':          ['truelayer',            'greenhouse'],
  'Turo':               ['turo',                 'greenhouse'],
  'Typeform':           ['typeform',             'greenhouse'],
  'Udemy':              ['udemy',                'greenhouse'],
  'Unity':              ['unity',                'greenhouse'],
  'Upstart':            ['upstart',              'greenhouse'],
  'Vanta':              ['vanta',                'greenhouse'],
  'Vercel':             ['vercel',               'greenhouse'],
  'Walmart':            ['walmart',              'greenhouse'],
  'Waymo':              ['waymo',                'greenhouse'],
  'Wayfair':            ['wayfair',              'greenhouse'],
  'Wealthfront':        ['wealthfront',          'greenhouse'],
  'Webflow':            ['webflow',              'greenhouse'],
  'Workato':            ['workato',              'greenhouse'],
  'Yext':               ['yext',                 'greenhouse'],
  'Yugabyte':           ['yugabyte',             'greenhouse'],
  'Zendesk':            ['zendesk',              'greenhouse'],
  'Zillow':             ['zillow',               'greenhouse'],
  'Zoominfo':           ['zoominfo',             'greenhouse'],
  'Zscaler':            ['zscaler',              'greenhouse'],
  'Zwift':              ['zwift',                'greenhouse'],

  // ── WORKDAY (verified) ─────────────────────────────────────────────
  'Adobe':              ['adobe',                'workday', 'adobe.wd5.myworkdayjobs.com', 'external_experienced'],
  'Amazon':             ['amazon',               'workday', 'amazon.wd1.myworkdayjobs.com', 'External'],
  'Capital One':        ['capitalone',           'workday', 'capitalone.wd12.myworkdayjobs.com', 'Capital_One'],
  'Freddie Mac':        ['freddiemac',           'workday', 'freddiemac.wd5.myworkdayjobs.com', 'External'],
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
  'Ro':                 ['ro',                   'lever'],
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

  // Off-stack / not interested — mirrors portals.yml negatives
  const offStack = [
    'android', 'ios', 'mobile', '.net', 'php', 'ruby', 'rust',
    'embedded', 'firmware', 'fpga', 'asic', 'hardware',
    'blockchain', 'web3', 'crypto', 'game', 'unity', 'unreal',
    'salesforce admin', 'sap ', 'oracle ebs', 'mainframe', 'cobol',
    'research scientist', 'research engineer', 'applied scientist',
    'developer advocate', 'devrel',
    'product manager', 'technical pm', 'gtm engineer', 'revops', 'business systems'
  ];
  if (offStack.some(s => t.includes(s))) return false;

  // Skip non-US locations even if they say 'remote'
  const nonUsLocs = ['poland', 'spain', 'canada', 'india', 'uk', 'germany', 'london', 'toronto', 'vancouver', 'madrid', 'berlin', 'warsaw', 'taipei', 'taiwan', 'tokyo', 'japan', 'singapore', 'sydney', 'amsterdam', 'dublin', 'ireland', 'remote spain', 'remote poland', 'remote canada'];
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

  // Dedup: max 2 entries per (company, base role); max 10 distinct roles per company
  const titleCount = {};    // {company: {baseTitle: count}}
  const distinctRoles = {}; // {company: distinct-role-count}
  const deduped = [];
  for (const r of filtered) {
    const baseTitle = r.title.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
    if (!titleCount[r.company]) titleCount[r.company] = {};
    const seenCount = titleCount[r.company][baseTitle] || 0;
    if (seenCount >= 2) continue;                                    // cap same role at 2
    if (seenCount === 0) {                                           // first time: count toward role cap
      if ((distinctRoles[r.company] || 0) >= 10) continue;
      distinctRoles[r.company] = (distinctRoles[r.company] || 0) + 1;
    }
    titleCount[r.company][baseTitle] = seenCount + 1;
    deduped.push(r);
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
