/* =============================================================================
   ASTERON AGENT — SHARED DECISION ENGINE
   =============================================================================
   This file is loaded by BOTH the browser (index.html, as a <script> tag) and
   the Vercel serverless function (api/chat.js, via require()). That's
   deliberate: it means there is exactly ONE copy of every guardrail, not a
   browser copy and a server copy that could quietly drift apart.

   Nothing in this file makes an LLM call and nothing in this file is a
   prompt. Every decision — hardship detection, the pricing/commitment
   filter, the boundary-request screen, the human-owner requirement — is a
   plain function. The chat layer in api/chat.js explains what these
   functions already decided; it never overrides them.
   ============================================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AsteronPipeline = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

/* ---- FIXED DEMO CLOCK (see demo_app/index.html for why this is pinned) ---- */
const DEMO_NOW = new Date("2026-08-07T10:00:00+05:30");

/* ---- REFERENCE DATA (same fictional dataset as demo_app/index.html) ---- */
const OUTLETS = [
  {outlet_id:"D003", city:"Bengaluru",  city_tier:"metro",     certification_tier:"Champion"},
  {outlet_id:"D009", city:"Mumbai",     city_tier:"metro",     certification_tier:"Squeezed"},
  {outlet_id:"D014", city:"Pune",       city_tier:"metro",     certification_tier:"Champion"},
  {outlet_id:"D027", city:"Chennai",    city_tier:"metro",     certification_tier:"Squeezed"},
  {outlet_id:"D033", city:"Kolkata",    city_tier:"metro",     certification_tier:"Willing"},
  {outlet_id:"D041", city:"Hyderabad",  city_tier:"metro",     certification_tier:"Willing"},
  {outlet_id:"D052", city:"Jaipur",     city_tier:"non-metro", certification_tier:"Champion"},
  {outlet_id:"D061", city:"Ahmedabad",  city_tier:"metro",     certification_tier:"Champion"},
  {outlet_id:"D077", city:"Surat",      city_tier:"non-metro", certification_tier:"Squeezed"},
  {outlet_id:"D002", city:"Delhi NCR",  city_tier:"metro",     certification_tier:"Willing"},
];

