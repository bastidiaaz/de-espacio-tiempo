---
name: generating-act-briefs
description: Use when asked to create, draft, or write the narrative design brief for an act of "De Espacio-Tiempo" (formerly "Lumen Vale") — any task framed as "haz/crea el brief del Acto N", anchoring that act to an album track/song, before writing any brief content from lyrics or a thematic summary.
---

# Generating Act Briefs (De Espacio-Tiempo)

## Overview

"De Espacio-Tiempo" is a game where each act is the playable adaptation of one
track of the album "despacio-tiempo", in tracklist order. Each act's brief is
produced through a **collaborative brainstorming dialogue with the album's
author** — never written unilaterally from the lyrics or a thematic summary,
because the decisions it captures (device, setting, climax shape, what stays
open) are the author's calls, not something inferable from lyrics text alone.

**REQUIRED BACKGROUND:** superpowers:brainstorming, architectural path. This
skill is that path, specialized: fixed required inputs, a fixed set of
question areas, and a fixed output shape/location. Having an earlier act's
brief as a formatting example is not permission to skip the dialogue — the
*format* is reusable, the *content decisions* are not.

## Before Asking Anything: Load Canon

Read every existing brief in `docs/superpowers/specs/*-de-espacio-tiempo-acto*-design.md`,
in act order. Extract: protagonist, language, narrative device, world/engine
constraints, what each prior act resolved, and what each deliberately left
open for a later act (e.g. "Acto I deja sin resolver si volverá a volar;
Acto VI, 'el regreso', lo cobra"). Never re-ask something an earlier approved
brief already decided — state it as inherited fact, and ask only what is new
for this act.

## Required Inputs — Block on These, Don't Guess

- **Full lyrics** of the act's track, not just a thematic summary. The brief
  must quote or closely paraphrase a memorable phrase in the act's closing
  beat; a summary can't supply that.
- **Track position** and, if known, what the *next* track is about — needed
  to know what this act must leave open rather than resolve.
- Confirmation of which open thread(s) left by prior acts this act may touch.

If any of these is missing, stop and ask for it before drafting anything —
this is architectural-path work, same as Act I; it does not become a
one-shot writing task just because an earlier brief exists as a template.

## Question Areas (ask one at a time, via AskUserQuestion, same as Act I)

| # | Area | What it resolves |
|---|------|-------------------|
| 1 | Carry-over check | Anything about the inherited premise/device that should evolve or break for this act? |
| 2 | Setting | Same engine-rendered space (valley/ship/etc.) reinterpreted again, or does this act need something new in-world? |
| 3 | Protagonist's internal state | What lens/struggle does this act add or shift, vs. the inherited one? |
| 4 | Relational thread | Does this act name/introduce a connection that prior acts left open, or deliberately keep it open still? |
| 5 | Core mechanism | What concrete event/object story maps to this song's central imagery — the engine of its mystery or focus? |
| 6 | Climax direction | Backward discovery, forward hook, or other — and how does it stay "big but inconclusive" given the album's full arc? |
| 7 | Structure | Reuse the existing chapter/object shape (radius-growing chapters, gaze-to-reveal objects) as-is, or does content require a structural change? Any structural/engine change is a bigger ask — flag it explicitly and get separate confirmation, per `CLAUDE.md`'s engine invariants. |

## Output Contract

Follow brainstorming's architectural flow end to end: present each section in
chat for confirmation, then write the final brief to
`docs/superpowers/specs/YYYY-MM-DD-de-espacio-tiempo-acto<N>-<slug>-design.md`
and commit it. Mirror the Act I brief's section structure: Contexto, Canción
ancla (letra completa), Decisiones de diseño (numbered, each with its
rationale — split inherited canon from this-act's new decisions), Mapeo de
objetos/recuerdos, Textos de capítulo, Otros textos a reescribir, Notas de
implementación, Verificación. The brief is content-only: it proposes no
engine/mechanic changes unless area 7 above explicitly surfaced and confirmed
one.

## Red Flags — Rationalizations That Mean You're About to Skip the Dialogue

| Rationalization | Reality |
|---|---|
| "Ya tengo el Acto I como ejemplo, puedo replicar el formato sin preguntar" | El formato se copia; las decisiones de contenido no — son del usuario, igual que en el Acto I. |
| "El resumen temático de la canción ya me dice todo lo que necesito" | El Acto I se ancló a la letra completa y citó una frase textual. Un resumen no alcanza — pide la letra completa antes de redactar nada. |
| "Nadie me va a contestar ahora, mejor asumo y sigo" | Esto es trabajo arquitectónico, igual que el Acto I: si falta algo bloqueante, se pregunta y se espera, no se asume. |
| "Ya sé qué contestaría el usuario, calza con el Acto I" | Cada acto tiene su propia canción y su propio giro. No traslades una decisión del Acto I a este acto sin confirmarla de nuevo para este caso específico. |
| "Es solo rellenar la misma plantilla con otra canción" | La plantilla es la forma del documento, no un generador de contenido. El contenido todavía requiere el mismo diálogo de preguntas. |

## Common Mistakes

- Writing the brief in one pass from the thematic summary, skipping
  AskUserQuestion entirely.
- Re-deciding something already fixed by an earlier brief (e.g. picking a
  new protagonist name, switching the narrative device, or changing the
  in-game language) instead of inheriting it.
- Resolving in this act's climax a thread an earlier brief explicitly
  reserved for a later act (e.g. resolving "will she fly again" before the
  album's "regreso" act).
- Proposing engine/mechanic changes inside the brief without flagging them
  as a separate, bigger decision per `CLAUDE.md`'s invariants section.
- Saving the brief with a filename/date that collides with or overwrites a
  previous act's brief instead of a new dated, act-numbered file.
