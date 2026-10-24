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

- 質問・確認には、利用可能な Codex のユーザー入力ツールを優先する。使えない場合は簡潔に直接質問する。
- 要件が曖昧で結果を左右する場合は、リポジトリや既存情報を調べた上で必要な点を確認する。既に受けた許可を再確認しない。

## プランニング

- 実装計画を立てる際（計画モード使用時）、まず Exa (利用可能な Exa の検索ツール) でベストプラクティスや公式ドキュメントを調査すること
- 有用な情報源が見つかった場合は 利用可能な Exa のページ取得ツール で内容を確認し、計画に反映する
- 調査対象: フレームワークの推奨パターン、ライブラリの公式ガイド、既知の落とし穴など
- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

## Web 検索

- Web 検索には 利用可能な Exa の検索ツール を優先的に使用する（Exa が利用できなければ組み込み検索を使用し、その旨を伝える）
- ページ内容の取得には 利用可能な Exa のページ取得ツール を使用する
- コード検索には 利用可能な Exa のコード検索ツール を使用する

## ブラウザ操作

- ブラウザで実行可能なタスクは、CLI や API ではなく **ブラウザ自動操作ツール（利用可能な Codex のブラウザ操作ツール）を優先的に使用する**
- 例: Web ページの確認・操作、フォーム入力、UI の動作確認など
- ブラウザ操作はメインエージェントが直接行う。ブラウザ操作であることだけを理由にサブエージェントへ委任しない。ユーザーが明示的に委任を指定した場合だけ、対象と操作範囲を限定して委任する。
- ログイン・MFA・CAPTCHAは本人操作を依頼する。本人操作待ちは同じ実行主体・ブラウザ接続・所有タブを維持し、終了・再起動・resumeで接続が引き継がれるとは扱わない。継続不能なら状態と再接続の必要性を報告する。
- 操作するのは自分で開いたタブだけにし、終わったら閉じる。利用者が開いている既存のタブは操作しない。

## AGENTS.md 運用

- AGENTS.md に内容を追加する際、`instructions/` への分割を常に検討すること
- 特定ファイルにしか関係しない知識は `instructions/` に分離し、このファイルに読み込む条件を記す
- AGENTS.md は ~500行以内を目安に保つ


## 運用ルールの読み込み

- Git リポジトリで作業する際は `~/.codex/instructions/git-workflow.md` を読み、起動時にブランチと worktree の状態を確認する。
- Google サービスを操作する際は `~/.codex/instructions/google-services.md` を読む。
- ゲーム企画・仕様・バランスの話題では `~/.codex/instructions/game-design-knowledge.md` を読む。
- サブエージェントへ委任し、`HERDR_ENV=1` の場合は `~/.codex/instructions/herdr-subagents.md` を読み、子ごとに Herdr タブで Codex を起動する。
- プロジェクトの AGENTS.md を優先し、CLAUDE.md や .claude/rules にも関連する運用知識があれば確認する。Claude 専用のツール名は利用可能な Codex ツールに読み替える。

## エージェントとメール送信

- カスタムエージェントは `~/.codex/agents/` にあるものを選ぶ。レビュー依頼では目的に合う review-* を選ぶ。ゲーム設計の確認は game-design-reviewer に委任する。
- `browser-verifier` はユーザーがブラウザ作業の委任を明示した場合だけ使う。ブラウザツールがなければ制約を伝え、委任で解決できるとは仮定しない。
- メール送信・転送・自動返信設定は明示的なユーザー許可が必要。宛先・内容・範囲について既に許可がある場合はその範囲で進める。
- gog は --account を付けた場合や mail/email 別名でも同じ送信ルールに従う。送信のために許可ルールを迂回しない。

## 言語ツール

- TypeScript はプロジェクトの tsc、Python は pyright、Lua は lua-language-server など既存の診断手段を使う。Claude の LSP プラグインを Codex に移植済みとは扱わない。

## MCP 設定の共有

- Claude Code / Codex 間の MCP 設定を追加・変更・同期する際は、先に `/Users/papillon/.codex/MCP-SYNC.md` を読むこと。
- Claude 側の `~/.claude.json` を元に `python3 ~/.codex/bin/sync-claude-mcp.py --apply` で Codex へ手動同期する。自動同期・双方向同期ではない。

## Claude Code との設定対応

設定の対応関係・更新手順・未対応項目は `~/.codex/CLAUDE-PARITY.md` を参照する。

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

## コミット帰属

- コミットメッセージ・PR 本文に `Co-Authored-By` や AI 生成表記を付けない（詳細は `~/.codex/instructions/git-workflow.md`）。
