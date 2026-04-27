# ELITE_SOP — Elite Application Sprint
> Give this file to any agent at the start of every session. This is the master directive.
> Last updated: 2026-04-26 | All learnings from live session captured here.

> [!CAUTION]
> **NEVER use the browser agent to discover or search for jobs.** This is slow, unreliable, and violates project rules. Always use `node flash-fetch.mjs` (API-based) and `node scan.mjs` (Search-based) for discovery.

---

## ⚡ Step 1: Fetch Jobs (NO BROWSER — use APIs)

### Fast fetch (target companies only)
```bash
node flash-fetch.mjs
```
- Hits Greenhouse + Lever + Ashby APIs directly for 27 verified target companies
- Smart dedup: prefers Backend/Infra/Payments roles over Manager/Android/Mobile
- Filters to US-only, Remote roles
- Outputs to `data/pipeline.md` with columns: URL | Company | Title | Location | Resume
- Takes ~5 seconds

### Broad fetch (90+ companies including Stripe, Pinterest, IBM, Goldman etc.)
```bash
node scan.mjs
```
- Uses `portals.yml` — 90 companies via Greenhouse/Ashby/Lever APIs
- Also runs targeted search queries for Workday companies (Amazon, Uber, Microsoft, Google, etc.)
- Appends results to `data/pipeline.md` in markdown checklist format
- Takes longer but covers far more companies

### Combined (recommended every session)
```bash
node flash-fetch.mjs && node scan.mjs
```

### Why some companies are missing
- **Workday companies** (Amazon, Uber, Microsoft, Google, Meta, JPMorgan, Oracle, BofA, Wells Fargo, etc.) have **no public API** — `scan.mjs` covers them via search queries
- For Workday companies, use `search_queries` in `portals.yml` or manual portal visits

---

## 📊 Step 2: Score & Filter
> **CRITICAL:** You must complete scoring for the entire pipeline before moving to Step 3. We only apply to the highest-scoring roles (4.2+).

```bash
node score-and-update.mjs      # Automated: Scores all pending roles in pipeline.md
node gemini-eval.mjs <url>     # Single role evaluation
```
- Threshold: **4.2+ only** → proceed to resume
- **80/20 rule:** max 20% AI/cloud, 80% core SWE/Backend
- Reports saved to `reports/NNN-company-YYYY-MM-DD.md`
- **Gemini API rate limits:** The script handles 503 errors with a 60s cooldown.
- After each batch: `node merge-tracker.mjs`

**US Filter (apply manually if needed):**
```bash
grep -i "remote us\|united states\|usa\|remote, us" data/pipeline.md | grep -iv "manager\|android\|ios\|mobile\|principal\|staff\|director\|canada\|india\|uk\|spain\|poland\|denmark"
```

---

## 📄 Step 3: Generate Tailored Resume (per role) — PROPER FLOW

> **Read `modes/pdf.md` + `modes/_profile.md` before generating. Do NOT copy the same HTML for every role.**

```bash
# 1. Read cv.md + JD keywords from report → build tailored HTML
# 2. Save tailored HTML to output/cv-akhil-jaggari-{company}.html
# 3. Generate A4 PDF
node generate-pdf.mjs output/cv-akhil-jaggari-{company}.html \
  "output/Akhil_Jaggari_{Company}_{RoleShort}_{PORTAL_JOB_ID}.pdf"

# 4. Update Resume column in data/pipeline.md for that URL row
```

### Naming Convention
```
Akhil_Jaggari_{Company}_{RoleShort}_{PORTAL_JOB_ID}.pdf
```
- `PORTAL_JOB_ID` = numeric ID from ATS URL (e.g. `7615048003` from Greenhouse, `7737241` from Stripe)
- `RoleShort`: `SWE_Backend`, `SWE_Payments`, `SWE_Infra`, `SWE_Platform`, `SWE_Identity`
- Paper size: **A4 always** (never Letter)

