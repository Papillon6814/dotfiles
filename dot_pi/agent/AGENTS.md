# pi Global Agent Rules

## 言語
- 日本語で応答する（メインの開発言語は日本語）

## コンテキスト管理

### `/handoff` を優先、`/compact` は回避
- 長いセッションでコンテキストが肥大化したら、`/compact` ではなく **`/handoff <goal>`** を使う
- 理由: compaction は lossy な要約で WHY が消え、再帰的に劣化する。handoff は goal-driven な extraction で specifics を保持
- 自動 compaction が走る前に、ユーザーに handoff を提案すること（目安: context 70%+）
- `.pi/handoff/HANDOFF.md` に履歴が append されるので、過去の handoff を参照可能

### handoff を使うべきタイミング
- 失敗した試行が溜まってコンテキストがノイズだらけになった時
- 明確なサブタスクが次に実行できる状態になった時
- プランニング完了後、実装に移る時（Armin Ronacher 推奨パターン）
- セッションが40ターン超えた時

## Web 検索・情報収集
- Web 検索は `web_search` (Exa 経由) を優先
- URL 取得は `fetch_content` を使用
- コード例は `code_search`
- 実装計画時はまず関連技術のベストプラクティス・公式ドキュメントを調査すること

## 探索プロトコル（事前調査の最低ライン）

pi のデフォルト system prompt は意図的に薄い（Claude Code の ~14k tokens に対し ~500 tokens）。
そのぶんモデル任せになりがちな探索行動を、ここで明示的に底上げする。

### 多ファイル調査のデフォルト
- 3 ファイル以上 read しそうな調査タスクは、**まず `scout` subagent を非同期 dispatch**（`~/.pi/agent/agents/scout.md` 参照）。main context は要約だけ受け取る
- 単発の編集タスクで対象ファイルが既に明示されているなら scout は不要
- 並列 fan-out のスイートスポットは 3。4-5 は各 subagent が完全に独立した subsystem を担当するときのみ

### 探索ツールの優先順位
1. **graphify**（`graphify-out/graph.json` が cwd か ancestor に存在するとき）— `graphify` skill 経由で query
2. **grep + find + ls の並列**（同一アシスタントメッセージで複数呼び出し）
3. **read**（grep/find で位置を確定してから）

「とりあえず read 連打」は禁止。grep の前に read してはいけない（対象が分かっているケースを除く）。

### 探索を「やりすぎない」基準
- 単一ファイル、明示パス、明確な編集要求 → そのまま read → edit
- ユーザーが既にファイルパスを引用済み → 再 grep しない
- 一般的なプログラミング知識の質問 → ツール不要

## 回答前調査規律
- **事実に関する質問**（pi の挙動、設定ファイルの内容、ライブラリの仕様、過去の決定など）には、推測・記憶ベースで答えない
- 回答前に必ず**一次ソースを最低1つ Read** してから事実主張する。該当する一次ソースの例:
  - pi 自身: `/opt/homebrew/lib/node_modules/@earendil-works/pi-coding-agent/` 配下
  - プロジェクト規約: `CLAUDE.md` / `AGENTS.md` / `.claude/rules/*.md` / `docs/*.md`
  - ライブラリ: 公式ドキュメント or `node_modules/` の `.d.ts` / README
  - 過去の決定: `.pi/handoff/HANDOFF.md` / memory
- 一次ソースが見つからない場合は「**確認できなかった**」と明示してから推測を述べる（推測と事実を混ぜない）
- 「〜と書いてあると思う」「〜のはず」と書きそうになったら、書く前に Grep/Read で実物を確認する
- **複数の独立した観点**が絡む質問は、観点ごとに**並列で**ツールを呼んで網羅する（「ツール並列化」セクション参照）
- 例外: 一般的な技術知識（言語仕様、アルゴリズム、よく知られた API）は調査不要。判断軸は「**プロジェクト・ツール固有の事実か**」

## ブラウザ操作
- 既存の Chrome を操作する場合は `chrome-cdp` skill を使用
- Puppeteer / Playwright / curl での DOM 操作は禁止
- Chrome は `chrome://inspect/#remote-debugging` でトグル ON 必須

## 質問・確認
- ユーザーに質問・確認する際は必ず `ask_user` ツールを使う
- テキスト出力での質問は禁止
- 曖昧な指示には想定される変数がすべて埋まるまで逆質問してから作業開始

## コード編集
- `any` 型禁止（必要不可欠な場合を除く）
- ファイル編集前に必ず Read で現在の内容を確認
- 完了宣言前に verification コマンド（lint、test、type-check）を実行

## 実行規律（破壊的操作）
- 全ての操作を **reversibility（可逆性）× blast radius（影響範囲）** で判定する
- 次の操作は必ず `ask_user` で確認してから実行:
  - 破壊的: ファイル/ブランチ削除、`rm -rf`、uncommitted 変更の上書き、DB の DROP/DELETE
  - 復旧困難: `git push --force`、`git reset --hard`、published commit の amend、依存パッケージ削除、CI/CD 変更
  - 他者影響: `git push`、PR 作成・コメント、Slack/Email 送信、外部サービス投稿
  - 公開リスク: 秘密情報を含みうる内容の第三者 Web ツール（diagram renderer, pastebin, gist）への投稿
- 承認は**該当スコープ限定**。一度 `git push` を OK されても、別のブランチ・別のコミットでは再確認
- 障害の**近道として破壊的操作を使わない**（例: pre-commit hook 失敗に `--no-verify` で回避 NG、lock ファイルは消さず持ち主を調査）
- 未知のファイル・ブランチ・設定を発見したら削除前に調査する（ユーザーの in-progress かもしれない）
- 詳細手続きは `superpowers:executing-actions-with-care` に委譲。このスキルが入っているときは必ず呼ぶ

