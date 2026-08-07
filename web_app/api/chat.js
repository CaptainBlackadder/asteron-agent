/* =============================================================================
   /api/chat — Vercel serverless function (Node.js runtime).

   What this endpoint does NOT do: decide anything. It looks up already-static
   reference data (or the ledger snapshot the browser sends it), builds a
   system prompt describing the stakeholder's role and the case's human-only
   boundary, calls the LLM for a natural-language explanation, and then runs
   that reply back through the SAME currencyCommitmentFilter() every other
   part of this project uses — before it's ever sent to a browser.

   Nothing here persists between requests. Vercel Node functions are
   stateless: the ledger and conversation history the browser already has
   are sent WITH each request, not reconstructed from server memory.
   ============================================================================= */
const Anthropic = require('@anthropic-ai/sdk');
const P = require('../pipeline.js');

const MAX_MESSAGE_LENGTH = 800;
const MAX_HISTORY_TURNS = 8;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST.' });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured in this deployment\'s environment variables. See README_DEPLOY.md.' });
    return;
  }

  const { role, message, history, ledgerSnapshot } = req.body || {};

  if (!role || !P.ROLES.some(r => r.id === role)) {
    res.status(400).json({ error: 'Missing or unrecognized role.' });
    return;
  }
  if (!message || typeof message !== 'string' || message.trim() === '') {
    res.status(400).json({ error: 'Missing message.' });
    return;
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({ error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters).` });
    return;
  }

  // GUARDRAIL — runs before any LLM call, same as the client-side pre-check
  // in app.js. This is the server's copy of the same deterministic check,
  // so a request that bypasses the browser (a direct API call, for example)
  // is still caught. No LLM involvement, no way to phrase around it.
  const boundary = P.boundaryRequestScreen(message);
  if (boundary.blocked) {
    res.status(200).json({
      reply: `I can't do that — ${boundary.description} is human-only, always, per the case's own boundary. That belongs to a named human on your team, not this assistant.`,
      guardrail_intercepted: false,
      blocked_pre_llm: true,
      blocked_category: boundary.category,
    });
    return;
  }

  // Build grounding context: look up a record if the message names a known
  // customer, plus whatever ledger rows the browser already has.
  const groundingParts = [];
  const lowerMessage = message.toLowerCase();
  const mentionedCustomer = P.CUSTOMERS.find(c => lowerMessage.includes(c.name.toLowerCase().split(' ')[0]) || lowerMessage.includes(c.name.toLowerCase()));
  if (mentionedCustomer) {
    const c360 = P.resolveCustomer360(mentionedCustomer.mobile_number);
    groundingParts.push(`Record on file for ${c360.customer.name} (${c360.customer.city}, ${c360.customer.city_tier}):`);
    groundingParts.push(P.describeResolve(c360));
    c360.testDrives.forEach(td => groundingParts.push(`- Test drive ${td.test_drive_id} (${td.date}): outcome_tag=${td.outcome_tag || 'none'}, note: "${td.free_text_note}"`));
    c360.serviceRecords.forEach(sr => groundingParts.push(`- Service record ${sr.service_id}: due ${sr.next_service_due_date}, vehicle ${sr.vehicle_age_months} months old`));
  }
  if (Array.isArray(ledgerSnapshot) && ledgerSnapshot.length) {
    groundingParts.push('Recent value-ledger entries from this session (most recent first):');
    ledgerSnapshot.slice(0, 10).forEach(row => {
      groundingParts.push(`- ${row.customer_ref} · ${row.journey} · outcome: ${row.outcome} · owner: ${row.owner}`);
    });
  }
  const groundingContext = groundingParts.length ? groundingParts.join('\n') : null;

  const systemPrompt = P.buildSystemPrompt(role, groundingContext);
  const trimmedHistory = Array.isArray(history) ? history.slice(-MAX_HISTORY_TURNS) : [];

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const completion = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
      max_tokens: 500,
      system: systemPrompt,
      messages: [...trimmedHistory, { role: 'user', content: message }],
    });

    const rawReply = completion.content && completion.content[0] && completion.content[0].text
      ? completion.content[0].text
      : "I wasn't able to generate a reply for that.";

    // The reply the LLM wrote is not trusted until it passes the same
    // guardrail everything else in this project does.
    const filtered = P.currencyCommitmentFilter(rawReply);

    res.status(200).json({
      reply: filtered.text,
      guardrail_intercepted: !filtered.clean,
      blocked_pre_llm: false,
    });
  } catch (err) {
    console.error('Anthropic API error:', err);
    // Surface the SDK's own error text directly — this is the fastest way to
    // tell an invalid API key apart from an unavailable model name apart from
    // a billing/credits issue, without needing dashboard log access.
    const detail = (err && err.error && err.error.error && err.error.error.message) ? err.error.error.message
      : (err && err.message) ? err.message
      : 'Unknown error';
    const status = err && err.status ? err.status : '';

    // FALLBACK — the live LLM call failed (commonly: no API credit on the
    // deployment's Anthropic account). Rather than dead-end the chat with a
    // raw error, hand back the deterministic record we already assembled
    // above (groundingContext). This is not an LLM-generated explanation —
    // it's the same on-file data a human would read — so it's labeled as
    // such rather than presented as if the assistant answered it.
    const fallbackBody = groundingContext
      ? `Live AI explanation is unavailable right now (${detail}), so here's the record on file instead — no generated summary, just what's stored:\n\n${groundingContext}`
      : `Live AI explanation is unavailable right now (${detail}). The deterministic parts of this app — Demo Runs 1–3 and the boundary-refusal check above — don't need the API and still work. Ask about a specific customer by name and I can show you their record directly even without the live model.`;
    const filteredFallback = P.currencyCommitmentFilter(fallbackBody);

    res.status(200).json({
      reply: filteredFallback.text,
      guardrail_intercepted: !filteredFallback.clean,
      blocked_pre_llm: false,
      fallback: true,
      fallback_reason: `The LLM call failed${status ? ' (HTTP ' + status + ')' : ''}: ${detail}`,
    });
  }
};
