# Test Plan — Asteron Agent Demo App

Every result below was actually executed against `index.html` via its real pipeline functions
(`runConversion`, `runReactivation`, `resolveCustomer360`, `hardshipScreen`,
`currencyCommitmentFilter`, `validateLedgerEntry`, `contactedRecently`) — not predicted, not
hand-traced. Reproduce any row yourself by opening the app, opening the browser console, and
running the same call shown in the "Verify yourself" column.

---

## 1. Automated unit tests (run on every page load)

13 tests, covering both hard-coded guardrails plus the two schema/dedupe rules. Result on load:
**13/13 passed** — visible in the top-right badge, expandable via "details."

| # | Test | Guardrail exercised |
|---|---|---|
| 1 | Hardship screen fires on "lost his job" + "can't afford" | `hardshipScreen()` |
| 2 | Hardship screen fires on "cheated" / complaint language | `hardshipScreen()` |
| 3 | Hardship screen fires on "tough financial patch" + "pressured" | `hardshipScreen()` |
| 4 | Hardship screen does **not** fire on a neutral exchange-value note | `hardshipScreen()` (false-positive check) |
| 5 | Hardship screen does **not** false-positive on an empty note | `hardshipScreen()` (robustness) |
| 6 | Hardship screen does **not** false-positive on a customer-pause request alone | `hardshipScreen()` (precision — pause ≠ hardship) |
| 7 | Currency filter catches a ₹ amount | `currencyCommitmentFilter()` |
| 8 | Currency filter catches a percentage discount | `currencyCommitmentFilter()` |
| 9 | Currency filter catches "we will guarantee" | `currencyCommitmentFilter()` |
| 10 | Currency filter does **not** flag plain scheduling language ("48 hour window") | `currencyCommitmentFilter()` (false-positive check) |
| 11 | Ledger validation throws with no owner | `validateLedgerEntry()` |
| 12 | Ledger validation throws with an empty-string owner | `validateLedgerEntry()` |
| 13 | Dedupe guard blocks a second contact within 7 days | `contactedRecently()` |

**Verify yourself:** open the app, click "details" next to the self-test badge, or open DevTools
console and run `runGuardrailTests()`.

---

## 2. Full-dataset regression — every record, actual verified output

Run via the "run full regression, all records" link in the footer, which calls the same
`runConversion()`/`runReactivation()` functions the UI uses, against a throwaway ledger so it
never pollutes your demo session.

| ID | Customer | Journey | Outcome | Owner | Detail |
|---|---|---|---|---|---|
| TD001 | Rakesh Verma | conversion | proceeded_to_gate | Omkar Deshmukh (SC-D014) | reason: finance_hesitation |
| TD002 | Ananya Reddy | conversion | proceeded_to_gate | Meenakshi Iyer (SC-D027) | reason: competitor_mentioned |
| TD003 | Vishal Nair | conversion | proceeded_to_gate | Alisha Fernandes (SC-D009) | reason: exchange_value_concern — **Demo Run 1** |
| TD004 | Priya Iyer | conversion | proceeded_to_gate | Faisal Ahmed (SC-D041) | reason: no_response (outcome_captured=false, noise record) |
| TD005 | Karthik Subramaniam | conversion | proceeded_to_gate | Vikram Chauhan (SC-D052) | reason: no_clear_signal — customer-pause note correctly **not** treated as hardship |
| TD006 | Farah Sheikh | conversion | proceeded_to_gate | Priyank Trivedi (SC-D061) | reason: finance_hesitation (multi-signal note; rule precedence picks finance over competitor — documented limitation) |
| TD007 | Devika Menon | conversion | proceeded_to_gate | Sourav Dutta (SC-D033) | reason: exchange_value_concern |
| TD008 | Aditya Ghosh | conversion | proceeded_to_gate | Sourav Dutta (SC-D033) | reason: exchange_value_concern |
| TD009 | Sunita Rao | conversion | proceeded_to_gate | Bhavesh Patel (SC-D077) | reason: no_response — **slot OUTSIDE 48h window** (honest failure mode) + no-VIN flag |
| TD010 | Sameer Joshi | conversion | proceeded_to_gate | Priyank Trivedi (SC-D061) | reason: no_clear_signal ("still deciding" correctly not force-classified) |
| TD011 | Meera Krishnan | conversion | **escalated_hardship** | Nikhil Rao | hardship: "pressured" — **Demo Run 2** |
| TD012 | Imran Qureshi | conversion | **escalated_hardship** | Nikhil Rao | hardship: "can't afford" — discoverable, non-scripted |
| TD013 | Zoya Ahmed | conversion | **escalated_hardship** | Faisal Ahmed | hardship: "complaint" — discoverable, non-scripted |
| TD017 | Arjun Malhotra | conversion | proceeded_to_gate | Rohan Malhotra (SC-D002) | reason: finance_hesitation |
| TD018 | Farhan Ali | conversion | proceeded_to_gate | Bhavesh Patel (SC-D077) | reason: no_clear_signal (empty note) — **slot OUTSIDE 48h window** + no-VIN flag |
| SR-N1 | Neha Kapoor | reactivation | proceeded_to_gate | Ravi Kulkarni (SV-D009) | clean reactivation — **Demo Run 3** |
| SR-R1 | Ramesh Chandran | reactivation | proceeded_to_gate | Prakash Raman (SV-D027) | clean reactivation |
| SR-L1 | Lakshmi Pillai | reactivation | proceeded_to_gate | Snehal Patil (SV-D014) | clean reactivation |
| SR-Z1 | Zoya Ahmed | reactivation | **escalated_hardship** | Divya Reddy | hardship: "complaint" — pulled from her **older, unrelated test-drive record**, proving Resolve + hardship screen are genuinely shared across journeys, not just claimed to be |

