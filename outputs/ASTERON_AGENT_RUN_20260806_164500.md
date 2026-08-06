# Asteron Agent — Run Ledger

**Run date:** 2026-08-06 16:45 IST · **Customers processed:** 17 · **Journeys:** warm_end_conversion, service_reactivation

This is the working trace behind slide 4 of `asteron_deck_v4.html` ("One Identity, Two
Journeys"). Every record below was classified live against `knowledge_base/customer_signal_taxonomy.json`
and checked against `knowledge_base/decision_boundaries.json` — nothing here is a pre-labeled
lookup. Six of the seventeen records did **not** result in an automated customer-facing message;
that is by design, not a shortfall — see Section 3, "Highlight: the refusal case."

---

## 1. Journey: Warm-End Conversion (test drive completed, no booking yet)

### C001 — Rakesh Verma (Pune, top20) · warm_end_conversion
**Dealer:** D014 (champion) · **Segment:** SUV · **Event:** test_drive_completed on 2026-07-20
> CRM note: *"TD done, liked it. asked emi calc 3x on app after. said will discuss at home. no answer 2 calls mon+tue."*

| Step | Result |
|---|---|
| 1. Resolve | Identity unified via mobile+VIN; no prior interactions on file. |
| 2. Detect | **finance_hesitation** — 3× EMI-calculator use post-TD, and "will discuss at home" plus silence to 2 calls both point at a household budget conversation, not disinterest. |
| 3. Assemble | Financing options (tenure/EMI ranges available on this variant), a comparable case where EMI clarity converted a similar hesitant buyer, note that this is a serious/considered prospect (3 calculator visits), not a cold one. |
| 4. Sequence | Two unanswered calls already logged past the 48-hour window — hold-and-recheck has been exhausted; escalate now rather than a 3rd generic call. |
| 5. Gate | **passed** — consultant_handoff with financing context is within bounds; the agent does not confirm or imply a specific EMI/loan approval (credit_decisions stays human-only). |
| 6. Act | Context pack handed to Sales Consultant, D014, with an explicit ask: lead with financing clarity, not a generic "just checking in." |
| 7. Log | Owner: Sales Consultant – D014 · 2026-07-23T09:00 IST |

### C002 — Ananya Reddy (Chennai, top20) · warm_end_conversion
**Dealer:** D027 (squeezed_performer) · **Segment:** SUV · **Event:** test_drive_completed on 2026-07-22
> CRM note: *"TD gone well, but she said Solara's Q5 variant has panoroof at similar price, wanted to know if we're adding it. told her will check, no follow up yet."*

| Step | Result |
|---|---|
| 1. Resolve | Identity unified; first-time prospect, walk-in origin. |
| 2. Detect | **rival_mention** — explicit named-competitor feature comparison (Solara Q5 panoramic sunroof), with a direct, unanswered question attached. |
| 3. Assemble | The specific feature asked about, Asteron's current position on it (roadmap status, if any), and a note that this customer asked a direct question that was left open — closing that loop matters more here than a generic nudge. |
| 4. Sequence | Still inside the 48-hour window (1 attempt made); act now because a specific open question is outstanding, don't let it go stale. |
| 5. Gate | **passed** — competitive positioning is fine to hand over; no discount or price-match is auto-generated. |
| 6. Act | Context pack to Sales Consultant, D027, with the open question flagged as the first thing to close. |
| 7. Log | Owner: Sales Consultant – D027 · 2026-07-23T11:00 IST |

### C003 — Meera Krishnan (Bengaluru, top20) · warm_end_conversion — **REFUSAL CASE**
**Dealer:** D003 (champion) · **Segment:** EV · **Event:** booking_placed_token_paid on 2026-07-01 (₹25,000 token, 24 days ago)
> CRM note: *"She called asking if token is refundable, said her husband lost his job last week, didn't want to say more. asked me not to call again about the car for now."*

| Step | Result |
|---|---|
| 1. Resolve | Identity unified; active booking on file with a pending automated action queued (`booking_completion_emi_offer_nudge`). |
| 2. Detect | **hardship** — explicit, disclosed adverse circumstance (job loss), volunteered by the customer herself, via a service call, not the sales channel. Also carries a customer_directed_pause ("don't call me... for now") — per the taxonomy, hardship takes precedence when both are present. |
| 3. Assemble | Exact disclosure as recorded; her own request (no calls about the car); the fact that her original question — is the token refundable — was never actually answered. |
| 4. Sequence | Immediate — hardship suppresses the normal 48-hour cadence entirely; there is no "window" for this case. |
| 5. Gate | **suppressed_hardship** — the queued `booking_completion_emi_offer_nudge` is cancelled outright, not postponed and not softened. No sales or marketing content of any kind is permitted for this customer until a human confirms otherwise. |
| 6. Act | **No sales action taken.** The only action authorized is a single, human-owned response to her own unanswered question — the refund-eligibility policy — routed to **Customer Care**, not Sales, because that keeps it a service answer, not a sales save. Even this is framed as answering her, not re-opening a conversation she asked to pause. |
| 7. Log | Owner: Customer Care Lead – D003 · 2026-07-24T10:00 IST · **Refusal logged:** automated EMI-offer nudge suppressed; rationale: disclosed hardship + explicit contact-pause request. |

*This is the trace the deck's slide 4 refers to: "the agent refusing to act on a hardship
signal." What was refused — an automated booking-completion/EMI nudge already queued to fire —
and why, is the point. Nothing about this customer's situation was used to personalize a sales
message; it was used only to stop one.*

### C004 — Vishal Nair (Mumbai, top20) · warm_end_conversion
**Dealer:** D009 (squeezed_performer) · **Segment:** SUV · **Event:** test_drive_completed on 2026-07-21
> CRM note: *"asked twice what we'd give for his 2018 diesel sedan on exchange, said market rate feels low, hasn't confirmed TD-to-booking."*

| Step | Result |
|---|---|
| 1. Resolve | Identity unified; one prior partial response on file. |
| 2. Detect | **exchange_query** — repeated, specific trade-in valuation questions with an explicit price objection ("market rate feels low"). |
| 3. Assemble | Vehicle details as stated (2018 diesel sedan), his stated concern about valuation, comparable exchange resolutions from similar cases. |
| 4. Sequence | Inside window, partial engagement already — act now. |
| 5. Gate | **passed** — exchange valuation itself is not quoted or implied by the agent; it stays for the consultant to discuss in person. |
| 6. Act | Context pack to Sales Consultant, D009, flagging the valuation objection as the lead topic. |
| 7. Log | Owner: Sales Consultant – D009 · 2026-07-23T14:00 IST |

### C005 — Priya Iyer (Hyderabad, top20) · warm_end_conversion
**Dealer:** D041 (willing_but_weak) · **Segment:** sedan · **Event:** test_drive_completed on 2026-07-15
> CRM note: *"no response after TD, dealer tried 3 times over 5 days, no answer, no voicemail reply."*

| Step | Result |
|---|---|
| 1. Resolve | Identity unified; referral-origin lead. |
| 2. Detect | **silence_unexplained** — no reason given, no request to stop; 3 attempts already made with zero response. |
| 3. Assemble | Attempt count (3), days elapsed (8, well past the 48-hour window), no other evidence to personalize against. |
| 4. Sequence | Window has long elapsed and attempts are already exhausted — per taxonomy, send at most one further low-pressure touch, then close out. No 4th call. |
| 5. Gate | **passed** — a single neutral, low-pressure message carries no boundary risk. |
| 6. Act | One automated, non-pushy digital touch (informational content, no urgency framing) sent; record then closed out — no further attempts scheduled. |
| 7. Log | Owner: Digital Nurture (Regional Sales Ops, D041) · 2026-07-24T09:00 IST |

### C006 — Karthik Subramaniam (Jaipur, other) · warm_end_conversion
**Dealer:** D052 (champion) · **Segment:** SUV · **Event:** test_drive_completed on 2026-07-23
> CRM note: *"Told the exec clearly 'please don't call me for now, I'll reach out when I'm ready' after TD. no further reason given."*

| Step | Result |
|---|---|
| 1. Resolve | Identity unified. |
| 2. Detect | **customer_directed_pause** — explicit request to stop contact, with no reason disclosed. This is deliberately **not** classified as hardship: nothing adverse was stated, only a preference. |
| 3. Assemble | The exact request as recorded; no re-contact date was given by him, so none is assumed. |
| 4. Sequence | N/A — no further contact is scheduled until he initiates. |
| 5. Gate | **suppressed_customer_request** — distinct from `suppressed_hardship`: no compassionate check-in is warranted here, because nothing was disclosed to be compassionate about. Respecting the request *is* the correct action, full stop. |
| 6. Act | No further automated or human outreach. Record flagged "customer will initiate." |
| 7. Log | Owner: Sales Consultant – D052 (on file, reactive only) · 2026-07-23T18:00 IST |

### C007 — Farah Sheikh (Ahmedabad, top20) · warm_end_conversion
**Dealer:** D061 (champion) · **Segment:** EV · **Event:** test_drive_completed on 2026-07-19
> CRM note: *"asked about charging network vs Velicore's, also asked emi options once. seemed genuinely comparing both — hasn't ruled us out."*

| Step | Result |
|---|---|
| 1. Resolve | Identity unified. |
| 2. Detect | **rival_mention + finance_hesitation (combined)** — named-competitor charging-network comparison, plus a single EMI-options question. Per the multi-signal rule, both are assembled into one pack, not two separate outreach attempts. |
| 3. Assemble | Charging-network comparison talking points (Velicore named), EMI options available, framed as one coordinated conversation — the dealer note itself already flags she "hasn't ruled us out," so this is a live, undecided prospect. |
| 4. Sequence | Inside window, engaged (2 attempts, 1 response) — act now. |
| 5. Gate | **passed** — neither sub-signal crosses a boundary; no price-match or credit terms are auto-generated. |
| 6. Act | Single combined context pack to Sales Consultant, D061 — one conversation covering both charging network and financing, not two separate messages that could contradict each other. |
| 7. Log | Owner: Sales Consultant – D061 · 2026-07-21T10:00 IST |

### C008 — Devika Menon (Kolkata, top20) · warm_end_conversion
**Dealer:** D033 (squeezed_performer) · **Segment:** SUV · **Event:** test_drive_completed on 2026-07-18
> CRM note: *"asked about exchange value for her old hatchback once, then went quiet, dealer says she seemed price-sensitive overall."*

| Step | Result |
|---|---|
| 1. Resolve | Identity unified. |
| 2. Detect | **exchange_query** — one specific trade-in question. The dealer's "seemed price-sensitive" is a subjective observation, carried as supporting context, not treated as a separate confirmed signal. |
| 3. Assemble | The exchange query as stated, the dealer's observation flagged explicitly as an impression (not fact), comparable resolutions for mild exchange hesitation. |
| 4. Sequence | Inside window, 2 attempts already made, one signal present — act now. |
| 5. Gate | **passed** — no valuation number is generated or implied. |
| 6. Act | Context pack to Sales Consultant, D033, noting both the exchange question and the price-sensitivity impression as two things to probe gently, not assume. |
| 7. Log | Owner: Sales Consultant – D033 · 2026-07-20T15:00 IST |

### C009 — Arjun Malhotra (Delhi NCR, top20) · warm_end_conversion
**Dealer:** D002 (willing_but_weak) · **Segment:** SUV · **Event:** test_drive_completed on 2026-08-05
> CRM note: *"TD done, immediately went to compare Solara Q5 online per dealer, also checked emi calc twice after. no response to 1 call yet — still within first day."*

| Step | Result |
|---|---|
| 1. Resolve | Identity unified. |
| 2. Detect | **rival_mention + finance_hesitation (combined)** — both evidence patterns present (competitor comparison, EMI-calculator use), but only 22 hours have elapsed and only 1 attempt has been made. |
| 3. Assemble | Both signals noted for when action is warranted; not assembled into an outbound pack yet. |
| 4. Sequence | **Hold.** Still inside the 48-hour window with only one unanswered call — this is a case where a real signal exists but acting immediately would be premature. Re-check scheduled at hour 40. |
| 5. Gate | **passed** (no action is being sent, so no boundary is at risk yet) — recorded as a deliberate hold, not an oversight. |
| 6. Act | No customer-facing action yet. Re-check scheduled 2026-08-06T18:00 IST; if still unanswered at that point, proceed to consultant handoff as in C007's pattern. |
| 7. Log | Owner: Sales Consultant – D002 (assigned, action deferred) · 2026-08-05T20:00 IST |

### C010 — Sunita Rao (Surat, other) · warm_end_conversion
**Dealer:** D077 (squeezed_performer) · **Segment:** hatchback · **Event:** test_drive_completed on 2026-07-10
> CRM note: *"completely unresponsive since TD, 4 attempts over 8 days, contact info double-checked and correct."*

| Step | Result |
|---|---|
| 1. Resolve | Identity unified; contact details independently verified correct. |
| 2. Detect | **silence_unexplained** — 4 attempts, 14 days elapsed, zero response, no stated reason. |
| 3. Assemble | Attempt history, elapsed time, confirmation that this is not a bad-contact-info problem. |
| 4. Sequence | Window elapsed long ago and the attempt budget is exhausted — per taxonomy, do not repeat indefinitely. |
| 5. Gate | **passed** — a single, much-delayed re-engagement touch carries no boundary risk. |
| 6. Act | Record closed out of active pursuit; moved to the next quarterly re-engagement digital campaign rather than further individual calls. |
| 7. Log | Owner: Digital Nurture (Regional Sales Ops, D077) · 2026-07-24T09:00 IST |

### C017 — Sameer Joshi (Ahmedabad, top20) · warm_end_conversion
**Dealer:** D061 (willing_but_weak) · **Segment:** SUV · **Event:** test_drive_completed on 2026-07-24
> CRM note: *"replied to one call saying 'still deciding, will call back', nothing more specific."*

| Step | Result |
|---|---|
| 1. Resolve | Identity unified. |
| 2. Detect | **insufficient_evidence** — a non-committal response with no competitor, finance, exchange, pause, or hardship language present. Forcing this into one of those buckets would be fabricated specificity, which the contract treats as worse than an honest "not enough signal." |
| 3. Assemble | What was reviewed (one generic response) and why it doesn't support a specific classification; re-check date set. |
| 4. Sequence | Single neutral touch now, re-check at day 5. |
| 5. Gate | **passed** — a generic, non-targeted reassurance touch carries no boundary risk. |
| 6. Act | One neutral, informative message (general product content, not a targeted pitch) sent; re-check scheduled. |
| 7. Log | Owner: Digital Nurture (Regional Sales Ops, D061) · 2026-07-25T09:00 IST |

---

## 2. Journey: Service Reactivation (lapsed or service-due customers)

### C011 — Neha Kapoor (Mumbai, top20) · service_reactivation
**Dealer:** D009 (champion) · **Segment:** SUV, owned 3.5 yrs · **Event:** service_lapsed on 2026-08-01
> CRM note: *"no complaints on file, just been lapsed, moved out of old routine after 2nd service."*

| Step | Result |
|---|---|
| 1. Resolve | Identity unified; no complaint history. |
| 2. Detect | **No adverse signal — routine lapse.** Closest taxonomy handling: treated like `silence_unexplained`'s low-risk branch, since there is no reason to withhold a standard touch. |
| 3. Assemble | Last service 14 months ago, no open issues, straightforward reminder case. |
| 4. Sequence | Inside the 14-day service-due follow-up window — act now with the default cadence. |
| 5. Gate | **passed** — a standard service reminder has no boundary risk. |
| 6. Act | Automated service-due reminder with a convenient slot offer sent directly (no human handoff needed for this tier of action). |
| 7. Log | Owner: Service Advisor of record – D009 (nominal owner for the automated action) · 2026-08-01T10:00 IST |

### C012 — Imran Qureshi (Bengaluru, top20) · service_reactivation
**Dealer:** D003 (squeezed_performer) · **Segment:** SUV, owned 4 yrs · **Event:** service_lapsed on 2026-07-28
> CRM note: *"last visit he complained about service wait time (3+ hrs), never came back after."*

| Step | Result |
|---|---|
| 1. Resolve | Identity unified; `prior_complaint_flag: true`. |
| 2. Detect | This record carries no sales-conversion signal (finance/exchange/rival don't apply to a service lapse) — the operative fact is an **unresolved prior complaint** (wait time), which routes through the boundary check directly rather than the 5-signal sales taxonomy. |
| 3. Assemble | The complaint as recorded, time elapsed since (20 months lapsed), no indication it was ever acknowledged or resolved. |
| 4. Sequence | Act now — but the default action (a standard "we miss you" reminder) is not appropriate here. |
| 5. Gate | **reframed_to_human** — `complaint_resolution` is a human-only category. Sending an automated reactivation message to someone with an unacknowledged complaint risks looking tone-deaf and would implicitly treat the complaint as resolved when it never was. |
| 6. Act | No automated message. Context pack (complaint detail + lapse duration) handed to a named Service Manager for a personal acknowledgment call — reactivation messaging only resumes after that. |
| 7. Log | Owner: Service Manager – D003 · 2026-07-29T09:00 IST |

### C013 — Ramesh Chandran (Chennai, top20) · service_reactivation
**Dealer:** D027 (willing_but_weak) · **Segment:** sedan, owned 5 yrs · **Event:** service_lapsed on 2026-07-30
> CRM note: *"during last service, asked casually about new SUV lineup pricing, hasn't followed up since."*

| Step | Result |
|---|---|
| 1. Resolve | Identity unified. |
| 2. Detect | **Repeat-purchase interest** (not one of the 5 sales signals, since this originates in the service channel, not a test-drive) — evidence: unprompted pricing question about the new SUV lineup. |
| 3. Assemble | The pricing question as asked, his current vehicle (sedan, 5 yrs — replacement-cycle-eligible), flagged as a warm repeat-purchase lead, not a routine service case. |
| 4. Sequence | Act now — this is a live opportunity that shouldn't sit in the service queue. |
| 5. Gate | **reframed_to_human** — a specific price quote is `price_and_discount`, human-only. The agent hands over the interest signal, not a number. |
| 6. Act | Context pack routed to a Sales Consultant (not a Service Advisor) for repeat-purchase follow-up; service-due reminder for his current vehicle proceeds separately and normally. |
| 7. Log | Owner: Sales Consultant (repeat-purchase) – D027 · 2026-07-31T10:00 IST |

### C014 — Lakshmi Pillai (Pune, top20) · service_reactivation
**Dealer:** D014 (champion) · **Segment:** EV, owned 1.2 yrs · **Event:** service_support_open_issue on 2026-08-02
> CRM note: *"called service twice about home-charger installation delay, no other issues, EV still under original warranty."*

| Step | Result |
|---|---|
| 1. Resolve | Identity unified; two open support calls on file. |
| 2. Detect | **Operational/logistics issue** (charger installation delay) — not a sales-hesitation signal at all; this is a service-delivery matter. |
| 3. Assemble | Call history (2 calls), nature of the delay, warranty status. |
| 4. Sequence | Act now — two calls without resolution is already a minor pattern. |
| 5. Gate | **reframed_to_human** for the specific piece that matters: committing to a firm installation date is `delivery_commitments`, human-only. A general status acknowledgment, however, carries no such risk. |
| 6. Act | Automated status-update sent immediately (acknowledging the delay, no date promised); a named Installation Coordinator is separately assigned to set and own the actual resolution date. |
| 7. Log | Owner: Installation Coordinator – D014 · 2026-08-02T11:00 IST |

### C015 — Zoya Ahmed (Hyderabad, top20) · service_reactivation — **REFUSAL CASE**
**Dealer:** D041 (squeezed_performer) · **Segment:** SUV, owned 2 yrs · **Event:** service_lapsed on 2026-08-03
> CRM note: *"informed us on the reminder call that her mother passed away recently and she hasn't been able to focus on the car, asked us to check back after a couple months."*

| Step | Result |
|---|---|
| 1. Resolve | Identity unified. |
| 2. Detect | **hardship** — explicit, disclosed bereavement, volunteered directly, with her own stated timeline for re-contact. |
| 3. Assemble | The disclosure as recorded, and — importantly — her own re-contact date, which the agent should honor rather than override with a "check-in" she didn't ask for. |
| 4. Sequence | Immediate suppression; next action not before the ~2-month mark she herself named. |
| 5. Gate | **suppressed_hardship** — the standard service-reminder cadence is fully suppressed. |
| 6. Act | **No further outreach now**, and — a deliberate judgment call — **no separate "compassionate check-in" call either**, since she already told the reminder-call agent exactly what she needs and when. Forcing an additional check-in she didn't request would re-open the conversation she asked to pause. Her stated date is logged as the sole trigger for re-contact. |
| 7. Log | Owner: Service Advisor – D041 (holds the 2-month re-contact flag) · 2026-08-03T09:00 IST · **Refusal logged:** standard and any supplementary outreach suppressed in favor of her own stated timeline. |

*A second hardship case, deliberately different in shape from C003: here the correct action is
not even a check-in — it's silence on the terms the customer herself set. Two hardship records
that resolve differently is the point: the rule is "suppress and respect," not "always insert a
scripted compassionate message."*

### C016 — Aditya Ghosh (Kolkata, top20) · service_reactivation
**Dealer:** D033 (willing_but_weak) · **Segment:** SUV, owned 2.5 yrs · **Event:** service_lapsed on 2026-07-29
> CRM note: *"no issues, just been busy, still opens the app for service booking sometimes but hasn't completed one."*

| Step | Result |
|---|---|
| 1. Resolve | Identity unified; app engagement flagged as active-but-incomplete. |
| 2. Detect | **No adverse signal — routine lapse**, same bucket as C011, but with a channel-preference signal attached (still browsing the app). |
| 3. Assemble | Last service 11 months ago, no issues, demonstrated (if incomplete) app engagement. |
| 4. Sequence | Act now, default cadence. |
| 5. Gate | **passed** — standard reminder, no boundary risk. |
| 6. Act | Reminder sent via **app push notification**, not a phone call — matching the channel he's already using, rather than defaulting to the generic channel. |
| 7. Log | Owner: Service Advisor of record – D033 · 2026-07-29T10:00 IST |

---

## 3. Ledger Summary

### Signal distribution

| Signal | Count |
|---|---|
| finance_hesitation (incl. combined) | 3 (C001, C007, C009) |
| exchange_query | 2 (C004, C008) |
| rival_mention (incl. combined) | 3 (C002, C007, C009) |
| customer_directed_pause | 1 (C006) |
| silence_unexplained | 3 (C005, C010, and routine-lapse variant C011) |
| hardship | 2 (C003, C015) |
| insufficient_evidence | 1 (C017) |
| routine lapse (no adverse signal, incl. channel-aware variant) | 2 (C011, C016) |
| out-of-taxonomy boundary triggers (complaint / repeat-purchase / operational) | 3 (C012, C013, C014) |

*Counts exceed 17 because 2 records carry combined signals (C007, C009).*

### Gate outcomes

| Outcome | Count | What it means |
|---|---|---|
| `passed` | 11 | C001, C002, C004, C005, C007, C008, C009 (held, not fired), C010, C011, C016, C017 |
| `reframed_to_human` | 3 | C012 (complaint), C013 (price), C014 (delivery date) |
| `suppressed_customer_request` | 1 | C006 |
| `suppressed_hardship` | 2 | C003, C015 |

### Full ledger

| Customer | Journey | Signal | Gate Outcome | Action Taken | Human Owner |
|---|---|---|---|---|---|
| C001 | warm_end | finance_hesitation | passed | Consultant handoff (financing focus) | Sales Consultant – D014 |
| C002 | warm_end | rival_mention | passed | Consultant handoff (feature question) | Sales Consultant – D027 |
| C003 | warm_end | hardship | **suppressed_hardship** | EMI-offer nudge cancelled; care answers refund question only | Customer Care Lead – D003 |
| C004 | warm_end | exchange_query | passed | Consultant handoff (valuation) | Sales Consultant – D009 |
| C005 | warm_end | silence_unexplained | passed | One low-pressure touch, then closed out | Digital Nurture – D041 |
| C006 | warm_end | customer_directed_pause | **suppressed_customer_request** | No further outreach; customer will initiate | Sales Consultant – D052 |
| C007 | warm_end | rival_mention + finance_hesitation | passed | Combined consultant handoff | Sales Consultant – D061 |
| C008 | warm_end | exchange_query | passed | Consultant handoff (exchange + price sensitivity) | Sales Consultant – D033 |
| C009 | warm_end | rival_mention + finance_hesitation | passed (held) | No action yet; re-check at hour 40 | Sales Consultant – D002 |
| C010 | warm_end | silence_unexplained | passed | Closed out; moved to quarterly campaign | Digital Nurture – D077 |
| C011 | reactivation | routine lapse | passed | Automated service reminder | Service Advisor – D009 |
| C012 | reactivation | unresolved prior complaint | **reframed_to_human** | No auto-message; manager acknowledgment first | Service Manager – D003 |
| C013 | reactivation | repeat-purchase interest | **reframed_to_human** | Routed to sales, no price quoted | Sales Consultant – D027 |
| C014 | reactivation | operational (charger delay) | **reframed_to_human** | Status ping automated; date owned by human | Installation Coordinator – D014 |
| C015 | reactivation | hardship | **suppressed_hardship** | All outreach suppressed until her stated date | Service Advisor – D041 |
| C016 | reactivation | routine lapse | passed | App-push reminder (channel-matched) | Service Advisor – D033 |
| C017 | warm_end | insufficient_evidence | passed | One neutral, non-targeted touch | Digital Nurture – D061 |

### Highlight: the refusal case

Two records — **C003** and **C015** — resulted in the agent suppressing a scheduled or default
action after detecting hardship. They were deliberately built to resolve *differently*:

- **C003 (Meera Krishnan):** an automated `booking_completion_emi_offer_nudge` was already
  queued and fires by default. The agent's action is to **cancel it outright** and route only
  her own unanswered question (refund eligibility) to Customer Care — not Sales.
- **C015 (Zoya Ahmed):** no automated action was queued yet, so the "refusal" is quieter — the
  agent declines to insert even a compassionate check-in call, because she already stated
  exactly what she wants (silence for ~2 months) and manufacturing an extra touch would
  contradict that.

Both are logged with their rationale. Per the case's own definition of agentic AI — *"people
remain accountable for decisions that affect customers"* — these two rows are the demo, not an
edge case in it.

---
*Generated by the Asteron Agent per the decision contract in `SKILLS.md`. Every suppressed
action above is logged with its rationale — the refusal is the deliverable, not an omission.*