### What "tailored" means (from `modes/_profile.md`)
- **Summary:** Rewrite with top 5 JD keywords + proof point (see Key Proof Points below)
- **Competencies:** 6–8 keyword phrases from THE JD (change every time)
- **Experience:** Exactly **5 bullets per role**, reordered by JD relevance
- **Projects:** Top 2 relevant only — see `modes/_profile.md` for which to pick
- **Skills:** JD-relevant categories first, 4–6 items each
- Source of truth: `cv.md` — never hardcode metrics

---

## 🌐 Step 4: Apply (BROWSER — NEW TAB PER JOB)

> **Read `modes/apply.md` before filling any form.** It is the single source of truth for all form-filling logic, candidate profile answers, EEO rules, and free-text answer templates.

### Quick Rules (full detail in modes/apply.md)
- Open a **NEW TAB** per application
- Navigate directly to the verified URL
- **Auto-accept all cookies/consent banners** — never ask user
- Fill ALL standard fields from the candidate profile in `modes/apply.md`
- Generate tailored free-text answers using JD keywords + proof points from `modes/apply.md`
- If a report exists in `reports/` → use Section G for pre-drafted answers
- **DO NOT upload resume** — user attaches manually
- **DO NOT click Submit** — stop and leave tab open for user review
- **Gender = Male/Man always** — double-check EEO section after filling
- **Last Name = Jaggari only** — never append LinkedIn URL
- Add tracker entry: write TSV to `batch/tracker-additions/` → `node merge-tracker.mjs`

---

## 👤 Candidate Profile (Form Memory)

### Personal
| Field | Value |
|---|---|
| Full Name | Akhil Jaggari |
| Email | ajaggari123@gmail.com |
| Phone | 940-304-7888 |
| LinkedIn | https://www.linkedin.com/in/jaggariakhil/ |
| Current Company | KitchenSync |
| Address | 512 S Carroll Blvd, Apt 243, Denton, TX 76201 |
| City / State / Zip | Denton, TX, 76201 |

### Work History (for "Have you worked here?" questions)
- KitchenSync (current)
- Berkadia
- Accenture
- University of North Texas (student)
- Answer "No" for all other companies

### Visa & Legal
| Field | Value |
|---|---|
| Visa Status | F1-OPT |
| Sponsorship needed | Yes (H1B) |
| Authorized to work in US | Yes |
| US Citizen / PR | No |
| Convicted felon | No |
| Over 18 | Yes |

### Compensation
| Field | Value |
|---|---|
| Expected salary | $130,000 |
| Current salary | $136,000 |
| Hourly rate | $70/hr |

### Availability
| Field | Value |
|---|---|
| Start date | Immediately |
| Notice period | None |
| Currently employed | Yes |
| Full time | Yes |
| Travel | Yes, 100% |
| Relocate | Yes, anywhere in USA |
| Remote/Hybrid/Onsite | Yes to all |
| Timezone | CST (open to any US timezone) |

### Demographics (EEO)
| Field | Value |
|---|---|
| Gender | Male |
| Hispanic/Latino | No |
| Race | **South Asian → Asian/Pacific Islander → Asian → Other** (pick first available in dropdown) |
| Veteran status | Not a veteran |
| Disability | No |
| How did you hear about us | **LinkedIn** (if in dropdown), else pick first available option |

### Education
| Field | Value |
|---|---|
| Highest degree | Masters / Postgraduate |
| Field | Computer Science / Engineering |
| University | University of North Texas |
| Graduation | May 2025 |
| GPA | 4.0/4.0 |
| Pursuing degree | No |

### Certifications
- AWS Certified Data Engineer – Associate
- AWS Certified Developer – Associate
- Microsoft Azure Fundamentals (AZ-900)

