# RezIQ Technical Risks and Agreed Decisions

Discussion of potential technical risks and alternative approaches. As each item is discussed, the agreed recommendation is recorded below it.

## 1. Faithful DOCX editing

**Risk:** Surgically editing an uploaded `.docx` in place (preserving original fonts, spacing, sections, layout) is fragile. Real resumes often use tables, columns, text boxes, and designed templates that break under in place XML edits.

**Agreed recommendation:**
* Do **not** edit the uploaded DOCX in place for MVP.
* Extract resume content into structured data.
* Apply only user approved changes to that structured content.
* Generate a **new** `.docx` from a clean ATS friendly template (original content plus approved edits).
* Be clear in the UI that RezIQ optimizes content and ATS structure, not exact visual cloning of fancy templates.
* Optional later (v2): attempt in place edits only for simple single column DOCX; fall back to template export when complexity is detected.

## 2. PDF editing parity with DOCX

**Risk:** PDFs are display formats, not editable documents. Analyzing and especially editing PDFs usually means extract then rebuild, with formatting drift. Scanned or image PDFs need OCR and add more cost and complexity. Promising PDF parity with DOCX overpromises for MVP.

**Agreed recommendation:**
* **MVP: DOCX upload only.** Do not accept PDF uploads in v1.
* PDF upload and PDF based editing are deferred to **v2**.
* **MVP export may offer both DOCX and PDF downloads** of the newly generated resume from structured content.
* This avoids OCR, weak extraction, and original PDF layout rebuild problems on upload, while still letting users download a clean PDF version.

## 3. Job posting URL extraction

**Risk:** Job board URLs are unreliable to scrape. Many sites block bots, require login, render with JavaScript, or change markup often. If analysis depends on a successful link fetch, users get stuck.

**Agreed recommendation:**
* **MVP: paste job description only.** No job posting URL or link import.
* Users must enter or paste the job description text themselves.
* Extract structured job fields from that pasted text (title, company, required skills, preferred skills, education, certifications, experience, responsibilities, keywords, ATS phrases).
* URL or link based job import is deferred; revisit later only as optional best effort or official API integrations.

## 4. Multi provider AI fallback complexity

**Risk:** Providers differ in model quality, JSON reliability, context limits, rate limits, and latency. Treating Groq, Hugging Face, and Gemini as equal fallbacks creates inconsistent analysis quality. Hugging Face free endpoints are especially unreliable for structured outputs. Free tiers also require no paid plans and no card on file for this project.

**Agreed recommendation:**
* Build an `AIService` abstraction with provider adapters and usage tracking (provider, date, requests, tokens).
* Keep the same provider for an entire analysis session unless that provider fails mid run.
* Validate structured AI responses (for example with Zod) and retry or repair once before switching providers.
* **MVP providers (prefer no pay, no card on file):**
  1. Primary: Groq (`llama-3.3-70b-versatile`) for best free quality and speed
  2. Backup: Cerebras Free Trial (`gpt-oss-120b`) for volume after Groq
  3. Last resort: Google AI Studio Gemini Flash Lite (`gemini-2.5-flash-lite`)
* Skip Hugging Face for MVP.
* Skip backups that require payment or a card on file when a free path exists (for example OpenRouter paid top ups).
* If all configured providers fail or hit free limits: show a clear message that free AI processing is unavailable for now.
* Regular users see spinner copy only. Provider names stay in admin and server logs.
* Rough admin estimate with current console caps and a ~12k tokens per analysis guess: Groq ~8, Cerebras ~83, Gemini Flash Lite ~125 (shared across all users; model and quota dependent).

## 5. Evidence based match scores that feel fake

**Risk:** Pure LLM percentage scores (for example "82% match") feel untrustworthy, can change between runs or providers, and conflict with an evidence based product promise. Category score dashboards also invite overconfidence and "ATS guarantee" misunderstandings.

**Agreed recommendation:**
* **No public overall percentage score and no category score dashboard for MVP.**
* Give an overall fit verdict with evidence instead:
  * Strong fit
  * Possible fit (close enough to improve)
  * Poor fit (too far apart)
* Base the verdict on matching skills, keywords, experience, education, and other job requirements, with resume evidence shown for matches, partial matches, and gaps.
* Use deterministic matching under the hood for the "close enough" gate so Groq and Gemini stay consistent; AI explains and judges fuzzy cases.
* **Resume improvement recommendations only for Strong fit or Possible fit.**
* **Poor fit: explain gaps only. Do not rewrite or polish the resume.**
* Cache analysis results so the same resume + job input does not change on refresh.
* Soft language only: fit estimate and evidence, never an ATS pass guarantee.
* Never invent skills, jobs, certifications, achievements, or metrics to improve fit.

## 6. MongoDB vs alternatives

**Risk:** Resume analyses are relational (user → resumes → analyses → recommendations → versions). MongoDB works, but Postgres is often cleaner long term for permissions, orgs, and reporting. Choosing Mongo purely for speed can create harder migrations later if school or multi tenant features arrive.