## Plan 規律
- モード切替は `/plan`（pi-plan-mode がツールを読み取り系に制限する）
- plan 文書の**書き方は必ず `superpowers:writing-plans` を呼ぶ**（`/plan` 使用中・外を問わず）

### `/plan` を起動すべき閾値（いずれか満たしたら提案する）
- 3 ファイル以上を変更する見込み
- 新しい subsystem の追加（新ディレクトリ作成を伴うレベル）
- 既存挙動の意味が変わる変更（migration / breaking change）
- ユーザーが「設計して」「方針を立てて」「どう実装する？」と尋ねた
- 実装前にトレードオフが複数あって、決め打ちすると後戻りが大きい

満たさなくても提案してよい。だが満たしたら**必ず提案する**（勝手に実装に入らない）。
- 追加のハードルール（superpowers の規律に加えて）:
  - **40行以内**。超過したら prose を削る。ファイルパス・file:line 参照は削らない
  - Context / Background / Overview セクションは書かない
  - ユーザーのリクエストを再掲しない
  - 1ファイル1箇条: 修正ファイルのパス + 変更点を簡潔に
  - 再利用する既存関数は `file:line` で参照
  - 末尾に**検証コマンド1個**で終わる（`npm test` など実行可能な1行）

## 完了検証
- 「完了」「fixed」「passing」「ship できる」と宣言する前に `superpowers:verification-before-completion` を呼ぶ
- verification の**実際の出力**（test/type-check/lint の結果）を提示してから宣言する
- 出力を添付せずに「テスト通りました」は NG。evidence before assertions が原則
- UI/frontend の変更はブラウザで実機確認。確認できない場合はその旨を明示（「UI 確認は実施していません」）

## handoff 運用の拡張
既存の `/handoff` ルールに加えて:
- handoff 生成時に以下の2セクションを**必ず含める**:
  - **Validated approaches（承認されたアプローチ）**: ユーザーが明示的に承認した判断・パターンを1-3項目
  - **Corrections（避けるべきアプローチ）**: 訂正された方針・外した判断を1-3項目
- 理由: corrections だけ記録すると「過去の失敗は避けるが、承認済みアプローチからも drift して過度に慎重になる」ため両側を残す
- 成功理由は常に明示（なぜその判断が良かったか）

## Staleness（陳腐化）検証
- 過去の handoff / AGENTS.md / skill の記述は**時点のスナップショット**として扱う
- 参照して行動する前に、必ず現状と照合:
  - ファイルパスは存在するか（Read または Glob で確認）
  - 関数/シンボル名はまだ存在するか（Grep または Serena）
  - 設定値・環境変数は今も有効か
- 矛盾を見つけたら**観測された現実を優先**し、古い記述に従わない
- 明らかに陳腐化した handoff 項目は次の handoff で削除 or 更新して、feedback として残す

## ツール並列化
- **依存関係のない**複数ツール呼び出しは**必ず同一メッセージ内で並列**に実行する
  - 例: 複数ファイルの Read、独立した Glob + Grep、独立した Bash コマンドなど
- 依存関係（前のツールの結果を次に使う）がある場合のみ逐次
- 並列化によるレイテンシ削減は効果が大きい。「念のため逐次」にしない

## サブエージェント使い分け

### sync vs async
- 基本は **非同期 (`subagent`)** を使用する
- 同期 (`subagent_sync`) を使うのは以下のケースのみ:
  - chain 実行（前のサブエージェントの結果を次に渡す必要がある時）
  - 結果を待たないと次のステップに進めない時（調査結果に基づいて判断する等）
- 「裏で勝手にやっておいて」系のタスクは必ず非同期

### どのエージェントを呼ぶか（`~/.pi/agent/agents/` 配下）
- **`scout`**: 多ファイル調査の **最初の一手**。read-only、出力は構造化サマリ。main context を汚さずに広域 recon を済ませる
- **`planner`**: 実装方針が複数ありうるときの設計検討。read-only
- **`worker`**: 明確に範囲が切られた実装サブタスク
- **`reviewer`**: 自分の差分を別視点で点検

### scout 起動のトリガ条件（厳格に守る）
- ファイルを 3 個以上 read しそう → scout
- 「このサブシステムどうなってる」系の質問 → scout
- ユーザーが「調査して」「探して」「どこにある」と言った → scout
- いずれも main context の自分で read 連打を始める前に判断する

### scout を呼ばなくていいケース
- ファイルパスが既に明示されていて、編集対象が確定している
- 1ファイル完結の bug fix

## Git Worktree 必須
- feature 作業（新機能・バグ修正・リファクタリング等）は**必ず git worktree を作成**してから開始する
- worktree 作成には `superpowers:using-git-worktrees` スキルを使用する
- メインの worktree（デフォルトの作業ディレクトリ）で直接コード変更を行わない
- 理由: メインの作業ディレクトリを常にクリーンに保ち、並行作業やコンテキスト切替を安全にするため
- 例外: ドキュメントのみの修正（CLAUDE.md, AGENTS.md, rules/ 等）、設定ファイルの軽微な変更は worktree 不要

## 関連 skill の呼び分け
- バグ・テスト失敗・予期しない挙動 → `superpowers:systematic-debugging`
- 新機能・仕様変更の前 → `superpowers:brainstorming`
- 実装前のテスト作成 → `superpowers:test-driven-development`
- worktree 作成 → `superpowers:using-git-worktrees`
- コードレビュー依頼 → `superpowers:requesting-code-review`
- 独立した2つ以上の調査タスク → `superpowers:dispatching-parallel-agents`
