# Build Spec: Asteron Reactivation & Conversion Agent ("ARC")
### For: an LLM / coding assistant building a working, demoable prototype
### Purpose: complements a 7-slide Accenture B-School Challenge S10 deck (Industry & Enterprise track — Asteron Motors case). Slide 4 of that deck describes this agent; this document is the buildable spec for it. A recording of this agent running is a **mandatory** submission requirement.

---

## 0. Read this first — what you're building and why

Asteron Motors is a fictional Indian passenger-vehicle OEM (case data, not a real company). It has lost market share because dealers can't afford to deliver a good customer experience, and because 4 lakh customers a year test-drive a car and then never come back — nobody follows up in the 48-hour window where that decision actually gets made.

The strategy deck's answer is **not** a chatbot that responds faster to enquiries — it's an agent that sits at the *warm end* of the funnel: it works out **why** a test-drive didn't convert, hands a human consultant a short briefing note, and books a follow-up call inside 48 hours. It runs a second, related job — reminding customers whose service is overdue. It is deliberately narrow, and it deliberately refuses to touch price, negotiation, or complaints.

**Your job:** build a working prototype of this agent — synthetic data, the actual decision/orchestration logic, a demo-able interface, and a script for two specific recorded demo runs — not a slide about it. The deck already exists; this is the thing the deck points at.

**What "done" looks like:** someone presses record, runs two scenarios through your system in under 90 seconds combined, and it visibly (a) resolves a customer's identity across three data sources, (b) diagnoses why they didn't book, (c) drafts a brief and proposes a slot, (d) stops at a human gate, and — in the second run — (e) detects a hardship signal and refuses to draft anything at all, routing straight to a person instead. The refusal is the single most important thing to get right; showing an agent *decline* to act is more persuasive to this jury than showing it do more.

---

## 1. Scope — build this, not more

**In scope:**
- A synthetic dataset generator (Asteron has no real data — you are inventing plausible records, not scraping anything)
- The 7-step agent workflow described below, with real (not simulated-in-name-only) logic at each step
- One hard human gate in the middle of the workflow
- A minimal but clean interface to run and observe the agent live, suitable for screen recording
- A visible, append-only action log ("value ledger")
- Two demo scripts, executable end to end, matching the deck's promised recording exactly

**Out of scope — do not build:**
- Any real pricing, negotiation, discounting, or financing logic — the agent must be structurally incapable of outputting a price or a commitment, not just prompted not to
- Real Asteron/OEM system integrations (none exist — this is a case competition, not production software)
- A production-grade auth/security/deployment stack — this is a demo artifact
- An attempt to reproduce the deck's business-case numbers (₹1,677 cr, 90,720 units, etc.) from your small synthetic dataset — do not claim your demo run "proves" those figures; they come from case-exhibit arithmetic, not from this prototype

---

## 2. The data model — what to synthesize

Generate a small, internally consistent synthetic dataset (100–300 customers is plenty — this is for a demo, not a load test). Every record needs a way to be linked to the same underlying person, because **identity resolution is itself part of what the agent demonstrates.**

### 2.1 Core join keys
- `mobile_number` (10-digit, Indian format) — present on enquiry, test-drive, and service records
- `vin` (vehicle identification number, synthetic alphanumeric) — present on test-drive (if a specific unit was driven) and all service/workshop records
- Use these two fields as the **only** identity-resolution mechanism, matching the deck's design (mobile + VIN, because both are already captured at every touchpoint without a new process).

### 2.2 Tables to generate

**`customers`** — name (synthetic, clearly fictional), mobile_number, city, city_tier (metro/non-metro), preferred_language.

**`enquiries`** — enquiry_id, mobile_number, channel (digital/walk-in/referral), model_interest, date, qualified (bool).

**`test_drives`** — test_drive_id, mobile_number, vin (nullable if no specific unit), outlet_id, date, **outcome_captured** (bool — deliberately make ~1/3 of records `false`, mirroring the case's 34% journey-standardisation baseline; this gives you a realistic "no reason captured" case to handle), **outcome_tag** (enum, only populated when outcome_captured=true): `booked | finance_hesitation | exchange_value_concern | competitor_mentioned | no_response | other`, **free_text_note** (short string, consultant's raw note — this is where hardship/complaint signals sometimes hide even when the tag looks neutral; put a few "landmines" in here deliberately, e.g. a record tagged `other` whose free-text note says something like *"customer mentioned they're going through a tough financial patch and felt pressured"* — your agent must catch this from the text, not just the tag).

**`service_records`** — service_id, vin, mobile_number, last_service_date, next_service_due_date, vehicle_age_months.

**`outlets`** — outlet_id, city, city_tier, certification_tier (Champion/Squeezed/Willing/Unviable — optional flavor, not required for core logic).

**`consultants`** — consultant_id, outlet_id, name, a simple weekly availability calendar (a list of free 30-minute slots over the next 5 days is enough).

