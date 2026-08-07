/* =========================================================================
   ASTERON AGENT — STAKEHOLDER PORTAL — browser wiring.
   All decision logic lives in pipeline.js (shared with api/chat.js). This
   file only renders things and owns the session's ledger array.
   ========================================================================= */
const P = window.AsteronPipeline;
let LEDGER = [];
let currentRole = null;
let currentSteps = [], currentIndex = 0, currentOutcome = null;
let chatHistory = [];

/* ---- ROLE SELECTION ---- */
function renderRoleGrid(){
  const grid = document.getElementById('roleGrid');
  grid.innerHTML = P.ROLES.map(r =>
    `<div class="roleCard" onclick="selectRole('${r.id}')"><b>${r.label}</b><span>${r.persona}</span></div>`
  ).join('');
}

function selectRole(roleId){
  currentRole = P.ROLES.find(r=>r.id===roleId);
  document.getElementById('roleOverlay').classList.add('hidden');
  document.getElementById('roleBadge').textContent = currentRole.label;
  document.getElementById('chatRoleLine').textContent = 'signed in as ' + currentRole.label;
  chatHistory = [];
  document.getElementById('chatMessages').innerHTML = '';
  addChatMessage('system', `You're set up as ${currentRole.label}. Ask about a customer, the ledger, or try asking for a discount — see what happens.`);
  renderQueue();
}

function showRoleOverlay(){ document.getElementById('roleOverlay').classList.remove('hidden'); }

/* ---- QUEUE (filtered by role) ---- */
function renderQueue(){
  const list = document.getElementById('queueList');
  const scope = currentRole ? currentRole.queueScope : 'all';
  list.innerHTML = '';
  let rows = [];
  if (scope !== 'reactivation'){
    rows = rows.concat(P.TEST_DRIVES.map(td=>{
      const c = P.CUSTOMERS.find(c=>c.mobile_number===td.mobile_number);
      return {label:`${c.name} — ${c.city}`, sub:`test drive · ${td.date} · tag: ${td.outcome_tag||'none'}`, tag:'conv',
        onclick:`startRun('${td.test_drive_id}')`};
    }));
  }
  if (scope !== 'conversion'){
    rows = rows.concat(P.SERVICE_RECORDS.map(sr=>{
      const c = P.CUSTOMERS.find(c=>c.mobile_number===sr.mobile_number);
      return {label:`${c.name} — ${c.city}`, sub:`service due ${sr.next_service_due_date}`, tag:'react',
        onclick:`startRun('${sr.service_id}', true)`};
    }));
  }
  rows.forEach(r=>{
    const div = document.createElement('div');
    div.className = 'queue-item';
    div.setAttribute('onclick', r.onclick);
    div.innerHTML = `<b>${r.label} <span class="qtag ${r.tag}">${r.tag==='conv'?'conversion':'reactivation'}</span></b><span>${r.sub}</span>`;
    list.appendChild(div);
  });
}

/* ---- LEDGER ---- */
function renderLedger(){
  const body = document.getElementById('ledgerBody');
  if (LEDGER.length === 0){ body.innerHTML = '<tr><td colspan="6" class="empty">No actions logged yet.</td></tr>'; return; }
  body.innerHTML = LEDGER.map(row=>`
    <tr class="outcome-${row.outcome}">
      <td>${new Date(row.timestamp).toLocaleTimeString('en-IN')}</td>
      <td>${row.customer_ref}</td>
      <td>${row.journey}</td>
      <td>${row.step_reached}</td>
      <td><span class="badge ${row.outcome}">${row.outcome.replace(/_/g,' ')}</span></td>
      <td>${row.owner}</td>
    </tr>`).join('');
}

function resetLedger(){
  LEDGER = [];
  renderLedger();
  document.getElementById('trace').innerHTML = '<div class="empty">Click a record in the Event Queue, or a Demo Run button, to start.</div>';
  document.getElementById('inbox').innerHTML = '<h2>Consultant Inbox / Escalation</h2><div class="empty">Nothing yet — run a record to populate this panel.</div>';
  document.getElementById('controls').style.display = 'none';
}

/* ---- 7-STEP TRACE (identical UX to demo_app/index.html) ---- */
function startRun(id, isService){
  const result = isService ? P.runReactivation(id, LEDGER) : P.runConversion(id, LEDGER);
  currentSteps = result.steps;
  currentIndex = 0;
  currentOutcome = result;
  document.getElementById('trace').innerHTML = '';
  document.getElementById('inbox').innerHTML = '<h2>Consultant Inbox / Escalation</h2><div class="empty">Steps still running…</div>';
  document.getElementById('controls').style.display = 'flex';
  renderLedger();
  revealNext();
}

