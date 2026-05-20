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
- 基本は **非同期 (`subagent`)** を使用する
- 同期 (`subagent_sync`) を使うのは以下のケースのみ:
  - chain 実行（前のサブエージェントの結果を次に渡す必要がある時）
  - 結果を待たないと次のステップに進めない時（調査結果に基づいて判断する等）
- 「裏で勝手にやっておいて」系のタスクは必ず非同期

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
