# Article Digest — KitchenSync Project Detail
> Detailed proof-point library for resume tailoring, cover letters, and STAR stories.
> Pull from this when a JD mentions any matching domain or technology.
> Source of truth — DO NOT invent metrics; pull only what is documented here or in cv.md.

---

## Quick Index — Which Project to Pick by JD Keyword

| JD signals | Pull from |
|---|---|
| Payroll, payroll processing, tax compliance, KYB/KYC, multi-tenant SaaS, RPC API integration | **Rollfi Payroll** |
| ACH, wire transfers, BaaS, Plaid, Stripe Financial Connections, banking, debit cards, virtual cards | **Banking — Passport** |
| Cash flow, forecasting, reserve management, AP automation, derived data models | **Banking — Cash Flow Engine** |
| Webhooks, event-driven, polling fallback, idempotency | **Both — webhook patterns** |
| Jurisdiction logic, compliance, multi-state regulations | **Rollfi — Jurisdiction Engine** |
| QuickBooks, OAuth refresh, multi-environment, period reconciliation | **Banking — QBO Integration** |

---

# 🟦 Rollfi Payroll System

## System Overview
Full-service payroll processing platform for multi-location restaurants. Built on top of **Rollfi** as the tax and compliance processor. KitchenSync owns the entire user experience — data collection, validation, pay calculation, submission orchestration, leave management, jurisdiction-aware labor rules, and HR document generation. Rollfi handles tax withholding calculations, government filings, direct deposit execution, and compliance reporting.

The integration uses Rollfi's **RPC-style API** where every call is a POST to the same endpoint with a `method` field in the request body. Wrapped in a typed client that translates between KitchenSync's domain model and Rollfi's wire format.

## Architecture
```
KitchenSync (frontend + backend)
  ├── server/rollfi/services/api.ts            — Rollfi HTTP client (RPC-style POST)
  ├── server/rollfi/services/sync.ts           — Payroll submission, differential pay, employee sync
  ├── server/rollfi/services/onboarding-sync.ts — Auto-sync employee onboarding steps
  ├── server/rollfi/routes/connect.ts          — Company creation, KYB, bank linking
  ├── server/rollfi/routes/webhooks.ts         — KYB, KYC, employee status, payroll completion
  ├── server/rollfi/types.ts                   — All Rollfi API types
  ├── server/payroll-engine.ts                 — Pay calculation, salaried injection, labor aggregation
  ├── server/payroll-routes.ts                 — Payroll CRUD, adjustments, sick/vacation computation
  ├── server/time-off-engine.ts                — Local accrual engine (ledger-based)
  ├── server/shifts-routes.ts                  — Schedule grid (excludes salaried)
  └── shared/models/payroll/                   — Drizzle schema for payroll tables
```

## Company Onboarding (KYB Flow)
Multi-step provisioning when a restaurant is set up for payroll:

**1. New company registration** — Collect business details (EIN, legal name, address, entity type) via implementation wizard. Call `createBusiness` to register the employer in Rollfi. Returned Rollfi company ID stored in `rollfi_connections` alongside KitchenSync business ID. Then call `addCompanyLocation` with work-site address and `addCompanyBankAccount` to link operating account for payroll funding.

**2. KYB verification** — `initiateCompanyKyb` runs verification asynchronously. Webhook `company.kyb.update` receives status changes. For local dev where webhooks can't reach localhost, a 60-second polling loop calls Rollfi to check KYB status and updates the local DB on transition.

**3. Deferred bank linking** — KYB must pass before Rollfi accepts bank linking. When user enters bank details before KYB completes, KitchenSync saves the account locally with a deferred flag. When KYB webhook fires `approved`, KitchenSync auto-calls `addCompanyBankAccount` with stored details. Prevents user from re-entering bank info.

**4. Link-existing flow** — For businesses already in Rollfi (e.g., migrating from another payroll UI), `linkExistingRollfiCompany` fetches existing KYB status, resolves location ID via `getCompanyLocationInfo` (since `addCompanyLocation` returns "already exists" without ID), and runs full post-creation step sequence. **Critical fix:** location ID resolution — without it, location was stored as literal string `"existing"`, causing all subsequent employee syncs to fail with `"location id is mandatory"`.