### Experience (years sliders)
| Skill | Years |
|---|---|
| Java, Python, JavaScript, Node.js | 5 |
| AWS / GCP / Azure | 5 |
| Microservices / Distributed Systems | 5 |
| REST APIs / GraphQL | 5 |
| Docker / Kubernetes | 5 |
| CI/CD pipelines | 5 |
| PostgreSQL / MySQL / MongoDB | 5 |
| Kafka / Event-driven | 5 |
| System design | 4 |
| ML / AI / ETL | 3 |
| Testing (unit/integration/e2e) | 5 |
| Open source contributions | No |
| GitHub profile to share | No |

---

## 🎯 Key Proof Points (always available for resume tailoring)
- "Payroll Integration for 1,000+ restaurant businesses" (KitchenSync)
- "$10B loan portfolio backend infrastructure" (Berkadia)
- "10k+ RPM tokenized payment engine" (Accenture)
- "99.9% uptime on real-time Kafka pipelines" (KitchenSync)
- "45% latency reduction on identity services" (Accenture)
- "20% MTTR reduction via Splunk/Grafana observability" (Accenture)
- "Mentored 5 engineers, 20% delivery velocity improvement" (KitchenSync)

---

## 🏢 Target Companies

### API-accessible (Greenhouse/Lever/Ashby — flash-fetch works)
| Company | Slug | Board |
|---|---|---|
| Affirm | affirm | Greenhouse |
| Adobe | adobe | Greenhouse |
| Apple | apple | Greenhouse |
| Atlassian | atlassian | Greenhouse |
| Capital One | capitalone | Greenhouse |
| Databricks | databricks | Greenhouse |
| DoorDash | doordash | Greenhouse |
| Expedia Group | expedia | Greenhouse |
| Goldman Sachs | goldmansachs | Greenhouse |
| IBM | ibm | Greenhouse |
| Intuit | intuit | Greenhouse |
| Palo Alto Networks | paloaltonetworks | Greenhouse |
| PayPal | paypal | Greenhouse |
| Paycom | paycom | Greenhouse |
| Pinterest | pinterest | Greenhouse |
| Qualtrics | qualtrics | Greenhouse |
| Salesforce | salesforce | Greenhouse |
| Snowflake | snowflake-computing | Greenhouse |
| Stripe | stripe | Greenhouse |
| Synchrony | synchrony | Greenhouse |
| Toast | toast | Greenhouse |
| Walmart | walmart | Greenhouse |
| LinkedIn | linkedin | Lever |
| Palantir | palantir | Lever |
| Twilio | twilio | Lever |
| Hugging Face | huggingface | Ashby |
| Rollfi | rollfi | Ashby |

### Manual portals (Workday / custom — scan.mjs uses search queries for these)
Amazon · Uber · Meta · Microsoft · Google · Apple (careers) · JPMorganChase · Wells Fargo · Bank of America · Oracle · Cognizant · Fannie Mae · Freddie Mac · FedEx · GM Financial · HCLTech · Infosys · McKesson · MetLife · Optum · PepsiCo · Priority · Qualcomm · UnitedHealth Group · Amdocs · Cardinal Health

---

## 🔧 Process Rules
1. **NEVER** use browser agent to discover/search jobs — use `flash-fetch.mjs` + `scan.mjs`
2. **ALWAYS** run both fetchers for maximum coverage
3. **ALWAYS** verify link is live before generating resume
4. **ALWAYS** open a NEW TAB per application
5. **NEVER** click Submit — stop for user review
6. **NEVER** upload resume — user does it manually
7. **NEVER** add directly to `applications.md` — write TSV to `batch/tracker-additions/` + `node merge-tracker.mjs`
8. Resume paper size: **A4 always**
9. **Gemini 503 rate limit:** wait 60s and retry one at a time
10. **Last Name field:** last name only — never append LinkedIn URL
11. **Race dropdown:** South Asian → Asian/Pacific Islander → Asian → Other
12. **How did you hear:** LinkedIn first, else first available option
13. Update this SOP + `modes/_profile.md` + `config/profile.yml` whenever new form answers are learned
