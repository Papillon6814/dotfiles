---
name: tiktok-browser-deep-research
description: TikTok を既存 Chrome のブラウザ画面から深く調査する。公開・閲覧権限のある限定公開の動画、プロフィール、コメント、トレンドを複数ラウンドで検証したい依頼に使う。
---

# TikTok browser deep research

Read `../social-browser-research-common/WORKFLOW.md` completely before starting, then read the `chrome-cdp` skill it names. Use the installed `research_checkpoint` from `pi-deep-research-exa` to gate iterative analysis. This skill is **browser-only**: do not use TikTok Research API, web search, scraping services, network interception or hidden endpoints as collection fallbacks. In a Finn project, obey its confidentiality rules; restricted evidence and its detailed report belong only in the protected local run directory.

TikTok search UI quirk (verified in browser trial): `cdp.mjs click <selector>` calls DOM `element.click()` and may not focus the search field; the matched `input[name=q]` can have a 0×0 rectangle even when an accessibility searchbox is visible. First inspect the currently visible search control with `snap` and a bounded layout-only `eval` (or a protected viewport screenshot), then use `clickxy` on a verified visible coordinate. Re-snapshot and confirm `document.activeElement` is the now-visible search input before using `type`. Confirm the query remains in the visible UI and choose the displayed search-results option. Do not set a hidden input's value programmatically or navigate directly to a constructed search URL. If a post opens in a dialog, use its visible close control and verify the results page before the next query.

## TikTok-specific research path

1. Agree on topic/keywords, accounts, hashtags, geographic/language scope and time window. Verify the existing Chrome tab is `tiktok.com`; use only content that the signed-in account already has permission to see. Don't follow or request access to expand coverage.
2. Compare visible search results across keyword variants and, if the UI offers them, video/user/hashtag tabs. Record which search path and ranking mode produced each result. Avoid treating For You recommendations, trending lists or view counts as a representative population sample or reliable engagement rate denominator.
3. Open each relevant video through the UI; verify creator, video permalink, publication date if shown, caption, visible audio/on-screen text and key moments. Watch or replay enough of the video to support a claim; do not infer the full story from a thumbnail or an auto-generated snippet. Mark uncertain speech, translations or unreadable frames explicitly. Record visible counts with capture time, not as historical metrics.
4. Inspect comments/replies and, where the UI visibly links them, related videos, remixes/stitches/duets and creator profiles. Trace the original clip or claim before attributing a trend. Compare contrary examples and older/newer uploads from independent creators; distinguish creators from repost accounts and advertisements when labels are visible.
5. Revisit emerging hashtags/authors and repeat substantive rounds within the approved budget; call `research_checkpoint` after each actual round. Report with direct video permalinks, times, sample limitations, visibility labels and notes on unavailable comments, audio, dates or personalized results.

Never open inbox/DMs, like, follow, comment, share, purchase, download content or change settings. Stop if TikTok shows CAPTCHA/MFA, authorization prompts, anti-bot warnings or rate limits; do not bypass them.
