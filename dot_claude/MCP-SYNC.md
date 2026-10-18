# Claude Code / Codex の MCP 設定同期

記録日: 2026-09-12

## 方式

Claude Code のグローバル設定 `~/.claude.json` の `mcpServers` を正として、Codex の `~/.codex/config.toml` に一方向・手動で同期する。自動同期や双方向同期ではない。

同期スクリプト: `~/.codex/bin/sync-claude-mcp.py`

```sh
# 検証のみ（書き込みなし）
python3 ~/.codex/bin/sync-claude-mcp.py

# 設定を反映
python3 ~/.codex/bin/sync-claude-mcp.py --apply
```

Claude 側で MCP を追加・変更・削除した後に実行する。元ファイルは `~/.claude/settings.json` や `~/.claude/.mcp.json` ではなく、ホーム直下の `~/.claude.json`。

## 更新範囲とバックアップ

- Codex の `# BEGIN MCP SYNC FROM CLAUDE` ～ `# END MCP SYNC FROM CLAUDE` のブロックを生成・置換する。
- 管理ブロック内の直接編集は次回同期で上書きされる。共通の接続設定は Claude 側で変更する。
- その他の Codex 設定は維持する。管理ブロック外の同名サーバーとは競合として停止する。
- 変更時は `~/.codex/config.toml.before-mcp-sync-<日時>` に変更前の設定を保存する。変更がなければ書き込まない。
- 対応する接続形式は stdio と HTTP。未対応の形式・フィールドがある場合は反映前に停止する。
- API キーなどの環境変数もローカルの Codex 設定に複製する。設定やバックアップを Git に登録したり、キーをログ・回答に出力したりしない。

## 反映と認証

- 同期後は Codex を再起動し、新しいセッションで MCP 接続を確認する。起動済みの会話にツールが即時追加されるとは限らない。
- 設定の認識は `codex mcp list` で確認できる。登録の確認と、実際の接続・ツール実行の成功は別。
- OAuth の認証状態はこのスクリプトではコピーしない。Notion で認証が必要な場合は `codex mcp login notion` を実行する。
- Blender / Roblox Studio などは接続先アプリの起動状態にも依存する。

## 初回反映時の状態

2026-09-12 に `blender`、`gmail`、`Roblox_Studio`、`notion`、`exa`、`youtube` の6件を反映。Codex CLI で6件とも enabled として読み込まれることと、再同期で差分が出ないことを確認済み。実接続・ツール実行は未確認。

## メモの配置

同じ内容を `~/.claude/MCP-SYNC.md` と `~/.codex/MCP-SYNC.md` に保存している。このメモを更新する場合は両方を更新する。

## タイムアウトの同期

`~/.claude/settings.json` の `env.MCP_TIMEOUT` と `env.MCP_TOOL_TIMEOUT` も読み、ミリ秒から秒に変換して Codex の `startup_timeout_sec` / `tool_timeout_sec` に反映する。2026-09-12 時点は両方600秒。

## Codex専用のSlack直接接続

2026-09-12、ユーザーの依頼で `slack_local` をCodex専用サーバーとして追加した。
`~/.codex/config.toml` の `BEGIN CODEX LOCAL SLACK MCP` ～ `END CODEX LOCAL SLACK MCP` が対象で、Claude同期管理ブロックの外に置く。

- Slack公式MCP `https://mcp.slack.com/mcp` へ直接接続し、このPCでSlack用OAuth認証を管理する。
- Claudeの公式SlackプラグインのクライアントIDや認証情報は流用しない。
- ChatGPT側のSlackアプリ接続とは独立している。
- 同期スクリプトは管理ブロック外の `slack_local` を維持する。同名サーバーをClaude側に追加すると競合検出されるため、その場合は設定の所有元を整理する。
- 準備ファイル・現在の接続状態・復旧手順は `~/.codex/slack-local-mcp/README.md` を参照する。
- Slack認証情報は他のPCへコピー・同期しない。リポジトリには保存しない。

## Honeycomb MCP（2026-09-22）

- Claude 側は公式プラグイン `honeycomb`（claude-plugins-official）が `plugin:honeycomb:honeycomb` として `https://mcp.honeycomb.io/mcp` を提供する。`~/.claude.json` の `mcpServers` には入れない（重複接続になるため、ユーザースコープの手動追加は削除済み）。
- そのため同期スクリプトの対象外。Codex 側は `~/.codex/config.toml` の `BEGIN CODEX LOCAL HONEYCOMB MCP` ～ `END CODEX LOCAL HONEYCOMB MCP` に手動で置く（`codex mcp add honeycomb --url https://mcp.honeycomb.io/mcp`）。
- 認証は OAuth。Claude は対話セッションで `/mcp` から行う。Codex は 2026-09-22 の `codex mcp add` 実行時にブラウザ経由で認証済み（再認証は `codex mcp login honeycomb`）。認証状態は共有されない。
- 注意: `codex mcp add` は `config.toml` 全体を TOML シリアライザで書き直し、コメント（同期ブロックの BEGIN/END マーカー等）や既定値の行を消す。今後 Codex に MCP を足すときは `codex mcp add` を使わず、config.toml を直接編集する。2026-09-22 はバックアップ `config.toml.before-honeycomb-mcp-20260922` から復元した。
- `zvec_grep` は `zg install` が Claude 側 `~/.claude.json` と Codex 側（管理ブロック外の `ZVEC_GREP_START` ～ `ZVEC_GREP_END`）の両方へ自分で書く。同期スクリプトは `TOOL_OWNED` で対象外にし、実行時に「Skipped (managed by zg install)」と表示する（2026-10-18。それまでは競合で停止していた）。
- `Roblox_Studio` は 2026-10-18 に Claude のグローバル設定から外し、Roblox 系リポジトリの `.mcp.json` に移した（全プロジェクトで接続されて Studio と競合したため）。同じ日の同期で Codex の管理ブロックからも消える。Codex で Studio を使うときは、そのリポジトリでプロジェクト単位に設定する。
