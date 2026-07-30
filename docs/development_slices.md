# RezIQ Development Slices

Incremental build plan based on the product vision and the agreed technical decisions. Work slices in order unless a note says otherwise. Each slice should leave the app in a working, demoable state when possible.

## Slice 1: Project foundation

Scaffold the Next.js app with TypeScript, Tailwind, and a UI component setup. Establish folder structure for auth, users, resumes, jobs, AI, documents, storage, and admin. Add env example files and basic app shell routing.

## Slice 2: MongoDB and core data models

Connect MongoDB and define collections/schemas for users, resumes, job inputs, analyses, recommendations, exports, and AI usage. Include unique indexes for email and username.

## Slice 3: Authentication

Implement Auth.js with email, username, and password registration. Login with username and password. Enforce unique email and username. Support admin and user roles. Protect private routes.

## Slice 4: Welcome page and product messaging

Build the public welcome page that explains RezIQ, privacy basics, DOCX only uploads, and limited daily usage. Include clear paths to register and log in.

## Slice 5: Usage assignment and access gating

Add per user assigned uses. New users start at 0 and see a message that an admin will assign uses and they should check back later. Block analysis until uses remain. Decrement uses when a full analysis run starts or completes (decide exact rule during implementation).

## Slice 6: Admin dashboard basics

Admin can list registered users, see assigned and remaining uses, and grant or adjust uses. Show estimated global AI capacity remaining and refill timing placeholders to refine later with real measurements.

## Slice 7: Object storage for resumes

Set up cloud object storage for uploaded DOCX files. Store only storage keys and metadata in MongoDB. Support secure upload and authenticated file access.

## Slice 8: Resume upload (DOCX only)

Let logged in users with uses available (or at least accounts ready for later analysis) upload a DOCX resume. Reject non DOCX files. Show guidance about ATS friendly formatting and that export will be a clean new document, not a visual clone of the original.

## Slice 9: Resume text extraction and structuring

Extract text from the uploaded DOCX and normalize it into structured resume data (contact, experience, education, skills, and related sections). Persist the structured resume for analysis and later export.

## Slice 10: Job description input

Let users paste a job description (no URL import). Save the raw text and run structured extraction for title, company, required skills, preferred skills, education, certifications, experience, responsibilities, keywords, and ATS phrases.

## Slice 11: AI service abstraction

Build the AIService interface with provider adapters, sticky provider per analysis session, structured JSON validation, retry/repair once, usage logging, and clear failure when providers are unavailable.

## Slice 12: Groq provider

Implement Groq as the primary provider using `llama-3.3-70b-versatile`. Log requests and token usage.

## Slice 13: Gemini fallback provider

Implement Google AI Studio Gemini Flash as fallback when Groq fails or hits limits. Keep the same provider for the rest of that analysis session after switch. Disclose provider use in privacy copy as needed.

## Slice 14: Fit analysis engine

Compare structured resume vs structured job data. Produce Strong fit, Possible fit, or Poor fit with evidence for matches, partial matches, and gaps. No public percentage scores. Cache results for the same inputs. Consume a user use for a completed analysis attempt according to the Slice 5 rule.

## Slice 15: Recommendation workflow

For Strong or Possible fit only, generate improvement recommendations that never invent experience. Each recommendation supports accept or reject. Poor fit shows gaps and guidance only, with no rewrite suggestions.

## Slice 16: Apply approved changes

Update the structured resume model using only accepted recommendations. Keep rejected items ignored. Require review before export.

## Slice 17: Resume export generation

Generate a new ATS friendly resume from the updated structured content. Allow download as DOCX or PDF. Do not surgically edit the original upload.

## Slice 18: User analysis history

Let users view their past uploads, job inputs, fit verdicts, recommendation decisions, and exports. Support deleting a resume/analysis and its stored files.

## Slice 19: Privacy and deletion hardening

Add privacy page copy, provider disclosure, delete account or delete data flows as appropriate, and logging rules that avoid storing full resume text in normal logs.

## Slice 20: Usage metering refinement

Using real analysis logs, refine estimated daily capacity, admin remaining uses display, and reset timers for Groq and Gemini. Tune admin defaults for assigning uses.

## Slice 21: End to end polish

Improve loading states, error messages (including both AI providers exhausted), mobile layout, empty states, and the full path from welcome to download. Final MVP pass before any v2 work.

## Out of scope for these MVP slices (later)

* PDF upload and analysis
* Job posting URL import
* Hugging Face or paid AI providers
* In place DOCX surgical editing
* Public match percentage scores
* School SSO / SAML
* Payments or lifetime billing
