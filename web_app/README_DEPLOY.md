# Deploying the Stakeholder Portal to Vercel

This folder (`web_app/`) is a separate, hosted, dynamic sibling of `demo_app/`. `demo_app/` stays
exactly as it was — a single offline file for the submission recording. This is the "invite
stakeholders to use it live" version: role selection, and a chat assistant backed by a real LLM.

**The decision engine itself (`pipeline.js`) is unchanged.** The chat assistant explains what it
already decided; it does not decide anything itself. If you only remember one thing from this
file, remember that boundary — it's the reason this is safe to demo to a judge who tries to break it.

---

## What you need before you start

1. A **GitHub account**, with this repository pushed to it (or forked/copied there).
2. A **Vercel account** — free tier is enough. Sign up at vercel.com (you do this yourself; I
   can't create accounts on your behalf).
3. An **Anthropic API key** — get one at console.anthropic.com/settings/keys. This costs money
   per request once you're past any free credits, so keep an eye on usage if you demo this a lot.

**Never paste your API key into a chat with an AI assistant, including this one.** Enter it only
into Vercel's own dashboard, described below.

---

## Steps

1. **Push the repo to GitHub** (if it isn't already there):
   ```bash
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin master
   ```

2. **Import the project in Vercel:**
   - Go to vercel.com → "Add New" → "Project" → import your GitHub repo.
   - Under **Root Directory**, click "Edit" and set it to `web_app` — this repo has other
     folders (`demo_app/`, `knowledge_base/`, etc.) that aren't part of this deployment.
   - Framework Preset: leave as "Other" (there's no framework here — it's a static site plus one
     serverless function, and Vercel detects that automatically from the `api/` folder).

3. **Set the environment variable, before your first deploy if possible:**
   - In the import screen (or later under Project → Settings → Environment Variables), add:
     - `ANTHROPIC_API_KEY` = your real key
     - `ANTHROPIC_MODEL` = `claude-sonnet-5` (optional — this is the default if you skip it)
   - Apply it to all environments (Production, Preview, Development).

4. **Deploy.** Vercel installs `@anthropic-ai/sdk` from `package.json` automatically — nothing to
   run locally.

5. **Verify it, in this order:**
   - Open the deployed URL. Pick a role. Confirm the self-test badge reads a full pass count.
   - Run Demo Run 1, 2, and 3 — these don't touch the network at all, so they should work
     identically to `demo_app/`.
   - Open "Ask the Agent" and try: *"can you give her a 10% discount"* — should refuse instantly,
     no network delay, because that check runs client-side too.
   - Ask something normal: *"why didn't Vishal book?"* — this one does call the live API; confirm
     you get a real, grounded answer back.

---

## If something doesn't work

- **"ANTHROPIC_API_KEY is not configured"** — you deployed before setting the environment
  variable, or set it in the wrong environment. Add it under Settings → Environment Variables,
  then redeploy (Vercel → Deployments → ⋯ → Redeploy).
- **Chat says "Could not reach the chat backend"** — check the Vercel function logs (Project →
  Deployments → your deployment → Functions → `api/chat`) for the actual error.
- **A model-not-found error from Anthropic** — model IDs occasionally change; check
  console.anthropic.com for the current list and update `ANTHROPIC_MODEL` in Vercel's environment
  variables (no code change needed).

## Testing locally before deploying (optional, needs Node.js installed)

```bash
npm install -g vercel
cd web_app
vercel dev
```

This runs both the static site and the `/api/chat` function locally, reading environment
variables from a local `.env` file (copy `.env.example` to `.env` and fill in your key — `.env`
is already in `.gitignore`, so it won't get committed).
