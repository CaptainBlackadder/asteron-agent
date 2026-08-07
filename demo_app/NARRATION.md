# Narration Script — Two Mandatory Demo Runs

Written so a teammate who didn't build this can present it cold. One paragraph per run, timed
to the build spec's targets (Run 1 ≈45s, Run 2 ≈30–45s).

---

## Demo Run 1 — The Happy Path

*Click "▶ Demo Run 1 — Happy Path," then narrate over Auto-play:*

> "This is Vishal, a customer in Mumbai who test-drove an SUV and didn't book. Watch what the
> agent does, step by step — this isn't one model call, it's seven separate, inspectable
> decisions. First it resolves his identity across our enquiry and test-drive records using his
> mobile number and vehicle ID. Then it runs a hardship screen — every single record goes
> through this check first, no exceptions — and here it's clear. Then it works out *why* he
> didn't book: an exchange-value concern, straight from the outcome tag on file. It writes a
> short brief for a human consultant — notice it pulls in a comparable case, and notice that
> reference text originally had a price line in it, which our pricing guardrail just stripped
> out live, right there. It proposes a slot inside the 48-hour window with his assigned
> consultant. And then it stops — that's the human gate. Everything from here — the price, the
> exchange value, the actual conversation — belongs to a person. The agent's job ends at a
> briefing note and a slot, and the ledger at the bottom just logged exactly that, with a named
> owner attached."

---

## Demo Run 2 — The Refusal

*Click "▶ Demo Run 2 — Refusal," then narrate over Auto-play:*

> "Now watch a different customer. Meera also test-driven a car, but somewhere in her record —
> not flagged, not tagged, just sitting in a free-text note from a phone call — she mentioned
> she's going through a tough financial patch and felt pressured. The agent's hardship screen
> catches that phrase before anything else runs. And here's the important part: it doesn't
> soften its usual message, it doesn't draft a gentler follow-up — it stops completely. No brief
> gets generated. No slot gets proposed. The only thing that happens is an escalation straight to
> a named person, and a log entry that says exactly what was refused and why. This is the
> thirty seconds that matters most in this whole demo: it's easy to show an AI system do more.
> This is a system choosing to do less, on purpose, because a person needs to be the one who
> responds here — not an algorithm."

---

## Optional Run 3 — Reactivation

*Click "▶ Demo Run 3 — Reactivation" if time allows:*

> "One more thing worth showing quickly — this is the same agent, running a completely different
> journey. Neha's car is due for service in a week. Same resolve step, same hardship screen —
> reused, not rebuilt — and here it's clear, so the agent drafts a service reminder and proposes
> a slot with her service advisor. Two journeys, one identity, one set of guardrails."

---

**Closing line, if there's time for one more sentence:**

> "Every row you've just seen land in that ledger has a named human owner. Nothing in this
> system acts without one, and nothing it refuses to do gets hidden — it gets logged."
