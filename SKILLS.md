# Asteron Agent — Decision Contract (SKILLS)

This is the scoring/decision contract for the Asteron warm-end conversion and service
reactivation agent (the agent described in slide 4 of `asteron_deck_v4.html`, "One Identity,
Two Journeys"). All pipeline steps in `CLAUDE.md` reference the definitions here. Change the
rules here first, then re-run the pipeline — never hand-adjust an individual trace.

---

## Section 1 — The Seven-Step Loop

Every customer record, regardless of journey, passes through the same seven steps. The two
journeys (`warm_end_conversion`, `service_reactivation`) differ only in entry criteria, timing
window, and what "Act" means — see `knowledge_base/journey_definitions.json`.

| # | Step | What happens |
|---|------|--------------|
| 1 | **Resolve** | Join the customer's identity across systems (mobile + VIN as the join key) into one unified view. |
| 2 | **Detect** | Classify the record's signal using `knowledge_base/customer_signal_taxonomy.json`. Only assign a signal the evidence actually supports — see Section 2. |
| 3 | **Assemble** | Build a context pack: relevant history, the likely blocker, comparable resolutions. Content rules are defined per-signal in the taxonomy. |
| 4 | **Sequence** | Decide timing. Warm-end: act inside the 48-hour golden window, don't over-escalate before it elapses. Reactivation: act inside the service-due follow-up window. |
| 5 | **Gate** | Check the proposed action against `knowledge_base/decision_boundaries.json`. This is the step that can block or reframe everything downstream — see Section 3. |
| 6 | **Act** | Either `consultant_handoff` (warm-end: human owns the conversation, price, exchange, close) or `reactivate` (service: agent executes pre-approved low-risk actions directly, or hands off if Gate required it). |
| 7 | **Log** | Write a single-attribution ledger entry: customer, journey, signal detected, action taken (or suppressed), gate outcome, named human owner, timestamp. |

---

## Section 2 — Detect: Classification Discipline

The taxonomy in `customer_signal_taxonomy.json` defines seven possible outcomes:
`finance_hesitation`, `exchange_query`, `rival_mention`, `customer_directed_pause`,
`silence_unexplained`, `hardship`, `insufficient_evidence`.

**The discipline that matters more than the taxonomy itself:**

- **Evidence-gated, not vibes-gated.** A signal is only assigned when its specific evidence
  pattern is present in the record. A generic "still deciding" response with no other detail is
  `insufficient_evidence` — not a guess at finance_hesitation because that's the most common
  bucket. Fabricated specificity is a worse failure than an honest "not enough signal."
- **`customer_directed_pause` ≠ `hardship`.** A customer who says "don't contact me for now"
  without disclosing a reason gets their preference respected — nothing more. Do not infer
  distress they did not disclose. Treating every unusual silence as hardship would make the
  hardship response meaningless the one time it's real.
- **`hardship` always wins.** If hardship evidence co-occurs with anything else (a finance
  question, a rival mention), hardship takes precedence and suppresses all other planned action.
- **Timing discipline before classification.** If a record is still inside its journey's timing
  window (e.g. under 48 hours since test drive with only one contact attempt made), the correct
  Sequence outcome is often "hold and re-check," not an immediate escalation — even if a weak
  signal is present. Acting too early on thin evidence is its own failure mode.
- **Multi-signal records get one combined context pack**, never two separate (and potentially
  contradictory) actions. See `multi_signal_handling` in the taxonomy file.

---

## Section 3 — Gate: The Boundary Check

Before anything reaches a customer or is logged as "taken," Gate asks three questions in order
(full detail in `decision_boundaries.json`):

1. **Is the signal `hardship` or `customer_directed_pause`?**
   → Suppress all other planned action. Route to the human-only response defined for that
   signal. Log the suppression and its rationale — the refusal *is* the output, not a side
   effect.
2. **Does the proposed action fall in a human-only category** (price/discount, exchange
   valuation, negotiation, complaint resolution, delivery commitments, credit decisions, dealer
   staffing)?
   → Reframe the action as a context pack for a human. Never send it to the customer directly,
   even in a softened form.
3. **Otherwise** → the low-risk automated action may proceed (service reminders, scheduling
   nudges, neutral informational touches) — but it is still logged with a named human owner of
   record, because "no unowned agent in production" is a hard rule, not a suggestion.

A record that fails step 1 or 2 is not a pipeline error — it is the pipeline working. The
agent's value in this design is as much in what it *refuses* to automate as in what it does.

---

## Section 4 — Log: Ledger Schema

Every processed record produces one ledger row:

```
customer_id | journey | signal_detected | gate_outcome | action_taken | human_owner | timestamp
```

`gate_outcome` is one of: `passed`, `reframed_to_human`, `suppressed_hardship`,
`suppressed_customer_request`. `action_taken` describes what actually happened (an automated
message sent, a context pack handed to a named consultant/advisor, or "none — suppressed").

The ledger is single-attribution: one row, one primary claim, per customer per run — this is
the direct fix for the case's own finding that only 43% of the firm's 32 AI initiatives had a
named owner and only 4 had verified benefit.

---

## Section 5 — Extending to New Journeys (Later Rounds)

This contract is journey-agnostic by design. A new journey (e.g. dealer onboarding, complaint
triage) needs:

1. An entry in `knowledge_base/journey_definitions.json` (entry criteria, timing window, what
   "Act" means, target metric).
2. Any new signal types it requires, added to `customer_signal_taxonomy.json` following the
   same evidence-pattern + action-bucket + `must_not` structure used above.
3. Any new human-only categories it touches, added to `decision_boundaries.json`.

The seven-step loop and the Gate discipline in Sections 2–3 do not change.
