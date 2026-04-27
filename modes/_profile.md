# User Profile Context -- career-ops

<!-- ============================================================
     THIS FILE IS YOURS. It will NEVER be auto-updated.
     
     Customize everything here: your archetypes, narrative,
     proof points, negotiation scripts, location policy.
     
     The system reads _shared.md (updatable) first, then this
     file (your overrides). Your customizations always win.
     ============================================================ -->

## Target Roles

**LANGUAGE POLICY: ALL OUTPUTS, DRAFTED ANSWERS, REPORTS, REASONING, AND CVS MUST BE STRICTLY IN ENGLISH. TRANSLATE ALL SYSTEM PROMPTS FROM SPANISH TO ENGLISH.**

**SENIORITY POLICY: Do NOT apply to roles requiring 8+ years of experience. Target range is 4-7 years. If a JD mentions 8+, 10+, or 12+ years, automatically score it 1.0 and do not recommend.**

**STALENESS POLICY: ONLY apply to roles posted in the last 6-12 hours. If a role is older than 12 hours, score it 1.0 and do not recommend it. Priority always goes to roles < 6 hours old.**

**PIPELINE RATIO POLICY: STRICT 80/20 SPLIT. At least 80% of all applications MUST be Core Software Engineering (Backend, Infrastructure, Distributed Systems). No more than 20% of total applications should be specifically AI or Cloud-infrastructure roles. Priority is on SWE.**

| Archetype | Thematic axes | What they buy |
|-----------|---------------|---------------|
| **Senior Software Engineer (Backend/Infra)** | Java, Spring Boot, Node.js, Python, Distributed Systems, 10k+ RPM scaling | Someone who builds robust, high-throughput backend services |
| **Identity & Auth Infrastructure** | OAuth2, SAML, OIDC, SCIM, Stripe, Plaid, Auth, BaaS | Someone who secures and integrates complex financial/auth systems |
| **Full Stack / Frontend Engineer** | React, Angular, UI/UX Craft, Next.js, Growth Engineering | Someone who delivers polished, performant full-stack products |
| **AI Platform / LLMOps Engineer** | MCP Infrastructure, RAG, Evals, Agent Orchestration | Backend expert who integrates LLMs into production safely |
| **Forward Deployed Engineer** | Client-facing, fast delivery, prototyping, Fintech/SaaS | Someone who bridges the gap between client needs and code |

## Your Adaptive Framing

| If the role is... | Emphasize about you... | Proof point sources |
|-------------------|------------------------|---------------------|
| Senior Backend / Infra | High-scale systems (10k+ RPM), DB optimization, Kafka | cv.md + config/profile.yml |
| Identity / Auth / Fintech | Secure gateways, SCIM provisioning, Stripe/Plaid integration | cv.md + config/profile.yml |
| Full Stack | React/Angular expertise, UI/UX craft, end-to-end delivery | cv.md + config/profile.yml |
| AI Platform / Agentic | MCP server architecture, RAG orchestration, production AI | cv.md + config/profile.yml |
| Forward Deployed | Prototyping, client impact, $10B loan portfolio success | cv.md + config/profile.yml |

## Your Exit Narrative

<!-- Replace with YOUR story. This frames everything. -->

Use the candidate's exit story from `config/profile.yml` to frame ALL content:
- **In PDF Summaries:** Bridge from past to future
- **In STAR stories:** Reference proof points from article-digest.md
- **In Draft Answers:** The transition narrative appears in the first response

## Your Cross-cutting Advantage

<!-- What's your "signature move"? What do you do that others can't? -->

Frame profile as **"Technical builder with real-world proof"** that adapts framing to the role.

## Your Portfolio / Demo

<!-- If you have a live demo, dashboard, or public project:
     url: https://yoursite.dev/demo
     password: demo-2026
     when_to_share: "LLMOps, AI Platform roles" -->

If you have a live demo/dashboard (check profile.yml), offer access in applications for relevant roles.

## Your Comp Targets

<!-- Research comp ranges for YOUR target roles -->