function revealNext(){
  if (currentIndex >= currentSteps.length){ renderInboxFinal(currentOutcome); return; }
  const s = currentSteps[currentIndex];
  const div = document.createElement('div');
  div.className = 'step' + (s.alert?' alert':'') + (s.gate?' gate':'');
  let bodyHtml = s.body ? `<div class="stepbody">${s.body}</div>` : '';
  if (s.brief){
    const b = s.brief;
    bodyHtml = `<div class="brief">
      <b>${b.customer_name}</b> — ${b.city} — interested in ${b.model_interest}<br>
      ${b.prior_touchpoints}<br>
      <b>Reason:</b> ${b.reason} <span class="grow">(${b.reason_justification})</span><br>
      <b>Suggested talking point:</b> ${b.talking_point}
      ${b.guardrail_note ? `<div class="guardnote">⚠ ${b.guardrail_note}</div>` : ''}
    </div>`;
  }
  div.innerHTML = `<div class="stepname">${s.name}</div>${bodyHtml}`;
  document.getElementById('trace').appendChild(div);
  document.getElementById('trace').scrollTop = document.getElementById('trace').scrollHeight;
  currentIndex++;
  document.getElementById('nextBtn').disabled = false;
  if (currentIndex >= currentSteps.length) renderInboxFinal(currentOutcome);
}

function autoPlay(){
  const timer = setInterval(()=>{
    if (currentIndex >= currentSteps.length){ clearInterval(timer); return; }
    revealNext();
  }, 900);
}

function renderInboxFinal(result){
  const panel = document.getElementById('inbox');
  if (result.outcome === 'escalated_hardship'){
    panel.innerHTML = `<h2>Consultant Inbox / Escalation</h2>
      <div class="escbanner">ESCALATED — routed to ${result.owner}.<br>No automated action taken, per case guardrail.</div>`;
  } else if (result.outcome === 'deduped_skipped'){
    panel.innerHTML = `<h2>Consultant Inbox / Escalation</h2>
      <div class="okbanner" style="background:var(--cap)">Skipped — already contacted for this journey within 7 days.</div>`;
  } else if (result.brief){
    const b = result.brief;
    panel.innerHTML = `<h2>Consultant Inbox / Escalation</h2>
      <div class="okbanner">Proceeded to gate — brief + slot ready for a human</div>
      <div class="inbox-card">
        <h3>${b.customer_name} · ${b.city}</h3>
        <div class="row"><b>Interested in:</b> ${b.model_interest}</div>
        <div class="row"><b>History:</b> ${b.prior_touchpoints}</div>
        <div class="row"><b>Why they didn't book:</b> ${b.reason} — ${b.reason_justification}</div>
        <div class="row"><b>Talking point:</b> ${b.talking_point}</div>
        <div class="row"><b>Proposed slot:</b> ${result.seq.proposed ? result.seq.proposed.label + ' with ' + result.seq.consultant.name : 'none available'}</div>
        <div class="row"><b>Owner:</b> ${result.owner}</div>
      </div>`;
  } else {
    panel.innerHTML = `<h2>Consultant Inbox / Escalation</h2>
      <div class="okbanner">Proceeded to gate — reminder + slot ready for a human</div>
      <div class="inbox-card">
        <h3>${result.customer.name} · ${result.customer.city}</h3>
        <div class="row"><b>Draft:</b> ${result.draft}</div>
        <div class="row"><b>Proposed slot:</b> ${result.seq.proposed ? result.seq.proposed.label + ' with ' + result.seq.consultant.name : 'none available'}</div>
        <div class="row"><b>Owner:</b> ${result.owner}</div>
      </div>`;
  }
}

/* ---- FULL REGRESSION (diagnostic, throwaway ledger) ---- */
function runFullRegression(){
  const scratch = [];
  const rows = [];
  P.TEST_DRIVES.forEach(td=>{
    const cust = P.CUSTOMERS.find(c=>c.mobile_number===td.mobile_number);
    const r = P.runConversion(td.test_drive_id, scratch);
    rows.push(`${td.test_drive_id} — ${cust.name} (conversion): ${r.outcome} — ${r.owner||'—'}`);
  });
  P.SERVICE_RECORDS.forEach(sr=>{
    const cust = P.CUSTOMERS.find(c=>c.mobile_number===sr.mobile_number);
    const r = P.runReactivation(sr.service_id, scratch);
    rows.push(`${sr.service_id} — ${cust.name} (reactivation): ${r.outcome} — ${r.owner||'—'}`);
  });
  const panel = document.getElementById('regressionPanel');
  if (panel){ panel.style.display='block'; panel.innerHTML = '<b>Full regression — '+rows.length+' records</b><br>' + rows.join('<br>'); }
  console.log('Full regression:', rows);
  return rows;
}

