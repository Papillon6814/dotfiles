# Claude Code / Codex 設定対応メモ

記録日: 2026-09-12。Claude Code のグローバル設定を元に Codex 用へ変換した。MCP 以外は今回のスナップショットであり、自動同期ではない。

## 反映したもの

- `~/.codex/AGENTS.md`: 日本語、ユーザー環境、コミュニケーション、計画、Exa 優先、ブラウザ直接操作（2026-10-24改訂。本人操作待ちは接続維持）、運用ルールの参照。
- `~/.codex/instructions/`: git-workflow / google-services / game-design-knowledge。AGENTS.md から該当タスク時に読む。Codex の rules ディレクトリはコマンド実行ポリシー用なので、文章ルールは別の場所に置いた。
- `~/.codex/agents/`: game-design-reviewer と review-* 6件を TOML へ変換。game-design-reviewer はユーザー指定により `gpt-5.6-sol` を使用する（Claude 側は haiku）。review-* 6件にはモデルの個別指定がなく、サブエージェントの既定モデル `gpt-5.6-terra` を使用する。全7件の推論強度は親セッションを継承する。
- `~/.codex/skills/`: grill-me、research、japanese-english を追加。research は作成したレポートファイルを plannotator annotate で開く。
- `~/.codex/rules/claude-parity.rules`: 削除・強制 push・hard reset 等の禁止と、gog メール送信系の確認ルール。Codex execpolicy はサンドボックス外実行のポリシーであり、全ツールへの完全な送信防止機構ではない。--account 等で引数順が違う場合や MCP 経由も、AGENTS.md の明示許可ルールに従う。
- `~/.codex/hooks/notify.py`: 許可要求・サブエージェント完了・ターン完了を macOS 通知。既存の Plannotator Stop hook は保持。
- `~/.codex/config.toml`: reasoning effort は Claude と同じ xhigh、サブエージェント有効化。`agents.default_subagent_model = "gpt-5.6-terra"` を設定。親のモデルは Codex の選択を維持。

## 製品差・未移植の設定

- Claude の PreToolUse の permissionDecision: ask は Codex で未対応のため、そのままコピーしていない。上記の確認ルールと指示で対応。
- 新規・変更したフックは Codex の /hooks でレビュー・信頼するまで実行されない。信頼ハッシュを手書きで追加しない。
- TypeScript / Pyright / Lua の Claude LSP プラグインと同じ Codex プラグインはカタログで見つからなかった。既存の tsc / pyright / lua-language-server による診断を使用する。
- Claude in Chrome 専用ツール、Claude のモデル名・1M コンテキスト設定、statusLine スクリプト、theme/fullscreen、cleanupPeriodDays、agentPushNotifEnabled、警告非表示設定は同じ形式では移植しない。
- Claude の広い Bash allow / Edit 許可を Codex の無制限アクセスに変換しない。Codex の既存サンドボックスと承認設定を維持する。
- スキル作成機能は Codex 組み込み skill-creator を使う。Claude 固有の評価用スクリプト群は移植しない。
- プラグインの OAuth は別認証。プラグイン導入とアカウント接続は区別する。

## 更新手順

MCP の更新は `~/.codex/MCP-SYNC.md` の通り。その他のルール・エージェント・スキルは Claude 側の元ファイルと Codex 側を比較して変換内容を更新する。単純なディレクトリ全体のコピーはしない。

バックアップは `~/.codex/backups/claude-parity-<日時>/`。manifest.json に対象と変更前の有無を記録する。復元時はバックアップの既存ファイルを戻し、新規ファイルは一覧を確認してから取り除く。config.toml を戻す際は移行後の変更を失わないよう差分を確認する。

公式資料: https://learn.chatgpt.com/docs/agent-configuration/subagents / https://learn.chatgpt.com/docs/hooks / https://learn.chatgpt.com/docs/agent-configuration/rules

## 最終確認

- 公式 Codex プラグイン Slack 0.1.8、Notion 0.1.8、Vercel 0.21.4 を追加済み。各サービスのアカウント接続・実操作は未確認。必要な認証は Codex のプラグイン画面から行う。
- 3件のスキルは公式 quick_validate.py で検証済み。
- 7件のエージェントは TOML の必須項目と構文を検証済み。新規セッションでのエージェント実行は未確認。
- メール送信 / draft 送信の prompt、git reset --hard の forbidden、git status の非該当を Codex execpolicy で検証済み。
- Codex Doctor 0.154.0 は通信許可下で 19 ok / 1 idle / 0 warn / 0 fail。設定・6件の MCP 登録・プロバイダー到達性は正常。これは各 MCP の実ツール実行や各プラグインの認証完了を保証しない。
- 再起動後、CLI の `/hooks` で新しい通知フックをレビューして信頼する。既存の Plannotator hook は保持している。フック実行や OS 通知の表示は未確認。
- Claude の MCP_TIMEOUT / MCP_TOOL_TIMEOUT（各600000ms）は同期スクリプトで Codex の startup_timeout_sec / tool_timeout_sec（各600秒）へ変換する。

MCP 以外の移行前ファイル: `~/.codex/backups/claude-parity-20260912-191257-820922/`。プラグイン追加はこのバックアップに含まれないため、戻す場合は Codex のプラグイン管理から個別に削除する。
