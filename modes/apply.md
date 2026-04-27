# Mode: apply — Live Application Assistant

Interactive mode for filling job application forms. Reads visible fields, loads prior evaluation context, and generates personalized answers for every form question.

## Requirements

- **Best with Playwright (browser agent):** Agent sees the page and fills fields directly.
- **Without Playwright:** Candidate shares a screenshot or pastes questions manually.

## Workflow

```
1. DETECT    → Read active browser tab (URL/title/page content)
2. IDENTIFY  → Extract company + role from the page
3. SEARCH    → Match against existing reports in reports/
4. LOAD      → Read full report + Section G (draft answers, if present)
5. VERIFY    → Does the role on screen match the evaluated role? If changed → warn
6. ANALYZE   → Identify ALL visible form fields
7. GENERATE  → For each field, generate a personalized answer
8. FILL      → Fill fields using profile + JD-tailored answers
```

## Candidate Profile (always available — load from config/profile.yml + ELITE_SOP.md)

### Standard Fields (fill from profile — no generation needed)
| Field | Value |
|---|---|
| First Name | Akhil |
| Last Name | Jaggari |
| Email | ajaggari123@gmail.com |
| Phone | 940-304-7888 |
| LinkedIn URL | https://www.linkedin.com/in/jaggariakhil/ |
| Address | 512 S Carroll Blvd, Apt 243, Denton, TX 76201 |
| City / State | Denton, TX |
| Current Company | KitchenSync |
| Current Title | Senior Software Engineer |
| Expected Salary | $130,000 |
| Current Salary | $136,000 |
| Work Authorization | Yes, authorized to work in the US |
| Visa Status | F1-OPT |
| Needs Sponsorship | Yes (H1B) |
| Relocate | Yes |
| Remote/Hybrid/Onsite | Yes to all |
| Start Date | Immediately / 2 weeks |
| Education | M.S. Computer Science, University of North Texas, May 2025, GPA 4.0 |
| Years of Experience | 5 |

### EEO / Demographics (fill exactly as specified)
| Field | Value |
|---|---|
| Gender | **Male / Man** (NEVER Female) |
| Hispanic/Latino | No |
| Race/Ethnicity | South Asian → Asian/Pacific Islander → Asian → Other (first available) |
| Veteran | Not a veteran / I am not a protected veteran |
| Disability | No / I do not have a disability |
| How did you hear | LinkedIn (if available), else first dropdown option |

### Resume / Cover Letter Upload
- **NEVER upload resume or cover letter** — user handles manually
- Skip all upload fields

## Step 1 — Detect the Offer

Navigate to the application URL. Read title, URL, and visible content.

If a report exists in `reports/` for this company → load it.
If no report → use JD content from the page + cv.md as context.

## Step 2 — Analyze All Form Fields

Identify every visible field:
- **Standard fields** → fill from candidate profile above (no generation needed)
- **Free-text fields** (why this role, what excites you, tell us about yourself) → generate tailored answer
- **Dropdowns** → select correct value per profile rules above
- **Yes/No fields** → answer per profile rules above
- **Salary fields** → $130,000 expected
- **Checkboxes** → check as applicable
- **Upload fields** → SKIP

## Step 3 — Generate Free-Text Answers

For every free-text question not covered by standard profile data, generate a tailored answer using:

1. **JD keywords**: From the job description visible on the page
2. **Report Section G**: If a report exists in reports/ for this company
3. **Proof points** (always available):
   - "Architected real-time Kafka payment pipelines for 1,000+ restaurant businesses with 99.9% uptime" (KitchenSync)
   - "$10B+ loan portfolio backend infrastructure" (Berkadia)
   - "10k+ RPM tokenized payment engine" (Accenture)
   - "45% latency reduction on identity services" (Accenture)
   - "Mentored 5 engineers, 20% delivery velocity improvement" (KitchenSync)
4. **Tone**: Confident, specific, "I'm choosing you because..." framing. Never generic.
5. **Length**: 2-4 sentences for short fields, 150-300 words for essay fields

### Common Free-Text Templates

**"Why this company / Why this role?"**
> I'm drawn to [Company] because [specific product/mission from JD]. My experience building [most relevant proof point] maps directly to [JD requirement]. I want to work on infrastructure that [company's core mission] — that's the kind of scale and impact I'm actively seeking.

**"Tell us about yourself / Professional summary"**
> Senior Software Engineer with 5 years building [JD domain — payments / distributed systems / fintech]. At KitchenSync I [most relevant proof point]. Previously at Berkadia I delivered $10B+ in financial infrastructure. I specialize in [top 2 JD keywords] and I'm excited to bring that experience to [Company]'s [team/product].

**"What are your strengths?"**
> I excel at translating complex distributed systems requirements into reliable, scalable production code. At Accenture I improved service throughput by 45% by migrating monoliths to microservices. I'm also strong at cross-functional delivery — I've collaborated with Product, Design, and Analytics teams to ship payment systems that directly impact business revenue.

**"Salary expectations?"**
> $130,000 base. Open to discussing total compensation.

## Step 4 — Fill and Verify

1. Fill all fields
2. Scroll through entire form to catch hidden sections
3. Accept any cookie/consent banners immediately
4. **STOP before Submit** — leave tab open for user to review and attach resume
5. Report all fields filled and their values

## Step 5 — Post-Apply (after user confirms submission)

1. Update `data/applications.md` status from "Evaluated" → "Applied" (via TSV + merge-tracker.mjs)
2. Update report Section G with final answers used
3. Suggest next step: LinkedIn outreach to hiring manager

## Critical Rules
- **NEVER submit** without user confirmation
- **NEVER upload** resume or cover letter — user does it manually
- **Always accept** all cookie/consent/privacy banners immediately
- **Gender = Male/Man** always — double-check after filling EEO section
- **Last Name = Jaggari only** — never append LinkedIn URL or any other text
- Scroll through ALL sections of form — don't miss hidden fields below the fold