/* ---- UNIT TESTS (both guardrails + the new chat boundary screen) ---- */
function assertTest(name, cond){ return { name, pass: !!cond }; }
function runGuardrailTests(){
  const results = [];
  results.push(assertTest("Hardship screen fires on 'lost his job' + 'can't afford'",
    P.hardshipScreen(["He lost his job last month and can't afford this right now."]).fired === true));
  results.push(assertTest("Hardship screen fires on 'cheated' / complaint language",
    P.hardshipScreen(["She felt cheated by the dealership."]).fired === true));
  results.push(assertTest("Hardship screen does NOT fire on a neutral exchange note",
    P.hardshipScreen(["Asked what we'd give for his 2018 sedan on exchange."]).fired === false));
  results.push(assertTest("Hardship screen does NOT false-positive on a pause request alone",
    P.hardshipScreen(["please don't call me for now, I'll reach out when ready"]).fired === false));
  results.push(assertTest("Currency filter catches a ₹ amount",
    P.currencyCommitmentFilter("we could offer ₹10,000 off").clean === false));
  results.push(assertTest("Currency filter catches 'we will guarantee'",
    P.currencyCommitmentFilter("we will guarantee the best deal").clean === false));
  results.push(assertTest("Currency filter does NOT flag plain scheduling language",
    P.currencyCommitmentFilter("book a call within the 48 hour window").clean === true));
  results.push(assertTest("Ledger validation throws with no owner",
    (()=>{ try { P.validateLedgerEntry({owner:null}); return false; } catch(e){ return true; } })()));
  results.push(assertTest("Dedupe guard blocks a second contact within 7 days",
    (()=>{
      const scratch = [{customer_ref:P.hashMobile("9000000000"), journey:"conversion", outcome:"proceeded_to_gate", owner:"Test", timestamp:P.DEMO_NOW.toISOString()}];
      return P.contactedRecently("9000000000","conversion",scratch,P.DEMO_NOW) === true;
    })()));
  results.push(assertTest("Boundary screen blocks a discount request",
    P.boundaryRequestScreen("can you give her a 10% discount").blocked === true));
  results.push(assertTest("Boundary screen blocks an exchange-valuation request",
    P.boundaryRequestScreen("what's her old car worth for exchange").blocked === true));
  results.push(assertTest("Boundary screen does NOT block a plain status question",
    P.boundaryRequestScreen("what did the agent decide for this customer").blocked === false));
  return results;
}

function toggleTestPanel(){
  const p = document.getElementById('testPanel');
  p.style.display = p.style.display === 'block' ? 'none' : 'block';
}

/* ---- CHAT DRAWER ---- */
function toggleChat(){
  document.getElementById('chatDrawer').classList.toggle('open');
  document.getElementById('chatOfflineNote').style.display = (location.protocol === 'file:') ? 'block' : 'none';
}

function addChatMessage(kind, text){
  const box = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'msg ' + kind;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

async function sendChat(){
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message) return;
  if (!currentRole){ addChatMessage('system', 'Pick a role first.'); return; }
  input.value = '';
  addChatMessage('user', message);

  // Deterministic pre-check runs client-side too, identically to the server —
  // this is why it still demonstrates correctly even before deployment.
  const boundary = P.boundaryRequestScreen(message);
  if (boundary.blocked){
    addChatMessage('blocked', `I can't do that — ${boundary.description} is human-only, always. That belongs to a named ${currentRole.id==='service_advisor' ? 'service advisor' : 'sales consultant or dealer principal'}, not this assistant.`);
    return;
  }

  if (location.protocol === 'file:'){
    addChatMessage('system', 'Chat needs this app deployed with an API key configured (see README_DEPLOY.md). The boundary check above still works offline — everything else in this drawer needs the live deployment.');
    return;
  }

  addChatMessage('bot', '…thinking…');
  const thinkingNode = document.getElementById('chatMessages').lastChild;

  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        role: currentRole.id,
        message,
        history: chatHistory.slice(-8),
        ledgerSnapshot: LEDGER.slice(0, 20),
      }),
    });
    const data = await resp.json();
    thinkingNode.remove();
    if (!resp.ok){
      addChatMessage('system', data.error || 'The chat backend returned an error.');
      return;
    }
    addChatMessage('bot', data.reply);
    if (data.guardrail_intercepted){
      addChatMessage('system', '⚠ The pricing/commitment guardrail redacted part of that reply before you saw it.');
    }
    if (data.fallback){
      addChatMessage('system', 'ℹ Live AI explanation unavailable — that reply is the on-file record, not a generated answer. (' + data.fallback_reason + ')');
    }
    chatHistory.push({role:'user', content:message});
    chatHistory.push({role:'assistant', content:data.reply});
  } catch (e){
    thinkingNode.remove();
    addChatMessage('system', 'Could not reach the chat backend: ' + e.message);
  }
}

/* ---- BOOT ---- */
window.addEventListener('DOMContentLoaded', ()=>{
  renderRoleGrid();
  renderQueue();
  renderLedger();
  const results = runGuardrailTests();
  const passed = results.filter(r=>r.pass).length;
  const badge = document.getElementById('selftest');
  badge.textContent = `Guardrail self-test: ${passed}/${results.length} passed`;
  badge.className = passed === results.length ? 'pass' : 'fail';
  document.getElementById('testPanel').innerHTML = results.map(r=>
    `<div class="${r.pass?'p':'f'}">${r.pass?'✓':'✗'} ${r.name}</div>`).join('');
  console.log('Asteron Agent guardrail self-test:', results);
});
