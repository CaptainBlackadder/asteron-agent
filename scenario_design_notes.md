# Sample Customer Design Notes

Not part of the agent's input — this documents which case fact or deck fact each record in
`knowledge_base/sample_customers.json` is grounded in, so the dataset's methodology can be
defended to a judge, not just presented. All names, cities-in-context, and behavioral detail are
fictional, in keeping with the case brief's own convention.

The rule applied throughout: **every scenario ties to a real number or fact from the case brief
or the deck; nothing is invented from a blank page.** Field notes are written the way a rushed
CRM entry actually reads, not the way a case study summarizes one.

| ID | Grounding |
|---|---|
| C001 | 62% of test-drivers never book (case); EMI-calculator repeat-use as a proxy for finance hesitation, not disinterest. |
| C002 | "4 of 5 benchmarked rivals" use AI/compete on features (case); named fictional rival "Solara" for texture. |
| C003 | The case's own agentic-AI definition — "people remain accountable for decisions that affect customers" — made concrete as the flagship refusal case; ₹25,000 token figure kept consistent with typical booking-deposit conventions referenced nowhere else, deliberately modest. |
| C004 | Dealer economics section's exchange/trade-in dependency; used to test that the agent never quotes a valuation. |
| C005 | 16-hour avg first response / 32% of leads not contacted in 24h (case) — used to construct a "genuinely gone cold" case distinct from hardship or hesitation. |
| C006 | Deliberately built to be confusable with hardship, to test the customer_directed_pause vs. hardship boundary explicitly. |
| C007 | EV context (Project Vega, 420 EV-ready outlets) + a second fictional rival "Velicore" for the EV segment specifically; tests multi-signal handling. |
| C008 | Mirrors C004's exchange theme at lower intensity, to test that signal strength (not just signal type) affects Sequence, not just Detect. |
| C009 | 48-hour "golden window" from deck slide 4 — built specifically to test that the agent doesn't over-escalate before the window elapses. |
| C010 | Marketing cost per retail sale +31% (case) — grounds why exhausting attempts on a truly cold lead is a real cost, not a free action. |
| C011 | 46% service retention by year 3 (case) — the routine-lapse baseline case, deliberately signal-free to test the agent doesn't manufacture drama where none exists. |
| C012 | 66% first-contact resolution vs. industry benchmark (case) — a customer who fell through exactly that gap; tests the complaint_resolution boundary outside the 5-signal taxonomy. |
| C013 | Repeat purchase 27% (case) — the loyalty/upsell pathway; tests the price boundary in a non-sales-channel context. |
| C014 | Project Vega / EV-readiness infrastructure (case) — tests the delivery_commitments boundary on a purely operational issue. |
| C015 | A second, differently-shaped hardship case (bereavement vs. job loss) — deliberately resolves differently from C003 to prove the rule is "suppress and respect the customer's own terms," not a single scripted response. |
| C016 | Active mobile-app engagement <40% after year 1 (case) — inverted into a customer who *is* still engaging, to test channel-matching rather than defaulting to a call. |
| C017 | Built to have no specific evidence at all, to test that the agent reports insufficient_evidence honestly rather than forcing a classification. |
