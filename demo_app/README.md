# Asteron Agent — Live Demo (ARC)

A working prototype of the agent described in slide 4 of the Asteron Motors deck, built to the
spec in [`../Asteron_Agent_Build_Spec.md`](../Asteron_Agent_Build_Spec.md). This is the thing
that gets screen-recorded for the submission's mandatory demo link — not a mockup of it.

## How to run it

There is nothing to install. Double-click [`index.html`](index.html), or open it in any
browser. All data, logic, and UI are in that one file — no server, no build step, no API key.

On load it silently runs 13 unit tests against the two hard-coded guardrails and shows the
result in the top-right badge (`Guardrail self-test: 13/13 passed`). Click **details** next to
it to see each test.

## Which button triggers which run

| Button | What it does | Maps to build spec |
|---|---|---|
| **▶ Demo Run 1 — Happy Path** | Runs Vishal Nair (`TD003`) — an exchange-value concern with a clean record. Ends with a brief + proposed slot in the Consultant Inbox. | Section 5, Run 1 |
| **▶ Demo Run 2 — Refusal** | Runs Meera Krishnan (`TD011`) — hardship disclosed in free text despite a neutral-looking `other` tag. Pipeline stops after Step 2a; no brief is ever generated. | Section 5, Run 2 |
| **▶ Demo Run 3 — Reactivation** | Runs Neha Kapoor (`SR-N1`) — a clean service-due record, no signal. Ends with a service-reminder draft + slot. | Section 5, optional Run 3 |

Any other row in the Event Queue is also live — clicking one runs the full pipeline on that
record. Two are worth showing if a judge asks "is the refusal just that one scripted record?":

- **Imran Qureshi** (test drive, Bengaluru) — a second, differently-worded hardship trigger
  ("lost his job... can't afford"), to show the screen matches on content, not on a hardcoded ID.
- **Zoya Ahmed's *reactivation*** row — she has an old test-drive record with a complaint/hardship
  note. Running her *service-due* trigger still escalates, because Resolve pulls in every
  free-text note linked to her identity, not just the one on the current record. This is the
  concrete reason the build spec says Steps 1 and 2a are shared, not duplicated, across journeys.

Click **Next step ▶** to reveal the trace one step at a time (best for narrating live), or
**Auto-play ▶▶** to reveal the rest automatically (~0.9s per step). **Reset ledger** clears the
Value Ledger between takes.

## Where the guardrails actually live (for "show me the code")

Open `index.html` and search for these function names — every guardrail in
`Asteron_Agent_Build_Spec.md` Section 4 is a plain function, not a prompt:

| Guardrail | Function | What it does |
|---|---|---|
| Never output price/discount/commitment language | `currencyCommitmentFilter()` | Regex + phrase-list check on every piece of assembled text; strips offending sentences and appends a visible `[REDACTED]` marker. Demonstrated live in Demo Run 1 — the "similar exchange-value concerns" reference text is deliberately drafted with a price clause, and the UI shows it being removed. |
| Hardship/complaint signal short-circuits the pipeline | `hardshipScreen()` | Runs first, always, before Step 2b or Step 3 ever execute. Plain keyword/phrase matching over every free-text note linked to the resolved identity. |
| Named human owner on every logged action | `validateLedgerEntry()`, called from `logAction()` | Throws if `owner` is missing or blank — a real assertion, not a convention. Covered by 2 of the 13 unit tests. |
| No re-contact within 7 days, same journey | `contactedRecently()` | Checked before Step 1 proceeds in both `runConversion()` and `runReactivation()`. |
| No code path past the Gate | *(absence, not a function)* | Search the file for `negotiate`, `applyDiscount`, `confirmPrice`, `closeDeal` — none exist. Everything after `5 · GATE` in the trace is a description of what a human does next, never a function call. |

## One honest limitation, stated plainly

Step 2b ("why didn't the customer book") is a small set of deterministic keyword rules over the
free-text note, **not a real LLM call**. The build spec's default suggestion assumes an LLM API
key is available; this demo runs entirely client-side with no backend, and embedding an API key
in a static HTML file anyone can open would itself be a guardrail failure, not a shortcut. The
rule-based classifier is clearly labelled as such in the code and in the UI's justification text
for each classification — say this proactively if asked, rather than let it be discovered.

## Files

- `index.html` — the entire application (data, guardrails, pipeline, UI).
- `README.md` — this file.
- `NARRATION.md` — one paragraph per demo run, written so a teammate who didn't build this can
  present it cold, per build spec Section 7.6.
- `TEST_PLAN.md` — every record in the dataset run through the real pipeline functions, with
  actual (not predicted) outcomes, plus the 13 automated unit tests and 7 live behavioral checks.
- `PANEL_DEMO_GUIDE.md` — run-of-show, anticipated judge questions with answers, and a
  pre-demo checklist.

## Recording the actual demo

This app is ready to record; producing the video file itself is the one deliverable that has to
happen on your machine. Any screen recorder works (Windows `Win+Alt+R`, or OBS, or your browser
extension of choice). Suggested order for a single continuous take under 90 seconds combined:

1. Click **Demo Run 1**, narrate over the auto-play (~30–35s).
2. Click **Reset ledger** is *not* needed between runs — the ledger accumulating across both
   runs is itself part of the story (a real, growing, single-attribution log).
3. Click **Demo Run 2**, narrate the refusal (~25–30s).
4. Optionally click **Demo Run 3** if time allows (~20–25s).
5. Scroll down once at the end to show the Value Ledger with all rows populated.