## Employee Sync (KYC Flow)
Every employee that goes through onboarding is synced to Rollfi in fire-and-forget pattern. Errors logged for retry but never block onboarding progress.

**Step-by-step flow:**
1. Personal info saved → `addUser` + `addUserWage` + `acceptTerms`
2. Demographics → `addKycInformation` (SSN, DOB, address) + `initiateUserKyc`
3. Tax info → W-4 sync (filing status, allowances, additional withholding)
4. Bank info → `addUserBankAccount` (direct deposit setup)

**Data sanitization (hard-won bug fixes):**
- Phone numbers stripped to 10 digits — Rollfi rejects formatted numbers like `661-433-0598`
- Names trimmed of leading/trailing whitespace — leading space in last name caused cryptic `"enter last name with max 50 characters"` error
- All required fields validated upfront before API call

**Pay-rate sync** — `syncProfileRate()` propagates `employeePayRates` writes (canonical) to `employeeProfiles.payRateCents` or `annualSalaryCents`. Added after discovering Rollfi sync and payroll engine were reading null rates from `employeeProfiles` because UI only wrote to `employeePayRates`.

**Salaried-vs-hourly column fix** — Salaried annual salary was being stored in `payRateCents` (hourly column) instead of `annualSalaryCents`. Two employee creation paths (rehire + new hire wizard) set `payRateCents` from position assignment regardless of pay type. Broke Rollfi wage validation (`"missing annualSalaryCents"`) and caused wage notice PDFs to show $0 for salaried employees.

**Webhook handling** — `employee.status.update` (Active/Inactive/Terminated) and `user.kyc.update` webhooks. Status handler updates local active state; KYC handler updates verification. Local-dev fallback: 60-second polling loop calls `getUserStatus()` for non-active employees.

**Webhook security gotcha** — Rollfi does NOT sign webhooks (no HMAC header). KitchenSync's original endpoint required `ROLLFI_WEBHOOK_SECRET` for signature verification, rejecting every real webhook with HTTP 500. Mandatory verification was removed; auth relies on Rollfi's workspace-level config.

## Payroll Calculation Engine

**Labor aggregation** — `aggregatePayrollFromLabor` reads all clock-in/out records for the pay period, groups by employee, and computes: regular hours, overtime hours (jurisdiction-driven), double time, break premium hours (CA meal break penalty), tips, and retro tips. Output is map of employee IDs → line items with all pay components broken out.

**Salaried employee injection** — Salaried employees have no shifts, so they were completely missing from payroll runs. Engine now fetches all active salaried employees at the end of `aggregatePayrollFromLabor` and injects them. Per-period salary computed from `annualSalaryCents / periodsPerYear`:

| Frequency | Periods | Standard Hours |
|---|---|---|
| weekly | 52 | 40 |
| biweekly | 26 | 80 |
| semimonthly | 24 | 86.67 |
| monthly | 12 | 173.33 |

`hourlyRateCents` derived as weighted average for differential pay submission.

**Differential pay submission** — All employees (salaried + hourly) submitted via Rollfi's `importRegularDifferentialPayrollData`. Each pay component is a separate line item with its own pay code. Required because Rollfi applies different tax treatments to different pay types.

**Pay component mapping:**
- Regular hours → `basePay` with `payCode: "Regular"`
- Overtime → `overTime` with `type: "Standard Overtime"`, multiplier 1.5
- Double time → `overTime` with `type: "Double Time"`, multiplier 2.0
- Break premium (CA) → `basePay` with `payCode: "Break Premium"`
- Sick hours → `basePay` with `payCode: "Sick Pay"` (taxed as regular, NOT supplemental flat 22%)
- Vacation hours → `basePay` with `payCode: "Vacation Pay"` (regular tax treatment)
- Tips + retro tips → `additionalCompensations`
- Bonus → `additionalCompensations`
- Reimbursement → `reimbursements`
- Back pay → `retro`

**Recalculate from shifts** — Draft payroll runs can be recomputed when shift data changes. `recalculatePayrollRunFromShifts` re-aggregates labor data while **preserving manual adjustments** (sick, vacation, bonus, back pay, reimbursement). Only updates employees whose labor data actually changed; returns accurate count of affected employees.