function makeSlots(offsetHours){
  return offsetHours.map(h=>{
    const d = new Date(DEMO_NOW.getTime() + h*3600*1000);
    return { iso:d.toISOString(), label:d.toLocaleString('en-IN',{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) };
  });
}

const CONSULTANTS = [
  {consultant_id:"SC-D003", outlet_id:"D003", role:"sales",   name:"Nikhil Rao",        slots:makeSlots([20,30,44])},
  {consultant_id:"SV-D003", outlet_id:"D003", role:"service", name:"Geeta Shenoy",      slots:makeSlots([24,48,72])},
  {consultant_id:"SC-D009", outlet_id:"D009", role:"sales",   name:"Alisha Fernandes",  slots:makeSlots([18,26,40])},
  {consultant_id:"SV-D009", outlet_id:"D009", role:"service", name:"Ravi Kulkarni",     slots:makeSlots([30,54,80])},
  {consultant_id:"SC-D014", outlet_id:"D014", role:"sales",   name:"Omkar Deshmukh",    slots:makeSlots([16,34,46])},
  {consultant_id:"SV-D014", outlet_id:"D014", role:"service", name:"Snehal Patil",      slots:makeSlots([20,44,68])},
  {consultant_id:"SC-D027", outlet_id:"D027", role:"sales",   name:"Meenakshi Iyer",    slots:makeSlots([22,38,50])},
  {consultant_id:"SV-D027", outlet_id:"D027", role:"service", name:"Prakash Raman",     slots:makeSlots([26,50,74])},
  {consultant_id:"SC-D033", outlet_id:"D033", role:"sales",   name:"Sourav Dutta",      slots:makeSlots([14,28,42])},
  {consultant_id:"SV-D033", outlet_id:"D033", role:"service", name:"Ritika Sen",        slots:makeSlots([18,42,66])},
  {consultant_id:"SC-D041", outlet_id:"D041", role:"sales",   name:"Faisal Ahmed",      slots:makeSlots([12,24,36])},
  {consultant_id:"SV-D041", outlet_id:"D041", role:"service", name:"Divya Reddy",       slots:makeSlots([16,40,64])},
  {consultant_id:"SC-D052", outlet_id:"D052", role:"sales",   name:"Vikram Chauhan",    slots:makeSlots([26,44])},
  {consultant_id:"SV-D052", outlet_id:"D052", role:"service", name:"Anita Shekhawat",   slots:makeSlots([30,54])},
  {consultant_id:"SC-D061", outlet_id:"D061", role:"sales",   name:"Priyank Trivedi",   slots:makeSlots([10,28,40])},
  {consultant_id:"SV-D061", outlet_id:"D061", role:"service", name:"Heena Solanki",     slots:makeSlots([20,44,68])},
  {consultant_id:"SC-D077", outlet_id:"D077", role:"sales",   name:"Bhavesh Patel",     slots:makeSlots([60,84,108])},
  {consultant_id:"SV-D077", outlet_id:"D077", role:"service", name:"Kiran Chavda",      slots:makeSlots([22,46,70])},
  {consultant_id:"SC-D002", outlet_id:"D002", role:"sales",   name:"Rohan Malhotra",    slots:makeSlots([15,29,41])},
  {consultant_id:"SV-D002", outlet_id:"D002", role:"service", name:"Simran Kaur",       slots:makeSlots([19,43,67])},
];

const CUSTOMERS = [
  {customer_id:"C01", name:"Rakesh Verma",        mobile_number:"9820011122", city:"Pune",      city_tier:"metro",     preferred_language:"Marathi"},
  {customer_id:"C02", name:"Ananya Reddy",        mobile_number:"9884022233", city:"Chennai",   city_tier:"metro",     preferred_language:"Tamil"},
  {customer_id:"C03", name:"Vishal Nair",         mobile_number:"9930033344", city:"Mumbai",    city_tier:"metro",     preferred_language:"English"},
  {customer_id:"C04", name:"Priya Iyer",          mobile_number:"9440044455", city:"Hyderabad", city_tier:"metro",     preferred_language:"Telugu"},
  {customer_id:"C05", name:"Karthik Subramaniam", mobile_number:"9414055566", city:"Jaipur",    city_tier:"non-metro", preferred_language:"Hindi"},
  {customer_id:"C06", name:"Farah Sheikh",        mobile_number:"9924066677", city:"Ahmedabad", city_tier:"metro",     preferred_language:"Gujarati"},
  {customer_id:"C07", name:"Devika Menon",        mobile_number:"9836077788", city:"Kolkata",   city_tier:"metro",     preferred_language:"Bengali"},
  {customer_id:"C08", name:"Aditya Ghosh",        mobile_number:"9831088899", city:"Kolkata",   city_tier:"metro",     preferred_language:"Bengali"},
  {customer_id:"C09", name:"Sunita Rao",          mobile_number:"9925099900", city:"Surat",     city_tier:"non-metro", preferred_language:"Gujarati"},
  {customer_id:"C10", name:"Sameer Joshi",        mobile_number:"9909100011", city:"Ahmedabad", city_tier:"metro",     preferred_language:"Gujarati"},
  {customer_id:"C11", name:"Meera Krishnan",      mobile_number:"9880111122", city:"Bengaluru", city_tier:"metro",     preferred_language:"Kannada"},
  {customer_id:"C12", name:"Imran Qureshi",       mobile_number:"9845122233", city:"Bengaluru", city_tier:"metro",     preferred_language:"English"},
  {customer_id:"C13", name:"Zoya Ahmed",          mobile_number:"9701133344", city:"Hyderabad", city_tier:"metro",     preferred_language:"Urdu"},
  {customer_id:"C14", name:"Neha Kapoor",         mobile_number:"9819144455", city:"Mumbai",    city_tier:"metro",     preferred_language:"Hindi"},
  {customer_id:"C15", name:"Ramesh Chandran",     mobile_number:"9884155566", city:"Chennai",   city_tier:"metro",     preferred_language:"Tamil"},
  {customer_id:"C16", name:"Lakshmi Pillai",      mobile_number:"9860166677", city:"Pune",      city_tier:"metro",     preferred_language:"Marathi"},
  {customer_id:"C17", name:"Arjun Malhotra",      mobile_number:"9871077788", city:"Delhi NCR", city_tier:"metro",     preferred_language:"Hindi"},
  {customer_id:"C18", name:"Farhan Ali",          mobile_number:"9898188899", city:"Surat",     city_tier:"non-metro", preferred_language:"Gujarati"},
];

const ENQUIRIES = [
  {enquiry_id:"E01", mobile_number:"9820011122", channel:"digital",  model_interest:"Compact SUV", date:"2026-07-18", qualified:true},
  {enquiry_id:"E02", mobile_number:"9884022233", channel:"walk-in",  model_interest:"Mid-size SUV", date:"2026-07-20", qualified:true},
  {enquiry_id:"E03", mobile_number:"9930033344", channel:"digital",  model_interest:"Compact SUV", date:"2026-08-04", qualified:true},
  {enquiry_id:"E04", mobile_number:"9440044455", channel:"referral", model_interest:"Sedan",       date:"2026-07-12", qualified:true},
  {enquiry_id:"E05", mobile_number:"9414055566", channel:"digital",  model_interest:"Mid-size SUV", date:"2026-07-21", qualified:true},
  {enquiry_id:"E06", mobile_number:"9924066677", channel:"digital",  model_interest:"EV Hatchback", date:"2026-07-17", qualified:true},
  {enquiry_id:"E07", mobile_number:"9836077788", channel:"walk-in",  model_interest:"Compact SUV", date:"2026-07-16", qualified:true},
  {enquiry_id:"E08", mobile_number:"9831088899", channel:"digital",  model_interest:"Compact SUV", date:"2026-07-27", qualified:true},
  {enquiry_id:"E09", mobile_number:"9925099900", channel:"digital",  model_interest:"Hatchback",   date:"2026-07-08", qualified:true},
  {enquiry_id:"E10", mobile_number:"9909100011", channel:"digital",  model_interest:"Mid-size SUV", date:"2026-07-22", qualified:true},
  {enquiry_id:"E11", mobile_number:"9880111122", channel:"digital",  model_interest:"EV Hatchback", date:"2026-08-03", qualified:true},
  {enquiry_id:"E12", mobile_number:"9845122233", channel:"walk-in",  model_interest:"Mid-size SUV", date:"2026-07-26", qualified:true},
  {enquiry_id:"E13", mobile_number:"9701133344", channel:"referral", model_interest:"Mid-size SUV", date:"2026-06-28", qualified:true},
  {enquiry_id:"E14", mobile_number:"9871077788", channel:"digital",  model_interest:"Mid-size SUV", date:"2026-08-05", qualified:true},
];

const TEST_DRIVES = [
  {test_drive_id:"TD001", mobile_number:"9820011122", vin:"MA3ERLF1SNT100001", outlet_id:"D014", date:"2026-07-20",
   outcome_captured:true, outcome_tag:"finance_hesitation",
   free_text_note:"Liked the drive. Checked the EMI calculator on the app three times afterward. Said he'd discuss with family before deciding. Two follow-up calls went unanswered."},
  {test_drive_id:"TD002", mobile_number:"9884022233", vin:"MA3ERLF1SNT100002", outlet_id:"D027", date:"2026-07-22",
   outcome_captured:true, outcome_tag:"competitor_mentioned",
   free_text_note:"Test drive went well, but she mentioned a rival SUV has a panoramic sunroof at a similar price and asked if we're adding one. Told her we'd check back — haven't yet."},
  {test_drive_id:"TD003", mobile_number:"9930033344", vin:"MA3ERLF1SNT100003", outlet_id:"D009", date:"2026-08-06",
   outcome_captured:true, outcome_tag:"exchange_value_concern",
   free_text_note:"Asked twice what we'd offer for his 2018 diesel sedan on exchange. Said the market rate feels low. Hasn't confirmed the booking yet."},
  {test_drive_id:"TD004", mobile_number:"9440044455", vin:"MA3ERLF1SNT100004", outlet_id:"D041", date:"2026-07-15",
   outcome_captured:false, outcome_tag:null,
   free_text_note:"No response after the test drive. Three calls over five days, no answer, no voicemail reply."},
  {test_drive_id:"TD005", mobile_number:"9414055566", vin:"MA3ERLF1SNT100005", outlet_id:"D052", date:"2026-07-23",
   outcome_captured:true, outcome_tag:"other",
   free_text_note:"Told us directly: 'please don't call me for now, I'll reach out when I'm ready.' No reason given."},
  {test_drive_id:"TD006", mobile_number:"9924066677", vin:"MA3ERLF1SNT100006", outlet_id:"D061", date:"2026-07-19",
   outcome_captured:true, outcome_tag:"other",
   free_text_note:"Asked about the charging network compared to a rival EV, and checked the EMI calculator once. Seems genuinely undecided between the two."},
  {test_drive_id:"TD007", mobile_number:"9836077788", vin:"MA3ERLF1SNT100007", outlet_id:"D033", date:"2026-07-18",
   outcome_captured:true, outcome_tag:"exchange_value_concern",
   free_text_note:"Asked about exchange value for her old hatchback once, then went quiet. Seemed price-sensitive overall."},
  {test_drive_id:"TD008", mobile_number:"9831088899", vin:"MA3ERLF1SNT100008", outlet_id:"D033", date:"2026-07-29",
   outcome_captured:true, outcome_tag:"exchange_value_concern",
   free_text_note:"No issues, just wants a bit more time to compare exchange offers elsewhere."},
  {test_drive_id:"TD009", mobile_number:"9925099900", vin:null, outlet_id:"D077", date:"2026-07-10",
   outcome_captured:false, outcome_tag:null,
   free_text_note:"Completely unresponsive since the test drive — four attempts over eight days, contact number double-checked and correct."},
  {test_drive_id:"TD010", mobile_number:"9909100011", vin:"MA3ERLF1SNT100010", outlet_id:"D061", date:"2026-07-24",
   outcome_captured:true, outcome_tag:"other",
   free_text_note:"Replied to one call saying 'still deciding, will call back.' Nothing more specific."},
  {test_drive_id:"TD011", mobile_number:"9880111122", vin:"MA3ERLF1SNT100011", outlet_id:"D003", date:"2026-08-05",
   outcome_captured:true, outcome_tag:"other",
   free_text_note:"Customer mentioned she's going through a tough financial patch right now and felt a bit pressured on the last call — asked us to give her some space for now."},
  {test_drive_id:"TD012", mobile_number:"9845122233", vin:"MA3ERLF1SNT100012", outlet_id:"D003", date:"2026-07-28",
   outcome_captured:true, outcome_tag:"other",
   free_text_note:"He mentioned he lost his job last month and can't afford this right now — asked us not to follow up for a while."},
  {test_drive_id:"TD013", mobile_number:"9701133344", vin:"MA3ERLF1SNT100013", outlet_id:"D041", date:"2026-06-30",
   outcome_captured:true, outcome_tag:"other",
   free_text_note:"She felt the dealership overcharged her on her last visit and said she was quite upset and considering a formal complaint."},
  {test_drive_id:"TD017", mobile_number:"9871077788", vin:"MA3ERLF1SNT100017", outlet_id:"D002", date:"2026-08-06",
   outcome_captured:true, outcome_tag:"other",
   free_text_note:"Went straight to compare a rival SUV online after the test drive, and checked the EMI calculator twice. No response yet to one call — still early days."},
  {test_drive_id:"TD018", mobile_number:"9898188899", vin:null, outlet_id:"D077", date:"2026-07-05",
   outcome_captured:false, outcome_tag:null, free_text_note:""},
];

const SERVICE_RECORDS = [
  {service_id:"SR-N1", vin:"MA3ERLF1SNT100014", mobile_number:"9819144455", outlet_id:"D009",
   last_service_date:"2025-06-01", next_service_due_date:"2026-08-14", vehicle_age_months:42},
  {service_id:"SR-R1", vin:"MA3ERLF1SNT100015", mobile_number:"9884155566", outlet_id:"D027",
   last_service_date:"2025-11-01", next_service_due_date:"2026-08-10", vehicle_age_months:60},
  {service_id:"SR-L1", vin:"MA3ERLF1SNT100016", mobile_number:"9860166677", outlet_id:"D014",
   last_service_date:"2026-02-10", next_service_due_date:"2026-08-18", vehicle_age_months:14},
  {service_id:"SR-Z1", vin:"MA3ERLF1SNT100013", mobile_number:"9701133344", outlet_id:"D041",
   last_service_date:"2025-12-01", next_service_due_date:"2026-08-12", vehicle_age_months:26},
];

/* ---- GUARDRAIL: hardship / complaint hard screen (identical to demo_app) ---- */
const HARDSHIP_PATTERNS = [
  /complain(t|ed|ing)?/i, /unhapp(y|iness)/i, /refund/i, /cheat(ed|ing)?/i, /unfair/i,
  /legal action/i, /unsafe/i, /\baccident\b/i, /financial difficult(y|ies)/i,
  /can.?t afford/i, /cannot afford/i, /lost (my|his|her|their) job/i, /pressured/i,
  /harass(ed|ment)?/i, /threat(en(ed|ing))?/i, /tough financial patch/i,
  /medical emergency/i, /passed away/i, /bereave(ment|d)/i,
];

function hardshipScreen(freeTextNotes){
  for (const note of freeTextNotes){
    if (!note) continue;
    for (const pattern of HARDSHIP_PATTERNS){
      const m = note.match(pattern);
      if (m) return { fired:true, matchedPhrase:m[0], sourceNote:note, pattern:pattern.toString() };
    }
  }
  return { fired:false };
}

/* ---- GUARDRAIL: currency / commitment-language filter (identical to demo_app) ----
   In this app it does double duty: it still guards the templated Assemble-step
   text, AND it is run over every LLM chat reply in api/chat.js before that
   reply is ever sent to a browser. Same function, same regex, no exceptions. */
const CURRENCY_OR_PCT = /(₹|\bRs\.?\b|\bINR\b)\s?[\d,]+(\.\d+)?\s?(lakh|crore|k)?|\b\d{1,3}(,\d{3})*(\.\d+)?\s?%|\bdiscount\b/i;
const COMMITMENT_PHRASES = [
  /we (will|can|could) (offer|give|guarantee|provide)/i,
  /\bguarantee(d)?\b/i,
  /\bpromise you\b/i,
  /\b\d+\s?% ?off\b/i,
];

function currencyCommitmentFilter(text){
  const violations = [];
  if (CURRENCY_OR_PCT.test(text)) violations.push("currency/percentage pattern");
  for (const p of COMMITMENT_PHRASES){ if (p.test(text)) violations.push("commitment phrase ("+p+")"); }
  if (violations.length === 0) return { clean:true, text, violations:[] };
  const sentences = text.split(/(?<=[.!?])\s+/);
  const safe = sentences.filter(s => !CURRENCY_OR_PCT.test(s) && !COMMITMENT_PHRASES.some(p=>p.test(s)));
  return { clean:false, text: (safe.join(" ") + " [REDACTED — price/commitment language removed by guardrail]").trim(), violations };
}

/* ---- NEW GUARDRAIL FOR THE CHAT LAYER: boundary-request screen ----
   Runs on the INCOMING chat message, before any LLM call. If a stakeholder
   asks the chatbot to do something that's human-only per
   knowledge_base/decision_boundaries.json, this refuses deterministically —
   no LLM roundtrip, no chance of being talked around by phrasing. */
const HUMAN_ONLY_CATEGORIES = [
  {category:"price_and_discount",  description:"Any specific price, discount, or promotional offer quoted to a customer."},
  {category:"exchange_valuation",  description:"Any specific trade-in/exchange value quoted or implied for a customer's existing vehicle."},
  {category:"negotiation",         description:"Any back-and-forth on deal terms."},
  {category:"complaint_resolution",description:"Any resolution, apology, or remedy offered for a service or product complaint."},
  {category:"delivery_commitments",description:"Any specific delivery date or commitment made to a customer."},
  {category:"credit_decisions",    description:"Any loan/financing approval, EMI scheme confirmation, or credit-risk decision."},
  {category:"dealer_staffing",     description:"Any decision affecting dealer personnel or staffing levels."},
];

const BOUNDARY_REQUEST_PATTERNS = [
  {category:"price_and_discount",   pattern:/\b(discount|price[- ]?match|special (price|deal)|knock (off|down) the price|lower the price|\d+\s?%\s?off)\b/i},
  {category:"exchange_valuation",   pattern:/\b(exchange value|trade-?in value|valuation)\b|\bworth\b[\s\S]{0,25}\b(exchange|trade-?in)\b|\b(exchange|trade-?in)\b[\s\S]{0,25}\bworth\b/i},
  {category:"negotiation",          pattern:/\bnegotiat/i},
  {category:"complaint_resolution", pattern:/\b(refund (her|him|them)|compensate|waive (the )?(fee|charge)|offer (her|him|them) (a |an )?(refund|compensation))\b/i},
  {category:"delivery_commitments", pattern:/\b(guarantee delivery|promise (a |the )?delivery date|confirm (a |the )?delivery date)\b/i},
  {category:"credit_decisions",     pattern:/\b(approve (the |his |her |their )?loan|approve (his|her|their) financing|credit approval)\b/i},
  {category:"dealer_staffing",      pattern:/\b(fire |terminate |hire |staffing decision|who should (we|i) (hire|let go))\b/i},
];

function boundaryRequestScreen(message){
  for (const {category, pattern} of BOUNDARY_REQUEST_PATTERNS){
    const m = message.match(pattern);
    if (m) {
      const cat = HUMAN_ONLY_CATEGORIES.find(c=>c.category===category);
      return { blocked:true, category, matched:m[0], description: cat ? cat.description : "" };
    }
  }
  return { blocked:false };
}

/* ---- STEP 2b: non-conversion reason classification (deterministic rules,
   explicitly not an LLM call — see demo_app/README.md's honesty note) ---- */
function classifyReason(testDrive){
  if (testDrive.outcome_tag && testDrive.outcome_tag !== "other"){
    return { reason: testDrive.outcome_tag, source:"structured outcome_tag",
      justification:`Outcome tag on file: ${testDrive.outcome_tag}.` };
  }
  const note = (testDrive.free_text_note || "");
  const lower = note.toLowerCase();
  if (/emi|loan|finance|down ?payment/.test(lower))
    return { reason:"finance_hesitation", source:"free-text rule", justification:"Free-text note references financing/EMI." };
  if (/exchange|trade-?in|old (car|vehicle|hatchback|sedan)/.test(lower))
    return { reason:"exchange_value_concern", source:"free-text rule", justification:"Free-text note references an exchange/trade-in." };
  if (/rival|competitor|compare[ds]? (a|to)|panoramic sunroof/.test(lower))
    return { reason:"competitor_mentioned", source:"free-text rule", justification:"Free-text note names or references a competing model." };
  if (/no response|unresponsive|no answer|didn.?t (pick up|respond)/.test(lower))
    return { reason:"no_response", source:"free-text rule", justification:"Free-text note indicates no response." };
  return { reason:"no_clear_signal", source:"free-text rule (no match)",
    justification:"No structured tag and no matching keyword pattern in the free text — insufficient evidence for a specific reason." };
}

/* ---- STEP 1: RESOLVE ---- */
function resolveCustomer360(mobile){
  const customer = CUSTOMERS.find(c=>c.mobile_number===mobile);
  const enquiries = ENQUIRIES.filter(e=>e.mobile_number===mobile);
  const testDrives = TEST_DRIVES.filter(t=>t.mobile_number===mobile);
  const serviceRecords = SERVICE_RECORDS.filter(s=>s.mobile_number===mobile);
  const vins = [...new Set([...testDrives.map(t=>t.vin), ...serviceRecords.map(s=>s.vin)].filter(Boolean))];
  const flags = [];
  if (vins.length === 0) flags.push("No VIN on file for this identity — matched on mobile number only. Flagged to the manual-review queue (the case's ~25% no-VIN cohort).");
  const allFreeTextNotes = testDrives.map(t=>t.free_text_note).filter(Boolean);
  return { customer, enquiries, testDrives, serviceRecords, vins, flags, allFreeTextNotes };
}

function describeResolve(c360){
  const parts = [`Identity resolved for ${c360.customer.name} (${c360.customer.city}, ${c360.customer.city_tier}).`,
    `${c360.enquiries.length} enquiry, ${c360.testDrives.length} test drive(s), ${c360.serviceRecords.length} service record(s) joined on mobile${c360.vins.length? " + VIN":""}.`];
  if (c360.flags.length) parts.push("⚠ " + c360.flags.join(" "));
  return parts.join(" ");
}

/* ---- STEP 4: SEQUENCE ---- */
function sequenceSlot(outletId, role, demoNow){
  demoNow = demoNow || DEMO_NOW;
  const consultant = CONSULTANTS.find(c=>c.outlet_id===outletId && c.role===role);
  if (!consultant) return { proposed:null, withinWindow:false, consultant:null };
  const windowEnd = new Date(demoNow.getTime() + 48*3600*1000);
  const inWindow = consultant.slots.filter(s => new Date(s.iso) <= windowEnd && new Date(s.iso) >= demoNow);
  if (inWindow.length) return { proposed:inWindow[0], withinWindow:true, consultant };
  const future = consultant.slots.filter(s=>new Date(s.iso) > demoNow).sort((a,b)=>new Date(a.iso)-new Date(b.iso));
  return { proposed: future[0] || null, withinWindow:false, consultant };
}

/* ---- STEP 3: ASSEMBLE ---- */
const COMPARABLE_RESOLUTIONS = {
  finance_hesitation: "3 similar finance-hesitation cases this quarter were resolved by walking the customer through EMI tenure options in person.",
  exchange_value_concern: "3 similar exchange-value concerns this quarter were resolved by walking the customer through the certified pre-owned buyback programme. One earlier draft of this note said we could offer 5% off the exchange shortfall — the pricing guardrail removed that line before it ever reached a consultant screen.",
  competitor_mentioned: "2 similar competitor-comparison cases were resolved with a feature-by-feature walkthrough focused on total ownership cost, not price matching.",
  no_response: "Repeated non-response cases convert best with a single, low-pressure information touch rather than repeated calls.",
  no_clear_signal: "No specific blocker identified from the record on file — recommend a general check-in rather than a targeted pitch.",
};

function assembleBrief(c360, reasonResult){
  const enquiry = c360.enquiries[0];
  const raw = COMPARABLE_RESOLUTIONS[reasonResult.reason] || COMPARABLE_RESOLUTIONS.no_clear_signal;
  const filtered = currencyCommitmentFilter(raw);
  return {
    customer_name: c360.customer.name,
    city: c360.customer.city,
    model_interest: enquiry ? enquiry.model_interest : "—",
    prior_touchpoints: `${c360.enquiries.length} enquiry, ${c360.testDrives.length} test drive(s), ${c360.serviceRecords.length} service record(s) on file.`,
    reason: reasonResult.reason,
    reason_justification: reasonResult.justification,
    talking_point: filtered.text,
    guardrail_note: filtered.clean ? null :
      `Guardrail removed ${filtered.violations.length} price/commitment reference(s) from the reference example before display (${filtered.violations.join("; ")}).`,
  };
}

/* ---- Pseudonymization + ledger validation (identical rules to demo_app) ---- */
function hashMobile(mobile){
  let h = 0;
  for(let i=0;i<mobile.length;i++){ h = (h*31 + mobile.charCodeAt(i)) >>> 0; }
  return "CUST-" + h.toString(16).toUpperCase().padStart(8,"0");
}

function validateLedgerEntry(entry){
  if (!entry.owner || typeof entry.owner !== "string" || entry.owner.trim() === ""){
    throw new Error("GUARDRAIL VIOLATION: attempted to log an action with no named human owner.");
  }
  return true;
}

// Ledger is NOT module-level state here (unlike demo_app) — a serverless
// function has no guaranteed persistent memory between requests, so the
// caller (browser session) owns its ledger array and passes it in.
function contactedRecently(mobile, journey, ledger, demoNow, days){
  days = days || 7; demoNow = demoNow || DEMO_NOW;
  const cutoff = new Date(demoNow.getTime() - days*86400000);
  const ref = hashMobile(mobile);
  return (ledger||[]).some(row => row.customer_ref===ref && row.journey===journey &&
    row.outcome!=="escalated_hardship" && new Date(row.timestamp) >= cutoff);
}

function logAction(ledger, entry){
  validateLedgerEntry(entry);
  entry.timestamp = new Date().toISOString();
  ledger.unshift(entry);
  return entry;
}

/* ---- FULL PIPELINE — CONVERSION JOURNEY (ledger passed in, mutated in place) ---- */
function runConversion(testDriveId, ledger, demoNow){
  demoNow = demoNow || DEMO_NOW;
  const td = TEST_DRIVES.find(t=>t.test_drive_id===testDriveId);
  const steps = [];
  const c360 = resolveCustomer360(td.mobile_number);
  steps.push({name:"1 · RESOLVE", body: describeResolve(c360)});

  if (contactedRecently(td.mobile_number, "conversion", ledger, demoNow)){
    const owner = "Outlet Manager, " + td.outlet_id;
    steps.push({name:"GUARDRAIL · DEDUPE CHECK", alert:true,
      body:"This customer was already contacted for this journey within the last 7 days. Pipeline halted — no duplicate outreach generated."});
    logAction(ledger, {customer_ref:hashMobile(td.mobile_number), journey:"conversion", step_reached:"dedupe_guard", outcome:"deduped_skipped", owner});
    return { steps, outcome:"deduped_skipped" };
  }

  const hardship = hardshipScreen(c360.allFreeTextNotes);
  if (hardship.fired){
    const seqOwner = sequenceSlot(td.outlet_id,"sales",demoNow).consultant;
    const owner = seqOwner ? seqOwner.name : "Outlet Manager, " + td.outlet_id;
    steps.push({name:"2a · DETECT — Hardship Screen", alert:true,
      body:`FIRED on the phrase "${hardship.matchedPhrase}" found in a linked note: "${hardship.sourceNote}"`});
    steps.push({name:"STOPPED · ESCALATED", alert:true, gate:true,
      body:`ESCALATED — routed directly to ${owner}, no automated action taken. Steps 3 and 4 do not run.`});
    logAction(ledger, {customer_ref:hashMobile(td.mobile_number), journey:"conversion", step_reached:"2a_hardship_screen", outcome:"escalated_hardship", owner});
    return { steps, outcome:"escalated_hardship", owner, hardship, customer:c360.customer };
  }
  steps.push({name:"2a · DETECT — Hardship Screen", body:"Clear — no distress, complaint, or hardship pattern found in any linked free-text note."});

  const reason = classifyReason(td);
  steps.push({name:"2b · DETECT — Reason Classification", body:`${reason.reason} — ${reason.justification} (source: ${reason.source})`});

  const brief = assembleBrief(c360, reason);
  steps.push({name:"3 · ASSEMBLE", brief});

  const seq = sequenceSlot(td.outlet_id, "sales", demoNow);
  const seqLine = seq.proposed
    ? `Proposed: ${seq.proposed.label} with ${seq.consultant.name}.` + (seq.withinWindow ? "" : " ⚠ Outside the 48-hour target window — earliest available slot shown honestly.")
    : "No consultant slot available at all.";
  steps.push({name:"4 · SEQUENCE", body: seqLine});

  const owner = seq.consultant ? `${seq.consultant.name} (${seq.consultant.consultant_id})` : `Outlet Manager, ${td.outlet_id}`;
  steps.push({name:"5 · GATE (human)", gate:true,
    body:`Written to the Consultant Inbox for ${owner}. The agent process ends here — there is no code path past this point.`});

  logAction(ledger, {customer_ref:hashMobile(td.mobile_number), journey:"conversion", step_reached:"gate", outcome:"proceeded_to_gate", owner});
  return { steps, outcome:"proceeded_to_gate", brief, seq, owner, customer:c360.customer };
}

/* ---- FULL PIPELINE — REACTIVATION JOURNEY ---- */
function runReactivation(serviceId, ledger, demoNow){
  demoNow = demoNow || DEMO_NOW;
  const sr = SERVICE_RECORDS.find(s=>s.service_id===serviceId);
  const steps = [];
  const c360 = resolveCustomer360(sr.mobile_number);
  steps.push({name:"1 · RESOLVE", body: describeResolve(c360)});

  if (contactedRecently(sr.mobile_number, "reactivation", ledger, demoNow)){
    const owner = "Service Advisor, " + sr.outlet_id;
    steps.push({name:"GUARDRAIL · DEDUPE CHECK", alert:true,
      body:"This customer was already contacted for this journey within the last 7 days. Pipeline halted — no duplicate outreach generated."});
    logAction(ledger, {customer_ref:hashMobile(sr.mobile_number), journey:"reactivation", step_reached:"dedupe_guard", outcome:"deduped_skipped", owner});
    return { steps, outcome:"deduped_skipped" };
  }

  const hardship = hardshipScreen(c360.allFreeTextNotes);
  if (hardship.fired){
    const seqOwner = sequenceSlot(sr.outlet_id,"service",demoNow).consultant;
    const owner = seqOwner ? seqOwner.name : "Service Advisor, " + sr.outlet_id;
    steps.push({name:"2a · DETECT — Hardship Screen", alert:true,
      body:`FIRED on the phrase "${hardship.matchedPhrase}" found in a linked note: "${hardship.sourceNote}" — this note came from an earlier test-drive record, not the service record itself. Shared identity resolution is why the screen still catches it.`});
    steps.push({name:"STOPPED · ESCALATED", alert:true, gate:true,
      body:`ESCALATED — routed directly to ${owner}, no automated action taken.`});
    logAction(ledger, {customer_ref:hashMobile(sr.mobile_number), journey:"reactivation", step_reached:"2a_hardship_screen", outcome:"escalated_hardship", owner});
    return { steps, outcome:"escalated_hardship", owner, hardship, customer:c360.customer };
  }
  steps.push({name:"2a · DETECT — Hardship Screen", body:"Clear — no distress, complaint, or hardship pattern found in any linked free-text note."});

  const dueInDays = Math.round((new Date(sr.next_service_due_date) - demoNow) / 86400000);
  const draft = `Service due in ${dueInDays} day(s) for a vehicle ${sr.vehicle_age_months} months old. Advisory tone: what's due and why it matters, no price or commitment language.`;
  const filtered = currencyCommitmentFilter(draft);
  steps.push({name:"3 · ASSEMBLE — Service Reminder Draft", body: filtered.text});

  const seq = sequenceSlot(sr.outlet_id, "service", demoNow);
  const seqLine = seq.proposed
    ? `Proposed: ${seq.proposed.label} with ${seq.consultant.name}.` + (seq.withinWindow ? "" : " ⚠ Outside the 48-hour target window — earliest available slot shown honestly.")
    : "No service advisor slot available.";
  steps.push({name:"4 · SEQUENCE", body: seqLine});

  const owner = seq.consultant ? `${seq.consultant.name} (${seq.consultant.consultant_id})` : `Service Advisor, ${sr.outlet_id}`;
  steps.push({name:"5 · GATE (human)", gate:true,
    body:`Written to the Consultant Inbox for ${owner}. The agent process ends here — there is no code path past this point.`});

  logAction(ledger, {customer_ref:hashMobile(sr.mobile_number), journey:"reactivation", step_reached:"gate", outcome:"proceeded_to_gate", owner});
  return { steps, outcome:"proceeded_to_gate", seq, owner, customer:c360.customer, draft:filtered.text };
}

/* ---- ROLES (mirrors the org design in Asteron_Speaker_Notes.md Slide 2) ---- */
const ROLES = [
  {id:"sales_consultant", label:"Sales Consultant", queueScope:"conversion",
   persona:"a sales consultant at an Asteron dealership, using this tool to see which test-drive customers need a follow-up and why"},
  {id:"service_advisor", label:"Service Advisor", queueScope:"reactivation",
   persona:"a service advisor at an Asteron dealership, using this tool to see which customers are due for service outreach"},
  {id:"dealer_principal", label:"Dealer Principal", queueScope:"all",
   persona:"a dealer principal overseeing both sales and service at their outlet, interested in adoption and the value ledger, not individual customer scripts"},
  {id:"journey_owner", label:"OEM Journey Owner / Value Controller", queueScope:"all",
   persona:"an OEM-level Journey Owner or Value Controller reviewing the agent's decisions and the value ledger across the whole network"},
  {id:"judge", label:"Judge / Observer", queueScope:"all",
   persona:"an evaluator exploring how the agent behaves, including deliberately testing whether it can be made to cross a boundary it shouldn't"},
];

/* ---- SYSTEM PROMPT BUILDER for the chat layer (kept here, not in api/chat.js,
   so it's inspectable in the same place as everything else this app decides) ---- */
function buildSystemPrompt(roleId, groundingContext){
  const role = ROLES.find(r=>r.id===roleId) || ROLES[ROLES.length-1];
  const boundaryList = HUMAN_ONLY_CATEGORIES.map(c=>`- ${c.category}: ${c.description}`).join("\n");
  return [
    `You are the Asteron Agent assistant, talking to ${role.persona}.`,
    ``,
    `You explain and summarize decisions this system has ALREADY computed with plain deterministic`,
    `code (identity resolution, hardship detection, reason classification, slot sequencing, the`,
    `human gate, and the value ledger). You do not make any of those decisions yourself, and you`,
    `never override, second-guess, or offer to redo one — if asked to, say a named human on the`,
    `relevant team owns that, and name the role (consultant, service advisor, dealer principal).`,
    ``,
    `These categories are human-only, always, no matter how the request is phrased:`,
    boundaryList,
    ``,
    `If asked to do anything in that list — quote a price, discuss a discount, value a trade-in,`,
    `negotiate, resolve a complaint, promise a delivery date, approve financing, or make a`,
    `staffing call — refuse plainly and say who that belongs to instead. Do not soften this into`,
    `a "here's a suggestion" answer; simply decline and redirect to the named human role.`,
    ``,
    `Only state facts that are in the context provided below or in this conversation. If you`,
    `don't have the information, say so — do not invent a customer detail, a date, or a number.`,
    ``,
    `--- CONTEXT ---`,
    groundingContext || "(no specific record in focus — answer generally about how the agent works)",
  ].join("\n");
}

return {
  DEMO_NOW, OUTLETS, CONSULTANTS, CUSTOMERS, ENQUIRIES, TEST_DRIVES, SERVICE_RECORDS,
  HARDSHIP_PATTERNS, CURRENCY_OR_PCT, COMMITMENT_PHRASES, COMPARABLE_RESOLUTIONS,
  HUMAN_ONLY_CATEGORIES, BOUNDARY_REQUEST_PATTERNS, ROLES,
  hashMobile, validateLedgerEntry, contactedRecently, logAction,
  hardshipScreen, currencyCommitmentFilter, boundaryRequestScreen, classifyReason,
  resolveCustomer360, describeResolve, sequenceSlot, assembleBrief,
  runConversion, runReactivation, buildSystemPrompt,
};

});