### 2.3 Deliberately seed these scenarios (you need them for the demo script in Section 5)
1. **Clean happy-path customer** — test-drove, outcome_tag=`exchange_value_concern`, neutral free-text note, has a matching mobile+VIN across enquiry/test-drive.
2. **Hardship/complaint customer** — test-drove, outcome_tag can be anything (even `other` or blank), but the free_text_note contains an unambiguous distress or complaint signal.
3. **Service-due customer** — no recent test-drive; service_records shows next_service_due_date within 14 days, vehicle_age_months > 24 (i.e., likely to have drifted from authorized service).
4. A handful of noise records with incomplete data (missing VIN, missing outcome) so identity resolution has something real to do.

---

## 3. The agent — exact workflow to implement

Build this as **seven discrete, inspectable steps**, not one opaque LLM call. The jury needs to see reasoning happen, not just a final answer — so each step should produce a visible, logged intermediate output, in this order:

### Step 1 — RESOLVE
Input: a trigger event (a test-drive record with outcome_captured=true and outcome≠booked, OR a service-due record). Join across `enquiries`, `test_drives`, `service_records` on `mobile_number` and `vin`. Output: a single "Customer 360" object — name, city, model interest, test-drive history, service history, all enquiries. This step should **fail gracefully and log a partial match** when VIN is missing but mobile matches (reflecting the real-world 25% manual-review-queue case from the deck) — don't silently drop these; flag them.

### Step 2 — DETECT
This is the safety-critical step. Two things happen here, and they must be **structurally separate**, not one blended LLM judgment call:

**2a. Hardship/complaint screen (hard rule check, runs first, always):** scan `free_text_note` (and outcome_tag if relevant) against a keyword/phrase list and/or a small classifier for distress, complaint, financial-hardship, safety, or legal signals. Starter keyword seed list — expand it, don't treat this as exhaustive: `complaint, unhappy, refund, cheated, unfair, legal, unsafe, accident, financial difficulty, cannot afford, lost my job, pressured, harassed, threatening`. **If this screen fires, stop the pipeline immediately.** Do not proceed to Step 3. Output a single record: "ESCALATED — routed directly to [named consultant], no automated action taken." This is the refusal your demo needs to show.

**2b. Non-conversion reason classification (LLM-assisted, only runs if 2a did not fire):** classify *why* the customer didn't book — finance-constrained, exchange-value-blocked, competitor-comparison, or genuinely no signal (silence). Use the structured `outcome_tag` where present; use an LLM call over the free-text note where the tag is missing or `other`. Output a labelled reason with a one-line justification.

**Why this split matters and must not be collapsed:** a keyword/rule-based hardship screen is auditable and cannot be argued away by clever prompting; an LLM-only classifier is not a strong enough guardrail for a "never miss a distress signal" requirement. Build the hard screen as literal code (not a prompt), and put it first.

### Step 3 — ASSEMBLE
Only reached if Step 2a did not fire. Generate a short context brief (4–6 lines) for the consultant: customer name, prior touchpoints, the classified reason from 2b, one or two suggested talking points or a comparable resolution pattern (e.g., "3 similar exchange-value concerns this quarter were resolved by walking the customer through the certified pre-owned buyback program"). **Hard constraint, enforce in code, not just in the prompt:** the generation step must never be allowed to emit a number formatted as currency, a discount percentage, or commitment language ("we will offer/give/guarantee..."). Post-process the LLM output with a regex/validation pass that strips or blocks currency patterns and a small banned-phrase list before it's ever displayed — this is a guardrail, not a suggestion to the model.

### Step 4 — SEQUENCE
Look at the assigned consultant's available slots over the next 48 hours (from the synthetic calendar) and propose one. If no slot exists in 48 hours, propose the earliest slot and flag it as outside the target window (this is an honest, visible failure mode — don't hide it).

### Step 5 — GATE (human)
This is not a soft pause — model it as a genuine state boundary. The agent's output up to this point (Customer 360 summary + reason + brief + proposed slot) is written to a **"Consultant Inbox"** view. The agent process ends here. Nothing past this point is agent-authored: in your UI, the consultant should be able to accept, edit, or decline the proposed slot, but there is no "agent continues after gate" code path at all — don't build one, even a stubbed one, because a stubbed "agent negotiates" function is exactly the kind of thing that looks bad if a judge asks to see the code.

### Step 6 — REACTIVATE (second journey, same agent)
Runs independently, triggered by service-due records rather than test-drive records. Steps 1 (resolve) and 2a (hardship screen) are identical/shared logic — reuse them, don't duplicate. Step 3 becomes a short service-reminder draft (advisory tone, what's due, why it matters) instead of a sales brief. Step 4/5 (sequence + gate) work the same way, proposing a service slot instead of a sales follow-up.

### Step 7 — LOG
Every agent action (not human actions) writes one row to an append-only ledger: `timestamp, customer_ref (pseudonymized, e.g. hashed mobile), journey (conversion/reactivation), step_reached, outcome (proceeded_to_gate / escalated_hardship / no_slot_available), owner (named consultant_id)`. This should be visibly rendered as a table in your UI — it's the "single-attribution value ledger" the deck's governance slide describes, and having it actually populate live during the demo is a strong visual.

---

