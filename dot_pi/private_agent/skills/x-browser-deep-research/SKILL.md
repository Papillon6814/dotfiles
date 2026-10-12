---
name: x-browser-deep-research
description: X/Twitter を既存 Chrome のブラウザ画面から深く調査する。X の投稿・検索・会話・引用・アカウント動向を、API を使わず複数ラウンドで検証したい依頼に使う。
---

# X browser deep research

Read `../social-browser-research-common/WORKFLOW.md` completely before starting, then read the `chrome-cdp` skill it names. Use the installed `research_checkpoint` from `pi-deep-research-exa` for the iterative evidence gate. This skill is **browser-only**: do not invoke the Finn `x-deep-research` API workflow, X API, web search, fetch tools, scrapers, browser profiles or hidden endpoints as collection fallbacks. In a Finn project, also follow its confidentiality and output rules; when restricted data is present, keep the report in the protected local run directory rather than a tracked project folder.

## X-specific research path

1. Agree on keywords, exact account handles, dates/languages, and whether the target is brand mentions, an event, audience opinion or competitors. Confirm the Chrome tab is `x.com` (or `twitter.com` redirecting to it), scoped to the account the user is already authorized to use. If logged out or search is unavailable, say so rather than using another account.
2. Start with X's visible search UI: independently try exact phrases, spelling variants and relevant account/hashtag terms. Compare the visible **Top** and **Latest** results when present and record which mode produced each candidate; do not assume the modes are exhaustive, chronological or identical for other viewers. Follow a candidate's displayed post permalink and verify author, post time, text and media in the opened page before logging it.
3. For promising posts, open the visible conversation for replies and, where the UI offers it, quote posts. Expand long text with the UI when available. Record who is replying and how many distinct authors are represented; a large engagement count is not a count of supportive opinions. Trace the original source, earlier posts in a thread and later corrections. Sample dissenting and low-engagement results as well as viral results.
4. Revisit relevant profiles' visible recent posts and replies where the UI permits. Compare dates and attribution across multiple accounts; label suspected bots/duplicates as uncertain rather than claiming certainty. Record whether posts are public, account-restricted, or visibility is unclear. Never open Direct Messages or request a follow.
5. After each round, summarize themes, contradictory posts and the next query/author to inspect; call `research_checkpoint` with real source counts. Conclude with a dated, linked report distinguishing direct X evidence from interpretation, and note personalization, missing results, restricted visibility and unverified engagement figures.

Never post, like, follow, bookmark, repost or change account settings. If X requires CAPTCHA/MFA or imposes a rate limit, stop the UI investigation and record the gap.