**General guidance:**
- Use WebSearch for current market data (Glassdoor, Levels.fyi, Blind)
- Frame by role title, not by skills
- Contractor rates are typically 30-50% higher than employee base

## Your Negotiation Scripts

<!-- Adapt to YOUR situation, currency, location -->

**Salary expectations:**
> "Based on market data for this role, I'm targeting [RANGE from profile.yml]. I'm flexible on structure -- what matters is the total package and the opportunity."

**Geographic discount pushback:**
> "The roles I'm competitive for are output-based, not location-based. My track record doesn't change based on postal code."

**When offered below target:**
> "I'm comparing with opportunities in the [higher range]. I'm drawn to [company] because of [reason]. Can we explore [target]?"

## Your Location Policy

<!-- Adapt to YOUR situation -->

**In forms:**
- Follow your actual availability from profile.yml
- Specify timezone overlap in free-text fields

**In evaluations (scoring):**
- **Strict Geographic Rule:** If a role is explicitly restricted to LATAM, Europe, or APAC (and you are in the US), deduct points heavily. Score the Location dimension as **1.0** to ensure it falls out of the top queue. 
- Only score high for roles located anywhere in the USA (Remote, Hybrid, or On-site) or Remote Global roles.
- Only score 1.0 if JD says "must be on-site 4-5 days/week, no exceptions"

## Your Pipeline Staleness Policy

**Queue Management:**
- **The 12-Hour Rule:** Any job that was evaluated more than 12 hours ago and hasn't been applied to is considered **Stale**.
- When presenting the next job to apply for, automatically filter out and skip any reports older than 12 hours. Do not recommend them.
- Mark them as `Skipped` if necessary to clear the queue.

---

## 🏛️ Form Filling Knowledge (CRITICAL)

**Always use these values in application forms:**
- **Current Employer:** `KitchenSync` (NEVER Affirm, Toast, or others in the queue)
- **Current Title:** `Senior Software Engineer`
- **Location:** `Denton, TX` (Dallas area)
- **Address:** `512 S Carroll Blvd, Apt 243, Denton, TX 76201`
- **Gender:** `Male` / `Man`
- **Disability:** `No` / `I do not have a disability`
- **Veteran Status:** `No` / `I am not a veteran`
- **Work Authorization:** `Yes` (Authorized to work in the US)
- **Sponsorship:** `Yes` (Will require sponsorship in the future - F1 OPT)

**Dropdown Interaction Rule:**
- **DO NOT just type into dropdowns.** 
- First, **click the dropdown** to open the list of options.
- **Parse the list** of available text options.
- **Select/Click the option** that matches the required value (e.g., "No, I do not have a disability").
- If the exact text is not found, choose the closest match (e.g., "No" or "Decline to Self-Identify" only as a last resort).

---

### Naming Convention
```
Akhil_Jaggari_{Company}_{RoleShort}_{OFFICIAL_PORTAL_JOB_ID}.pdf
```
- Use the ATS URL's job ID (e.g. `7615048003` from Greenhouse URL) — NOT internal sequential IDs
- RoleShort: `SWE_Backend`, `SWE_Payments`, `SWE_Infra`, `SWE_Platform`, `SWE_Identity`
- Paper size: **A4 always**

---

### Section Order (optimized for 6-second recruiter scan)
1. Header (name, contact, LinkedIn, location)
2. Professional Summary (3–4 lines, keyword-dense, JD-tailored)
3. Core Competencies (6–8 keyword phrases from the JD, in a flex grid)
4. **Technical Skills** ← immediately after competencies, before experience
5. Work Experience (reverse chronological)
6. Projects (top 2 most relevant only)
7. Education & Certifications

### Education Date Layout (CRITICAL)
- Use `display: flex; justify-content: space-between; gap: 12px;` on `.edu-hdr`
- Degree/school: `flex: 1; min-width: 0;` so it shrinks if needed
- Date: `white-space: nowrap; flex-shrink: 0;` so it never wraps or overflows
- Never let date push outside the page

