---
name: running-roadmap-audits
description: Use when the author of "De Espacio-Tiempo" wants to audit the game, give feedback on what works and what doesn't (game design, narrative, engineering, art, animation, audio), review progress, or build or refresh the development roadmap — e.g. "hagamos una auditoría", "armemos un nuevo roadmap", "¿qué falta por mejorar?", "revisemos el roadmap".
---

# Running Roadmap Audits (De Espacio-Tiempo)

## Overview

An audit is a **question-driven interview with the author**. The output is
`docs/roadmap.md`: tasks with inputs and outputs, grounded in the author's own
opinions. Claude asks, records, and synthesizes. Every finding must trace back
either to something the author said or to a fact in the repo. Claude's own
suggestions are labeled as such.

**REQUIRED BACKGROUND:** CLAUDE.md, including its invariants and narrative canon.

## 1. Load Context Before Asking Anything

Read these first, so that every question is anchored to the real state of the game:

- `CLAUDE.md`
- `docs/roadmap.md` and any ADRs in `docs/adr/`
- every act brief in `docs/superpowers/specs/`
- the project memories
- `git log` since the date of the last roadmap

For a broad code inventory, use one Explore agent. Its job is to report
systems, the gameplay loop, rendering, audio, UI, tests, CI, and leftovers.

**If a previous roadmap exists, this is a re-audit:**

- Mark each previous task as done, in progress, dropped, or pending, and check
  that against the code and git history.
- Bring open decisions forward, and ask about them first.
- Do not re-ask what the author already decided. State it as an inherited fact.
- Re-confirm the "lo que se protege" list. The author can retire items from it.

## 2. Interview: One Round Per Area, In This Order

| # | Area | Covers |
|---|---|---|
| 0 | Visión y alcance | Goal, platform, team, release dates, scope of the next release, how the player should feel at the end |
| 1 | Game design | Core mechanic, structure and pacing, hints, narrative and text, ending, multi-act flow |
| 2 | Ingeniería | Performance on real devices, deploy, analytics, author tooling, debt, tests, accessibility, big refactors |
| 3 | Arte y animación | Style, post-processing, protagonist visibility, key moments, asset pipeline, UI and typography, identity across acts |
| 4 | Audio y sonido | The album song in-game, missing sounds, reactive music, voice, silence |

Each round has the same shape:

1. **State 3–6 "hechos de partida"** taken from the repo. These are what the author reacts to.
2. **Closed questions with `AskUserQuestion`.**
   - At most 4 questions per call.
   - Each question names its area in the text, for example "Arte · …".
   - Use `multiSelect` when the options are not mutually exclusive.
   - Add a second call if the area needs more questions.
3. **1–3 open questions in chat.** These cover what options can't capture, such as references, the best and worst moment, and "¿algo que no pregunté?".
4. **Ask what must not be touched.** In round 0, ask once for the whole game. In the other rounds, ask only when the answer is not yet clear.
5. **Acknowledge in one short paragraph**, then move on. **Propose no solutions during the audit.**

The interview is in Spanish, because the author and the game are Spanish-language.

### Handling Author Inputs

- **Images:** if the author shares `.jfif` or `.webp` files, copy them to the scratchpad as `.jpg` before reading them. The Read tool shows them as binary otherwise. Describe what you see and what it implies for the game.
- **Contradictions:** if two answers contradict each other (for example, "solo Acto I" but "quiero Actos 1 y 2 pronto"), name the conflict and state your interpretation. Do not ignore it.
- **Tools or MCPs the author mentions:** check that they are connected in this session. If one is not, say so and record it as an open decision or prerequisite.

## 3. Validate, Then Write

Before writing any file, post a **findings summary** in chat:

- vision
- what is protected
- for each area: what to fix, what to change, and what to create
- what depends on the author

Ask the author to confirm or correct it. Only after they confirm, write the roadmap.

**Re-audits:** move the previous roadmap to `docs/roadmaps/<fecha>-roadmap.md`
before you overwrite `docs/roadmap.md`.

## 4. Roadmap Shape (`docs/roadmap.md`)

These sections, in this order:

1. **Header:** the audit date, and a reminder that the briefs remain the narrative source of truth.
2. **Visión:** goal, platform, team, calendar of releases, and the target feeling.
3. **Lo que se protege.**
4. **Hallazgos por área:** a table with the columns Funciona | No funciona | Falta.
5. **Decisiones abiertas:** a table with the columns #, decision, quién decide, what it blocks.
6. **Tareas,** grouped into phases: Fase 0 (desbloquear), then one phase per release. Each task includes:
   - an ID prefix: `ENG`, `DIS`, `ART`, `UI`, `AUD`, `REL`. On a re-audit, keep existing IDs and continue the numbering.
   - size (S/M/L) and priority (P0/P1/P2)
   - **Inputs:** what is needed, and whether it comes from the author
   - **Output:** a concrete deliverable, with a file path when there is one
   - **Hecho cuando:** a criterion that can be checked
   - dependencies, and a warning wherever an invariant is at risk (`rng()` order, localStorage keys, three 0.160.0, mobile-first)
7. **Inputs que dependen del autor:** a checklist.
8. **Orden sugerido.**

## 5. Afterwards

- **Memory:** save new facts that span sessions, such as vision, release dates, links, references, and tool decisions. Update existing memories instead of duplicating them.
- **CLAUDE.md:** keep the pointer to `docs/roadmap.md` there, and update "Estado actual" if the audit changed it.
- **Git:** do not commit unless the author asks.

## Project Rules That Shape Tasks

- **The author writes all in-game text.** Text tasks are split in two: Claude writes a guide or review, and the author does the writing.
- **New canon goes through the briefs.** A task that changes canon first updates or creates a brief, using the `generating-act-briefs` skill. Never resolve reserved threads early.
- **Architecture decisions become ADRs** in `docs/adr/`.

## Common Mistakes

| Mistake | Fix |
|---|---|
| Asking abstract questions such as "¿qué opinas del arte?" | Anchor each question on a repo fact, for example "Hoy no hay post-procesado; ¿le falta bloom?" |
| Proposing fixes mid-interview | Record the finding only. Solutions belong in the roadmap. |
| Writing the roadmap before confirming the summary | Always validate the findings summary first. |
| Tasks such as "mejorar la nave" | Name the inputs, the output, and a checkable "hecho cuando". |
| Claude drafting in-game text "to save time" | Write a writing guide; the author writes the text. |
| Re-asking settled decisions on a re-audit | State them as inherited facts. Ask only what is new or still open. |
| Silently ignoring a tool the author says is installed | Verify it and report whether it is connected. |
