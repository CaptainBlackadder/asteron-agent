# Asteron Agent — Warm-End Conversion & Service Reactivation

## Section 1 — Project Identity

This is the working agent behind **slide 4 ("One Identity, Two Journeys")** of the Asteron
Motors strategy deck (`asteron_deck_v4.html`), built for the Accenture B-School Challenge S10
case. It exists to make two placeholders in that deck real: slide 1's footer
`Agent demo: [paste link]` and slide 4's `Demo run 2 shows the agent refusing to act on a
hardship signal. Recording: [paste link]`.

**What it does:** given a customer record (a completed test drive with no booking yet, or a
lapsed/service-due customer), the agent resolves the customer's identity, detects the relevant
signal from raw CRM/behavioral evidence, assembles a context pack, sequences the right timing,
checks every proposed action against a strict human-only boundary (Gate), then either hands off
to a named human or executes a pre-approved low-risk action — logging everything, including
every time it refuses to act.

**What it deliberately does not do:** negotiate, price, value a trade-in, resolve a complaint,
commit to a delivery date, approve credit, or act on a customer in personal distress. Per the
case's own definition — *"AI that can plan and carry out pre-approved steps across a workflow;
people remain accountable for decisions that affect customers"* — those stay human-only, always.

Runs **entirely inside Claude Code** using native file read/write and its own reasoning — no
API keys, no external SDKs, no build step, no `node`/`python`. There is nothing to fetch from
the web: Asteron is fictional, so every fact the agent uses is either in `knowledge_base/` (from
the case brief) or in the sample customer records (synthetic, case-grounded — see
`scenario_design_notes.md`).

The decision contract — the seven-step loop, the signal-classification discipline, the Gate
boundary check, and the ledger schema — lives in [`SKILLS.md`](SKILLS.md). **Read it before
processing any customer.**

**Relationship to `demo_app/`:** this file and `SKILLS.md` are the *design contract* — the
reasoning a human (or Claude Code) follows and can explain to a judge. `demo_app/index.html` is
a separate, working implementation of the same seven-step logic as literal, auditable JavaScript
(regex/keyword guardrails, not prompted rules), built to `Asteron_Agent_Build_Spec.md`. That app
— not this pipeline — is the thing that gets screen-recorded for the submission's mandatory demo
link. If the two ever disagree, `SKILLS.md` is the source of truth; `demo_app/` should be updated
to match.

---

## Section 2 — How to Run

The user types:

```
/asteron_agent [--journey warm_end_conversion|service_reactivation|all] [--customer CUSTOMER_ID]
```

Examples:

```
/asteron_agent                                  → run all customers, all journeys
/asteron_agent --journey warm_end_conversion    → run only the test-drive conversion journey
/asteron_agent --customer C003                  → run a single customer (e.g. the hardship case)
```

Default (no arguments): run every record in `knowledge_base/sample_customers.json` across both
journeys.

---

## Section 3 — The Pipeline

Claude Code executes the seven steps from `SKILLS.md` Section 1, in order, **for each customer
record**, journey-agnostically (the journey only changes entry criteria, timing window, and what
"Act" means — read those from `knowledge_base/journey_definitions.json`).

### STEP 1 — RESOLVE
- Read the customer record from `knowledge_base/sample_customers.json`.
- Note `customer_id`, `journey_type`, `dealer_id`, `dealer_archetype` — this is the unified
  identity view (mobile + VIN join, per the case's data-and-workflows gap).

### STEP 2 — DETECT
- Read `knowledge_base/customer_signal_taxonomy.json`.
- Classify the record's `crm_notes` and `behavioral_flags` against the evidence patterns for
  each signal code. Assign exactly one primary signal (or a documented multi-signal combination
  per the taxonomy's `multi_signal_handling` rule). If no evidence pattern matches, the correct
  classification is `insufficient_evidence` — do not force a fit.
- State the evidence quoted from the record that justifies the classification.

### STEP 3 — ASSEMBLE
- Using the matched signal's `context_pack_contents` from the taxonomy, build the context pack:
  what a human (consultant or service advisor) would need to act well.

### STEP 4 — SEQUENCE
- Read the customer's journey from `knowledge_base/journey_definitions.json` for its timing
  window.
- Decide: act now, or hold and re-check later because the record is still inside the window with
  thin evidence (see `SKILLS.md` Section 2, "Timing discipline before classification").

### STEP 5 — GATE
- Read `knowledge_base/decision_boundaries.json`.
- Apply the three-question check from `SKILLS.md` Section 3 in order. Record the
  `gate_outcome`: `passed`, `reframed_to_human`, `suppressed_hardship`, or
  `suppressed_customer_request`.

### STEP 6 — ACT
- If the journey is `warm_end_conversion` and Gate passed or reframed: package the context pack
  for `consultant_handoff` — a named human consultant owns the conversation, price, exchange,
  and close.
- If the journey is `service_reactivation` and Gate passed: execute the pre-approved low-risk
  action directly (reminder, scheduling nudge, status update). If Gate reframed (e.g. a prior
  unresolved complaint), hand off to a named service advisor instead.
- If Gate suppressed (hardship or customer-directed pause): no customer-facing action is taken.
  Route the single permitted human response (compassionate check-in, or simply respecting the
  pause) to a named owner.

### STEP 7 — LOG
- Write one ledger row per `SKILLS.md` Section 4's schema.

### OUTPUT
- Write a full per-customer trace (all seven steps, in the format of
  `templates/agent_trace_report.md`) and an aggregate run summary (in the format of
  `templates/ledger_summary.md`) to `outputs/ASTERON_AGENT_RUN_[YYYYMMDD_HHMMSS].md`.
- Print a console summary: customers processed, signals detected (by type), gate outcomes (by
  type), and a one-line callout for any `suppressed_hardship` outcome — that is the case's own
  "people remain accountable" principle made visible.

---

## Section 4 — Key Principles

- **Evidence over inference.** Never assign a signal, or invent a customer detail, beyond what
  the record actually states. `insufficient_evidence` is a legitimate, expected outcome.
- **Hardship and customer-directed pause are not the same thing, and neither is optional to
  detect correctly.** Conflating them either over-escalates a simple preference or under-reacts
  to real distress. Get this distinction right on every record.
- **The refusal is the deliverable.** When the agent suppresses a scheduled action, that
  suppression — with its logged rationale — is exactly as important an output as a successful
  handoff. Do not treat suppressed records as "nothing to report."
- **No unowned action.** Every logged action, automated or handed off, has a named human owner
  of record.
- **This agent complements the deck; it does not replace judgment in it.** Price, exchange
  value, negotiation, complaints, delivery, credit, and staffing stay human-only, exactly as
  slide 4 states.

---

## Section 5 — File Map

| File | Responsibility |
|------|----------------|
| `CLAUDE.md` | This file — defines `/asteron_agent` and the seven-step pipeline. |
| `SKILLS.md` | Decision contract: the seven-step loop, Detect discipline, Gate boundary logic, ledger schema, extensibility notes. |
| `knowledge_base/case_facts.json` | Ground-truth Asteron numbers from the case brief. |
| `knowledge_base/customer_signal_taxonomy.json` | The 7 signal classifications, their evidence patterns, and per-signal action rules. |
| `knowledge_base/decision_boundaries.json` | The human-only categories and the Gate rule. |
| `knowledge_base/journey_definitions.json` | The two journeys today; how to add more later without touching the pipeline. |
| `knowledge_base/sample_customers.json` | 17 synthetic, case-grounded customer records the agent processes. |
| `scenario_design_notes.md` | Which case/deck fact grounds each sample customer — methodology transparency, not agent input. |
| `templates/agent_trace_report.md` | Per-customer seven-step trace format. |
| `templates/ledger_summary.md` | Aggregate run summary format. |
| `outputs/` | Generated, timestamped run traces. |
| `1785563478340_...pdf` | The original case brief (source of all case facts). |
| `asteron_deck_v4.html` | Earlier draft of the strategy deck (7 slides, superseded by `Asteron_Accenture_S10_Final.pptx`). |
| `Asteron_Accenture_S10_Final.pptx` | The current submission deck. |
| `Asteron_Speaker_Notes.md` | Per-slide delivery notes and the arithmetic behind every number in the deck — read before Q&A. |
| `Asteron_Agent_Build_Spec.md` | The buildable spec `demo_app/` implements — data model, 7-step workflow, guardrails-as-code, the two mandatory demo runs. |
| `demo_app/` | The actual working, screen-recordable prototype — see `demo_app/README.md`. |