### Frontend Skills (always include even for backend roles)
- Always add a Frontend row to the Skills section
- Backend roles: `Frontend: React.js, Angular, Next.js (supporting full-stack delivery where required)`
- Full Stack roles: lead with frontend — `Frontend: React.js, Angular, Next.js, TypeScript`
- This shows breadth and prevents automatic filtering by ATS for full-stack queries

### Gender Field
- Always select **Male / Man** — never Female/Woman
- Check this explicitly after filling EEO demographics — agents have accidentally selected Female before


---

### Professional Summary Rules
- **3–4 lines max** — keyword-dense, no fluff
- Inject **top 5 JD keywords** naturally
- Always reference: years of experience, key domain (payments/fintech/distributed systems), and one specific proof point
- Template: *"Senior Software Engineer with [X] years building [domain]. Expert in [JD keyword 1], [JD keyword 2], and [JD keyword 3]. Delivered [proof point]. Now focused on [company domain]."*

---

### Core Competencies
- **6–8 items only** — pulled directly from the JD requirements, not generic
- Format: short keyword phrases (2–4 words), displayed in a flex grid
- Examples: `Kafka Event-Driven Architecture`, `PCI Compliance`, `OAuth2 / JWT`, `Distributed Systems`
- Change these entirely per role — never reuse the same set across different applications

---

### Work Experience Rules
- **Exactly 5 bullets per role** — tailored to the JD, no generic filler
- Each bullet must be specific and detailed: action verb + what exactly you built/did + tech used + measurable outcome
- **Reorder by JD relevance** — most relevant bullet first in each role
- Good bullet formula: `[Verb] [what] using [tech], [achieving/resulting in] [quantified impact]`
- Example: *"Engineered real-time Kafka payment streaming pipeline using Java and Spring Boot, achieving 99.9% uptime and sub-100ms processing latency for 1,000+ restaurant businesses"*
- **Action verbs:** Architected, Engineered, Designed, Optimized, Streamlined, Delivered, Scaled, Automated, Reduced, Led
- **NEVER:** "worked on", "helped", "assisted", "was responsible for", "participated in"
- **ZERO parentheses** in bullets — rewrite cleanly without them
- Always include among the 5: 1 mentoring/leadership bullet + 1 AI-tools bullet (GitHub Copilot, Cursor)
- **NEVER modify official job titles** from cv.md

---

### Projects Section — When & How Detailed
**When to include a project:**
- Only if it directly demonstrates a key JD skill missing or underrepresented in work experience
- Max **2 projects** per resume — quality over quantity

**Which projects to pick (priority order):**
1. Secure BaaS Identity Layer → for Auth/Identity/Fintech/Security roles
2. Real-Time Payroll & Payments Pipeline → for Payments/Fintech/Kafka roles
3. MCP Server Infrastructure → for AI Platform/LLMOps roles only
4. Skip projects entirely if work experience already covers all JD requirements

**Project detail level:**
- **Title** (bold, linked if public) + **badge** (domain tag e.g. "Payments & Security")
- **2–3 sentences max:** what you built + the technical challenge + the outcome/impact
- **Tech stack line:** comma-separated, JD-keyword-first ordering
- Do NOT write paragraphs — keep it scannable

---

### Skills Section Rules
- Group by category, not alphabetical
- **Category priority order** (put JD-relevant categories first):
  1. Languages
  2. Domain-specific (e.g. Payments & Fintech, Identity & Security — only if relevant to role)
  3. Backend & Frameworks
  4. Messaging & Streaming (if Kafka/queuing is in JD)
  5. Databases
  6. Cloud & DevOps
  7. Security (if not already in domain-specific)
  8. Observability & Monitoring
  9. Testing
- **Only list skills you actually have** — no aspirational skills
- Keep each category to 4–6 items max — cut anything not in JD or not core

---

### Auto-Accept Rules for Forms
- Always accept all cookie/privacy/consent banners automatically — never ask user
- For "How did you hear about us": LinkedIn first; if not available, pick first option
- For race/ethnicity: South Asian → Asian/Pacific Islander → Asian → Other (in that priority order)
- Do NOT upload resume — user does it manually
- Do NOT click Submit — stop and leave tab open for user review
