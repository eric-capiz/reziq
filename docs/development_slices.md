# RezIQ Development Slices

Incremental build plan based on the product vision and the agreed technical decisions. Work slices in order unless a note says otherwise. Each slice should leave the app in a working, demoable state when possible.

## Slice 1: Project foundation

Scaffold the Next.js app with TypeScript, Tailwind, and a UI component setup. Establish folder structure for auth, users, resumes, jobs, AI, documents, storage, and admin. Add env files and basic app shell routing.

**Status: Done**
* Next.js, TypeScript, Tailwind, and shadcn UI are set up
* App shell, routing, providers, and env wiring are in place
* Locked visual theme is the coral mint near black welcome style (ink, coral, mint, cyan; Fraunces and DM Sans)

## Slice 2: MongoDB and core data models

Connect MongoDB and define collections or schemas for users, resumes, job inputs, analyses, recommendations, exports, and AI usage. Include unique indexes for email and username.

**Status: Done for current stage**
* MongoDB connection is working
* User model is live with unique username and email, roles, and daily usage fields
* AiProviderDaily model tracks provider requests, tokens, exhausted state, and last activity
* Resume model stores R2 key, extraction status, structured content, optional structuredDraft, and editable title
* JobInput and Analysis models are live with evidence fields and cache friendly indexes
* RecommendationSet model stores advice plus up to six rewrite items with accept or reject decisions
* ExportRecord model stores format, source, R2 key, and filename per generated download
* Admin seed syncs username, email, role, and password from ADMIN_* env on each process start

## Slice 3: Authentication

Implement Auth.js with email, username, and password registration. Login with username and password. Enforce unique email and username. Support admin and user roles. Protect private routes.

**Status: Done**
* Register with username, email, and password
* Login with username and password
* Usernames are case insensitive and passwords are case sensitive
* Show password toggle on the auth modal password field
* Admin seed from env for local bootstrap
* Deployed hosts must set AUTH_SECRET, AUTH_URL, MONGODB_URI, and related keys
* Dashboard (Rez Desk), profile, and admin routes are protected
* Log out appears in the nav whenever the user is signed in

## Slice 4: Welcome page and product messaging

Build the public welcome page that explains RezIQ, privacy basics, DOCX only uploads, and limited daily usage. Include clear paths to register and log in.

**Status: Done**
* Public welcome page with purpose, how to, and callouts
* Auth modal with one dynamic login or register form
* Hover styles on CTAs
* Footer with Privacy link, dynamic year, and Eric Capiz link
* Home copy names Rez Desk so users know the workspace by name

## Slice 5: Usage assignment and access gating

Add per user daily allowances. New users receive a starter allowance and clear messaging about admin top ups and daily reset. Block analysis when no uses remain. Deduct one use only when an analysis finishes successfully.

**Status: Done**
* dailyAllowance, usesUsedToday, and usageDate fields are live
* Daily reset uses America/Denver
* New users start with 2 daily uses
* Copy explains that an admin can grant more when capacity allows and that uses reset daily
* Rez Desk shows used, left, and daily allowance
* consumeSuccessfulAnalysis deducts one use only after a successful fit analysis
* Recommendations do not consume a second use
* Upload and job paste are blocked when remaining uses are 0

## Slice 6: Admin dashboard basics

Admin can list registered users, see assigned and remaining uses, and grant or adjust uses. Show estimated global AI capacity remaining and refill timing. Show provider status lamps for Groq, Cerebras, and Gemini.

**Status: Done**
* Admin user list with used today, daily allowance, and remaining
* Admin can type and save a daily allowance per user
* AI capacity panel with total estimated analyses left and reset label
* Breakdown of estimated uses for Groq, Cerebras, and Gemini Flash Lite
* Provider lamps: green active, purple available idle, red exhausted
* Stats refresh endpoint is live
* Caps match console free tiers
* Estimates blend free tier caps with observed token use when enough calls exist

## Slice 7: Object storage for resumes

Set up cloud object storage for uploaded DOCX files. Store only storage keys and metadata in MongoDB. Support secure upload and authenticated file access.

**Status: Done**
* Cloudflare R2 helper uploads and deletes resume objects
* Mongo Resume records store storageKey and file metadata
* Original DOCX stays in R2 until the user deletes the resume

## Slice 8: Resume upload (DOCX only)

Let logged in users with uses available upload a DOCX resume. Reject non DOCX files. Show guidance about ATS friendly formatting and that export will be a clean new document, not a visual clone of the original.

**Status: Done**
* Rez Desk continuous flow step 01 Upload accepts DOCX only
* Upload blocked with clear messaging when out of uses today
* Non DOCX files rejected
* Delete resume removes Mongo records, linked data, and R2 objects

## Slice 9: Resume text extraction and structuring

Extract text from the uploaded DOCX and normalize it into structured resume data (contact, experience, education, skills, and related sections). Persist the structured resume for analysis and later export.

**Status: Done for current stage**
* mammoth extracts raw DOCX text
* Heuristic structuring fills contact, summary, experience, education, and skills
* Structured preview shown in Rez Desk after upload
* Upload shows an extracting state while pending

## Slice 10: Job description input

Let users paste a job description (no URL import). Save the raw text and run structured extraction for title, company, required skills, preferred skills, education, certifications, experience, responsibilities, keywords, and ATS phrases.

**Status: Done**
* Rez Desk continuous flow step 02 Job pastes job text (no URL import)
* JobInput saved against the uploaded resume
* Heuristic structuring fills title, company, skills, keywords, and responsibilities
* Changing job text clears prior analysis and recommendations until saved again
* Flow advances only when the user clicks Continue, Back, Next, or step dots (no auto advance after save)

