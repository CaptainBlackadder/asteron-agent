# Asteron Agent

An agentic AI built for the **Accenture B-School Challenge S10** industry & enterprise case
study, designed to be the working proof behind slide 4 ("One Identity, Two Journeys") of the
Asteron Motors strategy submission (`Asteron_Accenture_S10_Final.pptx`). It is not a mockup —
every claim the deck makes about what the agent does and refuses to do is backed by runnable
code in this repo.

**Live deployment:** https://asteron-agent.vercel.app
**Repo:** https://github.com/CaptainBlackadder/asteron-agent

---

## 1. What problem this solves

The case brief documents a company running 32 disconnected AI initiatives, only 43% with a
named owner, only 4 with verified benefit, and no shared identity layer between sales and
service systems. The deck's answer is one agent, two journeys, built on a shared identity
resolution step, with a hard human-only boundary and a single-attribution ledger so every
action (or refusal to act) has a named owner. This repo is that agent.

**What it does:** given a customer record — a completed test drive with no booking yet
(`warm_end_conversion`), or a lapsed/service-due customer (`service_reactivation`) — the agent
resolves identity, detects the signal behind the record from raw CRM/behavioral evidence,
assembles a context pack, decides timing, checks every proposed action against a strict
human-only boundary ("Gate"), then either hands off to a named human or executes a
pre-approved low-risk action — logging everything, including every refusal.

**What it deliberately never does:** quote a price or discount, value a trade-in, negotiate,
resolve a complaint, commit to a delivery date, approve credit, or make a staffing call. Those
stay human-only, always — this is enforced in code (regex/keyword guardrails), not just stated
in a prompt, and is true in every layer described below, including the LLM chat layer.

---

## 2. The three layers

This repo implements the same seven-step decision contract three times, at three different
levels of polish, for three different purposes. **They must never disagree** — `SKILLS.md` is
the source of truth; the other two are implementations of it.

| Layer | What it is | Needs an API key? | Purpose |
|---|---|---|---|
| **Design contract** (`CLAUDE.md` + `SKILLS.md`) | A pipeline Claude Code itself executes by reading the knowledge base and reasoning through each step, via the `/asteron_agent` command | No | The auditable "here is the reasoning, a human could follow this by hand" version. Read this first — everything else implements it. |
| **`demo_app/`** | One self-contained `index.html` — data, guardrails, and UI in a single file | No | The screen-recordable submission demo. Double-click and it runs, no server, no build, no key. Guardrails are literal JS functions, not prompts — see `demo_app/README.md`'s "show me the code" table. |
| **`web_app/`** | Static frontend + one Vercel serverless function (`api/chat.js`), sharing `pipeline.js` (the *same* decision engine as `demo_app/`, ported to be require()-able from Node) | Yes, for the chat only | The hosted, role-based version stakeholders can actually use: pick a role (Sales Consultant, Service Advisor, Dealer Principal, OEM Journey Owner, Judge/Observer), see live queues and the value ledger, and ask an LLM-backed chat assistant to *explain* decisions the deterministic engine already made. The chat never decides anything itself — see §4. |

Only `web_app/` calls an LLM. The other two layers are, by design, fully deterministic and
offline — this was a deliberate choice so the core claims in the deck don't depend on API
availability.

---

## 3. Repo map

```
CLAUDE.md                     Design contract entry point — defines /asteron_agent
SKILLS.md                     The seven-step loop, Detect discipline, Gate logic, ledger schema
scenario_design_notes.md      Which case fact grounds each sample customer

knowledge_base/
  case_facts.json               Ground-truth Asteron numbers from the case brief
  customer_signal_taxonomy.json The 7 signal types, evidence patterns, per-signal actions
  decision_boundaries.json      The human-only categories + Gate rule
  journey_definitions.json      The two journeys; how to add more later
  sample_customers.json         17 synthetic, case-grounded customer records

templates/                    Output formats for per-customer traces and run summaries
outputs/                      Timestamped run traces (generated, not hand-written)

demo_app/                     Offline single-file prototype (see demo_app/README.md)
  index.html / README.md / NARRATION.md / TEST_PLAN.md / PANEL_DEMO_GUIDE.md

web_app/                      Hosted stakeholder portal (see web_app/README_DEPLOY.md)
  index.html / app.js / styles.css   Static frontend
  pipeline.js                        Shared decision engine (loaded by both browser + api/chat.js)
  api/chat.js                        Vercel serverless function — the only thing that calls an LLM
  package.json / .env.example

Asteron_Agent_Build_Spec.md   The buildable spec demo_app/ and web_app/ implement
Asteron_Accenture_S10_Final.pptx   Submission deck
Asteron_Speaker_Notes.md      Per-slide delivery notes + arithmetic behind every deck number
asteron_deck_v4.html          Earlier HTML draft of the deck (superseded by the .pptx)
1785563478340_...pdf          Original case brief (source of all case facts)
```

---

## 4. The human-only boundary (Gate)

This is the single most important design decision in the project, enforced identically in all
three layers:

1. **Hardship or a customer-directed pause always suppresses action.** If a customer discloses
   distress (job loss, financial hardship, a complaint) or simply asks to be left alone, no
   further automated or handed-off customer-facing action happens — full stop. The suppression
   itself, with its logged rationale, is treated as a deliverable output, not "nothing to
   report."
