# グローバル設定

## 言語

- 日本語で応答する

## ユーザー環境

- Terminal / workspace: Muxy
- Multiplexer: Herdr（Muxy 内で利用）
- Shell: fish（login shell は zsh）
- 同じ Muxy workspace 内の、別の Herdr セッションで動くエージェントともやり取りできる。必要に応じて `muxy-cli`・`herdr` スキルを参照し、対象のセッション・pane・エージェントを特定して、状態確認やメッセージ送受信を行う。
- Herdr のセッションごとに接続先・ID のスコープは異なる。現在のセッションと他セッションを混同しない。やり取りが可能であることを、他の作業への介入・変更・停止の包括的な許可とは扱わない。
- Editor: Neovim
- Coding agent: 普段は pi coding agent を利用している（ただしまだ改善途中であり、不安定な挙動や機能不足がある可能性に留意すること）
- 他の端末（Mac mini・MacBook Air・iPhone）とは NordVPN Meshnet でつながっている。SSH などで入る前に `~/Code/ai-secretary/reference/meshnet-devices.md`（IP・SSH ユーザー）を読み、`~/Code/ai-secretary/scripts/meshnet-check.sh` で届くか確かめる

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
- ブラウザ操作はメインエージェントが直接行う。ブラウザ操作であることだけを理由にサブエージェントへ委任しない。ユーザーが明示的に委任を指定した場合だけ、対象と操作範囲を限定して委任する。
- ログイン・MFA・CAPTCHAは本人操作を依頼する。本人操作待ちは同じ実行主体・ブラウザ接続・所有タブを維持し、終了・再起動・resumeで接続が引き継がれるとは扱わない。継続不能なら状態と再接続の必要性を報告する。
- 操作するのは自分で開いたタブだけにし、終わったら閉じる。利用者が開いている既存のタブは操作しない
- Claude in Chrome には、同じ claude.ai アカウントでつながった別の機械の Chrome も見える。`list_connected_browsers` は機械名を返さず、`isLocal` でも見分けられない（2026-10-23 確認）。利用者が使う機械を指定していなければ、操作の前にこの機械の Chrome を選ぶ
  1. 自分で起動した `127.0.0.1` のサーバーに、毎回変える合言葉を書いたページを置き、使用中のブラウザで開く。読めたら、そのブラウザがこの機械のもの
  2. 読めなければ `select_browser` で次のブラウザに切り替えて試す。どれでも読めなければ、操作せずに報告する
  3. 確かめるために開いたタブとサーバーは、終わったら閉じる・止める

## デスクトップ操作

- ブラウザ以外のmacOS画面取得・UI操作には、利用可能なComputer Use tools または `peekaboo` CLIを利用できる。使用前に権限と対象・作業範囲を確認し、まず画面状態を読み、操作後も最新状態を取得してから次へ進む。どちらも利用できない場合は別のOS操作経路で迂回せず報告する。経路切替で操作・承認の制約を回避しない。

## CLAUDE.md 運用

- CLAUDE.md に内容を追加する際、`rules/` への分割を常に検討すること
- 特定ファイルにしか関係しない知識は `rules/` に分離し `paths` で絞る
- CLAUDE.md は ~500行以内を目安に保つ
- `rules/agent-discipline.md` と全 rules は、pi の `~/.pi/agent/AGENTS.md` と同じ規律を書いたもの。片方を直したら、もう片方も同じ意味に直す（dotfiles の `dot_claude/` と `dot_pi/private_agent/AGENTS.md`）

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
