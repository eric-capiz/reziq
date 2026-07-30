# RezIQ

RezIQ is a free AI powered resume analysis and optimization platform.

## What it does

Job seekers, students, and career changers upload a resume and provide a job description. RezIQ compares the resume to the real job posting and explains how well they match.

The product is an AI career assistant, not a generic AI resume writer. Feedback is evidence based. It shows what matches, what partially matches, and what is missing, using proof from the resume whenever possible.

## Core user flow

1. Upload a resume as a DOCX file
2. Paste a job description
3. Review an overall fit verdict (Strong fit, Possible fit, or Poor fit) with evidence
4. Read evidence based explanations for matches, partial matches, and gaps
5. If the resume is close enough, accept or reject improvement recommendations (no rewrite suggestions when fit is poor)
6. Download an updated resume as a new clean ATS friendly DOCX or PDF when improvements were approved

## Product principles

* Never invent skills, jobs, certifications, achievements, or metrics
* Only suggest changes the user can honestly claim
* Prefer clear, ATS friendly formatting over fancy visual layouts
* Privacy first: do not sell resume data, do not use resumes for AI training, and let users delete uploaded files
* Keep the long term vision open to schools, universities, career centers, and workforce programs

## MVP scope notes

* DOCX upload only for now
* PDF support is planned for a later version
* Job description is pasted by the user (no job link import for MVP)
* No public match percentage scores; use fit verdicts with evidence instead
* Exported resumes are newly generated from structured content plus approved edits, not surgical edits of the original file layout
* Upload is DOCX only; download can be DOCX or PDF

## Status

Early planning and architecture discussion. Implementation has not started yet.