2. **Seven categories are human-only, no matter how a request is phrased:** price/discount,
   exchange valuation, negotiation, complaint resolution, delivery commitments, credit
   decisions, dealer staffing. In `web_app/`, this is checked on the *incoming* chat message
   before any LLM call (`boundaryRequestScreen()` in `pipeline.js`) — a deterministic regex
   screen a phrasing trick can't talk around, because the LLM is never even called for a
   blocked request. The LLM's own replies are then also passed back through
   `currencyCommitmentFilter()` before being shown, in case a reply drifts into price/commitment
   language on a borderline question.
3. **No unowned action.** `validateLedgerEntry()` throws if a ledger row has no named human
   owner — a real assertion, not a convention.

If you extend this project, any new capability that could plausibly touch one of those seven
categories needs to go through Gate, not around it.

---

## 5. Running it

**Design contract (inside Claude Code):**
```
/asteron_agent [--journey warm_end_conversion|service_reactivation|all] [--customer CUSTOMER_ID]
```

**`demo_app/`:** double-click `demo_app/index.html`. No install, no server.

**`web_app/` locally** (needs Node ≥18 and a real Anthropic API key for the chat feature):
```bash
npm install -g vercel
cd web_app
cp .env.example .env   # fill in ANTHROPIC_API_KEY
vercel dev
```

**`web_app/` in production:** already deployed at asteron-agent.vercel.app, auto-deploying from
`master` on this repo. Root Directory in Vercel is set to `web_app`. Full deploy walkthrough
(including how to set environment variables) is in `web_app/README_DEPLOY.md`.

---

## 6. Known issue as of 2026-08-08

The chat feature on the live deployment currently returns:

```
Your credit balance is too low to access the Anthropic API.
```

The `ANTHROPIC_API_KEY` in Vercel is valid and correctly wired — the Anthropic account behind
that key simply has no usable credit. **Fix:** add credits at console.anthropic.com → Settings
→ Plans & Billing, for the same org the deployed key belongs to. No redeploy needed once that's
done.

Until then, the chat degrades gracefully rather than dead-ending: `api/chat.js` catches the
failed call and falls back to returning the same deterministic customer record
(`groundingContext`) it would otherwise have handed the LLM to explain, clearly labeled in the
UI as "on-file record, not a generated answer" (see the `fallback` field in the API response
and the corresponding message in `web_app/app.js`'s `sendChat()`). Everything else — Demo Runs
1–3, the boundary-refusal screen, the value ledger — never touches the API and is unaffected.

---

## 7. Changelog

| Date | Commit | Change |
|---|---|---|
| 2026-08-06 | `19652ab` | Repurposed an earlier (different-purpose) Claude Code project template into this agent; established `CLAUDE.md`/`SKILLS.md` as the design contract. |
| 2026-08-06 | `51f811a` | Fixed the `/asteron_agent` slash-command filename mismatch. |
| 2026-08-06 | `1c594b7` | Added a single-customer test run for the hardship-refusal case (C003) to validate Gate behavior end to end. |
| 2026-08-07 | `c7f14df` | Built `demo_app/` — the working, code-based, screen-recordable prototype implementing `Asteron_Agent_Build_Spec.md`. |
| 2026-08-07 | `0685118` | Added the full verified test plan and panel-presentation guide for `demo_app/`. |
| 2026-08-07 | `87ec621` | Added `web_app/` — the hosted, role-based stakeholder portal with an LLM chat layer on Vercel, sharing `pipeline.js` with `demo_app/`. |
| 2026-08-08 | `e31ebb3` | Made `api/chat.js` surface the Anthropic SDK's real error text (invalid key vs. bad model vs. billing) instead of one generic message. |
| 2026-08-08 | `3a2b155` | Added a graceful fallback: when the live LLM call fails, the chat returns the on-file record instead of erroring out, clearly labeled as non-generated. Diagnosed the live deployment's actual failure as an Anthropic account credit-balance issue, not a config problem (see §6). |
| 2026-08-08 | — | Added this README, consolidating the project overview and file map that were previously scattered across `CLAUDE.md`, `SKILLS.md`, and the two app-specific READMEs. |

---

## 8. Notes for whoever picks this up next

- **Read `SKILLS.md` before changing any decision logic.** It's short (~6KB) and is the actual
  spec — `demo_app/` and `web_app/pipeline.js` are both supposed to match it exactly. If they
  ever disagree, `SKILLS.md` wins and the code should be fixed to match it, not the reverse.
- **`pipeline.js` is loaded by both the browser and the Vercel function** (see the UMD wrapper
  at the top of the file) specifically so there is one copy of every guardrail, not two that
  could drift apart. Do not fork it.
- **The demo clock is pinned** (`DEMO_NOW` in `pipeline.js` / `demo_app/index.html`) so that
  "within the 48-hour window" behavior is reproducible on any machine, any day. If sample data
  changes, that constant may need to move forward with it.
- **Never commit an API key.** `web_app/.env` is gitignored; only `.env.example` (no real key)
  is tracked. The live key lives only in Vercel's environment variables.
- **This is a fictional company on fictional data** (`scenario_design_notes.md` documents which
  case fact grounds each synthetic record) — there is nothing to fetch from the real world, and
  no case-real customer data is or should ever be involved.
