---
description: Run the Asteron warm-end conversion & service reactivation agent (no API key needed).
argument-hint: [--journey warm_end_conversion|service_reactivation|all] [--customer CUSTOMER_ID]
---

Run the **Asteron Agent** on: **$ARGUMENTS**

Execute it entirely with your own native tools — file read/write and your own reasoning. Do not
use any Anthropic SDK, API key, `node`, or `python`; there is no script to run, and there is
nothing to web-search — Asteron is fictional, so every fact lives in `knowledge_base/`.

Follow the seven-step pipeline defined in [`CLAUDE.md`](../../CLAUDE.md) Section 3 exactly, for
every matching customer record in `knowledge_base/sample_customers.json`:

1. **Resolve** — unify the customer's identity view.
2. **Detect** — classify the signal from `knowledge_base/customer_signal_taxonomy.json`, evidence-gated only.
3. **Assemble** — build the context pack per the matched signal's rules.
4. **Sequence** — decide timing against the journey's window in `knowledge_base/journey_definitions.json`.
5. **Gate** — check `knowledge_base/decision_boundaries.json`; hardship and customer-directed-pause always win and suppress everything else.
6. **Act** — consultant handoff (warm-end) or reactivate/handoff (service), per what Gate allowed.
7. **Log** — one ledger row per customer.

Parse `--journey` (default `all`) and `--customer` (default: every record) from the arguments.

Write the full per-customer trace using `templates/agent_trace_report.md` and the aggregate
using `templates/ledger_summary.md`, combined into one file at
`outputs/ASTERON_AGENT_RUN_[YYYYMMDD_HHMMSS].md`.

Honor `CLAUDE.md` Section 4's Key Principles — evidence over inference, hardship and
customer-directed-pause are never conflated, no unowned action, and every suppression is
reported as prominently as every successful handoff.

Finish with a console summary: customers processed, signal counts, gate-outcome counts, and an
explicit callout of any `suppressed_hardship` case.
