# Presenting the Agent to the Evaluation Panel

This ties together `NARRATION.md` (what to say), `TEST_PLAN.md` (what's been verified), and
`README.md` ("show me the code" answers) into one run-of-show. Read this once before the actual
session; use `NARRATION.md` for the words themselves.

---

## 1. What you are actually proving, in one sentence

Slide 4 of the deck makes a claim — *an agent that resolves identity, detects a real signal,
briefs a human, and refuses to act on distress.* This app is that claim made checkable: every
guardrail is a named function a judge can ask to see, every decision is logged, and the refusal
is a real cancelled action, not a line of dialogue.

The single sentence to have ready if a judge asks "why should we believe this over a slide":
**"Because you can ask me to show you the line of code, and I can."**

---

## 2. Recommended run of show (≈2–3 minutes live, or pre-recorded per the submission rule)

| Time | What happens | What you say |
|---|---|---|
| 0:00–0:10 | Load the app, point at the self-test badge | "Before anything else runs, the app checks its own guardrails — 13 tests, both hard-coded rules, passing right now." |
| 0:10–0:45 | Click **Demo Run 1**, Auto-play | Use `NARRATION.md` Run 1 script. Pause on Step 3 to point at the `[REDACTED]` marker — "that's the pricing guardrail actively removing a line, not a hypothetical." |
| 0:45–1:20 | Click **Demo Run 2**, Auto-play | Use `NARRATION.md` Run 2 script. Let the red escalation banner sit on screen for a beat before moving on — this is the moment the whole demo earns its trust. |
| 1:20–1:40 | *(optional)* Click **Demo Run 3** | Use the optional narration paragraph — shows the second journey without spending much time. |
| 1:40–2:00 | Scroll to the Value Ledger | "Every action you just watched — including the one it refused — is in this ledger, with a named owner. Nothing here is unattributed." |
| 2:00+ | *(if time / if asked)* Click the footer's "run full regression" link | "This isn't tuned for the two runs you just saw — here's all 19 records in the dataset, run the same way, right now." |

If you only have time for one thing beyond the two mandatory runs, make it the Value Ledger
scroll — it's the visual proof of "single-attribution ledger," a phrase the deck uses on three
separate slides.

---

## 3. Likely panel questions and where the answer actually lives

| Question | Answer | Where to point |
|---|---|---|
| "Is that refusal just hardcoded for this one customer?" | No — click any other queue row containing hardship language (Imran Qureshi, or Zoya Ahmed's *reactivation* row, which pulls the signal from an unrelated older record). | `TEST_PLAN.md` §3, row 5; live click in the app |
| "What if I ask it to just give a discount?" | There's no function in this codebase that can do that — not a disabled one, not a stubbed one. | `grep` the source live for `negotiate`/`applyDiscount`/`closeDeal` — nothing returns |
| "Where does the pricing guardrail actually run?" | `currencyCommitmentFilter()`, called from `assembleBrief()` before any text reaches the screen — visibly redacted in Run 1. | `README.md`, "Where the guardrails actually live" table |
| "Is the reason classification a real AI model?" | No, and we're saying that upfront: it's deterministic keyword rules standing in for an LLM call, because embedding an API key in a static file would itself be a guardrail failure. | `README.md`, "One honest limitation" |
| "Does this scale past 19 records?" | The pipeline logic doesn't know the dataset size — Resolve/Detect/Assemble/Sequence/Gate/Log are all pure functions over whatever records exist. The full-regression link demonstrates that on every record, not a cherry-picked pair. | `TEST_PLAN.md` §2 |
| "What happens if two different signals are both present?" | Handled, with a disclosed limitation: the first matching rule wins (see `TD006`). We'd rather show you the seam than hide it. | `TEST_PLAN.md` §5 |
| "How is this different from the earlier markdown-based version?" | That version is still here — `SKILLS.md`/`knowledge_base/` — as the design contract a human can read and reason from. This app is the same logic re-expressed as literal, testable code, per the build spec's explicit requirement that a guardrail be a line you can point to, not a rule an LLM is asked to follow. | `CLAUDE.md`, "Relationship to demo_app/" |

---

## 4. Pre-demo checklist

- [ ] Open `index.html` fresh (or click "Reset ledger") so the Value Ledger starts empty and
      fills up live during the actual presentation — a growing ledger reads better than a
      pre-populated one.
- [ ] Confirm the self-test badge reads `13/13 passed` before you start talking.
- [ ] Have `NARRATION.md` open on a second screen or printed — don't paraphrase from memory live.
- [ ] Know which row is Imran Qureshi's (Bengaluru, conversion) in case you're asked to prove the
      refusal isn't scripted to one ID.
- [ ] If presenting live rather than from a recording, widen the browser window first — the
      3-panel layout compresses awkwardly under ~900px.

## 5. If something goes wrong live

- **A step doesn't render / looks stuck:** click "Reset ledger," then re-click the Demo Run
  button. State lives entirely in the page's JS memory, so a reset is always clean.
- **You're asked something the app can't answer live:** say so directly — "that's not what this
  prototype demonstrates; it's [in the strategy deck / a Year 2 build item]" — and move on. The
  deck's own honesty standard (see `Asteron_Speaker_Notes.md`) rewards a clean "not in scope"
  over a stretched answer.
