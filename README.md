# RezIQ

RezIQ is a free AI powered resume analysis and optimization platform.

## What it does

Job seekers, students, and career changers upload a resume and paste a job description. RezIQ compares the resume to the real job posting and explains how well they match.

The product is an AI career assistant, not a generic AI resume writer. Feedback is evidence based. It shows what matches, what partially matches, and what is missing, using proof from the resume whenever possible.

## Core user flow

1. Upload a resume as a DOCX file in Rez Desk
2. Paste a job description (optionally add one job title, company, and posting link for Profile tracking)
3. Review an overall fit verdict (Strong fit, Possible fit, or Poor fit) with evidence
4. Read evidence based explanations for matches, partial matches, and gaps
5. If the resume is close enough, accept or reject improvement recommendations (no rewrite suggestions when fit is poor)
6. Download an updated resume as a new clean ATS friendly DOCX or PDF when improvements were approved
7. Manage history, posting details, titles, redownloads, and account deletion from Profile

## Product principles

* Never invent skills, jobs, certifications, achievements, or metrics
* Only suggest changes the user can honestly claim
* Prefer clear, ATS friendly formatting over fancy visual layouts
* Privacy first: do not sell resume data, do not use resumes for RezIQ training, and let users delete uploaded files and accounts
* Keep the long term vision open to schools, universities, career centers, and workforce programs

## MVP scope notes

* DOCX upload only for now
* PDF support is planned for a later version
* Job description is pasted by the user (no job link import for MVP)
* No public match percentage scores; use fit verdicts with evidence instead
* Exported resumes are newly generated from structured content plus approved edits, not surgical edits of the original file layout
* Upload is DOCX only; download can be DOCX or PDF
* New accounts start with 2 daily uses; an admin can grant more when capacity allows; uses reset daily

## Stack snapshot

* Next.js, TypeScript, Tailwind, Auth.js
* MongoDB for users, resumes, jobs, analyses, recommendations, and exports
* Cloudflare R2 for resume and export files
* AI order: Groq (`llama-3.3-70b-versatile`), then Cerebras (`gpt-oss-120b`), then Gemini (`gemini-2.5-flash-lite`)

## Local setup

1. Copy env values for Auth, MongoDB, AI keys, R2, and optional admin seed
2. Install packages with `npm install`
3. Run `npm run dev`
4. Open the app, register or log in, and use Rez Desk

## Future features

### Usage clarity

Show remaining daily uses, when the next reset happens, and a short note on what counts as a use. This should cut confusion around metering without changing how analysis charges work.

### Export polish presets

Offer a few ATS safe layout presets such as classic or compact, plus simple section order choices. Exports stay newly generated templates, not surgical edits of the original file.

### Version history

Let users compare an earlier resume version with the draft after accepted recommendations. A short change summary helps students and coaches see what moved.

### Cover letter

After a Strong or Possible fit, users will generate a short cover letter from the job description and their approved resume content. The letter will stay evidence based and will not invent experience, skills, or achievements. Users will review and edit before export.

### PDF upload

Users will upload resumes as PDF in addition to DOCX. RezIQ will extract text, structure the same sections used today, and run the full fit analysis and recommendation flow. Download will stay available as DOCX or PDF.

### Resume from scratch

Users paste a job description first, answer contact and history questions, and confirm skills with checkboxes for what they truly have. RezIQ generates a draft only from confirmed facts, then runs the normal fit analysis so honesty stays intact.

## Status

MVP core flow is implemented through polish and metering refinements. Optional later work includes the future features above, plus items such as job URL import and school SSO.