**Payroll adjustments** — Add/edit/delete on draft and pending_review runs. Sick/vacation adjustments compute `payCents = timeOffHours × hourlyRate` and atomically update both the specific pay field and `totalGrossCents`. For salaried employees where `hourlyRateCents` is null, falls back to `employeeProfiles.payRateCents`. Edit/delete locked once submitted.

**Cancelled period resubmission** — Rollfi's cancelled pay periods can be resubmitted (confirmed with Rollfi). Submission guard was blocking cancelled as if permanent. Now only `processed` status blocks resubmission. Engine peeks at live period status before rejecting.

## Time-Off Accrual Engine (Local Ledger)

**Why local** — Rollfi has no balance-import API, no manual-adjustment API, and no `pay_period` accrual mode. Impossible to use Rollfi for time-off with migrating employees who need initial balances set.

**Ledger architecture** — `time_off_ledger` is **append-only** with integer minutes. Every accrual, usage, adjustment, and forfeiture is a row. Current balance = latest `balanceAfterMinutes` for `(employee, policy)`. Full audit trail; reconstruct any employee's balance history from ledger entries.

**Accrual formula** — Proportional with 2-decimal-place rounding (NOT `Math.floor`):
```
accrual = (workedHours / threshold) × accrualRate
```
Worked hours include sick and vacation (paid hours count toward accrual). For salaried employees, `regularHours` reduced by leave taken, so engine adds leave hours back to get total paid hours.

**Three accrual modes:**
- `pay_period` — fixed X hours per payroll run regardless of worked hours
- `hours_worked` — rate per hour worked (e.g., 1 hour PTO per 30 hours worked)
- `frontload` — upfront grant at start of period (annual or hire anniversary)

**Idempotency** — Engine checks for existing ledger entries before writing. Safe to re-run accruals without doubling balances.

**Validation hardening:**
- All validation runs **before** the adjustment insert — prevents orphan rows on validation failure
- Cross-run balance checking accounts for sick/vacation hours in other draft/pending runs (prevents double-spending across drafts)
- Policy rules enforced: minimum increment (e.g., 0.5hr min), max annual usage cap, probation period gate, running balance cap

**Webhook flow:**
- Usage deducted at payroll submission time (webhook fires as idempotent safety net)
- Accrual triggered on payroll completion webhook
- **Order matters:** deduction runs before accrual for balance accuracy

**Deprecated Rollfi APIs** — `addTimeOffPolicy`, `addTimeOffPolicyAssignment`, `getTimeOffBalance` all replaced by local engine. `pushTimeOffPoliciesToRollfi()` is now a no-op.

**Admin routes** — Set initial balance for migrating employees (one-time adjustment to bootstrap ledger), manual ±adjustments with reason codes, full ledger history query with filtering.

## Jurisdiction-Aware Labor Rules

**Jurisdiction registry** — `jurisdiction_payroll_labor_defaults` table stores per-jurisdiction rules: daily OT threshold (8hr CA, none federal), weekly OT threshold (40), OT multiplier (1.5x), double time threshold (12hr CA), DT multiplier (2.0x), meal break requirements, tip credit rules, minimum wage. **AI researches and populates** defaults when new jurisdiction encountered.

**Minimum wage registry** — Curated dataset at city/county/state/federal levels with effective dates. AI verification cross-references official government sources. Auto-refresh checks for updates. Fallback chain: city → county → state → federal, returning highest applicable rate. Replaced hardcoded $7.25 federal — legally unreliable for restaurants where governing rate depends on work location.

**Stale-data invalidation** — Fallback minimum wage records have 30-day TTL via `nextCheckAt + address fingerprint`. When curated dataset is corrected (e.g., LA $17.84 → $17.87), stored fallbacks weren't invalidated. Dataset-change invalidation mechanism marks affected records for re-resolution.

**Runtime integration** — Shift and payroll engines read stored jurisdiction settings instead of hardcoded rules. Manual shifts split regular vs overtime at jurisdiction's daily threshold (not hardcoded 8hr). OT multiplier from jurisdiction settings (not hardcoded 1.5x). Double time derived from jurisdiction thresholds.