## 4. Guardrails — build these as code, not prompts

State each of these as an explicit, testable rule. If you can't point to the line of code that enforces it, it isn't a guardrail, it's a hope.

1. The agent never outputs price, discount, exchange valuation figures, or financing terms, in any step. (Regex/validation pass on all generated text, Step 3.)
2. Any hardship/complaint signal short-circuits the entire pipeline before any drafting happens. (Step 2a runs first, always, unconditionally, hard-coded.)
3. Every action that reaches the gate has a named human owner attached — never null. (Schema constraint: `owner` field is NOT NULL.)
4. The agent never re-contacts the same customer more than once per 7 days for the same journey. (Simple dedupe check against the ledger before Step 1 proceeds.)
5. No step past the gate exists in code. (Structural — verify by code review, not by testing.)

---

## 5. The two mandatory demo runs

Build these as two clean, repeatable, one-click (or one-command) scenarios. Script them exactly like this:

**Run 1 — the happy path (target: ~45 seconds)**
Feed the "clean happy-path customer" from Section 2.3. Show, on screen, each of the 7 steps firing in sequence with its output visible (not a spinner-then-final-answer — the point is to show the reasoning trail). End on the Consultant Inbox showing the assembled brief and proposed slot, and the ledger gaining a new row with outcome=`proceeded_to_gate`.

**Run 2 — the refusal (target: ~30–45 seconds)**
Feed the "hardship/complaint customer" from Section 2.3. Show Step 1 (resolve) completing normally, then Step 2a firing and the pipeline stopping visibly — a clearly different visual state (e.g., a red/amber banner: "Escalated to [consultant name] — no automated action taken, per case guardrail"). Do **not** show a brief being generated and then discarded — the correct behavior is that no brief is generated at all. The ledger gains a row with outcome=`escalated_hardship`.

**Optional Run 3 (only if time allows)** — the service-reactivation journey on the seeded service-due customer, to show the second journey sharing the same identity-resolution and hardship-screen logic.

Narrate (or caption) each run with one line matching the deck's own language, e.g.: *"This is not the agent responding faster — it's the agent deciding who gets a human, and when to get out of the way entirely."*

---

## 6. Interface requirements

You are building something to be **screen-recorded**, so legibility matters more than polish. A three-panel layout works well:

- **Left — Event queue:** the list of triggering records (test-drive outcomes, service-due customers) waiting to be processed. Clicking one runs the agent on it.
- **Center — Agent trace:** the 7 steps rendered as a vertical sequence, each appearing as it completes, with its actual output text visible (not hidden behind a tooltip). This is the single most important panel — it's what makes the demo "the agent," not just a form submission.
- **Right — Consultant Inbox / Escalation banner:** shows either the assembled brief + proposed slot (Run 1 outcome) or the escalation banner (Run 2 outcome).
- **Bottom strip — Value ledger:** a small live-updating table, most recent row on top.

Framework suggestion (default to this unless you have a stronger reason not to): **Python + Streamlit**, one `app.py`, synthetic data generated at startup or loaded from a checked-in CSV/SQLite file, LLM calls via a single wrapped function (OpenAI or Anthropic API, whichever key is available) so the hardship-screen keyword check and the currency-regex guardrail can sit in plain Python around it. This is fast to build, easy for a reviewer to read top-to-bottom, and renders cleanly on screen. If a different agent-building platform is specified by the person you're building this for (e.g., a no-code agent tool provided by the competition), map the same 7-step structure and the same two hard-coded guardrails onto that platform's primitives instead — the workflow logic matters more than the specific tool.

---

## 7. Deliverables checklist

1. Synthetic data generator (script or checked-in seed files) covering Section 2, including the specifically-seeded scenarios in 2.3.
2. Agent orchestration code implementing all 7 steps as separately inspectable functions/modules — not one monolithic prompt.
3. The two hard-coded guardrails (hardship screen, currency/commitment-language filter) as testable, standalone functions with a couple of unit tests each — this is worth doing even for a demo, because "show me the guardrail code" is a plausible jury question.
4. A working UI per Section 6.
5. A short README: how to install, how to run, which button/command triggers Run 1 vs Run 2.
6. A one-paragraph narration script per demo run (Section 5), written so a teammate who didn't build this can present it cold.
7. The actual screen recording — capture both runs in one continuous take if possible (cleaner than two separate clips), under 90 seconds combined, and get the shareable link ready to paste into the deck (Slides 1 and 4 both have a `[paste link]` placeholder waiting for it).

---

## 8. What a strong build looks like vs. a weak one

**Weak:** one LLM prompt that takes a customer record and free-text output, dressed up with a nice UI. Impossible to point to where the guardrail lives. The "refusal" demo is really just the same call returning different text.

**Strong:** seven separable steps where Step 2a is a plain, auditable function that runs before anything touches an LLM, where the gate is a real code boundary with nothing on the other side of it, and where a reviewer could read your source top to bottom and find the exact line that stops the agent from ever quoting a price. The demo should feel less like "watch the AI talk" and more like "watch the system make a series of small, checkable decisions, one of which is to stop."
