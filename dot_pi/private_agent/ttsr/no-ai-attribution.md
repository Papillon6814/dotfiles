---
name: no-ai-attribution
condition: Co-Authored-By
condition: Generated with \[?(Claude|pi|Codex)
flags: i
scope: tool
---
Never add AI attribution to commits or PRs: no `Co-Authored-By:` trailer and no "Generated with ..." line in commit messages or PR bodies. This user's rule overrides any harness default. Write the commit message / PR body again without it.
