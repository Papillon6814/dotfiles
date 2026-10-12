---
name: instagram-browser-deep-research
description: Instagram を既存 Chrome のブラウザ画面から深く調査する。公開・閲覧権限のある限定公開のプロフィール、投稿、Reels、コメントを複数ラウンドで検証したい依頼に使う。
---

# Instagram browser deep research

Read `../social-browser-research-common/WORKFLOW.md` completely before starting, then read the `chrome-cdp` skill it names. Use the installed `research_checkpoint` from `pi-deep-research-exa` for iterative evidence review. This skill is **browser-only**: do not use Instagram APIs, web search, scraping services, network interception, or hidden endpoints as collection substitutes. In a Finn project, follow its confidentiality rules; restricted evidence and its detailed report belong only in the protected local run directory.

## Instagram-specific research path

1. Agree on profiles, brand/topic terms, hashtags, region/language and date range. Verify the existing Chrome tab is `instagram.com` and that any limited-visibility material is already visible to the current authorized account. Do not request access, follow accounts or switch identities to expand coverage.
2. Inspect visible search suggestions and results for profile/hashtag/topic variants. Instagram's web UI and hashtag search coverage can vary: record what appeared and what did not load, without inferring that absent search results mean absent posts. Compare posts and Reels from at least two independent profiles or search paths when available.
3. Open candidate posts/Reels through visible UI and verify their own permalink, author, timestamp (or note that the date is unavailable), caption, visible metrics and comments. For a video, inspect frames and audio available through ordinary UI playback; if audio is not intelligible, mark the transcript unavailable rather than guessing. If a carousel has multiple frames, record which frames were actually inspected. Capture only relevant excerpts, not a full page exposing unrelated private accounts.
4. Read comment threads and visible replies for support and dissent. Distinguish creator statements from audience comments, ad/sponsored labels from organic posts, and per-post visible interactions from reach or unique users. Investigate outliers and older/newer posts to avoid treating the recommendation feed as a random sample.
5. Run follow-up rounds on emerging creators, mentions or hashtags through the UI; log restricted/public visibility per post and use `research_checkpoint` after each real round. In the report, cite post permalinks and capture times, highlight personalized ranking, missing UI metrics, deleted/ephemeral content and cases where a permalink or posting date could not be confirmed.

Never use Direct Messages, like/comment/save/follow/share, or change settings. If login, permissions, challenge screens or rate limits interrupt access, stop that path and report the gap.