**19/19 records produced the expected outcome. Zero crashes, zero `undefined` values.**

**Verify yourself:** click the footer link, or run `runFullRegression()` in the console.

---

## 3. Live behavioral checks (beyond the built-in unit tests)

These test interactions between functions that the unit tests check in isolation but the demo
actually depends on end-to-end.

| # | Test | How to run it | Verified result |
|---|---|---|---|
| 1 | **Dedupe guard, live, not just unit-tested** | `runConversion("TD001")` twice in a row | 1st call → `proceeded_to_gate`; 2nd call → `deduped_skipped`, ledger gains exactly 2 rows |
| 2 | **No-VIN partial match is flagged, not silently dropped** | `resolveCustomer360("9925099900").flags` (Sunita Rao) | Returns the manual-review-queue flag |
| 3 | **A record with a VIN does NOT get the no-VIN flag** | `resolveCustomer360("9930033344").flags` (Vishal Nair) | Returns `[]` (no false positive) |
| 4 | **Outside-window slot is shown, not hidden** | Run TD009 or TD018 (both route through outlet D077, whose sales consultant's slots are all >48h out by design) | Trace step 4 says "OUTSIDE the 48-hour target window — earliest available slot shown honestly" |
| 5 | **Cross-journey hardship carryover** | Run `SR-Z1` (Zoya Ahmed's *service* record) | Escalates on a note that lives only in her *test-drive* record (`TD013`) — proves Resolve pulls the full identity, not just the triggering table |
| 6 | **Guardrail redaction is visible, not just logical** | Run Demo Run 1 (`TD003`) and read the Assemble step | The comparable-resolution text visibly loses its price clause and gains a `[REDACTED — price/commitment language removed by guardrail]` marker, with a yellow guardrail-note banner explaining what was removed |
| 7 | **No code path exists past the Gate** | `grep -iE "negotiate|applyDiscount|confirmPrice|closeDeal" index.html` | No matches — structural, not tested by execution |

---

## 4. UI / interaction test cases

| # | Action | Expected result |
|---|---|---|
| 1 | Load the page | Self-test badge shows `13/13 passed` in green; queue lists 15 conversion + 4 reactivation rows |
| 2 | Click "▶ Demo Run 1" | Trace panel starts revealing; "Next step ▶" and "Auto-play ▶▶" appear |
| 3 | Click "Next step ▶" repeatedly | One step appears per click, in order, ending on the Gate step; Consultant Inbox populates only after the last step |
| 4 | Click "Auto-play ▶▶" mid-run | Remaining steps reveal automatically (~0.9s apart) without needing further clicks |
| 5 | Click any non-Demo-Run queue row | Same 7-step pipeline runs on that record; ledger gains a row |
| 6 | Click "Reset ledger" | Value Ledger clears to "No actions logged yet"; trace and inbox panels reset to their empty states |
| 7 | Run 3+ records without resetting | Ledger accumulates all of them, most recent on top, each with a distinct colored outcome badge |
| 8 | Click "run full regression, all records" | A results panel appears below the ledger listing all 19 records' outcomes; the real Value Ledger above is unaffected (still shows only what you'd run in this session) |

---

## 5. What was deliberately *not* built (and why that's not a gap)

- **No real LLM call for Step 2b.** Documented as a stated design decision in `README.md` — a
  static file with an embedded API key would itself be a guardrail failure. Don't let a judge
  discover this; say it first.
- **No path past the Gate, even a stubbed one.** This is a requirement from the build spec
  (Section 3, Step 5), not an oversight — a stubbed "agent negotiates" function was explicitly
  called out as something that looks bad under code review.
- **Rule-precedence limitation on multi-signal notes** (TD006, TD012 both mention two things;
  the first matching rule wins). Documented in the code comment above `classifyReason()` and in
  `README.md`. This is an honest, disclosed limitation of a deterministic rule-based classifier,
  consistent with the deck's own "honesty over polish" standard (see `Asteron_Speaker_Notes.md`,
  Slide 4's note on the "40 minutes a day" correction).