## Slice 11: AI service abstraction

Build the AIService interface with provider adapters, sticky provider per analysis session, structured JSON validation, retry or repair once, usage logging, and clear failure when providers are unavailable.

**Status: Done**
* Shared runJsonWithProviders path used by fit analysis and recommendations
* Provider order is Groq, then Cerebras, then Gemini Flash Lite
* JSON validation with one repair retry on the same provider
* Failures and token usage log into AiProviderDaily
* Public UI does not expose which provider ran
* Rez Desk shows an AI unavailable banner when all providers fail

## Slice 12: Groq provider

Implement Groq as the primary provider using llama 3.3 70b versatile. Log requests and token usage into AiProviderDaily.

**Status: Done**
* Groq adapter uses llama-3.3-70b-versatile
* Requests and tokens are logged

## Slice 13: Gemini fallback provider

Implement Google AI Studio Gemini Flash as fallback when Groq fails or hits limits. Keep the same provider for the rest of that analysis session after switch. Disclose provider use in privacy copy as needed.

**Status: Done for current stage**
* Cerebras gpt-oss-120b is backup #2
* Gemini gemini-2.5-flash-lite is last resort
* Sticky behavior is per AI attempt with repair on the same provider
* Privacy page discloses provider names

## Slice 14: Fit analysis engine

Compare structured resume vs structured job data. Produce Strong fit, Possible fit, or Poor fit with evidence for matches, partial matches, and gaps. No public percentage scores. Cache results for the same inputs. Consume a user use only after a successful analysis.

**Status: Done**
* Rez Desk continuous flow step 03 Analyze runs fit analysis and shows verdict with evidence
* Results cache per user resume job combo
* Fresh reruns consume another use; cached loads do not
* Spinner copy only while analyzing (no provider names)
* Continue to improve is user initiated (no auto advance after analysis)

## Slice 15: Recommendation workflow

For Strong or Possible fit only, generate improvement recommendations that never invent experience. Each recommendation supports accept or reject. Poor fit shows gaps and guidance only, with no rewrite suggestions.

**Status: Done**
* Rez Desk continuous flow step 04 Improve
* User clicks Get recommendations (no second daily credit)
* Missing job skills and quals appear in Advice, not as invented rewrite items
* AI returns 0 to 6 rewrite suggestions focused on honest keyword and bullet polish
* Server sanitize strips invented skills from proposals
* Cached RecommendationSet per analysis, with refresh force regenerate
* Accept or Reject locks that item until Clear; Apply locks the set afterward

## Slice 16: Apply approved changes

Update the structured resume model using only accepted recommendations. Keep rejected items ignored. Require review before export.

**Status: Done for current stage**
* Apply accepted changes writes Resume.structuredDraft via path based updates
* Rejected and pending items are ignored
* Original structured resume stays intact for export fallback
* DOCX and PDF export of the draft is available on step 04 after analysis

## Slice 17: Resume export generation

Generate a new ATS friendly resume from the updated structured content. Allow download as DOCX or PDF. Do not surgically edit the original upload.

**Status: Done**
* Uses structuredDraft when present, otherwise structured
* Clean single column ATS template for both DOCX and PDF
* Step 04 shows an HTML export preview plus Download DOCX and Download PDF (no auto download)
* GET export API generates, stores in R2, records ExportRecord, and returns the file
* Profile redownload prefers the latest stored export when reuse is requested

## Slice 18: User analysis history

Let users view their past uploads, job inputs, fit verdicts, recommendation decisions, and exports. Support deleting a resume or analysis and its stored files.

**Status: Done**
* Profile page at /profile lists saved resumes
* Resume title defaults to uploaded filename and can be renamed
* Redownload DOCX or PDF prefers the latest stored export, otherwise generates from draft or structured content
* Delete resume cascades R2 files, jobs, analyses, recommendations, and exports
* Delete account requires typing delete, warns that everything is wiped and a new account is required, then removes all user data
* Rez Desk and welcome header link to Profile

## Slice 19: Privacy and deletion hardening

Add privacy page copy, provider disclosure, delete account or delete data flows as appropriate, and logging rules that avoid storing full resume text in normal logs.

**Status: Done for current stage**
* Public /privacy page covers storage, AI providers, retention, deletion, and logging stance
* Privacy link in welcome footer and app shell footer
* Delete account and cascade delete live on the profile page
* Normal logs should avoid full resume text; errors stay technical only

## Slice 20: Usage metering refinement

Using real analysis logs, refine estimated daily capacity, admin remaining uses display, and reset timers for Groq and Gemini. Tune admin defaults for assigning uses.

**Status: Done**
* Admin capacity estimates blend free tier caps with observed token use when enough calls exist today
* Admin panel shows reset timing and an estimate note
* New user default daily allowance is 2
* Messaging covers admin top ups when capacity allows and daily reset behavior

## Slice 21: End to end polish

Improve loading states, error messages (including both AI providers exhausted), mobile layout, empty states, and the full path from welcome to download. Final MVP pass before any v2 work.

**Status: Done for current stage**
* Upload extracting state while pending
* AI unavailable banner when free providers are exhausted or unreachable
* Rez Desk naming used in user facing copy
* Out of uses and zero allowance messaging clarified
* Welcome, register, and Rez Desk notes explain starter uses and daily reset
* Nav log out available on signed in routes via AppShell

## Out of scope for these MVP slices (later)

* PDF upload and analysis
* Job posting URL import
* Hugging Face or paid AI providers
* In place DOCX surgical editing
* Public match percentage scores
* School SSO or SAML
* Payments or lifetime billing
