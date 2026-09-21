# グローバル設定

## 言語

- 日本語で応答する

## ユーザー環境

- Terminal: Ghostty
- Multiplexer: tmux (Zellij互換モーダル設定)
- Shell: fish (login shell は zsh、tmux default は fish)
- Editor: Neovim
- Coding agent: 普段は pi coding agent を利用している（ただしまだ改善途中であり、不安定な挙動や機能不足がある可能性に留意すること）

## コミュニケーション

- ユーザーに質問・確認する際は必ず `AskUserQuestion` ツールを使うこと（テキスト出力での質問禁止）
- 曖昧な指示や要件が不明確なタスクには、想定される変数がすべて埋まるまで逆質問してから作業を開始すること

## プランニング

- 実装計画を立てる際（EnterPlanMode 使用時）、まず Exa (`mcp__exa__web_search_exa`) でベストプラクティスや公式ドキュメントを調査すること
- 有用な情報源が見つかった場合は `mcp__exa__web_fetch_exa` で内容を確認し、計画に反映する
- 調査対象: フレームワークの推奨パターン、ライブラリの公式ガイド、既知の落とし穴など
- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

## Web 検索

- Web 検索には `mcp__exa__web_search_exa` を優先的に使用する（組み込みの `WebSearch` ではなく Exa）
- ページ内容の取得には `mcp__exa__web_fetch_exa` を使用する

## ブラウザ操作

- ブラウザで実行可能なタスクは、CLI や API ではなく **ブラウザ自動操作ツール（`mcp__claude-in-chrome__*`）を優先的に使用する**
- 例: Web ページの確認・操作、フォーム入力、UI の動作確認など
- **ブラウザ操作は必ずエージェントチームで実行すること**: メイン（コーディネーター）がタスクを分解・指示し、サブエージェント（ブラウザ専用）が `mcp__claude-in-chrome__*` ツールを使って実際の操作を行う
- コーディネーターはブラウザツールを直接呼び出さない。サブエージェントへの指示と結果の統合に専念する

## CLAUDE.md 運用

- CLAUDE.md に内容を追加する際、`rules/` への分割を常に検討すること
- 特定ファイルにしか関係しない知識は `rules/` に分離し `paths` で絞る
- CLAUDE.md は ~500行以内を目安に保つ

## MCP 設定の共有

- Claude Code / Codex 間の MCP 設定を追加・変更・同期する際は、先に `/Users/papillon/.claude/MCP-SYNC.md` を読むこと。
- Claude 側の `~/.claude.json` を元に `python3 ~/.codex/bin/sync-claude-mcp.py --apply` で Codex へ手動同期する。自動同期・双方向同期ではない。

## Codex 側への設定反映

Codex 側の設定対応・更新手順・製品差は `~/.claude/CODEX-PARITY.md` を参照する。MCP 以外は自動同期ではない。

<!-- ZVEC_GREP_START -->
## zvec-grep

Choose the evidence source before the retrieval mode.

### Workspace evidence
- Use the current workspace as the evidence source when the user asks about local material, prior context establishes it as relevant, or the question concerns how the current project works—even if the workspace is not mentioned explicitly.
- A workspace may contain any mix of code, documents, configuration, and data.
- Do not use workspace retrieval for unrelated open-world questions, current external facts, or web content that does not depend on local evidence.

### Retrieval routing
- When an exact word, phrase, name, date, identifier, filename, path, configuration key, error message, source fragment, literal, or regex is known and locating its occurrences is sufficient, use `zvec_grep_rg` when it is listed by the current host; otherwise native Grep or `rg`.
- Use `zvec_grep_search` when wording or location is unknown, or when the answer requires semantic, conceptual, fuzzy, or paraphrase discovery; relationships, chronology, causality, architecture, or data or control flow; or comparison or synthesis across files, sections, or documents.
- For a mixed task with exact anchors that still requires relationships or cross-file synthesis, call `zvec_grep_search` with the concept and anchors, then use `zvec_grep_rg` when it is listed by the current host; otherwise native Grep or `rg` for focused follow-up.
- When no sufficient exact anchor is available and the user asks whether conceptually related material exists locally, make at most one focused `zvec_grep_search` probe using the question plus distinctive names, dates, or terms. This probe does not apply to exact quotations, configuration keys, filenames, regexes, or exhaustive occurrence requests. Continue only when results are relevant; otherwise stop and report that the indexed workspace did not establish the answer.
- Before broad file reads or delegating workspace discovery, use the appropriate search route. Do not delegate solely to locate material, and stop when the evidence is sufficient.

### Search evidence
- Search results include bounded source snippets. Treat a sufficient snippet as already-read evidence, and read a cited file only when a required detail falls outside the snippet.

### Freshness and index lifecycle
- Pass a daemon-visible absolute `root` on every zvec-grep workspace call.
- Read `freshness` and `background_refresh` from search results without a status preflight.
- When results are `served_from_current_index`, use them when sufficient instead of waiting for the background refresh.
- If the index is missing but exact or regex lookup can answer the task, use `zvec_grep_rg` when it is listed by the current host; otherwise native Grep or `rg`.
- Creating, rebuilding, or dropping a persistent index requires an explicit user request or authorization; never do so silently.

<!-- ZVEC_GREP_END -->