**Agreed recommendation:**
* **Use MongoDB for MVP.**
* Reason: initially one primary user (and at most a tiny user count), so relational complexity is low and Mongo's flexible documents fit resume/analysis JSON well.
* Keep collections modular and consistent (users, resumes, analyses, recommendations, exports, AI usage).
* Store flexible analysis payloads as documents, but keep clear references between user, resume, analysis, and accepted changes.
* Revisit Postgres later only if org/school multi tenancy, complex reporting, or relational pain becomes real.

## 7. Next.js only backend and serverless limits

**Risk:** Next.js API routes and server actions are enough for MVP, but serverless hosts can timeout on long AI calls or heavy DOCX work if everything runs in one request. A separate Express backend would add deploy complexity the project owner wants to avoid.

**Agreed recommendation:**
* **MVP: Next.js only.** No separate Express or standalone backend to deploy.
* Use Next.js API routes and/or server actions for upload, extraction, analysis, approvals, and export.
* Keep domain modules separated inside the Next app so heavy work can be moved later without a rewrite.
* Split the user flow into steps (upload/extract, analyze, export after approvals) instead of one giant request.
* Do not add a job queue on day one.
* Add async background jobs only if real timeouts or slow requests become a problem on the chosen host.
* Prefer one app, one deploy.

## 8. Free AI daily limits vs product promise

**Risk:** Free Groq + Gemini capacity is finite and shared by the whole app. If the product implies unlimited free analysis, users will be blocked with no warning when provider quotas are empty. Exact uses per day also cannot be known perfectly until real analysis runs are measured.

**Agreed recommendation:**
* App stays free to use for MVP. No payments and no card on file.
* Welcome page explains the product and clearly states there is limited usage per day.
* Primary operator is an admin user who can:
  * use the app normally
  * see signed up users
  * see estimated total usages remaining for the day
  * see refill / reset timing (timer or next reset display)
  * manually assign usages to users
* Non admin users can only consume usages the admin assigns.
* Admin capacity UI should treat remaining uses as an estimate at first, plus provider status, because Groq and Gemini use different limit units and reset schedules.
* During development, measure real calls and tokens per full analysis and refine the exact uses per day estimate from live logs and provider consoles.
* Confirm reset timing from provider docs/consoles during build (Groq commonly midnight UTC; Gemini RPD commonly midnight Pacific).
* No soft promise of unlimited free forever in the UI.
* v2 can expand capacity, upgrade to stronger/paid AI, and grow admin tooling if the product finds more users.

## 9. Privacy vs usefulness tension

**Risk:** Resumes contain sensitive personal data. The product needs enough retention to analyze, recommend, export, and revisit work, while privacy goals push toward minimal storage, fast deletion, and no training or resale. Free AI providers also have different data terms, so app policy alone is not enough.

**Agreed recommendation:**
* Privacy first, practical MVP. Do not overbuild school grade compliance yet.
* Clear privacy text on welcome/signup covering what is stored, why, how long, and how to delete.
* Users can delete uploaded resumes and analyses.
* Store only what the product needs: resume file in object storage, structured resume content, job text, analysis results, recommendations, and export artifacts.
* Do not sell resume data.
* Do not use resumes to train RezIQ models.
* Minimize logging; avoid writing full resume contents into normal server logs.
* Admin can see users and usage metadata; do not casually browse full resume contents unless needed for support.
* Retention default: keep data while the account exists, or until the user deletes it. Optional auto delete for inactive data can come later.
* Disclose that resume and job text are sent to AI providers to generate results.
* Prefer Groq first. Be honest that Gemini fallback is subject to Google provider terms, which may differ on free tier data use.
* Stronger university / FERPA style requirements are deferred until institutional adoption is real.

## 10. Auth choice and future school or SSO needs

**Risk:** Rolling custom auth can create security holes, while heavy hosted auth adds cost and lock in. School SSO/SAML matters only for later institutional adoption, not MVP. Open registration still requires secure credential handling even if few people actively use the app.

**Agreed recommendation:**
* **Auth.js (NextAuth) + MongoDB** inside the Next.js app. No separate auth server.
* **No Google sign in. No magic link. No social login for MVP.**
* Registration requires:
  * email
  * password
  * username
* Login uses **username + password**.
* Email and username must both be unique.
* Usernames are stored and compared case insensitive (for example Breezy and breezy are the same user).
* Passwords are case sensitive. Login/register UI should note that passwords are case sensitive.
* Store password hashes only (never plain text). Use a proven hash scheme such as bcrypt or Argon2.
* User roles in Mongo: `admin` and `user`. The operator account is admin.
* Anyone may register. New non admin users start with 0 assigned uses.
* After registration, non admin users start with 2 daily uses. Copy explains that an admin can grant more when capacity allows and that uses reset daily.
* Analysis and export stay locked until the admin assigns uses.
* Admin can list users and assign uses manually.
* School SSO / SAML / Google Workspace login is deferred to a later version if institutions adopt the product.
