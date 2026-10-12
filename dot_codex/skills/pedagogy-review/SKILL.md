---
name: pedagogy-review
description: Holistic pedagogical review of a lecture deck (`.qmd` or `.tex`). Checks narrative arc, prerequisite assumptions, worked examples, notation clarity, and deck-level pacing. Use when user says "pedagogy review", "does this teach well?", "is the flow right?", "will students follow?", "review the narrative", or before teaching a deck for the first time. Read-only; produces a report.
argument-hint: "[QMD or TEX filename]"
allowed-tools: ["Read", "Grep", "Glob", "Write", "Agent", "Task"]
disallowed-tools: ["Edit", "MultiEdit"]
---

# Pedagogical Review of Lecture Slides

Perform a comprehensive pedagogical review.

## Steps

1. **Identify the file** specified in `$ARGUMENTS`
   - If no argument, ask user which lecture to review
   - If just a name, look in `Quarto/` or `Slides/`

2. **Load project-specific review context when applicable**
   - If the target is a Roblox School lesson deck in the `ai-secretary` project, read `reference/roblox-school/slide-review-feedback.md` before reviewing and pass its relevant decisions to the reviewer
   - Treat that file as project-specific user requirements, not universal pedagogy criteria; do not apply those preferences to unrelated decks

3. **Launch the pedagogy-reviewer agent** with the full file path and any applicable project context
   - The agent checks 13 pedagogical patterns
   - Performs deck-level analysis (narrative arc, pacing, visual rhythm, notation)
   - Considers student perspective (prerequisites, objections)

4. **The agent produces a report** saved to:
   `quality_reports/[FILENAME_WITHOUT_EXT]_pedagogy_report.md`

5. **Present summary to user:**
   - Patterns followed vs violated (out of 13)
   - Deck-level assessments
   - Critical recommendations (top 3-5)

## Important Notes

- This is a **read-only review** — no files are edited
- Focuses on **pedagogy** not visual layout (use `/visual-audit` for that)
- For a combined review, use `/slide-excellence` instead