**Active jurisdiction work:**
- Spread-of-hours premium (NY 10+ hour workday)
- 7th-consecutive-day OT (CA special OT/DT)
- Meal-break violation detection (jurisdiction thresholds + waiver rules)
- Tip-credit settings as primary runtime/compliance input
- Employee-level meal-break waiver-on-file tracking

## HR Document Generation

**Pay rate change notice** — On pay rate change save, auto-generate PDF using `pdf-lib` with employee name, old → new rate, effective date, reason, and prepared-by (manager name). PDF stored in S3, `documents` row created, signature request generated, actionable todo assigned to employee.

**Timecard amendment notice** — On shift time amendments, generate PDF with original + amended clock times, reason for change, and HR-approved attestation block (full legal language mirroring clock-in certification — not just "I acknowledge receipt").

**Dispute resolution** — Three outcomes when manager reviews dispute: **accept** (original employee claim upheld, amendment reversed), **uphold** (manager's amendment stands, dispute closed), **amend & re-issue** (manager edits times again; anti-spam dedup detects re-issue against disputed record).

## Schedule Grid
Salaried employees **excluded** from schedule grid — they have no shifts to schedule and are auto-injected into payroll runs. Grid shows only hourly employees with scheduleable positions.

---

# 🟪 Banking System

## System Overview
Full banking platform for restaurant operators. **Passport (Priority's banking-as-a-service)** powers account management and transactions. **Plaid** and **Stripe Financial Connections** for external bank linking. **Mercury** for outbound ACH. Locally-built **cash flow planning engine** for forecasting and reserve management.

Handles: business account creation, KYB/KYC verification, debit and virtual card management, ACH transfers, wire transfers, internal transfers, check issuance, vendor payment automation, bank reconciliation, cash flow forecasting with reserve management.

## Architecture
```
Kit Banking
  ├── server/passport-client.ts              — Passport API client (REST)
  ├── server/banking/routes/                 — 19 modular route files
  │   ├── accounts.ts                        — Account CRUD, balance queries
  │   ├── customers.ts                       — Passport customer, KYB, debit cards
  │   ├── transfers.ts                       — Internal + external transfers
  │   ├── deposits.ts                        — Fund deposits
  │   ├── checks.ts                          — Check issuance
  │   ├── debit-cards.ts                     — Card management
  │   ├── virtual-cards.ts                   — Virtual card management
  │   ├── external-accounts.ts               — Plaid/Stripe linked accounts
  │   ├── vendor-payments.ts                 — AP payment execution
  │   ├── transactions.ts                    — Unified transaction feed
  │   ├── reconciliation.ts                  — Bank rec
  │   └── webhooks.ts                        — Passport webhooks
  ├── server/banking-sync.ts                 — Background sync (cards, accounts)
  ├── server/mercury-engine.ts               — Mercury ACH integration
  ├── server/plaid-client.ts                 — Plaid Link + data sync
  ├── client/src/pages/Money/                — Banking UI surfaces
  │   ├── Accounts/                          — Account dashboard
  │   ├── CashFlow/                          — Cash planner (dedicated page)
  │   ├── Bills/                             — AP surface
  │   └── Transactions/                      — Transaction feed
  └── shared/models/banking/                 — Drizzle schema
```

## Passport Integration

**API client** — Wraps Passport's REST API in typed client (`passport-client.ts`) covering all banking operations. Unlike Rollfi's RPC style, Passport uses standard REST endpoints.

**Customer onboarding** — `createIndividualCustomer` (beneficial owner) → `createBusinessCustomer` (entity) → KYB. Rewrite eliminated **~30 manual input fields** (EIN, SSN, address, government ID, US_STATES array) by auto-wiring from existing business and user profiles. For fully-onboarded employee opening a personal account, only action needed is accepting the Passport Account Agreement.

**Multi-account management** — Each business can have multiple Passport accounts (operating, payroll, tax reserve, etc.). Balances synced via background polling (`banking-sync.ts`) and webhook updates. Dashboard shows real-time balances across all accounts.

## Transaction Methods (all 7 supported)

**ACH** — Inbound (collect) and outbound (send) for payroll funding, vendor payments, account-to-account. Status tracked through Passport webhooks. **Mercury** integration adds a second ACH rail for outbound vendor payments.

**Wire transfers** — Same-day and next-day domestic for large or time-sensitive payments. Full status lifecycle.

**Internal transfers** — Book transfers between Passport accounts within same entity. Instant settlement. Used heavily for reserve account funding (operating → payroll/tax reserve).

**Check issuance** — Physical check generation and mailing through Passport for vendors that don't accept electronic payment.

**Debit cards** — Physical and digital card issuance. Lifecycle: issue, activate, freeze, unfreeze, replace (lost/stolen), reissue. Hard-won card-issuance gotchas:
- Card issuance requires **beneficial owner's mailing address** (not entity address) → entity address causes `EC-BL-0246`
- `cardholder.id` must be a **number, not a string** → string causes `EC-BL-0004`
- **Don't send `cardProgram`** in the request → Passport auto-assigns based on customer type

**Virtual cards** — Disposable or merchant-locked for online purchases. Same lifecycle as physical cards.

**Fund deposits** — Cash and check deposit recording with memo and reference tracking.

## External Bank Connections

**Plaid** — Primary bank linking. Users authenticate via Plaid Link; KitchenSync stores access token and syncs balances + transactions. Powers Money banking surface and cross-account cash flow visibility.

**Stripe Financial Connections** — Added as Plaid alternative. Already in use for subscription ACH payment-method vaulting; extended to Money banking surface so users can link via either provider. Useful when bank is supported by one provider but not the other.

**Bank statement upload** — Fallback when live linking fails (institution unsupported, permissions blocked, customer preference). User uploads PDF/CSV bank statement; KitchenSync creates a viewable bank account in Money from statement data and imports transactions into existing pipeline. Unblocks onboarding for institutions that prevent API connections.

## Vendor Payment Automation
When bills are approved, AP engine determines payment method (ACH, check, wire) based on vendor preferences and rules, then executes through Passport or Mercury.

**Mercury outbound ACH** — For vendor payments routed through Mercury, KitchenSync creates ACH transfers with recipient details, amount, memo. Mercury handles ACH network submission and status tracking. KitchenSync receives status updates and reconciles against the original bill.

## Transaction Feed
Banking transaction feed unifies multiple sources into single chronological view. `bankTransactions` (Plaid/Stripe synced activity) and `bankTransfers` (Passport-originated movements) queried together and merged. Internal transfers emit two rows: outflow on source account, inflow on destination. Each transaction shows amount, counterparty, status, date, category.

## QBO Integration

**Import pipeline** — QBO data (chart of accounts, transactions, vendors, customers) imported through QBO API. Background job with status tracking (pending, running, completed, failed).

**Token refresh guardrails** — QBO OAuth tokens expire and need periodic refresh. Shared DB + multiple runtime environments (dev, staging, prod) → concurrent refresh attempts or wrong-environment credentials could corrupt the connection. Guardrails:
- Connection-level locking during refresh
- Environment-aware credential selection
- Automatic transition to `needs_reauth` state on refresh 401 (previously UI kept showing "Connected" after a failed refresh)

**Validation** — After import, period-by-period comparison between QBO balances and KitchenSync's computed balances. Account-detail viewer drills down from period-level differences to individual account variances, displayed in trial balance order (Assets → Liabilities → Equity → Revenue → Expenses).

**Failed import recovery** — Reset action clears QBO-imported transaction data for scoped business/group while preserving reusable reference mappings (vendor/account associations). Exposed in UI when latest import is in failed state.

## Cash Flow Planning Engine (largest active initiative)

**Design principle:** Daily rows are source of truth; everything else (weekly summaries, section totals, reserve targets, transfer recommendations) is **derived**.

**Data model** — `cash_planning_rows` stores one row per day per cash flow category per business. Categories map to existing modules:
- Sales revenue ← `daily_sales_summaries`
- Payroll outflows ← `payroll_runs`
- AP payments ← `bills`, `purchase_orders`
- Recurring obligations ← `recurring_bills`
- Bank activity ← `bank_transactions`, `bank_transfers`
- Deposits ← deposit records

**Source adapters** — Pipeline of adapters materializes derived daily rows from existing modules. Each adapter emits normalized candidates with `planningDate`, `groupId`, `businessId`, `category`, `amount`, `confidence`. Adapters run on schedule and on data changes. **Automation-first** — baseline tracker should never require manual data entry.

**Projection engine** — Computes daily starting cash → inflows → outflows → ending cash. Rolls daily rows into weekly summary periods without double-counting. Produces funding-purpose outputs (how much needs to be in payroll account by Friday, how much AP is due next week) that other parts of the app consume.

**Weekly planner UI** — Weekly summary view modeled on the client tracker spreadsheets KitchenSync is replacing. Expandable sections (sales, payroll, AP, other) with day-level drilldown. Hosts the weekly A/P recommendation review — operator moves from cash position to payment decision in one flow. Lives on dedicated Cash Flow page in Money navigation.

**Off-schedule steering** — Lightweight intervention layer for items not yet automated: one-off expected inflows (insurance reimbursement Thursday), one-off expected outflows (equipment purchase next week), timing adjustments (vendor delay), unresolved operator notes. Row-level public-vs-internal visibility. **Exception layer, not baseline.**

## A/P Payment Recommendation Engine
The cash planner doesn't just show where money is — it proposes **what to pay**.

**Weekly pay run generation** — Each week, engine looks at upcoming AP obligations, projected cash after non-discretionary outflows (payroll, taxes, loan payments), and available balance. Proposes a pay run: bills to pay, bills to defer, total outflow. **Deterministic first, agent-assisted second.**

**Decision persistence** — When operator skips a bill or marks disputed, decision carries into next week's recommendation **without relying on chat history**. Recommendations have lifecycle: `draft → accepted → dismissed → scheduled → executed`. In-flight accepted recommendations feed back into cash projections so planner doesn't double-count.

## Reserve Account Management

**Target balance computation** — Same daily cash planning math as weekly planner.
- Payroll reserve target = next payroll run gross + estimated employer taxes
- Tax reserve target = accumulated sales tax liability
- Vendor reserve = upcoming AP due within funding window

Same numbers appear across planner, banking accounts, payroll funding states, A/P pay-run review.

**Transfer recommendations** — When reserve account is below target, engine recommends internal transfer from operating account. Recommendation includes source, destination, amount, reason, urgency. Operator can accept, dismiss, or let auto-transfer execute for enabled mappings.

**Auto-execution** — For reserve accounts with auto-transfer enabled, accepted recommendations execute as internal Passport transfers without manual intervention. Agent layer can explain recommendation rationale inside KitchenSync chat interface.

## Bank Reconciliation
Reconciles imported bank transactions against internally-recorded activity (AP payments, payroll withdrawals, sales deposits). Unmatched transactions surface for manual categorization. Engine runs per-account with date-range filtering. Supports automated matching (amount + date + reference) and manual match/unmatch.

---

# Summary Metrics

| | Rollfi Payroll | Banking |
|---|---|---|
| Total surface | 31 functional areas | 28 functional areas |
| Status | Production, hardened | Production with active expansion |
| Tech stack | TypeScript, Drizzle ORM, RPC client, Postgres, S3, pdf-lib | TypeScript, REST clients, Postgres, Plaid, Stripe FC, Mercury, Passport |
| Lead | Akhil (Rollfi core), Alex R (jurisdiction) | Akhil (Passport), Alex R (cash flow, QBO) |
| Key risk surface | Pay code mapping correctness | Cash flow tracker complexity (9 interconnected sub-tickets) |

---

# Resume Bullet Patterns (use these as scaffolds — never invent new metrics)

## For Backend / Distributed Systems roles
- Architected payroll integration backbone serving 1,000+ restaurant businesses on Rollfi's RPC-style API; engineered fire-and-forget employee sync with idempotent webhook-fallback polling for local dev
- Built local time-off accrual engine on append-only ledger with 2dp proportional formula across 3 accrual modes (pay_period, hours_worked, frontload); replaced 3 deprecated Rollfi APIs and unblocked migrating-employee initial balances
- Designed differential-pay submission pipeline that maps 10 distinct pay components to Rollfi's wire format with correct tax treatment (regular vs supplemental); fixed sick/vacation hours being taxed at 22% supplemental flat instead of regular rate
- Drove 19-file modular extraction from a 3,500-line monolithic banking-routes module to scope-tight handlers, improving on-call diagnosability and PR review surface area

## For Identity / Auth / Fintech roles
- Owned KYB/KYC orchestration across two BaaS providers (Rollfi for payroll, Passport for banking); implemented deferred-bank-linking pattern that auto-completes account setup when verification webhook fires post-flow
- Hardened webhook ingestion against unsigned Rollfi callbacks (no HMAC) and Passport's REST callbacks; added 60-second polling fallback for local-dev environments where webhooks can't reach localhost
- Closed tenant-isolation gaps in payroll onboarding and corrected encrypted-data forwarding for SSN and bank details across cross-domain payroll/banking sync

## For Full Stack / Frontend roles
- Rewrote CreateAccountDrawer (banking onboarding) to eliminate ~30 manual input fields by auto-wiring from existing business and user profiles; reduced beneficial-owner-account flow to single-action "accept Passport Agreement"
- Migrated Cash Flow planner from embedded section in Accounts page to dedicated Money navigation page; modeled weekly summary UI on client spreadsheet workflows we were replacing for migration parity

## For AI Platform / Agentic / Automation roles
- Built source-adapter pipeline for cash-flow projection engine that materializes derived daily rows from 6 existing modules (sales, payroll, AP, deposits, transfers, recurring bills) with confidence scoring per candidate
- Designed deterministic-first / agent-assisted A/P pay-run recommender; recommendations carry lifecycle state (`draft → accepted → dismissed → scheduled → executed`) and persist operator decisions across weeks without relying on chat memory

## For Data / Distributed-Systems roles
- Designed canonical `cash_planning_rows` daily-row store as single source of truth; weekly summaries, section totals, reserve targets, and transfer recommendations all derived without double-counting
- Implemented jurisdiction-driven payroll calculations across CA, NY, and federal rules; replaced hardcoded $7.25 federal floor with city → county → state → federal fallback chain backed by AI-verified curated dataset

## For Forward Deployed / Customer Engineer roles
- Diagnosed and fixed cryptic Rollfi validation errors at customer-deployment time: `"location id is mandatory"` (linkExisting flow stored literal "existing"), `"enter last name with max 50 characters"` (leading whitespace), `"missing annualSalaryCents"` (salaried stored in hourly column)
- Owned QBO connection-recovery UX: shipped guardrails to detect failed token refreshes and transition UI to `needs_reauth` instead of silently showing "Connected" after a 401

---

# 🟧 Berkadia Projects (CRE / Agency Lending Detail)

Beyond the cv.md bullet "$10B loan portfolio backend," Berkadia work is decomposable into 3 named projects useful when a JD mentions Fannie Mae, Freddie Mac, agency lending, real estate, or data pipelines.

## Indicative Pricing App
- **Stack:** Angular, NgRx, JavaScript, TypeScript, Node.js, Express, AWS S3, Azure DevOps
- **What it did:** Excel-to-message-store automation supporting faster pricing updates for agency lending workflows (Fannie Mae, Freddie Mac)
- **Outcome:** **50% reduction in deal-manager workload**; templates stored in AWS S3; supported automated pricing updates for SBL template exports and deal registration

## FNMA Gateway App
- **Stack:** Node.js, REST APIs, Hapi/Joi, DynamoDB, Terraform, Docker, Jest, Swagger
- **What it did:** Improved reliability for Fannie Mae transactional workflows (quote generation, deal registration)
- **Role:** Production support point of contact for gateway issues and UAT validation
- **Outcome:** Optimized loan and real-estate finance workflows by **15%**; under-4-hour incident resolution average

## Platinum Property Records
- **Stack:** AWS Lambda, PySpark, EMR, S3, EC2, SQS, SNS, CloudWatch
- **What it did:** Property data cleansing and preprocessing pipeline; partnered with data engineering team
- **Outcome:** Cleaner property datasets and analysis outputs that helped business stakeholders identify trends and make faster decisions

**User base:** All Berkadia products served **500+ users**; agency lending, FNMA Gateway, Platinum Property Records, underwriting support, internal lending workflows.

---

# 🟩 Public / Side Projects (Portfolio)

Pull these when relevant; they're public on GitHub and demonstrate independent initiative.

## CareerPilot AI (this project — career-ops)
- **GitHub:** https://github.com/akhiljaggari123/Job-Automation
- **Stack:** TypeScript, Node.js, Claude API, Gemini API, PDF generation (Playwright), Greenhouse/Lever/Ashby APIs
- **What it does:** Automates the top 50 daily job applications with tailored documents, scored prioritization, and follow-up command for ongoing outreach
- **Why it matters:** Demonstrates LLM-orchestrated workflow design, multi-provider AI integration (Claude + Gemini), API-first job-discovery automation, and a deterministic pipeline that produces tailored ATS-parseable PDFs at scale
- **Best for JDs in:** AI Platform, LLMOps, Agentic workflows, Full-Stack with AI features, Developer Tools

## FiberOps Service Hub
- **GitHub:** https://github.com/jaggarinikhil/sln_cable
- **Stack:** React, Android, JavaScript, Service Operations
- **What it does:** Digital operations layer for an India-based cable, broadband, and internet service business
- **Best for JDs in:** Full-Stack, Frontend with mobile context, Service operations / field-ops tooling

## Sentiment Analysis for Shopping Applications
- **GitHub:** https://github.com/akhiljaggari123
- **Stack:** Spring Boot, Angular, LSTM
- **What it does:** Classifies shopping reviews into positive/negative/neutral
- **Outcome:** **89% model accuracy**
- **Best for JDs in:** ML Engineer (entry/junior overlap), Backend with ML features, NLP-adjacent

## Akhil Jaggari Portfolio Site
- **Live:** https://akhiljaggari.vercel.app
- **Stack:** Next.js, Tailwind CSS, Vercel
- **Best for:** Showing alongside Frontend / Full-Stack applications as a working live demo

---

# 📛 Public Identity & Online Presence

| Channel | URL | Use for |
|---|---|---|
| Portfolio | https://akhiljaggari.vercel.app | Resume header, cover letter header, "personal website" form fields |
| LinkedIn | https://www.linkedin.com/in/jaggariakhil/ | Resume header, cover letter, LinkedIn form fields |
| GitHub (primary) | https://github.com/akhiljaggari123 | "GitHub" form fields, technical resumes |
| GitHub (legacy / FiberOps) | https://github.com/jaggarinikhil | Only if FiberOps project is referenced |
| Email | ajaggari123@gmail.com | All forms |
| Phone | 940-304-7888 | All forms |

---

# 🎯 Headline / Tagline Options (use in summary / cover letter hook)

- **Default:** "Full Stack Software Engineer building scalable web, cloud, and financial systems."
- **Backend-leaning:** "Senior Software Engineer with 5+ years architecting high-scale distributed systems and mission-critical financial infrastructure."
- **AI-leaning:** "Full-stack engineer with AI-assisted delivery experience — Claude Code, Codex, Claude API, Gemini API, MCP servers — shipping production-grade FinTech systems."
- **Domain-leaning:** "Full-stack engineer focused on financial workflows, lending, payroll, banking, and automation."
- **Self-positioning closer:** "I design and ship scalable applications that connect product usability with operational reliability."

# Expanded Tech Stack (from portfolio, not in cv.md skills section)

When a JD mentions any of these, pull from this expanded list — they are real tools used in projects:
- **Frontend state:** NgRx, Redux
- **Search:** OpenSearch (in addition to Elasticsearch)
- **Data:** Snowflake, MySQL (in addition to Postgres/Mongo/DynamoDB/Cassandra), PySpark, AWS EMR
- **Cloud:** GCP (in addition to AWS, Azure)
- **AI tooling:** Claude Code, Codex, Claude API, Gemini API, MCP servers, AI agents
- **API validation:** Hapi/Joi (Node.js validation framework used in FNMA Gateway)

